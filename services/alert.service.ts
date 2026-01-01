import { prisma } from '@/lib/prisma';
import { Alert, AlertCounts, AlertFilters, AlertType, AlertSeverity } from '@/types/alert.types';
import { Decimal } from '@prisma/client/runtime/library';

export class AlertService {
  async generateAlerts(filters?: AlertFilters): Promise<Alert[]> {
    const alerts: Alert[] = [];

    // Get low stock alerts
    const lowStockAlerts = await this.getLowStockAlerts(filters?.branchId, filters?.warehouseId);
    alerts.push(...lowStockAlerts);

    // Get expiring soon alerts (30 days)
    const expiringSoonAlerts = await this.getExpiringSoonAlerts(filters?.branchId, filters?.warehouseId);
    alerts.push(...expiringSoonAlerts);

    // Get expired alerts
    const expiredAlerts = await this.getExpiredAlerts(filters?.branchId, filters?.warehouseId);
    alerts.push(...expiredAlerts);

    // Apply filters
    let filteredAlerts = alerts;
    
    if (filters?.type) {
      filteredAlerts = filteredAlerts.filter(a => a.type === filters.type);
    }
    
    if (filters?.severity) {
      filteredAlerts = filteredAlerts.filter(a => a.severity === filters.severity);
    }

    return filteredAlerts;
  }

  async getLowStockAlerts(branchId?: string, warehouseId?: string): Promise<Alert[]> {
    const alerts: Alert[] = [];

    // Get all active products
    const products = await prisma.product.findMany({
      where: { status: 'active' },
      include: {
        inventoryBatches: {
          where: {
            status: 'active',
            warehouse: {
              ...(branchId ? { branchId } : {}),
              ...(warehouseId ? { id: warehouseId } : {}),
            },
          },
          include: {
            warehouse: true,
          },
        },
      },
    });

    // Group batches by warehouse and check stock levels
    for (const product of products) {
      const warehouseStockMap = new Map<string, { stock: Decimal; warehouse: any }>();

      for (const batch of product.inventoryBatches) {
        const existing = warehouseStockMap.get(batch.warehouseId);
        if (existing) {
          existing.stock = existing.stock.plus(batch.quantity);
        } else {
          warehouseStockMap.set(batch.warehouseId, {
            stock: new Decimal(batch.quantity),
            warehouse: batch.warehouse,
          });
        }
      }

      // Check each warehouse
      for (const [warehouseId, data] of warehouseStockMap) {
        const currentStock = Number(data.stock);
        if (currentStock < product.minStockLevel) {
          const shortageAmount = product.minStockLevel - currentStock;
          
          alerts.push({
            id: `low-stock-${product.id}-${warehouseId}`,
            type: 'low_stock',
            severity: currentStock === 0 ? 'critical' : 'warning',
            productId: product.id,
            productName: product.name,
            warehouseId: warehouseId,
            warehouseName: data.warehouse.name,
            branchId: data.warehouse.branchId,
            details: `Stock level is ${currentStock} ${product.baseUOM}, below minimum of ${product.minStockLevel} ${product.baseUOM}`,
            currentStock,
            minStockLevel: product.minStockLevel,
            shortageAmount,
          });
        }
      }
    }

    return alerts;
  }

  async getExpiringSoonAlerts(branchId?: string, warehouseId?: string): Promise<Alert[]> {
    const today = new Date();
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(today.getDate() + 30);

    const batches = await prisma.inventoryBatch.findMany({
      where: {
        status: 'active',
        quantity: { gt: 0 },
        expiryDate: {
          gte: today,
          lte: thirtyDaysFromNow,
        },
        warehouse: {
          ...(branchId ? { branchId } : {}),
          ...(warehouseId ? { id: warehouseId } : {}),
        },
      },
      include: {
        product: true,
        warehouse: true,
      },
    });

    return batches.map((batch) => {
      const daysUntilExpiry = Math.floor(
        (batch.expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
      );

      return {
        id: `expiring-${batch.id}`,
        type: 'expiring_soon' as AlertType,
        severity: daysUntilExpiry <= 7 ? 'critical' : 'warning' as AlertSeverity,
        productId: batch.productId,
        productName: batch.product.name,
        warehouseId: batch.warehouseId,
        warehouseName: batch.warehouse.name,
        branchId: batch.warehouse.branchId,
        batchId: batch.id,
        batchNumber: batch.batchNumber,
        expiryDate: batch.expiryDate,
        daysUntilExpiry,
        details: `Batch ${batch.batchNumber} expires in ${daysUntilExpiry} day${daysUntilExpiry !== 1 ? 's' : ''}`,
      };
    });
  }

  async getExpiredAlerts(branchId?: string, warehouseId?: string): Promise<Alert[]> {
    const today = new Date();

    const batches = await prisma.inventoryBatch.findMany({
      where: {
        status: 'active',
        quantity: { gt: 0 },
        expiryDate: { lt: today },
        warehouse: {
          ...(branchId ? { branchId } : {}),
          ...(warehouseId ? { id: warehouseId } : {}),
        },
      },
      include: {
        product: true,
        warehouse: true,
      },
    });

    return batches.map((batch) => {
      const daysExpired = Math.floor(
        (today.getTime() - batch.expiryDate.getTime()) / (1000 * 60 * 60 * 24)
      );

      return {
        id: `expired-${batch.id}`,
        type: 'expired' as AlertType,
        severity: 'critical' as AlertSeverity,
        productId: batch.productId,
        productName: batch.product.name,
        warehouseId: batch.warehouseId,
        warehouseName: batch.warehouse.name,
        branchId: batch.warehouse.branchId,
        batchId: batch.id,
        batchNumber: batch.batchNumber,
        expiryDate: batch.expiryDate,
        daysUntilExpiry: -daysExpired,
        details: `Batch ${batch.batchNumber} expired ${daysExpired} day${daysExpired !== 1 ? 's' : ''} ago`,
      };
    });
  }

  async getAlertCounts(branchId?: string): Promise<AlertCounts> {
    const alerts = await this.generateAlerts({ branchId });

    const counts = {
      lowStock: alerts.filter(a => a.type === 'low_stock').length,
      expiringSoon: alerts.filter(a => a.type === 'expiring_soon').length,
      expired: alerts.filter(a => a.type === 'expired').length,
      total: alerts.length,
    };

    return counts;
  }
}

export const alertService = new AlertService();

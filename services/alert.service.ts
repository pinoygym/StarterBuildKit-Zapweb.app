import { prisma, Prisma } from '@/lib/prisma';
import { Alert, AlertCounts, AlertFilters, AlertType, AlertSeverity } from '@/types/alert.types';

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

    // Get all active products with their inventory
    const products = await prisma.product.findMany({
      where: { status: 'active' },
      include: {
        Inventory: {
          where: {
            Warehouse: {
              ...(branchId ? { branchId } : {}),
              ...(warehouseId ? { id: warehouseId } : {}),
            },
          },
          include: {
            Warehouse: true,
          },
        },
      },
    });

    // Group inventory by warehouse and check stock levels
    for (const product of products) {
      const warehouseStockMap = new Map<string, { stock: number; warehouse: any }>();

      for (const item of product.Inventory) {
        const existing = warehouseStockMap.get(item.warehouseId);
        if (existing) {
          existing.stock += item.quantity;
        } else {
          warehouseStockMap.set(item.warehouseId, { stock: item.quantity, warehouse: item.Warehouse });
        }
      }

      // Check each warehouse
      for (const [warehouseId, data] of warehouseStockMap) {
        const currentStock = data.stock;
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
    // Inventory expiry tracking is temporarily disabled in current schema
    return [];
  }

  async getExpiredAlerts(branchId?: string, warehouseId?: string): Promise<Alert[]> {
    // Inventory expiry tracking is temporarily disabled in current schema
    return [];
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

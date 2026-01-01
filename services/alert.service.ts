import { prisma } from '@/lib/prisma';
import { CreateAlertInput, AlertFilters, AlertType } from '@/types/alert.types';
import { randomUUID } from 'crypto';

export class AlertService {
  /**
   * Create a new alert
   */
  async createAlert(data: CreateAlertInput) {
    return await prisma.notification.create({
      data: {
        id: randomUUID(),
        type: data.type,
        title: data.title,
        message: data.message,
        link: data.link,
        userId: data.userId || null,
        isRead: false,
        createdAt: new Date(),
      },
    });
  }

  /**
   * Get alerts for a user (or global)
   */
  async getAlerts(userId: string, filters?: AlertFilters) {
    const where: any = {
      // Logic: show alerts assigned to user OR global alerts (userId is null)
      // BUT for simplicity, we might just filter by userId if provided.
      // Let's assume userId is required for fetching *their* alerts.
      OR: [
        { userId: userId },
        { userId: null }
      ]
    };

    if (filters?.isRead !== undefined) {
      where.isRead = filters.isRead;
    }

    if (filters?.type) {
      where.type = filters.type;
    }

    return await prisma.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: filters?.limit || 50,
    });
  }

  /**
   * Mark alert as read
   */
  async markAsRead(id: string) {
    return await prisma.notification.update({
      where: { id },
      data: { isRead: true },
    });
  }

  /**
   * Mark all alerts as read for a user
   */
  async markAllAsRead(userId: string) {
    return await prisma.notification.updateMany({
      where: { userId },
      data: { isRead: true },
    });
  }

  /**
   * Check for low stock items and generate alerts.
   * This is idempotent-ish: It tries not to spam. 
   * A real production system might use a separate 'AlertState' table to track if we already alerted for Product X today.
   * distinct: Use a simple check for now.
   */
  async checkLowStock(branchId?: string) {
    // 1. Find products with stock < minStockLevel
    // Note: Inventory is per warehouse. We need to aggregate or check per warehouse.
    // Let's check per inventory record for granular warehouse alerts.

    const lowStockItems = await prisma.inventory.findMany({
      where: {
        AND: [
          {
            Product: {
              status: 'active',
              minStockLevel: { gt: 0 }, // Only check if minStockLevel is set
            },
          },
          {
            Warehouse: branchId ? { branchId } : undefined,
          }
        ]
      },
      include: {
        Product: true,
        Warehouse: true,
      },
    });

    const alertsCreated = [];

    for (const item of lowStockItems) {
      if (item.quantity <= item.Product.minStockLevel) {
        // Double check: if quantity is 0, is it intentional? Yes, alert.

        // Prevent duplicates: Check if an unread alert for this product already exists
        const existingAlert = await prisma.notification.findFirst({
          where: {
            type: 'LOW_STOCK',
            isRead: false,
            message: { contains: item.Product.name } // Simple check, could be more robust with metadata if we added it
          }
        });

        if (existingAlert) continue;

        const alertData: CreateAlertInput = {
          type: 'LOW_STOCK',
          title: 'Low Stock Warning',
          message: `Product ${item.Product.name} is low on stock (${item.quantity} ${item.Product.baseUOM}) in ${item.Warehouse.name}.`,
          link: `/inventory/products/${item.Product.id}`,
          // userId: null // System wide alert
        };

        // Fire and forget (or await if critical)
        await this.createAlert(alertData);
        alertsCreated.push(alertData);
      }
    }

    return alertsCreated;
  }

  /**
   * Check for expiring batches (if tracking expiration)
   * Prisma schema doesn't seem to have explicit 'Batch' model in the visible part, 
   * but Reference logic suggests FIFO/Average. 
   * Use ReceivingVoucher or StockMovements?
   * 
   * Actually, `Product` has `shelfLifeDays`.
   * Without a 'Batch' model with `expiryDate`, we can't do exact expiry tracking.
   * 
   * WAIT: `InventoryAdjustmentItem` logic doesn't show batches.
   * `ReceivingVoucher` has `receivedDate`.
   * 
   * If the system uses FIFO, we can estimate expiry based on `ReceivingVoucher` date + `shelfLifeDays`.
   * This is an estimation.
   */
  async checkExpirations() {
    // This is complex without a dedicated Batch table.
    // Skipping implementation until Batch model is confirmed or requested.
    // For now, return empty.
    return [];
  }
}

export const alertService = new AlertService();

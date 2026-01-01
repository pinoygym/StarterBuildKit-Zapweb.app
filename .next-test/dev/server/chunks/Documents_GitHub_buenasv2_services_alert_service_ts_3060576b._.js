module.exports = [
"[project]/Documents/GitHub/buenasv2/services/alert.service.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

return __turbopack_context__.a(async (__turbopack_handle_async_dependencies__, __turbopack_async_result__) => { try {

__turbopack_context__.s([
    "AlertService",
    ()=>AlertService,
    "alertService",
    ()=>alertService
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$Documents$2f$GitHub$2f$buenasv2$2f$lib$2f$prisma$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/Documents/GitHub/buenasv2/lib/prisma.ts [app-route] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$externals$5d2f$crypto__$5b$external$5d$__$28$crypto$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/crypto [external] (crypto, cjs)");
var __turbopack_async_dependencies__ = __turbopack_handle_async_dependencies__([
    __TURBOPACK__imported__module__$5b$project$5d2f$Documents$2f$GitHub$2f$buenasv2$2f$lib$2f$prisma$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__
]);
[__TURBOPACK__imported__module__$5b$project$5d2f$Documents$2f$GitHub$2f$buenasv2$2f$lib$2f$prisma$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__] = __turbopack_async_dependencies__.then ? (await __turbopack_async_dependencies__)() : __turbopack_async_dependencies__;
;
;
class AlertService {
    /**
   * Create a new alert
   */ async createAlert(data) {
        return await __TURBOPACK__imported__module__$5b$project$5d2f$Documents$2f$GitHub$2f$buenasv2$2f$lib$2f$prisma$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["prisma"].notification.create({
            data: {
                id: (0, __TURBOPACK__imported__module__$5b$externals$5d2f$crypto__$5b$external$5d$__$28$crypto$2c$__cjs$29$__["randomUUID"])(),
                type: data.type,
                title: data.title,
                message: data.message,
                link: data.link,
                userId: data.userId || null,
                isRead: false,
                createdAt: new Date()
            }
        });
    }
    /**
   * Get alerts for a user (or global)
   */ async getAlerts(userId, filters) {
        const where = {
            // Logic: show alerts assigned to user OR global alerts (userId is null)
            // BUT for simplicity, we might just filter by userId if provided.
            // Let's assume userId is required for fetching *their* alerts.
            OR: [
                {
                    userId: userId
                },
                {
                    userId: null
                }
            ]
        };
        if (filters?.isRead !== undefined) {
            where.isRead = filters.isRead;
        }
        if (filters?.type) {
            where.type = filters.type;
        }
        return await __TURBOPACK__imported__module__$5b$project$5d2f$Documents$2f$GitHub$2f$buenasv2$2f$lib$2f$prisma$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["prisma"].notification.findMany({
            where,
            orderBy: {
                createdAt: 'desc'
            },
            take: filters?.limit || 50
        });
    }
    /**
   * Mark alert as read
   */ async markAsRead(id) {
        return await __TURBOPACK__imported__module__$5b$project$5d2f$Documents$2f$GitHub$2f$buenasv2$2f$lib$2f$prisma$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["prisma"].notification.update({
            where: {
                id
            },
            data: {
                isRead: true
            }
        });
    }
    /**
   * Mark all alerts as read for a user
   */ async markAllAsRead(userId) {
        return await __TURBOPACK__imported__module__$5b$project$5d2f$Documents$2f$GitHub$2f$buenasv2$2f$lib$2f$prisma$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["prisma"].notification.updateMany({
            where: {
                userId
            },
            data: {
                isRead: true
            }
        });
    }
    /**
   * Check for low stock items and generate alerts.
   * This is idempotent-ish: It tries not to spam. 
   * A real production system might use a separate 'AlertState' table to track if we already alerted for Product X today.
   * distinct: Use a simple check for now.
   */ async checkLowStock(branchId) {
        // 1. Find products with stock < minStockLevel
        // Note: Inventory is per warehouse. We need to aggregate or check per warehouse.
        // Let's check per inventory record for granular warehouse alerts.
        const lowStockItems = await __TURBOPACK__imported__module__$5b$project$5d2f$Documents$2f$GitHub$2f$buenasv2$2f$lib$2f$prisma$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["prisma"].inventory.findMany({
            where: {
                AND: [
                    {
                        Product: {
                            status: 'active',
                            minStockLevel: {
                                gt: 0
                            }
                        }
                    },
                    {
                        Warehouse: branchId ? {
                            branchId
                        } : undefined
                    }
                ]
            },
            include: {
                Product: true,
                Warehouse: true
            }
        });
        const alertsCreated = [];
        for (const item of lowStockItems){
            if (item.quantity <= item.Product.minStockLevel) {
                // Double check: if quantity is 0, is it intentional? Yes, alert.
                // Prevent duplicates: Check if an unread alert for this product already exists
                const existingAlert = await __TURBOPACK__imported__module__$5b$project$5d2f$Documents$2f$GitHub$2f$buenasv2$2f$lib$2f$prisma$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["prisma"].notification.findFirst({
                    where: {
                        type: 'LOW_STOCK',
                        isRead: false,
                        message: {
                            contains: item.Product.name
                        } // Simple check, could be more robust with metadata if we added it
                    }
                });
                if (existingAlert) continue;
                const alertData = {
                    type: 'LOW_STOCK',
                    title: 'Low Stock Warning',
                    message: `Product ${item.Product.name} is low on stock (${item.quantity} ${item.Product.baseUOM}) in ${item.Warehouse.name}.`,
                    link: `/inventory/products/${item.Product.id}`
                };
                // Fire and forget (or await if critical)
                await this.createAlert(alertData);
                alertsCreated.push(alertData);
            }
        }
        return alertsCreated;
    }
    /**
   * Get active alerts by checking current states (low stock, etc.)
   * This is used by the Alerts page to show real-time status.
   */ async getActiveAlerts(branchId) {
        const lowStockItems = await __TURBOPACK__imported__module__$5b$project$5d2f$Documents$2f$GitHub$2f$buenasv2$2f$lib$2f$prisma$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["prisma"].inventory.findMany({
            where: {
                AND: [
                    {
                        Product: {
                            status: 'active',
                            minStockLevel: {
                                gt: 0
                            }
                        }
                    },
                    {
                        Warehouse: branchId ? {
                            branchId
                        } : undefined
                    }
                ]
            },
            include: {
                Product: true,
                Warehouse: true
            }
        });
        return lowStockItems.filter((item)=>item.quantity <= item.Product.minStockLevel).map((item)=>({
                id: `low-stock-${item.productId}-${item.warehouseId}`,
                type: 'low_stock',
                severity: item.quantity === 0 || item.quantity < item.Product.minStockLevel * 0.5 ? 'critical' : 'warning',
                productName: item.Product.name,
                warehouseName: item.Warehouse.name,
                details: `Stock: ${item.quantity} ${item.Product.baseUOM} / Min: ${item.Product.minStockLevel}`,
                productId: item.productId,
                warehouseId: item.warehouseId,
                createdAt: item.updatedAt.toISOString()
            }));
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
   */ async checkExpirations() {
        // This is complex without a dedicated Batch table.
        // Skipping implementation until Batch model is confirmed or requested.
        // For now, return empty.
        return [];
    }
}
const alertService = new AlertService();
__turbopack_async_result__();
} catch(e) { __turbopack_async_result__(e); } }, false);}),
];

//# sourceMappingURL=Documents_GitHub_buenasv2_services_alert_service_ts_3060576b._.js.map
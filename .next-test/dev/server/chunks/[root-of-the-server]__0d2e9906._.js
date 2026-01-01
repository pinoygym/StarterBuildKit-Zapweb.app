module.exports = [
"[externals]/next/dist/compiled/next-server/app-route-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-route-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-route-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-route-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[externals]/next/dist/compiled/next-server/app-page-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-page-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-unit-async-storage.external.js [external] (next/dist/server/app-render/work-unit-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/work-unit-async-storage.external.js", () => require("next/dist/server/app-render/work-unit-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-async-storage.external.js [external] (next/dist/server/app-render/work-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/work-async-storage.external.js", () => require("next/dist/server/app-render/work-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/shared/lib/no-fallback-error.external.js [external] (next/dist/shared/lib/no-fallback-error.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/shared/lib/no-fallback-error.external.js", () => require("next/dist/shared/lib/no-fallback-error.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/after-task-async-storage.external.js [external] (next/dist/server/app-render/after-task-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/after-task-async-storage.external.js", () => require("next/dist/server/app-render/after-task-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/fs [external] (fs, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("fs", () => require("fs"));

module.exports = mod;
}),
"[externals]/path [external] (path, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("path", () => require("path"));

module.exports = mod;
}),
"[externals]/os [external] (os, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("os", () => require("os"));

module.exports = mod;
}),
"[externals]/crypto [external] (crypto, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("crypto", () => require("crypto"));

module.exports = mod;
}),
"[externals]/@prisma/client [external] (@prisma/client, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("@prisma/client", () => require("@prisma/client"));

module.exports = mod;
}),
"[externals]/pg [external] (pg, esm_import)", ((__turbopack_context__) => {
"use strict";

return __turbopack_context__.a(async (__turbopack_handle_async_dependencies__, __turbopack_async_result__) => { try {

const mod = await __turbopack_context__.y("pg");

__turbopack_context__.n(mod);
__turbopack_async_result__();
} catch(e) { __turbopack_async_result__(e); } }, true);}),
"[project]/Documents/GitHub/buenasv2/lib/logger.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

/**
 * Centralized Logging System
 */ __turbopack_context__.s([
    "LogLevel",
    ()=>LogLevel,
    "logger",
    ()=>logger
]);
var LogLevel = /*#__PURE__*/ function(LogLevel) {
    LogLevel["ERROR"] = "error";
    LogLevel["WARN"] = "warn";
    LogLevel["INFO"] = "info";
    LogLevel["DEBUG"] = "debug";
    return LogLevel;
}({});
class Logger {
    isDevelopment = ("TURBOPACK compile-time value", "development") === 'development';
    formatLog(entry) {
        const { level, message, timestamp, context } = entry;
        let log = `[${timestamp}] [${level.toUpperCase()}] ${message}`;
        if (context) {
            log += `\nContext: ${JSON.stringify(context, null, 2)}`;
        }
        if (entry.error) {
            log += `\nError: ${entry.error.message}\nStack: ${entry.error.stack}`;
        }
        return log;
    }
    log(level, message, context, error) {
        const entry = {
            level,
            message,
            timestamp: new Date().toISOString(),
            context,
            error
        };
        const formattedLog = this.formatLog(entry);
        // Console output based on environment
        if (this.isDevelopment) {
            switch(level){
                case "error":
                    console.error(formattedLog);
                    break;
                case "warn":
                    console.warn(formattedLog);
                    break;
                case "info":
                    console.info(formattedLog);
                    break;
                case "debug":
                    console.debug(formattedLog);
                    break;
            }
        } else {
            // In production, you would send to external logging service
            // e.g., Sentry, DataDog, CloudWatch, etc.
            console.log(JSON.stringify(entry));
        }
    }
    error(message, error, context) {
        this.log("error", message, context, error);
    }
    warn(message, context) {
        this.log("warn", message, context);
    }
    info(message, context) {
        this.log("info", message, context);
    }
    debug(message, context) {
        if (this.isDevelopment) {
            this.log("debug", message, context);
        }
    }
}
const logger = new Logger();
}),
"[project]/Documents/GitHub/buenasv2/lib/prisma.ts [app-route] (ecmascript) <locals>", ((__turbopack_context__) => {
"use strict";

return __turbopack_context__.a(async (__turbopack_handle_async_dependencies__, __turbopack_async_result__) => { try {

__turbopack_context__.s([
    "prisma",
    ()=>prisma
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$Documents$2f$GitHub$2f$buenasv2$2f$node_modules$2f$dotenv$2f$lib$2f$main$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Documents/GitHub/buenasv2/node_modules/dotenv/lib/main.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$externals$5d2f40$prisma$2f$client__$5b$external$5d$__$2840$prisma$2f$client$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/@prisma/client [external] (@prisma/client, cjs)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Documents$2f$GitHub$2f$buenasv2$2f$node_modules$2f40$prisma$2f$adapter$2d$pg$2f$dist$2f$index$2e$mjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Documents/GitHub/buenasv2/node_modules/@prisma/adapter-pg/dist/index.mjs [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$externals$5d2f$pg__$5b$external$5d$__$28$pg$2c$__esm_import$29$__ = __turbopack_context__.i("[externals]/pg [external] (pg, esm_import)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Documents$2f$GitHub$2f$buenasv2$2f$lib$2f$logger$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Documents/GitHub/buenasv2/lib/logger.ts [app-route] (ecmascript)");
var __turbopack_async_dependencies__ = __turbopack_handle_async_dependencies__([
    __TURBOPACK__imported__module__$5b$project$5d2f$Documents$2f$GitHub$2f$buenasv2$2f$node_modules$2f40$prisma$2f$adapter$2d$pg$2f$dist$2f$index$2e$mjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__,
    __TURBOPACK__imported__module__$5b$externals$5d2f$pg__$5b$external$5d$__$28$pg$2c$__esm_import$29$__
]);
[__TURBOPACK__imported__module__$5b$project$5d2f$Documents$2f$GitHub$2f$buenasv2$2f$node_modules$2f40$prisma$2f$adapter$2d$pg$2f$dist$2f$index$2e$mjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__, __TURBOPACK__imported__module__$5b$externals$5d2f$pg__$5b$external$5d$__$28$pg$2c$__esm_import$29$__] = __turbopack_async_dependencies__.then ? (await __turbopack_async_dependencies__)() : __turbopack_async_dependencies__;
;
const envState = `[${new Date().toISOString()}] NODE_ENV: ${("TURBOPACK compile-time value", "development")}, IS_PLAYWRIGHT: ${process.env.IS_PLAYWRIGHT}`;
try {
    const fs = __turbopack_context__.r("[externals]/fs [external] (fs, cjs)");
    fs.appendFileSync('prisma_debug.log', `${envState}\n`);
} catch (e) {}
if (("TURBOPACK compile-time value", "development") === 'test' || process.env.IS_PLAYWRIGHT === 'true') {
    __TURBOPACK__imported__module__$5b$project$5d2f$Documents$2f$GitHub$2f$buenasv2$2f$node_modules$2f$dotenv$2f$lib$2f$main$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["default"].config({
        path: '.env.test',
        override: true
    });
} else {
    __TURBOPACK__imported__module__$5b$project$5d2f$Documents$2f$GitHub$2f$buenasv2$2f$node_modules$2f$dotenv$2f$lib$2f$main$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["default"].config({
        path: '.env.local'
    });
}
const dbUrlLog = `[${new Date().toISOString()}] DB URL HOST: ${process.env.DATABASE_URL?.split('@')[1]?.split('/')[0] || 'unknown'}`;
try {
    const fs = __turbopack_context__.r("[externals]/fs [external] (fs, cjs)");
    fs.appendFileSync('prisma_debug.log', `${dbUrlLog}\n\n`);
} catch (e) {}
;
;
;
;
;
// Prevent multiple instances of Prisma Client in development
const globalForPrisma = globalThis;
const connectionString = process.env.DATABASE_URL?.includes('localhost') ? process.env.DATABASE_URL.replace('localhost', '127.0.0.1') : process.env.DATABASE_URL;
if (!connectionString) {
    __TURBOPACK__imported__module__$5b$project$5d2f$Documents$2f$GitHub$2f$buenasv2$2f$lib$2f$logger$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["logger"].error('DATABASE_URL is not defined in lib/prisma.ts');
} else {
    const host = connectionString.split('@')[1]?.split('/')[0];
    const dbName = connectionString.split('/').pop()?.split('?')[0];
    __TURBOPACK__imported__module__$5b$project$5d2f$Documents$2f$GitHub$2f$buenasv2$2f$lib$2f$logger$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["logger"].info(`Initializing Prisma with Host: ${host}, DB: ${dbName}`);
    console.log(`[DEBUG] Prisma Source: ${("TURBOPACK compile-time falsy", 0) ? "TURBOPACK unreachable" : '.env.local'} | Host: ${host}`);
}
// Create PostgreSQL connection pool
const pool = globalForPrisma.pool ?? new __TURBOPACK__imported__module__$5b$externals$5d2f$pg__$5b$external$5d$__$28$pg$2c$__esm_import$29$__["Pool"]({
    connectionString
});
const adapter = new __TURBOPACK__imported__module__$5b$project$5d2f$Documents$2f$GitHub$2f$buenasv2$2f$node_modules$2f40$prisma$2f$adapter$2d$pg$2f$dist$2f$index$2e$mjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__["PrismaPg"](pool);
// Optimized Prisma Client configuration
const prismaConfig = {
    adapter,
    log: [
        {
            emit: 'event',
            level: 'query'
        },
        {
            emit: 'event',
            level: 'error'
        },
        {
            emit: 'event',
            level: 'warn'
        }
    ]
};
const prisma = globalForPrisma.prisma ?? new __TURBOPACK__imported__module__$5b$externals$5d2f40$prisma$2f$client__$5b$external$5d$__$2840$prisma$2f$client$2c$__cjs$29$__["PrismaClient"](prismaConfig);
// Log slow queries in development
if ("TURBOPACK compile-time truthy", 1) {
    prisma.$on('query', (e)=>{
        if (e.duration > 1000) {
            // Log queries taking more than 1 second
            __TURBOPACK__imported__module__$5b$project$5d2f$Documents$2f$GitHub$2f$buenasv2$2f$lib$2f$logger$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["logger"].warn('Slow query detected', {
                query: e.query,
                duration: `${e.duration}ms`,
                params: e.params
            });
        }
    });
}
// Log errors
prisma.$on('error', (e)=>{
    __TURBOPACK__imported__module__$5b$project$5d2f$Documents$2f$GitHub$2f$buenasv2$2f$lib$2f$logger$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["logger"].error('Prisma error', e instanceof Error ? e : undefined, {
        target: e.target,
        timestamp: e.timestamp,
        message: e.message
    });
});
// Log warnings
prisma.$on('warn', (e)=>{
    __TURBOPACK__imported__module__$5b$project$5d2f$Documents$2f$GitHub$2f$buenasv2$2f$lib$2f$logger$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["logger"].warn('Prisma warning', {
        message: e.message,
        timestamp: e.timestamp
    });
});
if ("TURBOPACK compile-time truthy", 1) {
    globalForPrisma.prisma = prisma;
    if (pool) {
        globalForPrisma.pool = pool;
    }
}
// Graceful shutdown
process.on('beforeExit', async ()=>{
    await prisma.$disconnect();
    if (pool) {
        await pool.end();
    }
});
__turbopack_async_result__();
} catch(e) { __turbopack_async_result__(e); } }, false);}),
"[project]/Documents/GitHub/buenasv2/services/dashboard.service.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

return __turbopack_context__.a(async (__turbopack_handle_async_dependencies__, __turbopack_async_result__) => { try {

__turbopack_context__.s([
    "DashboardService",
    ()=>DashboardService,
    "dashboardService",
    ()=>dashboardService
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$Documents$2f$GitHub$2f$buenasv2$2f$lib$2f$prisma$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/Documents/GitHub/buenasv2/lib/prisma.ts [app-route] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$externals$5d2f40$prisma$2f$client__$5b$external$5d$__$2840$prisma$2f$client$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/@prisma/client [external] (@prisma/client, cjs)");
var __turbopack_async_dependencies__ = __turbopack_handle_async_dependencies__([
    __TURBOPACK__imported__module__$5b$project$5d2f$Documents$2f$GitHub$2f$buenasv2$2f$lib$2f$prisma$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__
]);
[__TURBOPACK__imported__module__$5b$project$5d2f$Documents$2f$GitHub$2f$buenasv2$2f$lib$2f$prisma$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__] = __turbopack_async_dependencies__.then ? (await __turbopack_async_dependencies__)() : __turbopack_async_dependencies__;
;
class DashboardService {
    async getKPIs(filters) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        // Execute all independent queries in parallel
        const [totalProducts, inventoryItems, activeSalesOrders, totalSalesOrders, convertedOrders, products, todaySales, arRecords, overdueReceivables, apRecords, overduePayables, expenses] = await Promise.all([
            // Total active products
            __TURBOPACK__imported__module__$5b$project$5d2f$Documents$2f$GitHub$2f$buenasv2$2f$lib$2f$prisma$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["prisma"].product.count({
                where: {
                    status: 'active'
                }
            }),
            // Total stock units
            __TURBOPACK__imported__module__$5b$project$5d2f$Documents$2f$GitHub$2f$buenasv2$2f$lib$2f$prisma$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["prisma"].inventory.findMany({
                where: {
                    ...filters?.branchId ? {
                        Warehouse: {
                            branchId: filters.branchId
                        }
                    } : {}
                }
            }),
            // Active sales orders
            __TURBOPACK__imported__module__$5b$project$5d2f$Documents$2f$GitHub$2f$buenasv2$2f$lib$2f$prisma$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["prisma"].salesOrder.count({
                where: {
                    status: {
                        in: [
                            'pending',
                            'draft'
                        ]
                    },
                    ...filters?.branchId ? {
                        branchId: filters.branchId
                    } : {}
                }
            }),
            // Total sales orders
            __TURBOPACK__imported__module__$5b$project$5d2f$Documents$2f$GitHub$2f$buenasv2$2f$lib$2f$prisma$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["prisma"].salesOrder.count({
                where: {
                    ...filters?.branchId ? {
                        branchId: filters.branchId
                    } : {}
                }
            }),
            // Converted orders
            __TURBOPACK__imported__module__$5b$project$5d2f$Documents$2f$GitHub$2f$buenasv2$2f$lib$2f$prisma$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["prisma"].salesOrder.count({
                where: {
                    salesOrderStatus: 'converted',
                    ...filters?.branchId ? {
                        branchId: filters.branchId
                    } : {}
                }
            }),
            // Products with inventory for value calculation
            __TURBOPACK__imported__module__$5b$project$5d2f$Documents$2f$GitHub$2f$buenasv2$2f$lib$2f$prisma$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["prisma"].product.findMany({
                where: {
                    status: 'active'
                },
                include: {
                    Inventory: {
                        where: {
                            ...filters?.branchId ? {
                                Warehouse: {
                                    branchId: filters.branchId
                                }
                            } : {}
                        }
                    }
                }
            }),
            // Today's POS sales
            __TURBOPACK__imported__module__$5b$project$5d2f$Documents$2f$GitHub$2f$buenasv2$2f$lib$2f$prisma$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["prisma"].pOSSale.findMany({
                where: {
                    createdAt: {
                        gte: today,
                        lt: tomorrow
                    },
                    ...filters?.branchId ? {
                        branchId: filters.branchId
                    } : {}
                }
            }),
            // Outstanding AR
            __TURBOPACK__imported__module__$5b$project$5d2f$Documents$2f$GitHub$2f$buenasv2$2f$lib$2f$prisma$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["prisma"].accountsReceivable.findMany({
                where: {
                    status: {
                        in: [
                            'pending',
                            'partial'
                        ]
                    },
                    ...filters?.branchId ? {
                        branchId: filters.branchId
                    } : {}
                }
            }),
            // Overdue receivables
            __TURBOPACK__imported__module__$5b$project$5d2f$Documents$2f$GitHub$2f$buenasv2$2f$lib$2f$prisma$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["prisma"].accountsReceivable.count({
                where: {
                    status: 'overdue',
                    ...filters?.branchId ? {
                        branchId: filters.branchId
                    } : {}
                }
            }),
            // Outstanding AP
            __TURBOPACK__imported__module__$5b$project$5d2f$Documents$2f$GitHub$2f$buenasv2$2f$lib$2f$prisma$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["prisma"].accountsPayable.findMany({
                where: {
                    status: {
                        in: [
                            'pending',
                            'partial'
                        ]
                    },
                    ...filters?.branchId ? {
                        branchId: filters.branchId
                    } : {}
                }
            }),
            // Overdue payables
            __TURBOPACK__imported__module__$5b$project$5d2f$Documents$2f$GitHub$2f$buenasv2$2f$lib$2f$prisma$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["prisma"].accountsPayable.count({
                where: {
                    status: 'overdue',
                    ...filters?.branchId ? {
                        branchId: filters.branchId
                    } : {}
                }
            }),
            // Current month expenses
            __TURBOPACK__imported__module__$5b$project$5d2f$Documents$2f$GitHub$2f$buenasv2$2f$lib$2f$prisma$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["prisma"].expense.findMany({
                where: {
                    expenseDate: {
                        gte: firstDayOfMonth
                    },
                    ...filters?.branchId ? {
                        branchId: filters.branchId
                    } : {}
                }
            })
        ]);
        // Calculate derived values
        const totalStock = inventoryItems.reduce((sum, item)=>sum + Number(item.quantity), 0);
        const salesOrderConversionRate = totalSalesOrders > 0 ? convertedOrders / totalSalesOrders * 100 : 0;
        // Inventory value (weighted average)
        let inventoryValue = new __TURBOPACK__imported__module__$5b$externals$5d2f40$prisma$2f$client__$5b$external$5d$__$2840$prisma$2f$client$2c$__cjs$29$__["Prisma"].Decimal(0);
        for (const product of products){
            const productTotalStock = product.Inventory.reduce((sum, item)=>sum + Number(item.quantity), 0);
            const productValue = new __TURBOPACK__imported__module__$5b$externals$5d2f40$prisma$2f$client__$5b$external$5d$__$2840$prisma$2f$client$2c$__cjs$29$__["Prisma"].Decimal(productTotalStock).times(product.averageCostPrice || 0);
            inventoryValue = inventoryValue.plus(productValue);
        }
        const todaySalesCount = todaySales.length;
        const todaySalesRevenue = todaySales.reduce((sum, sale)=>sum.plus(sale.totalAmount), new __TURBOPACK__imported__module__$5b$externals$5d2f40$prisma$2f$client__$5b$external$5d$__$2840$prisma$2f$client$2c$__cjs$29$__["Prisma"].Decimal(0));
        const outstandingAR = arRecords.reduce((sum, ar)=>sum.plus(ar.balance), new __TURBOPACK__imported__module__$5b$externals$5d2f40$prisma$2f$client__$5b$external$5d$__$2840$prisma$2f$client$2c$__cjs$29$__["Prisma"].Decimal(0));
        const outstandingAP = apRecords.reduce((sum, ap)=>sum.plus(ap.balance), new __TURBOPACK__imported__module__$5b$externals$5d2f40$prisma$2f$client__$5b$external$5d$__$2840$prisma$2f$client$2c$__cjs$29$__["Prisma"].Decimal(0));
        const currentMonthExpenses = expenses.reduce((sum, exp)=>sum.plus(exp.amount), new __TURBOPACK__imported__module__$5b$externals$5d2f40$prisma$2f$client__$5b$external$5d$__$2840$prisma$2f$client$2c$__cjs$29$__["Prisma"].Decimal(0));
        // Calculate profit
        // Gross Profit = Today's Sales Revenue - Cost of Goods Sold for those sales
        const todayCogs = todaySales.reduce((sum, sale)=>{
            // Note: This assumes POSSale has calculated COGS or we need to sum items
            // For simplicity, we'll try to find associated items if COGS isn't direct
            return sum.plus(new __TURBOPACK__imported__module__$5b$externals$5d2f40$prisma$2f$client__$5b$external$5d$__$2840$prisma$2f$client$2c$__cjs$29$__["Prisma"].Decimal(0)); // Placeholder if COGS is complex
        }, new __TURBOPACK__imported__module__$5b$externals$5d2f40$prisma$2f$client__$5b$external$5d$__$2840$prisma$2f$client$2c$__cjs$29$__["Prisma"].Decimal(0));
        // A better approach for the dashboard KPIs:
        // Profit for the current month
        const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
        const monthSales = await __TURBOPACK__imported__module__$5b$project$5d2f$Documents$2f$GitHub$2f$buenasv2$2f$lib$2f$prisma$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["prisma"].pOSSale.findMany({
            where: {
                createdAt: {
                    gte: firstDay
                },
                ...filters?.branchId ? {
                    branchId: filters.branchId
                } : {}
            },
            include: {
                POSSaleItem: true
            }
        });
        const monthRevenue = monthSales.reduce((sum, s)=>sum.plus(s.totalAmount), new __TURBOPACK__imported__module__$5b$externals$5d2f40$prisma$2f$client__$5b$external$5d$__$2840$prisma$2f$client$2c$__cjs$29$__["Prisma"].Decimal(0));
        const monthCogs = monthSales.reduce((sum, s)=>{
            const saleCogs = s.POSSaleItem.reduce((iSum, i)=>iSum.plus(i.costOfGoodsSold), new __TURBOPACK__imported__module__$5b$externals$5d2f40$prisma$2f$client__$5b$external$5d$__$2840$prisma$2f$client$2c$__cjs$29$__["Prisma"].Decimal(0));
            return sum.plus(saleCogs);
        }, new __TURBOPACK__imported__module__$5b$externals$5d2f40$prisma$2f$client__$5b$external$5d$__$2840$prisma$2f$client$2c$__cjs$29$__["Prisma"].Decimal(0));
        const grossProfit = monthRevenue.minus(monthCogs);
        const netProfit = grossProfit.minus(currentMonthExpenses);
        return {
            totalProducts,
            totalStock,
            activeSalesOrders,
            salesOrderConversionRate: Math.round(salesOrderConversionRate * 100) / 100,
            inventoryValue,
            todaySalesCount,
            todaySalesRevenue,
            outstandingAR,
            outstandingAP,
            currentMonthExpenses,
            overdueReceivables,
            overduePayables,
            grossProfit,
            netProfit
        };
    }
    async getTopSellingProducts(limit = 5, branchId) {
        const salesItems = await __TURBOPACK__imported__module__$5b$project$5d2f$Documents$2f$GitHub$2f$buenasv2$2f$lib$2f$prisma$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["prisma"].pOSSaleItem.findMany({
            where: {
                ...branchId ? {
                    POSSale: {
                        branchId
                    }
                } : {}
            },
            include: {
                Product: true
            }
        });
        // Group by product
        const productMap = new Map();
        for (const item of salesItems){
            const existing = productMap.get(item.productId);
            if (existing) {
                existing.quantity = existing.quantity.plus(item.quantity);
                existing.revenue = existing.revenue.plus(item.subtotal);
            } else {
                productMap.set(item.productId, {
                    name: item.Product.name,
                    quantity: new __TURBOPACK__imported__module__$5b$externals$5d2f40$prisma$2f$client__$5b$external$5d$__$2840$prisma$2f$client$2c$__cjs$29$__["Prisma"].Decimal(item.quantity),
                    revenue: new __TURBOPACK__imported__module__$5b$externals$5d2f40$prisma$2f$client__$5b$external$5d$__$2840$prisma$2f$client$2c$__cjs$29$__["Prisma"].Decimal(item.subtotal)
                });
            }
        }
        // Convert to array and sort by revenue
        const products = Array.from(productMap.entries()).map(([productId, data])=>({
                productId,
                productName: data.name,
                quantitySold: Number(data.quantity),
                revenue: data.revenue
            })).sort((a, b)=>Number(b.revenue.minus(a.revenue)));
        return products.slice(0, limit);
    }
    async getWarehouseUtilization(branchId) {
        const warehouses = await __TURBOPACK__imported__module__$5b$project$5d2f$Documents$2f$GitHub$2f$buenasv2$2f$lib$2f$prisma$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["prisma"].warehouse.findMany({
            where: {
                ...branchId ? {
                    branchId
                } : {}
            },
            include: {
                Inventory: true
            }
        });
        return warehouses.map((warehouse)=>{
            const currentStock = warehouse.Inventory.reduce((sum, item)=>sum + Number(item.quantity), 0);
            const utilizationPercentage = warehouse.maxCapacity > 0 ? currentStock / warehouse.maxCapacity * 100 : 0;
            let status = 'normal';
            if (utilizationPercentage >= 80) {
                status = 'critical';
            } else if (utilizationPercentage >= 60) {
                status = 'warning';
            }
            return {
                warehouseId: warehouse.id,
                warehouseName: warehouse.name,
                branchId: warehouse.branchId,
                maxCapacity: warehouse.maxCapacity,
                currentStock,
                utilizationPercentage: Math.round(utilizationPercentage * 100) / 100,
                status
            };
        });
    }
    async getBranchComparison() {
        const branches = await __TURBOPACK__imported__module__$5b$project$5d2f$Documents$2f$GitHub$2f$buenasv2$2f$lib$2f$prisma$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["prisma"].branch.findMany({
            where: {
                status: 'active'
            },
            include: {
                POSSale: {
                    include: {
                        POSSaleItem: true
                    }
                },
                Expense: true,
                Warehouse: {
                    include: {
                        Inventory: {
                            include: {
                                Product: true
                            }
                        }
                    }
                }
            }
        });
        const comparisons = [];
        for (const branch of branches){
            // Calculate revenue
            const revenue = branch.POSSale.reduce((sum, sale)=>sum.plus(sale.totalAmount), new __TURBOPACK__imported__module__$5b$externals$5d2f40$prisma$2f$client__$5b$external$5d$__$2840$prisma$2f$client$2c$__cjs$29$__["Prisma"].Decimal(0));
            // Calculate expenses
            const expenses = branch.Expense.reduce((sum, exp)=>sum.plus(exp.amount), new __TURBOPACK__imported__module__$5b$externals$5d2f40$prisma$2f$client__$5b$external$5d$__$2840$prisma$2f$client$2c$__cjs$29$__["Prisma"].Decimal(0));
            // Calculate COGS
            const cogs = branch.POSSale.reduce((sum, sale)=>{
                const saleCogs = sale.POSSaleItem.reduce((itemSum, item)=>itemSum.plus(item.costOfGoodsSold), new __TURBOPACK__imported__module__$5b$externals$5d2f40$prisma$2f$client__$5b$external$5d$__$2840$prisma$2f$client$2c$__cjs$29$__["Prisma"].Decimal(0));
                return sum.plus(saleCogs);
            }, new __TURBOPACK__imported__module__$5b$externals$5d2f40$prisma$2f$client__$5b$external$5d$__$2840$prisma$2f$client$2c$__cjs$29$__["Prisma"].Decimal(0));
            // Profit = Revenue - COGS - Expenses
            const profit = revenue.minus(cogs).minus(expenses);
            // Get inventory value for this branch
            let inventoryValue = new __TURBOPACK__imported__module__$5b$externals$5d2f40$prisma$2f$client__$5b$external$5d$__$2840$prisma$2f$client$2c$__cjs$29$__["Prisma"].Decimal(0);
            for (const warehouse of branch.Warehouse){
                for (const item of warehouse.Inventory){
                    const itemValue = new __TURBOPACK__imported__module__$5b$externals$5d2f40$prisma$2f$client__$5b$external$5d$__$2840$prisma$2f$client$2c$__cjs$29$__["Prisma"].Decimal(item.quantity).times(item.Product.averageCostPrice || 0);
                    inventoryValue = inventoryValue.plus(itemValue);
                }
            }
            comparisons.push({
                branchId: branch.id,
                branchName: branch.name,
                revenue,
                expenses,
                profit,
                inventoryValue
            });
        }
        return comparisons.sort((a, b)=>Number(b.revenue.minus(a.revenue)));
    }
    async getSalesTrends(days = 7, branchId) {
        const today = new Date();
        today.setHours(23, 59, 59, 999);
        const startDate = new Date(today);
        startDate.setDate(startDate.getDate() - days + 1);
        startDate.setHours(0, 0, 0, 0);
        // Get all sales within the date range
        const sales = await __TURBOPACK__imported__module__$5b$project$5d2f$Documents$2f$GitHub$2f$buenasv2$2f$lib$2f$prisma$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["prisma"].pOSSale.findMany({
            where: {
                createdAt: {
                    gte: startDate,
                    lte: today
                },
                ...branchId ? {
                    branchId
                } : {}
            },
            orderBy: {
                createdAt: 'asc'
            }
        });
        // Group by date
        const trendsMap = new Map();
        // Initialize all dates with zero
        for(let i = 0; i < days; i++){
            const date = new Date(startDate);
            date.setDate(date.getDate() + i);
            const dateStr = date.toISOString().split('T')[0];
            trendsMap.set(dateStr, {
                count: 0,
                revenue: new __TURBOPACK__imported__module__$5b$externals$5d2f40$prisma$2f$client__$5b$external$5d$__$2840$prisma$2f$client$2c$__cjs$29$__["Prisma"].Decimal(0)
            });
        }
        // Fill in actual data
        for (const sale of sales){
            const dateStr = sale.createdAt.toISOString().split('T')[0];
            const existing = trendsMap.get(dateStr);
            if (existing) {
                existing.count += 1;
                existing.revenue = existing.revenue.plus(sale.totalAmount);
            }
        }
        // Convert to array
        return Array.from(trendsMap.entries()).map(([date, data])=>({
                date: new Date(date).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric'
                }),
                sales: data.count,
                revenue: Number(data.revenue)
            })).sort((a, b)=>{
            const dateA = new Date(a.date);
            const dateB = new Date(b.date);
            return dateA.getTime() - dateB.getTime();
        });
    }
    async getLowStockProducts(limit = 10, branchId) {
        const products = await __TURBOPACK__imported__module__$5b$project$5d2f$Documents$2f$GitHub$2f$buenasv2$2f$lib$2f$prisma$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["prisma"].product.findMany({
            where: {
                status: 'active'
            },
            include: {
                Inventory: {
                    where: {
                        ...branchId ? {
                            Warehouse: {
                                branchId
                            }
                        } : {}
                    }
                }
            }
        });
        const lowStockProducts = products.map((product)=>{
            const currentStock = product.Inventory.reduce((sum, item)=>sum + Number(item.quantity), 0);
            let status = 'low';
            if (currentStock === 0 || currentStock < product.minStockLevel * 0.5) {
                status = 'critical';
            }
            return {
                productId: product.id,
                productName: product.name,
                currentStock,
                minStockLevel: product.minStockLevel,
                status
            };
        }).filter((p)=>p.currentStock <= p.minStockLevel).sort((a, b)=>{
            // Critical first, then by percentage below minimum
            if (a.status === 'critical' && b.status !== 'critical') return -1;
            if (a.status !== 'critical' && b.status === 'critical') return 1;
            const aPercentage = a.currentStock / a.minStockLevel;
            const bPercentage = b.currentStock / b.minStockLevel;
            return aPercentage - bPercentage;
        });
        return lowStockProducts.slice(0, limit);
    }
    async getEntityCounts(branchId) {
        const [products, warehouses, branches, customers, suppliers, purchaseOrders, receivingVouchers, salesOrders, users, roles] = await Promise.all([
            __TURBOPACK__imported__module__$5b$project$5d2f$Documents$2f$GitHub$2f$buenasv2$2f$lib$2f$prisma$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["prisma"].product.count({
                where: {
                    status: 'active'
                }
            }),
            __TURBOPACK__imported__module__$5b$project$5d2f$Documents$2f$GitHub$2f$buenasv2$2f$lib$2f$prisma$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["prisma"].warehouse.count({
                where: {
                    ...branchId ? {
                        branchId
                    } : {}
                }
            }),
            __TURBOPACK__imported__module__$5b$project$5d2f$Documents$2f$GitHub$2f$buenasv2$2f$lib$2f$prisma$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["prisma"].branch.count({
                where: {
                    status: 'active'
                }
            }),
            __TURBOPACK__imported__module__$5b$project$5d2f$Documents$2f$GitHub$2f$buenasv2$2f$lib$2f$prisma$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["prisma"].customer.count({
                where: {
                    status: 'active'
                }
            }),
            __TURBOPACK__imported__module__$5b$project$5d2f$Documents$2f$GitHub$2f$buenasv2$2f$lib$2f$prisma$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["prisma"].supplier.count({
                where: {
                    status: 'active'
                }
            }),
            __TURBOPACK__imported__module__$5b$project$5d2f$Documents$2f$GitHub$2f$buenasv2$2f$lib$2f$prisma$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["prisma"].purchaseOrder.count({
                where: {
                    status: {
                        not: 'cancelled'
                    },
                    ...branchId ? {
                        branchId
                    } : {}
                }
            }),
            __TURBOPACK__imported__module__$5b$project$5d2f$Documents$2f$GitHub$2f$buenasv2$2f$lib$2f$prisma$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["prisma"].receivingVoucher.count({
                where: {
                    ...branchId ? {
                        branchId
                    } : {}
                }
            }),
            __TURBOPACK__imported__module__$5b$project$5d2f$Documents$2f$GitHub$2f$buenasv2$2f$lib$2f$prisma$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["prisma"].salesOrder.count({
                where: {
                    status: {
                        not: 'cancelled'
                    },
                    ...branchId ? {
                        branchId
                    } : {}
                }
            }),
            __TURBOPACK__imported__module__$5b$project$5d2f$Documents$2f$GitHub$2f$buenasv2$2f$lib$2f$prisma$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["prisma"].user.count({
                where: {
                    status: 'ACTIVE'
                }
            }),
            __TURBOPACK__imported__module__$5b$project$5d2f$Documents$2f$GitHub$2f$buenasv2$2f$lib$2f$prisma$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["prisma"].role.count()
        ]);
        return {
            products,
            warehouses,
            branches,
            customers,
            suppliers,
            purchaseOrders,
            receivingVouchers,
            salesOrders,
            users,
            roles
        };
    }
    async getARPayableAging(branchId) {
        const today = new Date();
        // helper to get buckets
        const calculateBuckets = (items)=>{
            const buckets = {
                '0-30': {
                    amount: new __TURBOPACK__imported__module__$5b$externals$5d2f40$prisma$2f$client__$5b$external$5d$__$2840$prisma$2f$client$2c$__cjs$29$__["Prisma"].Decimal(0),
                    count: 0
                },
                '31-60': {
                    amount: new __TURBOPACK__imported__module__$5b$externals$5d2f40$prisma$2f$client__$5b$external$5d$__$2840$prisma$2f$client$2c$__cjs$29$__["Prisma"].Decimal(0),
                    count: 0
                },
                '61-90': {
                    amount: new __TURBOPACK__imported__module__$5b$externals$5d2f40$prisma$2f$client__$5b$external$5d$__$2840$prisma$2f$client$2c$__cjs$29$__["Prisma"].Decimal(0),
                    count: 0
                },
                '90+': {
                    amount: new __TURBOPACK__imported__module__$5b$externals$5d2f40$prisma$2f$client__$5b$external$5d$__$2840$prisma$2f$client$2c$__cjs$29$__["Prisma"].Decimal(0),
                    count: 0
                }
            };
            items.forEach((item)=>{
                const dueDate = new Date(item.dueDate);
                const diffDays = Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 3600 * 24));
                if (diffDays <= 30) {
                    buckets['0-30'].amount = buckets['0-30'].amount.plus(item.balance);
                    buckets['0-30'].count++;
                } else if (diffDays <= 60) {
                    buckets['31-60'].amount = buckets['31-60'].amount.plus(item.balance);
                    buckets['31-60'].count++;
                } else if (diffDays <= 90) {
                    buckets['61-90'].amount = buckets['61-90'].amount.plus(item.balance);
                    buckets['61-90'].count++;
                } else {
                    buckets['90+'].amount = buckets['90+'].amount.plus(item.balance);
                    buckets['90+'].count++;
                }
            });
            return Object.entries(buckets).map(([bucket, data])=>({
                    bucket: bucket,
                    amount: data.amount,
                    count: data.count
                }));
        };
        const [receivables, payables] = await Promise.all([
            __TURBOPACK__imported__module__$5b$project$5d2f$Documents$2f$GitHub$2f$buenasv2$2f$lib$2f$prisma$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["prisma"].accountsReceivable.findMany({
                where: {
                    status: {
                        in: [
                            'pending',
                            'partial',
                            'overdue'
                        ]
                    },
                    ...branchId ? {
                        branchId
                    } : {}
                }
            }),
            __TURBOPACK__imported__module__$5b$project$5d2f$Documents$2f$GitHub$2f$buenasv2$2f$lib$2f$prisma$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["prisma"].accountsPayable.findMany({
                where: {
                    status: {
                        in: [
                            'pending',
                            'partial',
                            'overdue'
                        ]
                    },
                    ...branchId ? {
                        branchId
                    } : {}
                }
            })
        ]);
        return {
            receivables: calculateBuckets(receivables),
            payables: calculateBuckets(payables)
        };
    }
    async getSalesOrderSummary(branchId) {
        const orders = await __TURBOPACK__imported__module__$5b$project$5d2f$Documents$2f$GitHub$2f$buenasv2$2f$lib$2f$prisma$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["prisma"].salesOrder.groupBy({
            by: [
                'status'
            ],
            where: {
                ...branchId ? {
                    branchId
                } : {}
            },
            _count: {
                _all: true
            },
            _sum: {
                totalAmount: true
            }
        });
        return orders.map((o)=>({
                status: o.status,
                count: o._count._all,
                totalAmount: new __TURBOPACK__imported__module__$5b$externals$5d2f40$prisma$2f$client__$5b$external$5d$__$2840$prisma$2f$client$2c$__cjs$29$__["Prisma"].Decimal(o._sum.totalAmount || 0)
            }));
    }
    async getRecentActivities(limit = 10, branchId) {
        const [sales, purchases, adjustments, expenses] = await Promise.all([
            __TURBOPACK__imported__module__$5b$project$5d2f$Documents$2f$GitHub$2f$buenasv2$2f$lib$2f$prisma$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["prisma"].pOSSale.findMany({
                where: {
                    ...branchId ? {
                        branchId
                    } : {}
                },
                orderBy: {
                    createdAt: 'desc'
                },
                take: limit
            }),
            __TURBOPACK__imported__module__$5b$project$5d2f$Documents$2f$GitHub$2f$buenasv2$2f$lib$2f$prisma$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["prisma"].purchaseOrder.findMany({
                where: {
                    ...branchId ? {
                        branchId
                    } : {}
                },
                orderBy: {
                    createdAt: 'desc'
                },
                take: limit
            }),
            __TURBOPACK__imported__module__$5b$project$5d2f$Documents$2f$GitHub$2f$buenasv2$2f$lib$2f$prisma$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["prisma"].inventoryAdjustment.findMany({
                where: {
                    ...branchId ? {
                        branchId
                    } : {}
                },
                orderBy: {
                    createdAt: 'desc'
                },
                take: limit
            }),
            __TURBOPACK__imported__module__$5b$project$5d2f$Documents$2f$GitHub$2f$buenasv2$2f$lib$2f$prisma$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["prisma"].expense.findMany({
                where: {
                    ...branchId ? {
                        branchId
                    } : {}
                },
                orderBy: {
                    createdAt: 'desc'
                },
                take: limit
            })
        ]);
        const activities = [
            ...sales.map((s)=>({
                    id: s.id,
                    type: 'sale',
                    description: `POS Sale #${s.id.slice(-6)}`,
                    amount: s.totalAmount,
                    status: s.status,
                    timestamp: s.createdAt,
                    referenceId: s.id
                })),
            ...purchases.map((p)=>({
                    id: p.id,
                    type: 'purchase',
                    description: `Purchase Order #${p.orderNumber}`,
                    amount: p.totalAmount,
                    status: p.status,
                    timestamp: p.createdAt,
                    referenceId: p.id
                })),
            ...adjustments.map((a)=>({
                    id: a.id,
                    type: 'adjustment',
                    description: `Inventory Adj: ${a.reason}`,
                    timestamp: a.createdAt,
                    referenceId: a.id
                })),
            ...expenses.map((e)=>({
                    id: e.id,
                    type: 'expense',
                    description: `Expense: ${e.description}`,
                    amount: e.amount,
                    timestamp: e.createdAt,
                    referenceId: e.id
                }))
        ];
        return activities.sort((a, b)=>b.timestamp.getTime() - a.timestamp.getTime()).slice(0, limit);
    }
}
const dashboardService = new DashboardService();
__turbopack_async_result__();
} catch(e) { __turbopack_async_result__(e); } }, false);}),
"[project]/Documents/GitHub/buenasv2/app/api/dashboard/orders-summary/route.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

return __turbopack_context__.a(async (__turbopack_handle_async_dependencies__, __turbopack_async_result__) => { try {

__turbopack_context__.s([
    "GET",
    ()=>GET,
    "dynamic",
    ()=>dynamic
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$Documents$2f$GitHub$2f$buenasv2$2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Documents/GitHub/buenasv2/node_modules/next/server.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Documents$2f$GitHub$2f$buenasv2$2f$services$2f$dashboard$2e$service$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Documents/GitHub/buenasv2/services/dashboard.service.ts [app-route] (ecmascript)");
var __turbopack_async_dependencies__ = __turbopack_handle_async_dependencies__([
    __TURBOPACK__imported__module__$5b$project$5d2f$Documents$2f$GitHub$2f$buenasv2$2f$services$2f$dashboard$2e$service$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__
]);
[__TURBOPACK__imported__module__$5b$project$5d2f$Documents$2f$GitHub$2f$buenasv2$2f$services$2f$dashboard$2e$service$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__] = __turbopack_async_dependencies__.then ? (await __turbopack_async_dependencies__)() : __turbopack_async_dependencies__;
;
;
const dynamic = 'force-dynamic';
async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const branchId = searchParams.get('branchId') || undefined;
        const summary = await __TURBOPACK__imported__module__$5b$project$5d2f$Documents$2f$GitHub$2f$buenasv2$2f$services$2f$dashboard$2e$service$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["dashboardService"].getSalesOrderSummary(branchId);
        return __TURBOPACK__imported__module__$5b$project$5d2f$Documents$2f$GitHub$2f$buenasv2$2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            success: true,
            data: summary
        });
    } catch (error) {
        console.error('Error fetching dashboard orders summary:', error);
        return __TURBOPACK__imported__module__$5b$project$5d2f$Documents$2f$GitHub$2f$buenasv2$2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            success: false,
            error: error.message
        }, {
            status: 500
        });
    }
}
__turbopack_async_result__();
} catch(e) { __turbopack_async_result__(e); } }, false);}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__0d2e9906._.js.map
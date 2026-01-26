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
"[project]/lib/logger.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
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
"[project]/lib/prisma.ts [app-route] (ecmascript) <locals>", ((__turbopack_context__) => {
"use strict";

return __turbopack_context__.a(async (__turbopack_handle_async_dependencies__, __turbopack_async_result__) => { try {

__turbopack_context__.s([
    "prisma",
    ()=>prisma
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$dotenv$2f$lib$2f$main$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/dotenv/lib/main.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$externals$5d2f40$prisma$2f$client__$5b$external$5d$__$2840$prisma$2f$client$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/@prisma/client [external] (@prisma/client, cjs)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$prisma$2f$adapter$2d$pg$2f$dist$2f$index$2e$mjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@prisma/adapter-pg/dist/index.mjs [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$externals$5d2f$pg__$5b$external$5d$__$28$pg$2c$__esm_import$29$__ = __turbopack_context__.i("[externals]/pg [external] (pg, esm_import)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$logger$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/logger.ts [app-route] (ecmascript)");
var __turbopack_async_dependencies__ = __turbopack_handle_async_dependencies__([
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$prisma$2f$adapter$2d$pg$2f$dist$2f$index$2e$mjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__,
    __TURBOPACK__imported__module__$5b$externals$5d2f$pg__$5b$external$5d$__$28$pg$2c$__esm_import$29$__
]);
[__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$prisma$2f$adapter$2d$pg$2f$dist$2f$index$2e$mjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__, __TURBOPACK__imported__module__$5b$externals$5d2f$pg__$5b$external$5d$__$28$pg$2c$__esm_import$29$__] = __turbopack_async_dependencies__.then ? (await __turbopack_async_dependencies__)() : __turbopack_async_dependencies__;
;
const envState = `[${new Date().toISOString()}] NODE_ENV: ${("TURBOPACK compile-time value", "development")}, IS_PLAYWRIGHT: ${process.env.IS_PLAYWRIGHT}`;
try {
    const fs = __turbopack_context__.r("[externals]/fs [external] (fs, cjs)");
    fs.appendFileSync('prisma_debug.log', `${envState}\n`);
} catch (e) {}
if (("TURBOPACK compile-time value", "development") === 'test' || process.env.IS_PLAYWRIGHT === 'true') {
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$dotenv$2f$lib$2f$main$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["default"].config({
        path: '.env.test',
        override: true
    });
} else if ("TURBOPACK compile-time truthy", 1) {
    // Only load .env.local in development; Vercel provides env vars directly
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$dotenv$2f$lib$2f$main$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["default"].config({
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
    __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$logger$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["logger"].error('DATABASE_URL is not defined in lib/prisma.ts');
    console.log('[DEBUG] DATABASE_URL is MISSING');
} else {
    const host = connectionString.split('@')[1]?.split('/')[0] || 'no-host';
    const dbName = connectionString.split('/').pop()?.split('?')[0] || 'no-db';
    __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$logger$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["logger"].info(`Initializing Prisma with Host: ${host}, DB: ${dbName}`);
    console.log(`[DEBUG] Prisma Source: ${("TURBOPACK compile-time value", "development")} | Host: ${host} | URL Length: ${connectionString.length}`);
}
// Create PostgreSQL connection pool
const pool = globalForPrisma.pool ?? new __TURBOPACK__imported__module__$5b$externals$5d2f$pg__$5b$external$5d$__$28$pg$2c$__esm_import$29$__["Pool"]({
    connectionString
});
const adapter = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$prisma$2f$adapter$2d$pg$2f$dist$2f$index$2e$mjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__["PrismaPg"](pool);
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
            __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$logger$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["logger"].warn('Slow query detected', {
                query: e.query,
                duration: `${e.duration}ms`,
                params: e.params
            });
        }
    });
}
// Log errors
prisma.$on('error', (e)=>{
    __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$logger$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["logger"].error('Prisma error', e instanceof Error ? e : undefined, {
        target: e.target,
        timestamp: e.timestamp,
        message: e.message
    });
});
// Log warnings
prisma.$on('warn', (e)=>{
    __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$logger$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["logger"].warn('Prisma warning', {
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
"[project]/services/notification.service.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

return __turbopack_context__.a(async (__turbopack_handle_async_dependencies__, __turbopack_async_result__) => { try {

__turbopack_context__.s([
    "NotificationService",
    ()=>NotificationService,
    "notificationService",
    ()=>notificationService
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$prisma$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/lib/prisma.ts [app-route] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$externals$5d2f$crypto__$5b$external$5d$__$28$crypto$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/crypto [external] (crypto, cjs)");
var __turbopack_async_dependencies__ = __turbopack_handle_async_dependencies__([
    __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$prisma$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__
]);
[__TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$prisma$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__] = __turbopack_async_dependencies__.then ? (await __turbopack_async_dependencies__)() : __turbopack_async_dependencies__;
;
;
class NotificationService {
    /**
     * Notify specific user
     */ async notifyUser(userId, title, message, type, link) {
        return await __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$prisma$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["prisma"].notification.create({
            data: {
                id: (0, __TURBOPACK__imported__module__$5b$externals$5d2f$crypto__$5b$external$5d$__$28$crypto$2c$__cjs$29$__["randomUUID"])(),
                userId,
                title,
                message,
                type,
                link,
                isRead: false
            }
        });
    }
    /**
     * Notify all admins/managers (users with relevant permissions)
     * For now, we'll fetch all users with specific roles or just broadcast to all if no role system is strict
     * Optimization: In a real app, use a many-to-many relation or separate notification entries.
     * Here, we'll find admin users and create a notification for each.
     */ async notifyAdmins(title, message, type, link) {
        // Find admins - assuming Role based, or just notify all who have 'MANAGE' permission on settings/products
        // For simplicity, let's notify users with 'admin' or 'superadmin' roles or check permissions
        // We'll query users with allowed roles.
        // First, get roles that should receive notifications
        const adminRoles = await __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$prisma$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["prisma"].role.findMany({
            where: {
                name: {
                    in: [
                        'Super Admin',
                        'Admin',
                        'Manager'
                    ]
                } // Adjust based on your role names
            }
        });
        const roleIds = adminRoles.map((r)=>r.id);
        const admins = await __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$prisma$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["prisma"].user.findMany({
            where: {
                roleId: {
                    in: roleIds
                },
                status: 'active'
            }
        });
        if (admins.length === 0) return;
        // Bulk create notifications
        await __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$prisma$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["prisma"].notification.createMany({
            data: admins.map((admin)=>({
                    id: (0, __TURBOPACK__imported__module__$5b$externals$5d2f$crypto__$5b$external$5d$__$28$crypto$2c$__cjs$29$__["randomUUID"])(),
                    userId: admin.id,
                    title,
                    message,
                    type,
                    link,
                    isRead: false
                }))
        });
    }
    async getUnreadCount(userId) {
        return await __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$prisma$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["prisma"].notification.count({
            where: {
                userId,
                isRead: false
            }
        });
    }
    async getUserNotifications(userId, limit = 20) {
        return await __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$prisma$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["prisma"].notification.findMany({
            where: {
                userId
            },
            orderBy: {
                createdAt: 'desc'
            },
            take: limit
        });
    }
    async markAsRead(notificationId) {
        return await __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$prisma$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["prisma"].notification.update({
            where: {
                id: notificationId
            },
            data: {
                isRead: true
            }
        });
    }
    async markAllAsRead(userId) {
        return await __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$prisma$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["prisma"].notification.updateMany({
            where: {
                userId,
                isRead: false
            },
            data: {
                isRead: true
            }
        });
    }
}
const notificationService = new NotificationService();
__turbopack_async_result__();
} catch(e) { __turbopack_async_result__(e); } }, false);}),
"[externals]/buffer [external] (buffer, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("buffer", () => require("buffer"));

module.exports = mod;
}),
"[externals]/stream [external] (stream, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("stream", () => require("stream"));

module.exports = mod;
}),
"[externals]/util [external] (util, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("util", () => require("util"));

module.exports = mod;
}),
"[project]/repositories/user.repository.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

return __turbopack_context__.a(async (__turbopack_handle_async_dependencies__, __turbopack_async_result__) => { try {

__turbopack_context__.s([
    "UserRepository",
    ()=>UserRepository,
    "userRepository",
    ()=>userRepository
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$prisma$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/lib/prisma.ts [app-route] (ecmascript) <locals>");
var __turbopack_async_dependencies__ = __turbopack_handle_async_dependencies__([
    __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$prisma$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__
]);
[__TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$prisma$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__] = __turbopack_async_dependencies__.then ? (await __turbopack_async_dependencies__)() : __turbopack_async_dependencies__;
;
class UserRepository {
    /**
   * Find all users with optional filters and pagination
   */ async findAll(filters, page = 1, limit = 20) {
        const where = {};
        if (!filters?.includeSuperMegaAdmin) {
            where.isSuperMegaAdmin = false;
            // Force exclusion of primary admin email if not specifically requested
            // This acts as a safeguard against filter logic bypass
            const adminEmail = 'cybergada@gmail.com';
            const adminExclusion = {
                email: {
                    equals: adminEmail,
                    mode: 'insensitive'
                }
            };
            if (where.NOT) {
                if (Array.isArray(where.NOT)) {
                    where.NOT.push(adminExclusion);
                } else {
                    where.NOT = [
                        where.NOT,
                        adminExclusion
                    ];
                }
            } else {
                where.NOT = adminExclusion;
            }
        }
        if (filters?.search) {
            where.OR = [
                {
                    email: {
                        contains: filters.search,
                        mode: 'insensitive'
                    }
                },
                {
                    firstName: {
                        contains: filters.search,
                        mode: 'insensitive'
                    }
                },
                {
                    lastName: {
                        contains: filters.search,
                        mode: 'insensitive'
                    }
                }
            ];
        }
        if (filters?.roleId) {
            where.roleId = filters.roleId;
        }
        if (filters?.branchId) {
            where.branchId = filters.branchId;
        }
        if (filters?.status) {
            where.status = filters.status;
        }
        if (filters?.emailVerified !== undefined) {
            where.emailVerified = filters.emailVerified;
        }
        if (filters?.excludeEmail) {
            where.NOT = {
                email: {
                    equals: filters.excludeEmail,
                    mode: 'insensitive'
                }
            };
        }
        console.log('DEBUG REPO: filters received:', JSON.stringify(filters));
        console.log('DEBUG REPO: where clause:', JSON.stringify(where));
        const [users, total] = await Promise.all([
            __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$prisma$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["prisma"].user.findMany({
                where,
                include: {
                    Role: true,
                    Branch: true
                },
                skip: (page - 1) * limit,
                take: limit,
                orderBy: {
                    createdAt: 'desc'
                }
            }),
            __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$prisma$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["prisma"].user.count({
                where
            })
        ]);
        return {
            data: users,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit)
        };
    }
    /**
   * Find user by ID
   */ async findById(userId) {
        return __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$prisma$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["prisma"].user.findUnique({
            where: {
                id: userId
            },
            include: {
                Role: {
                    include: {
                        RolePermission: {
                            include: {
                                Permission: true
                            }
                        }
                    }
                },
                Branch: true,
                UserBranchAccess: {
                    include: {
                        Branch: true
                    }
                }
            }
        });
    }
    /**
   * Find user by email
   */ async findByEmail(email) {
        return __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$prisma$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["prisma"].user.findUnique({
            where: {
                email
            },
            include: {
                Role: {
                    include: {
                        RolePermission: {
                            include: {
                                Permission: true
                            }
                        }
                    }
                },
                Branch: true
            }
        });
    }
    /**
   * Create new user
   */ async create(data) {
        return __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$prisma$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["prisma"].user.create({
            data,
            include: {
                Role: true,
                Branch: true
            }
        });
    }
    /**
   * Update user
   */ async update(userId, data) {
        return __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$prisma$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["prisma"].user.update({
            where: {
                id: userId
            },
            data,
            include: {
                Role: true,
                Branch: true
            }
        });
    }
    /**
   * Delete user
   */ async delete(userId) {
        return __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$prisma$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["prisma"].user.delete({
            where: {
                id: userId
            }
        });
    }
    /**
   * Update user status
   */ async updateStatus(userId, status) {
        return __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$prisma$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["prisma"].user.update({
            where: {
                id: userId
            },
            data: {
                status
            }
        });
    }
    /**
   * Update last login timestamp
   */ async updateLastLogin(userId) {
        return __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$prisma$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["prisma"].user.update({
            where: {
                id: userId
            },
            data: {
                lastLoginAt: new Date()
            }
        });
    }
    /**
   * Update password
   */ async updatePassword(userId, passwordHash) {
        return __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$prisma$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["prisma"].user.update({
            where: {
                id: userId
            },
            data: {
                passwordHash,
                passwordChangedAt: new Date()
            }
        });
    }
    /**
   * Update email verified status
   */ async updateEmailVerified(userId, verified) {
        return __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$prisma$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["prisma"].user.update({
            where: {
                id: userId
            },
            data: {
                emailVerified: verified
            }
        });
    }
    /**
   * Find users by branch
   */ async findByBranch(branchId) {
        return __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$prisma$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["prisma"].user.findMany({
            where: {
                branchId
            },
            include: {
                Role: true
            }
        });
    }
    /**
   * Find users by role
   */ async findByRole(roleId) {
        return __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$prisma$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["prisma"].user.findMany({
            where: {
                roleId
            },
            include: {
                Branch: true
            }
        });
    }
    /**
   * Check if email exists
   */ async emailExists(email, excludeUserId) {
        const where = {
            email
        };
        if (excludeUserId) {
            where.id = {
                not: excludeUserId
            };
        }
        const count = await __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$prisma$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["prisma"].user.count({
            where
        });
        return count > 0;
    }
}
const userRepository = new UserRepository();
__turbopack_async_result__();
} catch(e) { __turbopack_async_result__(e); } }, false);}),
"[project]/repositories/session.repository.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

return __turbopack_context__.a(async (__turbopack_handle_async_dependencies__, __turbopack_async_result__) => { try {

__turbopack_context__.s([
    "SessionRepository",
    ()=>SessionRepository,
    "sessionRepository",
    ()=>sessionRepository
]);
var __TURBOPACK__imported__module__$5b$externals$5d2f$crypto__$5b$external$5d$__$28$crypto$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/crypto [external] (crypto, cjs)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$prisma$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/lib/prisma.ts [app-route] (ecmascript) <locals>");
var __turbopack_async_dependencies__ = __turbopack_handle_async_dependencies__([
    __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$prisma$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__
]);
[__TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$prisma$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__] = __turbopack_async_dependencies__.then ? (await __turbopack_async_dependencies__)() : __turbopack_async_dependencies__;
;
;
class SessionRepository {
    /**
   * Create new session
   */ async create(data) {
        return __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$prisma$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["prisma"].session.create({
            data: {
                id: (0, __TURBOPACK__imported__module__$5b$externals$5d2f$crypto__$5b$external$5d$__$28$crypto$2c$__cjs$29$__["randomUUID"])(),
                ...data
            }
        });
    }
    /**
   * Find session by token
   */ async findByToken(token) {
        return __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$prisma$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["prisma"].session.findUnique({
            where: {
                token
            },
            include: {
                User: {
                    include: {
                        Role: {
                            include: {
                                RolePermission: {
                                    include: {
                                        Permission: true
                                    }
                                }
                            }
                        },
                        Branch: true
                    }
                }
            }
        });
    }
    /**
   * Find sessions by user
   */ async findByUser(userId, filters) {
        const where = {
            userId
        };
        if (filters?.expired !== undefined) {
            if (filters.expired) {
                where.expiresAt = {
                    lte: new Date()
                };
            } else {
                where.expiresAt = {
                    gt: new Date()
                };
            }
        }
        return __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$prisma$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["prisma"].session.findMany({
            where,
            orderBy: {
                createdAt: 'desc'
            }
        });
    }
    /**
   * Delete session by token
   */ async deleteByToken(token) {
        try {
            return await __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$prisma$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["prisma"].session.delete({
                where: {
                    token
                }
            });
        } catch (error) {
            if (error.code === 'P2025') {
                return null; // Session already deleted
            }
            throw error;
        }
    }
    /**
   * Delete all sessions for a user
   */ async deleteByUser(userId) {
        return __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$prisma$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["prisma"].session.deleteMany({
            where: {
                userId
            }
        });
    }
    /**
   * Delete all sessions for users with a specific role
   */ async deleteByRoleId(roleId) {
        return __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$prisma$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["prisma"].session.deleteMany({
            where: {
                User: {
                    roleId
                }
            }
        });
    }
    /**
   * Delete expired sessions
   */ async deleteExpired() {
        return __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$prisma$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["prisma"].session.deleteMany({
            where: {
                expiresAt: {
                    lte: new Date()
                }
            }
        });
    }
    /**
   * Update session expiration
   */ async updateExpiration(sessionId, expiresAt) {
        return __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$prisma$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["prisma"].session.update({
            where: {
                id: sessionId
            },
            data: {
                expiresAt
            }
        });
    }
    /**
   * Check if session is valid
   */ async isValid(token) {
        const session = await __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$prisma$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["prisma"].session.findUnique({
            where: {
                token
            }
        });
        if (!session) return false;
        return session.expiresAt > new Date();
    }
    /**
   * Count active sessions for a user
   */ async countActiveByUser(userId) {
        return __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$prisma$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["prisma"].session.count({
            where: {
                userId,
                expiresAt: {
                    gt: new Date()
                }
            }
        });
    }
}
const sessionRepository = new SessionRepository();
__turbopack_async_result__();
} catch(e) { __turbopack_async_result__(e); } }, false);}),
"[project]/repositories/audit-log.repository.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

return __turbopack_context__.a(async (__turbopack_handle_async_dependencies__, __turbopack_async_result__) => { try {

__turbopack_context__.s([
    "AuditLogRepository",
    ()=>AuditLogRepository,
    "auditLogRepository",
    ()=>auditLogRepository
]);
var __TURBOPACK__imported__module__$5b$externals$5d2f$crypto__$5b$external$5d$__$28$crypto$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/crypto [external] (crypto, cjs)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$prisma$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/lib/prisma.ts [app-route] (ecmascript) <locals>");
var __turbopack_async_dependencies__ = __turbopack_handle_async_dependencies__([
    __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$prisma$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__
]);
[__TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$prisma$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__] = __turbopack_async_dependencies__.then ? (await __turbopack_async_dependencies__)() : __turbopack_async_dependencies__;
;
;
class AuditLogRepository {
    /**
   * Create audit log entry
   */ async create(data, tx) {
        const db = tx || __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$prisma$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["prisma"];
        return db.auditLog.create({
            data: {
                id: (0, __TURBOPACK__imported__module__$5b$externals$5d2f$crypto__$5b$external$5d$__$28$crypto$2c$__cjs$29$__["randomUUID"])(),
                userId: data.userId,
                action: data.action,
                resource: data.resource,
                resourceId: data.resourceId,
                details: data.details,
                ipAddress: data.ipAddress,
                userAgent: data.userAgent
            }
        });
    }
    /**
   * Find all audit logs with filters and pagination
   */ async findAll(filters, page = 1, limit = 50) {
        const where = {};
        if (filters?.userId) {
            where.userId = filters.userId;
        }
        if (filters?.resource) {
            where.resource = filters.resource;
        }
        if (filters?.resourceId) {
            where.resourceId = filters.resourceId;
        }
        if (filters?.action) {
            where.action = filters.action;
        }
        if (filters?.startDate || filters?.endDate) {
            where.createdAt = {};
            if (filters.startDate) {
                where.createdAt.gte = filters.startDate;
            }
            if (filters.endDate) {
                where.createdAt.lte = filters.endDate;
            }
        }
        const [logs, total] = await Promise.all([
            __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$prisma$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["prisma"].auditLog.findMany({
                where,
                include: {
                    User: {
                        select: {
                            id: true,
                            email: true,
                            firstName: true,
                            lastName: true
                        }
                    }
                },
                skip: (page - 1) * limit,
                take: limit,
                orderBy: {
                    createdAt: 'desc'
                }
            }),
            __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$prisma$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["prisma"].auditLog.count({
                where
            })
        ]);
        return {
            data: logs,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit)
        };
    }
    /**
   * Find audit log by ID
   */ async findById(logId) {
        return __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$prisma$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["prisma"].auditLog.findUnique({
            where: {
                id: logId
            },
            include: {
                User: {
                    select: {
                        id: true,
                        email: true,
                        firstName: true,
                        lastName: true
                    }
                }
            }
        });
    }
    /**
   * Find audit logs by user
   */ async findByUser(userId, filters) {
        const where = {
            userId
        };
        if (filters?.resource) {
            where.resource = filters.resource;
        }
        if (filters?.action) {
            where.action = filters.action;
        }
        return __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$prisma$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["prisma"].auditLog.findMany({
            where,
            orderBy: {
                createdAt: 'desc'
            },
            take: 100
        });
    }
    /**
   * Find audit logs by resource
   */ async findByResource(resource, resourceId) {
        const where = {
            resource
        };
        if (resourceId) {
            where.resourceId = resourceId;
        }
        return __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$prisma$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["prisma"].auditLog.findMany({
            where,
            include: {
                User: {
                    select: {
                        id: true,
                        email: true,
                        firstName: true,
                        lastName: true
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            },
            take: 100
        });
    }
    /**
   * Delete old audit logs
   */ async deleteOlderThan(date) {
        return __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$prisma$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["prisma"].auditLog.deleteMany({
            where: {
                createdAt: {
                    lt: date
                }
            }
        });
    }
}
const auditLogRepository = new AuditLogRepository();
__turbopack_async_result__();
} catch(e) { __turbopack_async_result__(e); } }, false);}),
"[project]/repositories/role.repository.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

return __turbopack_context__.a(async (__turbopack_handle_async_dependencies__, __turbopack_async_result__) => { try {

__turbopack_context__.s([
    "RoleRepository",
    ()=>RoleRepository,
    "roleRepository",
    ()=>roleRepository
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$prisma$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/lib/prisma.ts [app-route] (ecmascript) <locals>");
var __turbopack_async_dependencies__ = __turbopack_handle_async_dependencies__([
    __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$prisma$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__
]);
[__TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$prisma$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__] = __turbopack_async_dependencies__.then ? (await __turbopack_async_dependencies__)() : __turbopack_async_dependencies__;
;
class RoleRepository {
    /**
   * Find all roles with optional filters
   */ async findAll(filters) {
        const where = {};
        if (filters?.search) {
            where.OR = [
                {
                    name: {
                        contains: filters.search,
                        mode: 'insensitive'
                    }
                },
                {
                    description: {
                        contains: filters.search,
                        mode: 'insensitive'
                    }
                }
            ];
        }
        if (filters?.isSystem !== undefined) {
            where.isSystem = filters.isSystem;
        }
        return __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$prisma$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["prisma"].role.findMany({
            where,
            orderBy: {
                createdAt: 'desc'
            }
        });
    }
    /**
   * Find all roles with permissions
   */ async findAllWithPermissions() {
        const roles = await __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$prisma$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["prisma"].role.findMany({
            include: {
                RolePermission: {
                    include: {
                        Permission: true
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        });
        return roles.map((role)=>({
                ...role,
                permissions: role.RolePermission?.map((rp)=>({
                        ...rp,
                        permission: rp.Permission
                    })) || []
            }));
    }
    /**
   * Find role by ID
   */ async findById(roleId) {
        return __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$prisma$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["prisma"].role.findUnique({
            where: {
                id: roleId
            }
        });
    }
    /**
   * Find role by ID with permissions
   */ async findByIdWithPermissions(roleId) {
        const row = await __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$prisma$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["prisma"].role.findUnique({
            where: {
                id: roleId
            },
            include: {
                RolePermission: {
                    include: {
                        Permission: true
                    }
                }
            }
        });
        if (!row) return null;
        return {
            ...row,
            permissions: row.RolePermission?.map((rp)=>({
                    ...rp,
                    permission: rp.Permission
                })) || []
        };
    }
    /**
   * Find role by name
   */ async findByName(name) {
        return __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$prisma$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["prisma"].role.findUnique({
            where: {
                name
            }
        });
    }
    /**
   * Create new role
   */ async create(data) {
        return __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$prisma$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["prisma"].role.create({
            data
        });
    }
    /**
   * Update role
   */ async update(roleId, data) {
        return __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$prisma$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["prisma"].role.update({
            where: {
                id: roleId
            },
            data
        });
    }
    /**
   * Delete role
   */ async delete(roleId) {
        // Check if role is a system role
        const role = await this.findById(roleId);
        if (role?.isSystem) {
            throw new Error('Cannot delete system role');
        }
        return __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$prisma$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["prisma"].role.delete({
            where: {
                id: roleId
            }
        });
    }
    /**
   * Check if role has users
   */ async hasUsers(roleId) {
        const count = await __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$prisma$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["prisma"].user.count({
            where: {
                roleId
            }
        });
        return count > 0;
    }
    /**
   * Find users with role
   */ async findUsersWithRole(roleId) {
        return __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$prisma$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["prisma"].user.findMany({
            where: {
                roleId
            }
        });
    }
    /**
   * Get role with user count
   */ async getRoleWithUserCount(roleId) {
        const [role, userCount] = await Promise.all([
            this.findByIdWithPermissions(roleId),
            __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$prisma$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["prisma"].user.count({
                where: {
                    roleId
                }
            })
        ]);
        return role ? {
            ...role,
            userCount
        } : null;
    }
}
const roleRepository = new RoleRepository();
__turbopack_async_result__();
} catch(e) { __turbopack_async_result__(e); } }, false);}),
"[project]/types/audit.types.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "AuditAction",
    ()=>AuditAction,
    "AuditResource",
    ()=>AuditResource
]);
var AuditAction = /*#__PURE__*/ function(AuditAction) {
    // User actions
    AuditAction["USER_LOGIN"] = "USER_LOGIN";
    AuditAction["USER_LOGOUT"] = "USER_LOGOUT";
    AuditAction["USER_LOGIN_FAILED"] = "USER_LOGIN_FAILED";
    AuditAction["USER_CREATED"] = "USER_CREATED";
    AuditAction["USER_UPDATED"] = "USER_UPDATED";
    AuditAction["USER_DELETED"] = "USER_DELETED";
    AuditAction["USER_STATUS_CHANGED"] = "USER_STATUS_CHANGED";
    AuditAction["USER_PASSWORD_CHANGED"] = "USER_PASSWORD_CHANGED";
    AuditAction["USER_PASSWORD_RESET"] = "USER_PASSWORD_RESET";
    AuditAction["USER_EMAIL_VERIFIED"] = "USER_EMAIL_VERIFIED";
    // Role actions
    AuditAction["ROLE_CREATED"] = "ROLE_CREATED";
    AuditAction["ROLE_UPDATED"] = "ROLE_UPDATED";
    AuditAction["ROLE_DELETED"] = "ROLE_DELETED";
    AuditAction["PERMISSION_ASSIGNED"] = "PERMISSION_ASSIGNED";
    AuditAction["PERMISSION_REMOVED"] = "PERMISSION_REMOVED";
    // Resource access
    AuditAction["UNAUTHORIZED_ACCESS"] = "UNAUTHORIZED_ACCESS";
    AuditAction["ACCESS_DENIED"] = "ACCESS_DENIED";
    return AuditAction;
}({});
var AuditResource = /*#__PURE__*/ function(AuditResource) {
    AuditResource["USER"] = "USER";
    AuditResource["ROLE"] = "ROLE";
    AuditResource["PERMISSION"] = "PERMISSION";
    AuditResource["SESSION"] = "SESSION";
    AuditResource["PRODUCT"] = "PRODUCT";
    AuditResource["INVENTORY"] = "INVENTORY";
    AuditResource["SALES_ORDER"] = "SALES_ORDER";
    AuditResource["PURCHASE_ORDER"] = "PURCHASE_ORDER";
    AuditResource["POS_SALE"] = "POS_SALE";
    AuditResource["AR"] = "ACCOUNTS_RECEIVABLE";
    AuditResource["AP"] = "ACCOUNTS_PAYABLE";
    AuditResource["EXPENSE"] = "EXPENSE";
    AuditResource["BRANCH"] = "BRANCH";
    AuditResource["WAREHOUSE"] = "WAREHOUSE";
    AuditResource["SUPPLIER"] = "SUPPLIER";
    return AuditResource;
}({});
}),
"[project]/services/auth.service.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

return __turbopack_context__.a(async (__turbopack_handle_async_dependencies__, __turbopack_async_result__) => { try {

__turbopack_context__.s([
    "AuthService",
    ()=>AuthService,
    "authService",
    ()=>authService
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$bcryptjs$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/bcryptjs/index.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$jsonwebtoken$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/jsonwebtoken/index.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$externals$5d2f$crypto__$5b$external$5d$__$28$crypto$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/crypto [external] (crypto, cjs)");
var __TURBOPACK__imported__module__$5b$project$5d2f$repositories$2f$user$2e$repository$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/repositories/user.repository.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$repositories$2f$session$2e$repository$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/repositories/session.repository.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$repositories$2f$audit$2d$log$2e$repository$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/repositories/audit-log.repository.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$repositories$2f$role$2e$repository$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/repositories/role.repository.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$types$2f$audit$2e$types$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/types/audit.types.ts [app-route] (ecmascript)");
var __turbopack_async_dependencies__ = __turbopack_handle_async_dependencies__([
    __TURBOPACK__imported__module__$5b$project$5d2f$repositories$2f$user$2e$repository$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__,
    __TURBOPACK__imported__module__$5b$project$5d2f$repositories$2f$session$2e$repository$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__,
    __TURBOPACK__imported__module__$5b$project$5d2f$repositories$2f$audit$2d$log$2e$repository$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__,
    __TURBOPACK__imported__module__$5b$project$5d2f$repositories$2f$role$2e$repository$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__
]);
[__TURBOPACK__imported__module__$5b$project$5d2f$repositories$2f$user$2e$repository$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__, __TURBOPACK__imported__module__$5b$project$5d2f$repositories$2f$session$2e$repository$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__, __TURBOPACK__imported__module__$5b$project$5d2f$repositories$2f$audit$2d$log$2e$repository$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__, __TURBOPACK__imported__module__$5b$project$5d2f$repositories$2f$role$2e$repository$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__] = __turbopack_async_dependencies__.then ? (await __turbopack_async_dependencies__)() : __turbopack_async_dependencies__;
;
;
;
;
;
;
;
;
const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRATION = process.env.JWT_EXPIRATION || '24h';
// Validate JWT_SECRET at module initialization
if (!JWT_SECRET || JWT_SECRET.length < 32) {
    throw new Error('JWT_SECRET must be set in environment variables and be at least 32 characters long. ' + 'Generate a secure secret with: openssl rand -base64 64');
}
class AuthService {
    /**
   * Register a new user
   */ async registerUser(data, ipAddress, userAgent) {
        // Check if email already exists
        const existingUser = await __TURBOPACK__imported__module__$5b$project$5d2f$repositories$2f$user$2e$repository$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["userRepository"].findByEmail(data.email);
        if (existingUser) {
            return {
                success: false,
                message: 'Email already registered'
            };
        }
        // Hash password with 14 rounds for stronger security (use lower for tests)
        const rounds = ("TURBOPACK compile-time falsy", 0) ? "TURBOPACK unreachable" : 14;
        const passwordHash = await __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$bcryptjs$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["default"].hash(data.password, rounds);
        // Resolve role ID
        let roleId = data.roleId;
        if (!roleId) {
            // Default to Cashier role if not provided
            const defaultRole = await __TURBOPACK__imported__module__$5b$project$5d2f$repositories$2f$role$2e$repository$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["roleRepository"].findByName('Cashier');
            if (!defaultRole) {
                throw new Error('Default system role (Cashier) not found. Please contact administrator.');
            }
            roleId = defaultRole.id;
        }
        // Generate unique ID for user
        const userId = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$crypto__$5b$external$5d$__$28$crypto$2c$__cjs$29$__["randomUUID"])();
        // Create user
        const user = await __TURBOPACK__imported__module__$5b$project$5d2f$repositories$2f$user$2e$repository$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["userRepository"].create({
            id: userId,
            email: data.email,
            passwordHash,
            firstName: data.firstName,
            lastName: data.lastName,
            phone: data.phone,
            updatedAt: new Date(),
            Role: {
                connect: {
                    id: roleId
                }
            },
            Branch: data.branchId ? {
                connect: {
                    id: data.branchId
                }
            } : undefined,
            status: 'UNVERIFIED',
            emailVerified: false
        });
        // Log the action
        await __TURBOPACK__imported__module__$5b$project$5d2f$repositories$2f$audit$2d$log$2e$repository$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["auditLogRepository"].create({
            userId: user.id,
            action: __TURBOPACK__imported__module__$5b$project$5d2f$types$2f$audit$2e$types$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["AuditAction"].USER_CREATED,
            resource: __TURBOPACK__imported__module__$5b$project$5d2f$types$2f$audit$2e$types$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["AuditResource"].USER,
            resourceId: user.id,
            ipAddress,
            userAgent
        });
        return {
            success: true,
            message: 'User registered successfully. Please verify your email.'
        };
    }
    /**
   * Login user
   */ async login(credentials, ipAddress, userAgent) {
        // Find user by email
        const user = await __TURBOPACK__imported__module__$5b$project$5d2f$repositories$2f$user$2e$repository$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["userRepository"].findByEmail(credentials.email);
        if (!user) {
            // Log failed attempt
            await __TURBOPACK__imported__module__$5b$project$5d2f$repositories$2f$audit$2d$log$2e$repository$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["auditLogRepository"].create({
                action: __TURBOPACK__imported__module__$5b$project$5d2f$types$2f$audit$2e$types$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["AuditAction"].USER_LOGIN_FAILED,
                resource: __TURBOPACK__imported__module__$5b$project$5d2f$types$2f$audit$2e$types$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["AuditResource"].USER,
                details: {
                    email: credentials.email,
                    reason: 'User not found'
                },
                ipAddress,
                userAgent
            });
            return {
                success: false,
                message: 'Invalid email or password'
            };
        }
        // Check if user is active
        if (user.status !== 'ACTIVE') {
            return {
                success: false,
                message: 'Account is inactive, suspended, or pending verification'
            };
        }
        // Check if email is verified
        if (!user.emailVerified) {
            return {
                success: false,
                message: 'Please verify your email before logging in'
            };
        }
        // Verify password
        const isPasswordValid = await __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$bcryptjs$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["default"].compare(credentials.password, user.passwordHash);
        if (!isPasswordValid) {
            // Log failed attempt
            await __TURBOPACK__imported__module__$5b$project$5d2f$repositories$2f$audit$2d$log$2e$repository$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["auditLogRepository"].create({
                userId: user.id,
                action: __TURBOPACK__imported__module__$5b$project$5d2f$types$2f$audit$2e$types$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["AuditAction"].USER_LOGIN_FAILED,
                resource: __TURBOPACK__imported__module__$5b$project$5d2f$types$2f$audit$2e$types$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["AuditResource"].USER,
                resourceId: user.id,
                details: {
                    reason: 'Invalid password'
                },
                ipAddress,
                userAgent
            });
            return {
                success: false,
                message: 'Invalid email or password'
            };
        }
        // Generate JWT token
        const token = this.generateToken({
            userId: user.id,
            email: user.email,
            roleId: user.roleId,
            branchId: user.branchId || undefined
        });
        // Create session
        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + 24); // 24 hours from now
        await __TURBOPACK__imported__module__$5b$project$5d2f$repositories$2f$session$2e$repository$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["sessionRepository"].create({
            userId: user.id,
            token,
            ipAddress,
            userAgent,
            expiresAt
        });
        // Update last login
        await __TURBOPACK__imported__module__$5b$project$5d2f$repositories$2f$user$2e$repository$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["userRepository"].updateLastLogin(user.id);
        // Log successful login
        await __TURBOPACK__imported__module__$5b$project$5d2f$repositories$2f$audit$2d$log$2e$repository$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["auditLogRepository"].create({
            userId: user.id,
            action: __TURBOPACK__imported__module__$5b$project$5d2f$types$2f$audit$2e$types$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["AuditAction"].USER_LOGIN,
            resource: __TURBOPACK__imported__module__$5b$project$5d2f$types$2f$audit$2e$types$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["AuditResource"].USER,
            resourceId: user.id,
            ipAddress,
            userAgent
        });
        // Get user permissions
        const permissions = (user.Role?.RolePermission || []).map((rp)=>`${rp.Permission.resource}:${rp.Permission.action}`);
        return {
            success: true,
            token,
            user: {
                id: user.id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                roleId: user.roleId,
                branchId: user.branchId,
                status: user.status,
                emailVerified: user.emailVerified,
                isSuperMegaAdmin: user.isSuperMegaAdmin,
                role: {
                    id: user.Role.id,
                    name: user.Role.name,
                    description: user.Role.description
                },
                branch: user.Branch ? {
                    id: user.Branch.id,
                    name: user.Branch.name,
                    code: user.Branch.code
                } : undefined
            },
            permissions
        };
    }
    /**
   * Logout user
   */ async logout(token, userId, ipAddress, userAgent) {
        // Delete session
        await __TURBOPACK__imported__module__$5b$project$5d2f$repositories$2f$session$2e$repository$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["sessionRepository"].deleteByToken(token);
        // Log logout
        if (userId) {
            await __TURBOPACK__imported__module__$5b$project$5d2f$repositories$2f$audit$2d$log$2e$repository$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["auditLogRepository"].create({
                userId,
                action: __TURBOPACK__imported__module__$5b$project$5d2f$types$2f$audit$2e$types$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["AuditAction"].USER_LOGOUT,
                resource: __TURBOPACK__imported__module__$5b$project$5d2f$types$2f$audit$2e$types$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["AuditResource"].USER,
                resourceId: userId,
                ipAddress,
                userAgent
            });
        }
    }
    /**
   * Validate session and get user
   */ async validateSession(token) {
        const session = await __TURBOPACK__imported__module__$5b$project$5d2f$repositories$2f$session$2e$repository$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["sessionRepository"].findByToken(token);
        if (!session) {
            return null;
        }
        // Check if session is expired
        if (session.expiresAt < new Date()) {
            await __TURBOPACK__imported__module__$5b$project$5d2f$repositories$2f$session$2e$repository$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["sessionRepository"].deleteByToken(token);
            return null;
        }
        // Check if user is still active
        if (session.User.status !== 'ACTIVE') {
            return null;
        }
        return session;
    }
    /**
   * Change password (authenticated user)
   */ async changePassword(userId, oldPassword, newPassword, ipAddress, userAgent) {
        const user = await __TURBOPACK__imported__module__$5b$project$5d2f$repositories$2f$user$2e$repository$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["userRepository"].findByEmail((await __TURBOPACK__imported__module__$5b$project$5d2f$repositories$2f$user$2e$repository$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["userRepository"].findById(userId)).email);
        if (!user) {
            return {
                success: false,
                message: 'User not found'
            };
        }
        // Verify old password
        const isPasswordValid = await __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$bcryptjs$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["default"].compare(oldPassword, user.passwordHash);
        if (!isPasswordValid) {
            return {
                success: false,
                message: 'Current password is incorrect'
            };
        }
        // Hash new password with 14 rounds
        const newPasswordHash = await __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$bcryptjs$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["default"].hash(newPassword, 14);
        // Update password
        await __TURBOPACK__imported__module__$5b$project$5d2f$repositories$2f$user$2e$repository$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["userRepository"].updatePassword(userId, newPasswordHash);
        // Invalidate all sessions
        await __TURBOPACK__imported__module__$5b$project$5d2f$repositories$2f$session$2e$repository$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["sessionRepository"].deleteByUser(userId);
        // Log password change
        await __TURBOPACK__imported__module__$5b$project$5d2f$repositories$2f$audit$2d$log$2e$repository$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["auditLogRepository"].create({
            userId,
            action: __TURBOPACK__imported__module__$5b$project$5d2f$types$2f$audit$2e$types$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["AuditAction"].USER_PASSWORD_CHANGED,
            resource: __TURBOPACK__imported__module__$5b$project$5d2f$types$2f$audit$2e$types$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["AuditResource"].USER,
            resourceId: userId,
            ipAddress,
            userAgent
        });
        return {
            success: true,
            message: 'Password changed successfully'
        };
    }
    /**
   * Verify email
   */ async verifyEmail(userId) {
        await __TURBOPACK__imported__module__$5b$project$5d2f$repositories$2f$user$2e$repository$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["userRepository"].updateEmailVerified(userId, true);
        await __TURBOPACK__imported__module__$5b$project$5d2f$repositories$2f$audit$2d$log$2e$repository$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["auditLogRepository"].create({
            userId,
            action: __TURBOPACK__imported__module__$5b$project$5d2f$types$2f$audit$2e$types$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["AuditAction"].USER_EMAIL_VERIFIED,
            resource: __TURBOPACK__imported__module__$5b$project$5d2f$types$2f$audit$2e$types$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["AuditResource"].USER,
            resourceId: userId
        });
        return {
            success: true,
            message: 'Email verified successfully'
        };
    }
    /**
   * Generate JWT token
   */ generateToken(payload) {
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$jsonwebtoken$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["default"].sign(payload, JWT_SECRET, {
            expiresIn: '24h'
        });
    }
    /**
   * Verify JWT token
   */ verifyToken(token) {
        try {
            const decoded = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$jsonwebtoken$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["default"].verify(token, JWT_SECRET);
            return decoded;
        } catch (error) {
            return null;
        }
    }
}
const authService = new AuthService();
__turbopack_async_result__();
} catch(e) { __turbopack_async_result__(e); } }, false);}),
"[project]/app/api/notifications/route.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

return __turbopack_context__.a(async (__turbopack_handle_async_dependencies__, __turbopack_async_result__) => { try {

__turbopack_context__.s([
    "GET",
    ()=>GET,
    "PATCH",
    ()=>PATCH,
    "dynamic",
    ()=>dynamic
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/server.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$services$2f$notification$2e$service$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/services/notification.service.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$services$2f$auth$2e$service$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/services/auth.service.ts [app-route] (ecmascript)");
var __turbopack_async_dependencies__ = __turbopack_handle_async_dependencies__([
    __TURBOPACK__imported__module__$5b$project$5d2f$services$2f$notification$2e$service$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__,
    __TURBOPACK__imported__module__$5b$project$5d2f$services$2f$auth$2e$service$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__
]);
[__TURBOPACK__imported__module__$5b$project$5d2f$services$2f$notification$2e$service$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__, __TURBOPACK__imported__module__$5b$project$5d2f$services$2f$auth$2e$service$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__] = __turbopack_async_dependencies__.then ? (await __turbopack_async_dependencies__)() : __turbopack_async_dependencies__;
;
;
;
const dynamic = 'force-dynamic';
async function GET(request) {
    try {
        const token = request.cookies.get('auth-token')?.value;
        if (!token) return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            success: false,
            error: 'Unauthorized'
        }, {
            status: 401
        });
        const payload = __TURBOPACK__imported__module__$5b$project$5d2f$services$2f$auth$2e$service$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["authService"].verifyToken(token);
        if (!payload) return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            success: false,
            error: 'Invalid token'
        }, {
            status: 401
        });
        // Trigger alert checks (lazy evaluation)
        // In a scaled system, this should be a background job, but for now this ensures responsiveness
        await __turbopack_context__.A("[project]/services/alert.service.ts [app-route] (ecmascript, async loader)").then((m)=>m.alertService.checkLowStock());
        const notifications = await __TURBOPACK__imported__module__$5b$project$5d2f$services$2f$notification$2e$service$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["notificationService"].getUserNotifications(payload.userId);
        const unreadCount = await __TURBOPACK__imported__module__$5b$project$5d2f$services$2f$notification$2e$service$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["notificationService"].getUnreadCount(payload.userId);
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            success: true,
            data: {
                notifications,
                unreadCount
            }
        });
    } catch (error) {
        console.error('Error fetching notifications:', error);
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            success: false,
            error: 'Failed to fetch notifications'
        }, {
            status: 500
        });
    }
}
async function PATCH(request) {
    try {
        const token = request.cookies.get('auth-token')?.value;
        if (!token) return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            success: false,
            error: 'Unauthorized'
        }, {
            status: 401
        });
        const payload = __TURBOPACK__imported__module__$5b$project$5d2f$services$2f$auth$2e$service$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["authService"].verifyToken(token);
        if (!payload) return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            success: false,
            error: 'Invalid token'
        }, {
            status: 401
        });
        const body = await request.json();
        const { id, markAll } = body;
        if (markAll) {
            await __TURBOPACK__imported__module__$5b$project$5d2f$services$2f$notification$2e$service$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["notificationService"].markAllAsRead(payload.userId);
        } else if (id) {
            await __TURBOPACK__imported__module__$5b$project$5d2f$services$2f$notification$2e$service$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["notificationService"].markAsRead(id);
        }
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            success: true
        });
    } catch (error) {
        console.error('Error updating notification:', error);
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            success: false,
            error: 'Failed'
        }, {
            status: 500
        });
    }
}
__turbopack_async_result__();
} catch(e) { __turbopack_async_result__(e); } }, false);}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__2ba47b58._.js.map
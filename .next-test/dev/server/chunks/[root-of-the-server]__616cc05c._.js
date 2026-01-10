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
"[project]/app/api/dev/seed/route.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

return __turbopack_context__.a(async (__turbopack_handle_async_dependencies__, __turbopack_async_result__) => { try {

__turbopack_context__.s([
    "POST",
    ()=>POST,
    "dynamic",
    ()=>dynamic
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/server.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$prisma$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/lib/prisma.ts [app-route] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$externals$5d2f$crypto__$5b$external$5d$__$28$crypto$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/crypto [external] (crypto, cjs)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$bcryptjs$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/bcryptjs/index.js [app-route] (ecmascript)");
var __turbopack_async_dependencies__ = __turbopack_handle_async_dependencies__([
    __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$prisma$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__
]);
[__TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$prisma$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__] = __turbopack_async_dependencies__.then ? (await __turbopack_async_dependencies__)() : __turbopack_async_dependencies__;
;
;
;
;
const dynamic = 'force-dynamic';
async function POST(req) {
    try {
        // Create Roles
        const roles = [
            {
                name: 'Super Admin',
                description: 'Full system access',
                isSystem: true
            },
            {
                name: 'Branch Manager',
                description: 'Manage branch operations',
                isSystem: true
            },
            {
                name: 'Cashier',
                description: 'Handle POS transactions',
                isSystem: true
            },
            {
                name: 'Warehouse Staff',
                description: 'Manage inventory',
                isSystem: true
            },
            {
                name: 'Accountant',
                description: 'Manage finances',
                isSystem: true
            }
        ];
        for (const role of roles){
            await __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$prisma$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["prisma"].role.upsert({
                where: {
                    name: role.name
                },
                update: {
                    updatedAt: new Date()
                },
                create: {
                    id: (0, __TURBOPACK__imported__module__$5b$externals$5d2f$crypto__$5b$external$5d$__$28$crypto$2c$__cjs$29$__["randomUUID"])(),
                    ...role,
                    updatedAt: new Date()
                }
            });
        }
        // Create Admin User
        const superAdminRole = await __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$prisma$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["prisma"].role.findUnique({
            where: {
                name: 'Super Admin'
            }
        });
        if (superAdminRole) {
            const passwordHash = await __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$bcryptjs$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["default"].hash('Qweasd1234', 12);
            await __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$prisma$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["prisma"].user.upsert({
                where: {
                    email: 'cybergada@gmail.com'
                },
                update: {
                    updatedAt: new Date(),
                    isSuperMegaAdmin: true,
                    passwordHash
                },
                create: {
                    id: (0, __TURBOPACK__imported__module__$5b$externals$5d2f$crypto__$5b$external$5d$__$28$crypto$2c$__cjs$29$__["randomUUID"])(),
                    email: 'cybergada@gmail.com',
                    passwordHash,
                    firstName: 'Cyber',
                    lastName: 'Gada',
                    roleId: superAdminRole.id,
                    status: 'ACTIVE',
                    emailVerified: true,
                    isSuperMegaAdmin: true,
                    updatedAt: new Date()
                }
            });
        }
        // Create Demo User for testing
        const branchManagerRole = await __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$prisma$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["prisma"].role.findUnique({
            where: {
                name: 'Branch Manager'
            }
        });
        if (branchManagerRole) {
            const demoPasswordHash = await __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$bcryptjs$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["default"].hash('Password123!', 12);
            await __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$prisma$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["prisma"].user.upsert({
                where: {
                    email: 'demo@example.com'
                },
                update: {
                    updatedAt: new Date()
                },
                create: {
                    id: (0, __TURBOPACK__imported__module__$5b$externals$5d2f$crypto__$5b$external$5d$__$28$crypto$2c$__cjs$29$__["randomUUID"])(),
                    email: 'demo@example.com',
                    passwordHash: demoPasswordHash,
                    firstName: 'Demo',
                    lastName: 'User',
                    roleId: branchManagerRole.id,
                    status: 'ACTIVE',
                    emailVerified: true,
                    updatedAt: new Date()
                }
            });
        }
        // Create or update branches
        const branchMain = await __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$prisma$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["prisma"].branch.upsert({
            where: {
                code: 'MNL-001'
            },
            update: {
                updatedAt: new Date()
            },
            create: {
                id: (0, __TURBOPACK__imported__module__$5b$externals$5d2f$crypto__$5b$external$5d$__$28$crypto$2c$__cjs$29$__["randomUUID"])(),
                name: 'Manila Main Branch',
                code: 'MNL-001',
                location: '123 Rizal Avenue, Manila',
                manager: 'Juan Dela Cruz',
                phone: '+63 2 1234 5678',
                status: 'active',
                updatedAt: new Date()
            }
        });
        const branchQC = await __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$prisma$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["prisma"].branch.upsert({
            where: {
                code: 'QC-001'
            },
            update: {
                updatedAt: new Date()
            },
            create: {
                id: (0, __TURBOPACK__imported__module__$5b$externals$5d2f$crypto__$5b$external$5d$__$28$crypto$2c$__cjs$29$__["randomUUID"])(),
                name: 'Quezon City Branch',
                code: 'QC-001',
                location: '456 Commonwealth Avenue, Quezon City',
                manager: 'Maria Santos',
                phone: '+63 2 8765 4321',
                status: 'active',
                updatedAt: new Date()
            }
        });
        // Warehouses
        let whManila = await __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$prisma$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["prisma"].warehouse.findFirst({
            where: {
                name: 'Manila Central Warehouse',
                branchId: branchMain.id
            }
        });
        if (whManila) {
            whManila = await __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$prisma$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["prisma"].warehouse.update({
                where: {
                    id: whManila.id
                },
                data: {
                    updatedAt: new Date()
                }
            });
        } else {
            whManila = await __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$prisma$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["prisma"].warehouse.create({
                data: {
                    id: (0, __TURBOPACK__imported__module__$5b$externals$5d2f$crypto__$5b$external$5d$__$28$crypto$2c$__cjs$29$__["randomUUID"])(),
                    name: 'Manila Central Warehouse',
                    location: '789 Port Area, Manila',
                    manager: 'Pedro Garcia',
                    maxCapacity: 100000,
                    branchId: branchMain.id,
                    updatedAt: new Date()
                }
            });
        }
        let whQC = await __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$prisma$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["prisma"].warehouse.findFirst({
            where: {
                name: 'QC Storage Facility',
                branchId: branchQC.id
            }
        });
        if (whQC) {
            whQC = await __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$prisma$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["prisma"].warehouse.update({
                where: {
                    id: whQC.id
                },
                data: {
                    updatedAt: new Date()
                }
            });
        } else {
            whQC = await __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$prisma$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["prisma"].warehouse.create({
                data: {
                    id: (0, __TURBOPACK__imported__module__$5b$externals$5d2f$crypto__$5b$external$5d$__$28$crypto$2c$__cjs$29$__["randomUUID"])(),
                    name: 'QC Storage Facility',
                    location: '321 Mindanao Avenue, Quezon City',
                    manager: 'Ana Reyes',
                    maxCapacity: 75000,
                    branchId: branchQC.id,
                    updatedAt: new Date()
                }
            });
        }
        // Supplier
        let supplier = await __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$prisma$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["prisma"].supplier.findFirst({
            where: {
                companyName: 'Absolute Beverage Supply'
            }
        });
        if (supplier) {
            supplier = await __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$prisma$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["prisma"].supplier.update({
                where: {
                    id: supplier.id
                },
                data: {
                    status: 'active',
                    updatedAt: new Date()
                }
            });
        } else {
            supplier = await __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$prisma$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["prisma"].supplier.create({
                data: {
                    id: (0, __TURBOPACK__imported__module__$5b$externals$5d2f$crypto__$5b$external$5d$__$28$crypto$2c$__cjs$29$__["randomUUID"])(),
                    companyName: 'Absolute Beverage Supply',
                    contactPerson: 'Carlos D.',
                    phone: '+63 917 555 1212',
                    email: 'absupply@example.com',
                    paymentTerms: 'Net 30',
                    status: 'active',
                    updatedAt: new Date()
                }
            });
        }
        // Product Categories
        const categories = [
            'Water',
            'Carbonated',
            'Juice',
            'Alcohol'
        ];
        for (const catName of categories){
            const code = catName.toUpperCase().substring(0, 3);
            await __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$prisma$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["prisma"].productCategory.upsert({
                where: {
                    name: catName
                },
                update: {
                    updatedAt: new Date()
                },
                create: {
                    id: (0, __TURBOPACK__imported__module__$5b$externals$5d2f$crypto__$5b$external$5d$__$28$crypto$2c$__cjs$29$__["randomUUID"])(),
                    name: catName,
                    code: code,
                    description: `${catName} products`,
                    status: 'active',
                    updatedAt: new Date()
                }
            });
        }
        // Products
        let pWater = await __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$prisma$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["prisma"].product.findFirst({
            where: {
                name: 'Absolute 500ml Bottle'
            }
        });
        if (pWater) {
            pWater = await __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$prisma$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["prisma"].product.update({
                where: {
                    id: pWater.id
                },
                data: {
                    updatedAt: new Date()
                }
            });
        } else {
            pWater = await __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$prisma$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["prisma"].product.create({
                data: {
                    id: (0, __TURBOPACK__imported__module__$5b$externals$5d2f$crypto__$5b$external$5d$__$28$crypto$2c$__cjs$29$__["randomUUID"])(),
                    name: 'Absolute 500ml Bottle',
                    description: 'Purified distilled water 500ml',
                    category: 'Water',
                    baseUOM: 'bottle',
                    basePrice: 15,
                    minStockLevel: 600,
                    shelfLifeDays: 730,
                    status: 'active',
                    updatedAt: new Date()
                }
            });
        }
        let pSoda = await __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$prisma$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["prisma"].product.findFirst({
            where: {
                name: 'Soda 12oz Can'
            }
        });
        if (pSoda) {
            pSoda = await __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$prisma$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["prisma"].product.update({
                where: {
                    id: pSoda.id
                },
                data: {
                    updatedAt: new Date()
                }
            });
        } else {
            pSoda = await __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$prisma$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["prisma"].product.create({
                data: {
                    id: (0, __TURBOPACK__imported__module__$5b$externals$5d2f$crypto__$5b$external$5d$__$28$crypto$2c$__cjs$29$__["randomUUID"])(),
                    name: 'Soda 12oz Can',
                    description: 'Carbonated drink 12oz can',
                    category: 'Carbonated',
                    baseUOM: 'can',
                    basePrice: 18,
                    minStockLevel: 500,
                    shelfLifeDays: 540,
                    status: 'active',
                    updatedAt: new Date()
                }
            });
        }
        // Create or update inventory records
        const now = new Date();
        await __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$prisma$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["prisma"].inventory.upsert({
            where: {
                productId_warehouseId: {
                    productId: pWater.id,
                    warehouseId: whManila.id
                }
            },
            update: {
                quantity: 5000,
                updatedAt: now
            },
            create: {
                id: (0, __TURBOPACK__imported__module__$5b$externals$5d2f$crypto__$5b$external$5d$__$28$crypto$2c$__cjs$29$__["randomUUID"])(),
                productId: pWater.id,
                warehouseId: whManila.id,
                quantity: 5000,
                updatedAt: now
            }
        });
        await __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$prisma$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["prisma"].inventory.upsert({
            where: {
                productId_warehouseId: {
                    productId: pWater.id,
                    warehouseId: whQC.id
                }
            },
            update: {
                quantity: 3750,
                updatedAt: now
            },
            create: {
                id: (0, __TURBOPACK__imported__module__$5b$externals$5d2f$crypto__$5b$external$5d$__$28$crypto$2c$__cjs$29$__["randomUUID"])(),
                productId: pWater.id,
                warehouseId: whQC.id,
                quantity: 3750,
                updatedAt: now
            }
        });
        await __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$prisma$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["prisma"].inventory.upsert({
            where: {
                productId_warehouseId: {
                    productId: pSoda.id,
                    warehouseId: whManila.id
                }
            },
            update: {
                quantity: 4000,
                updatedAt: now
            },
            create: {
                id: (0, __TURBOPACK__imported__module__$5b$externals$5d2f$crypto__$5b$external$5d$__$28$crypto$2c$__cjs$29$__["randomUUID"])(),
                productId: pSoda.id,
                warehouseId: whManila.id,
                quantity: 4000,
                updatedAt: now
            }
        });
        // Update product average cost prices
        await __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$prisma$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["prisma"].product.update({
            where: {
                id: pWater.id
            },
            data: {
                averageCostPrice: 12
            }
        });
        await __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$prisma$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["prisma"].product.update({
            where: {
                id: pSoda.id
            },
            data: {
                averageCostPrice: 14
            }
        });
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            success: true,
            data: {
                branches: [
                    branchMain,
                    branchQC
                ],
                warehouses: [
                    whManila,
                    whQC
                ],
                supplier,
                products: [
                    pWater,
                    pSoda
                ]
            }
        }, {
            status: 201
        });
    } catch (error) {
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            success: false,
            message: String(error?.message || 'Seed error')
        }, {
            status: 500
        });
    }
}
__turbopack_async_result__();
} catch(e) { __turbopack_async_result__(e); } }, false);}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__616cc05c._.js.map
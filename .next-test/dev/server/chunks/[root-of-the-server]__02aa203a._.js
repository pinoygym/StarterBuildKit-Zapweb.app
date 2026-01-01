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
"[project]/Documents/GitHub/buenasv2/repositories/branch.repository.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

return __turbopack_context__.a(async (__turbopack_handle_async_dependencies__, __turbopack_async_result__) => { try {

__turbopack_context__.s([
    "BranchRepository",
    ()=>BranchRepository,
    "branchRepository",
    ()=>branchRepository
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$Documents$2f$GitHub$2f$buenasv2$2f$lib$2f$prisma$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/Documents/GitHub/buenasv2/lib/prisma.ts [app-route] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$externals$5d2f$crypto__$5b$external$5d$__$28$crypto$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/crypto [external] (crypto, cjs)");
var __turbopack_async_dependencies__ = __turbopack_handle_async_dependencies__([
    __TURBOPACK__imported__module__$5b$project$5d2f$Documents$2f$GitHub$2f$buenasv2$2f$lib$2f$prisma$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__
]);
[__TURBOPACK__imported__module__$5b$project$5d2f$Documents$2f$GitHub$2f$buenasv2$2f$lib$2f$prisma$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__] = __turbopack_async_dependencies__.then ? (await __turbopack_async_dependencies__)() : __turbopack_async_dependencies__;
;
;
class BranchRepository {
    async findAll() {
        return await __TURBOPACK__imported__module__$5b$project$5d2f$Documents$2f$GitHub$2f$buenasv2$2f$lib$2f$prisma$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["prisma"].branch.findMany({
            orderBy: {
                name: 'asc'
            }
        });
    }
    async findById(id) {
        return await __TURBOPACK__imported__module__$5b$project$5d2f$Documents$2f$GitHub$2f$buenasv2$2f$lib$2f$prisma$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["prisma"].branch.findUnique({
            where: {
                id
            }
        });
    }
    async findByCode(code) {
        return await __TURBOPACK__imported__module__$5b$project$5d2f$Documents$2f$GitHub$2f$buenasv2$2f$lib$2f$prisma$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["prisma"].branch.findUnique({
            where: {
                code
            }
        });
    }
    async create(data) {
        return await __TURBOPACK__imported__module__$5b$project$5d2f$Documents$2f$GitHub$2f$buenasv2$2f$lib$2f$prisma$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["prisma"].branch.create({
            data: {
                id: (0, __TURBOPACK__imported__module__$5b$externals$5d2f$crypto__$5b$external$5d$__$28$crypto$2c$__cjs$29$__["randomUUID"])(),
                name: data.name,
                code: data.code,
                location: data.location,
                manager: data.manager,
                phone: data.phone,
                status: data.status || 'active',
                updatedAt: new Date()
            }
        });
    }
    async update(id, data) {
        return await __TURBOPACK__imported__module__$5b$project$5d2f$Documents$2f$GitHub$2f$buenasv2$2f$lib$2f$prisma$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["prisma"].branch.update({
            where: {
                id
            },
            data
        });
    }
    async delete(id) {
        return await __TURBOPACK__imported__module__$5b$project$5d2f$Documents$2f$GitHub$2f$buenasv2$2f$lib$2f$prisma$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["prisma"].branch.delete({
            where: {
                id
            }
        });
    }
    async findActive() {
        return await __TURBOPACK__imported__module__$5b$project$5d2f$Documents$2f$GitHub$2f$buenasv2$2f$lib$2f$prisma$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["prisma"].branch.findMany({
            where: {
                status: 'active'
            },
            orderBy: {
                name: 'asc'
            }
        });
    }
}
const branchRepository = new BranchRepository();
__turbopack_async_result__();
} catch(e) { __turbopack_async_result__(e); } }, false);}),
"[project]/Documents/GitHub/buenasv2/lib/errors.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

/**
 * Centralized Error Handling for InventoryPro
 * Consolidates all custom error classes and utilities
 */ __turbopack_context__.s([
    "AppError",
    ()=>AppError,
    "ConflictError",
    ()=>ConflictError,
    "DatabaseError",
    ()=>DatabaseError,
    "ErrorCode",
    ()=>ErrorCode,
    "ForbiddenError",
    ()=>ForbiddenError,
    "InsufficientStockError",
    ()=>InsufficientStockError,
    "NotFoundError",
    ()=>NotFoundError,
    "UnauthorizedError",
    ()=>UnauthorizedError,
    "ValidationError",
    ()=>ValidationError,
    "handlePrismaError",
    ()=>handlePrismaError,
    "withErrorHandling",
    ()=>withErrorHandling
]);
var __TURBOPACK__imported__module__$5b$externals$5d2f40$prisma$2f$client__$5b$external$5d$__$2840$prisma$2f$client$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/@prisma/client [external] (@prisma/client, cjs)");
;
var ErrorCode = /*#__PURE__*/ function(ErrorCode) {
    // Client Errors (4xx)
    ErrorCode["BAD_REQUEST"] = "BAD_REQUEST";
    ErrorCode["UNAUTHORIZED"] = "UNAUTHORIZED";
    ErrorCode["FORBIDDEN"] = "FORBIDDEN";
    ErrorCode["NOT_FOUND"] = "NOT_FOUND";
    ErrorCode["CONFLICT"] = "CONFLICT";
    ErrorCode["VALIDATION_ERROR"] = "VALIDATION_ERROR";
    // Server Errors (5xx)
    ErrorCode["INTERNAL_SERVER_ERROR"] = "INTERNAL_SERVER_ERROR";
    ErrorCode["DATABASE_ERROR"] = "DATABASE_ERROR";
    ErrorCode["EXTERNAL_SERVICE_ERROR"] = "EXTERNAL_SERVICE_ERROR";
    // Business Logic Errors
    ErrorCode["INSUFFICIENT_STOCK"] = "INSUFFICIENT_STOCK";
    ErrorCode["DUPLICATE_ENTRY"] = "DUPLICATE_ENTRY";
    ErrorCode["INVALID_OPERATION"] = "INVALID_OPERATION";
    return ErrorCode;
}({});
class AppError extends Error {
    statusCode;
    code;
    isOperational;
    details;
    constructor(message, statusCode = 500, code = "INTERNAL_SERVER_ERROR", isOperational = true, details){
        super(message);
        Object.setPrototypeOf(this, new.target.prototype);
        this.statusCode = statusCode;
        this.code = code;
        this.isOperational = isOperational;
        this.details = details;
        this.name = this.constructor.name;
        Error.captureStackTrace(this);
    }
}
class ValidationError extends AppError {
    fields;
    constructor(message, fields){
        super(message, 400, "VALIDATION_ERROR", true, fields), this.fields = fields;
    }
}
class NotFoundError extends AppError {
    constructor(resource, identifier){
        const message = identifier ? `${resource} with identifier '${identifier}' not found` : `${resource} not found`;
        super(message, 404, "NOT_FOUND", true);
    }
}
class ConflictError extends AppError {
    constructor(message, details){
        super(message, 409, "CONFLICT", true, details);
    }
}
class DatabaseError extends AppError {
    constructor(message, details){
        super(message, 500, "DATABASE_ERROR", true, details);
    }
}
class InsufficientStockError extends AppError {
    constructor(productName, available, requested){
        super(`Insufficient stock for ${productName}. Available: ${available}, Requested: ${requested}`, 400, "INSUFFICIENT_STOCK", true, {
            productName,
            available,
            requested
        });
    }
}
class UnauthorizedError extends AppError {
    constructor(message = 'Unauthorized access'){
        super(message, 401, "UNAUTHORIZED", true);
    }
}
class ForbiddenError extends AppError {
    constructor(message = 'Access forbidden'){
        super(message, 403, "FORBIDDEN", true);
    }
}
function handlePrismaError(error, context) {
    // Log the original error for debugging
    console.error('===== PRISMA ERROR =====');
    console.error('Context:', context);
    console.error('Error:', error);
    if (error instanceof Error) {
        console.error('Message:', error.message);
        console.error('Stack:', error.stack);
    }
    if (error instanceof __TURBOPACK__imported__module__$5b$externals$5d2f40$prisma$2f$client__$5b$external$5d$__$2840$prisma$2f$client$2c$__cjs$29$__["Prisma"].PrismaClientKnownRequestError) {
        console.error('Prisma Code:', error.code);
        console.error('Prisma Meta:', error.meta);
    }
    console.error('========================');
    // Prisma Client Known Request Error (e.g., unique constraint, foreign key)
    if (error instanceof __TURBOPACK__imported__module__$5b$externals$5d2f40$prisma$2f$client__$5b$external$5d$__$2840$prisma$2f$client$2c$__cjs$29$__["Prisma"].PrismaClientKnownRequestError) {
        switch(error.code){
            case 'P2002':
                {
                    // Unique constraint violation
                    const target = error.meta?.target || [];
                    const field = target[0] || 'field';
                    return new ConflictError(`A record with this ${field} already exists`, {
                        field,
                        code: error.code
                    });
                }
            case 'P2003':
                {
                    // Foreign key constraint violation
                    const field = error.meta?.field_name;
                    // If operation is delete, it means record is in use
                    if (context && (context.toLowerCase().includes('delete') || context.toLowerCase().includes('remove'))) {
                        return new ConflictError(`Cannot delete record because it is referenced by other data (Constraint: ${field || 'unknown'})`, {
                            field,
                            code: error.code
                        });
                    }
                    return new ValidationError(`Invalid reference: ${field || 'related record'} does not exist`, {
                        [field || 'reference']: 'Referenced record not found'
                    });
                }
            case 'P2025':
                {
                    // Record not found
                    return new NotFoundError('Record');
                }
            case 'P2014':
                {
                    // Required relation violation
                    return new ValidationError('Required relationship is missing', {
                        relation: 'Required related record is missing'
                    });
                }
            default:
                {
                    return new DatabaseError(`Database operation failed: ${error.code} - ${error.message}`, {
                        code: error.code,
                        meta: error.meta
                    });
                }
        }
    }
    // Prisma Client Validation Error (e.g., invalid query)
    if (error instanceof __TURBOPACK__imported__module__$5b$externals$5d2f40$prisma$2f$client__$5b$external$5d$__$2840$prisma$2f$client$2c$__cjs$29$__["Prisma"].PrismaClientValidationError) {
        return new ValidationError(`Invalid data provided to database: ${error.message}`);
    }
    // Prisma Client Initialization Error
    if (error instanceof __TURBOPACK__imported__module__$5b$externals$5d2f40$prisma$2f$client__$5b$external$5d$__$2840$prisma$2f$client$2c$__cjs$29$__["Prisma"].PrismaClientInitializationError) {
        return new DatabaseError('Database connection failed', {
            code: error.errorCode
        });
    }
    // Prisma Client Rust Panic Error
    if (error instanceof __TURBOPACK__imported__module__$5b$externals$5d2f40$prisma$2f$client__$5b$external$5d$__$2840$prisma$2f$client$2c$__cjs$29$__["Prisma"].PrismaClientRustPanicError) {
        return new DatabaseError('Database engine error', {
            message: error.message
        });
    }
    // If it's already an AppError, return it
    if (error instanceof AppError) {
        return error;
    }
    // Unknown error
    return new AppError(error instanceof Error ? error.message : 'An unexpected error occurred', 500, "INTERNAL_SERVER_ERROR", false);
}
async function withErrorHandling(operation, context) {
    try {
        return await operation();
    } catch (error) {
        const appError = handlePrismaError(error, context);
        // Add context if provided
        if (context && appError.details) {
            appError.details.context = context;
        }
        throw appError;
    }
}
}),
"[project]/Documents/GitHub/buenasv2/lib/validations/branch.validation.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "branchSchema",
    ()=>branchSchema,
    "updateBranchSchema",
    ()=>updateBranchSchema
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$Documents$2f$GitHub$2f$buenasv2$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__ = __turbopack_context__.i("[project]/Documents/GitHub/buenasv2/node_modules/zod/v3/external.js [app-route] (ecmascript) <export * as z>");
;
const branchSchema = __TURBOPACK__imported__module__$5b$project$5d2f$Documents$2f$GitHub$2f$buenasv2$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object({
    name: __TURBOPACK__imported__module__$5b$project$5d2f$Documents$2f$GitHub$2f$buenasv2$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().min(1, 'Branch name is required').max(100, 'Branch name is too long'),
    code: __TURBOPACK__imported__module__$5b$project$5d2f$Documents$2f$GitHub$2f$buenasv2$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().min(1, 'Branch code is required').max(20, 'Branch code is too long'),
    location: __TURBOPACK__imported__module__$5b$project$5d2f$Documents$2f$GitHub$2f$buenasv2$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().min(1, 'Location is required').max(200, 'Location is too long'),
    manager: __TURBOPACK__imported__module__$5b$project$5d2f$Documents$2f$GitHub$2f$buenasv2$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().min(1, 'Manager name is required').max(100, 'Manager name is too long'),
    phone: __TURBOPACK__imported__module__$5b$project$5d2f$Documents$2f$GitHub$2f$buenasv2$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().min(1, 'Phone number is required').regex(/^[0-9+\-\s()]+$/, 'Invalid phone number format'),
    status: __TURBOPACK__imported__module__$5b$project$5d2f$Documents$2f$GitHub$2f$buenasv2$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].enum([
        'active',
        'inactive'
    ]).optional().default('active')
});
const updateBranchSchema = branchSchema.partial();
}),
"[project]/Documents/GitHub/buenasv2/services/branch.service.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

return __turbopack_context__.a(async (__turbopack_handle_async_dependencies__, __turbopack_async_result__) => { try {

__turbopack_context__.s([
    "BranchService",
    ()=>BranchService,
    "branchService",
    ()=>branchService
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$Documents$2f$GitHub$2f$buenasv2$2f$repositories$2f$branch$2e$repository$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Documents/GitHub/buenasv2/repositories/branch.repository.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Documents$2f$GitHub$2f$buenasv2$2f$lib$2f$errors$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Documents/GitHub/buenasv2/lib/errors.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Documents$2f$GitHub$2f$buenasv2$2f$lib$2f$validations$2f$branch$2e$validation$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Documents/GitHub/buenasv2/lib/validations/branch.validation.ts [app-route] (ecmascript)");
var __turbopack_async_dependencies__ = __turbopack_handle_async_dependencies__([
    __TURBOPACK__imported__module__$5b$project$5d2f$Documents$2f$GitHub$2f$buenasv2$2f$repositories$2f$branch$2e$repository$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__
]);
[__TURBOPACK__imported__module__$5b$project$5d2f$Documents$2f$GitHub$2f$buenasv2$2f$repositories$2f$branch$2e$repository$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__] = __turbopack_async_dependencies__.then ? (await __turbopack_async_dependencies__)() : __turbopack_async_dependencies__;
;
;
;
class BranchService {
    async getAllBranches() {
        return await __TURBOPACK__imported__module__$5b$project$5d2f$Documents$2f$GitHub$2f$buenasv2$2f$repositories$2f$branch$2e$repository$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["branchRepository"].findAll();
    }
    async getBranchById(id) {
        const branch = await __TURBOPACK__imported__module__$5b$project$5d2f$Documents$2f$GitHub$2f$buenasv2$2f$repositories$2f$branch$2e$repository$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["branchRepository"].findById(id);
        if (!branch) {
            throw new __TURBOPACK__imported__module__$5b$project$5d2f$Documents$2f$GitHub$2f$buenasv2$2f$lib$2f$errors$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NotFoundError"]('Branch');
        }
        return branch;
    }
    async getActiveBranches() {
        return await __TURBOPACK__imported__module__$5b$project$5d2f$Documents$2f$GitHub$2f$buenasv2$2f$repositories$2f$branch$2e$repository$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["branchRepository"].findActive();
    }
    async createBranch(data) {
        // Validate input
        const validationResult = __TURBOPACK__imported__module__$5b$project$5d2f$Documents$2f$GitHub$2f$buenasv2$2f$lib$2f$validations$2f$branch$2e$validation$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["branchSchema"].safeParse(data);
        if (!validationResult.success) {
            const errors = validationResult.error.flatten().fieldErrors;
            throw new __TURBOPACK__imported__module__$5b$project$5d2f$Documents$2f$GitHub$2f$buenasv2$2f$lib$2f$errors$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["ValidationError"]('Invalid branch data', errors);
        }
        // Check if branch code already exists
        const existingBranch = await __TURBOPACK__imported__module__$5b$project$5d2f$Documents$2f$GitHub$2f$buenasv2$2f$repositories$2f$branch$2e$repository$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["branchRepository"].findByCode(data.code);
        if (existingBranch) {
            throw new __TURBOPACK__imported__module__$5b$project$5d2f$Documents$2f$GitHub$2f$buenasv2$2f$lib$2f$errors$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["ValidationError"]('Branch code already exists', {
                code: 'Branch code must be unique'
            });
        }
        return await __TURBOPACK__imported__module__$5b$project$5d2f$Documents$2f$GitHub$2f$buenasv2$2f$repositories$2f$branch$2e$repository$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["branchRepository"].create(validationResult.data);
    }
    async updateBranch(id, data) {
        // Check if branch exists
        const existingBranch = await __TURBOPACK__imported__module__$5b$project$5d2f$Documents$2f$GitHub$2f$buenasv2$2f$repositories$2f$branch$2e$repository$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["branchRepository"].findById(id);
        if (!existingBranch) {
            throw new __TURBOPACK__imported__module__$5b$project$5d2f$Documents$2f$GitHub$2f$buenasv2$2f$lib$2f$errors$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NotFoundError"]('Branch');
        }
        // Validate input
        const validationResult = __TURBOPACK__imported__module__$5b$project$5d2f$Documents$2f$GitHub$2f$buenasv2$2f$lib$2f$validations$2f$branch$2e$validation$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["updateBranchSchema"].safeParse(data);
        if (!validationResult.success) {
            const errors = validationResult.error.flatten().fieldErrors;
            throw new __TURBOPACK__imported__module__$5b$project$5d2f$Documents$2f$GitHub$2f$buenasv2$2f$lib$2f$errors$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["ValidationError"]('Invalid branch data', errors);
        }
        // Check if branch code is being updated and if it already exists
        if (data.code && data.code !== existingBranch.code) {
            const branchWithCode = await __TURBOPACK__imported__module__$5b$project$5d2f$Documents$2f$GitHub$2f$buenasv2$2f$repositories$2f$branch$2e$repository$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["branchRepository"].findByCode(data.code);
            if (branchWithCode) {
                throw new __TURBOPACK__imported__module__$5b$project$5d2f$Documents$2f$GitHub$2f$buenasv2$2f$lib$2f$errors$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["ValidationError"]('Branch code already exists', {
                    code: 'Branch code must be unique'
                });
            }
        }
        return await __TURBOPACK__imported__module__$5b$project$5d2f$Documents$2f$GitHub$2f$buenasv2$2f$repositories$2f$branch$2e$repository$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["branchRepository"].update(id, validationResult.data);
    }
    async deleteBranch(id) {
        // Check if branch exists
        const branch = await __TURBOPACK__imported__module__$5b$project$5d2f$Documents$2f$GitHub$2f$buenasv2$2f$repositories$2f$branch$2e$repository$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["branchRepository"].findById(id);
        if (!branch) {
            throw new __TURBOPACK__imported__module__$5b$project$5d2f$Documents$2f$GitHub$2f$buenasv2$2f$lib$2f$errors$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NotFoundError"]('Branch');
        }
        // Note: In a production system, you might want to check for related records
        // and prevent deletion if there are warehouses, orders, etc. linked to this branch
        // For now, we'll allow deletion (Prisma will handle cascade rules)
        await __TURBOPACK__imported__module__$5b$project$5d2f$Documents$2f$GitHub$2f$buenasv2$2f$repositories$2f$branch$2e$repository$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["branchRepository"].delete(id);
    }
    async toggleBranchStatus(id) {
        const branch = await this.getBranchById(id);
        const newStatus = branch.status === 'active' ? 'inactive' : 'active';
        return await this.updateBranch(id, {
            status: newStatus
        });
    }
}
const branchService = new BranchService();
__turbopack_async_result__();
} catch(e) { __turbopack_async_result__(e); } }, false);}),
"[project]/Documents/GitHub/buenasv2/app/api/branches/route.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

return __turbopack_context__.a(async (__turbopack_handle_async_dependencies__, __turbopack_async_result__) => { try {

__turbopack_context__.s([
    "GET",
    ()=>GET,
    "POST",
    ()=>POST,
    "dynamic",
    ()=>dynamic
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$Documents$2f$GitHub$2f$buenasv2$2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Documents/GitHub/buenasv2/node_modules/next/server.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Documents$2f$GitHub$2f$buenasv2$2f$services$2f$branch$2e$service$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Documents/GitHub/buenasv2/services/branch.service.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Documents$2f$GitHub$2f$buenasv2$2f$lib$2f$errors$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Documents/GitHub/buenasv2/lib/errors.ts [app-route] (ecmascript)");
var __turbopack_async_dependencies__ = __turbopack_handle_async_dependencies__([
    __TURBOPACK__imported__module__$5b$project$5d2f$Documents$2f$GitHub$2f$buenasv2$2f$services$2f$branch$2e$service$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__
]);
[__TURBOPACK__imported__module__$5b$project$5d2f$Documents$2f$GitHub$2f$buenasv2$2f$services$2f$branch$2e$service$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__] = __turbopack_async_dependencies__.then ? (await __turbopack_async_dependencies__)() : __turbopack_async_dependencies__;
;
;
;
const dynamic = 'force-dynamic';
async function GET() {
    try {
        const branches = await __TURBOPACK__imported__module__$5b$project$5d2f$Documents$2f$GitHub$2f$buenasv2$2f$services$2f$branch$2e$service$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["branchService"].getAllBranches();
        return __TURBOPACK__imported__module__$5b$project$5d2f$Documents$2f$GitHub$2f$buenasv2$2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            success: true,
            data: branches
        });
    } catch (error) {
        console.error('Error fetching branches:', error);
        if (error instanceof __TURBOPACK__imported__module__$5b$project$5d2f$Documents$2f$GitHub$2f$buenasv2$2f$lib$2f$errors$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["AppError"]) {
            return __TURBOPACK__imported__module__$5b$project$5d2f$Documents$2f$GitHub$2f$buenasv2$2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                success: false,
                error: error.message
            }, {
                status: error.statusCode
            });
        }
        return __TURBOPACK__imported__module__$5b$project$5d2f$Documents$2f$GitHub$2f$buenasv2$2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            success: false,
            error: 'Failed to fetch branches'
        }, {
            status: 500
        });
    }
}
async function POST(request) {
    try {
        const body = await request.json();
        console.log('Branch creation request body:', body);
        const branch = await __TURBOPACK__imported__module__$5b$project$5d2f$Documents$2f$GitHub$2f$buenasv2$2f$services$2f$branch$2e$service$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["branchService"].createBranch(body);
        return __TURBOPACK__imported__module__$5b$project$5d2f$Documents$2f$GitHub$2f$buenasv2$2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            success: true,
            data: branch
        }, {
            status: 201
        });
    } catch (error) {
        console.error('Error creating branch:', error);
        console.error('Error details:', error instanceof Error ? error.message : error);
        if (error instanceof __TURBOPACK__imported__module__$5b$project$5d2f$Documents$2f$GitHub$2f$buenasv2$2f$lib$2f$errors$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["AppError"]) {
            return __TURBOPACK__imported__module__$5b$project$5d2f$Documents$2f$GitHub$2f$buenasv2$2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                success: false,
                error: error.message,
                fields: error.fields
            }, {
                status: error.statusCode
            });
        }
        return __TURBOPACK__imported__module__$5b$project$5d2f$Documents$2f$GitHub$2f$buenasv2$2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            success: false,
            error: 'Failed to create branch'
        }, {
            status: 500
        });
    }
}
__turbopack_async_result__();
} catch(e) { __turbopack_async_result__(e); } }, false);}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__02aa203a._.js.map
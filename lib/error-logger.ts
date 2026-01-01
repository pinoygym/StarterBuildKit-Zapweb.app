/**
 * Error Logging Utility for InventoryPro
 * Provides centralized error logging with context and severity levels
 */

export enum LogLevel {
    ERROR = 'ERROR',
    WARN = 'WARN',
    INFO = 'INFO',
    DEBUG = 'DEBUG',
}

export interface ErrorContext {
    userId?: string;
    requestId?: string;
    path?: string;
    method?: string;
    timestamp?: Date;
    [key: string]: any;
}

export interface LogEntry {
    level: LogLevel;
    message: string;
    error?: Error;
    context?: ErrorContext;
    timestamp: Date;
}

/**
 * Sanitize sensitive data from objects before logging
 */
function sanitizeData(data: any): any {
    if (!data || typeof data !== 'object') {
        return data;
    }

    const sensitiveFields = [
        'password',
        'passwordHash',
        'token',
        'accessToken',
        'refreshToken',
        'secret',
        'apiKey',
        'creditCard',
        'ssn',
    ];

    const sanitized = Array.isArray(data) ? [...data] : { ...data };

    for (const key in sanitized) {
        const lowerKey = key.toLowerCase();

        // Check if field is sensitive
        if (sensitiveFields.some(field => lowerKey.includes(field))) {
            sanitized[key] = '[REDACTED]';
        } else if (typeof sanitized[key] === 'object' && sanitized[key] !== null) {
            // Recursively sanitize nested objects
            sanitized[key] = sanitizeData(sanitized[key]);
        }
    }

    return sanitized;
}

/**
 * Format error for logging
 */
function formatError(error: Error): any {
    return {
        name: error.name,
        message: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    };
}

/**
 * Error Logger Class
 */
export class ErrorLogger {
    /**
     * Log an error with context
     */
    static log(
        level: LogLevel,
        message: string,
        error?: Error,
        context?: ErrorContext
    ): void {
        const entry: LogEntry = {
            level,
            message,
            error,
            context: context ? sanitizeData(context) : undefined,
            timestamp: new Date(),
        };

        // In production, you might want to send this to an external logging service
        // For now, we'll use console with appropriate methods
        switch (level) {
            case LogLevel.ERROR:
                console.error('[ERROR]', message, {
                    error: error ? formatError(error) : undefined,
                    context: entry.context,
                    timestamp: entry.timestamp.toISOString(),
                });
                break;
            case LogLevel.WARN:
                console.warn('[WARN]', message, {
                    context: entry.context,
                    timestamp: entry.timestamp.toISOString(),
                });
                break;
            case LogLevel.INFO:
                console.info('[INFO]', message, {
                    context: entry.context,
                    timestamp: entry.timestamp.toISOString(),
                });
                break;
            case LogLevel.DEBUG:
                if (process.env.NODE_ENV === 'development') {
                    console.debug('[DEBUG]', message, {
                        context: entry.context,
                        timestamp: entry.timestamp.toISOString(),
                    });
                }
                break;
        }
    }

    /**
     * Log an error
     */
    static error(message: string, error?: Error, context?: ErrorContext): void {
        this.log(LogLevel.ERROR, message, error, context);
    }

    /**
     * Log a warning
     */
    static warn(message: string, context?: ErrorContext): void {
        this.log(LogLevel.WARN, message, undefined, context);
    }

    /**
     * Log info
     */
    static info(message: string, context?: ErrorContext): void {
        this.log(LogLevel.INFO, message, undefined, context);
    }

    /**
     * Log debug information (only in development)
     */
    static debug(message: string, context?: ErrorContext): void {
        this.log(LogLevel.DEBUG, message, undefined, context);
    }
}

/**
 * Helper function to create error context from request
 */
export function createErrorContext(
    request?: Request,
    additionalContext?: Record<string, any>
): ErrorContext {
    const context: ErrorContext = {
        timestamp: new Date(),
        ...additionalContext,
    };

    if (request) {
        const url = new URL(request.url);
        context.path = url.pathname;
        context.method = request.method;

        // Try to extract request ID if available
        const requestId = request.headers.get('x-request-id');
        if (requestId) {
            context.requestId = requestId;
        }
    }

    return context;
}

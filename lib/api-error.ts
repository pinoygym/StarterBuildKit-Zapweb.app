/**
 * API Error Handling Utilities
 * Provides error response formatting and async handler wrapper for API routes
 */

import { ZodError } from 'zod';
import {
  AppError,
  ErrorCode,
  ValidationError,
  handlePrismaError
} from './errors';
import { ErrorLogger, createErrorContext } from './error-logger';

/**
 * Error Response Interface
 */
export interface ErrorResponse {
  success: false;
  error: {
    code: ErrorCode;
    message: string;
    details?: any;
    fields?: Record<string, string | string[]>;
    stack?: string;
  };
}

/**
 * Format Zod validation errors into user-friendly messages
 */
function formatZodError(error: ZodError): { message: string; fields: Record<string, string[]> } {
  const fields: Record<string, string[]> = {};

  error.errors.forEach(err => {
    const path = err.path.join('.');
    const message = err.message;

    if (!fields[path]) {
      fields[path] = [];
    }
    fields[path].push(message);
  });

  return {
    message: 'Validation failed',
    fields,
  };
}

/**
 * Format error response for API
 */
export function formatErrorResponse(error: Error, includeStack: boolean = false): ErrorResponse {
  // Handle Zod validation errors
  if (error instanceof ZodError) {
    const { message, fields } = formatZodError(error);
    return {
      success: false,
      error: {
        code: ErrorCode.VALIDATION_ERROR,
        message,
        fields,
        ...(includeStack && { stack: error.stack }),
      },
    };
  }

  // Handle custom AppErrors
  if (error instanceof AppError) {
    return {
      success: false,
      error: {
        code: error.code,
        message: error.message,
        details: error.details,
        ...(includeStack && { stack: error.stack }),
      },
    };
  }

  // Handle Prisma errors
  if (error.constructor.name.includes('Prisma')) {
    const appError = handlePrismaError(error);
    return {
      success: false,
      error: {
        code: appError.code,
        message: appError.message,
        details: appError.details,
        ...(includeStack && { stack: error.stack }),
      },
    };
  }

  // Generic error
  return {
    success: false,
    error: {
      code: ErrorCode.INTERNAL_SERVER_ERROR,
      message: process.env.NODE_ENV === 'production'
        ? 'An unexpected error occurred'
        : error.message,
      ...(includeStack && { stack: error.stack }),
    },
  };
}

/**
 * Async Handler Wrapper for API Routes
 * Catches errors and formats them consistently
 * 
 * Usage:
 * export const GET = asyncHandler(async (request: Request) => {
 *   const data = await service.getData();
 *   return Response.json({ success: true, data });
 * });
 */
export function asyncHandler(
  handler: (req: Request, context?: any) => Promise<Response>
) {
  return async (req: Request, context?: any): Promise<Response> => {
    try {
      return await handler(req, context);
    } catch (error: any) {
      // Log the error with context
      const errorContext = createErrorContext(req, {
        handler: handler.name || 'anonymous',
      });

      ErrorLogger.error(
        'API request failed',
        error instanceof Error ? error : new Error(String(error)),
        errorContext
      );

      // Format error response
      const includeStack = process.env.NODE_ENV === 'development';
      const errorResponse = formatErrorResponse(
        error instanceof Error ? error : new Error(String(error)),
        includeStack
      );

      // Determine status code
      const statusCode = error instanceof AppError ? error.statusCode : 500;

      return Response.json(errorResponse, { status: statusCode });
    }
  };
}

/**
 * Re-export error classes for convenience
 */
export {
  AppError,
  ValidationError,
  NotFoundError,
  ConflictError,
  DatabaseError,
  InsufficientStockError,
  UnauthorizedError,
  ForbiddenError,
  ErrorCode,
} from './errors';


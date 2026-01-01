/**
 * Centralized Error Handling for InventoryPro
 * Consolidates all custom error classes and utilities
 */

import { Prisma } from '@prisma/client';

/**
 * Error codes for consistent error identification
 */
export enum ErrorCode {
  // Client Errors (4xx)
  BAD_REQUEST = 'BAD_REQUEST',
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  NOT_FOUND = 'NOT_FOUND',
  CONFLICT = 'CONFLICT',
  VALIDATION_ERROR = 'VALIDATION_ERROR',

  // Server Errors (5xx)
  INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR',
  DATABASE_ERROR = 'DATABASE_ERROR',
  EXTERNAL_SERVICE_ERROR = 'EXTERNAL_SERVICE_ERROR',

  // Business Logic Errors
  INSUFFICIENT_STOCK = 'INSUFFICIENT_STOCK',
  DUPLICATE_ENTRY = 'DUPLICATE_ENTRY',
  INVALID_OPERATION = 'INVALID_OPERATION',
}

/**
 * Base application error class
 * All custom errors should extend this class
 */
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: ErrorCode;
  public readonly isOperational: boolean;
  public readonly details?: any;

  constructor(
    message: string,
    statusCode: number = 500,
    code: ErrorCode = ErrorCode.INTERNAL_SERVER_ERROR,
    isOperational: boolean = true,
    details?: any
  ) {
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

/**
 * Validation error - for invalid input data
 */
export class ValidationError extends AppError {
  constructor(message: string, public fields?: Record<string, string | string[]>) {
    super(message, 400, ErrorCode.VALIDATION_ERROR, true, fields);
  }
}

/**
 * Not found error - for missing resources
 */
export class NotFoundError extends AppError {
  constructor(resource: string, identifier?: string) {
    const message = identifier
      ? `${resource} with identifier '${identifier}' not found`
      : `${resource} not found`;
    super(message, 404, ErrorCode.NOT_FOUND, true);
  }
}

/**
 * Conflict error - for duplicate entries or conflicting operations
 */
export class ConflictError extends AppError {
  constructor(message: string, details?: any) {
    super(message, 409, ErrorCode.CONFLICT, true, details);
  }
}

/**
 * Database error - for database operation failures
 */
export class DatabaseError extends AppError {
  constructor(message: string, details?: any) {
    super(message, 500, ErrorCode.DATABASE_ERROR, true, details);
  }
}

/**
 * Insufficient stock error - for inventory stock issues
 */
export class InsufficientStockError extends AppError {
  constructor(productName: string, available: number, requested: number) {
    super(
      `Insufficient stock for ${productName}. Available: ${available}, Requested: ${requested}`,
      400,
      ErrorCode.INSUFFICIENT_STOCK,
      true,
      { productName, available, requested }
    );
  }
}

/**
 * Unauthorized error - for authentication failures
 */
export class UnauthorizedError extends AppError {
  constructor(message: string = 'Unauthorized access') {
    super(message, 401, ErrorCode.UNAUTHORIZED, true);
  }
}

/**
 * Forbidden error - for authorization failures
 */
export class ForbiddenError extends AppError {
  constructor(message: string = 'Access forbidden') {
    super(message, 403, ErrorCode.FORBIDDEN, true);
  }
}

/**
 * Prisma Error Handler
 * Transforms Prisma errors into user-friendly AppErrors
 */
export function handlePrismaError(error: unknown): AppError {
  // Prisma Client Known Request Error (e.g., unique constraint, foreign key)
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    switch (error.code) {
      case 'P2002': {
        // Unique constraint violation
        const target = (error.meta?.target as string[]) || [];
        const field = target[0] || 'field';
        return new ConflictError(
          `A record with this ${field} already exists`,
          { field, code: error.code }
        );
      }
      case 'P2003': {
        // Foreign key constraint violation
        const field = error.meta?.field_name as string;
        return new ValidationError(
          `Invalid reference: ${field || 'related record'} does not exist`,
          { [field || 'reference']: 'Referenced record not found' }
        );
      }
      case 'P2025': {
        // Record not found
        return new NotFoundError('Record');
      }
      case 'P2014': {
        // Required relation violation
        return new ValidationError(
          'Required relationship is missing',
          { relation: 'Required related record is missing' }
        );
      }
      default: {
        return new DatabaseError(
          'Database operation failed',
          { code: error.code, meta: error.meta }
        );
      }
    }
  }

  // Prisma Client Validation Error (e.g., invalid query)
  if (error instanceof Prisma.PrismaClientValidationError) {
    return new ValidationError('Invalid data provided to database');
  }

  // Prisma Client Initialization Error
  if (error instanceof Prisma.PrismaClientInitializationError) {
    return new DatabaseError('Database connection failed', {
      code: error.errorCode,
    });
  }

  // Prisma Client Rust Panic Error
  if (error instanceof Prisma.PrismaClientRustPanicError) {
    return new DatabaseError('Database engine error', {
      message: error.message,
    });
  }

  // If it's already an AppError, return it
  if (error instanceof AppError) {
    return error;
  }

  // Unknown error
  return new AppError(
    error instanceof Error ? error.message : 'An unexpected error occurred',
    500,
    ErrorCode.INTERNAL_SERVER_ERROR,
    false
  );
}

/**
 * Safe error handler for repositories
 * Wraps repository operations and transforms errors
 */
export async function withErrorHandling<T>(
  operation: () => Promise<T>,
  context?: string
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    const appError = handlePrismaError(error);

    // Add context if provided
    if (context && appError.details) {
      appError.details.context = context;
    }

    throw appError;
  }
}


/**
 * Custom API Error Classes for Centralized Error Handling
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

export class ValidationError extends AppError {
  constructor(message: string, details?: any) {
    super(message, 400, ErrorCode.VALIDATION_ERROR, true, details);
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string, identifier?: string) {
    const message = identifier 
      ? `${resource} with identifier '${identifier}' not found`
      : `${resource} not found`;
    super(message, 404, ErrorCode.NOT_FOUND, true);
  }
}

export class ConflictError extends AppError {
  constructor(message: string, details?: any) {
    super(message, 409, ErrorCode.CONFLICT, true, details);
  }
}

export class DatabaseError extends AppError {
  constructor(message: string, details?: any) {
    super(message, 500, ErrorCode.DATABASE_ERROR, true, details);
  }
}

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

export class UnauthorizedError extends AppError {
  constructor(message: string = 'Unauthorized access') {
    super(message, 401, ErrorCode.UNAUTHORIZED, true);
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = 'Access forbidden') {
    super(message, 403, ErrorCode.FORBIDDEN, true);
  }
}

/**
 * Error Response Formatter
 */
export interface ErrorResponse {
  success: false;
  error: {
    code: ErrorCode;
    message: string;
    details?: any;
    stack?: string;
  };
}

export function formatErrorResponse(error: Error, includeStack: boolean = false): ErrorResponse {
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
    return {
      success: false,
      error: {
        code: ErrorCode.DATABASE_ERROR,
        message: 'Database operation failed',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
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
 */
export function asyncHandler(
  handler: (req: Request, context?: any) => Promise<Response>
) {
  return async (req: Request, context?: any): Promise<Response> => {
    try {
      return await handler(req, context);
    } catch (error: any) {
      console.error('API Error:', error);
      
      const includeStack = process.env.NODE_ENV === 'development';
      const errorResponse = formatErrorResponse(error, includeStack);
      
      const statusCode = error instanceof AppError ? error.statusCode : 500;
      
      return Response.json(errorResponse, { status: statusCode });
    }
  };
}

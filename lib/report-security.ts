/**
 * Comprehensive error handling and security utilities for the reporting system
 */

export class ReportError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500,
    public details?: any
  ) {
    super(message);
    this.name = 'ReportError';
  }
}

export class ValidationError extends ReportError {
  constructor(message: string, details?: any) {
    super(message, 'VALIDATION_ERROR', 400, details);
    this.name = 'ValidationError';
  }
}

export class AuthorizationError extends ReportError {
  constructor(message: string = 'Access denied') {
    super(message, 'AUTHORIZATION_ERROR', 403);
    this.name = 'AuthorizationError';
  }
}

export class DataNotFoundError extends ReportError {
  constructor(resource: string, details?: any) {
    super(`${resource} not found`, 'DATA_NOT_FOUND', 404, details);
    this.name = 'DataNotFoundError';
  }
}

export class RateLimitError extends ReportError {
  constructor(message: string = 'Rate limit exceeded') {
    super(message, 'RATE_LIMIT_ERROR', 429);
    this.name = 'RateLimitError';
  }
}

/**
 * Security validation utilities
 */
export const SecurityValidator = {
  // Validate report parameters
  validateReportParams(params: any): void {
    const { dateRange, branchId, userId } = params;
    
    // Validate date range
    if (dateRange) {
      if (dateRange.fromDate && isNaN(Date.parse(dateRange.fromDate))) {
        throw new ValidationError('Invalid from date format');
      }
      if (dateRange.toDate && isNaN(Date.parse(dateRange.toDate))) {
        throw new ValidationError('Invalid to date format');
      }
      if (dateRange.fromDate && dateRange.toDate) {
        const from = new Date(dateRange.fromDate);
        const to = new Date(dateRange.toDate);
        if (from > to) {
          throw new ValidationError('From date cannot be after to date');
        }
        // Limit date range to prevent excessive data queries
        const maxRange = 365; // days
        const diffTime = Math.abs(to.getTime() - from.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        if (diffDays > maxRange) {
          throw new ValidationError(`Date range cannot exceed ${maxRange} days`);
        }
      }
    }
    
    // Validate branch ID format
    if (branchId && !this.isValidId(branchId)) {
      throw new ValidationError('Invalid branch ID format');
    }
    
    // Validate user ID format
    if (userId && !this.isValidId(userId)) {
      throw new ValidationError('Invalid user ID format');
    }
  },

  // Validate ID format (basic validation)
  isValidId(id: string): boolean {
    return /^[a-zA-Z0-9-_]+$/.test(id) && id.length <= 50;
  },

  // Sanitize input to prevent SQL injection
  sanitizeInput(input: string): string {
    return input
      .replace(/[<>\"'&]/g, '')
      .trim()
      .substring(0, 255); // Limit length
  },

  // Validate file name for exports
  validateFileName(fileName: string): string {
    const sanitized = fileName
      .replace(/[^a-zA-Z0-9-_\s]/g, '')
      .trim()
      .substring(0, 100);
    
    if (!sanitized) {
      throw new ValidationError('Invalid file name');
    }
    
    return sanitized;
  },

  // Validate export format
  validateExportFormat(format: string): 'pdf' | 'excel' | 'csv' {
    const validFormats = ['pdf', 'excel', 'csv'];
    if (!validFormats.includes(format.toLowerCase())) {
      throw new ValidationError('Invalid export format');
    }
    return format.toLowerCase() as 'pdf' | 'excel' | 'csv';
  },

  // Rate limiting helper
  createRateLimiter(maxRequests: number = 100, windowMs: number = 60000) {
    const requests = new Map<string, number[]>();
    
    return (identifier: string): void => {
      const now = Date.now();
      const userRequests = requests.get(identifier) || [];
      
      // Remove old requests outside the window
      const validRequests = userRequests.filter(time => now - time < windowMs);
      
      if (validRequests.length >= maxRequests) {
        throw new RateLimitError();
      }
      
      validRequests.push(now);
      requests.set(identifier, validRequests);
    };
  }
};

/**
 * Error response formatter
 */
export const ErrorHandler = {
  formatErrorResponse(error: any) {
    if (error instanceof ReportError) {
      return {
        success: false,
        error: error.message,
        code: error.code,
        details: error.details,
        timestamp: new Date().toISOString()
      };
    }
    
    // Handle Prisma errors
    if (error.code === 'P2002') {
      return {
        success: false,
        error: 'Duplicate entry detected',
        code: 'DUPLICATE_ENTRY',
        details: error.meta,
        timestamp: new Date().toISOString()
      };
    }
    
    if (error.code === 'P2025') {
      return {
        success: false,
        error: 'Record not found',
        code: 'RECORD_NOT_FOUND',
        timestamp: new Date().toISOString()
      };
    }
    
    // Default error response
    return {
      success: false,
      error: 'An unexpected error occurred',
      code: 'INTERNAL_ERROR',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      timestamp: new Date().toISOString()
    };
  },

  // Log error for monitoring
  logError(error: any, context?: any) {
    const errorLog = {
      timestamp: new Date().toISOString(),
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
        code: error.code
      },
      context,
      environment: process.env.NODE_ENV
    };
    
    // In production, send to logging service
    console.error('Report Error:', JSON.stringify(errorLog, null, 2));
  }
};

/**
 * Data validation utilities
 */
export const DataValidator = {
  // Validate pagination parameters
  validatePagination(page: number, limit: number): { page: number; limit: number } {
    const validatedPage = Math.max(1, Math.floor(page));
    const validatedLimit = Math.max(1, Math.min(100, Math.floor(limit))); // Max 100 items per page
    
    return { page: validatedPage, limit: validatedLimit };
  },

  // Validate sorting parameters
  validateSort(sortBy: string, sortOrder: string): { sortBy: string; sortOrder: 'asc' | 'desc' } {
    const allowedSortFields = ['date', 'name', 'amount', 'quantity', 'createdAt', 'updatedAt'];
    const validatedSortBy = allowedSortFields.includes(sortBy) ? sortBy : 'createdAt';
    const validatedSortOrder = sortOrder.toLowerCase() === 'desc' ? 'desc' : 'asc';
    
    return { sortBy: validatedSortBy, sortOrder: validatedSortOrder };
  },

  // Validate numeric ranges
  validateRange(value: number, min: number, max: number, fieldName: string): number {
    if (isNaN(value) || value < min || value > max) {
      throw new ValidationError(`${fieldName} must be between ${min} and ${max}`);
    }
    return value;
  }
};

/**
 * Authentication and authorization utilities
 */
export const AuthValidator = {
  // Check if user has required role
  hasRole(user: any, requiredRole: string): boolean {
    if (!user || !user.role) return false;
    return user.role === requiredRole || user.role === 'admin';
  },

  // Check if user has any of the required roles
  hasAnyRole(user: any, roles: string[]): boolean {
    if (!user || !user.role) return false;
    return roles.includes(user.role) || user.role === 'admin';
  },

  // Check if user can access branch data
  canAccessBranch(user: any, branchId: string): boolean {
    if (!user) return false;
    if (user.role === 'admin') return true;
    return user.branchId === branchId;
  },

  // Validate user permissions for reports
  validateReportAccess(user: any, reportType: string, branchId?: string): void {
    if (!user) {
      throw new AuthorizationError('Authentication required');
    }

    // Check if user can access the specific branch
    if (branchId && !this.canAccessBranch(user, branchId)) {
      throw new AuthorizationError('Access denied to this branch');
    }

    // Role-based access control for different report types
    const reportPermissions = {
      'inventory': ['admin', 'manager', 'inventory_manager'],
      'sales': ['admin', 'manager', 'sales_manager'],
      'financial': ['admin', 'manager', 'finance_manager'],
      'employee': ['admin', 'manager'],
      'analytics': ['admin', 'manager', 'analyst']
    };

    const allowedRoles = reportPermissions[reportType as keyof typeof reportPermissions] || ['admin'];
    
    if (!this.hasAnyRole(user, allowedRoles)) {
      throw new AuthorizationError(`Access denied to ${reportType} reports`);
    }
  }
};

/**
 * Rate limiting for different operations
 */
export const RateLimiters = {
  // General report generation rate limiter
  reportGeneration: SecurityValidator.createRateLimiter(50, 60000), // 50 requests per minute
  
  // Export operations rate limiter
  exportOperations: SecurityValidator.createRateLimiter(20, 60000), // 20 exports per minute
  
  // Print operations rate limiter
  printOperations: SecurityValidator.createRateLimiter(30, 60000), // 30 prints per minute
  
  // Batch operations rate limiter
  batchOperations: SecurityValidator.createRateLimiter(10, 60000), // 10 batch operations per minute
};

/**
 * Security middleware for API routes
 */
export function withSecurity(handler: Function, options?: {
  requireAuth?: boolean;
  requiredRole?: string;
  rateLimiter?: (identifier: string) => void;
}) {
  return async (req: any, res: any) => {
    try {
      // Apply rate limiting
      if (options?.rateLimiter) {
        const identifier = req.ip || req.headers['x-forwarded-for'] || 'unknown';
        options.rateLimiter(identifier);
      }

      // Check authentication if required
      if (options?.requireAuth) {
        const user = req.user; // Assuming user is attached by auth middleware
        if (!user) {
          throw new AuthorizationError('Authentication required');
        }

        // Check role if specified
        if (options?.requiredRole && !AuthValidator.hasRole(user, options.requiredRole)) {
          throw new AuthorizationError('Insufficient permissions');
        }
      }

      // Execute the handler
      return await handler(req, res);
    } catch (error) {
      const errorResponse = ErrorHandler.formatErrorResponse(error);
      ErrorHandler.logError(error, { req: req.url, method: req.method });
      
      return res.status(error.statusCode || 500).json(errorResponse);
    }
  };
}
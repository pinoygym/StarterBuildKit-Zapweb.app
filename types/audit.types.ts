import { AuditLog, User } from '@prisma/client';

// Base AuditLog type
export type { AuditLog };

// AuditLog with relations
export type AuditLogWithUser = AuditLog & {
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
  } | null;
};

// AuditLog input types
export interface CreateAuditLogInput {
  userId?: string;
  action: string;
  resource: string;
  resourceId?: string;
  details?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}

// AuditLog filter types
export interface AuditLogFilters {
  userId?: string;
  resource?: string;
  resourceId?: string;
  action?: string;
  startDate?: Date;
  endDate?: Date;
}

// AuditLog response types
export interface AuditLogResponse {
  id: string;
  userId: string | null;
  action: string;
  resource: string;
  resourceId: string | null;
  details: Record<string, any> | null;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: Date;
  user?: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
  } | null;
}

// Paginated audit logs
export interface PaginatedAuditLogs {
  data: AuditLogWithUser[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Audit actions enum (for type safety)
export enum AuditAction {
  // User actions
  USER_LOGIN = 'USER_LOGIN',
  USER_LOGOUT = 'USER_LOGOUT',
  USER_LOGIN_FAILED = 'USER_LOGIN_FAILED',
  USER_CREATED = 'USER_CREATED',
  USER_UPDATED = 'USER_UPDATED',
  USER_DELETED = 'USER_DELETED',
  USER_STATUS_CHANGED = 'USER_STATUS_CHANGED',
  USER_PASSWORD_CHANGED = 'USER_PASSWORD_CHANGED',
  USER_PASSWORD_RESET = 'USER_PASSWORD_RESET',
  USER_EMAIL_VERIFIED = 'USER_EMAIL_VERIFIED',

  // Role actions
  ROLE_CREATED = 'ROLE_CREATED',
  ROLE_UPDATED = 'ROLE_UPDATED',
  ROLE_DELETED = 'ROLE_DELETED',
  PERMISSION_ASSIGNED = 'PERMISSION_ASSIGNED',
  PERMISSION_REMOVED = 'PERMISSION_REMOVED',

  // Resource access
  UNAUTHORIZED_ACCESS = 'UNAUTHORIZED_ACCESS',
  ACCESS_DENIED = 'ACCESS_DENIED',
}

// Audit resource enum (for type safety)
export enum AuditResource {
  USER = 'USER',
  ROLE = 'ROLE',
  PERMISSION = 'PERMISSION',
  SESSION = 'SESSION',
  PRODUCT = 'PRODUCT',
  INVENTORY = 'INVENTORY',
  SALES_ORDER = 'SALES_ORDER',
  PURCHASE_ORDER = 'PURCHASE_ORDER',
  POS_SALE = 'POS_SALE',
  AR = 'ACCOUNTS_RECEIVABLE',
  AP = 'ACCOUNTS_PAYABLE',
  EXPENSE = 'EXPENSE',
  BRANCH = 'BRANCH',
  WAREHOUSE = 'WAREHOUSE',
  SUPPLIER = 'SUPPLIER',
}

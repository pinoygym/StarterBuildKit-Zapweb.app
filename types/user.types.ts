import { User, Role, Branch, Session, AuditLog, UserBranchAccess, PasswordResetToken } from '@prisma/client';

// Custom UserStatus type (Prisma schema uses String, not enum)
export type UserStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';

// Base User type
export type { User };

// User with relations
export type UserWithRole = User & {
  Role: Role;
};

export type UserWithBranch = User & {
  Branch: Branch | null;
};

export type UserWithRelations = User & {
  Role: Role;
  Branch: Branch | null;
  UserBranchAccess?: UserBranchAccess[];
};

export type UserWithSessions = User & {
  sessions: Session[];
};

export type UserWithAuditLogs = User & {
  auditLogs: AuditLog[];
};

// User input types
export interface CreateUserInput {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  roleId: string;
  branchId?: string;
}

export interface UpdateUserInput {
  email?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  roleId?: string;
  branchId?: string;
  status?: UserStatus;
  emailVerified?: boolean;
  branchLockEnabled?: boolean;
}

export interface ChangePasswordInput {
  oldPassword: string;
  newPassword: string;
  confirmPassword: string;
}

// User filter types
export interface UserFilters {
  search?: string;
  roleId?: string;
  branchId?: string;
  status?: UserStatus;
  emailVerified?: boolean;
}

// User response types
export interface UserResponse {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  roleId: string;
  branchId: string | null;
  status: UserStatus;
  emailVerified: boolean;
  lastLoginAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserWithRoleResponse extends UserResponse {
  role: {
    id: string;
    name: string;
    description: string | null;
  };
}

export interface UserWithBranchResponse extends UserWithRoleResponse {
  branch: {
    id: string;
    name: string;
    code: string;
  } | null;
}

// Paginated user response
export interface PaginatedUsers {
  data: UserWithRelations[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
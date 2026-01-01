import { Session, User, Role, Branch } from '@prisma/client';

// Base Session type
export type { Session };

// Session with relations
export type SessionWithUser = Session & {
  user: User & {
    role: Role;
    branch: Branch | null;
  };
};

// Session input types
export interface CreateSessionInput {
  userId: string;
  token: string;
  ipAddress?: string;
  userAgent?: string;
  expiresAt: Date;
}

// Session filter types
export interface SessionFilters {
  userId?: string;
  expired?: boolean;
}

// Session response types
export interface SessionResponse {
  id: string;
  userId: string;
  ipAddress: string | null;
  userAgent: string | null;
  expiresAt: Date;
  createdAt: Date;
  isActive: boolean;
}

export interface SessionWithUserResponse extends SessionResponse {
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: {
      id: string;
      name: string;
    };
  };
}

// UserBranchAccess types
export interface UserBranchAccessInput {
  userId: string;
  branchId: string;
}

export interface UserBranchAccessResponse {
  id: string;
  userId: string;
  branchId: string;
  createdAt: Date;
  branch: {
    id: string;
    name: string;
    code: string;
    location: string;
  };
}

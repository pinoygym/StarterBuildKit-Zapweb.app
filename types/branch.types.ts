import { Branch } from '@prisma/client';

export type BranchStatus = 'active' | 'inactive';

export interface CreateBranchInput {
  name: string;
  code: string;
  location: string;
  manager: string;
  phone: string;
  status?: BranchStatus;
}

export interface UpdateBranchInput {
  name?: string;
  code?: string;
  location?: string;
  manager?: string;
  phone?: string;
  status?: BranchStatus;
}

export type BranchWithRelations = Branch;

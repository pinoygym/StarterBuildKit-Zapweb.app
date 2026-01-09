import type {
    CooperativeInitiative,
    CooperativeProposal,
    ProposalVote,
    CooperativeTask,
    TaskAssignment,
    MemberEngagementScore,
    MemberWallet,
    WalletTransaction,
    CooperativeFarm,
    IDCardTemplate
} from '@prisma/client';

// Coordination Types
export interface CreateInitiativeInput {
    title: string;
    description: string;
    category: string;
    status?: string;
    priority?: string;
    targetDate?: Date | string;
    budget?: number;
    leadMemberId?: string;
}

export interface UpdateInitiativeInput {
    title?: string;
    description?: string;
    category?: string;
    status?: string;
    priority?: string;
    targetDate?: Date | string;
    budget?: number;
    progress?: number;
    leadMemberId?: string;
}

export interface CreateProposalInput {
    title: string;
    description: string;
    category: string;
    proposedById: string;
    votingStartDate?: Date | string;
    votingEndDate?: Date | string;
    requiredVotes?: number;
}

export interface CreateTaskInput {
    title: string;
    description?: string;
    category: string;
    priority?: string;
    xpReward?: number;
    badgeReward?: string;
    dueDate?: Date | string;
    initiativeId?: string;
}

// Wallet Types
export interface WalletTransactionInput {
    walletId: string;
    type: 'cash_in' | 'send_money' | 'pay_bills' | 'loan_payment' | 'withdrawal';
    amount: number;
    description?: string;
    referenceNumber?: string;
}

// Farm Types
export interface CreateFarmInput {
    name: string;
    memberId: string;
    latitude: number;
    longitude: number;
    sizeHectares: number;
    cropType: string;
    notes?: string;
    lastHarvest?: Date | string;
    nextHarvestEst?: Date | string;
}

// ID Template Types
export interface CreateIDTemplateInput {
    name: string;
    orientation?: 'landscape' | 'portrait';
    primaryColor?: string;
    secondaryColor?: string;
    textColor?: string;
    layout?: string;
    showProfileImage?: boolean;
    showBackQr?: boolean;
    isDefault?: boolean;
}

// Filters
export interface InitiativeFilters {
    status?: string;
    category?: string;
    search?: string;
}

export interface ProposalFilters {
    status?: string;
    category?: string;
}

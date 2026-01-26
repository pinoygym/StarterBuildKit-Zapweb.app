// Fund Source Types

export type FundSourceType =
    | 'BANK_ACCOUNT'
    | 'CASH_REGISTER'
    | 'PETTY_CASH'
    | 'MOBILE_WALLET'
    | 'CREDIT_LINE';

export type FundSourceStatus = 'active' | 'inactive' | 'closed';

export type FundTransactionType =
    | 'DEPOSIT'
    | 'WITHDRAWAL'
    | 'TRANSFER_IN'
    | 'TRANSFER_OUT'
    | 'ADJUSTMENT'
    | 'OPENING_BALANCE';

export type FundReferenceType =
    | 'AR_PAYMENT'
    | 'AP_PAYMENT'
    | 'EXPENSE'
    | 'POS_SALE'
    | 'TRANSFER'
    | 'ADJUSTMENT';

export type FundTransferStatus = 'pending' | 'completed' | 'cancelled';

// Input types
export interface CreateFundSourceInput {
    name: string;
    code: string;
    type: FundSourceType;
    branchId?: string | null;
    bankName?: string | null;
    accountNumber?: string | null;
    accountHolder?: string | null;
    description?: string | null;
    openingBalance?: number;
    currency?: string;
    isDefault?: boolean;
    displayOrder?: number;
}

export interface UpdateFundSourceInput {
    name?: string;
    code?: string;
    type?: FundSourceType;
    branchId?: string | null;
    bankName?: string | null;
    accountNumber?: string | null;
    accountHolder?: string | null;
    description?: string | null;
    currency?: string;
    status?: FundSourceStatus;
    isDefault?: boolean;
    displayOrder?: number;
}

export interface FundSourceFilters {
    branchId?: string;
    type?: FundSourceType;
    status?: FundSourceStatus;
    search?: string;
}

export interface RecordFundTransactionInput {
    fundSourceId: string;
    type: FundTransactionType;
    amount: number;
    referenceType?: FundReferenceType;
    referenceId?: string;
    description?: string;
    transactionDate?: Date;
    createdById: string;
}

export interface CreateFundTransferInput {
    fromFundSourceId: string;
    toFundSourceId: string;
    amount: number;
    transferFee?: number;
    description?: string;
    transferDate?: Date;
    createdById: string;
}

export interface FundTransferFilters {
    fromFundSourceId?: string;
    toFundSourceId?: string;
    status?: FundTransferStatus;
    fromDate?: Date;
    toDate?: Date;
}

export interface FundTransactionFilters {
    fundSourceId?: string;
    type?: FundTransactionType;
    referenceType?: FundReferenceType;
    fromDate?: Date;
    toDate?: Date;
    page?: number;
    pageSize?: number;
}

export interface AdjustBalanceInput {
    fundSourceId: string;
    newBalance: number;
    reason: string;
    createdById: string;
}

// Response types
export interface FundSourceWithBranch {
    id: string;
    name: string;
    code: string;
    type: string;
    branchId: string | null;
    bankName: string | null;
    accountNumber: string | null;
    accountHolder: string | null;
    description: string | null;
    openingBalance: number;
    currentBalance: number;
    currency: string;
    status: string;
    isDefault: boolean;
    displayOrder: number;
    createdAt: Date;
    updatedAt: Date;
    Branch: {
        id: string;
        name: string;
        code: string;
    } | null;
}

export interface FundSourceWithTransactions extends FundSourceWithBranch {
    FundTransactions: FundTransactionWithUser[];
    _count?: {
        FundTransactions: number;
        APPayments: number;
        ARPayments: number;
        Expenses: number;
    };
}

export interface FundTransactionWithUser {
    id: string;
    fundSourceId: string;
    type: string;
    amount: number;
    runningBalance: number;
    referenceType: string | null;
    referenceId: string | null;
    description: string | null;
    transactionDate: Date;
    createdById: string;
    createdAt: Date;
    CreatedBy: {
        id: string;
        firstName: string;
        lastName: string;
    };
}

export interface FundTransferWithDetails {
    id: string;
    transferNumber: string;
    fromFundSourceId: string;
    toFundSourceId: string;
    amount: number;
    transferFee: number;
    netAmount: number;
    description: string | null;
    status: string;
    transferDate: Date;
    createdById: string;
    createdAt: Date;
    updatedAt: Date;
    FromFundSource: {
        id: string;
        name: string;
        code: string;
    };
    ToFundSource: {
        id: string;
        name: string;
        code: string;
    };
    CreatedBy: {
        id: string;
        firstName: string;
        lastName: string;
    };
}

// Summary types
export interface FundSourceSummary {
    totalFundSources: number;
    totalBalance: number;
    byType: {
        type: string;
        count: number;
        totalBalance: number;
    }[];
    byBranch: {
        branchId: string | null;
        branchName: string | null;
        count: number;
        totalBalance: number;
    }[];
}

export interface FundSourceDashboardData {
    summary: FundSourceSummary;
    recentTransactions: FundTransactionWithUser[];
    lowBalanceAlerts: FundSourceWithBranch[];
}

// Fund Source type labels for UI
export const FUND_SOURCE_TYPE_LABELS: Record<FundSourceType, string> = {
    BANK_ACCOUNT: 'Bank Account',
    CASH_REGISTER: 'Cash Register',
    PETTY_CASH: 'Petty Cash',
    MOBILE_WALLET: 'Mobile Wallet',
    CREDIT_LINE: 'Credit Line',
};

export const FUND_TRANSACTION_TYPE_LABELS: Record<FundTransactionType, string> = {
    DEPOSIT: 'Deposit',
    WITHDRAWAL: 'Withdrawal',
    TRANSFER_IN: 'Transfer In',
    TRANSFER_OUT: 'Transfer Out',
    ADJUSTMENT: 'Adjustment',
    OPENING_BALANCE: 'Opening Balance',
};

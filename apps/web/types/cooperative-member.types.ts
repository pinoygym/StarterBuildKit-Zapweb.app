import type { CooperativeMember, MembershipType, MemberContribution, MemberBeneficiary } from '@prisma/client';

export type MemberStatus = 'active' | 'inactive' | 'suspended';
export type MemberGender = 'male' | 'female' | 'other';
export type CivilStatus = 'single' | 'married' | 'widowed' | 'separated';
export type ContributionType = 'share_capital' | 'savings' | 'loan_payment' | 'membership_fee' | 'other';
export type BeneficiaryRelationship = 'spouse' | 'child' | 'parent' | 'sibling' | 'other';

export interface CreateMemberInput {
    memberCode?: string; // Auto-generated if not provided
    firstName: string;
    lastName: string;
    middleName?: string;
    dateOfBirth: Date | string;
    gender: MemberGender;
    civilStatus: CivilStatus;
    email?: string;
    phone: string;
    alternatePhone?: string;
    address: string;
    city?: string;
    region?: string;
    postalCode?: string;
    membershipTypeId: string;
    membershipDate?: Date | string;
    status?: MemberStatus;
    emergencyContactName?: string;
    emergencyContactPhone?: string;
    emergencyContactRelation?: string;
    tinNumber?: string;
    sssNumber?: string;
    photoUrl?: string;
    notes?: string;
}

export interface UpdateMemberInput {
    firstName?: string;
    lastName?: string;
    middleName?: string;
    dateOfBirth?: Date | string;
    gender?: MemberGender;
    civilStatus?: CivilStatus;
    email?: string;
    phone?: string;
    alternatePhone?: string;
    address?: string;
    city?: string;
    region?: string;
    postalCode?: string;
    membershipTypeId?: string;
    status?: MemberStatus;
    emergencyContactName?: string;
    emergencyContactPhone?: string;
    emergencyContactRelation?: string;
    tinNumber?: string;
    sssNumber?: string;
    photoUrl?: string;
    notes?: string;
}

export interface MemberFilters {
    status?: MemberStatus;
    membershipTypeId?: string;
    search?: string; // Search by name, email, phone, or member code
    page?: number;
    limit?: number;
}

export interface PaginationMetadata {
    page: number;
    limit: number;
    totalCount: number;
    totalPages: number;
    hasMore: boolean;
}

export type MemberWithRelations = CooperativeMember & {
    MembershipType?: MembershipType;
    CreatedBy?: {
        id: string;
        firstName: string;
        lastName: string;
    };
    UpdatedBy?: {
        id: string;
        firstName: string;
        lastName: string;
    };
    _count?: {
        contributions?: number;
        beneficiaries?: number;
    };
};

export interface MemberStats {
    totalContributions: number;
    shareCapitalTotal: number;
    savingsTotal: number;
    membershipFeesTotal: number;
    beneficiariesCount: number;
    memberSince: Date;
    lastContributionDate?: Date;
}

// Membership Type Types
export interface CreateMembershipTypeInput {
    name: string;
    code: string;
    description?: string;
    requiredShareCapital?: number;
    monthlyDues?: number;
    benefits?: string; // JSON string
    status?: 'active' | 'inactive';
    displayOrder?: number;
}

export interface UpdateMembershipTypeInput {
    name?: string;
    code?: string;
    description?: string;
    requiredShareCapital?: number;
    monthlyDues?: number;
    benefits?: string;
    status?: 'active' | 'inactive';
    displayOrder?: number;
}

// Contribution Types
export interface CreateContributionInput {
    memberId: string;
    contributionType: ContributionType;
    amount: number;
    contributionDate?: Date | string;
    referenceNumber?: string;
    paymentMethod: string;
    notes?: string;
}

export interface ContributionFilters {
    memberId?: string;
    contributionType?: ContributionType;
    startDate?: Date | string;
    endDate?: Date | string;
    page?: number;
    limit?: number;
}

// Beneficiary Types
export interface CreateBeneficiaryInput {
    memberId: string;
    fullName: string;
    relationship: BeneficiaryRelationship;
    dateOfBirth?: Date | string;
    phone?: string;
    percentage?: number;
    isPrimary?: boolean;
}

export interface UpdateBeneficiaryInput {
    fullName?: string;
    relationship?: BeneficiaryRelationship;
    dateOfBirth?: Date | string;
    phone?: string;
    percentage?: number;
    isPrimary?: boolean;
}

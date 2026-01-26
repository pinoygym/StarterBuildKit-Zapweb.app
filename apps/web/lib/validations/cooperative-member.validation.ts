import { z } from 'zod';

const memberStatusEnum = z.enum(['active', 'inactive', 'suspended']);
const genderEnum = z.enum(['male', 'female', 'other']);
const civilStatusEnum = z.enum(['single', 'married', 'widowed', 'separated']);
const contributionTypeEnum = z.enum(['share_capital', 'savings', 'loan_payment', 'membership_fee', 'other']);
const relationshipEnum = z.enum(['spouse', 'child', 'parent', 'sibling', 'other']);

// Member Validation Schemas
export const memberSchema = z.object({
    memberCode: z.string().optional(),
    firstName: z
        .string()
        .min(1, 'First name is required')
        .max(100, 'First name is too long'),
    lastName: z
        .string()
        .min(1, 'Last name is required')
        .max(100, 'Last name is too long'),
    middleName: z.string().max(100).optional(),
    dateOfBirth: z.coerce.date({
        required_error: 'Date of birth is required',
        invalid_type_error: 'Invalid date format',
    }),
    gender: genderEnum,
    civilStatus: civilStatusEnum,
    email: z
        .union([z.string().email('Invalid email format'), z.literal('')])
        .optional(),
    phone: z
        .string()
        .min(1, 'Phone number is required')
        .regex(/^[\d\s\-\+\(\)]+$/, 'Invalid phone number format'),
    alternatePhone: z
        .string()
        .regex(/^[\d\s\-\+\(\)]+$/, 'Invalid phone number format')
        .optional()
        .or(z.literal('')),
    address: z
        .string()
        .min(1, 'Address is required')
        .max(500, 'Address is too long'),
    city: z.string().max(100).optional(),
    region: z.string().max(100).optional(),
    postalCode: z.string().max(20).optional(),
    membershipTypeId: z.string().min(1, 'Membership type is required'),
    membershipDate: z.coerce.date().optional(),
    status: memberStatusEnum.default('active'),
    emergencyContactName: z.string().max(100).optional(),
    emergencyContactPhone: z
        .string()
        .regex(/^[\d\s\-\+\(\)]+$/, 'Invalid phone number format')
        .optional()
        .or(z.literal('')),
    emergencyContactRelation: z.string().max(50).optional(),
    tinNumber: z.string().max(50).optional(),
    sssNumber: z.string().max(50).optional(),
    photoUrl: z.string().url('Invalid URL format').optional().or(z.literal('')),
    notes: z.string().max(1000).optional(),
});

export const updateMemberSchema = z.object({
    firstName: z.string().min(1).max(100).optional(),
    lastName: z.string().min(1).max(100).optional(),
    middleName: z.string().max(100).optional(),
    dateOfBirth: z.coerce.date().optional(),
    gender: genderEnum.optional(),
    civilStatus: civilStatusEnum.optional(),
    email: z
        .union([z.string().email('Invalid email format'), z.literal('')])
        .optional(),
    phone: z
        .string()
        .regex(/^[\d\s\-\+\(\)]+$/, 'Invalid phone number format')
        .optional(),
    alternatePhone: z
        .string()
        .regex(/^[\d\s\-\+\(\)]+$/, 'Invalid phone number format')
        .optional()
        .or(z.literal('')),
    address: z.string().max(500).optional(),
    city: z.string().max(100).optional(),
    region: z.string().max(100).optional(),
    postalCode: z.string().max(20).optional(),
    membershipTypeId: z.string().optional(),
    status: memberStatusEnum.optional(),
    emergencyContactName: z.string().max(100).optional(),
    emergencyContactPhone: z
        .string()
        .regex(/^[\d\s\-\+\(\)]+$/, 'Invalid phone number format')
        .optional()
        .or(z.literal('')),
    emergencyContactRelation: z.string().max(50).optional(),
    tinNumber: z.string().max(50).optional(),
    sssNumber: z.string().max(50).optional(),
    photoUrl: z.string().url('Invalid URL format').optional().or(z.literal('')),
    notes: z.string().max(1000).optional(),
});

// Membership Type Validation Schemas
export const membershipTypeSchema = z.object({
    name: z
        .string()
        .min(1, 'Membership type name is required')
        .max(100, 'Name is too long'),
    code: z
        .string()
        .min(1, 'Code is required')
        .max(20, 'Code is too long')
        .regex(/^[A-Z0-9_-]+$/, 'Code must contain only uppercase letters, numbers, hyphens, and underscores'),
    description: z.string().max(500).optional(),
    requiredShareCapital: z
        .number()
        .nonnegative('Required share capital must be non-negative')
        .default(0),
    monthlyDues: z
        .number()
        .nonnegative('Monthly dues must be non-negative')
        .default(0),
    benefits: z.string().optional(),
    status: z.enum(['active', 'inactive']).default('active'),
    displayOrder: z.number().int().nonnegative().default(0),
});

export const updateMembershipTypeSchema = z.object({
    name: z.string().min(1).max(100).optional(),
    code: z
        .string()
        .max(20)
        .regex(/^[A-Z0-9_-]+$/, 'Code must contain only uppercase letters, numbers, hyphens, and underscores')
        .optional(),
    description: z.string().max(500).optional(),
    requiredShareCapital: z
        .number()
        .nonnegative('Required share capital must be non-negative')
        .optional(),
    monthlyDues: z
        .number()
        .nonnegative('Monthly dues must be non-negative')
        .optional(),
    benefits: z.string().optional(),
    status: z.enum(['active', 'inactive']).optional(),
    displayOrder: z.number().int().nonnegative().optional(),
});

// Contribution Validation Schemas
export const contributionSchema = z.object({
    memberId: z.string().min(1, 'Member ID is required'),
    contributionType: contributionTypeEnum,
    amount: z
        .number()
        .positive('Amount must be greater than zero'),
    contributionDate: z.coerce.date().optional(),
    referenceNumber: z.string().max(100).optional(),
    paymentMethod: z
        .string()
        .min(1, 'Payment method is required')
        .max(50),
    notes: z.string().max(500).optional(),
});

// Beneficiary Validation Schemas
export const beneficiarySchema = z.object({
    memberId: z.string().min(1, 'Member ID is required'),
    fullName: z
        .string()
        .min(1, 'Beneficiary name is required')
        .max(200, 'Name is too long'),
    relationship: relationshipEnum,
    dateOfBirth: z.coerce.date().optional(),
    phone: z
        .string()
        .regex(/^[\d\s\-\+\(\)]+$/, 'Invalid phone number format')
        .optional()
        .or(z.literal('')),
    percentage: z
        .number()
        .min(0, 'Percentage must be between 0 and 100')
        .max(100, 'Percentage must be between 0 and 100')
        .optional(),
    isPrimary: z.boolean().default(false),
});

export const updateBeneficiarySchema = z.object({
    fullName: z.string().min(1).max(200).optional(),
    relationship: relationshipEnum.optional(),
    dateOfBirth: z.coerce.date().optional(),
    phone: z
        .string()
        .regex(/^[\d\s\-\+\(\)]+$/, 'Invalid phone number format')
        .optional()
        .or(z.literal('')),
    percentage: z
        .number()
        .min(0, 'Percentage must be between 0 and 100')
        .max(100, 'Percentage must be between 0 and 100')
        .optional(),
    isPrimary: z.boolean().optional(),
});

export type MemberFormData = z.infer<typeof memberSchema>;
export type UpdateMemberFormData = z.infer<typeof updateMemberSchema>;
export type MembershipTypeFormData = z.infer<typeof membershipTypeSchema>;
export type UpdateMembershipTypeFormData = z.infer<typeof updateMembershipTypeSchema>;
export type ContributionFormData = z.infer<typeof contributionSchema>;
export type BeneficiaryFormData = z.infer<typeof beneficiarySchema>;
export type UpdateBeneficiaryFormData = z.infer<typeof updateBeneficiarySchema>;

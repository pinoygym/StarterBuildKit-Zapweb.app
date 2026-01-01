import { useQuery } from '@tanstack/react-query';

interface CompanySettings {
    id: string;
    companyName: string;
    address: string;
    vatEnabled: boolean;
    vatRate: number;
    vatRegistrationNumber: string;
    taxInclusive: boolean;
    maxDiscountPercentage: number;
    requireDiscountApproval: boolean;
    discountApprovalThreshold: number;
    approvalRules: string;
}

/**
 * Custom hook to fetch and cache company settings
 * @returns Company settings data with loading and error states
 */
export function useCompanySettings() {
    return useQuery<CompanySettings>({
        queryKey: ['company-settings'],
        queryFn: async () => {
            const response = await fetch('/api/settings/company');
            const data = await response.json();

            if (!data.success) {
                throw new Error(data.error || 'Failed to fetch company settings');
            }

            return data.data;
        },
        staleTime: 5 * 60 * 1000, // 5 minutes
        gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
        retry: 2,
    });
}

/**
 * Helper hook to get just the company name with a fallback
 * @returns Company name string with fallback to "InventoryPro"
 */
export function useCompanyName() {
    const { data, isLoading } = useCompanySettings();

    return {
        companyName: data?.companyName || 'InventoryPro',
        isLoading,
    };
}

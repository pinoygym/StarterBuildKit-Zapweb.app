export type FeatureKey =
    | 'pos'
    | 'inventory_batch_tracking'
    | 'multi_uom'
    | 'ar_ap'
    | 'expenses'
    | 'roadmap'
    | 'audit_logs';

export interface TenantConfig {
    id: string;
    name: string;
    shortName: string;
    version: string;
    description: string;
    enabledFeatures: FeatureKey[];
}

export const tenants: Record<string, TenantConfig> = {
    default: {
        id: 'default',
        name: 'InventoryPro',
        shortName: 'InventoryPro',
        version: 'v1.0.0',
        description: 'Comprehensive inventory management and POS system',
        enabledFeatures: [
            'pos',
            'inventory_batch_tracking',
            'multi_uom',
            'ar_ap',
            'expenses',
            'roadmap',
            'audit_logs'
        ],
    },
    buenas: {
        id: 'buenas',
        name: 'Buenas Multi-Tenant SaaS',
        shortName: 'BuenasV2',
        version: 'v0.1.0',
        description: 'Inventory & POS for Buenas Shoppers',
        enabledFeatures: [
            'pos',
            'inventory_batch_tracking',
            'multi_uom',
            'ar_ap',
            'expenses',
            'roadmap',
            'audit_logs'
        ],
    },
};

export const getTenantById = (id: string): TenantConfig => {
    return tenants[id] || tenants.default;
};

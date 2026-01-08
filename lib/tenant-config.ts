import { getTenantById, TenantConfig, FeatureKey } from '@/config/tenants';

/**
 * Gets the current tenant configuration based on the TENANT_ID environment variable.
 * Fallbacks to 'default' if no ID is provided or found.
 */
export function getTenantConfig(): TenantConfig {
    const tenantId = process.env.TENANT_ID || 'default';
    return getTenantById(tenantId);
}

/**
 * Helper to check if a specific feature is enabled for the current tenant.
 */
export function hasFeature(feature: FeatureKey): boolean {
    const config = getTenantConfig();
    return config.enabledFeatures.includes(feature);
}

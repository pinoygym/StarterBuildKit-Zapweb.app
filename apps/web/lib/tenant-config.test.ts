import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getTenantConfig, hasFeature } from './tenant-config';
import { tenants } from '@/config/tenants';

describe('tenant-config', () => {
    beforeEach(() => {
        vi.stubEnv('TENANT_ID', '');
    });

    it('should return default tenant if no TENANT_ID is set', () => {
        const config = getTenantConfig();
        expect(config.id).toBe('default');
        expect(config.name).toBe('InventoryPro');
    });

    it('should return correct tenant when TENANT_ID is set to buenas', () => {
        vi.stubEnv('TENANT_ID', 'buenas');
        const config = getTenantConfig();
        expect(config.id).toBe('buenas');
        expect(config.name).toBe('Buenas Multi-Tenant SaaS');
    });

    it('should fallback to default if invalid TENANT_ID is set', () => {
        vi.stubEnv('TENANT_ID', 'invalid_tenant');
        const config = getTenantConfig();
        expect(config.id).toBe('default');
    });

    it('should correctly check for enabled features', () => {
        vi.stubEnv('TENANT_ID', 'default');
        expect(hasFeature('pos')).toBe(true);

        // Test with a mock tenant that has 0 features (requires modifying tenants record or adding mock)
        // For now, testing against 'default' which has all.
        expect(hasFeature('audit_logs')).toBe(true);
    });
});

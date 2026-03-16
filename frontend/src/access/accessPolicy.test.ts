import { describe, expect, it } from 'vitest';
import { COMPANY_PERMISSION_ROUTE, getAccessPolicy, isRouteAllowed } from './accessPolicy';

describe('getAccessPolicy', () => {
    it('returns full company access policy', () => {
        const policy = getAccessPolicy('company');

        expect(policy.defaultRoute).toBe('dashboard');
        expect(policy.menuMode).toBe('full');
        expect(policy.canUseRealtime).toBe(true);
        expect(policy.canUseCompanyContext).toBe(true);
        expect(isRouteAllowed('dashboard', policy)).toBe(true);
    });

    it('returns oversight access policy with full menu', () => {
        const policy = getAccessPolicy('oversight');

        expect(policy.defaultRoute).toBe('dashboard');
        expect(policy.menuMode).toBe('full');
        expect(policy.canUseRealtime).toBe(true);
        expect(policy.canUseCompanyContext).toBe(false);
        expect(isRouteAllowed('dashboard', policy)).toBe(true);
        expect(isRouteAllowed('claims', policy)).toBe(true);
    });

    it('returns no-access policy', () => {
        const policy = getAccessPolicy('none');

        expect(policy.defaultRoute).toBe(COMPANY_PERMISSION_ROUTE);
        expect(policy.menuMode).toBe('none');
        expect(policy.canUseRealtime).toBe(false);
        expect(policy.canUseCompanyContext).toBe(false);
        expect(isRouteAllowed(COMPANY_PERMISSION_ROUTE, policy)).toBe(true);
        expect(isRouteAllowed('dashboard', policy)).toBe(false);
    });
});

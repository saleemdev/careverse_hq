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

    it('allows recruitment job post editor routes for full access modes', () => {
        const companyPolicy = getAccessPolicy('company');
        const oversightPolicy = getAccessPolicy('oversight');

        expect(isRouteAllowed('recruitment/job-posts/new', companyPolicy)).toBe(true);
        expect(isRouteAllowed('recruitment/job-posts/edit', companyPolicy)).toBe(true);
        expect(isRouteAllowed('recruitment/job-posts/new', oversightPolicy)).toBe(true);
        expect(isRouteAllowed('recruitment/job-posts/edit', oversightPolicy)).toBe(true);
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

    it('allows facilities/new for company, oversight, and standalone none-access onboarding', () => {
        const companyPolicy = getAccessPolicy('company');
        const oversightPolicy = getAccessPolicy('oversight');
        const nonePolicy = getAccessPolicy('none');

        expect(isRouteAllowed('facilities/new', companyPolicy)).toBe(true);
        expect(isRouteAllowed('facilities/new', oversightPolicy)).toBe(true);
        expect(isRouteAllowed('facilities/new', nonePolicy)).toBe(true);
        expect(isRouteAllowed('facilities', nonePolicy)).toBe(false);
    });
});

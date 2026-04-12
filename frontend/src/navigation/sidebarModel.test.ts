import { describe, expect, it } from 'vitest';
import type { ItemType } from 'antd/es/menu/interface';
import { getMenuItemsForMode } from '../access/accessPolicy';
import { getGroupForRoute, getSidebarModel, normalizeRouteForNav } from './sidebarModel';

const collectLeafKeys = (items: ItemType[]): string[] => {
    const keys: string[] = [];

    for (const item of items) {
        if (!item || typeof item !== 'object') continue;

        const maybeChildren = 'children' in item ? item.children : undefined;

        if (Array.isArray(maybeChildren) && maybeChildren.length > 0) {
            keys.push(...collectLeafKeys(maybeChildren as ItemType[]));
            continue;
        }

        if ('key' in item && typeof item.key === 'string') {
            keys.push(item.key);
        }
    }

    return keys;
};

describe('sidebarModel', () => {
    it('returns expected groups and tools for full menu mode', () => {
        const model = getSidebarModel('full');

        expect(model.groups.map((group) => group.key)).toEqual([
            'home',
            'workforce',
            'operations',
            'compliance',
            'administration',
        ]);

        const workforce = model.groups.find((group) => group.key === 'workforce');
        expect(workforce?.items.map((item) => item.key)).toEqual([
            'health-professionals',
            'affiliations',
            'leave-summary',
            'attendance',
        ]);

        const operations = model.groups.find((group) => group.key === 'operations');
        expect(operations?.items.map((item) => item.key)).toEqual([
            'assets',
            'facilities',
            'recruitment',
            'claims',
        ]);

        const administration = model.groups.find((group) => group.key === 'administration');
        expect(administration?.items.map((item) => item.key)).toEqual([
            'user-management',
            'bulk-upload',
            'oidc-apps',
        ]);

        expect(model.tools.map((item) => item.key)).toEqual(['profile', 'switch-desk']);
    });

    it('matches the locked group route structure exactly', () => {
        const model = getSidebarModel('full');

        expect(
            Object.fromEntries(model.groups.map((group) => [group.key, group.defaultRoute])),
        ).toEqual({
            home: 'dashboard',
            workforce: 'health-professionals',
            operations: 'assets',
            compliance: 'licenses',
            administration: 'user-management',
        });

        expect(
            Object.fromEntries(model.groups.map((group) => [group.key, group.items.map((item) => item.key)])),
        ).toEqual({
            home: ['dashboard'],
            workforce: ['health-professionals', 'affiliations', 'leave-summary', 'attendance'],
            operations: ['assets', 'facilities', 'recruitment', 'claims'],
            compliance: ['licenses', 'e-contracting'],
            administration: ['user-management', 'bulk-upload', 'oidc-apps'],
        });
    });

    it('returns empty model for none menu mode', () => {
        const model = getSidebarModel('none');

        expect(model.groups).toEqual([]);
        expect(model.tools).toEqual([]);
        expect(model.routeToGroup).toEqual({});
    });

    it('normalizes nested and legacy routes to canonical keys', () => {
        expect(normalizeRouteForNav('bulk-upload/new')).toBe('bulk-upload');
        expect(normalizeRouteForNav('bulk-upload/status')).toBe('bulk-upload');
        expect(normalizeRouteForNav('bulk-upload/status/9a8b')).toBe('bulk-upload');
        expect(normalizeRouteForNav('recruitment/job-posts')).toBe('recruitment');
        expect(normalizeRouteForNav('recruitment/job-posts/HR-219')).toBe('recruitment');
        expect(normalizeRouteForNav('recruitment/candidates')).toBe('recruitment');
        expect(normalizeRouteForNav('recruitment/candidates/42')).toBe('recruitment');
        expect(normalizeRouteForNav('user-management/new')).toBe('user-management');
        expect(normalizeRouteForNav('user-management/security')).toBe('user-management');
        expect(normalizeRouteForNav('user-management/security/USR-99')).toBe('user-management');
        expect(normalizeRouteForNav('create-user')).toBe('user-management');
        expect(normalizeRouteForNav('edit-user')).toBe('user-management');
        expect(normalizeRouteForNav('late-arrivals')).toBe('attendance');
        expect(normalizeRouteForNav('facilities/new')).toBe('facilities');
        expect(normalizeRouteForNav('add-affiliation')).toBe('affiliations');
    });

    it('maps canonical routes to the correct group', () => {
        expect(getGroupForRoute('dashboard', 'full')).toBe('home');
        expect(getGroupForRoute('affiliations', 'full')).toBe('workforce');
        expect(getGroupForRoute('facilities', 'full')).toBe('operations');
        expect(getGroupForRoute('recruitment/job-posts', 'full')).toBe('operations');
        expect(getGroupForRoute('claims', 'full')).toBe('operations');
        expect(getGroupForRoute('bulk-upload/status/9a8b', 'full')).toBe('administration');
        expect(getGroupForRoute('leave-summary', 'full')).toBe('workforce');
        expect(getGroupForRoute('late-arrivals', 'full')).toBe('workforce');
        expect(getGroupForRoute('user-management/security', 'full')).toBe('administration');
        expect(getGroupForRoute('budget-overview', 'full')).toBeNull();
    });

    it('keeps rail route items in parity with legacy sidebar route keys', () => {
        const legacyLeafKeys = collectLeafKeys(getMenuItemsForMode('full')).sort();
        const railLeafKeys = getSidebarModel('full')
            .groups
            .flatMap((group) => group.items.map((item) => item.key))
            .sort();

        expect(railLeafKeys).toEqual(legacyLeafKeys);
    });
});

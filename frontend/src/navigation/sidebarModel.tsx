import type { ReactNode } from 'react';
import type { MenuMode } from '../access/accessPolicy';
import {
    AccountRailIcon,
    ArchiveRailIcon,
    BuildingRailIcon,
    CalendarRailIcon,
    ClockRailIcon,
    ContractRailIcon,
    DashboardGroupRailIcon,
    FileSearchRailIcon,
    GaugeRailIcon,
    KeyRailIcon,
    LicenseRailIcon,
    LinkRailIcon,
    OperationsRailIcon,
    ProfileRailIcon,
    SettingsRailIcon,
    ShieldRailIcon,
    SwapRailIcon,
    UploadRailIcon,
    UserSearchRailIcon,
    UsersRailIcon,
    WorkforceRailIcon,
} from './RailIcons';

export type NavGroupKey = 'home' | 'workforce' | 'operations' | 'compliance' | 'administration';

export interface NavItem {
    key: string;
    route: string;
    label: string;
    icon: ReactNode;
}

export interface NavGroup {
    key: NavGroupKey;
    label: string;
    defaultRoute: string;
    icon: ReactNode;
    items: NavItem[];
}

export interface SidebarModel {
    groups: NavGroup[];
    tools: NavItem[];
    routeToGroup: Partial<Record<string, NavGroupKey>>;
}

const EMPTY_MODEL: SidebarModel = {
    groups: [],
    tools: [],
    routeToGroup: {},
};

const FULL_MODEL_BASE: Omit<SidebarModel, 'routeToGroup'> = {
    groups: [
        {
            key: 'home',
            label: 'Home',
            defaultRoute: 'dashboard',
            icon: <DashboardGroupRailIcon />,
            items: [
                {
                    key: 'dashboard',
                    route: 'dashboard',
                    label: 'Executive Dashboard',
                    icon: <GaugeRailIcon />,
                },
            ],
        },
        {
            key: 'workforce',
            label: 'Workforce',
            defaultRoute: 'health-professionals',
            icon: <WorkforceRailIcon />,
            items: [
                {
                    key: 'health-professionals',
                    route: 'health-professionals',
                    label: 'Health Professionals',
                    icon: <UsersRailIcon />,
                },
                {
                    key: 'affiliations',
                    route: 'affiliations',
                    label: 'Facility Affiliations',
                    icon: <LinkRailIcon />,
                },
                {
                    key: 'leave-summary',
                    route: 'leave-summary',
                    label: 'Leave Applications',
                    icon: <CalendarRailIcon />,
                },
                {
                    key: 'attendance',
                    route: 'attendance',
                    label: 'Shift Management',
                    icon: <ClockRailIcon />,
                },
            ],
        },
        {
            key: 'operations',
            label: 'Operations',
            defaultRoute: 'assets',
            icon: <OperationsRailIcon />,
            items: [
                {
                    key: 'assets',
                    route: 'assets',
                    label: 'Assets',
                    icon: <ArchiveRailIcon />,
                },
                {
                    key: 'facilities',
                    route: 'facilities',
                    label: 'Health Facilities',
                    icon: <BuildingRailIcon />,
                },
                {
                    key: 'recruitment',
                    route: 'recruitment',
                    label: 'Recruitment Desk',
                    icon: <UserSearchRailIcon />,
                },
                {
                    key: 'claims',
                    route: 'claims',
                    label: 'Claims',
                    icon: <FileSearchRailIcon />,
                },
            ],
        },
        {
            key: 'compliance',
            label: 'Compliance',
            defaultRoute: 'licenses',
            icon: <ShieldRailIcon />,
            items: [
                {
                    key: 'licenses',
                    route: 'licenses',
                    label: 'Licenses',
                    icon: <LicenseRailIcon />,
                },
                {
                    key: 'e-contracting',
                    route: 'e-contracting',
                    label: 'eContracting',
                    icon: <ContractRailIcon />,
                },
            ],
        },
        {
            key: 'administration',
            label: 'Administration',
            defaultRoute: 'user-management',
            icon: <SettingsRailIcon />,
            items: [
                {
                    key: 'user-management',
                    route: 'user-management',
                    label: 'User Management',
                    icon: <AccountRailIcon />,
                },
                {
                    key: 'bulk-upload',
                    route: 'bulk-upload',
                    label: 'Bulk Upload',
                    icon: <UploadRailIcon />,
                },
                {
                    key: 'oidc-apps',
                    route: 'oidc-apps',
                    label: 'OIDC Apps',
                    icon: <KeyRailIcon />,
                },
            ],
        },
    ],
    tools: [
        {
            key: 'profile',
            route: 'profile',
            label: 'My Profile',
            icon: <ProfileRailIcon />,
        },
        {
            key: 'switch-desk',
            route: '/app',
            label: 'Switch to Desk',
            icon: <SwapRailIcon />,
        },
    ],
};

const buildRouteToGroup = (groups: NavGroup[]): Partial<Record<string, NavGroupKey>> => {
    const routeMap: Partial<Record<string, NavGroupKey>> = {};

    for (const group of groups) {
        routeMap[group.defaultRoute] = group.key;

        for (const item of group.items) {
            routeMap[item.key] = group.key;
            routeMap[item.route] = group.key;
        }
    }

    return routeMap;
};

const FULL_MODEL: SidebarModel = {
    ...FULL_MODEL_BASE,
    routeToGroup: buildRouteToGroup(FULL_MODEL_BASE.groups),
};

export const normalizeRouteForNav = (route: string): string => {
    if (route.startsWith('bulk-upload/new') || route.startsWith('bulk-upload/status')) {
        return 'bulk-upload';
    }

    if (route.startsWith('recruitment/job-posts') || route.startsWith('recruitment/candidates')) {
        return 'recruitment';
    }

    if (
        route.startsWith('user-management/new')
        || route.startsWith('user-management/security')
        || route === 'create-user'
        || route === 'edit-user'
    ) {
        return 'user-management';
    }

    if (route === 'late-arrivals') {
        return 'attendance';
    }

    if (route === 'facilities/new') {
        return 'facilities';
    }

    if (route === 'add-affiliation') {
        return 'affiliations';
    }

    return route;
};

export const getSidebarModel = (menuMode: MenuMode): SidebarModel => {
    if (menuMode === 'none') {
        return EMPTY_MODEL;
    }

    return FULL_MODEL;
};

export const getGroupForRoute = (route: string, menuMode: MenuMode): NavGroupKey | null => {
    const model = getSidebarModel(menuMode);
    const normalizedRoute = normalizeRouteForNav(route);

    return model.routeToGroup[normalizedRoute] ?? null;
};

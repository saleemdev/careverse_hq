import type { ItemType } from 'antd/es/menu/interface';
import {
    AppstoreOutlined,
    AuditOutlined,
    CalendarOutlined,
    CloudUploadOutlined,
    ClockCircleOutlined,
    DashboardOutlined,
    FileTextOutlined,
    LaptopOutlined,
    LinkOutlined,
    MedicineBoxOutlined,
    SafetyCertificateOutlined,
    SettingOutlined,
    SolutionOutlined,
    TeamOutlined,
} from '@ant-design/icons';
import type { AccessMode } from '../stores/facilityStore';

export const COMPANY_PERMISSION_ROUTE = 'company-permissions';

export type MenuMode = 'full' | 'none';

export interface AccessPolicy {
    mode: AccessMode;
    defaultRoute: string;
    allowedRoutes: readonly string[];
    menuMode: MenuMode;
    canUseRealtime: boolean;
    canUseCompanyContext: boolean;
}

const FULL_ACCESS_ROUTES = [
    'dashboard',
    'health-professionals',
    'assets',
    'facilities',
    'affiliations',
    'add-affiliation',
    'bulk-upload',
    'bulk-upload/new',
    'bulk-upload/status',
    'licenses',
    'leave-summary',
    'claims',
    'attendance',
    'late-arrivals',
    'e-contracting',
    'user-management',
    'user-management/new',
    'user-management/security',
    'create-user',
    'edit-user',
    'profile',
    'budget-overview',
    'account-balances',
    'financial-reports',
    'hr-reports',
    'recruitment',
    'recruitment/job-posts',
    'recruitment/candidates',
] as const;

const NO_ACCESS_ALLOWED_ROUTES = [COMPANY_PERMISSION_ROUTE, 'profile'] as const;

export const getAccessPolicy = (mode: AccessMode): AccessPolicy => {
    switch (mode) {
        case 'company':
            return {
                mode,
                defaultRoute: 'dashboard',
                allowedRoutes: FULL_ACCESS_ROUTES,
                menuMode: 'full',
                canUseRealtime: true,
                canUseCompanyContext: true,
            };
        case 'oversight':
            return {
                mode,
                defaultRoute: 'dashboard',
                allowedRoutes: FULL_ACCESS_ROUTES,
                menuMode: 'full',
                canUseRealtime: true,
                canUseCompanyContext: false,
            };
        case 'none':
        default:
            return {
                mode: 'none',
                defaultRoute: COMPANY_PERMISSION_ROUTE,
                allowedRoutes: NO_ACCESS_ALLOWED_ROUTES,
                menuMode: 'none',
                canUseRealtime: false,
                canUseCompanyContext: false,
            };
    }
};

export const isRouteAllowed = (route: string, policy: AccessPolicy): boolean => {
    return policy.allowedRoutes.includes(route);
};

export const getMenuItemsForMode = (menuMode: MenuMode): ItemType[] => {
    if (menuMode === 'none') {
        return [];
    }

    return [
        {
            key: 'dashboard',
            icon: <DashboardOutlined />,
            label: 'Executive Dashboard',
        },
        {
            key: 'modules',
            icon: <AppstoreOutlined />,
            label: 'Modules',
            children: [
                {
                    key: 'health-professionals',
                    icon: <TeamOutlined />,
                    label: 'Health Professionals',
                },
                {
                    key: 'assets',
                    icon: <LaptopOutlined />,
                    label: 'Assets',
                },
                {
                    key: 'facilities',
                    icon: <MedicineBoxOutlined />,
                    label: 'Health Facilities',
                },
                {
                    key: 'affiliations',
                    icon: <LinkOutlined />,
                    label: 'Facility Affiliations',
                },
                {
                    key: 'bulk-upload',
                    icon: <CloudUploadOutlined />,
                    label: 'Bulk Upload',
                },
                {
                    key: 'licenses',
                    icon: <SafetyCertificateOutlined />,
                    label: 'Licenses',
                },
                {
                    key: 'leave-summary',
                    icon: <CalendarOutlined />,
                    label: 'Leave Applications',
                },
                {
                    key: 'claims',
                    icon: <FileTextOutlined />,
                    label: 'Claims',
                },
                {
                    key: 'attendance',
                    icon: <ClockCircleOutlined />,
                    label: 'Attendance Records',
                },
                {
                    key: 'e-contracting',
                    icon: <AuditOutlined />,
                    label: 'eContracting',
                },
                {
                    key: 'recruitment',
                    icon: <SolutionOutlined />,
                    label: 'Recruitment Desk',
                },
            ],
        },
        {
            key: 'administration',
            icon: <SettingOutlined />,
            label: 'Administration',
            children: [
                {
                    key: 'user-management',
                    icon: <TeamOutlined />,
                    label: 'User Management',
                },
            ],
        },
    ];
};

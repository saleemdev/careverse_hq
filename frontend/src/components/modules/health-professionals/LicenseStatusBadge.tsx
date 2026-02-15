import { Badge } from 'antd';
import type { HealthProfessional, LicenseStatus } from '../../../types/modules';

interface LicenseStatusBadgeProps {
    record: HealthProfessional;
}

export const LicenseStatusBadge = ({ record }: LicenseStatusBadgeProps) => {
    const status = calculateLicenseStatus(record.license_end);

    const statusConfig = {
        'Active': { status: 'success' as const, text: 'Active' },
        'Expiring Soon': { status: 'warning' as const, text: 'Expiring Soon' },
        'Expired': { status: 'error' as const, text: 'Expired' },
        'Not Licensed': { status: 'default' as const, text: 'Not Licensed' },
    };

    const config = statusConfig[status];

    return <Badge status={config.status} text={config.text} />;
};

function calculateLicenseStatus(licenseEnd?: string): LicenseStatus {
    if (!licenseEnd) return 'Not Licensed';

    const endDate = new Date(licenseEnd);
    const today = new Date();
    const daysUntilExpiry = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (daysUntilExpiry < 0) return 'Expired';
    if (daysUntilExpiry <= 30) return 'Expiring Soon';
    return 'Active';
}

export { calculateLicenseStatus };

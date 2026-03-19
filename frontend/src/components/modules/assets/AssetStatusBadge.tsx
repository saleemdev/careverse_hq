import React from 'react';
import { Badge } from 'antd';

const STATUS_MAP: Record<string, { antdStatus: 'success' | 'processing' | 'error' | 'warning' | 'default' }> = {
    'Draft':                   { antdStatus: 'default' },
    'Submitted':               { antdStatus: 'processing' },
    'Partially Depreciated':   { antdStatus: 'processing' },
    'Fully Depreciated':       { antdStatus: 'success' },
    'In Maintenance':          { antdStatus: 'warning' },
    'Out of Order':            { antdStatus: 'error' },
    'Scrapped':                { antdStatus: 'default' },
    'Sold':                    { antdStatus: 'default' },
    'Capitalized':             { antdStatus: 'processing' },
    'Work In Progress':        { antdStatus: 'warning' },
};

interface AssetStatusBadgeProps {
    status: string;
}

const AssetStatusBadge: React.FC<AssetStatusBadgeProps> = ({ status }) => {
    const mapped = STATUS_MAP[status] || { antdStatus: 'default' as const };
    return <Badge status={mapped.antdStatus} text={status || 'Unknown'} />;
};

export default AssetStatusBadge;

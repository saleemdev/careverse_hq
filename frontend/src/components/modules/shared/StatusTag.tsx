import React from 'react';
import { Tag } from 'antd';
import {
    CheckCircleOutlined,
    SyncOutlined,
    CloseCircleOutlined,
    ExclamationCircleOutlined,
    ClockCircleOutlined,
    StopOutlined
} from '@ant-design/icons';

interface StatusTagProps {
    status: string;
}

const StatusTag: React.FC<StatusTagProps> = ({ status }) => {
    let color = 'default';
    let icon = <ClockCircleOutlined />;

    const s = status?.toLowerCase() || '';

    if (['active', 'approved', 'submitted', 'present', 'success'].includes(s)) {
        color = 'success';
        icon = <CheckCircleOutlined />;
    } else if (['pending', 'draft', 'open'].includes(s)) {
        color = 'processing';
        icon = <SyncOutlined spin />;
    } else if (['inactive', 'rejected', 'cancelled', 'absent', 'error', 'left'].includes(s)) {
        color = 'error';
        icon = <CloseCircleOutlined />;
    } else if (['on leave', 'half day', 'warning'].includes(s)) {
        color = 'warning';
        icon = <ExclamationCircleOutlined />;
    } else if (['closed', 'expired'].includes(s)) {
        color = 'default';
        icon = <StopOutlined />;
    }

    return (
        <Tag icon={icon} color={color}>
            {status}
        </Tag>
    );
};

export default StatusTag;

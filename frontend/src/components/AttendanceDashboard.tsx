/**
 * Attendance Dashboard Component
 * Displays HR attendance metrics and employee attendance tracking
 */

import React from 'react';
import {
    Card,
    Button,
    Typography,
    theme,
} from 'antd';
import {
    ArrowLeftOutlined,
} from '@ant-design/icons';
import { useResponsive } from '../hooks/useResponsive';

const { Title } = Typography;

interface AttendanceDashboardProps {
    navigateToRoute?: (route: string, id?: string) => void;
}

import EmptyState from './shared/EmptyState/EmptyState';

const AttendanceDashboard: React.FC<AttendanceDashboardProps> = ({ navigateToRoute }) => {
    const { token } = theme.useToken();
    const { isMobile } = useResponsive();

    return (
        <div style={{ padding: isMobile ? '16px' : '24px', background: token.colorBgLayout, minHeight: 'calc(100vh - 64px)' }}>
            <div style={{ marginBottom: '24px' }}>
                <Button
                    type="text"
                    icon={<ArrowLeftOutlined />}
                    onClick={() => navigateToRoute?.('dashboard')}
                    style={{ marginBottom: '12px', padding: 0 }}
                >
                    Back to Dashboard
                </Button>
                <Title level={2} style={{ margin: 0 }}>Attendance Records</Title>
            </div>

            <Card style={{ borderRadius: 12, border: 'none', boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }}>
                <EmptyState
                    type="under-construction"
                    title="Real-time Attendance Coming Soon"
                    description="We are integrating biometric and device logs to provide you with live workforce visibility. This module will be available in the next update."
                    onAction={() => navigateToRoute?.('dashboard')}
                    actionText="Return to Dashboard"
                />
            </Card>
        </div>
    );
};

export default AttendanceDashboard;

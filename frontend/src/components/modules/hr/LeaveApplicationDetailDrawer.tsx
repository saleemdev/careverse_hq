import React, { useState, useEffect } from 'react';
import {
    Space,
    Typography,
    Button,
    Badge,
    Divider,
    Alert,
    message,
    theme,
    Empty,
} from 'antd';
import {
    UserOutlined,
    CalendarOutlined,
    ClockCircleOutlined,
    CheckCircleOutlined,
    CloseCircleOutlined,
    FileTextOutlined,
} from '@ant-design/icons';
import ModuleDetailDrawer from '../shared/ModuleDetailDrawer';
import { hrApi } from '../../../services/api';

const { Text } = Typography;

export interface LeaveApplicationDetail {
    name: string;
    employee?: string;
    employee_name?: string;
    leave_type?: string;
    from_date?: string;
    to_date?: string;
    total_leave_days?: number;
    status?: string;
    docstatus?: number;
    company?: string;
    reason_for_leave?: string;
    leave_approver?: string;
    posting_date?: string;
    modified?: string;
    modified_by?: string;
}

interface LeaveApplicationDetailDrawerProps {
    visible: boolean;
    leaveApplicationId: string | null;
    onClose: () => void;
    onActionComplete?: () => void;
}

const LeaveApplicationDetailDrawer: React.FC<LeaveApplicationDetailDrawerProps> = ({
    visible,
    leaveApplicationId,
    onClose,
    onActionComplete,
}) => {
    const { token } = theme.useToken();
    const [loading, setLoading] = useState(false);
    const [detail, setDetail] = useState<LeaveApplicationDetail | null>(null);
    const [actionLoading, setActionLoading] = useState<'approve' | 'reject' | null>(null);

    useEffect(() => {
        if (visible && leaveApplicationId) {
            fetchDetail();
        } else {
            setDetail(null);
        }
    }, [visible, leaveApplicationId]);

    const fetchDetail = async () => {
        if (!leaveApplicationId) return;
        setLoading(true);
        try {
            const response = await hrApi.getLeaveApplicationDetail(leaveApplicationId);
            if (response.success && response.data) {
                setDetail(response.data as LeaveApplicationDetail);
            } else {
                setDetail(null);
            }
        } catch {
            setDetail(null);
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async () => {
        if (!detail?.name) return;
        setActionLoading('approve');
        try {
            const response = await hrApi.approveLeaveApplication(detail.name);
            if (response.success) {
                await fetchDetail();
                onActionComplete?.();
            } else {
                message.error(response.error || response.message || 'Failed to approve');
            }
        } catch (e: any) {
            message.error(e?.message || 'Failed to approve');
        } finally {
            setActionLoading(null);
        }
    };

    const handleReject = async () => {
        if (!detail?.name) return;
        setActionLoading('reject');
        try {
            const response = await hrApi.rejectLeaveApplication(detail.name);
            if (response.success) {
                await fetchDetail();
                onActionComplete?.();
            } else {
                message.error(response.error || response.message || 'Failed to reject');
            }
        } catch (e: any) {
            message.error(e?.message || 'Failed to reject');
        } finally {
            setActionLoading(null);
        }
    };

    const getStatusBadge = () => {
        const status = detail?.status || 'Open';
        const s = status.toLowerCase();
        if (s === 'approved') return { status: 'success' as const, text: 'Approved' };
        if (s === 'rejected' || s === 'cancelled') return { status: 'error' as const, text: status };
        return { status: 'warning' as const, text: 'Pending' };
    };

    const badge = detail ? getStatusBadge() : null;
    const canAct = detail && (detail.status === 'Open' || detail.docstatus === 0);

    const drawerExtra = (
        <Space>
            {badge && <Badge status={badge.status} text={badge.text} />}
            {canAct && (
                <>
                    <Button
                        type="primary"
                        icon={<CheckCircleOutlined />}
                        onClick={handleApprove}
                        loading={actionLoading === 'approve'}
                    >
                        Approve
                    </Button>
                    <Button
                        danger
                        icon={<CloseCircleOutlined />}
                        onClick={handleReject}
                        loading={actionLoading === 'reject'}
                    >
                        Reject
                    </Button>
                </>
            )}
        </Space>
    );

    return (
        <ModuleDetailDrawer
            title={detail ? `Leave: ${detail.employee_name || detail.name}` : 'Leave Application'}
            visible={visible}
            onClose={onClose}
            loading={loading}
            extra={drawerExtra}
            width={480}
        >
            {!loading && !detail && leaveApplicationId && (
                <Empty
                    description="Could not load leave application."
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                >
                    <Button type="primary" onClick={() => fetchDetail()}>
                        Retry
                    </Button>
                </Empty>
            )}
            {!loading && detail && (
                <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                    {/* Status */}
                    <div style={{
                        padding: '12px 16px',
                        background: token.colorFillAlter,
                        borderRadius: 8,
                        borderLeft: `4px solid ${badge?.status === 'success' ? token.colorSuccess : badge?.status === 'error' ? token.colorError : token.colorWarning}`,
                    }}>
                        <Text type="secondary" style={{ fontSize: 12 }}>Status</Text>
                        <div style={{ marginTop: 4 }}>
                            <Badge status={badge?.status} text={<Text strong>{badge?.text}</Text>} />
                        </div>
                    </div>

                    {/* Employee & Leave type */}
                    <div>
                        <Text type="secondary" style={{ fontSize: 12 }}>Employee</Text>
                        <div style={{ marginTop: 4, display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div style={{
                                width: 36,
                                height: 36,
                                borderRadius: '50%',
                                background: token.colorPrimaryBg,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: token.colorPrimary,
                            }}>
                                <UserOutlined />
                            </div>
                            <div>
                                <Text strong style={{ fontSize: 15 }}>{detail.employee_name || detail.employee || '—'}</Text>
                                <div>
                                    <Text type="secondary" style={{ fontSize: 13 }}>{detail.leave_type || '—'}</Text>
                                </div>
                            </div>
                        </div>
                    </div>

                    <Divider style={{ margin: '12px 0' }} />

                    {/* Period */}
                    <div>
                        <Text type="secondary" style={{ fontSize: 12 }}>Leave period</Text>
                        <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
                            <CalendarOutlined style={{ color: token.colorTextSecondary }} />
                            <Text style={{ fontSize: 14 }}>
                                {detail.from_date} to {detail.to_date}
                            </Text>
                        </div>
                        <div style={{ marginTop: 4, display: 'flex', alignItems: 'center', gap: 8 }}>
                            <ClockCircleOutlined style={{ color: token.colorTextSecondary }} />
                            <Text type="secondary" style={{ fontSize: 13 }}>
                                {detail.total_leave_days ?? 0} day{detail.total_leave_days !== 1 ? 's' : ''} total
                            </Text>
                        </div>
                    </div>

                    {/* Reason */}
                    {(detail.reason_for_leave != null && detail.reason_for_leave !== '') && (
                        <>
                            <Divider style={{ margin: '12px 0' }} />
                            <div>
                                <Text type="secondary" style={{ fontSize: 12 }}>Reason</Text>
                                <div style={{ marginTop: 8, padding: '12px', background: token.colorFillAlter, borderRadius: 8 }}>
                                    <Text style={{ fontSize: 13 }}>{detail.reason_for_leave}</Text>
                                </div>
                            </div>
                        </>
                    )}

                    {/* Pending approval hint */}
                    {canAct && (
                        <Alert
                            message="Pending your decision"
                            description="Approve or reject this leave application using the buttons above."
                            type="info"
                            showIcon
                            icon={<FileTextOutlined />}
                            style={{ marginTop: 8 }}
                        />
                    )}
                </Space>
            )}
        </ModuleDetailDrawer>
    );
};

export default LeaveApplicationDetailDrawer;

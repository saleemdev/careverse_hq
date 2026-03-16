import React, { useEffect, useCallback, useState, useMemo } from 'react';
import {
    Table,
    Card,
    Row,
    Col,
    Statistic,
    Space,
    Typography,
    Badge,
    Button,
    Tabs,
    message,
    theme
} from 'antd';
import {
    CalendarOutlined,
    ClockCircleOutlined,
    CheckCircleOutlined,
    CloseCircleOutlined,
    ReloadOutlined,
    UserOutlined,
    CarryOutOutlined,
    CheckOutlined,
    StopOutlined
} from '@ant-design/icons';
import useLeaveStore from '../../../stores/modules/leaveStore';
import useFacilityStore from '../../../stores/facilityStore';
import { TableSkeleton } from '../../shared/Skeleton/Skeleton';
import EmptyState from '../../shared/EmptyState/EmptyState';
import { useResponsive } from '../../../hooks/useResponsive';
import LeaveApplicationDetailDrawer from './LeaveApplicationDetailDrawer';
import { hrApi } from '../../../services/api';

const { Text, Title } = Typography;

const LeaveApplicationsListView: React.FC = () => {
    const { token } = theme.useToken();
    const { isMobile } = useResponsive();
    const { selectedFacilityIds } = useFacilityStore();
    const facilityIds = selectedFacilityIds;
    const [selectedLeaveId, setSelectedLeaveId] = useState<string | null>(null);
    const [drawerVisible, setDrawerVisible] = useState(false);
    const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
    const [bulkLoading, setBulkLoading] = useState<'approve' | 'reject' | null>(null);

    const {
        leaves,
        loading,
        total,
        filters,
        fetchLeaves,
        setFilters
    } = useLeaveStore();

    const handleRefresh = useCallback(() => {
        fetchLeaves(facilityIds);
        setSelectedRowKeys([]);
    }, [fetchLeaves, facilityIds]);

    useEffect(() => {
        handleRefresh();
    }, [handleRefresh, filters.status, filters.page, filters.pageSize]);

    useEffect(() => {
        setSelectedRowKeys((prev) => {
            const inCurrent = new Set(leaves.map((r) => r.name));
            return prev.filter((k) => inCurrent.has(k as string));
        });
    }, [leaves]);

    const pendingSelected = leaves.filter(
        (r) => selectedRowKeys.includes(r.name) && (r.status === 'Open' || r.status === 'open')
    );
    const canBulkAct = pendingSelected.length > 0;

    const runBulkAction = async (action: 'approve' | 'reject') => {
        if (!canBulkAct) return;
        const api = action === 'approve' ? hrApi.approveLeaveApplication : hrApi.rejectLeaveApplication;
        setBulkLoading(action);
        let done = 0;
        let failed = 0;
        for (const row of pendingSelected) {
            const res = await api(row.name);
            if (res.success) done++;
            else failed++;
        }
        setBulkLoading(null);
        setSelectedRowKeys([]);
        handleRefresh();
        if (failed === 0) {
            message.success(`${done} leave application(s) ${action === 'approve' ? 'approved' : 'rejected'}.`);
        } else {
            message.warning(`${done} succeeded, ${failed} failed.`);
        }
    };

    const getStatusColor = useCallback((status: string) => {
        switch (status?.toLowerCase()) {
            case 'approved': return 'success';
            case 'open': return 'warning';
            case 'rejected': return 'error';
            case 'cancelled': return 'default';
            default: return 'processing';
        }
    }, []);

    const columns = useMemo(() => [
        {
            title: 'Employee',
            key: 'employee',
            fixed: 'left' as const,
            width: 250,
            render: (record: any) => (
                <Space>
                    <div style={{
                        width: 40,
                        height: 40,
                        borderRadius: '50%',
                        background: token.colorFillAlter,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: token.colorPrimary
                    }}>
                        <UserOutlined />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <Text strong style={{ fontSize: '14px' }}>{record.employee_name}</Text>
                        <Text type="secondary" style={{ fontSize: '12px' }}>{record.leave_type}</Text>
                    </div>
                </Space>
            ),
        },
        {
            title: 'Period',
            key: 'period',
            width: 220,
            render: (record: any) => (
                <Space direction="vertical" size={2}>
                    <Text style={{ fontSize: '13px' }}>
                        <CalendarOutlined style={{ marginRight: 8, color: token.colorTextDescription }} />
                        {record.from_date} to {record.to_date}
                    </Text>
                    <Text type="secondary" style={{ fontSize: '12px' }}>
                        {record.total_leave_days} Days Total
                    </Text>
                </Space>
            )
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            width: 150,
            render: (status: string) => (
                <Badge status={getStatusColor(status) as any} text={status || 'Open'} />
            )
        },
        {
            title: 'Action',
            key: 'action',
            fixed: 'right' as const,
            width: 120,
            render: (record: any) => (
                <Button
                    type="link"
                    onClick={() => {
                        setSelectedLeaveId(record.name);
                        setDrawerVisible(true);
                    }}
                >
                    View Details
                </Button>
            )
        }
    ], [token, getStatusColor]);

    return (
        <div style={{ padding: isMobile ? '16px' : '24px' }}>
            {/* Metric Section */}
            <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
                <Col xs={12} sm={6}>
                    <Card size="small" className="stat-card stat-card--primary">
                        <Statistic
                            title={<Text type="secondary" style={{ fontSize: 12 }}>TOTAL APPLICATIONS</Text>}
                            value={total}
                            prefix={<CarryOutOutlined style={{ color: token.colorPrimary, marginRight: 8 }} />}
                            valueStyle={{ fontSize: 20, fontWeight: 700 }}
                        />
                    </Card>
                </Col>
                <Col xs={12} sm={6}>
                    <Card size="small" className="stat-card stat-card--warning">
                        <Statistic
                            title={<Text type="secondary" style={{ fontSize: 12 }}>PENDING</Text>}
                            value={leaves.filter(l => l.status === 'Open').length}
                            prefix={<ClockCircleOutlined style={{ color: token.colorWarning, marginRight: 8 }} />}
                            valueStyle={{ fontSize: 20, fontWeight: 700 }}
                        />
                    </Card>
                </Col>
                <Col xs={12} sm={6}>
                    <Card size="small" className="stat-card stat-card--success">
                        <Statistic
                            title={<Text type="secondary" style={{ fontSize: 12 }}>APPROVED</Text>}
                            value={leaves.filter(l => l.status === 'Approved').length}
                            prefix={<CheckCircleOutlined style={{ color: token.colorSuccess, marginRight: 8 }} />}
                            valueStyle={{ fontSize: 20, fontWeight: 700 }}
                        />
                    </Card>
                </Col>
                <Col xs={12} sm={6}>
                    <Card size="small" className="stat-card stat-card--error">
                        <Statistic
                            title={<Text type="secondary" style={{ fontSize: 12 }}>REJECTED</Text>}
                            value={leaves.filter(l => l.status === 'Rejected').length}
                            prefix={<CloseCircleOutlined style={{ color: token.colorError, marginRight: 8 }} />}
                            valueStyle={{ fontSize: 20, fontWeight: 700 }}
                        />
                    </Card>
                </Col>
            </Row>

            {/* Table Section */}
            <Card
                style={{ borderRadius: 12, border: 'none', boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }}
                bodyStyle={{ padding: 0 }}
                title={
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                            <Title level={4} style={{ margin: 0 }}>Leave Applications</Title>
                            <Space wrap>
                                <Button icon={<ReloadOutlined />} onClick={handleRefresh} aria-label="Reload list" />
                            </Space>
                        </div>
                        <Tabs
                            activeKey={filters.status === '' ? 'all' : filters.status}
                            onChange={(key) => setFilters({ status: key === 'all' ? '' : key })}
                            size="small"
                            style={{ marginBottom: 0 }}
                            items={[
                                { key: 'all', label: 'All' },
                                { key: 'Open', label: 'Pending' },
                                { key: 'Approved', label: 'Approved' },
                                { key: 'Rejected', label: 'Rejected' },
                            ]}
                        />
                    </div>
                }
            >
                {selectedRowKeys.length > 0 && (
                    <div style={{
                        padding: '12px 24px',
                        background: token.colorPrimaryBg,
                        borderBottom: `1px solid ${token.colorBorderSecondary}`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        flexWrap: 'wrap',
                        gap: 12,
                    }}>
                        <Text type="secondary">
                            {selectedRowKeys.length} selected
                            {pendingSelected.length < selectedRowKeys.length && (
                                <span style={{ marginLeft: 8 }}>
                                    ({pendingSelected.length} pending — only pending can be approved/rejected)
                                </span>
                            )}
                        </Text>
                        <Space>
                            <Button
                                type="primary"
                                size="small"
                                icon={<CheckOutlined />}
                                onClick={() => runBulkAction('approve')}
                                disabled={!canBulkAct}
                                loading={bulkLoading === 'approve'}
                            >
                                Approve selected
                            </Button>
                            <Button
                                danger
                                size="small"
                                icon={<StopOutlined />}
                                onClick={() => runBulkAction('reject')}
                                disabled={!canBulkAct}
                                loading={bulkLoading === 'reject'}
                            >
                                Reject selected
                            </Button>
                            <Button size="small" onClick={() => setSelectedRowKeys([])}>
                                Clear selection
                            </Button>
                        </Space>
                    </div>
                )}
                {loading ? (
                    <TableSkeleton rows={filters.pageSize} />
                ) : leaves.length > 0 ? (
                    <Table
                        dataSource={leaves}
                        columns={columns}
                        rowKey="name"
                        rowSelection={{
                            selectedRowKeys,
                            onChange: (keys) => setSelectedRowKeys(keys as string[]),
                            getCheckboxProps: (record: any) => ({
                                disabled: record.status !== 'Open' && record.status !== 'open',
                            }),
                        }}
                        pagination={{
                            current: filters.page,
                            pageSize: filters.pageSize,
                            total,
                            showSizeChanger: true,
                            onChange: (page, pageSize) => setFilters({ page, pageSize })
                        }}
                        scroll={{ x: 'max-content' }}
                        size="middle"
                    />
                ) : (
                    <EmptyState
                        type="no-data"
                        title="No Leave Applications"
                        description="There are no active or pending leave applications for your selected facilities."
                        onAction={handleRefresh}
                        actionText="Reload Applications"
                    />
                )}
            </Card>

            <LeaveApplicationDetailDrawer
                visible={drawerVisible}
                leaveApplicationId={selectedLeaveId}
                onClose={() => {
                    setDrawerVisible(false);
                    setSelectedLeaveId(null);
                }}
                onActionComplete={handleRefresh}
            />
        </div>
    );
};

export default LeaveApplicationsListView;

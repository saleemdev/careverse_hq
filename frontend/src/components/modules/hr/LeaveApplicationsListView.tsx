import React, { useEffect, useCallback } from 'react';
import {
    Table,
    Card,
    Row,
    Col,
    Statistic,
    Input,
    Space,
    Typography,
    Badge,
    Button,
    theme
} from 'antd';
import {
    CalendarOutlined,
    ClockCircleOutlined,
    CheckCircleOutlined,
    CloseCircleOutlined,
    SearchOutlined,
    ReloadOutlined,
    UserOutlined,
    CarryOutOutlined
} from '@ant-design/icons';
import useLeaveStore from '../../../stores/modules/leaveStore';
import useFacilityStore from '../../../stores/facilityStore';
import { TableSkeleton } from '../../shared/Skeleton/Skeleton';
import EmptyState from '../../shared/EmptyState/EmptyState';
import { useResponsive } from '../../../hooks/useResponsive';

const { Text, Title } = Typography;

const LeaveApplicationsListView: React.FC = () => {
    const { token } = theme.useToken();
    const { isMobile } = useResponsive();
    const { selectedFacilityIds } = useFacilityStore();
    const facilityIds = selectedFacilityIds;

    const {
        leaves,
        loading,
        filters,
        fetchLeaves,
        setFilters
    } = useLeaveStore();

    const handleRefresh = useCallback(() => {
        // Stringify to ensure stable dependency check if needed, 
        // but selectedFacilityIds is now stable from the store
        fetchLeaves(facilityIds);
    }, [fetchLeaves, facilityIds]);

    useEffect(() => {
        handleRefresh();
    }, [handleRefresh, filters.status, filters.page, filters.pageSize]);

    const getStatusColor = (status: string) => {
        switch (status?.toLowerCase()) {
            case 'approved': return 'success';
            case 'open': return 'warning';
            case 'rejected': return 'error';
            case 'cancelled': return 'default';
            default: return 'processing';
        }
    };

    const columns = [
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
            width: 100,
            render: () => <Button type="link">View Details</Button>
        }
    ];

    return (
        <div style={{ padding: isMobile ? '16px' : '24px' }}>
            {/* Metric Section */}
            <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
                <Col xs={12} sm={6}>
                    <Card size="small" style={{ borderRadius: 12, border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                        <Statistic
                            title={<Text type="secondary" style={{ fontSize: 12 }}>TOTAL APPLICATIONS</Text>}
                            value={leaves.length}
                            prefix={<CarryOutOutlined style={{ color: token.colorPrimary, marginRight: 8 }} />}
                            valueStyle={{ fontSize: 20, fontWeight: 700 }}
                        />
                    </Card>
                </Col>
                <Col xs={12} sm={6}>
                    <Card size="small" style={{ borderRadius: 12, border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                        <Statistic
                            title={<Text type="secondary" style={{ fontSize: 12 }}>PENDING</Text>}
                            value={leaves.filter(l => l.status === 'Open').length}
                            prefix={<ClockCircleOutlined style={{ color: '#faad14', marginRight: 8 }} />}
                            valueStyle={{ fontSize: 20, fontWeight: 700 }}
                        />
                    </Card>
                </Col>
                <Col xs={12} sm={6}>
                    <Card size="small" style={{ borderRadius: 12, border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                        <Statistic
                            title={<Text type="secondary" style={{ fontSize: 12 }}>APPROVED</Text>}
                            value={leaves.filter(l => l.status === 'Approved').length}
                            prefix={<CheckCircleOutlined style={{ color: '#52c41a', marginRight: 8 }} />}
                            valueStyle={{ fontSize: 20, fontWeight: 700 }}
                        />
                    </Card>
                </Col>
                <Col xs={12} sm={6}>
                    <Card size="small" style={{ borderRadius: 12, border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                        <Statistic
                            title={<Text type="secondary" style={{ fontSize: 12 }}>REJECTED</Text>}
                            value={leaves.filter(l => l.status === 'Rejected').length}
                            prefix={<CloseCircleOutlined style={{ color: '#ff4d4f', marginRight: 8 }} />}
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
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, padding: '16px 24px' }}>
                        <Title level={4} style={{ margin: 0 }}>Leave Applications</Title>
                        <Space wrap>
                            <Input
                                placeholder="Search employee..."
                                prefix={<SearchOutlined style={{ color: token.colorTextPlaceholder }} />}
                                style={{ width: 250, borderRadius: 8 }}
                                allowClear
                            />
                            <Button icon={<ReloadOutlined />} onClick={handleRefresh} />
                        </Space>
                    </div>
                }
            >
                {loading ? (
                    <TableSkeleton rows={filters.pageSize} />
                ) : leaves.length > 0 ? (
                    <Table
                        dataSource={leaves}
                        columns={columns}
                        rowKey="name"
                        pagination={{
                            current: filters.page,
                            pageSize: filters.pageSize,
                            total: leaves.length,
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
        </div>
    );
};

export default LeaveApplicationsListView;

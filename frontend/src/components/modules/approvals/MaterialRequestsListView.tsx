import React, { useEffect, useCallback } from 'react';
import {
    Table,
    Card,
    Row,
    Col,
    Statistic,
    Tag,
    Input,
    Space,
    Typography,
    Button,
    theme,
    Badge
} from 'antd';
import {
    InboxOutlined,
    AppstoreOutlined,
    ClockCircleOutlined,
    SearchOutlined,
    ReloadOutlined,
    CarryOutOutlined
} from '@ant-design/icons';
import useFinanceModuleStore from '../../../stores/modules/financeStore';
import { TableSkeleton } from '../../shared/Skeleton/Skeleton';
import EmptyState from '../../shared/EmptyState/EmptyState';
import { useResponsive } from '../../../hooks/useResponsive';

const { Text, Title } = Typography;

const MaterialRequestsListView: React.FC = () => {
    const { token } = theme.useToken();
    const { isMobile } = useResponsive();

    const {
        materialRequests,
        loading,
        filters,
        fetchMaterialRequests,
        setFilters
    } = useFinanceModuleStore();

    const handleRefresh = useCallback(() => {
        fetchMaterialRequests();
    }, [fetchMaterialRequests]);

    useEffect(() => {
        handleRefresh();
    }, [handleRefresh, filters.status, filters.page, filters.pageSize]);

    const getStatusColor = (status: string) => {
        switch (status?.toLowerCase()) {
            case 'completed': return 'success';
            case 'pending': return 'warning';
            case 'stopped': return 'error';
            case 'draft': return 'default';
            default: return 'processing';
        }
    };

    const columns = [
        {
            title: 'Request ID',
            key: 'name',
            fixed: 'left' as const,
            width: 150,
            render: (record: any) => (
                <Space>
                    <InboxOutlined style={{ color: token.colorPrimary }} />
                    <Text strong>{record.name}</Text>
                </Space>
            ),
        },
        {
            title: 'Type',
            dataIndex: 'material_request_type',
            key: 'type',
            width: 200,
            render: (type: string) => (
                <Tag color="cyan" style={{ borderRadius: 4 }}>{type}</Tag>
            )
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            width: 150,
            render: (status: string) => (
                <Badge status={getStatusColor(status) as any} text={status} />
            )
        },
        {
            title: 'Date',
            dataIndex: 'transaction_date',
            key: 'date',
            width: 150,
        },
        {
            title: 'Action',
            key: 'action',
            fixed: 'right' as const,
            width: 120,
            render: () => <Button type="link">Process Items</Button>
        }
    ];

    return (
        <div style={{ padding: isMobile ? '16px' : '24px' }}>
            {/* Metric Section */}
            <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
                <Col xs={12} sm={8}>
                    <Card size="small" style={{ borderRadius: 12, border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                        <Statistic
                            title={<Text type="secondary" style={{ fontSize: 12 }}>TOTAL REQUESTS</Text>}
                            value={materialRequests.length}
                            prefix={<AppstoreOutlined style={{ color: token.colorPrimary, marginRight: 8 }} />}
                            valueStyle={{ fontSize: 20, fontWeight: 700 }}
                        />
                    </Card>
                </Col>
                <Col xs={12} sm={8}>
                    <Card size="small" style={{ borderRadius: 12, border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                        <Statistic
                            title={<Text type="secondary" style={{ fontSize: 12 }}>PURCHASE REQS</Text>}
                            value={materialRequests.filter(m => m.material_request_type === 'Purchase').length}
                            prefix={<CarryOutOutlined style={{ color: '#722ed1', marginRight: 8 }} />}
                            valueStyle={{ fontSize: 20, fontWeight: 700 }}
                        />
                    </Card>
                </Col>
                <Col xs={12} sm={8}>
                    <Card size="small" style={{ borderRadius: 12, border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                        <Statistic
                            title={<Text type="secondary" style={{ fontSize: 12 }}>PENDING</Text>}
                            value={materialRequests.filter(m => m.status === 'Pending').length}
                            prefix={<ClockCircleOutlined style={{ color: '#faad14', marginRight: 8 }} />}
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
                        <Title level={4} style={{ margin: 0 }}>Material Requests</Title>
                        <Space wrap>
                            <Input
                                placeholder="Search by ID..."
                                prefix={<SearchOutlined style={{ color: token.colorTextPlaceholder }} />}
                                style={{ width: 250, borderRadius: 8 }}
                                allowClear
                            />
                            <Button icon={<ReloadOutlined />} onClick={handleRefresh} />
                        </Space>
                    </div>
                }
            >
                {loading.mr ? (
                    <TableSkeleton rows={filters.pageSize} />
                ) : materialRequests.length > 0 ? (
                    <Table
                        dataSource={materialRequests}
                        columns={columns}
                        rowKey="name"
                        pagination={{
                            current: filters.page,
                            pageSize: filters.pageSize,
                            total: materialRequests.length,
                            showSizeChanger: true,
                            onChange: (page, pageSize) => setFilters({ page, pageSize })
                        }}
                        scroll={{ x: 'max-content' }}
                        size="middle"
                    />
                ) : (
                    <EmptyState
                        type="no-data"
                        title="No Material Requests"
                        description="There are currently no internal material or inventory requests to display."
                        onAction={handleRefresh}
                        actionText="Reload Requests"
                    />
                )}
            </Card>
        </div>
    );
};

export default MaterialRequestsListView;

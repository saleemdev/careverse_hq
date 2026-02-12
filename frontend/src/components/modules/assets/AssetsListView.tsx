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
    Badge,
    Button,
    theme
} from 'antd';
import {
    LaptopOutlined,
    ToolOutlined,
    CheckCircleOutlined,
    WarningOutlined,
    SearchOutlined,
    ReloadOutlined,
    EnvironmentOutlined,
    BarcodeOutlined
} from '@ant-design/icons';
import useAssetStore from '../../../stores/modules/assetStore';
import useFacilityStore from '../../../stores/facilityStore';
import { TableSkeleton } from '../../shared/Skeleton/Skeleton';
import EmptyState from '../../shared/EmptyState/EmptyState';
import { useResponsive } from '../../../hooks/useResponsive';
import { COMPONENT_WIDTHS } from '../../../styles/tokens';

const { Text, Title } = Typography;

const AssetsListView: React.FC = () => {
    const { token } = theme.useToken();
    const { isMobile, getResponsiveValue } = useResponsive();
    const { selectedFacilityIds } = useFacilityStore();
    const facilityIds = selectedFacilityIds;

    const {
        assets,
        loading,
        filters,
        fetchAssets,
        setFilters
    } = useAssetStore();

    const handleRefresh = useCallback(() => {
        fetchAssets(facilityIds);
    }, [fetchAssets, facilityIds]);

    useEffect(() => {
        handleRefresh();
    }, [handleRefresh, filters.status, filters.page, filters.pageSize]);

    const getStatusColor = (status: string) => {
        switch (status?.toLowerCase()) {
            case 'active': return 'success';
            case 'in maintenance': return 'warning';
            case 'faulty': return 'error';
            case 'retired': return 'default';
            default: return 'processing';
        }
    };

    const columns = [
        {
            title: 'Device Info',
            key: 'device',
            fixed: 'left' as const,
            width: 250,
            render: (record: any) => (
                <Space>
                    <div style={{
                        width: 40,
                        height: 40,
                        borderRadius: 8,
                        background: token.colorFillAlter,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: token.colorPrimary
                    }}>
                        <LaptopOutlined />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <Text strong style={{ fontSize: '14px' }}>{record.device_name || 'Generic Device'}</Text>
                        <Text type="secondary" style={{ fontSize: '12px' }}>
                            <BarcodeOutlined style={{ marginRight: 4 }} /> {record.device_id || record.name}
                        </Text>
                    </div>
                </Space>
            ),
        },
        {
            title: 'Category',
            dataIndex: 'category',
            key: 'category',
            width: 150,
            render: (category: string) => <Tag>{category || 'Automation'}</Tag>
        },
        {
            title: 'Location',
            dataIndex: 'health_facility',
            key: 'facility',
            width: 200,
            render: (facility: string) => (
                <Space>
                    <EnvironmentOutlined style={{ color: token.colorTextDescription }} />
                    <Text style={{ fontSize: '13px' }}>{facility || 'Central Hub'}</Text>
                </Space>
            )
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            width: 150,
            render: (status: string) => (
                <Badge status={getStatusColor(status) as any} text={status || 'Active'} />
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
                            title={<Text type="secondary" style={{ fontSize: 12 }}>TOTAL ASSETS</Text>}
                            value={assets.length}
                            prefix={<LaptopOutlined style={{ color: token.colorPrimary, marginRight: 8 }} />}
                            valueStyle={{ fontSize: 20, fontWeight: 700 }}
                        />
                    </Card>
                </Col>
                <Col xs={12} sm={6}>
                    <Card size="small" style={{ borderRadius: 12, border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                        <Statistic
                            title={<Text type="secondary" style={{ fontSize: 12 }}>ACTIVE</Text>}
                            value={assets.filter(a => a.status === 'Active').length}
                            prefix={<CheckCircleOutlined style={{ color: '#52c41a', marginRight: 8 }} />}
                            valueStyle={{ fontSize: 20, fontWeight: 700 }}
                        />
                    </Card>
                </Col>
                <Col xs={12} sm={6}>
                    <Card size="small" style={{ borderRadius: 12, border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                        <Statistic
                            title={<Text type="secondary" style={{ fontSize: 12 }}>MAINTENANCE</Text>}
                            value={assets.filter(a => a.status === 'In Maintenance').length}
                            prefix={<ToolOutlined style={{ color: '#faad14', marginRight: 8 }} />}
                            valueStyle={{ fontSize: 20, fontWeight: 700 }}
                        />
                    </Card>
                </Col>
                <Col xs={12} sm={6}>
                    <Card size="small" style={{ borderRadius: 12, border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                        <Statistic
                            title={<Text type="secondary" style={{ fontSize: 12 }}>FAULTY</Text>}
                            value={assets.filter(a => a.status === 'Faulty').length}
                            prefix={<WarningOutlined style={{ color: '#ff4d4f', marginRight: 8 }} />}
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
                        <Title level={4} style={{ margin: 0 }}>Asset Inventory</Title>
                        <Space wrap>
                            <Input
                                placeholder="Search by ID or Name..."
                                prefix={<SearchOutlined style={{ color: token.colorTextPlaceholder }} />}
                                style={{
                                    width: getResponsiveValue(COMPONENT_WIDTHS.searchInput),
                                    minWidth: isMobile ? '120px' : 'auto',
                                    borderRadius: 8
                                }}
                                allowClear
                            />
                            <Button icon={<ReloadOutlined />} onClick={handleRefresh} />
                        </Space>
                    </div>
                }
            >
                {loading ? (
                    <TableSkeleton rows={filters.pageSize} />
                ) : assets.length > 0 ? (
                    <Table
                        dataSource={assets}
                        columns={columns}
                        rowKey="name"
                        pagination={{
                            current: filters.page,
                            pageSize: filters.pageSize,
                            total: assets.length,
                            showSizeChanger: true,
                            onChange: (page, pageSize) => setFilters({ page, pageSize })
                        }}
                        scroll={{ x: 'max-content' }}
                        size="middle"
                    />
                ) : (
                    <EmptyState
                        type="no-data"
                        title="No Assets Found"
                        description="Try selecting a different facility or check back later."
                        onAction={handleRefresh}
                        actionText="Reload Assets"
                    />
                )}
            </Card>
        </div>
    );
};

export default AssetsListView;

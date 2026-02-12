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
    MedicineBoxOutlined,
    GlobalOutlined,
    CheckCircleOutlined,
    CloudServerOutlined,
    SearchOutlined,
    ReloadOutlined,
    HomeOutlined,
    InfoCircleOutlined
} from '@ant-design/icons';
import useFacilitiesModuleStore from '../../../stores/modules/facilitiesModuleStore';
import useFacilityStore from '../../../stores/facilityStore';
import { TableSkeleton } from '../../shared/Skeleton/Skeleton';
import EmptyState from '../../shared/EmptyState/EmptyState';
import { useResponsive } from '../../../hooks/useResponsive';
import { COMPONENT_WIDTHS } from '../../../styles/tokens';

const { Text, Title } = Typography;

const FacilitiesListView: React.FC = () => {
    const { token } = theme.useToken();
    const { isMobile, isTablet, getResponsiveValue } = useResponsive();
    const { company } = useFacilityStore();

    const {
        facilities,
        loading,
        filters,
        fetchFacilities,
        setFilters
    } = useFacilitiesModuleStore();

    const handleRefresh = useCallback(() => {
        fetchFacilities();
    }, [fetchFacilities]);

    useEffect(() => {
        handleRefresh();
    }, [handleRefresh, filters.page, filters.pageSize]);

    const getLevelColor = (level: string) => {
        if (level?.includes('L6')) return '#722ed1';
        if (level?.includes('L5')) return '#1890ff';
        if (level?.includes('L4')) return '#13c2c2';
        return '#52c41a';
    };

    const columns = [
        {
            title: 'Facility Name',
            key: 'facility',
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
                        <MedicineBoxOutlined />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <Text strong style={{ fontSize: '14px' }}>{record.facility_name}</Text>
                        <Text type="secondary" style={{ fontSize: '12px' }}>
                            <CloudServerOutlined style={{ marginRight: 4 }} /> ID: {record.hie_id || record.name}
                        </Text>
                    </div>
                </Space>
            ),
        },
        {
            title: 'Level',
            dataIndex: 'facility_level',
            key: 'level',
            width: 120,
            render: (level: string) => (
                <Tag color={getLevelColor(level)} style={{ borderRadius: 4 }}>{level || 'Level 4'}</Tag>
            )
        },
        {
            title: 'Location Detail',
            key: 'location',
            width: 200,
            render: (record: any) => (
                <Space direction="vertical" size={0}>
                    <Text style={{ fontSize: '13px' }}>
                        <HomeOutlined style={{ marginRight: 8, color: token.colorTextDescription }} />
                        {record.county || 'Nairobi'}
                    </Text>
                    <Text type="secondary" style={{ fontSize: '11px', marginLeft: 21 }}>
                        Sub-county Region
                    </Text>
                </Space>
            )
        },
        {
            title: 'Operational Status',
            dataIndex: 'operational_status',
            key: 'status',
            width: 160,
            render: (status: string) => (
                <Badge status={status === 'Operational' ? 'success' : 'warning'} text={status || 'Operational'} />
            )
        },
        {
            title: 'Action',
            key: 'action',
            fixed: 'right' as const,
            width: 100,
            render: () => <Button type="link">View Map</Button>
        }
    ];

    return (
        <div style={{ padding: isMobile ? '16px' : '24px' }}>
            {/* Metric Section */}
            <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
                <Col xs={12} sm={6}>
                    <Card size="small" style={{ borderRadius: 12, border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                        <Statistic
                            title={<Text type="secondary" style={{ fontSize: 12 }}>TOTAL FACILITIES</Text>}
                            value={facilities.length}
                            prefix={<GlobalOutlined style={{ color: token.colorPrimary, marginRight: 8 }} />}
                            valueStyle={{ fontSize: 20, fontWeight: 700 }}
                        />
                    </Card>
                </Col>
                <Col xs={12} sm={6}>
                    <Card size="small" style={{ borderRadius: 12, border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                        <Statistic
                            title={<Text type="secondary" style={{ fontSize: 12 }}>OPERATIONAL</Text>}
                            value={facilities.filter(f => f.operational_status === 'Operational').length}
                            prefix={<CheckCircleOutlined style={{ color: '#52c41a', marginRight: 8 }} />}
                            valueStyle={{ fontSize: 20, fontWeight: 700 }}
                        />
                    </Card>
                </Col>
                <Col xs={12} sm={6}>
                    <Card size="small" style={{ borderRadius: 12, border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                        <Statistic
                            title={<Text type="secondary" style={{ fontSize: 12 }}>LEVEL 4-6</Text>}
                            value={facilities.filter(f => f.facility_level?.match(/L[4-6]/)).length}
                            prefix={<MedicineBoxOutlined style={{ color: '#722ed1', marginRight: 8 }} />}
                            valueStyle={{ fontSize: 20, fontWeight: 700 }}
                        />
                    </Card>
                </Col>
                <Col xs={12} sm={6}>
                    <Card size="small" style={{ borderRadius: 12, border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                        <Statistic
                            title={<Text type="secondary" style={{ fontSize: 12 }}>COUNTIES</Text>}
                            value={new Set(facilities.map(f => f.county)).size}
                            prefix={<InfoCircleOutlined style={{ color: '#faad14', marginRight: 8 }} />}
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
                        <Title level={4} style={{ margin: 0 }}>Health Facility Directory</Title>
                        <Space wrap>
                            <Input
                                placeholder="Search facilities..."
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
                ) : facilities.length > 0 ? (
                    <Table
                        dataSource={facilities}
                        columns={columns}
                        rowKey="name"
                        pagination={{
                            current: filters.page,
                            pageSize: filters.pageSize,
                            total: facilities.length,
                            showSizeChanger: true,
                            onChange: (page, pageSize) => setFilters({ page, pageSize })
                        }}
                        scroll={{ x: 'max-content' }}
                        size="middle"
                    />
                ) : (
                    <EmptyState
                        type="no-data"
                        title="No Facilities Registered"
                        description={`There are no health facilities registered under ${company?.company_name || 'your company'}.`}
                        onAction={handleRefresh}
                        actionText="Reload List"
                    />
                )}
            </Card>
        </div>
    );
};

export default FacilitiesListView;

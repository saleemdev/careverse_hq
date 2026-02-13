import React, { useEffect, useCallback, useState } from 'react';
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
    Select,
    theme
} from 'antd';
import {
    LinkOutlined,
    ClockCircleOutlined,
    CheckCircleOutlined,
    CloseCircleOutlined,
    SearchOutlined,
    ReloadOutlined,
    UserOutlined,
    MedicineBoxOutlined
} from '@ant-design/icons';
import useAffiliationsModuleStore from '../../../stores/modules/affiliationsModuleStore';
import useFacilityStore from '../../../stores/facilityStore';
import { TableSkeleton } from '../../shared/Skeleton/Skeleton';
import EmptyState from '../../shared/EmptyState/EmptyState';
import { useResponsive } from '../../../hooks/useResponsive';

const { Text, Title } = Typography;

const AffiliationsListView: React.FC = () => {
    const { token } = theme.useToken();
    const { isMobile } = useResponsive();
    const { availableFacilities, selectedFacilityIds } = useFacilityStore();

    // Local facility filter state (independent of global facility context)
    const [localFacilityFilter, setLocalFacilityFilter] = useState<string[]>([]);

    const {
        affiliations,
        loading,
        total,
        filters,
        fetchAffiliations,
        setFilters
    } = useAffiliationsModuleStore();

    // Determine which facility IDs to use for the API call
    // If local filter is set, use it; otherwise use global selected facilities
    const effectiveFacilityIds = localFacilityFilter.length > 0
        ? localFacilityFilter
        : selectedFacilityIds;

    const handleRefresh = useCallback(() => {
        fetchAffiliations(effectiveFacilityIds);
    }, [fetchAffiliations, effectiveFacilityIds]);

    const handleFacilityFilterChange = (selectedIds: string[]) => {
        setLocalFacilityFilter(selectedIds);
    };

    useEffect(() => {
        handleRefresh();
    }, [handleRefresh, filters.status, filters.page, filters.pageSize]);

    const getStatusColor = (status: string) => {
        switch (status?.toLowerCase()) {
            case 'active':
            case 'confirmed': return 'success';
            case 'pending': return 'warning';
            case 'rejected': return 'error';
            case 'inactive': return 'default';
            default: return 'processing';
        }
    };

    const columns = [
        {
            title: 'Professional',
            key: 'professional',
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
                        <Text strong style={{ fontSize: '14px' }}>{record.health_professional_name}</Text>
                        <Text type="secondary" style={{ fontSize: '12px' }}>{record.employment_type || 'Contract'}</Text>
                    </div>
                </Space>
            ),
        },
        {
            title: 'Health Facility',
            dataIndex: 'health_facility',
            key: 'facility',
            width: 200,
            render: (facility: string) => (
                <Space>
                    <MedicineBoxOutlined style={{ color: token.colorTextDescription }} />
                    <Text style={{ fontSize: '13px' }}>{facility}</Text>
                </Space>
            )
        },
        {
            title: 'Requested Date',
            dataIndex: 'requested_date',
            key: 'date',
            width: 150,
            render: (date: string) => (
                <Text style={{ fontSize: '13px' }}>{date || 'N/A'}</Text>
            )
        },
        {
            title: 'Status',
            dataIndex: 'affiliation_status',
            key: 'status',
            width: 150,
            render: (status: string) => (
                <Tag color={getStatusColor(status)} style={{ borderRadius: 12, padding: '0 12px' }}>
                    {status || 'Pending'}
                </Tag>
            )
        },
        {
            title: 'Action',
            key: 'action',
            fixed: 'right' as const,
            width: 100,
            render: () => <Button type="link">Review</Button>
        }
    ];

    return (
        <div style={{ padding: isMobile ? '16px' : '24px' }}>
            {/* Metric Section */}
            <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
                <Col xs={12} sm={6}>
                    <Card size="small" style={{ borderRadius: 12, border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                        <Statistic
                            title={<Text type="secondary" style={{ fontSize: 12 }}>TOTAL REQUESTS</Text>}
                            value={affiliations.length}
                            prefix={<LinkOutlined style={{ color: token.colorPrimary, marginRight: 8 }} />}
                            valueStyle={{ fontSize: 20, fontWeight: 700 }}
                        />
                    </Card>
                </Col>
                <Col xs={12} sm={6}>
                    <Card size="small" style={{ borderRadius: 12, border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                        <Statistic
                            title={<Text type="secondary" style={{ fontSize: 12 }}>PENDING</Text>}
                            value={affiliations.filter(a => a.affiliation_status === 'Pending').length}
                            prefix={<ClockCircleOutlined style={{ color: '#faad14', marginRight: 8 }} />}
                            valueStyle={{ fontSize: 20, fontWeight: 700 }}
                        />
                    </Card>
                </Col>
                <Col xs={12} sm={6}>
                    <Card size="small" style={{ borderRadius: 12, border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                        <Statistic
                            title={<Text type="secondary" style={{ fontSize: 12 }}>CONFIRMED</Text>}
                            value={affiliations.filter(a => ['Active', 'Confirmed'].includes(a.affiliation_status)).length}
                            prefix={<CheckCircleOutlined style={{ color: '#52c41a', marginRight: 8 }} />}
                            valueStyle={{ fontSize: 20, fontWeight: 700 }}
                        />
                    </Card>
                </Col>
                <Col xs={12} sm={6}>
                    <Card size="small" style={{ borderRadius: 12, border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                        <Statistic
                            title={<Text type="secondary" style={{ fontSize: 12 }}>REJECTED</Text>}
                            value={affiliations.filter(a => a.affiliation_status === 'Rejected').length}
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
                        <Title level={4} style={{ margin: 0 }}>Affiliation Requests</Title>
                        <Space wrap>
                            <Select
                                mode="multiple"
                                placeholder="All Facilities"
                                value={localFacilityFilter}
                                onChange={handleFacilityFilterChange}
                                style={{ minWidth: isMobile ? 180 : 250, borderRadius: 8 }}
                                maxTagCount="responsive"
                                allowClear
                                suffixIcon={<MedicineBoxOutlined style={{ color: token.colorTextPlaceholder }} />}
                                options={availableFacilities.map(facility => ({
                                    label: facility.facility_name,
                                    value: facility.hie_id
                                }))}
                            />
                            <Input
                                placeholder="Search professional..."
                                prefix={<SearchOutlined style={{ color: token.colorTextPlaceholder }} />}
                                style={{ width: isMobile ? 180 : 250, borderRadius: 8 }}
                                allowClear
                            />
                            <Button icon={<ReloadOutlined />} onClick={handleRefresh} />
                        </Space>
                    </div>
                }
            >
                {loading ? (
                    <TableSkeleton rows={filters.pageSize} />
                ) : affiliations.length > 0 ? (
                    <Table
                        dataSource={affiliations}
                        columns={columns}
                        rowKey="name"
                        pagination={{
                            current: filters.page,
                            pageSize: filters.pageSize,
                            total: total,
                            showSizeChanger: true,
                            onChange: (page, pageSize) => setFilters({ page, pageSize })
                        }}
                        scroll={{ x: 'max-content' }}
                        size="middle"
                    />
                ) : (
                    <EmptyState
                        type="no-data"
                        title="No Affiliations Found"
                        description="There are currently no staff recruitment or facility affiliation requests."
                        onAction={handleRefresh}
                        actionText="Reload Requests"
                    />
                )}
            </Card>
        </div>
    );
};

export default AffiliationsListView;

import React, { useEffect, useCallback, useMemo, useState, useRef } from 'react';
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
    theme,
    DatePicker,
    Tooltip,
    Modal,
    Avatar
} from 'antd';
import {
    LinkOutlined,
    ClockCircleOutlined,
    CheckCircleOutlined,
    CloseCircleOutlined,
    SearchOutlined,
    ReloadOutlined,
    UserOutlined,
    MedicineBoxOutlined,
    FilterOutlined,
    ClearOutlined,
    BankOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
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
    const facilityNameById = useMemo(
        () =>
            availableFacilities.reduce<Record<string, string>>((acc, facility) => {
                if (facility.hie_id) {
                    acc[facility.hie_id] = facility.facility_name;
                }
                return acc;
            }, {}),
        [availableFacilities]
    );

    // Detail modal state (UI-only state, not filter state)
    const [detailModalVisible, setDetailModalVisible] = useState(false);
    const [selectedAffiliation, setSelectedAffiliation] = useState<any>(null);

    // Debounce timer ref for search input
    const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const {
        affiliations,
        loading,
        total,
        statusAggregates,  // NEW: Status aggregates from backend
        filters,
        fetchAffiliations,
        setFilters
    } = useAffiliationsModuleStore();

    const handleRefresh = useCallback(() => {
        fetchAffiliations(filters.facilities);
    }, [fetchAffiliations, filters.facilities]);

    const handleFacilityFilterChange = (selectedIds: string[]) => {
        setFilters({ facilities: selectedIds });
    };

    const handleViewDetails = (record: any) => {
        setSelectedAffiliation(record);
        setDetailModalVisible(true);
    };

    // Initial load - fetch with either store filters or global selected facilities
    useEffect(() => {
        const initialFacilities = filters.facilities && filters.facilities.length > 0
            ? filters.facilities
            : selectedFacilityIds;
        if (initialFacilities !== filters.facilities) {
            setFilters({ facilities: initialFacilities });
        } else {
            fetchAffiliations(initialFacilities);
        }
    }, [selectedFacilityIds]); // Only run on mount or when global facilities change

    // Cleanup debounce timer on unmount
    useEffect(() => {
        return () => {
            if (searchTimeoutRef.current) {
                clearTimeout(searchTimeoutRef.current);
            }
        };
    }, []);

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
            width: 250,
            render: (facility: string, record: any) => {
                const explicitName = (record.facility_name || '').trim();
                const mappedName = (record.facility_id && facilityNameById[record.facility_id]) || (facility ? facilityNameById[facility] : '');
                const facilityName = explicitName || mappedName || 'Unknown Facility';
                const facilityId = (record.facility_id || (!explicitName && facility ? facility : '') || '').trim();

                return (
                    <Space direction="vertical" size={0}>
                        <Space>
                            <MedicineBoxOutlined style={{ color: token.colorTextDescription }} />
                            <Text strong style={{ fontSize: '14px' }}>
                                {facilityName}
                            </Text>
                        </Space>
                        {facilityId && (
                            <Text type="secondary" style={{ fontSize: '11px', marginLeft: 22 }}>
                                ID: {facilityId}
                            </Text>
                        )}
                    </Space>
                );
            }
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
            render: (record: any) => (
                <Button
                    type="link"
                    onClick={() => handleViewDetails(record)}
                >
                    Review
                </Button>
            )
        }
    ];

    return (
        <div style={{ padding: isMobile ? '16px' : '24px' }}>
            {/* Metric Section */}
            <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
                <Col xs={12} sm={8} lg={4}>
                    <Card size="small" style={{ borderRadius: 12, border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                        <Statistic
                            title={<Text type="secondary" style={{ fontSize: 12 }}>TOTAL REQUESTS</Text>}
                            value={statusAggregates?.total || total}
                            prefix={<LinkOutlined style={{ color: token.colorPrimary, marginRight: 8 }} />}
                            valueStyle={{ fontSize: 20, fontWeight: 700 }}
                        />
                    </Card>
                </Col>
                <Col xs={12} sm={8} lg={4}>
                    <Card size="small" style={{ borderRadius: 12, border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                        <Statistic
                            title={<Text type="secondary" style={{ fontSize: 12 }}>PENDING REVIEW</Text>}
                            value={statusAggregates?.pending || 0}
                            prefix={<ClockCircleOutlined style={{ color: '#faad14', marginRight: 8 }} />}
                            valueStyle={{ fontSize: 20, fontWeight: 700 }}
                        />
                    </Card>
                </Col>
                <Col xs={12} sm={8} lg={4}>
                    <Card size="small" style={{ borderRadius: 12, border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                        <Statistic
                            title={<Text type="secondary" style={{ fontSize: 12 }}>CONFIRMED</Text>}
                            value={statusAggregates?.confirmed || 0}
                            prefix={<CheckCircleOutlined style={{ color: '#52c41a', marginRight: 8 }} />}
                            valueStyle={{ fontSize: 20, fontWeight: 700 }}
                        />
                    </Card>
                </Col>
                <Col xs={12} sm={8} lg={4}>
                    <Card size="small" style={{ borderRadius: 12, border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                        <Statistic
                            title={<Text type="secondary" style={{ fontSize: 12 }}>REJECTION RATE</Text>}
                            value={statusAggregates?.rejection_rate || 0}
                            suffix="%"
                            valueStyle={{ fontSize: 20, fontWeight: 700 }}
                        />
                    </Card>
                </Col>
                <Col xs={12} sm={8} lg={4}>
                    <Card size="small" style={{ borderRadius: 12, border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                        <Statistic
                            title={<Text type="secondary" style={{ fontSize: 12 }}>REJECTED</Text>}
                            value={statusAggregates?.rejected || 0}
                            prefix={<CloseCircleOutlined style={{ color: '#ff4d4f', marginRight: 8 }} />}
                            valueStyle={{ fontSize: 20, fontWeight: 700 }}
                        />
                    </Card>
                </Col>
                <Col xs={12} sm={8} lg={4}>
                    <Card size="small" style={{ borderRadius: 12, border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                        <Statistic
                            title={<Text type="secondary" style={{ fontSize: 12 }}>CONFIRMATION RATE</Text>}
                            value={statusAggregates?.confirmation_rate ?? statusAggregates?.approval_rate ?? 0}
                            suffix="%"
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
                        <Space wrap size="small">
                            {/* Status Filter - NEW: Connect to store */}
                            <Select
                                placeholder="All Status"
                                value={filters.status || undefined}
                                onChange={(status) => setFilters({ status: status || '' })}
                                style={{ width: 150, borderRadius: 8 }}
                                allowClear
                                suffixIcon={<FilterOutlined style={{ color: token.colorTextPlaceholder }} />}
                            >
                                <Select.Option value="Pending">
                                    <Tag color="orange" style={{ fontSize: '11px' }}>Pending</Tag>
                                </Select.Option>
                                <Select.Option value="Confirmed">
                                    <Tag color="green" style={{ fontSize: '11px' }}>Confirmed (Active + Confirmed)</Tag>
                                </Select.Option>
                                <Select.Option value="Rejected">
                                    <Tag color="red" style={{ fontSize: '11px' }}>Rejected</Tag>
                                </Select.Option>
                                <Select.Option value="Expired">
                                    <Tag color="default" style={{ fontSize: '11px' }}>Expired</Tag>
                                </Select.Option>
                                <Select.Option value="Inactive">
                                    <Tag color="default" style={{ fontSize: '11px' }}>Inactive</Tag>
                                </Select.Option>
                            </Select>

                            {/* Facility Filter */}
                            <Select
                                mode="multiple"
                                placeholder="All Facilities"
                                value={filters.facilities || []}
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

                            {/* Date Range Filter - NEW */}
                            <DatePicker.RangePicker
                                placeholder={['Start Date', 'End Date']}
                                value={filters.dateFrom && filters.dateTo ? [
                                    dayjs(filters.dateFrom),
                                    dayjs(filters.dateTo)
                                ] : null}
                                onChange={(dates) => {
                                    if (dates) {
                                        setFilters({
                                            dateFrom: dates[0]?.format('YYYY-MM-DD'),
                                            dateTo: dates[1]?.format('YYYY-MM-DD')
                                        });
                                    } else {
                                        setFilters({ dateFrom: '', dateTo: '' });
                                    }
                                }}
                                style={{ borderRadius: 8 }}
                                allowClear
                            />

                            {/* Professional Search - FIX: Wire to store */}
                            <Input
                                placeholder="Search professional..."
                                prefix={<SearchOutlined style={{ color: token.colorTextPlaceholder }} />}
                                value={filters.professional_name || ''}
                                onChange={(e) => {
                                    const searchValue = e.target.value;
                                    clearTimeout(searchTimeoutRef.current!);
                                    searchTimeoutRef.current = setTimeout(() => {
                                        setFilters({ professional_name: searchValue });
                                    }, 300);
                                }}
                                style={{ width: isMobile ? 180 : 250, borderRadius: 8 }}
                                allowClear
                            />

                            {/* Clear All Filters Button */}
                            <Tooltip title="Clear all filters">
                                <Button
                                    icon={<ClearOutlined />}
                                    onClick={() => {
                                        setFilters({
                                            status: '',
                                            professional_name: '',
                                            dateFrom: '',
                                            dateTo: '',
                                            facilities: []
                                        });
                                    }}
                                />
                            </Tooltip>

                            {/* Refresh Button */}
                            <Button icon={<ReloadOutlined />} onClick={handleRefresh} />

                            {/* Active Filter Count Badge */}
                            {(filters.status || (filters.facilities && filters.facilities.length > 0) || filters.professional_name || filters.dateFrom) && (
                                <Tag color="blue" style={{ marginLeft: 4 }}>
                                    {[
                                        filters.status && '1 status',
                                        (filters.facilities && filters.facilities.length > 0) && `${filters.facilities.length} facilities`,
                                        filters.professional_name && '1 search',
                                        (filters.dateFrom || filters.dateTo) && '1 date range'
                                    ].filter(Boolean).join(', ')}
                                </Tag>
                            )}
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

            {/* Detail Modal */}
            <Modal
                title={<Space><UserOutlined /><span>Affiliation Details</span></Space>}
                open={detailModalVisible}
                onCancel={() => setDetailModalVisible(false)}
                footer={[<Button key="close" onClick={() => setDetailModalVisible(false)}>Close</Button>]}
                width={760}
            >
                {selectedAffiliation && (
                    <Space direction="vertical" size={16} style={{ width: '100%' }}>
                        <Card
                            size="small"
                            bordered={false}
                            style={{
                                borderRadius: 12,
                                background: token.colorFillQuaternary
                            }}
                        >
                            <Row align="middle" justify="space-between" gutter={[16, 16]}>
                                <Col flex="auto">
                                    <Space align="start" size={12}>
                                        <Avatar size={56} icon={<UserOutlined />} style={{ backgroundColor: token.colorPrimary }} />
                                        <Space direction="vertical" size={0}>
                                            <Text type="secondary" style={{ fontSize: 12 }}>Health Professional</Text>
                                            <Title level={4} style={{ margin: 0, lineHeight: 1.2 }}>
                                                {selectedAffiliation.health_professional_name}
                                            </Title>
                                            <Text type="secondary" style={{ fontSize: 12 }}>
                                                Affiliation ID: {selectedAffiliation.name}
                                            </Text>
                                        </Space>
                                    </Space>
                                </Col>
                                <Col>
                                    <Space direction="vertical" size={8} style={{ alignItems: 'flex-end' }}>
                                        <Tag color={getStatusColor(selectedAffiliation.affiliation_status)}>
                                            {selectedAffiliation.affiliation_status}
                                        </Tag>
                                        <Tag color="purple">
                                            {selectedAffiliation.employment_type || 'N/A'}
                                        </Tag>
                                    </Space>
                                </Col>
                            </Row>
                        </Card>

                        <Row gutter={[12, 12]}>
                            <Col xs={24} md={12}>
                                <Card
                                    size="small"
                                    title={<Space><BankOutlined />Facility</Space>}
                                    style={{ borderRadius: 12, height: '100%' }}
                                >
                                    <Space direction="vertical" size={4}>
                                        <Text strong style={{ fontSize: 16, lineHeight: 1.3 }}>
                                            {selectedAffiliation.facility_name || facilityNameById[selectedAffiliation.facility_id || selectedAffiliation.health_facility] || 'Unknown Facility'}
                                        </Text>
                                        <Text type="secondary" style={{ fontSize: 12 }}>
                                            ID: {selectedAffiliation.facility_id || selectedAffiliation.health_facility || '-'}
                                        </Text>
                                    </Space>
                                </Card>
                            </Col>

                            <Col xs={24} md={12}>
                                <Card
                                    size="small"
                                    title={<Space><ClockCircleOutlined />Affiliation Info</Space>}
                                    style={{ borderRadius: 12, height: '100%' }}
                                >
                                    <Space direction="vertical" size={10} style={{ width: '100%' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                                            <Text type="secondary">Requested Date</Text>
                                            <Text strong>
                                                {selectedAffiliation.requested_date ? dayjs(selectedAffiliation.requested_date).format('DD MMM YYYY') : '-'}
                                            </Text>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                                            <Text type="secondary">Current Status</Text>
                                            <Tag color={getStatusColor(selectedAffiliation.affiliation_status)} style={{ marginRight: 0 }}>
                                                {selectedAffiliation.affiliation_status}
                                            </Tag>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                                            <Text type="secondary">Employment Type</Text>
                                            <Text strong>{selectedAffiliation.employment_type || '-'}</Text>
                                        </div>
                                    </Space>
                                </Card>
                            </Col>
                        </Row>
                    </Space>
                )}
            </Modal>
        </div>
    );
};

export default AffiliationsListView;

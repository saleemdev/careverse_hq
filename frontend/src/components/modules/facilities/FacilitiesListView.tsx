import React, { useEffect, useCallback, useMemo, useState } from 'react';
import {
    Table,
    Card,
    Tag,
    Input,
    Space,
    Typography,
    Badge,
    Button,
    theme,
    Select,
    Tooltip,
} from 'antd';
import {
    MedicineBoxOutlined,
    CloudServerOutlined,
    SearchOutlined,
    ReloadOutlined,
    HomeOutlined,
    ClearOutlined,
} from '@ant-design/icons';
import useFacilitiesModuleStore from '../../../stores/modules/facilitiesModuleStore';
import useFacilityStore from '../../../stores/facilityStore';
import { TableSkeleton } from '../../shared/Skeleton/Skeleton';
import EmptyState from '../../shared/EmptyState/EmptyState';
import { useResponsive } from '../../../hooks/useResponsive';
import { COMPONENT_WIDTHS } from '../../../styles/tokens';
import FacilityDetailDrawer from './FacilityDetailDrawer';

const { Text, Title } = Typography;

const FacilitiesListView: React.FC = () => {
    const { token } = theme.useToken();
    const { isMobile, isTablet, getResponsiveValue } = useResponsive();
    const { company } = useFacilityStore();

    const {
        facilities,
        loading,
        total,
        filters,
        fetchFacilities,
        setFilters
    } = useFacilitiesModuleStore();

    // Drawer state
    const [drawerVisible, setDrawerVisible] = useState(false);
    const [selectedFacilityId, setSelectedFacilityId] = useState<string | null>(null);

    // Search state
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCounty, setSelectedCounty] = useState<string | undefined>();
    const [selectedLevel, setSelectedLevel] = useState<string | undefined>();
    const [selectedOperationalStatus, setSelectedOperationalStatus] = useState<string | undefined>();

    const handleRefresh = useCallback(() => {
        fetchFacilities();
    }, [fetchFacilities]);

    const handleSearch = (value: string) => {
        setSearchTerm(value);
    };

    const handleViewFacility = (facilityId: string) => {
        setSelectedFacilityId(facilityId);
        setDrawerVisible(true);
    };

    const handleCloseDrawer = () => {
        setDrawerVisible(false);
        setSelectedFacilityId(null);
    };

    useEffect(() => {
        handleRefresh();
    }, [handleRefresh, filters.page, filters.pageSize]);

    const getLevelColor = (level: string) => {
        if (level?.includes('L6')) return '#722ed1';
        if (level?.includes('L5')) return '#1890ff';
        if (level?.includes('L4')) return '#13c2c2';
        return '#52c41a';
    };

    const countyOptions = useMemo(
        () =>
            Array.from(new Set(facilities.map((f) => f.county).filter(Boolean) as string[]))
                .sort((a, b) => a.localeCompare(b))
                .map((county) => ({ label: county, value: county })),
        [facilities]
    );

    const levelOptions = useMemo(
        () =>
            Array.from(new Set(facilities.map((f) => f.kephl_level).filter(Boolean) as string[]))
                .sort((a, b) => a.localeCompare(b))
                .map((level) => ({ label: level, value: level })),
        [facilities]
    );

    const operationalStatusOptions = useMemo(
        () =>
            Array.from(new Set(facilities.map((f) => f.operational_status).filter(Boolean) as string[]))
                .sort((a, b) => a.localeCompare(b))
                .map((status) => ({ label: status, value: status })),
        [facilities]
    );

    const activeFiltersCount = [searchTerm, selectedCounty, selectedLevel, selectedOperationalStatus].filter(Boolean).length;

    // Filter facilities based on search term + selected filters
    const filteredFacilities = facilities.filter(facility => {
        if (selectedCounty && facility.county !== selectedCounty) return false;
        if (selectedLevel && facility.kephl_level !== selectedLevel) return false;
        if (selectedOperationalStatus && facility.operational_status !== selectedOperationalStatus) return false;

        if (!searchTerm) return true;

        const searchLower = searchTerm.trim().toLowerCase();
        return (
            facility.facility_name?.toLowerCase().includes(searchLower) ||
            facility.name?.toLowerCase().includes(searchLower) ||
            facility.hie_id?.toLowerCase().includes(searchLower) ||
            facility.county?.toLowerCase().includes(searchLower) ||
            facility.kephl_level?.toLowerCase().includes(searchLower) ||
            facility.facility_mfl?.toLowerCase().includes(searchLower)
        );
    });

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
            dataIndex: 'kephl_level',
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
                <Badge status={status === 'Operational' ? 'success' : 'warning'} text={status || 'N/A'} />
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
                    onClick={() => handleViewFacility(record.name)}
                >
                    View Details
                </Button>
            )
        }
    ];

    return (
        <div style={{ padding: isMobile ? '16px' : '24px' }}>
            {/* Table Section */}
            <Card
                style={{ borderRadius: 12, border: 'none', boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }}
                bodyStyle={{ padding: 0 }}
                title={
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, padding: '16px 24px' }}>
                        <Title level={4} style={{ margin: 0 }}>Health Facilities</Title>
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
                                value={searchTerm}
                                onChange={(e) => handleSearch(e.target.value)}
                            />
                            <Select
                                placeholder="County"
                                allowClear
                                value={selectedCounty}
                                onChange={setSelectedCounty}
                                options={countyOptions}
                                style={{
                                    width: getResponsiveValue(COMPONENT_WIDTHS.facilitySelector),
                                    minWidth: isMobile ? 140 : 170
                                }}
                            />
                            <Select
                                placeholder="KEPHL Level"
                                allowClear
                                value={selectedLevel}
                                onChange={setSelectedLevel}
                                options={levelOptions}
                                style={{
                                    width: getResponsiveValue(COMPONENT_WIDTHS.facilitySelector),
                                    minWidth: isMobile ? 140 : 170
                                }}
                            />
                            <Select
                                placeholder="Status"
                                allowClear
                                value={selectedOperationalStatus}
                                onChange={setSelectedOperationalStatus}
                                options={operationalStatusOptions}
                                style={{
                                    width: getResponsiveValue(COMPONENT_WIDTHS.facilitySelector),
                                    minWidth: isMobile ? 130 : 150
                                }}
                            />
                            {activeFiltersCount > 0 && (
                                <Tooltip title="Clear all filters">
                                    <Button
                                        icon={<ClearOutlined />}
                                        onClick={() => {
                                            setSearchTerm('');
                                            setSelectedCounty(undefined);
                                            setSelectedLevel(undefined);
                                            setSelectedOperationalStatus(undefined);
                                        }}
                                    >
                                        Clear ({activeFiltersCount})
                                    </Button>
                                </Tooltip>
                            )}
                            <Button icon={<ReloadOutlined />} onClick={handleRefresh} />
                        </Space>
                    </div>
                }
            >
                {loading ? (
                    <TableSkeleton rows={filters.pageSize} />
                ) : filteredFacilities.length > 0 ? (
                    <Table
                        dataSource={filteredFacilities}
                        columns={columns}
                        rowKey="name"
                        pagination={{
                            current: filters.page,
                            pageSize: filters.pageSize,
                            total: filteredFacilities.length,
                            showSizeChanger: true,
                            onChange: (page, pageSize) => setFilters({ page, pageSize })
                        }}
                        scroll={{ x: 'max-content' }}
                        size="middle"
                    />
                ) : searchTerm ? (
                    <EmptyState
                        type="no-results"
                        title="No Facilities Found"
                        description={`No facilities match your search "${searchTerm}". Try different keywords.`}
                        onAction={() => setSearchTerm('')}
                        actionText="Clear Search"
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

            {/* Facility Detail Drawer */}
            <FacilityDetailDrawer
                visible={drawerVisible}
                facilityId={selectedFacilityId}
                onClose={handleCloseDrawer}
            />
        </div>
    );
};

export default FacilitiesListView;

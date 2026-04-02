import React, { useEffect, useCallback, useMemo, useRef, useState } from 'react';
import {
    Table, Card, Row, Col, Statistic, Tag, Input, Space, Typography,
    Button, theme, Select, Spin, Progress,
} from 'antd';
import {
    LaptopOutlined, ToolOutlined, CheckCircleOutlined, WarningOutlined,
    SearchOutlined, ReloadOutlined, EnvironmentOutlined, BarcodeOutlined,
    MedicineBoxOutlined, PlusOutlined, ClockCircleOutlined, FallOutlined, UserOutlined,
} from '@ant-design/icons';
import { shallow } from 'zustand/shallow';
import useERPNextAssetStore from '../../../stores/modules/erpnextAssetStore';
import type { AssetItem } from '../../../stores/modules/erpnextAssetStore';
import useFacilityStore from '../../../stores/facilityStore';
import { TableSkeleton } from '../../shared/Skeleton/Skeleton';
import EmptyState from '../../shared/EmptyState/EmptyState';
import { useResponsive } from '../../../hooks/useResponsive';
import { COMPONENT_WIDTHS } from '../../../styles/tokens';
import AssetStatusBadge from './AssetStatusBadge';
import dayjs from 'dayjs';

const { Text, Title } = Typography;

interface Props {
    navigateToRoute: (route: string, id?: string) => void;
}

const ASSET_STATUSES = [
    { value: '', label: 'All Statuses' },
    { value: 'Draft', label: 'Draft' },
    { value: 'Submitted', label: 'Submitted' },
    { value: 'In Maintenance', label: 'In Maintenance' },
    { value: 'Out of Order', label: 'Out of Order' },
    { value: 'Partially Depreciated', label: 'Partially Depreciated' },
    { value: 'Fully Depreciated', label: 'Fully Depreciated' },
    { value: 'Scrapped', label: 'Scrapped' },
    { value: 'Sold', label: 'Sold' },
];

const ERPNextAssetsListView: React.FC<Props> = ({ navigateToRoute }) => {
    const { token } = theme.useToken();
    const { isMobile, getResponsiveValue } = useResponsive();
    const { availableFacilities, loading: facilitiesLoading } = useFacilityStore();

    const [categories, setCategories] = useState<{ name: string; asset_category_name: string }[]>([]);
    const [searchInput, setSearchInput] = useState('');
    const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const {
        assets, loading, total, statusAggregates, filters,
        fetchAssets, fetchDashboard, setFilters,
    } = useERPNextAssetStore((state) => ({
        assets: state.assets,
        loading: state.loading,
        total: state.total,
        statusAggregates: state.statusAggregates,
        filters: state.filters,
        fetchAssets: state.fetchAssets,
        fetchDashboard: state.fetchDashboard,
        setFilters: state.setFilters,
    }), shallow);

    // Fetch categories once
    useEffect(() => {
        import('../../../services/api').then(({ erpnextAssetsApi }) => {
            erpnextAssetsApi.getCategories().then((res) => {
                if (res.success) setCategories(res.data?.items || []);
            });
        });
    }, []);

    useEffect(() => {
        return () => {
            if (searchDebounceRef.current) {
                clearTimeout(searchDebounceRef.current);
            }
        };
    }, []);

    useEffect(() => {
        setSearchInput(filters.search || '');
    }, [filters.search]);

    const getFacilityIdsForFetch = useCallback(() => {
        if (filters.facilities.length > 0) return filters.facilities;
        return availableFacilities.map((f) => f.hie_id);
    }, [filters.facilities, availableFacilities]);

    const refreshAssets = useCallback(() => {
        const ids = getFacilityIdsForFetch();
        fetchAssets(ids);
    }, [fetchAssets, getFacilityIdsForFetch]);

    const refreshDashboard = useCallback(() => {
        const ids = getFacilityIdsForFetch();
        fetchDashboard(ids);
    }, [fetchDashboard, getFacilityIdsForFetch]);

    useEffect(() => {
        refreshAssets();
    }, [refreshAssets, filters.status, filters.category, filters.search, filters.page, filters.pageSize, filters.facilities]);

    useEffect(() => {
        refreshDashboard();
    }, [refreshDashboard, filters.facilities]);

    const handleSearch = (value: string) => {
        setSearchInput(value);
        if (searchDebounceRef.current) {
            clearTimeout(searchDebounceRef.current);
        }
        searchDebounceRef.current = setTimeout(() => {
            setFilters({ search: value });
        }, 400);
    };

    const clearPendingSearchDebounce = () => {
        if (searchDebounceRef.current) {
            clearTimeout(searchDebounceRef.current);
            searchDebounceRef.current = null;
        }
    };

    const handleRefresh = () => {
        clearPendingSearchDebounce();
        const pendingSearch = searchInput;
        if (pendingSearch !== filters.search) {
            setFilters({ search: pendingSearch });
            return;
        }
        refreshAssets();
        refreshDashboard();
    };

    // KPI data
    const kpiCards = useMemo(() => [
        { title: 'TOTAL ASSETS', value: statusAggregates?.total || 0, icon: <LaptopOutlined />, color: '#1890ff', variant: 'primary' },
        { title: 'ACTIVE', value: (statusAggregates?.submitted || 0) + (statusAggregates?.partially_depreciated || 0), icon: <CheckCircleOutlined />, color: '#52c41a', variant: 'success' },
        { title: 'IN MAINTENANCE', value: statusAggregates?.in_maintenance || 0, icon: <ToolOutlined />, color: '#faad14', variant: 'warning' },
        { title: 'OUT OF ORDER', value: statusAggregates?.out_of_order || 0, icon: <WarningOutlined />, color: '#ff4d4f', variant: 'error' },
        { title: 'DEPRECIATED', value: statusAggregates?.fully_depreciated || 0, icon: <FallOutlined />, color: '#722ed1', variant: 'purple' },
        { title: 'DRAFT', value: statusAggregates?.draft || 0, icon: <ClockCircleOutlined />, color: '#13c2c2', variant: 'cyan' },
    ], [statusAggregates]);

    const getAssignedEmployee = (record: Pick<AssetItem, 'custodian_name' | 'custodian'>) => {
        const employeeName = (record.custodian_name || '').trim();
        const employeeId = (record.custodian || '').trim();

        if (employeeName && employeeId) {
            return { label: employeeName, meta: employeeId };
        }
        if (employeeName) {
            return { label: employeeName, meta: '' };
        }
        if (employeeId) {
            return { label: employeeId, meta: '' };
        }
        return { label: 'Unassigned', meta: '' };
    };

    const columns = [
        {
            title: 'Asset Info',
            key: 'asset',
            fixed: 'left' as const,
            width: 280,
            render: (_: unknown, record: AssetItem) => (
                <Space>
                    <div style={{
                        width: 40, height: 40, borderRadius: 8,
                        background: token.colorFillAlter,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: token.colorPrimary,
                    }}>
                        <LaptopOutlined />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <Text strong style={{ fontSize: '14px' }}>{record.asset_name || 'Unnamed Asset'}</Text>
                        <Text type="secondary" style={{ fontSize: '12px' }}>
                            <BarcodeOutlined style={{ marginRight: 4 }} />{record.item_code || record.name}
                        </Text>
                    </div>
                </Space>
            ),
        },
        {
            title: 'Category',
            dataIndex: 'asset_category',
            key: 'category',
            width: 160,
            render: (cat: string) => <Tag>{cat || 'Uncategorized'}</Tag>,
        },
        {
            title: 'Location',
            key: 'facility',
            width: 220,
            render: (_: unknown, record: AssetItem) => (
                <Space align="start">
                    <EnvironmentOutlined style={{ color: token.colorTextDescription, marginTop: 3 }} />
                    <Space direction="vertical" size={0}>
                        <Text strong style={{ fontSize: '13px' }}>{record.facility_name || record.location || 'Unknown'}</Text>
                        {record.facility_id && (
                            <Text type="secondary" style={{ fontSize: '11px' }}>ID: {record.facility_id}</Text>
                        )}
                    </Space>
                </Space>
            ),
        },
        {
            title: 'Assigned To',
            key: 'assigned_to',
            width: 220,
            render: (_: unknown, record: AssetItem) => {
                const assigned = getAssignedEmployee(record);
                return (
                    <Space align="start">
                        <UserOutlined style={{ color: token.colorTextDescription, marginTop: 3 }} />
                        <Space direction="vertical" size={0}>
                            <Text strong style={{ fontSize: '13px' }}>{assigned.label}</Text>
                            {assigned.meta && (
                                <Text type="secondary" style={{ fontSize: '11px' }}>ID: {assigned.meta}</Text>
                            )}
                        </Space>
                    </Space>
                );
            },
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            width: 160,
            render: (status: string) => <AssetStatusBadge status={status} />,
        },
        {
            title: 'Purchase Date',
            dataIndex: 'purchase_date',
            key: 'purchase_date',
            width: 130,
            render: (d: string) => d ? dayjs(d).format('DD MMM YYYY') : '-',
        },
        {
            title: 'Current Value',
            key: 'value',
            width: 160,
            render: (_: unknown, record: AssetItem) => {
                const current = record.value_after_depreciation || 0;
                const purchase = record.gross_purchase_amount || 1;
                const pct = Math.min(100, Math.round((current / purchase) * 100));
                return (
                    <Space direction="vertical" size={2} style={{ width: '100%' }}>
                        <Text strong style={{ fontSize: '13px' }}>
                            {current.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </Text>
                        <Progress percent={pct} size="small" showInfo={false}
                            strokeColor={pct > 50 ? '#1890ff' : pct > 20 ? '#faad14' : '#ff4d4f'} />
                    </Space>
                );
            },
        },
        {
            title: 'Action',
            key: 'action',
            fixed: 'right' as const,
            width: 100,
            render: (_: unknown, record: AssetItem) => (
                <Button
                    type="link"
                    onClick={() => navigateToRoute('assets', record.name)}
                >
                    View
                </Button>
            ),
        },
    ];

    return (
        <div style={{ padding: isMobile ? '16px' : '24px' }}>
            {/* KPI Dashboard */}
            <Row gutter={[12, 12]} style={{ marginBottom: 24 }}>
                {kpiCards.map((kpi) => (
                    <Col xs={12} sm={8} lg={4} key={kpi.title}>
                        <Card size="small" className={`stat-card stat-card--${kpi.variant}`}>
                            <Statistic
                                title={<Text type="secondary" style={{ fontSize: 12 }}>{kpi.title}</Text>}
                                value={kpi.value}
                                prefix={React.cloneElement(kpi.icon, { style: { color: kpi.color, marginRight: 8 } })}
                                valueStyle={{ fontSize: 18, fontWeight: 600 }}
                            />
                        </Card>
                    </Col>
                ))}
            </Row>

            {/* Table Card */}
            <Card
                style={{ borderRadius: 12, border: 'none', boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }}
                bodyStyle={{ padding: 0 }}
                title={
                    <div style={{
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        flexWrap: 'wrap', gap: 12, padding: '16px 24px',
                    }}>
                        <Title level={4} style={{ margin: 0 }}>Asset Inventory</Title>
                        <Space wrap>
                            {/* Facility Filter */}
                            <Select
                                mode="multiple"
                                value={filters.facilities}
                                onChange={(values) => {
                                    clearPendingSearchDebounce();
                                    setFilters({ facilities: values, search: searchInput });
                                }}
                                placeholder="All Facilities"
                                allowClear
                                loading={facilitiesLoading}
                                style={{
                                    width: getResponsiveValue(COMPONENT_WIDTHS.facilitySelector),
                                    minWidth: isMobile ? '140px' : '200px',
                                }}
                                maxTagCount="responsive"
                                popupMatchSelectWidth={false}
                                notFoundContent={facilitiesLoading ? <Spin size="small" /> : 'No facilities'}
                                suffixIcon={<EnvironmentOutlined />}
                            >
                                {availableFacilities.map((f) => (
                                    <Select.Option key={f.hie_id} value={f.hie_id}>
                                        <Space>
                                            <MedicineBoxOutlined style={{ fontSize: '12px' }} />
                                            <span>{f.facility_name}</span>
                                            {f.facility_mfl && <Tag style={{ fontSize: '10px', margin: 0 }}>{f.facility_mfl}</Tag>}
                                        </Space>
                                    </Select.Option>
                                ))}
                            </Select>

                            {/* Status Filter */}
                            <Select
                                value={filters.status}
                                onChange={(val) => {
                                    clearPendingSearchDebounce();
                                    setFilters({ status: val, search: searchInput });
                                }}
                                style={{ width: isMobile ? 130 : 180 }}
                                options={ASSET_STATUSES}
                            />

                            {/* Category Filter */}
                            <Select
                                value={filters.category || undefined}
                                onChange={(val) => {
                                    clearPendingSearchDebounce();
                                    setFilters({ category: val || '', search: searchInput });
                                }}
                                placeholder="All Categories"
                                allowClear
                                style={{ width: isMobile ? 130 : 170 }}
                            >
                                {categories.map((c) => (
                                    <Select.Option key={c.name} value={c.name}>
                                        {c.asset_category_name}
                                    </Select.Option>
                                ))}
                            </Select>

                            {/* Search */}
                            <Input
                                placeholder="Search assets..."
                                prefix={<SearchOutlined style={{ color: token.colorTextPlaceholder }} />}
                                value={searchInput}
                                onChange={(e) => handleSearch(e.target.value)}
                                style={{
                                    width: getResponsiveValue(COMPONENT_WIDTHS.searchInput),
                                    minWidth: isMobile ? '120px' : 'auto',
                                    borderRadius: 8,
                                }}
                                allowClear
                            />

                            {/* New Asset */}
                            <Button
                                type="primary"
                                icon={<PlusOutlined />}
                                onClick={() => navigateToRoute('assets', 'new')}
                            >
                                {isMobile ? '' : 'New Asset'}
                            </Button>

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
                            total,
                            showSizeChanger: true,
                            onChange: (page, pageSize) => {
                                clearPendingSearchDebounce();
                                setFilters({ page, pageSize, search: searchInput });
                            },
                        }}
                        scroll={{ x: 'max-content' }}
                        size="middle"
                    />
                ) : (
                    <EmptyState
                        type="no-data"
                        title="No Assets Found"
                        description="Create your first asset or adjust filters."
                        onAction={() => navigateToRoute('assets', 'new')}
                        actionText="Create Asset"
                    />
                )}
            </Card>
        </div>
    );
};

export default ERPNextAssetsListView;

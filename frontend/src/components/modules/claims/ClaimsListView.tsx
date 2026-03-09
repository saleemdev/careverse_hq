import React, { useEffect, useCallback, useMemo, useState } from 'react';
import {
    Table,
    Card,
    Row,
    Col,
    Space,
    Typography,
    Button,
    Badge,
    DatePicker,
    Tag,
    Dropdown,
    Select,
    Divider,
    Skeleton,
    Tooltip,
    theme,
} from 'antd';
import {
    ReloadOutlined,
    CalendarOutlined,
    EyeOutlined,
    BankOutlined,
    DownloadOutlined,
    FileExcelOutlined,
    FileTextOutlined,
    CheckCircleOutlined,
    ClockCircleOutlined,
    CloseCircleOutlined,
    DollarOutlined,
    FilterOutlined,
    ClearOutlined,
} from '@ant-design/icons';
import type { MenuProps } from 'antd';
import type { ColumnType } from 'antd/es/table';
import { downloadClaimsAsCsv, downloadClaimsAsExcel } from './exportClaims';
import dayjs from 'dayjs';
import useClaimsStore from '../../../stores/modules/claimsStore';
import useFacilityStore from '../../../stores/facilityStore';
import FacilityContextSwitcher from '../../FacilityContextSwitcher';
import { TableSkeleton } from '../../shared/Skeleton/Skeleton';
import EmptyState from '../../shared/EmptyState/EmptyState';
import { useResponsive } from '../../../hooks/useResponsive';
import ClaimDetailDrawer from './ClaimDetailDrawer';
import type { FacilityClaim } from '../../../types/modules';

const { Text, Title } = Typography;

// Stable icon color so columns useMemo doesn't change every render (avoids Table/Ellipsis #185 loop)
const ICON_SECONDARY = 'var(--color-text-secondary, rgba(0, 0, 0, 0.45))';

/** Label + control stacked field used in the filter bar */
const FilterField: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <Text type="secondary" style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 500 }}>
            {label}
        </Text>
        {children}
    </div>
);

const ClaimsListView: React.FC = () => {
    const { token } = theme.useToken();
    const { isMobile, isTablet } = useResponsive();
    // Let backend handle empty/missing facilities - just use what's in store
    const facilityIds = useFacilityStore((s) => s.selectedFacilityIds) ?? [];
    const facilityIdsKey = facilityIds.join(',');

    const {
        claims,
        summary,
        loading,
        exporting,
        exportProgress,
        total,
        filters,
        insurerOptions,
        useOptions,
        errorGroupOptions,
        filterOptionsLoading,
        fetchClaims,
        fetchAllClaimsForExport,
        fetchFilterOptions,
        setFilters,
    } = useClaimsStore();

    useEffect(() => {
        void fetchFilterOptions();
    }, [facilityIdsKey, fetchFilterOptions]);

    const [selectedClaim, setSelectedClaim] = useState<FacilityClaim | null>(null);
    const [detailDrawerVisible, setDetailDrawerVisible] = useState(false);

    // Fetch claims on mount and when filters change - backend handles no-facilities case
    useEffect(() => {
        void fetchClaims();
    }, [filters.page, filters.pageSize, filters.status, filters.month, filters.insurer, filters.use, filters.claim_upstream_error_group, fetchClaims]);

    const getStatusColor = useCallback((status: string) => {
        switch (status?.toLowerCase()) {
            case 'approved':
                return 'success';
            case 'pending':
                return 'warning';
            case 'rejected':
                return 'error';
            default:
                return 'processing';
        }
    }, []);

    const formatPeriod = useCallback((record: FacilityClaim) => {
        if (!record.date_start && !record.date_end) return '—';
        if (record.date_start === record.date_end) return record.date_start ?? '—';
        return `${record.date_start ?? ''} – ${record.date_end ?? ''}`;
    }, []);

    // Stable filter option arrays for column filter dropdowns
    const statusFilterOptions = useMemo(
        () => ['approved', 'pending', 'rejected'].map((s) => ({ text: s.charAt(0).toUpperCase() + s.slice(1), value: s })),
        []
    );
    const useFilterOptions = useMemo(
        () => useOptions.map((u) => ({ text: u, value: u })),
        [useOptions]
    );

    const columns = useMemo((): ColumnType<FacilityClaim>[] => {
        const cols: ColumnType<FacilityClaim>[] = [
            {
                title: 'Client',
                key: 'client',
                fixed: isMobile ? undefined : 'left',
                width: isMobile ? undefined : 200,
                sorter: (a, b) => (a.client_name ?? '').localeCompare(b.client_name ?? ''),
                render: (_: unknown, record: FacilityClaim) => (
                    <Space direction="vertical" size={0}>
                        <Text strong style={{ fontSize: '14px' }}>{record.client_name ?? '—'}</Text>
                        <Text type="secondary" style={{ fontSize: '12px' }}>{record.client ?? '—'}</Text>
                    </Space>
                ),
            },
            {
                title: 'Use',
                key: 'use',
                width: 90,
                filters: useFilterOptions,
                filteredValue: filters.use ? [filters.use] : null,
                onFilter: () => true, // server-side — always pass through
                render: (_: unknown, record: FacilityClaim) => (
                    <Tag>{record.use || 'claim'}</Tag>
                ),
            },
            {
                title: 'Period',
                key: 'period',
                dataIndex: 'date_start',
                width: 160,
                sorter: (a, b) => (a.date_start ?? '').localeCompare(b.date_start ?? ''),
                render: (_: unknown, record: FacilityClaim) => (
                    <Space>
                        <CalendarOutlined style={{ color: ICON_SECONDARY }} />
                        <Text style={{ fontSize: '13px' }}>{formatPeriod(record)}</Text>
                    </Space>
                ),
            },
            {
                title: 'Insurer',
                key: 'insurer',
                width: 180,
                sorter: (a, b) => (a.insurer ?? '').localeCompare(b.insurer ?? ''),
                render: (_: unknown, record: FacilityClaim) => (
                    <Space>
                        <BankOutlined style={{ color: ICON_SECONDARY }} />
                        <Text>{record.insurer || '—'}</Text>
                    </Space>
                ),
            },
            {
                title: 'Status',
                dataIndex: 'claim_status',
                key: 'claim_status',
                width: 140,
                filters: statusFilterOptions,
                filteredValue: filters.status ? [filters.status] : null,
                onFilter: () => true, // server-side — always pass through
                render: (status: string, record: FacilityClaim) => (
                    <Space direction="vertical" size={0}>
                        <Badge
                            status={getStatusColor(status) as 'success' | 'warning' | 'error' | 'processing'}
                            text={status || '—'}
                        />
                        {record.claim_upstream_error_group != null && record.claim_upstream_error_group !== '' && (
                            <Text type="secondary" style={{ fontSize: 11 }}>{record.claim_upstream_error_group}</Text>
                        )}
                    </Space>
                ),
            },
            {
                title: 'Amount (KES)',
                dataIndex: 'claim_amount',
                key: 'claim_amount',
                width: 120,
                sorter: (a, b) => (a.claim_amount ?? 0) - (b.claim_amount ?? 0),
                render: (amount: number) => (
                    <Text strong>
                        {new Intl.NumberFormat('en-KE').format(amount ?? 0)}
                    </Text>
                ),
            },
        ];

        if (!isMobile) {
            cols.push({
                title: 'Facility',
                key: 'facility',
                width: isTablet ? 160 : 200,
                sorter: (a, b) => (a.facility_name ?? '').localeCompare(b.facility_name ?? ''),
                render: (_: unknown, record: FacilityClaim) => (
                    <Space direction="vertical" size={0}>
                        <Text style={{ fontSize: '13px' }}>{record.facility_name || '—'}</Text>
                        {(record.county || record.sub_county) && (
                            <Text type="secondary" style={{ fontSize: '12px' }}>
                                {[record.sub_county, record.county].filter(Boolean).join(', ')}
                            </Text>
                        )}
                    </Space>
                ),
            });
        }

        cols.push({
            title: 'Actions',
            key: 'actions',
            width: 90,
            fixed: isMobile ? undefined : 'right',
            render: (_: unknown, record: FacilityClaim) => (
                <Button
                    type="link"
                    icon={<EyeOutlined />}
                    onClick={() => {
                        setSelectedClaim(record);
                        setDetailDrawerVisible(true);
                    }}
                    aria-label={`View claim ${record.claim_id}`}
                >
                    View
                </Button>
            ),
        });

        return cols;
    }, [getStatusColor, formatPeriod, isMobile, isTablet, statusFilterOptions, useFilterOptions, filters.status, filters.use]);

    const renderExpandedClaimDetails = useCallback(
        (record: FacilityClaim) => (
            <div style={{ padding: '8px 8px 6px 48px' }}>
                <Row gutter={[16, 10]}>
                    <Col xs={24} md={12} lg={8}>
                        <Text type="secondary" style={{ fontSize: 11 }}>Diagnoses</Text>
                        <div>
                            <Text style={{ fontSize: 13 }}>{record.diagnoses || '—'}</Text>
                        </div>
                        <div style={{ marginTop: 8 }}>
                            <Text type="secondary" style={{ fontSize: 11 }}>Interventions</Text>
                            <div>
                                <Text style={{ fontSize: 13 }}>{record.interventions || '—'}</Text>
                            </div>
                        </div>
                    </Col>
                    <Col xs={24} md={12} lg={8}>
                        <Text type="secondary" style={{ fontSize: 11 }}>Scheme & Subtype</Text>
                        <div>
                            <Text style={{ fontSize: 13 }}>{record.scheme_id || '—'}</Text>
                        </div>
                        <div>
                            <Text type="secondary" style={{ fontSize: 12 }}>{record.claim_subtype || '—'}</Text>
                        </div>
                        <div style={{ marginTop: 8 }}>
                            <Text type="secondary" style={{ fontSize: 11 }}>Claim ID (full)</Text>
                            <div>
                                <Text code style={{ fontSize: 12 }}>{record.claim_id || '—'}</Text>
                            </div>
                        </div>
                    </Col>
                    <Col xs={24} md={12} lg={8}>
                        {record.claim_upstream_error_group != null && record.claim_upstream_error_group !== '' && (
                            <>
                                <Text type="secondary" style={{ fontSize: 11 }}>Claim Upstream Error Group</Text>
                                <div>
                                    <Text style={{ fontSize: 13 }}>{record.claim_upstream_error_group}</Text>
                                </div>
                                <div style={{ marginTop: 8 }} />
                            </>
                        )}
                        {record.claim_upstream_response != null && record.claim_upstream_response !== '' && (
                            <>
                                <Text type="secondary" style={{ fontSize: 11 }}>Claim Upstream Response</Text>
                                <div>
                                    <Text style={{ fontSize: 13 }}>{record.claim_upstream_response}</Text>
                                </div>
                                <div style={{ marginTop: 8 }} />
                            </>
                        )}
                        <Text type="secondary" style={{ fontSize: 11 }}>Client ID</Text>
                        <div>
                            <Text style={{ fontSize: 13 }}>{record.client ?? '—'}</Text>
                        </div>
                        {(record.creation || record.modified) && (
                            <div style={{ marginTop: 8 }}>
                                <Text type="secondary" style={{ fontSize: 11 }}>Modified</Text>
                                <div>
                                    <Text style={{ fontSize: 12 }}>{record.modified || record.creation || '—'}</Text>
                                </div>
                            </div>
                        )}
                    </Col>
                </Row>
            </div>
        ),
        []
    );

    const exportFilename = useMemo(
        () => `facility_claims_${filters.month || 'all'}_${new Date().toISOString().slice(0, 10)}`,
        [filters.month]
    );

    const exportMenuItems: MenuProps['items'] = useMemo(
        () => [
            {
                key: 'csv',
                icon: <FileTextOutlined />,
                label: 'Download as CSV',
                onClick: () => void fetchAllClaimsForExport().then((all) => downloadClaimsAsCsv(all, exportFilename)),
            },
            {
                key: 'xlsx',
                icon: <FileExcelOutlined />,
                label: 'Download as Excel',
                onClick: () => void fetchAllClaimsForExport().then((all) => downloadClaimsAsExcel(all, exportFilename)),
            },
        ],
        [fetchAllClaimsForExport, exportFilename]
    );

    const byStatus = summary?.by_status ?? {};
    const byStatusAmount = summary?.by_status_amount ?? {};
    const totalAmount = summary?.total_amount ?? 0;
    const totalCount = summary?.total_count ?? total;
    const formatAmount = (n: number) => new Intl.NumberFormat('en-KE').format(n);

    const activeFilterCount = [filters.month, filters.insurer, filters.use, filters.claim_upstream_error_group]
        .filter(Boolean).length;

    return (
        <div style={{ padding: isMobile ? '12px' : '24px' }}>
            <Title level={isMobile ? 4 : 3}>Facility Claims</Title>

            {/* Insights for filtered data */}
            {(loading || totalCount > 0) && (
                <Card style={{ marginBottom: 16 }}>
                    <Row align="middle" style={{ marginBottom: 12 }}>
                        <Col flex="auto">
                            <Text style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-secondary, rgba(0,0,0,0.55))' }}>
                                Claims Summary
                            </Text>
                        </Col>
                        {!loading && filters.month && (
                            <Col>
                                <Text type="secondary" style={{ fontSize: 12 }}>
                                    {dayjs(filters.month, 'YYYY-MM').format('MMMM YYYY')}
                                </Text>
                            </Col>
                        )}
                    </Row>
                    <Row gutter={[16, 16]}>
                        {/* Total claims + total amount — hero stat */}
                        <Col xs={24} sm={12} lg={6}>
                            {loading ? <Skeleton active paragraph={{ rows: 2 }} title={false} /> : (
                                <div style={{
                                    borderLeft: '3px solid #1677ff',
                                    paddingLeft: 12,
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                                        <DollarOutlined style={{ color: '#1677ff', fontSize: 13 }} />
                                        <Text type="secondary" style={{ fontSize: 12 }}>Total Claims Value</Text>
                                    </div>
                                    <div>
                                        <Text style={{ fontSize: 22, fontWeight: 700, lineHeight: 1.2 }}>
                                            {formatAmount(totalAmount)}
                                        </Text>
                                        <Text type="secondary" style={{ fontSize: 12, marginLeft: 4 }}>KES</Text>
                                    </div>
                                    <Text type="secondary" style={{ fontSize: 12 }}>
                                        {totalCount.toLocaleString()} claim{totalCount !== 1 ? 's' : ''}
                                    </Text>
                                </div>
                            )}
                        </Col>

                        <Col xs={24} sm={12} lg={1} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Divider type={isMobile ? 'horizontal' : 'vertical'} style={{ height: isMobile ? undefined : 56, margin: 0 }} />
                        </Col>

                        {/* Approved */}
                        <Col xs={24} sm={12} lg={5}>
                            {loading ? <Skeleton active paragraph={{ rows: 2 }} title={false} /> : (
                                <div style={{
                                    borderLeft: '3px solid #52c41a',
                                    paddingLeft: 12,
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                                        <CheckCircleOutlined style={{ color: '#52c41a', fontSize: 13 }} />
                                        <Text type="secondary" style={{ fontSize: 12 }}>Approved</Text>
                                    </div>
                                    <div>
                                        <Text style={{ fontSize: 20, fontWeight: 700, lineHeight: 1.2, color: '#52c41a' }}>
                                            {formatAmount(byStatusAmount.approved ?? 0)}
                                        </Text>
                                        <Text type="secondary" style={{ fontSize: 12, marginLeft: 4 }}>KES</Text>
                                    </div>
                                    <Text type="secondary" style={{ fontSize: 12 }}>
                                        {(byStatus.approved ?? 0).toLocaleString()} claim{(byStatus.approved ?? 0) !== 1 ? 's' : ''}
                                    </Text>
                                </div>
                            )}
                        </Col>

                        {/* Pending */}
                        <Col xs={24} sm={12} lg={5}>
                            {loading ? <Skeleton active paragraph={{ rows: 2 }} title={false} /> : (
                                <div style={{
                                    borderLeft: '3px solid #faad14',
                                    paddingLeft: 12,
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                                        <ClockCircleOutlined style={{ color: '#faad14', fontSize: 13 }} />
                                        <Text type="secondary" style={{ fontSize: 12 }}>Pending</Text>
                                    </div>
                                    <div>
                                        <Text style={{ fontSize: 20, fontWeight: 700, lineHeight: 1.2, color: '#faad14' }}>
                                            {formatAmount(byStatusAmount.pending ?? 0)}
                                        </Text>
                                        <Text type="secondary" style={{ fontSize: 12, marginLeft: 4 }}>KES</Text>
                                    </div>
                                    <Text type="secondary" style={{ fontSize: 12 }}>
                                        {(byStatus.pending ?? 0).toLocaleString()} claim{(byStatus.pending ?? 0) !== 1 ? 's' : ''}
                                    </Text>
                                </div>
                            )}
                        </Col>

                        {/* Rejected */}
                        <Col xs={24} sm={12} lg={5}>
                            {loading ? <Skeleton active paragraph={{ rows: 2 }} title={false} /> : (
                                <div style={{
                                    borderLeft: '3px solid #ff4d4f',
                                    paddingLeft: 12,
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                                        <CloseCircleOutlined style={{ color: '#ff4d4f', fontSize: 13 }} />
                                        <Text type="secondary" style={{ fontSize: 12 }}>Rejected</Text>
                                    </div>
                                    <div>
                                        <Text style={{ fontSize: 20, fontWeight: 700, lineHeight: 1.2, color: '#ff4d4f' }}>
                                            {formatAmount(byStatusAmount.rejected ?? 0)}
                                        </Text>
                                        <Text type="secondary" style={{ fontSize: 12, marginLeft: 4 }}>KES</Text>
                                    </div>
                                    <Text type="secondary" style={{ fontSize: 12 }}>
                                        {(byStatus.rejected ?? 0).toLocaleString()} claim{(byStatus.rejected ?? 0) !== 1 ? 's' : ''}
                                    </Text>
                                </div>
                            )}
                        </Col>
                    </Row>
                </Card>
            )}

            <Card
                style={{ marginBottom: 16 }}
                styles={{ body: { paddingBottom: 16 } }}
            >
                {/* ── Header row: title + active-filter count + action buttons ── */}
                <Row align="middle" style={{ marginBottom: 16 }} wrap={false}>
                    <Col flex="auto">
                        <Space align="center" size={8}>
                            <FilterOutlined style={{ color: token.colorTextSecondary, fontSize: 14 }} />
                            <Text style={{ fontWeight: 600, fontSize: 14 }}>Filters</Text>
                            {activeFilterCount > 0 && (
                                <Tag
                                    color="blue"
                                    style={{ borderRadius: 10, fontSize: 11, lineHeight: '18px', padding: '0 7px', margin: 0 }}
                                >
                                    {activeFilterCount} active
                                </Tag>
                            )}
                        </Space>
                    </Col>
                    <Col>
                        <Space size={8}>
                            {activeFilterCount > 0 && (
                                <Tooltip title="Clear all filters">
                                    <Button
                                        size="small"
                                        icon={<ClearOutlined />}
                                        onClick={() => setFilters({ month: '', insurer: '', use: '', claim_upstream_error_group: '' })}
                                    >
                                        Clear
                                    </Button>
                                </Tooltip>
                            )}
                            <Tooltip title="Refresh data">
                                <Button
                                    icon={<ReloadOutlined />}
                                    onClick={() => void fetchClaims()}
                                    loading={loading}
                                    size="middle"
                                />
                            </Tooltip>
                            <Dropdown menu={{ items: exportMenuItems }} placement="bottomRight" disabled={total === 0 || exporting}>
                                <Button
                                    icon={<DownloadOutlined />}
                                    size="middle"
                                    loading={exporting}
                                    disabled={total === 0 || exporting}
                                >
                                    {exporting
                                        ? `Fetching ${exportProgress.toLocaleString()} / ${total.toLocaleString()}…`
                                        : 'Export'}
                                </Button>
                            </Dropdown>
                        </Space>
                    </Col>
                </Row>

                {/* ── Filter fields ── */}
                <Row gutter={[12, 12]} align="bottom">
                    <Col xs={24} sm={12} md={8} lg={5}>
                        <FilterField label="Facility">
                            <FacilityContextSwitcher variant="compact" showLabel={false} />
                        </FilterField>
                    </Col>
                    <Col xs={24} sm={12} md={8} lg={4}>
                        <FilterField label="Month">
                            <DatePicker
                                picker="month"
                                value={filters.month ? dayjs(filters.month, 'YYYY-MM') : null}
                                onChange={(d) => setFilters({ month: d ? d.format('YYYY-MM') : '' })}
                                placeholder="All months"
                                allowClear
                                style={{ width: '100%' }}
                                suffixIcon={<CalendarOutlined />}
                            />
                        </FilterField>
                    </Col>
                    <Col xs={24} sm={12} md={8} lg={5}>
                        <FilterField label="Insurer">
                            <Select
                                allowClear
                                placeholder={filterOptionsLoading ? 'Loading…' : 'All insurers'}
                                style={{ width: '100%' }}
                                value={filters.insurer || undefined}
                                onChange={(v) => setFilters({ insurer: v ?? '' })}
                                options={insurerOptions.map((v) => ({ label: v, value: v }))}
                                loading={filterOptionsLoading}
                                notFoundContent={filterOptionsLoading ? 'Loading…' : 'No insurers'}
                            />
                        </FilterField>
                    </Col>
                    <Col xs={24} sm={12} md={8} lg={4}>
                        <FilterField label="Use">
                            <Select
                                allowClear
                                placeholder={filterOptionsLoading ? 'Loading…' : 'All'}
                                style={{ width: '100%' }}
                                value={filters.use || undefined}
                                onChange={(v) => setFilters({ use: v ?? '' })}
                                options={useOptions.map((v) => ({ label: v, value: v }))}
                                loading={filterOptionsLoading}
                                notFoundContent={filterOptionsLoading ? 'Loading…' : 'No uses'}
                            />
                        </FilterField>
                    </Col>
                    <Col xs={24} sm={12} md={8} lg={6}>
                        <FilterField label="Error Group">
                            <Select
                                allowClear
                                placeholder={filterOptionsLoading ? 'Loading…' : 'All error groups'}
                                style={{ width: '100%' }}
                                value={filters.claim_upstream_error_group || undefined}
                                onChange={(v) => setFilters({ claim_upstream_error_group: v ?? '' })}
                                options={errorGroupOptions.map((v) => ({ label: v, value: v }))}
                                loading={filterOptionsLoading}
                                notFoundContent={filterOptionsLoading ? 'Loading…' : 'No error groups'}
                            />
                        </FilterField>
                    </Col>
                </Row>

                {/* ── Result count ── */}
                {total > 0 && (
                    <div style={{ marginTop: 12, paddingTop: 12, borderTop: `1px solid ${token.colorBorderSecondary}` }}>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                            {total.toLocaleString()} claim{total !== 1 ? 's' : ''} match{total === 1 ? 'es' : ''} current filters
                        </Text>
                    </div>
                )}
            </Card>

            {loading ? (
                <TableSkeleton rows={filters.pageSize} />
            ) : claims.length > 0 ? (
                <Card>
                    <Table<FacilityClaim>
                        dataSource={claims}
                        columns={columns}
                        rowKey="name"
                        expandable={{
                            expandedRowRender: renderExpandedClaimDetails,
                            rowExpandable: () => true,
                            columnWidth: 48,
                        }}
                        onChange={(_pagination, tableFilters) => {
                            // Column filter changes — wire Status and Use back to the store as server-side filters
                            const newStatus = (tableFilters.claim_status?.[0] as string) ?? '';
                            const newUse = (tableFilters.use?.[0] as string) ?? '';
                            if (newStatus !== filters.status || newUse !== filters.use) {
                                setFilters({ status: newStatus, use: newUse });
                            }
                        }}
                        pagination={{
                            current: filters.page,
                            pageSize: filters.pageSize,
                            total,
                            showSizeChanger: true,
                            showTotal: (t) => `Total ${t} claims`,
                            onChange: (page, pageSize) => setFilters({ page, pageSize }),
                        }}
                        scroll={{ x: 'max-content' }}
                        size="middle"
                    />
                </Card>
            ) : (
                <EmptyState
                    type="no-data"
                    title="No Facility Claims"
                    description="There are no claims for your selected facilities. Claims sent for this facility will appear here."
                    onAction={() => void fetchClaims()}
                    actionText="Reload Claims"
                />
            )}

            <ClaimDetailDrawer
                visible={detailDrawerVisible}
                claim={selectedClaim}
                onClose={() => {
                    setDetailDrawerVisible(false);
                    setSelectedClaim(null);
                }}
            />
        </div>
    );
};

export default ClaimsListView;

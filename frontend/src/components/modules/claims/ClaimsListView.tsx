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
} from 'antd';
import {
    ReloadOutlined,
    CalendarOutlined,
    EyeOutlined,
    BankOutlined,
    DownloadOutlined,
    FileExcelOutlined,
    FileTextOutlined,
} from '@ant-design/icons';
import type { MenuProps } from 'antd';
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

const ClaimsListView: React.FC = () => {
    const { isMobile, isTablet } = useResponsive();
    // Let backend handle empty/missing facilities - just use what's in store
    const facilityIds = useFacilityStore((s) => s.selectedFacilityIds) ?? [];
    const facilityIdsKey = facilityIds.join(',');

    const {
        claims,
        summary,
        loading,
        total,
        filters,
        insurerOptions,
        useOptions,
        errorGroupOptions,
        filterOptionsLoading,
        fetchClaims,
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

    const columns = useMemo(() => {
        const cols: any[] = [
            {
                title: 'Client',
                key: 'client',
                fixed: isMobile ? undefined : ('left' as const),
                width: isMobile ? undefined : 200,
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
                render: (_: unknown, record: FacilityClaim) => (
                    <Tag>{record.use || 'claim'}</Tag>
                ),
            },
            {
                title: 'Period',
                key: 'period',
                width: 160,
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
            fixed: isMobile ? undefined : ('right' as const),
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
    }, [getStatusColor, formatPeriod, isMobile, isTablet]);

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
                onClick: () => downloadClaimsAsCsv(claims, exportFilename),
            },
            {
                key: 'xlsx',
                icon: <FileExcelOutlined />,
                label: 'Download as Excel',
                onClick: () => downloadClaimsAsExcel(claims, exportFilename),
            },
        ],
        [claims, exportFilename]
    );

    const byStatus = summary?.by_status ?? {};
    const byStatusAmount = summary?.by_status_amount ?? {};
    const totalAmount = summary?.total_amount ?? 0;
    const totalCount = summary?.total_count ?? total;
    const formatAmount = (n: number) => new Intl.NumberFormat('en-KE').format(n);

    return (
        <div style={{ padding: isMobile ? '12px' : '24px' }}>
            <Title level={isMobile ? 4 : 3}>Facility Claims</Title>

            {/* Insights for filtered data: count and amount per status */}
            {!loading && totalCount > 0 && (
                <Card size="small" style={{ marginBottom: 16 }}>
                    <Text type="secondary" style={{ fontSize: 12, marginBottom: 8, display: 'block' }}>
                        Insights for current filters
                    </Text>
                    <Space wrap size="middle" align="center">
                        <Text strong>{totalCount}</Text>
                        <Text type="secondary">claims</Text>
                        <Tag color="success">
                            Approved {byStatus.approved ?? 0}
                            {byStatusAmount.approved != null && ` (${formatAmount(byStatusAmount.approved)} KES)`}
                        </Tag>
                        <Tag color="warning">
                            Pending {byStatus.pending ?? 0}
                            {byStatusAmount.pending != null && ` (${formatAmount(byStatusAmount.pending)} KES)`}
                        </Tag>
                        <Tag color="error">
                            Rejected {byStatus.rejected ?? 0}
                            {byStatusAmount.rejected != null && ` (${formatAmount(byStatusAmount.rejected)} KES)`}
                        </Tag>
                        <Text type="secondary">·</Text>
                        <Text strong>
                            Total amount: {formatAmount(totalAmount)} KES
                        </Text>
                    </Space>
                </Card>
            )}

            <Card style={{ marginBottom: 16 }}>
                <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                    <Space wrap size="middle" style={{ width: '100%', alignItems: 'center' }}>
                        <Space>
                            <Text type="secondary" style={{ fontSize: 12 }}>Facility</Text>
                            <FacilityContextSwitcher variant="compact" showLabel={false} />
                        </Space>
                        <Space>
                            <Text type="secondary" style={{ fontSize: 12 }}>Month</Text>
                            <DatePicker
                                picker="month"
                                value={filters.month ? dayjs(filters.month, 'YYYY-MM') : null}
                                onChange={(d) => setFilters({ month: d ? d.format('YYYY-MM') : '' })}
                                placeholder="All months"
                                allowClear
                                size="middle"
                                style={{ minWidth: 140 }}
                                suffixIcon={<CalendarOutlined />}
                            />
                        </Space>
                        <Space>
                            <Text type="secondary" style={{ fontSize: 12 }}>Insurer</Text>
                            <Select
                                allowClear
                                placeholder={filterOptionsLoading ? 'Loading…' : 'All insurers'}
                                size="middle"
                                style={{ minWidth: 160 }}
                                value={filters.insurer || undefined}
                                onChange={(v) => setFilters({ insurer: v ?? '' })}
                                options={insurerOptions.map((v) => ({ label: v, value: v }))}
                                loading={filterOptionsLoading}
                                notFoundContent={filterOptionsLoading ? 'Loading…' : 'No insurers'}
                            />
                        </Space>
                        <Space>
                            <Text type="secondary" style={{ fontSize: 12 }}>Use</Text>
                            <Select
                                allowClear
                                placeholder={filterOptionsLoading ? 'Loading…' : 'All uses'}
                                size="middle"
                                style={{ minWidth: 120 }}
                                value={filters.use || undefined}
                                onChange={(v) => setFilters({ use: v ?? '' })}
                                options={useOptions.map((v) => ({ label: v, value: v }))}
                                loading={filterOptionsLoading}
                                notFoundContent={filterOptionsLoading ? 'Loading…' : 'No uses'}
                            />
                        </Space>
                        <Space>
                            <Text type="secondary" style={{ fontSize: 12 }}>Error group</Text>
                            <Select
                                allowClear
                                placeholder={filterOptionsLoading ? 'Loading…' : 'All error groups'}
                                size="middle"
                                style={{ minWidth: 180 }}
                                value={filters.claim_upstream_error_group || undefined}
                                onChange={(v) => setFilters({ claim_upstream_error_group: v ?? '' })}
                                options={errorGroupOptions.map((v) => ({ label: v, value: v }))}
                                loading={filterOptionsLoading}
                                notFoundContent={filterOptionsLoading ? 'Loading…' : 'No error groups'}
                            />
                        </Space>
                        <Button
                            icon={<ReloadOutlined />}
                            onClick={() => void fetchClaims()}
                            loading={loading}
                            size="middle"
                        >
                            Refresh
                        </Button>
                        <Dropdown menu={{ items: exportMenuItems }} placement="bottomRight">
                            <Button icon={<DownloadOutlined />} size="middle" disabled={claims.length === 0}>
                                Export
                            </Button>
                        </Dropdown>
                    </Space>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                        Total {total} claims
                    </Text>
                </Space>
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

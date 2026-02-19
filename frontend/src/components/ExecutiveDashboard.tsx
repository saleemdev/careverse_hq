/**
 * Executive Dashboard Component
 * Main dashboard view for county executives and senior administrators
 * Displays KPIs focused on Health Facilities and Facility Affiliations
 */

import { useState, useEffect, useCallback } from 'react';
import {
    Row,
    Col,
    Card,
    Typography,
    Tag,
    Space,
    Spin,
    Badge,
    theme,
    Button,
    Avatar,
    List,
    Progress,
    Tooltip,
    Input,
} from 'antd';
import {
    BankOutlined,
    CheckCircleOutlined,
    UserAddOutlined,
    ReloadOutlined,
    LinkOutlined,
    SafetyCertificateOutlined,
    ArrowRightOutlined,
    SearchOutlined,
} from '@ant-design/icons';
import { dashboardApi, employeesApi } from '../services/api';
import { useResponsive } from '../hooks/useResponsive';
import useFacilityStore from '../stores/facilityStore';
import useDashboardRealtime from '../hooks/useDashboardRealtime';
// AccountTypesMetrics removed as per requirement

const { Title, Text } = Typography;

interface DashboardProps {
    navigateToRoute?: (route: string, id?: string) => void;
}

const ExecutiveDashboard: React.FC<DashboardProps> = ({ navigateToRoute }) => {
    const { token } = theme.useToken();
    const { isMobile, isTablet } = useResponsive();
    const [loading, setLoading] = useState(true);
    const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
    const [cadreSearchText, setCadreSearchText] = useState('');
    const [licensingBodySearchText, setLicensingBodySearchText] = useState('');

    // Facility context - only for company info, no filtering
    const {
        company,
        hasCompanyPermission,
        loading: facilityLoading,
    } = useFacilityStore();

    // State for real data
    const [companyData, setCompanyData] = useState<any>(null);
    const [affiliationData, setAffiliationData] = useState<any>(null);
    const [licenseData, setLicenseData] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);
    const [realtimeError, setRealtimeError] = useState<string | null>(null);

    // Realtime updates - merge with existing state
    const handleBudgetUpdate = useCallback((update: any) => {
        // Budget metrics removed as per plan, but we might still receive updates
        console.log('[Dashboard] Received budget metrics update, but budget section is removed', update);
    }, []);

    const handleCompanyUpdate = useCallback((update: any) => {
        setCompanyData((prev: any) => ({
            ...prev,
            ...update,
        }));
        console.log('[Dashboard] Applied company metrics update from realtime');
    }, []);

    // Subscribe to realtime updates
    const { isConnected: realtimeConnected } = useDashboardRealtime({
        onBudgetUpdate: handleBudgetUpdate,
        onCompanyUpdate: handleCompanyUpdate,
        onError: (error) => {
            console.error('[Dashboard] Realtime error:', error);
            setRealtimeError(error);
            // Clear error after 5 seconds
            setTimeout(() => setRealtimeError(null), 5000);
        },
        enabled: hasCompanyPermission && !facilityLoading, // Only enable after facility context is ready
    });

    // Fetch data when company is loaded - ONLY after facility context is ready
    useEffect(() => {
        // CRITICAL: Only fetch if facility context is ready
        if (hasCompanyPermission && !facilityLoading && company) {
            fetchDashboardData();
        }
    }, [hasCompanyPermission, facilityLoading, company]);

    const fetchDashboardData = async () => {
        setLoading(true);
        setError(null);

        try {
            // Keep this count in sync with the Health Professionals module list.
            const workforceResponse = await employeesApi.getList({
                page: 1,
                page_size: 1,
            });
            const healthProfessionalsTotal =
                workforceResponse.success && workforceResponse.data
                    ? (workforceResponse.data.total_count ?? workforceResponse.data.metrics?.total_employees ?? 0)
                    : 0;

            // Fetch company overview - no facility filtering, show entire company
            const overviewResponse = await dashboardApi.getCompanyOverview();

            // Fetch affiliation statistics for focused affiliation KPIs
            const affiliationStatsResponse = await dashboardApi.getAffiliationStatistics();

            const byStatus = affiliationStatsResponse.success
                ? (affiliationStatsResponse.data?.by_status || {})
                : {};
            const byEmploymentType = affiliationStatsResponse.success
                ? (affiliationStatsResponse.data?.by_employment_type || {})
                : {};
            const byProfessionalCadre = affiliationStatsResponse.success
                ? (affiliationStatsResponse.data?.by_professional_cadre || {})
                : {};
            const byLicensingBody = affiliationStatsResponse.success
                ? (affiliationStatsResponse.data?.by_licensing_body || {})
                : {};

            const totalAffiliations = Number(
                affiliationStatsResponse.success
                    ? (affiliationStatsResponse.data?.total ?? Object.values(byStatus).reduce((sum: number, count: any) => sum + Number(count || 0), 0))
                    : 0
            );

            const confirmedAffiliations = Number(byStatus.Active || 0) + Number(byStatus.Confirmed || 0);
            const pendingAffiliations = Number(byStatus.Pending || 0);
            const rejectedAffiliations = Number(byStatus.Rejected || 0);
            const confirmationRate = totalAffiliations > 0 ? (confirmedAffiliations / totalAffiliations) * 100 : 0;
            const rejectionRate = totalAffiliations > 0 ? (rejectedAffiliations / totalAffiliations) * 100 : 0;

            setAffiliationData({
                total: totalAffiliations,
                confirmed: confirmedAffiliations,
                pending: pendingAffiliations,
                rejected: rejectedAffiliations,
                confirmation_rate: confirmationRate,
                rejection_rate: rejectionRate,
                by_employment_type: byEmploymentType,
                by_professional_cadre: byProfessionalCadre,
                by_licensing_body: byLicensingBody,
            });

            if (overviewResponse.success && overviewResponse.data) {
                setCompanyData({
                    health_professionals_total: healthProfessionalsTotal,
                    confirmed_affiliations: confirmedAffiliations,
                    pending_affiliations: pendingAffiliations,
                    total_affiliations: totalAffiliations,
                    rejected_affiliations: rejectedAffiliations,
                    confirmation_rate: confirmationRate,
                    total_assets: overviewResponse.data.total_assets || 0,
                    total_facilities: overviewResponse.data.total_facilities || 0,
                });
            } else {
                setCompanyData((prev: any) => ({
                    ...(prev || {}),
                    health_professionals_total: healthProfessionalsTotal,
                    confirmed_affiliations: confirmedAffiliations,
                    pending_affiliations: pendingAffiliations,
                    total_affiliations: totalAffiliations,
                    rejected_affiliations: rejectedAffiliations,
                    confirmation_rate: confirmationRate,
                }));
            }

            // Fetch license compliance - no facility filtering
            const licenseResponse = await dashboardApi.getLicenseComplianceOverview();
            if (licenseResponse.success && licenseResponse.data) {
                setLicenseData(licenseResponse.data);
            } else {
                console.warn('[Dashboard] License compliance data not available:', licenseResponse.error || 'No data returned');
                // Set empty data structure to prevent UI errors
                setLicenseData({
                    compliance_rate: 0,
                    total_active_licenses: 0,
                    expired_licenses: 0,
                    licenses_expiring_soon: 0,
                    pending_licenses: 0,
                    expiring_details: []
                });
            }

        } catch (err: any) {
            console.error('Error fetching dashboard data:', err);
            const errorMessage = err.error || err.message || 'Failed to load dashboard data';
            setError(errorMessage);

            // Fallback to partially empty data if error occurs
            setCompanyData((prev: any) => prev || { health_professionals_total: 0, pending_affiliations: 0, total_affiliations: 0, total_facilities: 0 });
            setAffiliationData((prev: any) => prev || { total: 0, confirmed: 0, pending: 0, rejected: 0, confirmation_rate: 0, rejection_rate: 0, by_employment_type: {}, by_professional_cadre: {}, by_licensing_body: {} });
        } finally {
            setLoading(false);
        }
    };

    const handleRefresh = () => {
        setLastRefresh(new Date());
        fetchDashboardData();
    };

    // Format currency
    const formatCurrency = (value: number): string => {
        if (value >= 1000000) {
            return `KES ${(value / 1000000).toFixed(1)}M`;
        }
        if (value >= 1000) {
            return `KES ${(value / 1000).toFixed(0)}K`;
        }
        return `KES ${value.toLocaleString()}`;
    };

    // KPI Card Component
    const KPICard: React.FC<{
        title: string;
        value: number | string;
        icon: React.ReactNode;
        color: string;
        subtitle?: string;
        onClick?: () => void;
        actionLabel?: string;
        onActionClick?: () => void;
    }> = ({ title, value, icon, color, subtitle, onClick, actionLabel, onActionClick }) => (
        <Card
            hoverable
            onClick={onClick}
            style={{
                borderRadius: '12px',
                boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
                border: 'none',
                height: '100%',
                transition: 'all 0.3s ease',
                cursor: onClick ? 'pointer' : 'default',
            }}
            bodyStyle={{ padding: isMobile ? '12px' : isTablet ? '14px' : '16px' }}
        >
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                <div style={{ flex: 1 }}>
                    <Text type="secondary" style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                        {title}
                    </Text>
                    <div style={{ fontSize: isMobile ? '24px' : isTablet ? '26px' : '28px', fontWeight: 700, color, marginTop: '6px', lineHeight: 1.1 }}>
                        {loading && !value ? <Spin size="small" /> : value}
                    </div>
                    {subtitle && (
                        <div style={{ marginTop: '6px', display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                            <Text type="secondary" style={{ fontSize: '11px' }}>{subtitle}</Text>
                        </div>
                    )}
                    {actionLabel && onActionClick && (
                        <Button
                            type="link"
                            size="small"
                            icon={<ArrowRightOutlined />}
                            onClick={(event) => {
                                event.stopPropagation();
                                onActionClick();
                            }}
                            style={{ paddingInline: 0, marginTop: 2, fontSize: 12, height: 22 }}
                        >
                            {actionLabel}
                        </Button>
                    )}
                </div>
                <div
                    style={{
                        width: '48px',
                        height: '48px',
                        borderRadius: '12px',
                        background: `${color}15`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '20px',
                        color,
                    }}
                >
                    {icon}
                </div>
            </div>
        </Card>
    );

    // Section Header Component
    const SectionHeader: React.FC<{ title: string; icon: React.ReactNode; action?: React.ReactNode }> = ({ title, icon, action }) => (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', marginBottom: '16px', marginTop: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div
                    style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '9px',
                        background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#fff',
                        fontSize: '16px',
                    }}
                >
                    {icon}
                </div>
                <Title level={4} style={{ margin: 0, color: token.colorTextHeading }}>
                    {title}
                </Title>
            </div>
            {action}
        </div>
    );

    const employmentTypeEntries = Object.entries(affiliationData?.by_employment_type || {})
        .map(([type, count]) => ({ type, count: Number(count || 0) }))
        .sort((a, b) => b.count - a.count);

    const cadreEntries = Object.entries(affiliationData?.by_professional_cadre || {})
        .map(([cadre, status]: any) => ({
            cadre,
            total: Number(status.total || 0),
            confirmed: (Number(status.Active || 0) + Number(status.Confirmed || 0)),
            pending: Number(status.Pending || 0),
            rejected: Number(status.Rejected || 0),
        }))
        .sort((a, b) => b.total - a.total);

    const licensingBodyEntries = Object.entries(affiliationData?.by_licensing_body || {})
        .map(([body, status]: any) => ({
            body,
            total: Number(status.total || 0),
            confirmed: (Number(status.Active || 0) + Number(status.Confirmed || 0)),
            pending: Number(status.Pending || 0),
            rejected: Number(status.Rejected || 0),
        }))
        .sort((a, b) => b.total - a.total);

    return (
        <div
            style={{
                padding: isMobile ? '12px' : '20px',
                background: token.colorBgLayout,
                minHeight: 'calc(100vh - 64px)',
            }}
        >
            {/* Header */}
            <div style={{
                marginBottom: '16px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: isMobile ? 'flex-start' : 'center',
                flexDirection: isMobile ? 'column' : 'row',
                gap: '16px'
            }}>
                <div style={{ width: isMobile ? '100%' : 'auto' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        <Title level={isMobile ? 3 : 2} style={{ margin: 0, color: token.colorTextHeading, fontWeight: 600, fontSize: isMobile ? '22px' : '26px' }}>
                            Executive Dashboard
                        </Title>
                        {realtimeConnected ? (
                            <Badge status="processing" text={isMobile ? "" : "Real-time"} style={{ marginLeft: '4px' }} />
                        ) : (
                            <Badge status="default" text={isMobile ? "" : "Manual"} style={{ marginLeft: '4px' }} />
                        )}
                    </div>
                    <Text type="secondary" style={{ fontSize: isMobile ? '12px' : '13px' }}>
                        Company-wide overview for {company?.abbr || company?.company_name}
                    </Text>
                </div>
                <Space style={{ width: isMobile ? '100%' : 'auto', justifyContent: isMobile ? 'space-between' : 'flex-end' }}>
                    {!isMobile && (
                        <Text type="secondary" style={{ fontSize: '12px' }}>
                            Updated: {lastRefresh.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </Text>
                    )}
                    <Button
                        icon={<ReloadOutlined spin={loading} />}
                        onClick={handleRefresh}
                        size={isMobile ? "small" : "middle"}
                    >
                        {isMobile ? "Refresh" : "Refresh Data"}
                    </Button>
                </Space>
            </div>

            {/* Section 1: County Overview */}
            <SectionHeader title="Facility & Affiliation Overview" icon={<BankOutlined />} />
            <Row gutter={[16, 16]}>
                <Col xs={24} sm={12} lg={6}>
                    <KPICard
                        title="Health Professionals"
                        value={companyData?.health_professionals_total?.toLocaleString() || '0'}
                        icon={<CheckCircleOutlined />}
                        color="#52c41a"
                        subtitle="Total records"
                        onClick={() => navigateToRoute?.('health-professionals')}
                    />
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <KPICard
                        title="Health Facilities"
                        value={companyData?.total_facilities || '0'}
                        icon={<BankOutlined />}
                        color="#722ed1"
                        subtitle="Registered facilities"
                        onClick={() => navigateToRoute?.('facilities')}
                    />
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <KPICard
                        title="Total Affiliations"
                        value={companyData?.total_affiliations || '0'}
                        icon={<LinkOutlined />}
                        color="#1890ff"
                        subtitle="All affiliation requests"
                        onClick={() => navigateToRoute?.('affiliations')}
                    />
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <KPICard
                        title="Pending Affiliations"
                        value={companyData?.pending_affiliations || '0'}
                        icon={<UserAddOutlined />}
                        color="#faad14"
                        subtitle="Awaiting review"
                        onClick={() => navigateToRoute?.('affiliations')}
                    />
                </Col>
            </Row>

            {/* Section 2: Affiliation Insights */}
            <SectionHeader
                title="Facility Affiliation Insights"
                icon={<LinkOutlined />}
                action={
                    <Button
                        size={isMobile ? 'small' : 'middle'}
                        icon={<ArrowRightOutlined />}
                        onClick={() => navigateToRoute?.('affiliations')}
                    >
                        Open Module
                    </Button>
                }
            />
            <Row gutter={[16, 16]}>
                <Col xs={24} md={10}>
                    <Card
                        style={{
                            borderRadius: '12px',
                            boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
                            border: 'none',
                        }}
                        title="Affiliation Status"
                    >
                        <Row gutter={[12, 12]} style={{ marginBottom: 16 }}>
                            <Col span={12}>
                                <div style={{ background: '#e6f7ff', borderRadius: 10, padding: 12 }}>
                                    <Text type="secondary" style={{ fontSize: 12 }}>TOTAL</Text>
                                    <Title level={4} style={{ margin: 0, color: '#1890ff' }}>{affiliationData?.total || 0}</Title>
                                </div>
                            </Col>
                            <Col span={12}>
                                <div style={{ background: '#f6ffed', borderRadius: 10, padding: 12 }}>
                                    <Text type="secondary" style={{ fontSize: 12 }}>CONFIRMED</Text>
                                    <Title level={4} style={{ margin: 0, color: '#52c41a' }}>{affiliationData?.confirmed || 0}</Title>
                                </div>
                            </Col>
                            <Col span={12}>
                                <div style={{ background: '#fffbe6', borderRadius: 10, padding: 12 }}>
                                    <Text type="secondary" style={{ fontSize: 12 }}>PENDING</Text>
                                    <Title level={4} style={{ margin: 0, color: '#faad14' }}>{affiliationData?.pending || 0}</Title>
                                </div>
                            </Col>
                            <Col span={12}>
                                <div style={{ background: '#fff1f0', borderRadius: 10, padding: 12 }}>
                                    <Text type="secondary" style={{ fontSize: 12 }}>REJECTED</Text>
                                    <Title level={4} style={{ margin: 0, color: '#ff4d4f' }}>{affiliationData?.rejected || 0}</Title>
                                </div>
                            </Col>
                        </Row>
                        <div style={{ marginBottom: 10 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                                <Text type="secondary">Confirmation Rate</Text>
                                <Text strong>{(affiliationData?.confirmation_rate || 0).toFixed(1)}%</Text>
                            </div>
                            <Progress percent={Number((affiliationData?.confirmation_rate || 0).toFixed(1))} showInfo={false} strokeColor="#52c41a" />
                        </div>
                        <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                                <Text type="secondary">Rejection Rate</Text>
                                <Text strong>{(affiliationData?.rejection_rate || 0).toFixed(1)}%</Text>
                            </div>
                            <Progress percent={Number((affiliationData?.rejection_rate || 0).toFixed(1))} showInfo={false} strokeColor="#ff4d4f" />
                        </div>
                    </Card>
                </Col>
                <Col xs={24} md={14}>
                    <Card
                        style={{
                            borderRadius: '12px',
                            boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
                            border: 'none',
                            height: '100%',
                        }}
                        title="Distribution by Employment Type"
                    >
                        {employmentTypeEntries.length === 0 ? (
                            <div style={{ padding: 24, textAlign: 'center' }}>
                                <Text type="secondary">No affiliation employment type data available</Text>
                            </div>
                        ) : (
                            <Space direction="vertical" style={{ width: '100%' }} size={12}>
                                {employmentTypeEntries.map((entry) => {
                                    const percent = affiliationData?.total ? (entry.count / affiliationData.total) * 100 : 0;
                                    return (
                                        <div key={entry.type}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, gap: 8 }}>
                                                <Text style={{ fontSize: 13 }}>{entry.type}</Text>
                                                <Text strong>{entry.count}</Text>
                                            </div>
                                            <Progress percent={Number(percent.toFixed(1))} showInfo={false} />
                                        </div>
                                    );
                                })}
                            </Space>
                        )}
                    </Card>
                </Col>
            </Row>

            {/* Section 3: Affiliation Distribution */}
            <SectionHeader
                title="Affiliation Distribution"
                icon={<LinkOutlined />}
            />
            <Row gutter={[16, 16]}>
                <Col xs={24} md={12}>
                    <Card
                        style={{
                            borderRadius: 'var(--radius-lg)',
                            boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
                            border: 'none',
                        }}
                        title="By Professional Cadre"
                    >
                        {cadreEntries.length === 0 ? (
                            <div style={{ padding: 24, textAlign: 'center' }}>
                                <Text type="secondary">No professional cadre data available</Text>
                            </div>
                        ) : (
                            <>
                                <Input
                                    placeholder="Search cadres..."
                                    prefix={<SearchOutlined />}
                                    value={cadreSearchText}
                                    onChange={(e) => setCadreSearchText(e.target.value)}
                                    style={{ marginBottom: 16 }}
                                    size="small"
                                />
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                                    {cadreEntries
                                        .filter((entry) =>
                                            entry.cadre.toLowerCase().includes(cadreSearchText.toLowerCase())
                                        )
                                        .map((entry) => {
                                    const affiliatedPercent = entry.total ? (entry.confirmed / entry.total) * 100 : 0;
                                    const pendingPercent = entry.total ? (entry.pending / entry.total) * 100 : 0;
                                    const rejectedPercent = entry.total ? (entry.rejected / entry.total) * 100 : 0;

                                    return (
                                        <div
                                            key={entry.cadre}
                                            style={{
                                                padding: 12,
                                                borderRadius: 8,
                                                background: token.colorBgContainer,
                                                border: `1px solid ${token.colorBorder}`,
                                            }}
                                        >
                                            {/* Header: Name & Total */}
                                            <div style={{ marginBottom: 12 }}>
                                                <Title level={5} style={{ margin: 0, color: token.colorTextHeading }}>
                                                    {entry.cadre}
                                                </Title>
                                                <Text type="secondary" style={{ fontSize: 12 }}>
                                                    {entry.total} total affiliations
                                                </Text>
                                            </div>

                                            {/* Status Rows - Vertical Stack */}
                                            <Space direction="vertical" style={{ width: '100%' }} size={8}>
                                                {/* Affiliated Status */}
                                                <div>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                                                        <Text style={{ fontSize: 12 }}>Affiliated</Text>
                                                        <Text strong style={{ fontSize: 12, color: '#52c41a' }}>
                                                            {entry.confirmed} ({affiliatedPercent.toFixed(0)}%)
                                                        </Text>
                                                    </div>
                                                    <Progress
                                                        percent={Number(affiliatedPercent.toFixed(1))}
                                                        showInfo={false}
                                                        strokeColor="#52c41a"
                                                        size={['100%', 8]}
                                                        trailColor={token.colorBgLayout}
                                                    />
                                                </div>

                                                {/* Pending Status */}
                                                <div>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                                                        <Text style={{ fontSize: 12 }}>Pending</Text>
                                                        <Text strong style={{ fontSize: 12, color: '#faad14' }}>
                                                            {entry.pending} ({pendingPercent.toFixed(0)}%)
                                                        </Text>
                                                    </div>
                                                    <Progress
                                                        percent={Number(pendingPercent.toFixed(1))}
                                                        showInfo={false}
                                                        strokeColor="#faad14"
                                                        size={['100%', 8]}
                                                        trailColor={token.colorBgLayout}
                                                    />
                                                </div>

                                                {/* Rejected Status */}
                                                <div>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                                                        <Text style={{ fontSize: 12 }}>Rejected</Text>
                                                        <Text strong style={{ fontSize: 12, color: '#ff4d4f' }}>
                                                            {entry.rejected} ({rejectedPercent.toFixed(0)}%)
                                                        </Text>
                                                    </div>
                                                    <Progress
                                                        percent={Number(rejectedPercent.toFixed(1))}
                                                        showInfo={false}
                                                        strokeColor="#ff4d4f"
                                                        size={['100%', 8]}
                                                        trailColor={token.colorBgLayout}
                                                    />
                                                </div>
                                            </Space>
                                        </div>
                                    );
                                })}
                                    {cadreEntries.filter((entry) =>
                                        entry.cadre.toLowerCase().includes(cadreSearchText.toLowerCase())
                                    ).length === 0 && cadreSearchText && (
                                        <div style={{ padding: 24, textAlign: 'center' }}>
                                            <Text type="secondary">No cadres match "{cadreSearchText}"</Text>
                                        </div>
                                    )}
                                </div>
                            </>
                        )}
                    </Card>
                </Col>
                <Col xs={24} md={12}>
                    <Card
                        style={{
                            borderRadius: 'var(--radius-lg)',
                            boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
                            border: 'none',
                        }}
                        title="By Licensing Body"
                    >
                        {licensingBodyEntries.length === 0 ? (
                            <div style={{ padding: 24, textAlign: 'center' }}>
                                <Text type="secondary">No licensing body data available</Text>
                            </div>
                        ) : (
                            <>
                                <Input
                                    placeholder="Search licensing bodies..."
                                    prefix={<SearchOutlined />}
                                    value={licensingBodySearchText}
                                    onChange={(e) => setLicensingBodySearchText(e.target.value)}
                                    style={{ marginBottom: 16 }}
                                    size="small"
                                />
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                                    {licensingBodyEntries
                                        .filter((entry) =>
                                            entry.body.toLowerCase().includes(licensingBodySearchText.toLowerCase())
                                        )
                                        .map((entry) => {
                                    const affiliatedPercent = entry.total ? (entry.confirmed / entry.total) * 100 : 0;
                                    const pendingPercent = entry.total ? (entry.pending / entry.total) * 100 : 0;
                                    const rejectedPercent = entry.total ? (entry.rejected / entry.total) * 100 : 0;

                                    return (
                                        <div
                                            key={entry.body}
                                            style={{
                                                padding: 12,
                                                borderRadius: 8,
                                                background: token.colorBgContainer,
                                                border: `1px solid ${token.colorBorder}`,
                                            }}
                                        >
                                            {/* Header: Name & Total */}
                                            <div style={{ marginBottom: 12 }}>
                                                <Title level={5} style={{ margin: 0, color: token.colorTextHeading }}>
                                                    {entry.body}
                                                </Title>
                                                <Text type="secondary" style={{ fontSize: 12 }}>
                                                    {entry.total} total affiliations
                                                </Text>
                                            </div>

                                            {/* Status Rows - Vertical Stack */}
                                            <Space direction="vertical" style={{ width: '100%' }} size={8}>
                                                {/* Affiliated Status */}
                                                <div>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                                                        <Text style={{ fontSize: 12 }}>Affiliated</Text>
                                                        <Text strong style={{ fontSize: 12, color: '#52c41a' }}>
                                                            {entry.confirmed} ({affiliatedPercent.toFixed(0)}%)
                                                        </Text>
                                                    </div>
                                                    <Progress
                                                        percent={Number(affiliatedPercent.toFixed(1))}
                                                        showInfo={false}
                                                        strokeColor="#52c41a"
                                                        size={['100%', 8]}
                                                        trailColor={token.colorBgLayout}
                                                    />
                                                </div>

                                                {/* Pending Status */}
                                                <div>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                                                        <Text style={{ fontSize: 12 }}>Pending</Text>
                                                        <Text strong style={{ fontSize: 12, color: '#faad14' }}>
                                                            {entry.pending} ({pendingPercent.toFixed(0)}%)
                                                        </Text>
                                                    </div>
                                                    <Progress
                                                        percent={Number(pendingPercent.toFixed(1))}
                                                        showInfo={false}
                                                        strokeColor="#faad14"
                                                        size={['100%', 8]}
                                                        trailColor={token.colorBgLayout}
                                                    />
                                                </div>

                                                {/* Rejected Status */}
                                                <div>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                                                        <Text style={{ fontSize: 12 }}>Rejected</Text>
                                                        <Text strong style={{ fontSize: 12, color: '#ff4d4f' }}>
                                                            {entry.rejected} ({rejectedPercent.toFixed(0)}%)
                                                        </Text>
                                                    </div>
                                                    <Progress
                                                        percent={Number(rejectedPercent.toFixed(1))}
                                                        showInfo={false}
                                                        strokeColor="#ff4d4f"
                                                        size={['100%', 8]}
                                                        trailColor={token.colorBgLayout}
                                                    />
                                                </div>
                                            </Space>
                                        </div>
                                    );
                                })}
                                    {licensingBodyEntries.filter((entry) =>
                                        entry.body.toLowerCase().includes(licensingBodySearchText.toLowerCase())
                                    ).length === 0 && licensingBodySearchText && (
                                        <div style={{ padding: 24, textAlign: 'center' }}>
                                            <Text type="secondary">No licensing bodies match "{licensingBodySearchText}"</Text>
                                        </div>
                                    )}
                                </div>
                            </>
                        )}
                    </Card>
                </Col>
            </Row>

            {/* Section 4: License Compliance & Expiry */}
            <SectionHeader
                title="License Compliance & Expiry"
                icon={<SafetyCertificateOutlined />}
                action={
                    <Button
                        size={isMobile ? 'small' : 'middle'}
                        icon={<ArrowRightOutlined />}
                        onClick={() => navigateToRoute?.('licenses')}
                    >
                        Open Module
                    </Button>
                }
            />
            <Row gutter={[16, 16]}>
                <Col xs={24}>
                    <Card
                        style={{ borderRadius: '12px', border: 'none', boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }}
                        bodyStyle={{ padding: 0 }}
                    >
                        {loading && !licenseData ? (
                            <div style={{ padding: '40px', textAlign: 'center' }}>
                                <Spin size="large" />
                            </div>
                        ) : !licenseData?.expiring_details || licenseData.expiring_details.length === 0 ? (
                            <div style={{ padding: '40px', textAlign: 'center' }}>
                                <Text type="secondary">No license records found for the selected facilities</Text>
                            </div>
                        ) : (
                        <List
                            itemLayout="horizontal"
                            dataSource={(licenseData.expiring_details || []).slice(0, 5)}
                            renderItem={(item: any) => {
                                const expiry = new Date(item.expiry_date);
                                const now = new Date();
                                const daysDiff = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 3600 * 24));
                                const totalDuration = 365; // Assuming 1 year licenses for visual scale
                                const percentElapsed = 100 - Math.max(0, Math.min(100, (daysDiff / totalDuration) * 100)); // For progress bar (0% -> 100% means fresh -> expired)

                                let statusColor = '#52c41a';

                                if (daysDiff < 0) {
                                    statusColor = '#ff4d4f';
                                } else if (daysDiff < 30) {
                                    statusColor = '#ff4d4f';
                                } else if (daysDiff < 60) {
                                    statusColor = '#faad14';
                                }

                                return (
                                    <List.Item
                                        style={{
                                            padding: '16px',
                                            borderBottom: '1px solid #f0f0f0',
                                            transition: 'background 0.3s',
                                            cursor: 'default'
                                        }}
                                        actions={[
                                            <div style={{ textAlign: 'right', minWidth: '100px' }}>
                                                <div style={{ fontWeight: 600, color: token.colorTextHeading }}>
                                                    {formatCurrency(item.amount || 0)}
                                                </div>
                                                <Tag color={daysDiff < 0 ? 'error' : item.status === 'Active' ? 'success' : 'default'} style={{ margin: 0, marginTop: 4 }}>
                                                    {item.status}
                                                </Tag>
                                            </div>
                                        ]}
                                    >
                                        <List.Item.Meta
                                            avatar={
                                                <Avatar
                                                    shape="square"
                                                    size={48}
                                                    icon={<SafetyCertificateOutlined />}
                                                    style={{
                                                        backgroundColor: daysDiff < 0 ? '#fff1f0' : '#f6ffed',
                                                        color: daysDiff < 0 ? '#ff4d4f' : '#52c41a',
                                                        borderRadius: '8px'
                                                    }}
                                                />
                                            }
                                            title={
                                                <div style={{ display: 'flex', justifyContent: 'space-between', paddingRight: '16px' }}>
                                                    <Text strong style={{ fontSize: '15px' }}>{item.facility_name}</Text>
                                                </div>
                                            }
                                            description={
                                                <Space direction="vertical" size={2} style={{ width: '100%' }}>
                                                    <div style={{ display: 'flex', gap: '8px', fontSize: '12px' }}>
                                                        <Text type="secondary">{item.regulator}</Text>
                                                        <Text type="secondary">•</Text>
                                                        <Text type="secondary">{item.license_type}</Text>
                                                    </div>

                                                    <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                        <Tooltip title={`Expires on ${item.expiry_date}`}>
                                                            <div style={{ flex: 1, maxWidth: '200px' }}>
                                                                <Progress
                                                                    percent={percentElapsed}
                                                                    showInfo={false}
                                                                    size="small"
                                                                    strokeColor={statusColor}
                                                                    trailColor="#f5f5f5"
                                                                />
                                                            </div>
                                                        </Tooltip>
                                                        <Text style={{ color: statusColor, fontSize: '12px', fontWeight: 500 }}>
                                                            {daysDiff < 0 ? `${Math.abs(daysDiff)} days overdue` : `${daysDiff} days left`}
                                                        </Text>
                                                    </div>
                                                </Space>
                                            }
                                        />
                                    </List.Item>
                                );
                            }}
                        />
                        )}
                    </Card>
                </Col>
            </Row>

            {error && (
                <Row style={{ marginTop: 16 }}>
                    <Col span={24}>
                        <Card style={{ borderColor: '#ffccc7', background: '#fff1f0' }}>
                            <Text type="danger">{error}</Text>
                        </Card>
                    </Col>
                </Row>
            )}
            {realtimeError && (
                <Row style={{ marginTop: 12 }}>
                    <Col span={24}>
                        <Card style={{ borderColor: '#ffe58f', background: '#fffbe6' }}>
                            <Text type="warning">{realtimeError}</Text>
                        </Card>
                    </Col>
                </Row>
            )}
        </div>
    );
};

export default ExecutiveDashboard;

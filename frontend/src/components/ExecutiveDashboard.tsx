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
    Space,
    Spin,
    Badge,
    theme,
    Button,
    Progress,
    Input,
    Alert,
} from 'antd';
import {
    BankOutlined,
    CheckCircleOutlined,
    ReloadOutlined,
    LinkOutlined,
    SafetyCertificateOutlined,
    ArrowRightOutlined,
    SearchOutlined,
} from '@ant-design/icons';
import { dashboardApi, employeesApi, affiliationsApi } from '../services/api';
import { useResponsive } from '../hooks/useResponsive';
import useFacilityStore from '../stores/facilityStore';
import useDashboardRealtime from '../hooks/useDashboardRealtime';
import FacilitiesEmptyOnboardingCTA from './modules/facilities/FacilitiesEmptyOnboardingCTA';
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
        accessMode,
        availableFacilities,
        loading: facilityLoading,
        refreshFacilities,
    } = useFacilityStore();
    const canUseCompanyContext = accessMode === 'company';
    const hasLinkedFacilities = availableFacilities.length > 0;

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

    // Stable callback so realtime hook doesn't re-run unnecessarily; report error once, clear after 5s
    const handleRealtimeError = useCallback((error: string | unknown) => {
        const message = typeof error === 'string' ? error : (error as Error)?.message ?? 'Connection error';
        console.error('[Dashboard] Realtime error:', message);
        setRealtimeError(message);
        setTimeout(() => setRealtimeError(null), 5000);
    }, []);

    // Subscribe to realtime updates (websocket failure is non-fatal; dashboard still shows static data)
    const { isConnected: realtimeConnected } = useDashboardRealtime({
        onBudgetUpdate: handleBudgetUpdate,
        onCompanyUpdate: handleCompanyUpdate,
        onError: handleRealtimeError,
        enabled: canUseCompanyContext && !facilityLoading,
    });

    // Fetch data when company is loaded - ONLY after facility context is ready
    useEffect(() => {
        // CRITICAL: Only fetch if facility context is ready
        if (canUseCompanyContext && !facilityLoading && company && hasLinkedFacilities) {
            fetchDashboardData();
        }
    }, [canUseCompanyContext, facilityLoading, company, hasLinkedFacilities]);

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

            // Canonical affiliation counts: align with affiliations module aggregates
            const affiliationsOverviewResponse = await affiliationsApi.getAffiliationsList({
                page: 1,
                pageSize: 1,
            });

            // Fetch affiliation statistics for distribution breakdowns
            const affiliationStatsResponse = await dashboardApi.getAffiliationStatistics();

            const statusAggregates = affiliationsOverviewResponse.success
                ? (affiliationsOverviewResponse.data?.status_aggregates || {})
                : {};

            const byStatus = affiliationStatsResponse.success
                ? (affiliationStatsResponse.data?.status_aggregates || affiliationStatsResponse.data?.by_status || {})
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
                statusAggregates.total
                    ?? (affiliationStatsResponse.success
                        ? (affiliationStatsResponse.data?.total ?? Object.values(byStatus).reduce((sum: number, count: any) => sum + Number(count || 0), 0))
                        : 0)
            );

            const confirmedAffiliations = Number(
                statusAggregates.confirmed
                    ?? (Number(byStatus.Active || 0) + Number(byStatus.Confirmed || 0))
            );
            const pendingAffiliations = Number(
                statusAggregates.pending
                    ?? Number(byStatus.Pending || 0)
            );
            const rejectedAffiliations = Number(
                statusAggregates.rejected
                    ?? Number(byStatus.Rejected || 0)
            );
            const terminatedAffiliations = Number(
                statusAggregates.terminated
                    ?? statusAggregates.inactive
                    ?? (Number(byStatus.Terminated || 0) + Number(byStatus.Inactive || 0))
            );

            const confirmationRate = Number(
                statusAggregates.confirmation_rate
                    ?? (totalAffiliations > 0 ? (confirmedAffiliations / totalAffiliations) * 100 : 0)
            );
            const rejectionRate = Number(
                statusAggregates.rejection_rate
                    ?? (totalAffiliations > 0 ? (rejectedAffiliations / totalAffiliations) * 100 : 0)
            );

            const normalizedConfirmationRate = Number.isFinite(confirmationRate) ? confirmationRate : 0;
            const normalizedRejectionRate = Number.isFinite(rejectionRate) ? rejectionRate : 0;

            setAffiliationData({
                total: totalAffiliations,
                confirmed: confirmedAffiliations,
                pending: pendingAffiliations,
                rejected: rejectedAffiliations,
                terminated: terminatedAffiliations,
                confirmation_rate: normalizedConfirmationRate,
                rejection_rate: normalizedRejectionRate,
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
                    terminated_affiliations: terminatedAffiliations,
                    confirmation_rate: normalizedConfirmationRate,
                    total_assets: overviewResponse.data.total_assets || 0,
                    total_facilities: overviewResponse.data.total_facilities || 0,
                    asset_records_total: overviewResponse.data.asset_records_total || 0,
                    total_asset_value: overviewResponse.data.total_asset_value || 0,
                });
            } else {
                setCompanyData((prev: any) => ({
                    ...(prev || {}),
                    health_professionals_total: healthProfessionalsTotal,
                    confirmed_affiliations: confirmedAffiliations,
                    pending_affiliations: pendingAffiliations,
                    total_affiliations: totalAffiliations,
                    rejected_affiliations: rejectedAffiliations,
                    terminated_affiliations: terminatedAffiliations,
                    confirmation_rate: normalizedConfirmationRate,
                    asset_records_total: 0,
                    total_asset_value: 0,
                }));
            }

            // Fetch practitioner license overview using the same RBAC scope as Health Professionals.
            const licenseResponse = await dashboardApi.getHealthProfessionalLicenseOverview();
            if (licenseResponse.success && licenseResponse.data) {
                setLicenseData(licenseResponse.data);
            } else {
                console.warn('[Dashboard] Practitioner license data not available:', licenseResponse.error || 'No data returned');
                // Set empty data structure to prevent UI errors
                setLicenseData({
                    total_health_professional_employees: 0,
                    total_considered: 0,
                    licensed_not_expired: 0,
                    licensed_expired: 0,
                    licenses_expiring_soon: 0,
                    excluded_missing_license_data: 0,
                    compliance_rate: 0,
                });
            }

        } catch (err: any) {
            console.error('Error fetching dashboard data:', err);
            const errorMessage = err.error || err.message || 'Failed to load dashboard data';
            setError(errorMessage);

            // Fallback to partially empty data if error occurs
            setCompanyData((prev: any) => prev || {
                health_professionals_total: 0,
                pending_affiliations: 0,
                total_affiliations: 0,
                terminated_affiliations: 0,
                total_facilities: 0,
                asset_records_total: 0,
                total_asset_value: 0,
            });
            setAffiliationData((prev: any) => prev || { total: 0, confirmed: 0, pending: 0, rejected: 0, terminated: 0, confirmation_rate: 0, rejection_rate: 0, by_employment_type: {}, by_professional_cadre: {}, by_licensing_body: {} });
            setLicenseData((prev: any) => prev || {
                total_health_professional_employees: 0,
                total_considered: 0,
                licensed_not_expired: 0,
                licensed_expired: 0,
                licenses_expiring_soon: 0,
                excluded_missing_license_data: 0,
                compliance_rate: 0,
            });
        } finally {
            setLoading(false);
        }
    };

    const handleRefresh = async () => {
        setLastRefresh(new Date());
        if (!hasLinkedFacilities) {
            await refreshFacilities();
            return;
        }
        fetchDashboardData();
    };

    const formatCurrencyCompact = (value: number | null | undefined) => {
        const amount = Number(value || 0);
        if (!amount) return 'KES 0';
        return new Intl.NumberFormat('en-KE', {
            style: 'currency',
            currency: 'KES',
            notation: amount >= 1000000 ? 'compact' : 'standard',
            maximumFractionDigits: amount >= 1000000 ? 1 : 0,
        }).format(amount);
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
                    <Text type="secondary" style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.3px' }}>
                        {title}
                    </Text>
                    <div style={{ fontSize: isMobile ? '24px' : isTablet ? '26px' : '28px', fontWeight: 700, color, marginTop: '6px', lineHeight: 1.1 }}>
                        {loading && !value ? <Spin size="small" /> : value}
                    </div>
                    {subtitle && (
                        <div style={{ marginTop: '6px', display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                            <Text type="secondary" style={{ fontSize: '10px' }}>{subtitle}</Text>
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
                        fontSize: '18px',
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
                        borderRadius: '10px',
                        background: 'rgba(24, 144, 255, 0.15)',
                        backdropFilter: 'blur(10px)',
                        border: '1px solid rgba(24, 144, 255, 0.2)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#1890ff',
                        fontSize: '15px',
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
            terminated: (Number(status.Terminated || 0) + Number(status.Inactive || 0)),
        }))
        .sort((a, b) => b.total - a.total);

    const licensingBodyEntries = Object.entries(affiliationData?.by_licensing_body || {})
        .map(([body, status]: any) => ({
            body,
            total: Number(status.total || 0),
            confirmed: (Number(status.Active || 0) + Number(status.Confirmed || 0)),
            pending: Number(status.Pending || 0),
            rejected: Number(status.Rejected || 0),
            terminated: (Number(status.Terminated || 0) + Number(status.Inactive || 0)),
        }))
        .sort((a, b) => b.total - a.total);

    const buildAffiliationStatusTileStyle = (accentColor: string) => ({
        background: `color-mix(in srgb, ${token.colorBgElevated} 84%, ${accentColor} 16%)`,
        border: `1px solid color-mix(in srgb, ${token.colorBorderSecondary} 68%, ${accentColor} 32%)`,
        borderRadius: 12,
        padding: 14,
        minHeight: 88,
        display: 'flex',
        flexDirection: 'column' as const,
        justifyContent: 'space-between',
    });

    const affiliationStatusTiles = [
        { key: 'total', label: 'TOTAL', value: affiliationData?.total || 0, accent: '#1890ff', span: 12 },
        { key: 'confirmed', label: 'CONFIRMED', value: affiliationData?.confirmed || 0, accent: '#52c41a', span: 12 },
        { key: 'pending', label: 'PENDING', value: affiliationData?.pending || 0, accent: '#faad14', span: 12 },
        { key: 'rejected', label: 'REJECTED', value: affiliationData?.rejected || 0, accent: '#ff4d4f', span: 12 },
        { key: 'terminated', label: 'TERMINATED', value: affiliationData?.terminated || 0, accent: token.colorTextTertiary, span: 24 },
    ];

    if (canUseCompanyContext && !facilityLoading && company && !hasLinkedFacilities) {
        return (
            <div
                style={{
                    padding: isMobile ? '12px' : '20px',
                    background: token.colorBgLayout,
                    minHeight: 'calc(100vh - 64px)',
                }}
            >
                <div style={{ marginBottom: 18 }}>
                    <Title level={isMobile ? 3 : 2} style={{ margin: 0, color: token.colorTextHeading, fontWeight: 600, fontSize: isMobile ? '22px' : '26px' }}>
                        Executive Dashboard
                    </Title>
                    <Text type="secondary" style={{ fontSize: isMobile ? '12px' : '13px' }}>
                        {company?.company_name || company?.abbr} does not have any linked health facilities yet.
                    </Text>
                </div>

                <Card
                    style={{
                        borderRadius: '16px',
                        boxShadow: '0 8px 28px rgba(15, 23, 42, 0.06)',
                        border: 'none',
                    }}
                    bodyStyle={{ padding: 0 }}
                >
                    <FacilitiesEmptyOnboardingCTA
                        organizationName={company?.company_name || company?.abbr}
                        onOnboard={() => navigateToRoute?.('facilities/new')}
                        onRefresh={handleRefresh}
                        onboardingEnabled={Boolean(navigateToRoute)}
                        isMobile={isMobile}
                    />
                </Card>
            </div>
        );
    }

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
                        <Text type="secondary" style={{ fontSize: '11px' }}>
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

            {/* Section 1: Executive Summary */}
            <SectionHeader title="Executive Summary" icon={<BankOutlined />} />
            <Row gutter={[16, 16]}>
                <Col xs={24} sm={12} lg={8} xl={4}>
                    <KPICard
                        title="Health Professionals"
                        value={companyData?.health_professionals_total?.toLocaleString() || '0'}
                        icon={<CheckCircleOutlined />}
                        color="#52c41a"
                        subtitle="Accessible active records"
                        onClick={() => navigateToRoute?.('health-professionals')}
                    />
                </Col>
                <Col xs={24} sm={12} lg={8} xl={4}>
                    <KPICard
                        title="Licensed"
                        value={licenseData?.licensed_not_expired?.toLocaleString?.() || licenseData?.licensed_not_expired || '0'}
                        icon={<SafetyCertificateOutlined />}
                        color="#1677ff"
                        subtitle={`${licenseData?.total_considered || 0} with usable license data`}
                        onClick={() => navigateToRoute?.('health-professionals')}
                    />
                </Col>
                <Col xs={24} sm={12} lg={8} xl={4}>
                    <KPICard
                        title="Expired"
                        value={licenseData?.licensed_expired?.toLocaleString?.() || licenseData?.licensed_expired || '0'}
                        icon={<SafetyCertificateOutlined />}
                        color="#ff4d4f"
                        subtitle="Needs renewal attention"
                        onClick={() => navigateToRoute?.('health-professionals')}
                    />
                </Col>
                <Col xs={24} sm={12} lg={8} xl={4}>
                    <KPICard
                        title="Expiring Soon"
                        value={licenseData?.licenses_expiring_soon?.toLocaleString?.() || licenseData?.licenses_expiring_soon || '0'}
                        icon={<SafetyCertificateOutlined />}
                        color="#faad14"
                        subtitle="Within 60 days"
                        onClick={() => navigateToRoute?.('health-professionals')}
                    />
                </Col>
                <Col xs={24} sm={12} lg={8} xl={4}>
                    <KPICard
                        title="Health Facilities"
                        value={companyData?.total_facilities?.toLocaleString?.() || companyData?.total_facilities || '0'}
                        icon={<BankOutlined />}
                        color="#722ed1"
                        subtitle="Health Facility scope"
                        onClick={() => navigateToRoute?.('facilities')}
                    />
                </Col>
                <Col xs={24} sm={12} lg={8} xl={4}>
                    <KPICard
                        title="Asset Portfolio Value"
                        value={formatCurrencyCompact(companyData?.total_asset_value)}
                        icon={<BankOutlined />}
                        color="#13a8a8"
                        subtitle={`${companyData?.asset_records_total || 0} tracked assets${companyData?.total_assets ? ` • ${companyData.total_assets} devices` : ''}`}
                        onClick={() => navigateToRoute?.('assets')}
                    />
                </Col>
            </Row>

            {/* Section 2: License Coverage & Risk */}
            <SectionHeader
                title="License Coverage & Risk"
                icon={<SafetyCertificateOutlined />}
                action={
                    <Button
                        size={isMobile ? 'small' : 'middle'}
                        icon={<ArrowRightOutlined />}
                        onClick={() => navigateToRoute?.('health-professionals')}
                    >
                        Open Module
                    </Button>
                }
            />
            <Row gutter={[16, 16]}>
                <Col xs={24} md={9}>
                    <Card
                        style={{
                            borderRadius: '12px',
                            boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
                            border: 'none',
                            height: '100%',
                        }}
                    >
                        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
                            <div>
                                <Text type="secondary" style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.28px' }}>
                                    Compliance Rate
                                </Text>
                                <Title level={2} style={{ margin: '6px 0 4px', color: '#1677ff' }}>
                                    {(licenseData?.compliance_rate || 0).toFixed(1)}%
                                </Title>
                                <Text type="secondary" style={{ fontSize: 12 }}>
                                    Share of considered health professional employees with a non-expired license.
                                </Text>
                            </div>
                            <div
                                style={{
                                    minWidth: 72,
                                    height: 72,
                                    borderRadius: 18,
                                    background: 'rgba(22, 119, 255, 0.10)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: '#1677ff',
                                    fontSize: 24,
                                }}
                            >
                                <SafetyCertificateOutlined />
                            </div>
                        </div>

                        <Progress
                            percent={Number((licenseData?.compliance_rate || 0).toFixed(1))}
                            showInfo={false}
                            strokeColor="#1677ff"
                            trailColor={token.colorFillSecondary}
                            style={{ marginTop: 18, marginBottom: 20 }}
                        />

                        <Row gutter={[12, 12]}>
                            <Col span={12}>
                                <div style={buildAffiliationStatusTileStyle('#1677ff')}>
                                    <Text style={{ fontSize: 12, color: token.colorTextSecondary }}>CONSIDERED</Text>
                                    <Title level={4} style={{ margin: 0, color: '#1677ff' }}>
                                        {licenseData?.total_considered || 0}
                                    </Title>
                                </div>
                            </Col>
                            <Col span={12}>
                                <div style={buildAffiliationStatusTileStyle('#faad14')}>
                                    <Text style={{ fontSize: 12, color: token.colorTextSecondary }}>EXCLUDED</Text>
                                    <Title level={4} style={{ margin: 0, color: '#faad14' }}>
                                        {licenseData?.excluded_missing_license_data || 0}
                                    </Title>
                                </div>
                            </Col>
                        </Row>

                        {(licenseData?.excluded_missing_license_data || 0) > 0 && (
                            <Alert
                                type="warning"
                                showIcon
                                style={{ marginTop: 16, borderRadius: 10 }}
                                message={`${licenseData?.excluded_missing_license_data || 0} linked employees are excluded because the Health Professional record has no license expiry date.`}
                            />
                        )}
                    </Card>
                </Col>
                <Col xs={24} md={15}>
                    <Card
                        style={{ borderRadius: '12px', border: 'none', boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }}
                        title="License Risk Snapshot"
                        extra={
                            <Text type="secondary" style={{ fontSize: 12 }}>
                                Aggregate only
                            </Text>
                        }
                    >
                        <Space direction="vertical" size={16} style={{ width: '100%' }}>
                            <Text type="secondary" style={{ fontSize: 12 }}>
                                This dashboard keeps practitioner licensing at summary level. Employee-level follow-up stays in the Health Professionals module.
                            </Text>
                            <Row gutter={[12, 12]}>
                                <Col xs={24} sm={8}>
                                    <div style={buildAffiliationStatusTileStyle('#52c41a')}>
                                        <Text style={{ fontSize: 12, color: token.colorTextSecondary }}>CURRENT</Text>
                                        <Title level={4} style={{ margin: 0, color: '#52c41a' }}>
                                            {licenseData?.licensed_not_expired || 0}
                                        </Title>
                                        <Text type="secondary" style={{ fontSize: 12 }}>
                                            Non-expired licenses
                                        </Text>
                                    </div>
                                </Col>
                                <Col xs={24} sm={8}>
                                    <div style={buildAffiliationStatusTileStyle('#ff4d4f')}>
                                        <Text style={{ fontSize: 12, color: token.colorTextSecondary }}>EXPIRED</Text>
                                        <Title level={4} style={{ margin: 0, color: '#ff4d4f' }}>
                                            {licenseData?.licensed_expired || 0}
                                        </Title>
                                        <Text type="secondary" style={{ fontSize: 12 }}>
                                            Require renewal action
                                        </Text>
                                    </div>
                                </Col>
                                <Col xs={24} sm={8}>
                                    <div style={buildAffiliationStatusTileStyle('#faad14')}>
                                        <Text style={{ fontSize: 12, color: token.colorTextSecondary }}>DUE IN 60 DAYS</Text>
                                        <Title level={4} style={{ margin: 0, color: '#faad14' }}>
                                            {licenseData?.licenses_expiring_soon || 0}
                                        </Title>
                                        <Text type="secondary" style={{ fontSize: 12 }}>
                                            Approaching expiry
                                        </Text>
                                    </div>
                                </Col>
                            </Row>

                            <Alert
                                type="info"
                                showIcon
                                style={{ borderRadius: 10 }}
                                message="Open Health Professionals to review individual practitioners and renewal follow-up."
                            />
                        </Space>
                    </Card>
                </Col>
            </Row>

            {/* Section 3: Affiliation Insights */}
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
                            {affiliationStatusTiles.map((tile) => (
                                <Col key={tile.key} span={tile.span}>
                                    <div style={buildAffiliationStatusTileStyle(tile.accent)}>
                                        <Text
                                            style={{
                                                fontSize: 12,
                                                color: token.colorTextSecondary,
                                                letterSpacing: '0.28px',
                                            }}
                                        >
                                            {tile.label}
                                        </Text>
                                        <Title level={4} style={{ margin: 0, color: tile.accent }}>
                                            {tile.value}
                                        </Title>
                                    </div>
                                </Col>
                            ))}
                        </Row>
                        <div style={{ marginBottom: 10 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                                <Text type="secondary">Confirmation Rate</Text>
                                <Text strong>{(affiliationData?.confirmation_rate || 0).toFixed(1)}%</Text>
                            </div>
                            <Progress
                                percent={Number((affiliationData?.confirmation_rate || 0).toFixed(1))}
                                showInfo={false}
                                strokeColor="#52c41a"
                                trailColor={token.colorFillSecondary}
                            />
                        </div>
                        <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                                <Text type="secondary">Rejection Rate</Text>
                                <Text strong>{(affiliationData?.rejection_rate || 0).toFixed(1)}%</Text>
                            </div>
                            <Progress
                                percent={Number((affiliationData?.rejection_rate || 0).toFixed(1))}
                                showInfo={false}
                                strokeColor="#ff4d4f"
                                trailColor={token.colorFillSecondary}
                            />
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

            {/* Section 4: Affiliation Distribution */}
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
                                    const terminatedPercent = entry.total ? (entry.terminated / entry.total) * 100 : 0;

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
                                                <div>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                                                        <Text style={{ fontSize: 12 }}>Terminated</Text>
                                                        <Text strong style={{ fontSize: 12, color: '#8c8c8c' }}>
                                                            {entry.terminated} ({terminatedPercent.toFixed(0)}%)
                                                        </Text>
                                                    </div>
                                                    <Progress
                                                        percent={Number(terminatedPercent.toFixed(1))}
                                                        showInfo={false}
                                                        strokeColor="#8c8c8c"
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
                                    const terminatedPercent = entry.total ? (entry.terminated / entry.total) * 100 : 0;

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
                                                <div>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                                                        <Text style={{ fontSize: 12 }}>Terminated</Text>
                                                        <Text strong style={{ fontSize: 12, color: '#8c8c8c' }}>
                                                            {entry.terminated} ({terminatedPercent.toFixed(0)}%)
                                                        </Text>
                                                    </div>
                                                    <Progress
                                                        percent={Number(terminatedPercent.toFixed(1))}
                                                        showInfo={false}
                                                        strokeColor="#8c8c8c"
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
                        <Alert
                            type="warning"
                            message="Live updates unavailable"
                            description="Dashboard data is still correct; real-time updates could not connect. You can continue using the page and refresh to get the latest data."
                            showIcon
                            closable
                            onClose={() => setRealtimeError(null)}
                            style={{ borderRadius: 8 }}
                        />
                    </Col>
                </Row>
            )}
        </div>
    );
};

export default ExecutiveDashboard;

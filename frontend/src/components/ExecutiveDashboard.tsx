/**
 * Executive Dashboard Component
 * Main dashboard view for county executives and senior administrators
 * Displays KPIs for Company overview, Approvals, Financial Overview, and HR/Attendance
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
} from 'antd';
import {
    TeamOutlined,
    BankOutlined,
    CheckCircleOutlined,
    DollarOutlined,
    ShoppingCartOutlined,
    CreditCardOutlined,
    InboxOutlined,
    RiseOutlined,
    FallOutlined,
    CalendarOutlined,
    UserAddOutlined,
    ReloadOutlined,
    LaptopOutlined,
    FieldTimeOutlined,
    SafetyCertificateOutlined,
} from '@ant-design/icons';
import { dashboardApi, hrApi } from '../services/api';
import { useResponsive } from '../hooks/useResponsive';
import useFacilityStore from '../stores/facilityStore';
import useDashboardRealtime from '../hooks/useDashboardRealtime';
import FacilityContextSwitcher from './FacilityContextSwitcher';
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

    // Facility context for filtering
    const {
        company,
        selectedFacilities,
        selectedFacilityIds,
        isAllFacilities,
        hasCompanyPermission,
        loading: facilityLoading,
    } = useFacilityStore();

    // State for real data
    const [companyData, setCompanyData] = useState<any>(null);
    const [approvalData, setApprovalData] = useState<any>(null);
    const [licenseData, setLicenseData] = useState<any>(null);
    const [attendanceData, setAttendanceData] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);
    const [realtimeError, setRealtimeError] = useState<string | null>(null);

    // Realtime updates - merge with existing state
    const handleApprovalUpdate = useCallback((update: any) => {
        setApprovalData((prev: any) => ({
            ...prev,
            purchase_orders: {
                ...prev?.purchase_orders,
                ...update.purchase_orders,
            },
            expense_claims: {
                ...prev?.expense_claims,
                ...update.expense_claims,
            },
            material_requests: {
                ...prev?.material_requests,
                ...update.material_requests,
            },
            leave_applications: {
                ...prev?.leave_applications,
                ...update.leave_applications,
            },
        }));
        console.log('[Dashboard] Applied approval metrics update from realtime');
    }, []);

    const handleBudgetUpdate = useCallback((update: any) => {
        // Budget metrics removed as per plan, but we might still receive updates
        console.log('[Dashboard] Received budget metrics update, but budget section is removed', update);
    }, []);

    const handleAttendanceUpdate = useCallback((update: any) => {
        setAttendanceData((prev: any) => ({
            ...prev,
            ...update,
        }));
        console.log('[Dashboard] Applied attendance metrics update from realtime');
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
        onApprovalUpdate: handleApprovalUpdate,
        onBudgetUpdate: handleBudgetUpdate,
        onAttendanceUpdate: handleAttendanceUpdate,
        onCompanyUpdate: handleCompanyUpdate,
        onError: (error) => {
            console.error('[Dashboard] Realtime error:', error);
            setRealtimeError(error);
            // Clear error after 5 seconds
            setTimeout(() => setRealtimeError(null), 5000);
        },
        enabled: hasCompanyPermission && !facilityLoading, // Only enable after facility context is ready
    });

    // Fetch data when facility selection changes - ONLY after facility context is ready
    useEffect(() => {
        // CRITICAL: Only fetch if facility context is ready
        if (hasCompanyPermission && !facilityLoading && company) {
            fetchDashboardData();
        }
    }, [hasCompanyPermission, facilityLoading, company, selectedFacilities]);

    const fetchDashboardData = async () => {
        setLoading(true);
        setError(null);
        const facilityIds = selectedFacilityIds;

        try {
            // Fetch company overview
            const overviewResponse = await dashboardApi.getCompanyOverview(facilityIds);

            if (overviewResponse.success && overviewResponse.data) {
                setCompanyData({
                    total_employees: overviewResponse.data.total_employees || 0,
                    pending_affiliations: overviewResponse.data.pending_affiliations || 0,
                    total_assets: overviewResponse.data.total_assets || 0,
                    total_facilities: overviewResponse.data.total_facilities || 0,
                    active_affiliations: overviewResponse.data.active_affiliations || 0,
                    trend: {
                        employees: 0,
                        affiliations: 0,
                        assets: 0
                    }
                });
            }

            // Fetch financial overview (includes approvals)
            const financialResponse = await dashboardApi.getFinancialOverview(facilityIds);

            if (financialResponse.success && financialResponse.data) {
                setApprovalData({
                    purchase_orders: {
                        pending: financialResponse.data.purchase_orders?.pending || 0,
                        total_value: financialResponse.data.purchase_orders?.total_value || 0
                    },
                    expense_claims: {
                        pending: financialResponse.data.expense_claims?.pending || 0,
                        total_value: financialResponse.data.expense_claims?.total_value || 0
                    },
                    material_requests: {
                        pending: financialResponse.data.material_requests?.pending || 0,
                        total_value: 0
                    },
                    leave_applications: {
                        pending: 0
                    }
                });
            }

            // Fetch license compliance
            const licenseResponse = await dashboardApi.getLicenseComplianceOverview(facilityIds);
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

            // Fetch attendance summary
            const attendanceResponse = await hrApi.getAttendanceSummary(facilityIds);
            if (attendanceResponse.success && attendanceResponse.data) {
                setAttendanceData(attendanceResponse.data);
            }
        } catch (err: any) {
            console.error('Error fetching dashboard data:', err);
            const errorMessage = err.error || err.message || 'Failed to load dashboard data';
            setError(errorMessage);

            // Fallback to partially empty data if error occurs
            setCompanyData((prev: any) => prev || { total_employees: 0, pending_affiliations: 0, total_assets: 0, total_facilities: 0 });
            setApprovalData((prev: any) => prev || { purchase_orders: { pending: 0, total_value: 0 }, expense_claims: { pending: 0, total_value: 0 }, material_requests: { pending: 0, total_value: 0 }, leave_applications: { pending: 0 } });
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

    // Get trend icon
    const getTrendIcon = (trend: number) => {
        if (trend > 0) {
            return <RiseOutlined style={{ color: token.colorSuccess, fontSize: '12px' }} />;
        }
        if (trend < 0) {
            return <FallOutlined style={{ color: token.colorError, fontSize: '12px' }} />;
        }
        return null;
    };

    // KPI Card Component
    const KPICard: React.FC<{
        title: string;
        value: number | string;
        icon: React.ReactNode;
        color: string;
        subtitle?: string;
        trend?: number;
        onClick?: () => void;
    }> = ({ title, value, icon, color, subtitle, trend, onClick }) => (
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
            bodyStyle={{ padding: isMobile ? '16px' : isTablet ? '18px' : '20px' }}
        >
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                <div style={{ flex: 1 }}>
                    <Text type="secondary" style={{ fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        {title}
                    </Text>
                    <div style={{ fontSize: isMobile ? '28px' : isTablet ? '30px' : '32px', fontWeight: 700, color, marginTop: '8px', lineHeight: 1.1 }}>
                        {loading && !value ? <Spin size="small" /> : value}
                    </div>
                    {(subtitle || trend !== undefined) && (
                        <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                            {subtitle && <Text type="secondary" style={{ fontSize: '12px' }}>{subtitle}</Text>}
                            {trend !== undefined && (
                                <Tag
                                    color={trend > 0 ? 'success' : trend < 0 ? 'error' : 'default'}
                                    style={{ fontSize: '11px', padding: '0 6px', margin: 0 }}
                                >
                                    {getTrendIcon(trend)} {Math.abs(trend)}%
                                </Tag>
                            )}
                        </div>
                    )}
                </div>
                <div
                    style={{
                        width: '56px',
                        height: '56px',
                        borderRadius: '12px',
                        background: `${color}15`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '24px',
                        color,
                    }}
                >
                    {icon}
                </div>
            </div>
        </Card>
    );

    // Section Header Component
    const SectionHeader: React.FC<{ title: string; icon: React.ReactNode }> = ({ title, icon }) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px', marginTop: '32px' }}>
            <div
                style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '10px',
                    background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#fff',
                    fontSize: '18px',
                }}
            >
                {icon}
            </div>
            <Title level={4} style={{ margin: 0, color: token.colorTextHeading }}>
                {title}
            </Title>
        </div>
    );

    return (
        <div
            style={{
                padding: isMobile ? '16px' : '24px',
                background: token.colorBgLayout,
                minHeight: 'calc(100vh - 64px)',
            }}
        >
            {/* Facility Context Switcher */}
            <div style={{ marginBottom: '20px' }}>
                <FacilityContextSwitcher
                    variant="default"
                    showLabel={true}
                />
            </div>

            {/* Header */}
            <div style={{
                marginBottom: '24px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: isMobile ? 'flex-start' : 'center',
                flexDirection: isMobile ? 'column' : 'row',
                gap: '16px'
            }}>
                <div style={{ width: isMobile ? '100%' : 'auto' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        <Title level={isMobile ? 3 : 2} style={{ margin: 0, color: token.colorTextHeading }}>
                            Executive Dashboard
                        </Title>
                        {realtimeConnected ? (
                            <Badge status="processing" text={isMobile ? "" : "Real-time"} style={{ marginLeft: '4px' }} />
                        ) : (
                            <Badge status="default" text={isMobile ? "" : "Manual"} style={{ marginLeft: '4px' }} />
                        )}
                    </div>
                    <Text type="secondary" style={{ fontSize: isMobile ? '12px' : '14px' }}>
                        Viewing {isAllFacilities() ? 'all facilities' : `${selectedFacilities.length}`} in {company?.abbr || company?.company_name}
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
            <SectionHeader title="County Overview" icon={<BankOutlined />} />
            <Row gutter={[16, 16]}>
                <Col xs={24} sm={12} lg={6}>
                    <KPICard
                        title="Total Employees"
                        value={companyData?.total_employees?.toLocaleString() || '0'}
                        icon={<TeamOutlined />}
                        color="#1890ff"
                        subtitle="Active workforce"
                        trend={companyData?.trend?.employees}
                        onClick={() => navigateToRoute?.('employees')}
                    />
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <KPICard
                        title="Pending Affiliations"
                        value={companyData?.pending_affiliations || '0'}
                        icon={<UserAddOutlined />}
                        color="#faad14"
                        subtitle="Awaiting approval"
                        trend={companyData?.trend?.affiliations}
                        onClick={() => navigateToRoute?.('affiliations')}
                    />
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <KPICard
                        title="Assets"
                        value={companyData?.total_assets || '0'}
                        icon={<LaptopOutlined />}
                        color="#52c41a"
                        subtitle="Inventory items"
                        trend={companyData?.trend?.assets}
                        onClick={() => navigateToRoute?.('assets')}
                    />
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <KPICard
                        title="Facilities"
                        value={companyData?.total_facilities || '0'}
                        icon={<BankOutlined />}
                        color="#722ed1"
                        subtitle="Health & Admin"
                        onClick={() => navigateToRoute?.('facilities')}
                    />
                </Col>
            </Row>

            {/* Section 2: License Compliance & Expiry */}
            <SectionHeader title="License Compliance & Expiry" icon={<SafetyCertificateOutlined />} />
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
                            pagination={{ pageSize: 5 }}
                            dataSource={licenseData.expiring_details}
                            renderItem={(item: any) => {
                                const expiry = new Date(item.expiry_date);
                                const now = new Date();
                                const daysDiff = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 3600 * 24));
                                const totalDuration = 365; // Assuming 1 year licenses for visual scale
                                const percentRemaining = Math.max(0, Math.min(100, (daysDiff / totalDuration) * 100));
                                const percentElapsed = 100 - percentRemaining; // For progress bar (0% -> 100% means fresh -> expired)

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

            {/* Section 3: Central Approval Platform */}
            <SectionHeader title="Central Approval Platform" icon={<CheckCircleOutlined />} />
            <Row gutter={[16, 16]}>
                <Col xs={24} sm={24} md={16} lg={18}>
                    <Card
                        style={{
                            borderRadius: '12px',
                            boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
                            border: 'none',
                        }}
                        title={
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span>Pending Approvals</span>
                                <Badge
                                    count={(approvalData?.purchase_orders?.pending || 0) + (approvalData?.expense_claims?.pending || 0) + (approvalData?.material_requests?.pending || 0)}
                                    style={{ backgroundColor: token.colorError }}
                                />
                            </div>
                        }
                    >
                        <Row gutter={[24, 24]}>
                            {/* Purchase Orders */}
                            <Col xs={24} md={8}>
                                <Card
                                    size="small"
                                    hoverable
                                    onClick={() => navigateToRoute?.('purchase-orders')}
                                    style={{
                                        background: 'linear-gradient(135deg, #667eea15 0%, #764ba215 100%)',
                                        borderRadius: '10px',
                                        border: '1px solid #667eea30',
                                        cursor: 'pointer',
                                    }}
                                >
                                    <div style={{ textAlign: 'center' }}>
                                        <ShoppingCartOutlined style={{ fontSize: '28px', color: '#667eea', marginBottom: '8px' }} />
                                        <Title level={2} style={{ margin: 0, color: '#667eea' }}>
                                            {loading ? <Spin size="small" /> : approvalData?.purchase_orders?.pending || 0}
                                        </Title>
                                        <Text strong>Purchase Orders</Text>
                                        <div style={{ marginTop: '8px' }}>
                                            <Text type="secondary" style={{ fontSize: '12px' }}>
                                                Total: {formatCurrency(approvalData?.purchase_orders?.total_value || 0)}
                                            </Text>
                                        </div>
                                    </div>
                                </Card>
                            </Col>

                            {/* Expense Claims */}
                            <Col xs={24} md={8}>
                                <Card
                                    size="small"
                                    hoverable
                                    onClick={() => navigateToRoute?.('expense-claims')}
                                    style={{
                                        background: 'linear-gradient(135deg, #f093fb15 0%, #f5576c15 100%)',
                                        borderRadius: '10px',
                                        border: '1px solid #f5576c30',
                                        cursor: 'pointer',
                                    }}
                                >
                                    <div style={{ textAlign: 'center' }}>
                                        <CreditCardOutlined style={{ fontSize: '28px', color: '#f5576c', marginBottom: '8px' }} />
                                        <Title level={2} style={{ margin: 0, color: '#f5576c' }}>
                                            {loading ? <Spin size="small" /> : approvalData?.expense_claims?.pending || 0}
                                        </Title>
                                        <Text strong>Expense Claims</Text>
                                        <div style={{ marginTop: '8px' }}>
                                            <Text type="secondary" style={{ fontSize: '12px' }}>
                                                Total: {formatCurrency(approvalData?.expense_claims?.total_value || 0)}
                                            </Text>
                                        </div>
                                    </div>
                                </Card>
                            </Col>

                            {/* Material Requests */}
                            <Col xs={24} md={8}>
                                <Card
                                    size="small"
                                    hoverable
                                    onClick={() => navigateToRoute?.('material-requests')}
                                    style={{
                                        background: 'linear-gradient(135deg, #4facfe15 0%, #00f2fe15 100%)',
                                        borderRadius: '10px',
                                        border: '1px solid #4facfe30',
                                        cursor: 'pointer',
                                    }}
                                >
                                    <div style={{ textAlign: 'center' }}>
                                        <InboxOutlined style={{ fontSize: '28px', color: '#4facfe', marginBottom: '8px' }} />
                                        <Title level={2} style={{ margin: 0, color: '#4facfe' }}>
                                            {loading ? <Spin size="small" /> : approvalData?.material_requests?.pending || 0}
                                        </Title>
                                        <Text strong>Material Requests</Text>
                                        <div style={{ marginTop: '8px' }}>
                                            <Text type="secondary" style={{ fontSize: '12px' }}>
                                                Total: {formatCurrency(approvalData?.material_requests?.total_value || 0)}
                                            </Text>
                                        </div>
                                    </div>
                                </Card>
                            </Col>
                        </Row>
                    </Card>
                </Col>
                <Col xs={24} sm={24} md={8} lg={6}>
                    <Card
                        style={{
                            borderRadius: '12px',
                            boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
                            border: 'none',
                            height: '100%',
                        }}
                        title="Leave Applications"
                    >
                        <div style={{ textAlign: 'center', padding: '20px 0' }}>
                            <Badge count={approvalData?.leave_applications?.pending || 0} showZero>
                                <Avatar
                                    size={64}
                                    style={{
                                        backgroundColor: '#13c2c215',
                                        color: '#13c2c2',
                                    }}
                                    icon={<CalendarOutlined />}
                                />
                            </Badge>
                            <div style={{ marginTop: '16px' }}>
                                <Text strong>Pending Review</Text>
                            </div>
                            <Button type="link" size="small" onClick={() => navigateToRoute?.('leave-applications')}>
                                View All →
                            </Button>
                        </div>
                    </Card>
                </Col>
            </Row>

            {/* Section 4: HR & Attendance */}
            <SectionHeader title="HR & Attendance" icon={<TeamOutlined />} />
            <Row gutter={[16, 16]}>
                {/* Attendance Summary */}
                <Col xs={24} md={12} lg={8}>
                    <Card
                        style={{
                            borderRadius: '12px',
                            boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
                            border: 'none',
                        }}
                        title={
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span>Today's Attendance</span>
                                <Tag color="blue">
                                    <FieldTimeOutlined /> Live
                                </Tag>
                            </div>
                        }
                    >
                        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                            <Spin spinning={loading}>
                                <div style={{ fontSize: '48px', fontWeight: 700, color: token.colorSuccess }}>
                                    {attendanceData?.attendance_rate || 0}%
                                </div>
                                <Text type="secondary">Attendance Rate</Text>
                            </Spin>
                        </div>
                        <Row gutter={8}>
                            <Col span={8} style={{ textAlign: 'center' }}>
                                <div style={{ padding: '8px', background: '#f6ffed', borderRadius: '8px' }}>
                                    <div style={{ fontSize: '18px', fontWeight: 700, color: '#52c41a' }}>{attendanceData?.present || 0}</div>
                                    <Text type="secondary" style={{ fontSize: '11px' }}>Present</Text>
                                </div>
                            </Col>
                            <Col span={8} style={{ textAlign: 'center' }}>
                                <div style={{ padding: '8px', background: '#fff1f0', borderRadius: '8px' }}>
                                    <div style={{ fontSize: '18px', fontWeight: 700, color: '#ff4d4f' }}>{attendanceData?.absent || 0}</div>
                                    <Text type="secondary" style={{ fontSize: '11px' }}>Absent</Text>
                                </div>
                            </Col>
                            <Col span={8} style={{ textAlign: 'center' }}>
                                <div style={{ padding: '8px', background: '#e6f7ff', borderRadius: '8px' }}>
                                    <div style={{ fontSize: '18px', fontWeight: 700, color: '#1890ff' }}>{attendanceData?.on_leave || 0}</div>
                                    <Text type="secondary" style={{ fontSize: '11px' }}>On Leave</Text>
                                </div>
                            </Col>
                        </Row>
                        <Button
                            block
                            type="dashed"
                            style={{ marginTop: '16px' }}
                            onClick={() => navigateToRoute?.('attendance')}
                        >
                            Detailed Attendance Report
                        </Button>
                    </Card>
                </Col>

                <Col xs={24} md={12} lg={16}>
                    <Card
                        style={{
                            borderRadius: '12px',
                            boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
                            border: 'none',
                            height: '100%',
                        }}
                        title="Workforce Distribution"
                    >
                        {/* Placeholder for future distribution chart */}
                        <div style={{ height: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f5f5f5', borderRadius: '8px' }}>
                            <Text type="secondary">Workforce distribution by facility type</Text>
                        </div>
                    </Card>
                </Col>
            </Row>
        </div>
    );
};

export default ExecutiveDashboard;

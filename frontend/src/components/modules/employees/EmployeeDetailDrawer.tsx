import React, { useState, useEffect, useMemo } from 'react';
import { Tabs, Tag, Space, Typography, Alert, Button, message, Progress, Avatar } from 'antd';
import {
    UserOutlined,
    MailOutlined,
    PhoneOutlined,
    CalendarOutlined,
    AuditOutlined,
    SafetyCertificateOutlined,
    MedicineBoxOutlined,
    BankOutlined,
    WarningOutlined,
    CopyOutlined,
    ClockCircleOutlined,
    CheckCircleOutlined,
    ExclamationCircleOutlined,
    CloseCircleOutlined,
    SyncOutlined
} from '@ant-design/icons';
import ModuleDetailDrawer from '../shared/ModuleDetailDrawer';
import { AffiliationsTable } from '../health-professionals/AffiliationsTable';
import { LicenseStatusBadge } from '../health-professionals/LicenseStatusBadge';
import type { Employee } from '../../../types/modules';
import { employeesApi, healthProfessionalsApi } from '../../../services/api';

const { TabPane } = Tabs;
const { Text } = Typography;

interface EmployeeDetailDrawerProps {
    visible: boolean;
    employeeId: string | null;
    onClose: () => void;
}

const EmployeeDetailDrawer: React.FC<EmployeeDetailDrawerProps> = ({
    visible,
    employeeId,
    onClose,
}) => {
    const [loading, setLoading] = useState(false);
    const [employee, setEmployee] = useState<Employee | null>(null);
    const [syncing, setSyncing] = useState(false);

    const copyToClipboard = (text: string, label: string) => {
        if (navigator.clipboard && window.isSecureContext) {
            navigator.clipboard.writeText(text).then(() => {
                message.success(`${label} copied successfully`);
            }).catch(() => {
                fallbackCopy(text, label);
            });
        } else {
            fallbackCopy(text, label);
        }
    };

    const fallbackCopy = (text: string, label: string) => {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        try {
            document.execCommand('copy');
            message.success(`${label} copied successfully`);
        } catch {
            message.error('Failed to copy');
        }
        document.body.removeChild(textarea);
    };

    useEffect(() => {
        if (visible && employeeId) {
            fetchEmployeeDetails();
        }
    }, [visible, employeeId]);

    const fetchEmployeeDetails = async () => {
        setLoading(true);
        try {
            const response = await employeesApi.getDetail(employeeId);
            if (response.success) {
                setEmployee(response.data);
            }
        } catch (error) {
            console.error('Failed to load employee details:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString?: string) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString();
    };

    const hp = employee?.health_professional_data;

    // Compute license expiry details
    const licenseInfo = useMemo(() => {
        if (!hp?.license_end) return null;

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const licenseEnd = new Date(hp.license_end);
        licenseEnd.setHours(0, 0, 0, 0);
        const daysUntilExpiry = Math.ceil((licenseEnd.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

        // Calculate progress through license period
        let progressPercent = 0;
        if (hp.license_start) {
            const licenseStart = new Date(hp.license_start);
            licenseStart.setHours(0, 0, 0, 0);
            const totalDays = Math.ceil((licenseEnd.getTime() - licenseStart.getTime()) / (1000 * 60 * 60 * 24));
            const elapsed = Math.ceil((today.getTime() - licenseStart.getTime()) / (1000 * 60 * 60 * 24));
            progressPercent = totalDays > 0 ? Math.min(100, Math.max(0, Math.round((elapsed / totalDays) * 100))) : 0;
        }

        let status: 'active' | 'expiring' | 'expired';
        let statusLabel: string;
        let statusColor: string;
        let bgColor: string;
        let borderColor: string;
        let iconColor: string;
        let progressColor: string;
        let StatusIcon: typeof CheckCircleOutlined;

        if (daysUntilExpiry < 0) {
            status = 'expired';
            statusLabel = 'Expired';
            statusColor = '#cf1322';
            bgColor = '#fff1f0';
            borderColor = '#ffa39e';
            iconColor = '#cf1322';
            progressColor = '#ff4d4f';
            StatusIcon = CloseCircleOutlined;
        } else if (daysUntilExpiry <= 30) {
            status = 'expiring';
            statusLabel = 'Expiring Soon';
            statusColor = '#d48806';
            bgColor = '#fffbe6';
            borderColor = '#ffe58f';
            iconColor = '#d48806';
            progressColor = '#faad14';
            StatusIcon = ExclamationCircleOutlined;
        } else {
            status = 'active';
            statusLabel = 'Active';
            statusColor = '#389e0d';
            bgColor = '#f6ffed';
            borderColor = '#b7eb8f';
            iconColor = '#389e0d';
            progressColor = '#52c41a';
            StatusIcon = CheckCircleOutlined;
        }

        return {
            daysUntilExpiry,
            absDays: Math.abs(daysUntilExpiry),
            status,
            statusLabel,
            statusColor,
            bgColor,
            borderColor,
            iconColor,
            progressColor,
            progressPercent,
            StatusIcon,
            expiryDate: licenseEnd.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
        };
    }, [hp?.license_end, hp?.license_start]);

    // Alert for the Licensing tab (only warn/error states)
    const getLicenseExpiryAlert = () => {
        if (!licenseInfo || licenseInfo.status === 'active') return null;

        return (
            <Alert
                message={licenseInfo.status === 'expired' ? 'License Expired' : 'License Expiring Soon'}
                description={
                    licenseInfo.status === 'expired'
                        ? `License expired ${licenseInfo.absDays} days ago (${licenseInfo.expiryDate})`
                        : `License expires in ${licenseInfo.absDays} days (${licenseInfo.expiryDate})`
                }
                type={licenseInfo.status === 'expired' ? 'error' : 'warning'}
                icon={<WarningOutlined />}
                showIcon
                style={{ marginBottom: 16 }}
            />
        );
    };

    const handleSyncFromHWR = async () => {
        if (!hp?.name) {
            message.info('This employee is not linked to a health professional record.');
            return;
        }

        setSyncing(true);
        try {
            const response = await healthProfessionalsApi.syncFromHWR(hp.name);

            if (response.success) {
                message.success('Sync completed successfully! Refreshing data...');
                await fetchEmployeeDetails();
            } else {
                let errorMsg = 'Failed to sync from HWR';
                if (typeof response.message === 'object' && (response.message as any)?.message) {
                    errorMsg = (response.message as any).message;
                } else if (typeof response.message === 'string') {
                    errorMsg = response.message;
                } else if ((response as any).error) {
                    errorMsg = (response as any).error;
                }
                message.error(errorMsg);
            }
        } catch (error: any) {
            const errorMsg = error?.response?.data?.message ||
                           error?.message ||
                           'Network error: Unable to reach the server';
            message.error(errorMsg);
            console.error('Sync error:', error);
        } finally {
            setSyncing(false);
        }
    };

    return (
        <>
        <ModuleDetailDrawer
            title={`Employee Details: ${employee?.employee_name || 'Loading...'}`}
            visible={visible}
            onClose={onClose}
            loading={loading}
            extra={
                employee && hp && licenseInfo && (licenseInfo.status === 'expired' || licenseInfo.status === 'expiring') && (
                    <Button
                        type="primary"
                        danger={licenseInfo.status === 'expired'}
                        icon={<SyncOutlined spin={syncing} />}
                        onClick={handleSyncFromHWR}
                        loading={syncing}
                    >
                        Sync from HWR
                    </Button>
                )
            }
        >
            {employee && (
                <Tabs defaultActiveKey="1">
                    {/* Tab 1: Employment Info */}
                    <TabPane
                        tab={<Space><BankOutlined />Employment</Space>}
                        key="1"
                    >
                        {/* Namecard Section */}
                        <div style={{
                            background: '#fafafa',
                            border: '1px solid #f0f0f0',
                            borderRadius: 8,
                            padding: '24px',
                            marginBottom: 24,
                        }}>
                            {/* Avatar + Primary Identity */}
                            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, marginBottom: 24 }}>
                                <Avatar
                                    size={64}
                                    src={employee.image}
                                    icon={<UserOutlined />}
                                    style={{ backgroundColor: '#1890ff', flexShrink: 0 }}
                                />
                                <div style={{ flex: 1 }}>
                                    <Text style={{ fontSize: 12, color: 'rgba(0,0,0,0.45)', textTransform: 'uppercase', letterSpacing: 0.5, display: 'block' }}>
                                        Employee
                                    </Text>
                                    <Text style={{ fontSize: 24, fontWeight: 600, lineHeight: 1.2, display: 'block', marginTop: 6 }}>
                                        {employee.employee_name}
                                    </Text>
                                </div>
                            </div>

                            {/* Employee ID & License ID - Prominent Row */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
                                {/* Employee ID */}
                                <div style={{
                                    background: 'rgba(255, 255, 255, 0.4)',
                                    backdropFilter: 'blur(8px)',
                                    border: '1px solid rgba(255, 255, 255, 0.5)',
                                    borderRadius: 12,
                                    padding: '16px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    transition: 'all 0.3s ease',
                                }}>
                                    <div style={{ flex: 1 }}>
                                        <Text style={{ fontSize: 11, color: 'rgba(0,0,0,0.45)', textTransform: 'uppercase', letterSpacing: 0.5, display: 'block', fontWeight: 500 }}>
                                            Employee ID
                                        </Text>
                                        <Text style={{ fontSize: 15, fontWeight: 700, color: 'rgba(0,0,0,0.85)', marginTop: 6, letterSpacing: 0.3 }}>
                                            {employee.employee_number || employee.name}
                                        </Text>
                                    </div>
                                    <Button
                                        type="text"
                                        size="middle"
                                        icon={<CopyOutlined />}
                                        onClick={() => copyToClipboard(employee.employee_number || employee.name || '', 'Employee ID')}
                                        style={{ color: 'rgba(0,0,0,0.45)', marginLeft: 12 }}
                                    />
                                </div>

                                {/* License ID (from external_reference_id) */}
                                {hp?.external_reference_id && (
                                    <div style={{
                                        background: 'rgba(255, 255, 255, 0.4)',
                                        backdropFilter: 'blur(8px)',
                                        border: '1px solid rgba(255, 255, 255, 0.5)',
                                        borderRadius: 12,
                                        padding: '16px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        transition: 'all 0.3s ease',
                                    }}>
                                        <div style={{ flex: 1 }}>
                                            <Text style={{ fontSize: 11, color: 'rgba(0,0,0,0.45)', textTransform: 'uppercase', letterSpacing: 0.5, display: 'block', fontWeight: 500 }}>
                                                License ID (HWR)
                                            </Text>
                                            <Text style={{ fontSize: 15, fontWeight: 700, color: 'rgba(0,0,0,0.85)', marginTop: 6, letterSpacing: 0.3 }}>
                                                {hp.external_reference_id}
                                            </Text>
                                        </div>
                                        <Button
                                            type="text"
                                            size="middle"
                                            icon={<CopyOutlined />}
                                            onClick={() => copyToClipboard(hp.external_reference_id || '', 'License ID')}
                                            style={{ color: 'rgba(0,0,0,0.45)', marginLeft: 12 }}
                                        />
                                    </div>
                                )}
                            </div>

                            {/* Key Identifiers Grid */}
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                                gap: 16,
                                borderTop: '1px solid #f0f0f0',
                                paddingTop: 16,
                            }}>
                                {/* Department */}
                                <div>
                                    <Text style={{ fontSize: 11, color: 'rgba(0,0,0,0.45)', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                                        Department
                                    </Text>
                                    <div style={{ marginTop: 6, fontSize: 14 }}>
                                        <Text>{employee.department || 'N/A'}</Text>
                                    </div>
                                </div>

                                {/* Designation */}
                                <div>
                                    <Text style={{ fontSize: 11, color: 'rgba(0,0,0,0.45)', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                                        Designation
                                    </Text>
                                    <div style={{ marginTop: 6, fontSize: 14 }}>
                                        <Text>{employee.designation || 'N/A'}</Text>
                                    </div>
                                </div>

                                {/* Employment Type */}
                                <div>
                                    <Text style={{ fontSize: 11, color: 'rgba(0,0,0,0.45)', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                                        Employment Type
                                    </Text>
                                    <div style={{ marginTop: 6, fontSize: 14 }}>
                                        <Text>{employee.employment_type || 'N/A'}</Text>
                                    </div>
                                </div>

                                {/* Facility if exists */}
                                {employee.custom_facility_name && (
                                    <div>
                                        <Text style={{ fontSize: 11, color: 'rgba(0,0,0,0.45)', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                                            Health Facility
                                        </Text>
                                        <div style={{ marginTop: 6 }}>
                                            <Tag color="geekblue">{employee.custom_facility_name}</Tag>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Employment Timeline */}
                        <div style={{
                            background: '#fafafa',
                            border: '1px solid #f0f0f0',
                            borderRadius: 8,
                            padding: '16px 24px',
                            marginBottom: 24,
                        }}>
                            <Text style={{ fontSize: 12, color: 'rgba(0,0,0,0.45)', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                                Employment Timeline
                            </Text>
                            <div style={{ display: 'flex', gap: 24, marginTop: 12 }}>
                                <div>
                                    <CalendarOutlined style={{ marginRight: 8, color: 'rgba(0,0,0,0.45)' }} />
                                    <Text type="secondary" style={{ fontSize: 12 }}>Joined</Text>
                                    <div style={{ marginTop: 4, fontSize: 14, fontWeight: 500 }}>
                                        {formatDate(employee.date_of_joining)}
                                    </div>
                                </div>
                                {employee.date_of_leaving && (
                                    <div>
                                        <CalendarOutlined style={{ marginRight: 8, color: 'rgba(0,0,0,0.45)' }} />
                                        <Text type="secondary" style={{ fontSize: 12 }}>Left</Text>
                                        <div style={{ marginTop: 4, fontSize: 14, fontWeight: 500 }}>
                                            {formatDate(employee.date_of_leaving)}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* License Expiry Card */}
                        {licenseInfo && (
                            <div style={{
                                marginTop: 16,
                                background: licenseInfo.bgColor,
                                border: `1px solid ${licenseInfo.borderColor}`,
                                borderRadius: 8,
                                padding: '16px 20px',
                            }}>
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 8,
                                    marginBottom: 12,
                                }}>
                                    <SafetyCertificateOutlined style={{ fontSize: 14, color: licenseInfo.iconColor }} />
                                    <Text strong style={{ fontSize: 12, color: licenseInfo.statusColor, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                                        License Status
                                    </Text>
                                </div>

                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 20,
                                }}>
                                    {/* Days counter */}
                                    <div style={{
                                        textAlign: 'center',
                                        minWidth: 80,
                                        padding: '8px 12px',
                                        background: 'rgba(255,255,255,0.7)',
                                        borderRadius: 8,
                                        border: `1px solid ${licenseInfo.borderColor}`,
                                    }}>
                                        <div style={{
                                            fontSize: 28,
                                            fontWeight: 700,
                                            lineHeight: 1.1,
                                            color: licenseInfo.statusColor,
                                        }}>
                                            {licenseInfo.absDays}
                                        </div>
                                        <div style={{
                                            fontSize: 11,
                                            color: licenseInfo.statusColor,
                                            fontWeight: 500,
                                            marginTop: 2,
                                        }}>
                                            {licenseInfo.status === 'expired' ? 'days overdue' : 'days left'}
                                        </div>
                                    </div>

                                    {/* Details */}
                                    <div style={{ flex: 1 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                                            <licenseInfo.StatusIcon style={{ fontSize: 16, color: licenseInfo.iconColor }} />
                                            <Text strong style={{ fontSize: 15, color: licenseInfo.statusColor }}>
                                                {licenseInfo.statusLabel}
                                            </Text>
                                        </div>
                                        <div style={{ color: 'rgba(0,0,0,0.65)', fontSize: 13 }}>
                                            <ClockCircleOutlined style={{ marginRight: 6, fontSize: 12 }} />
                                            {licenseInfo.status === 'expired'
                                                ? `Expired on ${licenseInfo.expiryDate}`
                                                : `Valid until ${licenseInfo.expiryDate}`
                                            }
                                        </div>
                                        {/* Progress bar */}
                                        {licenseInfo.progressPercent > 0 && (
                                            <div style={{ marginTop: 8 }}>
                                                <Progress
                                                    percent={licenseInfo.progressPercent}
                                                    strokeColor={licenseInfo.progressColor}
                                                    trailColor="rgba(0,0,0,0.06)"
                                                    size="small"
                                                    format={(pct) => (
                                                        <span style={{ fontSize: 11, color: 'rgba(0,0,0,0.45)' }}>
                                                            {pct}% elapsed
                                                        </span>
                                                    )}
                                                />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}
                    </TabPane>

                    {/* Tab 2: Personal Info */}
                    <TabPane
                        tab={<Space><UserOutlined />Personal Info</Space>}
                        key="2"
                    >
                        {/* Demographics Card */}
                        <div style={{
                            background: '#fafafa',
                            border: '1px solid #f0f0f0',
                            borderRadius: 8,
                            padding: '16px 24px',
                            marginBottom: 24,
                        }}>
                            <Text style={{ fontSize: 12, color: 'rgba(0,0,0,0.45)', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                                Demographics
                            </Text>
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                                gap: 16,
                                marginTop: 12,
                            }}>
                                <div>
                                    <Text type="secondary" style={{ fontSize: 12 }}>Gender</Text>
                                    <div style={{ marginTop: 4, fontSize: 14, fontWeight: 500 }}>
                                        {employee.gender || 'N/A'}
                                    </div>
                                </div>
                                <div>
                                    <Text type="secondary" style={{ fontSize: 12 }}>Date of Birth</Text>
                                    <div style={{ marginTop: 4, fontSize: 14, fontWeight: 500 }}>
                                        {formatDate(employee.date_of_birth)}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Contact Information Card */}
                        <div style={{
                            background: '#fafafa',
                            border: '1px solid #f0f0f0',
                            borderRadius: 8,
                            padding: '16px 24px',
                            marginBottom: 24,
                        }}>
                            <Text style={{ fontSize: 12, color: 'rgba(0,0,0,0.45)', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                                Contact Information
                            </Text>
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                                gap: 16,
                                marginTop: 12,
                            }}>
                                <div>
                                    <Text type="secondary" style={{ fontSize: 12 }}>
                                        <PhoneOutlined style={{ marginRight: 6, color: '#52c41a' }} />
                                        Phone
                                    </Text>
                                    <div style={{ marginTop: 4, fontSize: 14 }}>
                                        {(employee.cell_number || hp?.phone) ? (
                                            <a href={`tel:${employee.cell_number || hp?.phone}`}>
                                                {employee.cell_number || hp?.phone}
                                            </a>
                                        ) : 'N/A'}
                                    </div>
                                </div>
                                <div>
                                    <Text type="secondary" style={{ fontSize: 12 }}>
                                        <MailOutlined style={{ marginRight: 6, color: '#1890ff' }} />
                                        Company Email
                                    </Text>
                                    <div style={{ marginTop: 4, fontSize: 14 }}>
                                        {(employee.company_email || hp?.official_email) ? (
                                            <a href={`mailto:${employee.company_email || hp?.official_email}`}>
                                                {employee.company_email || hp?.official_email}
                                            </a>
                                        ) : 'N/A'}
                                    </div>
                                </div>
                                <div>
                                    <Text type="secondary" style={{ fontSize: 12 }}>
                                        <MailOutlined style={{ marginRight: 6, color: '#1890ff' }} />
                                        Personal Email
                                    </Text>
                                    <div style={{ marginTop: 4, fontSize: 14 }}>
                                        {(employee.personal_email || hp?.email) ? (
                                            <a href={`mailto:${employee.personal_email || hp?.email}`}>
                                                {employee.personal_email || hp?.email}
                                            </a>
                                        ) : 'N/A'}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Identification Card */}
                        {employee.custom_identification_type && (
                            <div style={{
                                background: '#fafafa',
                                border: '1px solid #f0f0f0',
                                borderRadius: 8,
                                padding: '16px 24px',
                            }}>
                                <Text style={{ fontSize: 12, color: 'rgba(0,0,0,0.45)', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                                    Identification
                                </Text>
                                <div style={{
                                    display: 'grid',
                                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                                    gap: 16,
                                    marginTop: 12,
                                }}>
                                    <div>
                                        <Text type="secondary" style={{ fontSize: 12 }}>Type</Text>
                                        <div style={{ marginTop: 4, fontSize: 14, fontWeight: 500 }}>
                                            {employee.custom_identification_type}
                                        </div>
                                    </div>
                                    <div>
                                        <Text type="secondary" style={{ fontSize: 12 }}>Number</Text>
                                        <div style={{ marginTop: 4, fontSize: 14, fontWeight: 500 }}>
                                            {employee.custom_identification_number || 'N/A'}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </TabPane>

                    {/* Tab 3: Professional Details (if HP linked) */}
                    {hp && (
                        <TabPane
                            tab={<Space><MedicineBoxOutlined />Professional</Space>}
                            key="3"
                        >
                            {/* Professional Profile Card */}
                            <div style={{
                                background: '#fafafa',
                                border: '1px solid #f0f0f0',
                                borderRadius: 8,
                                padding: '16px 24px',
                                marginBottom: 24,
                            }}>
                                <Text style={{ fontSize: 12, color: 'rgba(0,0,0,0.45)', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                                    Professional Profile
                                </Text>
                                <div style={{
                                    display: 'grid',
                                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                                    gap: 16,
                                    marginTop: 12,
                                }}>
                                    <div>
                                        <Text type="secondary" style={{ fontSize: 12 }}>Cadre</Text>
                                        <div style={{ marginTop: 4 }}>
                                            <Tag color="blue">{hp.professional_cadre || 'N/A'}</Tag>
                                        </div>
                                    </div>
                                    <div>
                                        <Text type="secondary" style={{ fontSize: 12 }}>Specialty</Text>
                                        <div style={{ marginTop: 4, fontSize: 14 }}>
                                            {hp.professional_specialty || 'N/A'}
                                        </div>
                                    </div>
                                    {hp.sub_specialty && (
                                        <div>
                                            <Text type="secondary" style={{ fontSize: 12 }}>Sub-Specialty</Text>
                                            <div style={{ marginTop: 4, fontSize: 14 }}>
                                                {hp.sub_specialty}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Registration & Qualifications Card */}
                            <div style={{
                                background: '#fafafa',
                                border: '1px solid #f0f0f0',
                                borderRadius: 8,
                                padding: '16px 24px',
                            }}>
                                <Text style={{ fontSize: 12, color: 'rgba(0,0,0,0.45)', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                                    Credentials
                                </Text>
                                <div style={{ marginTop: 12 }}>
                                    <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 8 }}>Registration Number</Text>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                                        <Tag color="green" style={{ margin: 0 }}>{hp.registration_number || 'N/A'}</Tag>
                                        {hp.registration_number && (
                                            <Button
                                                type="text"
                                                size="small"
                                                icon={<CopyOutlined />}
                                                onClick={() => copyToClipboard(hp.registration_number || '', 'Registration Number')}
                                            />
                                        )}
                                    </div>
                                </div>
                                {hp.educational_qualifications && (
                                    <div>
                                        <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 8 }}>Qualifications</Text>
                                        <Text style={{ fontSize: 14 }}>
                                            {hp.educational_qualifications}
                                        </Text>
                                    </div>
                                )}
                            </div>
                        </TabPane>
                    )}

                    {/* Tab 4: Licensing (if HP linked) */}
                    {hp && (
                        <TabPane
                            tab={<Space><SafetyCertificateOutlined />Licensing</Space>}
                            key="4"
                        >
                            {getLicenseExpiryAlert()}

                            {/* License Status Card */}
                            <div style={{
                                background: '#fafafa',
                                border: '1px solid #f0f0f0',
                                borderRadius: 8,
                                padding: '16px 24px',
                                marginBottom: 24,
                            }}>
                                <Text style={{ fontSize: 12, color: 'rgba(0,0,0,0.45)', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                                    License Status
                                </Text>
                                <div style={{
                                    display: 'grid',
                                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                                    gap: 16,
                                    marginTop: 12,
                                }}>
                                    <div>
                                        <Text type="secondary" style={{ fontSize: 12 }}>Status</Text>
                                        <div style={{ marginTop: 4 }}>
                                            <LicenseStatusBadge record={hp} />
                                        </div>
                                    </div>
                                    <div>
                                        <Text type="secondary" style={{ fontSize: 12 }}>License Type</Text>
                                        <div style={{ marginTop: 4, fontSize: 14 }}>
                                            {hp.license_type ? (
                                                <Tag color="geekblue">{hp.license_type}</Tag>
                                            ) : 'N/A'}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* License Validity Card */}
                            <div style={{
                                background: '#fafafa',
                                border: '1px solid #f0f0f0',
                                borderRadius: 8,
                                padding: '16px 24px',
                            }}>
                                <Text style={{ fontSize: 12, color: 'rgba(0,0,0,0.45)', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                                    License Validity
                                </Text>
                                <div style={{
                                    display: 'grid',
                                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                                    gap: 16,
                                    marginTop: 12,
                                }}>
                                    <div>
                                        <Text type="secondary" style={{ fontSize: 12 }}>
                                            <CalendarOutlined style={{ marginRight: 6, color: '#52c41a' }} />
                                            Start Date
                                        </Text>
                                        <div style={{ marginTop: 4, fontSize: 14, fontWeight: 500 }}>
                                            {formatDate(hp.license_start)}
                                        </div>
                                    </div>
                                    <div>
                                        <Text type="secondary" style={{ fontSize: 12 }}>
                                            <CalendarOutlined style={{ marginRight: 6, color: '#cf1322' }} />
                                            End Date
                                        </Text>
                                        <div style={{ marginTop: 4, fontSize: 14, fontWeight: 500 }}>
                                            {formatDate(hp.license_end)}
                                        </div>
                                    </div>
                                    <div>
                                        <Text type="secondary" style={{ fontSize: 12 }}>Licensing Body</Text>
                                        <div style={{ marginTop: 4, fontSize: 14 }}>
                                            {hp.licensing_body || 'N/A'}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </TabPane>
                    )}

                    {/* Tab 5: Affiliations */}
                    {employee.professional_affiliations && employee.professional_affiliations.length > 0 && (
                        <TabPane
                            tab={<Space><BankOutlined />Affiliations ({employee.professional_affiliations.length})</Space>}
                            key="5"
                        >
                            <AffiliationsTable data={employee.professional_affiliations} />
                        </TabPane>
                    )}

                    {/* Tab 6: Audit Log */}
                    <TabPane
                        tab={<Space><AuditOutlined />Audit Log</Space>}
                        key="6"
                    >
                        {/* Audit Information Card */}
                        <div style={{
                            background: '#fafafa',
                            border: '1px solid #f0f0f0',
                            borderRadius: 8,
                            padding: '16px 24px',
                        }}>
                            <Text style={{ fontSize: 12, color: 'rgba(0,0,0,0.45)', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                                Audit Information
                            </Text>
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                                gap: 16,
                                marginTop: 12,
                            }}>
                                <div>
                                    <Text type="secondary" style={{ fontSize: 12 }}>
                                        <CalendarOutlined style={{ marginRight: 6, color: '#1890ff' }} />
                                        Created On
                                    </Text>
                                    <div style={{ marginTop: 4, fontSize: 14, fontWeight: 500 }}>
                                        {formatDate(employee.creation)}
                                    </div>
                                </div>
                                <div>
                                    <Text type="secondary" style={{ fontSize: 12 }}>
                                        <ClockCircleOutlined style={{ marginRight: 6, color: '#faad14' }} />
                                        Last Modified
                                    </Text>
                                    <div style={{ marginTop: 4, fontSize: 14, fontWeight: 500 }}>
                                        {formatDate(employee.modified)}
                                    </div>
                                </div>
                                <div>
                                    <Text type="secondary" style={{ fontSize: 12 }}>Modified By</Text>
                                    <div style={{ marginTop: 4, fontSize: 14 }}>
                                        {employee.modified_by || 'N/A'}
                                    </div>
                                </div>
                                <div>
                                    <Text type="secondary" style={{ fontSize: 12 }}>Owner</Text>
                                    <div style={{ marginTop: 4, fontSize: 14 }}>
                                        {employee.owner || 'N/A'}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </TabPane>
                </Tabs>
            )}
        </ModuleDetailDrawer>

    </>
    );
};

export default EmployeeDetailDrawer;

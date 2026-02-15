import React, { useState, useEffect } from 'react';
import { Descriptions, Tabs, Tag, Space, Typography, Alert, Divider, Badge, Avatar, Card } from 'antd';
import {
    UserOutlined,
    SafetyCertificateOutlined,
    PhoneOutlined,
    EnvironmentOutlined,
    BankOutlined,
    IdcardOutlined,
    HistoryOutlined,
    MailOutlined
} from '@ant-design/icons';
import ModuleDetailDrawer from '../shared/ModuleDetailDrawer';
import StatusTag from '../shared/StatusTag';
import { HealthProfessional } from '../../../types/modules';
import { healthProfessionalsApi } from '../../../services/api';
import { AffiliationsTable } from './AffiliationsTable';
import { calculateLicenseStatus } from './LicenseStatusBadge';
import dayjs from 'dayjs';

const { TabPane } = Tabs;
const { Text, Link } = Typography;

interface HealthProfessionalDetailDrawerProps {
    visible: boolean;
    healthProfessionalId: string | null;
    onClose: () => void;
}

const HealthProfessionalDetailDrawer: React.FC<HealthProfessionalDetailDrawerProps> = ({
    visible,
    healthProfessionalId,
    onClose,
}) => {
    const [loading, setLoading] = useState(false);
    const [healthProfessional, setHealthProfessional] = useState<HealthProfessional | null>(null);

    useEffect(() => {
        if (visible && healthProfessionalId) {
            fetchHealthProfessionalDetails();
        }
    }, [visible, healthProfessionalId]);

    const fetchHealthProfessionalDetails = async () => {
        if (!healthProfessionalId) return;

        setLoading(true);
        try {
            const response = await healthProfessionalsApi.getDetail(healthProfessionalId);
            if (response.success && response.data) {
                setHealthProfessional(response.data);
            }
        } catch (error) {
            console.error('Failed to load health professional details:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString?: string) => {
        if (!dateString) return 'N/A';
        return dayjs(dateString).format('MMM DD, YYYY');
    };

    const getLicenseExpiryWarning = (licenseEnd?: string) => {
        if (!licenseEnd) return null;

        const status = calculateLicenseStatus(licenseEnd);
        const endDate = dayjs(licenseEnd);
        const today = dayjs();
        const daysUntil = endDate.diff(today, 'days');

        if (status === 'Expired') {
            return (
                <Alert
                    message="License Expired"
                    description={`License expired on ${formatDate(licenseEnd)}`}
                    type="error"
                    showIcon
                    style={{ marginTop: 16 }}
                />
            );
        } else if (status === 'Expiring Soon') {
            return (
                <Alert
                    message="License Expiring Soon"
                    description={`License expires in ${daysUntil} days on ${formatDate(licenseEnd)}`}
                    type="warning"
                    showIcon
                    style={{ marginTop: 16 }}
                />
            );
        }
        return null;
    };

    return (
        <ModuleDetailDrawer
            title={`Health Professional: ${healthProfessional?.full_name || 'Loading...'}`}
            visible={visible}
            onClose={onClose}
            loading={loading}
            width={900}
        >
            {healthProfessional && (
                <Tabs defaultActiveKey="1">
                    {/* Tab 1: Basic Information */}
                    <TabPane
                        tab={<Space><UserOutlined />Basic Info</Space>}
                        key="1"
                    >
                        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                            {/* Professional Header Card with Photo */}
                            <Card
                                bordered={false}
                                style={{
                                    background: '#fff',
                                    borderRadius: '8px',
                                    boxShadow: '0 1px 2px rgba(0,0,0,0.06)',
                                }}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '24px', marginBottom: '20px' }}>
                                    {/* Professional Headshot */}
                                    <Avatar
                                        size={120}
                                        src={healthProfessional.employee_record?.image}
                                        icon={<UserOutlined style={{ fontSize: '48px' }} />}
                                        style={{
                                            backgroundColor: '#1890ff',
                                            flexShrink: 0,
                                            border: '4px solid #e6f7ff',
                                            boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                                        }}
                                    />

                                    {/* Name and Status */}
                                    <div style={{ flex: 1 }}>
                                        <div style={{
                                            fontSize: '24px',
                                            fontWeight: '600',
                                            marginBottom: '8px',
                                            color: '#262626'
                                        }}>
                                            {healthProfessional.full_name}
                                        </div>
                                        <Space size="middle" wrap>
                                            <Space size={4}>
                                                <Text type="secondary" style={{ fontSize: '13px' }}>Reg. No:</Text>
                                                <Tag color="blue" style={{ fontSize: '13px', margin: 0 }}>
                                                    {healthProfessional.registration_number}
                                                </Tag>
                                            </Space>
                                            <Divider type="vertical" style={{ margin: 0 }} />
                                            <Space size={4}>
                                                <Text type="secondary" style={{ fontSize: '13px' }}>Status:</Text>
                                                <StatusTag status={healthProfessional.status} />
                                            </Space>
                                        </Space>
                                    </div>
                                </div>

                                {/* Professional Details */}
                                <Space direction="vertical" size="small" style={{ width: '100%' }}>
                                    <div style={{ display: 'flex', paddingBottom: '8px', borderBottom: '1px solid #f0f0f0' }}>
                                        <Text type="secondary" style={{ width: '180px', fontSize: '13px' }}>Professional Cadre</Text>
                                        <Tag color="blue" style={{ margin: 0 }}>{healthProfessional.professional_cadre || 'N/A'}</Tag>
                                    </div>
                                    <div style={{ display: 'flex', paddingBottom: '8px', borderBottom: '1px solid #f0f0f0' }}>
                                        <Text type="secondary" style={{ width: '180px', fontSize: '13px' }}>Specialty</Text>
                                        <Text strong style={{ fontSize: '13px' }}>{healthProfessional.professional_specialty || 'N/A'}</Text>
                                    </div>
                                    {healthProfessional.sub_specialty && (
                                        <div style={{ display: 'flex', paddingBottom: '8px', borderBottom: '1px solid #f0f0f0' }}>
                                            <Text type="secondary" style={{ width: '180px', fontSize: '13px' }}>Sub-Specialty</Text>
                                            <Text strong style={{ fontSize: '13px' }}>{healthProfessional.sub_specialty}</Text>
                                        </div>
                                    )}
                                    <div style={{ display: 'flex', paddingBottom: '8px' }}>
                                        <Text type="secondary" style={{ width: '180px', fontSize: '13px' }}>Registration ID</Text>
                                        <Text code style={{ fontSize: '12px', padding: '2px 6px' }}>{healthProfessional.registration_id || 'N/A'}</Text>
                                    </div>
                                </Space>
                            </Card>

                            {/* Personal Information */}
                            <Card
                                title={<Text strong style={{ fontSize: '14px' }}>Personal Information</Text>}
                                size="small"
                                bordered={false}
                                style={{
                                    background: '#fafafa',
                                    borderRadius: '8px',
                                    boxShadow: 'none'
                                }}
                            >
                                <Space direction="vertical" size="small" style={{ width: '100%' }}>
                                    <div style={{ display: 'flex', paddingBottom: '6px' }}>
                                        <Text type="secondary" style={{ width: '180px', fontSize: '13px' }}>Gender</Text>
                                        <Text style={{ fontSize: '13px' }}>{healthProfessional.gender || 'N/A'}</Text>
                                    </div>
                                    {healthProfessional.date_of_birth && (
                                        <div style={{ display: 'flex', paddingBottom: '6px' }}>
                                            <Text type="secondary" style={{ width: '180px', fontSize: '13px' }}>Date of Birth</Text>
                                            <Text style={{ fontSize: '13px' }}>{formatDate(healthProfessional.date_of_birth)}</Text>
                                        </div>
                                    )}
                                    <div style={{ display: 'flex', paddingBottom: '6px' }}>
                                        <Text type="secondary" style={{ width: '180px', fontSize: '13px' }}>Identification Type</Text>
                                        <Text style={{ fontSize: '13px' }}>{healthProfessional.identification_type || 'N/A'}</Text>
                                    </div>
                                    <div style={{ display: 'flex', paddingBottom: '6px' }}>
                                        <Text type="secondary" style={{ width: '180px', fontSize: '13px' }}>Identification Number</Text>
                                        <Text code style={{ fontSize: '12px', padding: '2px 6px' }}>{healthProfessional.identification_number || 'N/A'}</Text>
                                    </div>
                                    {healthProfessional.nationality && (
                                        <div style={{ display: 'flex' }}>
                                            <Text type="secondary" style={{ width: '180px', fontSize: '13px' }}>Nationality</Text>
                                            <Text style={{ fontSize: '13px' }}>{healthProfessional.nationality}</Text>
                                        </div>
                                    )}
                                </Space>
                            </Card>
                        </Space>
                    </TabPane>

                    {/* Tab 2: Licensing & Credentials */}
                    <TabPane
                        tab={<Space><SafetyCertificateOutlined />Licensing</Space>}
                        key="2"
                    >
                        {getLicenseExpiryWarning(healthProfessional.license_end)}

                        <Descriptions bordered column={2} style={{ marginTop: 16 }}>
                            <Descriptions.Item label="License ID">
                                {healthProfessional.license_id || 'N/A'}
                            </Descriptions.Item>
                            <Descriptions.Item label="License Type">
                                {healthProfessional.license_type || 'N/A'}
                            </Descriptions.Item>
                            <Descriptions.Item label="License Start Date">
                                {formatDate(healthProfessional.license_start)}
                            </Descriptions.Item>
                            <Descriptions.Item label="License End Date">
                                {healthProfessional.license_end ? (
                                    <Text strong>{formatDate(healthProfessional.license_end)}</Text>
                                ) : 'N/A'}
                            </Descriptions.Item>
                            <Descriptions.Item label="Licensing Body" span={2}>
                                {healthProfessional.licensing_body || 'N/A'}
                            </Descriptions.Item>
                            {healthProfessional.educational_qualifications && (
                                <Descriptions.Item label="Educational Qualifications" span={2}>
                                    <Text>{healthProfessional.educational_qualifications}</Text>
                                </Descriptions.Item>
                            )}
                            {healthProfessional.discipline_name && (
                                <Descriptions.Item label="Discipline">
                                    {healthProfessional.discipline_name}
                                </Descriptions.Item>
                            )}
                            {healthProfessional.practice_type && (
                                <Descriptions.Item label="Practice Type">
                                    {healthProfessional.practice_type}
                                </Descriptions.Item>
                            )}
                        </Descriptions>
                    </TabPane>

                    {/* Tab 3: Contact & Location */}
                    <TabPane
                        tab={<Space><PhoneOutlined />Contact & Location</Space>}
                        key="3"
                    >
                        <Text strong style={{ fontSize: 14 }}>Contact Information</Text>
                        <Divider style={{ margin: '12px 0' }} />
                        <Descriptions bordered column={1}>
                            <Descriptions.Item label="Phone">
                                {healthProfessional.phone ? (
                                    <Space>
                                        <PhoneOutlined style={{ color: '#52c41a' }} />
                                        <Link href={`tel:${healthProfessional.phone}`}>
                                            {healthProfessional.phone}
                                        </Link>
                                    </Space>
                                ) : 'N/A'}
                            </Descriptions.Item>
                            {healthProfessional.official_phone && (
                                <Descriptions.Item label="Official Phone">
                                    <Space>
                                        <PhoneOutlined style={{ color: '#1890ff' }} />
                                        <Link href={`tel:${healthProfessional.official_phone}`}>
                                            {healthProfessional.official_phone}
                                        </Link>
                                    </Space>
                                </Descriptions.Item>
                            )}
                            <Descriptions.Item label="Email">
                                {healthProfessional.email ? (
                                    <Space>
                                        <MailOutlined style={{ color: '#1890ff' }} />
                                        <Link href={`mailto:${healthProfessional.email}`}>
                                            {healthProfessional.email}
                                        </Link>
                                    </Space>
                                ) : 'N/A'}
                            </Descriptions.Item>
                            {healthProfessional.official_email && (
                                <Descriptions.Item label="Official Email">
                                    <Space>
                                        <MailOutlined style={{ color: '#722ed1' }} />
                                        <Link href={`mailto:${healthProfessional.official_email}`}>
                                            {healthProfessional.official_email}
                                        </Link>
                                    </Space>
                                </Descriptions.Item>
                            )}
                            {healthProfessional.postal_address && (
                                <Descriptions.Item label="Postal Address">
                                    {healthProfessional.postal_address}
                                </Descriptions.Item>
                            )}
                        </Descriptions>

                        <Text strong style={{ fontSize: 14, display: 'block', marginTop: 24 }}>
                            Location
                        </Text>
                        <Divider style={{ margin: '12px 0' }} />
                        <Descriptions bordered column={1}>
                            <Descriptions.Item label="County">
                                <Tag icon={<EnvironmentOutlined />} color="geekblue">
                                    {healthProfessional.county || 'N/A'}
                                </Tag>
                            </Descriptions.Item>
                            {healthProfessional.sub_county && (
                                <Descriptions.Item label="Sub-County">
                                    {healthProfessional.sub_county}
                                </Descriptions.Item>
                            )}
                            {healthProfessional.ward && (
                                <Descriptions.Item label="Ward">
                                    {healthProfessional.ward}
                                </Descriptions.Item>
                            )}
                            {healthProfessional.address && (
                                <Descriptions.Item label="Physical Address">
                                    <Text>{healthProfessional.address}</Text>
                                </Descriptions.Item>
                            )}
                        </Descriptions>
                    </TabPane>

                    {/* Tab 4: Professional Affiliations */}
                    <TabPane
                        tab={
                            <Space>
                                <BankOutlined />
                                Affiliations
                                {healthProfessional.professional_affiliations &&
                                    healthProfessional.professional_affiliations.length > 0 && (
                                        <Badge count={healthProfessional.professional_affiliations.length} />
                                    )}
                            </Space>
                        }
                        key="4"
                    >
                        <AffiliationsTable
                            data={healthProfessional.professional_affiliations}
                            loading={loading}
                        />
                    </TabPane>

                    {/* Tab 5: Employee Record */}
                    <TabPane
                        tab={<Space><IdcardOutlined />Employee Record</Space>}
                        key="5"
                    >
                        {healthProfessional.employee_record ? (
                            <Descriptions bordered column={2}>
                                <Descriptions.Item label="Employee ID">
                                    <Tag color="blue">
                                        {healthProfessional.employee_record.name}
                                    </Tag>
                                </Descriptions.Item>
                                <Descriptions.Item label="Employee Name">
                                    {healthProfessional.employee_record.employee_name}
                                </Descriptions.Item>
                                <Descriptions.Item label="Department">
                                    {healthProfessional.employee_record.department}
                                </Descriptions.Item>
                                <Descriptions.Item label="Designation">
                                    {healthProfessional.employee_record.designation}
                                </Descriptions.Item>
                                <Descriptions.Item label="Date of Joining">
                                    {formatDate(healthProfessional.employee_record.date_of_joining)}
                                </Descriptions.Item>
                                <Descriptions.Item label="Company">
                                    {healthProfessional.employee_record.company}
                                </Descriptions.Item>
                            </Descriptions>
                        ) : (
                            <Alert
                                message="No Employee Record"
                                description="This health professional is not linked to an employee record."
                                type="info"
                                showIcon
                            />
                        )}
                    </TabPane>

                    {/* Tab 6: Audit Log */}
                    <TabPane
                        tab={<Space><HistoryOutlined />Audit Log</Space>}
                        key="6"
                    >
                        <Descriptions bordered column={1}>
                            <Descriptions.Item label="Created On">
                                {formatDate(healthProfessional.creation)}
                            </Descriptions.Item>
                            <Descriptions.Item label="Last Modified">
                                {formatDate(healthProfessional.modified)}
                            </Descriptions.Item>
                            <Descriptions.Item label="Modified By">
                                {healthProfessional.modified_by}
                            </Descriptions.Item>
                            {healthProfessional.user && (
                                <Descriptions.Item label="User Account">
                                    <Tag color="purple">{healthProfessional.user}</Tag>
                                </Descriptions.Item>
                            )}
                            {healthProfessional.external_reference_id && (
                                <Descriptions.Item label="External Reference ID">
                                    {healthProfessional.external_reference_id}
                                </Descriptions.Item>
                            )}
                            {healthProfessional.client_registry_id && (
                                <Descriptions.Item label="Client Registry ID">
                                    {healthProfessional.client_registry_id}
                                </Descriptions.Item>
                            )}
                        </Descriptions>
                    </TabPane>
                </Tabs>
            )}
        </ModuleDetailDrawer>
    );
};

export default HealthProfessionalDetailDrawer;

import React, { useState, useEffect } from 'react';
import { Descriptions, Tabs, Tag, Space, Card, Typography, Divider, Statistic, Row, Col, Skeleton, Empty, Badge } from 'antd';
import {
    MedicineBoxOutlined,
    TeamOutlined,
    EnvironmentOutlined,
    ClockCircleOutlined,
    BankOutlined,
    PhoneOutlined,
    MailOutlined,
    HomeOutlined,
    CalendarOutlined,
    UserOutlined,
    SafetyOutlined,
    GlobalOutlined,
    CheckCircleOutlined,
} from '@ant-design/icons';
import ModuleDetailDrawer from '../shared/ModuleDetailDrawer';
import StatusTag from '../shared/StatusTag';
import FacilityMap from '../../shared/FacilityMap';
import { facilitiesApi } from '../../../services/api';
import {
    getKephlLevelBadge,
    formatPhone,
    formatEmail,
    formatWebsite,
    formatFieldValue,
    formatYesNo,
} from '../../../utils/facilityHelpers';

const { TabPane } = Tabs;
const { Text } = Typography;

interface FacilityDetailDrawerProps {
    visible: boolean;
    facilityId: string | null;
    onClose: () => void;
}

interface FacilityData {
    name: string;
    facility_name: string;
    kephl_level?: string;
    hie_id?: string;
    operational_status?: string;
    county?: string;
    sub_county?: string;
    constituency?: string;
    ward?: string;
    latitude?: number;
    longitude?: string;
    facility_mfl?: string;
    facility_type?: string;
    category?: string;
    organization_company?: string;
    industry?: string;
    facility_administrator?: string;
    facility_owner?: string;
    board_registration_number?: string;
    registration_number?: string;
    website?: string;
    phone?: string;
    email?: string;
    bed_capacity?: number;
    maximum_bed_allocation?: number;
    open_whole_day?: number;
    open_public_holiday?: number;
    open_weekends?: number;
    open_late_night?: number;
    bank_accounts?: Array<{
        bank_name: string;
        account_name: string;
        account_number: string;
        branch?: string;
    }>;
    contacts?: Array<{
        contact_name: string;
        designation?: string;
        phone?: string;
        email?: string;
    }>;
    services?: Array<{
        service_name: string;
        description?: string;
    }>;
}

const FacilityDetailDrawer: React.FC<FacilityDetailDrawerProps> = ({
    visible,
    facilityId,
    onClose,
}) => {
    const [loading, setLoading] = useState(false);
    const [facility, setFacility] = useState<FacilityData | null>(null);

    useEffect(() => {
        if (visible && facilityId) {
            fetchFacilityDetails();
        }
    }, [visible, facilityId]);

    const fetchFacilityDetails = async () => {
        if (!facilityId) return;

        setLoading(true);
        try {
            const response = await facilitiesApi.getFacilityDetail(facilityId);
            if (response.success && response.data) {
                setFacility(response.data);
            }
        } catch (error) {
            console.error('Failed to load facility details:', error);
        } finally {
            setLoading(false);
        }
    };

    const kephlBadge = facility ? getKephlLevelBadge(facility.kephl_level) : null;

    const drawerExtra = facility && (
        <Space>
            <StatusTag status={facility.operational_status || 'N/A'} />
            {kephlBadge && (
                <Tag color={kephlBadge.color}>{kephlBadge.text}</Tag>
            )}
        </Space>
    );

    return (
        <ModuleDetailDrawer
            title={facility?.facility_name || 'Facility Details'}
            visible={visible}
            onClose={onClose}
            loading={loading}
            extra={drawerExtra}
        >
            {loading ? (
                <Skeleton active paragraph={{ rows: 10 }} />
            ) : facility ? (
                <Tabs defaultActiveKey="1">
                    {/* Tab 1: Basic Information */}
                    <TabPane
                        tab={<Space><BankOutlined />Basic Information</Space>}
                        key="1"
                    >
                        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                            {/* Quick Stats - Minimal Design */}
                            <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                                <div style={{
                                    flex: 1,
                                    padding: '12px 16px',
                                    background: '#f0f9ff',
                                    borderLeft: '3px solid #1890ff',
                                    borderRadius: '4px'
                                }}>
                                    <Text type="secondary" style={{ fontSize: '12px' }}>Services</Text>
                                    <div style={{ fontSize: '20px', fontWeight: '600', color: '#1890ff' }}>
                                        {facility.services?.length || 0}
                                    </div>
                                </div>
                                <div style={{
                                    flex: 1,
                                    padding: '12px 16px',
                                    background: '#f6ffed',
                                    borderLeft: '3px solid #52c41a',
                                    borderRadius: '4px'
                                }}>
                                    <Text type="secondary" style={{ fontSize: '12px' }}>Bed Capacity</Text>
                                    <div style={{ fontSize: '20px', fontWeight: '600', color: '#52c41a' }}>
                                        {facility.bed_capacity || 'N/A'}
                                    </div>
                                </div>
                                <div style={{
                                    flex: 1,
                                    padding: '12px 16px',
                                    background: '#fff7e6',
                                    borderLeft: '3px solid #faad14',
                                    borderRadius: '4px'
                                }}>
                                    <Text type="secondary" style={{ fontSize: '12px' }}>KEPHL Level</Text>
                                    <div style={{ fontSize: '20px', fontWeight: '600', color: '#faad14' }}>
                                        {kephlBadge ? kephlBadge.text : 'N/A'}
                                    </div>
                                </div>
                            </div>

                            {/* Facility Header Card */}
                            <Card
                                bordered={false}
                                style={{
                                    background: '#fff',
                                    borderRadius: '8px',
                                    boxShadow: '0 1px 2px rgba(0,0,0,0.06)',
                                }}
                            >
                                <div style={{ marginBottom: '20px' }}>
                                    <div style={{
                                        fontSize: '20px',
                                        fontWeight: '600',
                                        marginBottom: '8px',
                                        color: '#262626'
                                    }}>
                                        {facility.facility_name}
                                    </div>
                                    <Space size="middle" wrap>
                                        <Space size={4}>
                                            <Text type="secondary" style={{ fontSize: '13px' }}>MFL:</Text>
                                            <Text strong style={{ fontSize: '13px' }}>{formatFieldValue(facility.facility_mfl)}</Text>
                                        </Space>
                                        <Divider type="vertical" style={{ margin: 0 }} />
                                        <Space size={4}>
                                            <Text type="secondary" style={{ fontSize: '13px' }}>ID:</Text>
                                            <Text code style={{ fontSize: '12px', padding: '2px 6px' }}>{formatFieldValue(facility.name)}</Text>
                                        </Space>
                                    </Space>
                                </div>

                                <Space direction="vertical" size="small" style={{ width: '100%' }}>
                                    <div style={{ display: 'flex', paddingBottom: '8px', borderBottom: '1px solid #f0f0f0' }}>
                                        <Text type="secondary" style={{ width: '140px', fontSize: '13px' }}>Facility Type</Text>
                                        <Text strong style={{ fontSize: '13px' }}>{formatFieldValue(facility.facility_type)}</Text>
                                    </div>
                                    <div style={{ display: 'flex', paddingBottom: '8px', borderBottom: '1px solid #f0f0f0' }}>
                                        <Text type="secondary" style={{ width: '140px', fontSize: '13px' }}>Category</Text>
                                        <Text strong style={{ fontSize: '13px' }}>{formatFieldValue(facility.category)}</Text>
                                    </div>
                                    <div style={{ display: 'flex', paddingBottom: '8px', borderBottom: '1px solid #f0f0f0' }}>
                                        <Text type="secondary" style={{ width: '140px', fontSize: '13px' }}>Industry</Text>
                                        <Text strong style={{ fontSize: '13px' }}>{formatFieldValue(facility.industry)}</Text>
                                    </div>
                                    <div style={{ display: 'flex', paddingBottom: '8px' }}>
                                        <Text type="secondary" style={{ width: '140px', fontSize: '13px' }}>Organization</Text>
                                        <Text strong style={{ fontSize: '13px' }}>{formatFieldValue(facility.organization_company)}</Text>
                                    </div>
                                </Space>
                            </Card>

                            {/* Ownership & Registration */}
                            <Card
                                title={<Text strong style={{ fontSize: '14px' }}>Ownership & Registration</Text>}
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
                                        <Text type="secondary" style={{ width: '180px', fontSize: '13px' }}>Facility Owner</Text>
                                        <Text style={{ fontSize: '13px' }}>{formatFieldValue(facility.facility_owner)}</Text>
                                    </div>
                                    <div style={{ display: 'flex', paddingBottom: '6px' }}>
                                        <Text type="secondary" style={{ width: '180px', fontSize: '13px' }}>Administrator</Text>
                                        <Text style={{ fontSize: '13px' }}>{formatFieldValue(facility.facility_administrator)}</Text>
                                    </div>
                                    <div style={{ display: 'flex', paddingBottom: '6px' }}>
                                        <Text type="secondary" style={{ width: '180px', fontSize: '13px' }}>Board Registration</Text>
                                        <Text code style={{ fontSize: '12px', padding: '2px 6px' }}>{formatFieldValue(facility.board_registration_number)}</Text>
                                    </div>
                                    <div style={{ display: 'flex' }}>
                                        <Text type="secondary" style={{ width: '180px', fontSize: '13px' }}>Registration Number</Text>
                                        <Text code style={{ fontSize: '12px', padding: '2px 6px' }}>{formatFieldValue(facility.registration_number)}</Text>
                                    </div>
                                </Space>
                            </Card>
                        </Space>
                    </TabPane>

                    {/* Tab 2: Location & Contact */}
                    <TabPane
                        tab={<Space><EnvironmentOutlined />Location & Contact</Space>}
                        key="2"
                    >
                        <Row gutter={[16, 16]}>
                            {/* Right Side - Map (3/4 width) */}
                            <Col xs={24} lg={18} style={{ order: 2 }}>
                                {facility.latitude && facility.longitude ? (
                                    <Card title="Facility Location Map" size="small" style={{ height: '100%' }}>
                                        <FacilityMap
                                            latitude={facility.latitude}
                                            longitude={typeof facility.longitude === 'string' ? parseFloat(facility.longitude) : facility.longitude}
                                            facilityName={facility.facility_name}
                                            height={500}
                                        />
                                    </Card>
                                ) : (
                                    <Card
                                        title="Facility Location Map"
                                        size="small"
                                        style={{
                                            height: '100%',
                                            minHeight: '500px',
                                            display: 'flex',
                                            flexDirection: 'column'
                                        }}
                                    >
                                        <div style={{
                                            flex: 1,
                                            display: 'flex',
                                            flexDirection: 'column',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            padding: '40px',
                                            background: '#fafafa',
                                            borderRadius: '8px',
                                            border: '2px dashed #d9d9d9'
                                        }}>
                                            <EnvironmentOutlined style={{ fontSize: 64, color: '#bfbfbf', marginBottom: 16 }} />
                                            <Text strong style={{ fontSize: 16, marginBottom: 8 }}>
                                                Location Coordinates Not Available
                                            </Text>
                                            <Text type="secondary" style={{ textAlign: 'center', maxWidth: 400 }}>
                                                Geographic coordinates (latitude and longitude) have not been recorded for this facility.
                                                Please update the facility details with location data to view the map.
                                            </Text>
                                        </div>
                                    </Card>
                                )}
                            </Col>

                            {/* Left Side - Location & Contact Details (1/4 width) */}
                            <Col xs={24} lg={6} style={{ order: 1 }}>
                                <Space direction="vertical" size="small" style={{ width: '100%' }}>
                                    {/* Location Details */}
                                    <Card
                                        title={<Text strong style={{ fontSize: '14px' }}><EnvironmentOutlined /> Location</Text>}
                                        size="small"
                                        bordered={false}
                                        style={{
                                            boxShadow: '0 1px 2px rgba(0,0,0,0.06)',
                                            borderRadius: '8px'
                                        }}
                                    >
                                        <Space direction="vertical" size={4} style={{ width: '100%' }}>
                                            <div>
                                                <Text type="secondary" style={{ fontSize: '12px' }}>County</Text>
                                                <div><Text style={{ fontSize: '13px' }}>{formatFieldValue(facility.county)}</Text></div>
                                            </div>
                                            <Divider style={{ margin: '6px 0' }} />
                                            <div>
                                                <Text type="secondary" style={{ fontSize: '12px' }}>Sub-County</Text>
                                                <div><Text style={{ fontSize: '13px' }}>{formatFieldValue(facility.sub_county)}</Text></div>
                                            </div>
                                            <Divider style={{ margin: '6px 0' }} />
                                            <div>
                                                <Text type="secondary" style={{ fontSize: '12px' }}>Constituency</Text>
                                                <div><Text style={{ fontSize: '13px' }}>{formatFieldValue(facility.constituency)}</Text></div>
                                            </div>
                                            <Divider style={{ margin: '6px 0' }} />
                                            <div>
                                                <Text type="secondary" style={{ fontSize: '12px' }}>Ward</Text>
                                                <div><Text style={{ fontSize: '13px' }}>{formatFieldValue(facility.ward)}</Text></div>
                                            </div>
                                            {(facility.latitude || facility.longitude) && (
                                                <>
                                                    <Divider style={{ margin: '6px 0' }} />
                                                    <div>
                                                        <Text type="secondary" style={{ fontSize: '12px' }}>Coordinates</Text>
                                                        <div>
                                                            {facility.latitude && <Text code style={{ fontSize: '11px' }}>{facility.latitude}</Text>}
                                                            {facility.latitude && facility.longitude && <span>, </span>}
                                                            {facility.longitude && <Text code style={{ fontSize: '11px' }}>{facility.longitude}</Text>}
                                                        </div>
                                                    </div>
                                                </>
                                            )}
                                        </Space>
                                    </Card>

                                    {/* Contact Information */}
                                    <Card
                                        title={<Text strong style={{ fontSize: '14px' }}><PhoneOutlined /> Contact</Text>}
                                        size="small"
                                        bordered={false}
                                        style={{
                                            boxShadow: '0 1px 2px rgba(0,0,0,0.06)',
                                            borderRadius: '8px'
                                        }}
                                    >
                                        <Space direction="vertical" size={4} style={{ width: '100%' }}>
                                            <div>
                                                <Text type="secondary" style={{ fontSize: '12px' }}>Phone</Text>
                                                <div>
                                                    {(() => {
                                                        const phoneData = formatPhone(facility.phone);
                                                        return phoneData.href ? (
                                                            <a href={phoneData.href} style={{ fontSize: '13px' }}>{phoneData.value}</a>
                                                        ) : (
                                                            <Text type="secondary" style={{ fontSize: '13px' }}>{phoneData.value}</Text>
                                                        );
                                                    })()}
                                                </div>
                                            </div>
                                            <Divider style={{ margin: '6px 0' }} />
                                            <div>
                                                <Text type="secondary" style={{ fontSize: '12px' }}>Email</Text>
                                                <div>
                                                    {(() => {
                                                        const emailData = formatEmail(facility.email);
                                                        return emailData.href ? (
                                                            <a href={emailData.href} style={{ fontSize: '13px' }}>{emailData.value}</a>
                                                        ) : (
                                                            <Text type="secondary" style={{ fontSize: '13px' }}>{emailData.value}</Text>
                                                        );
                                                    })()}
                                                </div>
                                            </div>
                                            <Divider style={{ margin: '6px 0' }} />
                                            <div>
                                                <Text type="secondary" style={{ fontSize: '12px' }}>Website</Text>
                                                <div>
                                                    {(() => {
                                                        const websiteData = formatWebsite(facility.website);
                                                        return websiteData.href ? (
                                                            <a href={websiteData.href} target="_blank" rel="noopener noreferrer" style={{ fontSize: '13px' }}>
                                                                {websiteData.value}
                                                            </a>
                                                        ) : (
                                                            <Text type="secondary" style={{ fontSize: '13px' }}>{websiteData.value}</Text>
                                                        );
                                                    })()}
                                                </div>
                                            </div>
                                        </Space>
                                    </Card>
                                </Space>
                            </Col>
                        </Row>
                    </TabPane>

                    {/* Tab 3: Operations & Capacity */}
                    <TabPane
                        tab={<Space><MedicineBoxOutlined />Operations & Capacity</Space>}
                        key="3"
                    >
                        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                            {/* Bed Capacity Statistics */}
                            <div style={{ display: 'flex', gap: '12px' }}>
                                <Card
                                    size="small"
                                    bordered={false}
                                    style={{
                                        flex: 1,
                                        borderRadius: '8px',
                                        boxShadow: '0 1px 2px rgba(0,0,0,0.06)',
                                        background: '#f0f9ff'
                                    }}
                                >
                                    <Space align="center">
                                        <div style={{
                                            width: '40px',
                                            height: '40px',
                                            borderRadius: '8px',
                                            background: '#1890ff',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center'
                                        }}>
                                            <MedicineBoxOutlined style={{ color: '#fff', fontSize: '20px' }} />
                                        </div>
                                        <div>
                                            <Text type="secondary" style={{ fontSize: '12px', display: 'block' }}>Bed Capacity</Text>
                                            <Text strong style={{ fontSize: '20px', color: '#1890ff' }}>{facility.bed_capacity || 'N/A'}</Text>
                                        </div>
                                    </Space>
                                </Card>
                                <Card
                                    size="small"
                                    bordered={false}
                                    style={{
                                        flex: 1,
                                        borderRadius: '8px',
                                        boxShadow: '0 1px 2px rgba(0,0,0,0.06)',
                                        background: '#f6ffed'
                                    }}
                                >
                                    <Space align="center">
                                        <div style={{
                                            width: '40px',
                                            height: '40px',
                                            borderRadius: '8px',
                                            background: '#52c41a',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center'
                                        }}>
                                            <HomeOutlined style={{ color: '#fff', fontSize: '20px' }} />
                                        </div>
                                        <div>
                                            <Text type="secondary" style={{ fontSize: '12px', display: 'block' }}>Max Allocation</Text>
                                            <Text strong style={{ fontSize: '20px', color: '#52c41a' }}>{facility.maximum_bed_allocation || 'N/A'}</Text>
                                        </div>
                                    </Space>
                                </Card>
                            </div>

                            {/* Operating Hours */}
                            <Card
                                title={<Text strong style={{ fontSize: '14px' }}><ClockCircleOutlined /> Operating Hours</Text>}
                                size="small"
                                bordered={false}
                                style={{
                                    borderRadius: '8px',
                                    boxShadow: '0 1px 2px rgba(0,0,0,0.06)'
                                }}
                            >
                                <Space direction="vertical" size="small" style={{ width: '100%' }}>
                                    {[
                                        { label: '24/7 Operations', value: facility.open_whole_day },
                                        { label: 'Public Holidays', value: facility.open_public_holiday },
                                        { label: 'Weekends', value: facility.open_weekends },
                                        { label: 'Late Night', value: facility.open_late_night },
                                    ].map((item, index) => {
                                        const yesNo = formatYesNo(item.value);
                                        const isOpen = yesNo.status === 'success';

                                        return (
                                            <div key={index} style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'space-between',
                                                padding: '8px 0',
                                                borderBottom: index < 3 ? '1px solid #f0f0f0' : 'none'
                                            }}>
                                                <Text style={{ fontSize: '13px' }}>{item.label}</Text>
                                                <Tag
                                                    color={isOpen ? 'success' : 'default'}
                                                    style={{
                                                        margin: 0,
                                                        borderRadius: '4px',
                                                        padding: '2px 8px'
                                                    }}
                                                >
                                                    {yesNo.text}
                                                </Tag>
                                            </div>
                                        );
                                    })}
                                </Space>
                            </Card>
                        </Space>
                    </TabPane>

                    {/* Tab 4: Administrative */}
                    <TabPane
                        tab={<Space><TeamOutlined />Administrative</Space>}
                        key="4"
                    >
                        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                            {/* Ownership & Administration */}
                            <Card
                                title={<Text strong style={{ fontSize: '14px' }}>Administration</Text>}
                                size="small"
                                bordered={false}
                                style={{
                                    borderRadius: '8px',
                                    boxShadow: '0 1px 2px rgba(0,0,0,0.06)'
                                }}
                            >
                                <Space direction="vertical" size="small" style={{ width: '100%' }}>
                                    <div style={{ display: 'flex', paddingBottom: '8px', borderBottom: '1px solid #f0f0f0' }}>
                                        <Text type="secondary" style={{ width: '180px', fontSize: '13px' }}>Facility Owner</Text>
                                        <Text strong style={{ fontSize: '13px' }}>{formatFieldValue(facility.facility_owner)}</Text>
                                    </div>
                                    <div style={{ display: 'flex', paddingBottom: '8px', borderBottom: '1px solid #f0f0f0' }}>
                                        <Text type="secondary" style={{ width: '180px', fontSize: '13px' }}>Administrator</Text>
                                        <Text strong style={{ fontSize: '13px' }}>{formatFieldValue(facility.facility_administrator)}</Text>
                                    </div>
                                    <div style={{ display: 'flex', paddingBottom: '8px', borderBottom: '1px solid #f0f0f0' }}>
                                        <Text type="secondary" style={{ width: '180px', fontSize: '13px' }}>Organization</Text>
                                        <Text strong style={{ fontSize: '13px' }}>{formatFieldValue(facility.organization_company)}</Text>
                                    </div>
                                    <div style={{ display: 'flex', paddingBottom: '8px', borderBottom: '1px solid #f0f0f0' }}>
                                        <Text type="secondary" style={{ width: '180px', fontSize: '13px' }}>Board Registration</Text>
                                        <Text code style={{ fontSize: '12px', padding: '2px 6px' }}>{formatFieldValue(facility.board_registration_number)}</Text>
                                    </div>
                                    <div style={{ display: 'flex', paddingBottom: '8px' }}>
                                        <Text type="secondary" style={{ width: '180px', fontSize: '13px' }}>Registration Number</Text>
                                        <Text code style={{ fontSize: '12px', padding: '2px 6px' }}>{formatFieldValue(facility.registration_number)}</Text>
                                    </div>
                                </Space>
                            </Card>

                            {/* Banking Information - Card Grid */}
                            {facility.bank_accounts && facility.bank_accounts.length > 0 && (
                                <Card
                                    title={
                                        <Space>
                                            <BankOutlined />
                                            <span>Banking Information</span>
                                        </Space>
                                    }
                                    bordered={false}
                                >
                                    <Row gutter={[16, 16]}>
                                        {facility.bank_accounts.map((account, index) => (
                                            <Col xs={24} lg={12} key={`bank-${index}`}>
                                                <Card
                                                    size="small"
                                                    bordered={false}
                                                    style={{
                                                        background: '#fafafa',
                                                        border: '1px solid #d9d9d9'
                                                    }}
                                                >
                                                    <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                                            <Space>
                                                                <BankOutlined style={{ fontSize: 20, color: '#1890ff' }} />
                                                                <Text strong style={{ fontSize: 16 }}>
                                                                    {account.bank_name}
                                                                </Text>
                                                            </Space>
                                                            <Badge
                                                                count={index + 1}
                                                                style={{
                                                                    backgroundColor: '#1890ff'
                                                                }}
                                                            />
                                                        </div>
                                                        <Divider style={{ margin: 0 }} />
                                                        <Space direction="vertical" size="small" style={{ width: '100%' }}>
                                                            <div>
                                                                <Text type="secondary" style={{ fontSize: 12 }}>
                                                                    Account Name
                                                                </Text>
                                                                <div>
                                                                    <Text strong>{account.account_name}</Text>
                                                                </div>
                                                            </div>
                                                            <div>
                                                                <Text type="secondary" style={{ fontSize: 12 }}>
                                                                    Account Number
                                                                </Text>
                                                                <div>
                                                                    <Text code style={{ fontSize: 13 }}>
                                                                        {account.account_number}
                                                                    </Text>
                                                                </div>
                                                            </div>
                                                            {account.branch && (
                                                                <div>
                                                                    <Text type="secondary" style={{ fontSize: 12 }}>
                                                                        Branch
                                                                    </Text>
                                                                    <div>
                                                                        <Tag>{account.branch}</Tag>
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </Space>
                                                    </Space>
                                                </Card>
                                            </Col>
                                        ))}
                                    </Row>
                                </Card>
                            )}

                            {/* Facility Contacts */}
                            {facility.contacts && facility.contacts.length > 0 && (
                                <Card
                                    title={
                                        <Space>
                                            <TeamOutlined />
                                            <span>Facility Contacts</span>
                                        </Space>
                                    }
                                    bordered={false}
                                    style={{
                                        borderRadius: '8px',
                                        boxShadow: '0 1px 4px rgba(0,0,0,0.08)'
                                    }}
                                >
                                    <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                                        {facility.contacts.map((contact, index) => {
                                            const phoneData = formatPhone(contact.phone);
                                            const emailData = formatEmail(contact.email);

                                            return (
                                                <Card
                                                    key={`contact-${index}`}
                                                    size="small"
                                                    bordered={false}
                                                    style={{
                                                        background: '#fafafa',
                                                        border: '1px solid #e8e8e8',
                                                        boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                                                        transition: 'all 0.3s ease'
                                                    }}
                                                    onMouseEnter={(e) => {
                                                        e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
                                                    }}
                                                    onMouseLeave={(e) => {
                                                        e.currentTarget.style.boxShadow = '0 1px 2px rgba(0,0,0,0.05)';
                                                    }}
                                                >
                                                    <Space direction="vertical" size="small" style={{ width: '100%' }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                            <UserOutlined style={{ color: '#1890ff' }} />
                                                            <Text strong>{contact.contact_name}</Text>
                                                            {contact.designation && (
                                                                <Tag color="blue" style={{ marginLeft: 'auto' }}>
                                                                    {contact.designation}
                                                                </Tag>
                                                            )}
                                                        </div>
                                                        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                                                            <Space size="small">
                                                                <PhoneOutlined style={{ color: '#52c41a' }} />
                                                                {phoneData.href ? (
                                                                    <a href={phoneData.href} style={{ color: '#1890ff' }}>
                                                                        {phoneData.value}
                                                                    </a>
                                                                ) : (
                                                                    <Text type="secondary">{phoneData.value}</Text>
                                                                )}
                                                            </Space>
                                                            <Space size="small">
                                                                <MailOutlined style={{ color: '#1890ff' }} />
                                                                {emailData.href ? (
                                                                    <a href={emailData.href} style={{ color: '#1890ff' }}>
                                                                        {emailData.value}
                                                                    </a>
                                                                ) : (
                                                                    <Text type="secondary">{emailData.value}</Text>
                                                                )}
                                                            </Space>
                                                        </div>
                                                    </Space>
                                                </Card>
                                            );
                                        })}
                                    </Space>
                                </Card>
                            )}
                        </Space>
                    </TabPane>

                    {/* Tab 5: Services */}
                    {facility.services && facility.services.length > 0 && (
                        <TabPane
                            tab={<Space><MedicineBoxOutlined />Services</Space>}
                            key="5"
                        >
                            <Card
                                title={
                                    <Space>
                                        <MedicineBoxOutlined />
                                        <span>Available Services ({facility.services.length})</span>
                                    </Space>
                                }
                                bordered={false}
                                style={{
                                    borderRadius: '8px',
                                    boxShadow: '0 1px 4px rgba(0,0,0,0.08)'
                                }}
                            >
                                <Row gutter={[16, 16]}>
                                    {facility.services.map((service, index) => (
                                        <Col xs={24} sm={12} lg={8} key={`service-${index}`}>
                                            <Card
                                                bordered={false}
                                                style={{
                                                    height: '100%',
                                                    background: '#fafafa',
                                                    border: '1px solid #e8e8e8',
                                                    boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                                                    transition: 'all 0.3s ease',
                                                    cursor: 'pointer'
                                                }}
                                                onMouseEnter={(e) => {
                                                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
                                                    e.currentTarget.style.transform = 'translateY(-2px)';
                                                }}
                                                onMouseLeave={(e) => {
                                                    e.currentTarget.style.boxShadow = '0 1px 2px rgba(0,0,0,0.05)';
                                                    e.currentTarget.style.transform = 'translateY(0)';
                                                }}
                                            >
                                                <Space direction="vertical" size="small" style={{ width: '100%' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                        <CheckCircleOutlined style={{ color: '#52c41a', fontSize: '16px' }} />
                                                        <Text strong style={{ fontSize: '14px' }}>
                                                            {service.service_name}
                                                        </Text>
                                                    </div>
                                                    {service.description && (
                                                        <Text type="secondary" style={{ fontSize: '12px' }}>
                                                            {service.description}
                                                        </Text>
                                                    )}
                                                </Space>
                                            </Card>
                                        </Col>
                                    ))}
                                </Row>
                            </Card>
                        </TabPane>
                    )}
                </Tabs>
            ) : null}
        </ModuleDetailDrawer>
    );
};

export default FacilityDetailDrawer;

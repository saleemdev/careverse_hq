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
                        <Space direction="vertical" size="large" style={{ width: '100%' }}>
                            {/* Metric Cards - Clean Design */}
                            <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', flexWrap: 'wrap' }}>
                                {/* Services Count */}
                                <div
                                    style={{
                                        flex: '1 1 calc(25% - 12px)',
                                        minWidth: '120px',
                                        backgroundColor: '#fff',
                                        border: '1px solid #e8e8e8',
                                        borderRadius: '8px',
                                        padding: '16px 12px',
                                        textAlign: 'center',
                                        boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                                        transition: 'all 0.3s ease',
                                        cursor: 'pointer'
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
                                        e.currentTarget.style.transform = 'translateY(-2px)';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.05)';
                                        e.currentTarget.style.transform = 'translateY(0)';
                                    }}
                                >
                                    <div style={{ fontSize: '24px', color: '#52c41a' }}>
                                        <MedicineBoxOutlined />
                                    </div>
                                    <div style={{
                                        fontSize: '11px',
                                        color: '#999',
                                        fontWeight: '500',
                                        letterSpacing: '0.5px',
                                        textTransform: 'uppercase',
                                        margin: '8px 0 4px 0'
                                    }}>
                                        Services
                                    </div>
                                    <div style={{
                                        fontSize: '28px',
                                        fontWeight: '700',
                                        color: '#52c41a',
                                        lineHeight: '1'
                                    }}>
                                        {facility.services?.length || 0}
                                    </div>
                                </div>

                                {/* Bed Capacity */}
                                <div
                                    style={{
                                        flex: '1 1 calc(25% - 12px)',
                                        minWidth: '120px',
                                        backgroundColor: '#fff',
                                        border: '1px solid #e8e8e8',
                                        borderRadius: '8px',
                                        padding: '16px 12px',
                                        textAlign: 'center',
                                        boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                                        transition: 'all 0.3s ease',
                                        cursor: 'pointer'
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
                                        e.currentTarget.style.transform = 'translateY(-2px)';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.05)';
                                        e.currentTarget.style.transform = 'translateY(0)';
                                    }}
                                >
                                    <div style={{ fontSize: '24px', color: '#1890ff' }}>
                                        <HomeOutlined />
                                    </div>
                                    <div style={{
                                        fontSize: '11px',
                                        color: '#999',
                                        fontWeight: '500',
                                        letterSpacing: '0.5px',
                                        textTransform: 'uppercase',
                                        margin: '8px 0 4px 0'
                                    }}>
                                        Bed Capacity
                                    </div>
                                    <div style={{
                                        fontSize: '28px',
                                        fontWeight: '700',
                                        color: '#1890ff',
                                        lineHeight: '1'
                                    }}>
                                        {facility.bed_capacity || 'N/A'}
                                    </div>
                                </div>

                                {/* Contacts */}
                                <div
                                    style={{
                                        flex: '1 1 calc(25% - 12px)',
                                        minWidth: '120px',
                                        backgroundColor: '#fff',
                                        border: '1px solid #e8e8e8',
                                        borderRadius: '8px',
                                        padding: '16px 12px',
                                        textAlign: 'center',
                                        boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                                        transition: 'all 0.3s ease',
                                        cursor: 'pointer'
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
                                        e.currentTarget.style.transform = 'translateY(-2px)';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.05)';
                                        e.currentTarget.style.transform = 'translateY(0)';
                                    }}
                                >
                                    <div style={{ fontSize: '24px', color: '#722ed1' }}>
                                        <TeamOutlined />
                                    </div>
                                    <div style={{
                                        fontSize: '11px',
                                        color: '#999',
                                        fontWeight: '500',
                                        letterSpacing: '0.5px',
                                        textTransform: 'uppercase',
                                        margin: '8px 0 4px 0'
                                    }}>
                                        Contacts
                                    </div>
                                    <div style={{
                                        fontSize: '28px',
                                        fontWeight: '700',
                                        color: '#722ed1',
                                        lineHeight: '1'
                                    }}>
                                        {facility.contacts?.length || 0}
                                    </div>
                                </div>

                                {/* KEPHL Level */}
                                <div
                                    style={{
                                        flex: '1 1 calc(25% - 12px)',
                                        minWidth: '120px',
                                        backgroundColor: '#fff',
                                        border: '1px solid #e8e8e8',
                                        borderRadius: '8px',
                                        padding: '16px 12px',
                                        textAlign: 'center',
                                        boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                                        transition: 'all 0.3s ease',
                                        cursor: 'pointer'
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
                                        e.currentTarget.style.transform = 'translateY(-2px)';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.05)';
                                        e.currentTarget.style.transform = 'translateY(0)';
                                    }}
                                >
                                    <div style={{ fontSize: '24px', color: '#faad14' }}>
                                        <SafetyOutlined />
                                    </div>
                                    <div style={{
                                        fontSize: '11px',
                                        color: '#999',
                                        fontWeight: '500',
                                        letterSpacing: '0.5px',
                                        textTransform: 'uppercase',
                                        margin: '8px 0 4px 0'
                                    }}>
                                        KEPHL Level
                                    </div>
                                    <div style={{
                                        fontSize: '28px',
                                        fontWeight: '700',
                                        color: '#faad14',
                                        lineHeight: '1'
                                    }}>
                                        {kephlBadge ? kephlBadge.text : 'N/A'}
                                    </div>
                                </div>
                            </div>

                            {/* Primary Information - Single Gradient Hero */}
                            <Card
                                style={{
                                    borderRadius: '12px',
                                    border: 'none',
                                    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                                    background: 'linear-gradient(135deg, #f0f5ff 0%, #e6f2ff 100%)',
                                    marginBottom: '24px'
                                }}
                            >
                                <Row gutter={[24, 16]}>
                                    <Col xs={24} md={8}>
                                        <div style={{ marginBottom: '4px', fontSize: '11px', color: '#8c8c8c', fontWeight: 600, textTransform: 'uppercase' }}>
                                            Facility Name
                                        </div>
                                        <div style={{ fontSize: '16px', fontWeight: '600' }}>
                                            {facility.facility_name}
                                        </div>
                                    </Col>

                                    <Col xs={24} md={8}>
                                        <div style={{ marginBottom: '4px', fontSize: '11px', color: '#8c8c8c', fontWeight: 600, textTransform: 'uppercase' }}>
                                            MFL Code
                                        </div>
                                        <div style={{ fontSize: '16px', fontWeight: '600' }}>
                                            {formatFieldValue(facility.facility_mfl)}
                                        </div>
                                    </Col>

                                    <Col xs={24} md={8}>
                                        <div style={{ marginBottom: '4px', fontSize: '11px', color: '#8c8c8c', fontWeight: 600, textTransform: 'uppercase' }}>
                                            Facility ID
                                        </div>
                                        <div style={{ fontSize: '16px', fontWeight: '600', wordBreak: 'break-all' }}>
                                            {formatFieldValue(facility.name)}
                                        </div>
                                    </Col>

                                    <Col xs={24} md={8}>
                                        <div style={{ marginBottom: '4px', fontSize: '11px', color: '#8c8c8c', fontWeight: 600, textTransform: 'uppercase' }}>
                                            Facility Type
                                        </div>
                                        <div style={{ fontSize: '16px', fontWeight: '600' }}>
                                            {formatFieldValue(facility.facility_type)}
                                        </div>
                                    </Col>

                                    <Col xs={24} md={8}>
                                        <div style={{ marginBottom: '4px', fontSize: '11px', color: '#8c8c8c', fontWeight: 600, textTransform: 'uppercase' }}>
                                            Category
                                        </div>
                                        <div style={{ fontSize: '16px', fontWeight: '600' }}>
                                            {formatFieldValue(facility.category)}
                                        </div>
                                    </Col>

                                    <Col xs={24} md={8}>
                                        <div style={{ marginBottom: '4px', fontSize: '11px', color: '#8c8c8c', fontWeight: 600, textTransform: 'uppercase' }}>
                                            Organization
                                        </div>
                                        <div style={{ fontSize: '16px', fontWeight: '600' }}>
                                            {formatFieldValue(facility.organization_company)}
                                        </div>
                                    </Col>
                                </Row>

                                {/* Accent bar */}
                                <div style={{
                                    width: '40px',
                                    height: '3px',
                                    background: '#1890ff',
                                    marginTop: '16px',
                                    borderRadius: '2px'
                                }} />
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
                                <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                                    {/* Location Details */}
                                    <Card title="Location Details" size="small">
                                        <Descriptions bordered column={1} size="small">
                                            <Descriptions.Item label={<Space><EnvironmentOutlined />County</Space>}>
                                                {formatFieldValue(facility.county)}
                                            </Descriptions.Item>
                                            <Descriptions.Item label="Sub-County">
                                                {formatFieldValue(facility.sub_county)}
                                            </Descriptions.Item>
                                            <Descriptions.Item label="Constituency">
                                                {formatFieldValue(facility.constituency)}
                                            </Descriptions.Item>
                                            <Descriptions.Item label="Ward">
                                                {formatFieldValue(facility.ward)}
                                            </Descriptions.Item>
                                            <Descriptions.Item label="Latitude">
                                                {facility.latitude ? (
                                                    <Text code>{facility.latitude}</Text>
                                                ) : 'N/A'}
                                            </Descriptions.Item>
                                            <Descriptions.Item label="Longitude">
                                                {facility.longitude ? (
                                                    <Text code>{facility.longitude}</Text>
                                                ) : 'N/A'}
                                            </Descriptions.Item>
                                        </Descriptions>
                                    </Card>

                                    {/* Contact Information */}
                                    <Card title="Contact Information" size="small">
                                        <Descriptions bordered column={1} size="small">
                                            <Descriptions.Item label={<Space><PhoneOutlined />Phone</Space>}>
                                                {(() => {
                                                    const phoneData = formatPhone(facility.phone);
                                                    return phoneData.href ? (
                                                        <a href={phoneData.href} style={{ color: '#1890ff' }}>{phoneData.value}</a>
                                                    ) : (
                                                        <span style={{ color: '#999' }}>{phoneData.value}</span>
                                                    );
                                                })()}
                                            </Descriptions.Item>
                                            <Descriptions.Item label={<Space><MailOutlined />Email</Space>}>
                                                {(() => {
                                                    const emailData = formatEmail(facility.email);
                                                    return emailData.href ? (
                                                        <a href={emailData.href} style={{ color: '#1890ff' }}>{emailData.value}</a>
                                                    ) : (
                                                        <span style={{ color: '#999' }}>{emailData.value}</span>
                                                    );
                                                })()}
                                            </Descriptions.Item>
                                            <Descriptions.Item label={<Space><GlobalOutlined />Website</Space>}>
                                                {(() => {
                                                    const websiteData = formatWebsite(facility.website);
                                                    return websiteData.href ? (
                                                        <a href={websiteData.href} target="_blank" rel="noopener noreferrer" style={{ color: '#1890ff' }}>
                                                            {websiteData.value}
                                                        </a>
                                                    ) : (
                                                        <span style={{ color: '#999' }}>{websiteData.value}</span>
                                                    );
                                                })()}
                                            </Descriptions.Item>
                                        </Descriptions>
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
                        <Space direction="vertical" size="large" style={{ width: '100%' }}>
                            {/* Bed Capacity Statistics */}
                            <Card
                                bordered={false}
                                style={{
                                    borderRadius: '8px',
                                    boxShadow: '0 1px 4px rgba(0,0,0,0.08)'
                                }}
                            >
                                <Row gutter={[24, 16]}>
                                    <Col xs={24} sm={12}>
                                        <Statistic
                                            title="Current Bed Capacity"
                                            value={facility.bed_capacity || 'N/A'}
                                            prefix={<MedicineBoxOutlined style={{ color: '#1890ff' }} />}
                                            valueStyle={{ color: '#1890ff' }}
                                        />
                                    </Col>
                                    <Col xs={24} sm={12}>
                                        <Statistic
                                            title="Maximum Bed Allocation"
                                            value={facility.maximum_bed_allocation || 'N/A'}
                                            prefix={<HomeOutlined style={{ color: '#52c41a' }} />}
                                            valueStyle={{ color: '#52c41a' }}
                                        />
                                    </Col>
                                </Row>
                            </Card>

                            {/* Operating Hours - Visual Cards */}
                            <Card
                                title={
                                    <Space>
                                        <ClockCircleOutlined />
                                        <span>Operating Hours & Availability</span>
                                    </Space>
                                }
                                bordered={false}
                            >
                                <Row gutter={[16, 16]}>
                                    {[
                                        {
                                            label: '24/7 Operations',
                                            value: facility.open_whole_day,
                                            icon: ClockCircleOutlined,
                                            color: '#1890ff'
                                        },
                                        {
                                            label: 'Public Holidays',
                                            value: facility.open_public_holiday,
                                            icon: CalendarOutlined,
                                            color: '#52c41a'
                                        },
                                        {
                                            label: 'Weekends',
                                            value: facility.open_weekends,
                                            icon: CalendarOutlined,
                                            color: '#722ed1'
                                        },
                                        {
                                            label: 'Late Night',
                                            value: facility.open_late_night,
                                            icon: ClockCircleOutlined,
                                            color: '#fa8c16'
                                        },
                                    ].map((item, index) => {
                                        const yesNo = formatYesNo(item.value);
                                        const isOpen = yesNo.status === 'success';
                                        const Icon = item.icon;

                                        return (
                                            <Col xs={12} sm={6} key={index}>
                                                <Card
                                                    size="small"
                                                    bordered={false}
                                                    style={{
                                                        textAlign: 'center',
                                                        background: isOpen ? '#f6ffed' : '#fff1f0',
                                                        border: `2px solid ${isOpen ? '#b7eb8f' : '#ffccc7'}`,
                                                        height: '100%'
                                                    }}
                                                >
                                                    <Space direction="vertical" size="small" style={{ width: '100%' }}>
                                                        <Badge
                                                            status={isOpen ? 'success' : 'error'}
                                                            style={{ fontSize: 12 }}
                                                        />
                                                        <Icon
                                                            style={{
                                                                fontSize: 32,
                                                                color: isOpen ? '#52c41a' : '#ff4d4f'
                                                            }}
                                                        />
                                                        <Text
                                                            strong
                                                            style={{
                                                                fontSize: 13,
                                                                color: isOpen ? '#52c41a' : '#ff4d4f'
                                                            }}
                                                        >
                                                            {item.label}
                                                        </Text>
                                                        <Tag
                                                            color={isOpen ? 'success' : 'error'}
                                                            style={{ margin: 0 }}
                                                        >
                                                            {yesNo.text}
                                                        </Tag>
                                                    </Space>
                                                </Card>
                                            </Col>
                                        );
                                    })}
                                </Row>
                            </Card>
                        </Space>
                    </TabPane>

                    {/* Tab 4: Administrative */}
                    <TabPane
                        tab={<Space><TeamOutlined />Administrative</Space>}
                        key="4"
                    >
                        <Space direction="vertical" size="large" style={{ width: '100%' }}>
                            {/* Ownership & Administration */}
                            <Card
                                title="Administration"
                                bordered={false}
                                style={{
                                    borderRadius: '8px',
                                    boxShadow: '0 1px 4px rgba(0,0,0,0.08)'
                                }}
                            >
                                <Descriptions column={{ xs: 1, sm: 2 }} bordered size="small">
                                    <Descriptions.Item label="Facility Owner">
                                        {formatFieldValue(facility.facility_owner)}
                                    </Descriptions.Item>
                                    <Descriptions.Item label="Facility Administrator">
                                        {formatFieldValue(facility.facility_administrator)}
                                    </Descriptions.Item>
                                    <Descriptions.Item label="Organization/Company" span={2}>
                                        {formatFieldValue(facility.organization_company)}
                                    </Descriptions.Item>
                                    <Descriptions.Item label="Board Registration">
                                        {formatFieldValue(facility.board_registration_number)}
                                    </Descriptions.Item>
                                    <Descriptions.Item label="Registration Number">
                                        {formatFieldValue(facility.registration_number)}
                                    </Descriptions.Item>
                                </Descriptions>
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

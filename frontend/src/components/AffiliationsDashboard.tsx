/**
 * Affiliations Dashboard Component
 * Displays facility affiliations with status breakdown and pending approval workflow
 */

import { useState, useEffect } from 'react';
import {
    Card,
    Table,
    Tag,
    Button,
    Space,
    Typography,
    Row,
    Col,
    Statistic,
    Select,
    Badge,
    Avatar,
    Spin,
    Tooltip,
    Progress,
    Modal,
    Descriptions,
    Divider,
    theme,
    List,
    Input,
    message,
} from 'antd';
import {
    UserAddOutlined,
    CheckCircleOutlined,
    CloseCircleOutlined,
    ClockCircleOutlined,
    ExclamationCircleOutlined,
    UserOutlined,
    ArrowLeftOutlined,
    ReloadOutlined,
    BankOutlined,
    SearchOutlined,
    EyeOutlined,
    CalendarOutlined,
    TeamOutlined,
    SyncOutlined,
} from '@ant-design/icons';
import { useResponsive } from '../hooks/useResponsive';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

interface AffiliationsDashboardProps {
    navigateToRoute?: (route: string, id?: string) => void;
}

// Status colors mapping
const statusColors: Record<string, string> = {
    'Pending': 'warning',
    'Confirmed': 'processing',
    'Active': 'success',
    'Rejected': 'error',
    'Expired': 'default',
    'Inactive': 'default',
};

// Employment type labels
const employmentTypeLabels: Record<string, string> = {
    'Full-time Employee': 'Full-time',
    'Part-time Employee': 'Part-time',
    'Consultant': 'Consultant',
    'Locum/Temporary': 'Locum',
    'Volunteer': 'Volunteer',
    'Intern/Resident': 'Intern',
    'Contracted': 'Contract',
};

// Mock affiliations data - will be replaced with API data
const mockAffiliations = [
    {
        name: 'FA-00001',
        health_professional: 'HP-00001',
        health_professional_name: 'Dr. Jane Smith',
        health_professional_puid: 'PUID-12345',
        health_facility: 'HF-00001',
        facility_name: 'Nairobi County Referral Hospital',
        facility_level: 'Level 5',
        facility_type: 'Hospital',
        affiliation_status: 'Pending',
        employment_type: 'Full-time Employee',
        designation: 'Medical Officer',
        role: 'Doctor',
        requested_date: '2024-01-18',
        requested_by: 'admin@example.com',
        start_date: null,
        end_date: null,
    },
    {
        name: 'FA-00002',
        health_professional: 'HP-00002',
        health_professional_name: 'Nurse Mary Wanjiku',
        health_professional_puid: 'PUID-12346',
        health_facility: 'HF-00002',
        facility_name: 'Kenyatta National Hospital',
        facility_level: 'Level 6',
        facility_type: 'National Referral',
        affiliation_status: 'Active',
        employment_type: 'Full-time Employee',
        designation: 'Registered Nurse',
        role: 'Nurse',
        requested_date: '2024-01-10',
        requested_by: 'hr@example.com',
        start_date: '2024-01-15',
        end_date: null,
    },
    {
        name: 'FA-00003',
        health_professional: 'HP-00003',
        health_professional_name: 'Dr. Peter Kamau',
        health_professional_puid: 'PUID-12347',
        health_facility: 'HF-00003',
        facility_name: 'Machakos Level 5 Hospital',
        facility_level: 'Level 5',
        facility_type: 'Hospital',
        affiliation_status: 'Pending',
        employment_type: 'Consultant',
        designation: 'Specialist Surgeon',
        role: 'Consultant',
        requested_date: '2024-01-17',
        requested_by: 'admin@machakos.go.ke',
        start_date: null,
        end_date: null,
    },
    {
        name: 'FA-00004',
        health_professional: 'HP-00004',
        health_professional_name: 'Clinical Officer David Ochieng',
        health_professional_puid: 'PUID-12348',
        health_facility: 'HF-00004',
        facility_name: 'Kisumu County Hospital',
        facility_level: 'Level 4',
        facility_type: 'Hospital',
        affiliation_status: 'Confirmed',
        employment_type: 'Full-time Employee',
        designation: 'Clinical Officer',
        role: 'Clinical Officer',
        requested_date: '2024-01-12',
        requested_by: 'hr@kisumu.go.ke',
        start_date: '2024-01-20',
        end_date: null,
    },
    {
        name: 'FA-00005',
        health_professional: 'HP-00005',
        health_professional_name: 'Lab Tech Susan Muthoni',
        health_professional_puid: 'PUID-12349',
        health_facility: 'HF-00001',
        facility_name: 'Nairobi County Referral Hospital',
        facility_level: 'Level 5',
        facility_type: 'Hospital',
        affiliation_status: 'Rejected',
        employment_type: 'Part-time Employee',
        designation: 'Lab Technologist',
        role: 'Lab Tech',
        requested_date: '2024-01-05',
        requested_by: 'admin@example.com',
        start_date: null,
        end_date: null,
    },
    {
        name: 'FA-00006',
        health_professional: 'HP-00006',
        health_professional_name: 'Pharmacist Grace Akinyi',
        health_professional_puid: 'PUID-12350',
        health_facility: 'HF-00005',
        facility_name: 'Mombasa County Hospital',
        facility_level: 'Level 4',
        facility_type: 'Hospital',
        affiliation_status: 'Pending',
        employment_type: 'Locum/Temporary',
        designation: 'Pharmacist',
        role: 'Pharmacist',
        requested_date: '2024-01-19',
        requested_by: 'hr@mombasa.go.ke',
        start_date: null,
        end_date: null,
    },
];

const AffiliationsDashboard: React.FC<AffiliationsDashboardProps> = ({ navigateToRoute }) => {
    const { token } = theme.useToken();
    const { isMobile } = useResponsive();
    const [loading, setLoading] = useState(true);
    const [affiliations, setAffiliations] = useState(mockAffiliations);
    const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);
    const [searchText, setSearchText] = useState('');
    const [selectedAffiliation, setSelectedAffiliation] = useState<any>(null);
    const [detailModalVisible, setDetailModalVisible] = useState(false);

    useEffect(() => {
        loadAffiliations();
    }, []);

    const loadAffiliations = async () => {
        setLoading(true);
        try {
            // TODO: Replace with actual API call
            // const response = await fetch('/api/method/careverse_hq.api.dashboard.get_affiliations');
            // const data = await response.json();
            // setAffiliations(data.message || []);

            // Simulate API delay
            await new Promise(resolve => setTimeout(resolve, 600));
            setAffiliations(mockAffiliations);
        } catch (error) {
            console.error('Failed to load affiliations:', error);
            message.error('Failed to load affiliations');
        } finally {
            setLoading(false);
        }
    };

    // Calculate statistics
    const stats = {
        total: affiliations.length,
        pending: affiliations.filter(a => a.affiliation_status === 'Pending').length,
        active: affiliations.filter(a => a.affiliation_status === 'Active').length,
        confirmed: affiliations.filter(a => a.affiliation_status === 'Confirmed').length,
        rejected: affiliations.filter(a => a.affiliation_status === 'Rejected').length,
        expired: affiliations.filter(a => a.affiliation_status === 'Expired').length,
        inactive: affiliations.filter(a => a.affiliation_status === 'Inactive').length,
    };

    // Filter affiliations
    const filteredAffiliations = affiliations.filter(a => {
        const matchesStatus = !statusFilter || a.affiliation_status === statusFilter;
        const matchesSearch = !searchText ||
            a.health_professional_name?.toLowerCase().includes(searchText.toLowerCase()) ||
            a.facility_name?.toLowerCase().includes(searchText.toLowerCase()) ||
            a.health_professional_puid?.toLowerCase().includes(searchText.toLowerCase());
        return matchesStatus && matchesSearch;
    });

    // Handle view details
    const handleViewDetails = (record: any) => {
        setSelectedAffiliation(record);
        setDetailModalVisible(true);
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'Pending':
                return <ClockCircleOutlined style={{ color: token.colorWarning }} />;
            case 'Active':
                return <CheckCircleOutlined style={{ color: token.colorSuccess }} />;
            case 'Confirmed':
                return <CheckCircleOutlined style={{ color: token.colorInfo }} />;
            case 'Rejected':
                return <CloseCircleOutlined style={{ color: token.colorError }} />;
            case 'Expired':
            case 'Inactive':
                return <ExclamationCircleOutlined style={{ color: token.colorTextDisabled }} />;
            default:
                return null;
        }
    };

    const columns = [
        {
            title: 'Health Professional',
            key: 'professional',
            render: (_: any, record: any) => (
                <Space>
                    <Avatar size="small" icon={<UserOutlined />} style={{ backgroundColor: token.colorPrimary }} />
                    <div>
                        <Text strong style={{ display: 'block', fontSize: '13px' }}>{record.health_professional_name}</Text>
                        <Text type="secondary" style={{ fontSize: '11px' }}>{record.health_professional_puid}</Text>
                    </div>
                </Space>
            ),
        },
        {
            title: 'Health Facility',
            key: 'facility',
            render: (_: any, record: any) => (
                <div>
                    <Text style={{ fontSize: '13px' }}>{record.facility_name}</Text>
                    <div>
                        <Tag color="blue" style={{ fontSize: '10px', marginTop: '2px' }}>{record.facility_level}</Tag>
                        <Tag style={{ fontSize: '10px', marginTop: '2px' }}>{record.facility_type}</Tag>
                    </div>
                </div>
            ),
        },
        {
            title: 'Role / Designation',
            key: 'role',
            render: (_: any, record: any) => (
                <div>
                    <Text style={{ fontSize: '13px' }}>{record.designation || record.role}</Text>
                    <div>
                        <Tag color="purple" style={{ fontSize: '10px', marginTop: '2px' }}>
                            {employmentTypeLabels[record.employment_type] || record.employment_type}
                        </Tag>
                    </div>
                </div>
            ),
        },
        {
            title: 'Status',
            dataIndex: 'affiliation_status',
            key: 'status',
            render: (status: string) => (
                <Tag color={statusColors[status]} icon={getStatusIcon(status)}>
                    {status}
                </Tag>
            ),
        },
        {
            title: 'Requested',
            dataIndex: 'requested_date',
            key: 'requested_date',
            render: (date: string) => date ? dayjs(date).format('DD MMM YYYY') : '-',
        },
        {
            title: 'View',
            key: 'view',
            fixed: 'right' as const,
            width: 80,
            render: (_: any, record: any) => (
                <Tooltip title="View Details">
                    <Button
                        type="text"
                        size="small"
                        icon={<EyeOutlined />}
                        onClick={() => handleViewDetails(record)}
                    />
                </Tooltip>
            ),
        },
    ];

    return (
        <div style={{ padding: isMobile ? '16px' : '24px', background: token.colorBgLayout, minHeight: 'calc(100vh - 64px)' }}>
            {/* Header */}
            <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
                <div>
                    <Button
                        type="text"
                        icon={<ArrowLeftOutlined />}
                        onClick={() => navigateToRoute?.('dashboard')}
                        style={{ marginBottom: '12px', padding: 0 }}
                    >
                        Back to Dashboard
                    </Button>
                    <Title level={2} style={{ margin: 0 }}>Facility Affiliations</Title>
                    <Text type="secondary">Manage health professional affiliations with facilities</Text>
                </div>
                <Space wrap>
                    <Input
                        placeholder="Search professionals or facilities..."
                        prefix={<SearchOutlined />}
                        value={searchText}
                        onChange={(e) => setSearchText(e.target.value)}
                        style={{ width: 250 }}
                        allowClear
                    />
                    <Select
                        placeholder="All Statuses"
                        allowClear
                        value={statusFilter}
                        onChange={setStatusFilter}
                        style={{ width: 150 }}
                        options={[
                            { label: 'Pending', value: 'Pending' },
                            { label: 'Confirmed', value: 'Confirmed' },
                            { label: 'Active', value: 'Active' },
                            { label: 'Rejected', value: 'Rejected' },
                            { label: 'Expired', value: 'Expired' },
                            { label: 'Inactive', value: 'Inactive' },
                        ]}
                    />
                    <Button icon={<ReloadOutlined spin={loading} />} onClick={loadAffiliations}>
                        Refresh
                    </Button>
                </Space>
            </div>

            {/* Statistics Cards */}
            <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
                <Col xs={12} sm={8} md={4}>
                    <Card
                        size="small"
                        style={{
                            borderRadius: '12px',
                            boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
                            border: 'none',
                            textAlign: 'center',
                        }}
                    >
                        <Statistic
                            title={<Text style={{ fontSize: '12px' }}>Total</Text>}
                            value={stats.total}
                            valueStyle={{ color: token.colorPrimary, fontSize: '24px' }}
                            prefix={<TeamOutlined />}
                        />
                    </Card>
                </Col>
                <Col xs={12} sm={8} md={4}>
                    <Card
                        size="small"
                        style={{
                            borderRadius: '12px',
                            boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
                            border: 'none',
                            background: '#fffbe6',
                            textAlign: 'center',
                            cursor: 'pointer',
                        }}
                        onClick={() => setStatusFilter('Pending')}
                    >
                        <Statistic
                            title={<Text style={{ fontSize: '12px' }}>Pending</Text>}
                            value={stats.pending}
                            valueStyle={{ color: token.colorWarning, fontSize: '24px' }}
                            prefix={<ClockCircleOutlined />}
                        />
                    </Card>
                </Col>
                <Col xs={12} sm={8} md={4}>
                    <Card
                        size="small"
                        style={{
                            borderRadius: '12px',
                            boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
                            border: 'none',
                            background: '#e6f7ff',
                            textAlign: 'center',
                            cursor: 'pointer',
                        }}
                        onClick={() => setStatusFilter('Confirmed')}
                    >
                        <Statistic
                            title={<Text style={{ fontSize: '12px' }}>Confirmed</Text>}
                            value={stats.confirmed}
                            valueStyle={{ color: token.colorInfo, fontSize: '24px' }}
                            prefix={<SyncOutlined />}
                        />
                    </Card>
                </Col>
                <Col xs={12} sm={8} md={4}>
                    <Card
                        size="small"
                        style={{
                            borderRadius: '12px',
                            boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
                            border: 'none',
                            background: '#f6ffed',
                            textAlign: 'center',
                            cursor: 'pointer',
                        }}
                        onClick={() => setStatusFilter('Active')}
                    >
                        <Statistic
                            title={<Text style={{ fontSize: '12px' }}>Active</Text>}
                            value={stats.active}
                            valueStyle={{ color: token.colorSuccess, fontSize: '24px' }}
                            prefix={<CheckCircleOutlined />}
                        />
                    </Card>
                </Col>
                <Col xs={12} sm={8} md={4}>
                    <Card
                        size="small"
                        style={{
                            borderRadius: '12px',
                            boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
                            border: 'none',
                            background: '#fff1f0',
                            textAlign: 'center',
                            cursor: 'pointer',
                        }}
                        onClick={() => setStatusFilter('Rejected')}
                    >
                        <Statistic
                            title={<Text style={{ fontSize: '12px' }}>Rejected</Text>}
                            value={stats.rejected}
                            valueStyle={{ color: token.colorError, fontSize: '24px' }}
                            prefix={<CloseCircleOutlined />}
                        />
                    </Card>
                </Col>
                <Col xs={12} sm={8} md={4}>
                    <Card
                        size="small"
                        style={{
                            borderRadius: '12px',
                            boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
                            border: 'none',
                            textAlign: 'center',
                            cursor: 'pointer',
                        }}
                        onClick={() => setStatusFilter(undefined)}
                    >
                        <div style={{ marginBottom: '8px' }}>
                            <Text style={{ fontSize: '12px', color: token.colorTextSecondary }}>Approval Rate</Text>
                        </div>
                        <Progress
                            type="circle"
                            percent={stats.total > 0 ? Math.round(((stats.active + stats.confirmed) / stats.total) * 100) : 0}
                            size={50}
                            strokeColor={token.colorSuccess}
                            format={(percent) => `${percent}%`}
                        />
                    </Card>
                </Col>
            </Row>

            {/* Affiliations Table */}
            <Card
                title={
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Space>
                            <UserAddOutlined />
                            <span>Affiliations List</span>
                        </Space>
                        <Badge count={filteredAffiliations.length} showZero style={{ backgroundColor: token.colorPrimary }} />
                    </div>
                }
                style={{
                    borderRadius: '12px',
                    boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
                    border: 'none',
                }}
            >
                <Table
                    dataSource={filteredAffiliations}
                    columns={columns}
                    rowKey="name"
                    loading={loading}
                    scroll={{ x: 1000 }}
                    pagination={{
                        pageSize: 10,
                        showSizeChanger: true,
                        showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} affiliations`
                    }}
                />
            </Card>

            {/* Detail Modal */}
            <Modal
                title={
                    <Space>
                        <UserAddOutlined />
                        <span>Affiliation Details</span>
                    </Space>
                }
                open={detailModalVisible}
                onCancel={() => setDetailModalVisible(false)}
                footer={
                    selectedAffiliation?.affiliation_status === 'Pending' ? (
                        <Space>
                            <Button onClick={() => setDetailModalVisible(false)}>Close</Button>
                            <Button
                                danger
                                icon={<CloseCircleOutlined />}
                                onClick={() => {
                                    handleReject(selectedAffiliation);
                                    setDetailModalVisible(false);
                                }}
                            >
                                Reject
                            </Button>
                            <Button
                                type="primary"
                                icon={<CheckCircleOutlined />}
                                onClick={() => {
                                    handleConfirm(selectedAffiliation);
                                    setDetailModalVisible(false);
                                }}
                            >
                                Confirm
                            </Button>
                        </Space>
                    ) : (
                        <Button onClick={() => setDetailModalVisible(false)}>Close</Button>
                    )
                }
                width={700}
            >
                {selectedAffiliation && (
                    <>
                        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                            <Avatar size={64} icon={<UserOutlined />} style={{ backgroundColor: token.colorPrimary, marginBottom: '12px' }} />
                            <Title level={4} style={{ margin: 0 }}>{selectedAffiliation.health_professional_name}</Title>
                            <Text type="secondary">{selectedAffiliation.health_professional_puid}</Text>
                            <div style={{ marginTop: '8px' }}>
                                <Tag color={statusColors[selectedAffiliation.affiliation_status]} icon={getStatusIcon(selectedAffiliation.affiliation_status)}>
                                    {selectedAffiliation.affiliation_status}
                                </Tag>
                            </div>
                        </div>

                        <Divider />

                        <Descriptions column={{ xs: 1, sm: 2 }} bordered size="small">
                            <Descriptions.Item label="Affiliation ID">{selectedAffiliation.name}</Descriptions.Item>
                            <Descriptions.Item label="Employment Type">
                                <Tag color="purple">{employmentTypeLabels[selectedAffiliation.employment_type] || selectedAffiliation.employment_type}</Tag>
                            </Descriptions.Item>
                            <Descriptions.Item label="Health Facility" span={2}>
                                <Space>
                                    <BankOutlined />
                                    {selectedAffiliation.facility_name}
                                </Space>
                            </Descriptions.Item>
                            <Descriptions.Item label="Facility Level">{selectedAffiliation.facility_level}</Descriptions.Item>
                            <Descriptions.Item label="Facility Type">{selectedAffiliation.facility_type}</Descriptions.Item>
                            <Descriptions.Item label="Role">{selectedAffiliation.role}</Descriptions.Item>
                            <Descriptions.Item label="Designation">{selectedAffiliation.designation}</Descriptions.Item>
                            <Descriptions.Item label="Requested Date">
                                {selectedAffiliation.requested_date ? dayjs(selectedAffiliation.requested_date).format('DD MMM YYYY') : '-'}
                            </Descriptions.Item>
                            <Descriptions.Item label="Requested By">{selectedAffiliation.requested_by || '-'}</Descriptions.Item>
                            <Descriptions.Item label="Start Date">
                                {selectedAffiliation.start_date ? dayjs(selectedAffiliation.start_date).format('DD MMM YYYY') : '-'}
                            </Descriptions.Item>
                            <Descriptions.Item label="End Date">
                                {selectedAffiliation.end_date ? dayjs(selectedAffiliation.end_date).format('DD MMM YYYY') : '-'}
                            </Descriptions.Item>
                        </Descriptions>
                    </>
                )}
            </Modal>
        </div>
    );
};

export default AffiliationsDashboard;

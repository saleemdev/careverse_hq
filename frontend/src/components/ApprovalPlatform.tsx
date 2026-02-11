/**
 * Approval Platform Component
 * Central approval platform for Purchase Orders, Expense Claims, Material Requests
 * Extends Frappe workflows with enhanced UI
 */

import { useState, useEffect } from 'react';
import {
    Card,
    Table,
    Tag,
    Button,
    Space,
    Typography,
    Tabs,
    Badge,
    Modal,
    Form,
    Input,
    Select,
    Spin,
    message,
    Empty,
    Tooltip,
    Avatar,
    Timeline,
    Descriptions,
    Divider,
    theme,
    Row,
    Col,
    Statistic,
} from 'antd';
import {
    CheckCircleOutlined,
    CloseCircleOutlined,
    ClockCircleOutlined,
    EyeOutlined,
    ShoppingCartOutlined,
    CreditCardOutlined,
    InboxOutlined,
    ExclamationCircleOutlined,
    UserOutlined,
    FileTextOutlined,
    DollarOutlined,
    CalendarOutlined,
    ArrowLeftOutlined,
} from '@ant-design/icons';
import { mockData } from '../services/api';
import { useResponsive } from '../hooks/useResponsive';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

interface ApprovalPlatformProps {
    navigateToRoute?: (route: string, id?: string) => void;
    defaultTab?: string;
}

// Mock pending items data
const mockPendingItems = {
    purchase_orders: [
        {
            id: 'PO-2024-00123',
            title: 'Medical Supplies Procurement',
            requestor: 'Dr. Jane Smith',
            department: 'Health Services',
            amount: 450000,
            date: '2024-01-18',
            priority: 'High',
            status: 'Pending Approval',
        },
        {
            id: 'PO-2024-00124',
            title: 'Office Equipment - Computers',
            requestor: 'John Doe',
            department: 'Administration',
            amount: 280000,
            date: '2024-01-17',
            priority: 'Medium',
            status: 'Pending Approval',
        },
        {
            id: 'PO-2024-00125',
            title: 'Vehicle Maintenance Parts',
            requestor: 'Peter Kamau',
            department: 'Transport',
            amount: 125000,
            date: '2024-01-16',
            priority: 'Low',
            status: 'Pending Approval',
        },
    ],
    expense_claims: [
        {
            id: 'EC-2024-00056',
            title: 'Training Workshop Expenses',
            claimant: 'Mary Wanjiku',
            department: 'Human Resources',
            amount: 35000,
            date: '2024-01-18',
            category: 'Training',
            status: 'Pending Approval',
        },
        {
            id: 'EC-2024-00057',
            title: 'Field Visit - Fuel Reimbursement',
            claimant: 'David Ochieng',
            department: 'Health Services',
            amount: 8500,
            date: '2024-01-17',
            category: 'Travel',
            status: 'Pending Approval',
        },
    ],
    material_requests: [
        {
            id: 'MR-2024-00089',
            title: 'Stationery for Q1 2024',
            requestor: 'Susan Muthoni',
            department: 'Administration',
            items: 25,
            date: '2024-01-18',
            urgency: 'Standard',
            status: 'Pending Approval',
        },
        {
            id: 'MR-2024-00090',
            title: 'Laboratory Consumables',
            requestor: 'Dr. Paul Otieno',
            department: 'Health Services',
            items: 42,
            date: '2024-01-17',
            urgency: 'Urgent',
            status: 'Pending Approval',
        },
        {
            id: 'MR-2024-00091',
            title: 'Cleaning Supplies',
            requestor: 'James Kiprono',
            department: 'Facilities',
            items: 18,
            date: '2024-01-16',
            urgency: 'Standard',
            status: 'Pending Approval',
        },
    ],
};

const ApprovalPlatform: React.FC<ApprovalPlatformProps> = ({
    navigateToRoute,
    defaultTab = 'purchase_orders',
}) => {
    const { token } = theme.useToken();
    const { isMobile } = useResponsive();
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState(defaultTab);
    const [selectedItem, setSelectedItem] = useState<any>(null);
    const [detailModalVisible, setDetailModalVisible] = useState(false);
    const [approvalModalVisible, setApprovalModalVisible] = useState(false);
    const [approvalAction, setApprovalAction] = useState<'approve' | 'reject'>('approve');
    const [form] = Form.useForm();

    useEffect(() => {
        const timer = setTimeout(() => setLoading(false), 600);
        return () => clearTimeout(timer);
    }, []);

    const formatCurrency = (value: number): string => {
        return `KES ${value.toLocaleString()}`;
    };

    const getPriorityColor = (priority: string) => {
        switch (priority.toLowerCase()) {
            case 'high':
            case 'urgent':
                return 'red';
            case 'medium':
            case 'standard':
                return 'orange';
            case 'low':
                return 'green';
            default:
                return 'blue';
        }
    };

    const handleViewDetails = (record: any) => {
        setSelectedItem(record);
        setDetailModalVisible(true);
    };

    const handleApprovalAction = (record: any, action: 'approve' | 'reject') => {
        setSelectedItem(record);
        setApprovalAction(action);
        setApprovalModalVisible(true);
    };

    const submitApproval = async () => {
        try {
            const values = await form.validateFields();
            message.success(
                `${selectedItem?.id} ${approvalAction === 'approve' ? 'approved' : 'rejected'} successfully`
            );
            setApprovalModalVisible(false);
            form.resetFields();
        } catch (error) {
            console.error('Validation failed:', error);
        }
    };

    // Purchase Orders columns
    const poColumns = [
        {
            title: 'PO Number',
            dataIndex: 'id',
            key: 'id',
            render: (id: string) => <Text strong style={{ color: token.colorPrimary }}>{id}</Text>,
        },
        {
            title: 'Title',
            dataIndex: 'title',
            key: 'title',
            ellipsis: true,
        },
        {
            title: 'Requestor',
            dataIndex: 'requestor',
            key: 'requestor',
            render: (name: string) => (
                <Space>
                    <Avatar size="small" icon={<UserOutlined />} />
                    {name}
                </Space>
            ),
        },
        {
            title: 'Department',
            dataIndex: 'department',
            key: 'department',
            render: (dept: string) => <Tag>{dept}</Tag>,
        },
        {
            title: 'Amount',
            dataIndex: 'amount',
            key: 'amount',
            render: (amount: number) => <Text strong>{formatCurrency(amount)}</Text>,
            sorter: (a: any, b: any) => a.amount - b.amount,
        },
        {
            title: 'Priority',
            dataIndex: 'priority',
            key: 'priority',
            render: (priority: string) => <Tag color={getPriorityColor(priority)}>{priority}</Tag>,
        },
        {
            title: 'Date',
            dataIndex: 'date',
            key: 'date',
        },
        {
            title: 'Actions',
            key: 'actions',
            fixed: 'right' as const,
            width: 200,
            render: (_: any, record: any) => (
                <Space>
                    <Tooltip title="View Details">
                        <Button
                            type="text"
                            icon={<EyeOutlined />}
                            onClick={() => handleViewDetails(record)}
                        />
                    </Tooltip>
                    <Button
                        type="primary"
                        size="small"
                        icon={<CheckCircleOutlined />}
                        onClick={() => handleApprovalAction(record, 'approve')}
                    >
                        Approve
                    </Button>
                    <Button
                        danger
                        size="small"
                        icon={<CloseCircleOutlined />}
                        onClick={() => handleApprovalAction(record, 'reject')}
                    >
                        Reject
                    </Button>
                </Space>
            ),
        },
    ];

    // Expense Claims columns
    const ecColumns = [
        {
            title: 'Claim ID',
            dataIndex: 'id',
            key: 'id',
            render: (id: string) => <Text strong style={{ color: token.colorPrimary }}>{id}</Text>,
        },
        {
            title: 'Description',
            dataIndex: 'title',
            key: 'title',
            ellipsis: true,
        },
        {
            title: 'Claimant',
            dataIndex: 'claimant',
            key: 'claimant',
            render: (name: string) => (
                <Space>
                    <Avatar size="small" icon={<UserOutlined />} />
                    {name}
                </Space>
            ),
        },
        {
            title: 'Category',
            dataIndex: 'category',
            key: 'category',
            render: (cat: string) => <Tag color="purple">{cat}</Tag>,
        },
        {
            title: 'Amount',
            dataIndex: 'amount',
            key: 'amount',
            render: (amount: number) => <Text strong>{formatCurrency(amount)}</Text>,
            sorter: (a: any, b: any) => a.amount - b.amount,
        },
        {
            title: 'Date',
            dataIndex: 'date',
            key: 'date',
        },
        {
            title: 'Actions',
            key: 'actions',
            fixed: 'right' as const,
            width: 200,
            render: (_: any, record: any) => (
                <Space>
                    <Tooltip title="View Details">
                        <Button
                            type="text"
                            icon={<EyeOutlined />}
                            onClick={() => handleViewDetails(record)}
                        />
                    </Tooltip>
                    <Button
                        type="primary"
                        size="small"
                        icon={<CheckCircleOutlined />}
                        onClick={() => handleApprovalAction(record, 'approve')}
                    >
                        Approve
                    </Button>
                    <Button
                        danger
                        size="small"
                        icon={<CloseCircleOutlined />}
                        onClick={() => handleApprovalAction(record, 'reject')}
                    >
                        Reject
                    </Button>
                </Space>
            ),
        },
    ];

    // Material Requests columns
    const mrColumns = [
        {
            title: 'Request ID',
            dataIndex: 'id',
            key: 'id',
            render: (id: string) => <Text strong style={{ color: token.colorPrimary }}>{id}</Text>,
        },
        {
            title: 'Description',
            dataIndex: 'title',
            key: 'title',
            ellipsis: true,
        },
        {
            title: 'Requestor',
            dataIndex: 'requestor',
            key: 'requestor',
            render: (name: string) => (
                <Space>
                    <Avatar size="small" icon={<UserOutlined />} />
                    {name}
                </Space>
            ),
        },
        {
            title: 'Department',
            dataIndex: 'department',
            key: 'department',
            render: (dept: string) => <Tag>{dept}</Tag>,
        },
        {
            title: 'Items',
            dataIndex: 'items',
            key: 'items',
            render: (count: number) => <Badge count={count} showZero color="blue" />,
        },
        {
            title: 'Urgency',
            dataIndex: 'urgency',
            key: 'urgency',
            render: (urgency: string) => <Tag color={getPriorityColor(urgency)}>{urgency}</Tag>,
        },
        {
            title: 'Date',
            dataIndex: 'date',
            key: 'date',
        },
        {
            title: 'Actions',
            key: 'actions',
            fixed: 'right' as const,
            width: 200,
            render: (_: any, record: any) => (
                <Space>
                    <Tooltip title="View Details">
                        <Button
                            type="text"
                            icon={<EyeOutlined />}
                            onClick={() => handleViewDetails(record)}
                        />
                    </Tooltip>
                    <Button
                        type="primary"
                        size="small"
                        icon={<CheckCircleOutlined />}
                        onClick={() => handleApprovalAction(record, 'approve')}
                    >
                        Approve
                    </Button>
                    <Button
                        danger
                        size="small"
                        icon={<CloseCircleOutlined />}
                        onClick={() => handleApprovalAction(record, 'reject')}
                    >
                        Reject
                    </Button>
                </Space>
            ),
        },
    ];

    const tabItems = [
        {
            key: 'purchase_orders',
            label: (
                <span>
                    <ShoppingCartOutlined />
                    Purchase Orders
                    <Badge count={mockPendingItems.purchase_orders.length} style={{ marginLeft: 8 }} />
                </span>
            ),
            children: (
                <Table
                    dataSource={mockPendingItems.purchase_orders}
                    columns={poColumns}
                    rowKey="id"
                    loading={loading}
                    scroll={{ x: 1000 }}
                    pagination={{ pageSize: 10 }}
                />
            ),
        },
        {
            key: 'expense_claims',
            label: (
                <span>
                    <CreditCardOutlined />
                    Expense Claims
                    <Badge count={mockPendingItems.expense_claims.length} style={{ marginLeft: 8 }} />
                </span>
            ),
            children: (
                <Table
                    dataSource={mockPendingItems.expense_claims}
                    columns={ecColumns}
                    rowKey="id"
                    loading={loading}
                    scroll={{ x: 900 }}
                    pagination={{ pageSize: 10 }}
                />
            ),
        },
        {
            key: 'material_requests',
            label: (
                <span>
                    <InboxOutlined />
                    Material Requests
                    <Badge count={mockPendingItems.material_requests.length} style={{ marginLeft: 8 }} />
                </span>
            ),
            children: (
                <Table
                    dataSource={mockPendingItems.material_requests}
                    columns={mrColumns}
                    rowKey="id"
                    loading={loading}
                    scroll={{ x: 900 }}
                    pagination={{ pageSize: 10 }}
                />
            ),
        },
    ];

    return (
        <div style={{ padding: isMobile ? '16px' : '24px', background: token.colorBgLayout, minHeight: 'calc(100vh - 64px)' }}>
            {/* Header */}
            <div style={{ marginBottom: '24px' }}>
                <Button
                    type="text"
                    icon={<ArrowLeftOutlined />}
                    onClick={() => navigateToRoute?.('dashboard')}
                    style={{ marginBottom: '12px', padding: 0 }}
                >
                    Back to Dashboard
                </Button>
                <Title level={2} style={{ margin: 0 }}>Central Approval Platform</Title>
                <Text type="secondary">Review and approve pending workflow items</Text>
            </div>

            {/* Summary Stats */}
            <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
                <Col xs={8}>
                    <Card size="small">
                        <Statistic
                            title="Purchase Orders"
                            value={mockPendingItems.purchase_orders.length}
                            prefix={<ShoppingCartOutlined style={{ color: '#667eea' }} />}
                            valueStyle={{ color: '#667eea' }}
                        />
                    </Card>
                </Col>
                <Col xs={8}>
                    <Card size="small">
                        <Statistic
                            title="Expense Claims"
                            value={mockPendingItems.expense_claims.length}
                            prefix={<CreditCardOutlined style={{ color: '#f5576c' }} />}
                            valueStyle={{ color: '#f5576c' }}
                        />
                    </Card>
                </Col>
                <Col xs={8}>
                    <Card size="small">
                        <Statistic
                            title="Material Requests"
                            value={mockPendingItems.material_requests.length}
                            prefix={<InboxOutlined style={{ color: '#4facfe' }} />}
                            valueStyle={{ color: '#4facfe' }}
                        />
                    </Card>
                </Col>
            </Row>

            {/* Tabs Content */}
            <Card
                style={{
                    borderRadius: '12px',
                    boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
                    border: 'none',
                }}
            >
                <Tabs
                    activeKey={activeTab}
                    onChange={setActiveTab}
                    items={tabItems}
                    size={isMobile ? 'small' : 'middle'}
                />
            </Card>

            {/* Detail Modal */}
            <Modal
                title={`Details: ${selectedItem?.id}`}
                open={detailModalVisible}
                onCancel={() => setDetailModalVisible(false)}
                footer={null}
                width={600}
            >
                {selectedItem && (
                    <Descriptions column={1} bordered size="small">
                        <Descriptions.Item label="ID">{selectedItem.id}</Descriptions.Item>
                        <Descriptions.Item label="Title">{selectedItem.title}</Descriptions.Item>
                        <Descriptions.Item label="Requestor">
                            {selectedItem.requestor || selectedItem.claimant}
                        </Descriptions.Item>
                        <Descriptions.Item label="Department">{selectedItem.department}</Descriptions.Item>
                        {selectedItem.amount && (
                            <Descriptions.Item label="Amount">{formatCurrency(selectedItem.amount)}</Descriptions.Item>
                        )}
                        {selectedItem.items && (
                            <Descriptions.Item label="Items">{selectedItem.items}</Descriptions.Item>
                        )}
                        <Descriptions.Item label="Date">{selectedItem.date}</Descriptions.Item>
                        <Descriptions.Item label="Status">
                            <Tag color="warning">{selectedItem.status}</Tag>
                        </Descriptions.Item>
                    </Descriptions>
                )}
            </Modal>

            {/* Approval Modal */}
            <Modal
                title={approvalAction === 'approve' ? 'Approve Request' : 'Reject Request'}
                open={approvalModalVisible}
                onCancel={() => {
                    setApprovalModalVisible(false);
                    form.resetFields();
                }}
                onOk={submitApproval}
                okText={approvalAction === 'approve' ? 'Approve' : 'Reject'}
                okButtonProps={{
                    danger: approvalAction === 'reject',
                    icon: approvalAction === 'approve' ? <CheckCircleOutlined /> : <CloseCircleOutlined />,
                }}
            >
                <div style={{ marginBottom: '16px' }}>
                    <Text>
                        You are about to <Text strong>{approvalAction}</Text> request{' '}
                        <Text code>{selectedItem?.id}</Text>
                    </Text>
                </div>
                <Form form={form} layout="vertical">
                    <Form.Item
                        name="comments"
                        label="Comments"
                        rules={[
                            {
                                required: approvalAction === 'reject',
                                message: 'Please provide a reason for rejection',
                            },
                        ]}
                    >
                        <TextArea
                            rows={4}
                            placeholder={
                                approvalAction === 'approve'
                                    ? 'Optional comments...'
                                    : 'Please provide a reason for rejection...'
                            }
                        />
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
};

export default ApprovalPlatform;

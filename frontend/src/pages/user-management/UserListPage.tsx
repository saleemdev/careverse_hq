import React, { useState, useEffect, useCallback } from 'react';
import {
    Card,
    Table,
    Button,
    Input,
    Space,
    Typography,
    Tag,
    Popconfirm,
    message,
    Select,
    Modal,
    Breadcrumb,
    theme
} from 'antd';
import {
    UserAddOutlined,
    SearchOutlined,
    ReloadOutlined,
    EditOutlined,
    LockOutlined,
    StopOutlined,
    CheckCircleOutlined,
    HomeOutlined,
    TeamOutlined
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';

const { Title, Text } = Typography;

interface User {
    name: string;
    email: string;
    first_name: string;
    last_name: string;
    phone?: string;
    enabled: number;
    roles?: string[];
    last_login?: string;
}

interface UserListPageProps {
    navigateToRoute: (route: string, id?: string) => void;
}

const UserListPage: React.FC<UserListPageProps> = ({ navigateToRoute }) => {
    const { token } = theme.useToken();
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchText, setSearchText] = useState('');
    const [roleFilter, setRoleFilter] = useState<string>('all');
    const [tempPassword, setTempPassword] = useState<string | null>(null);
    const [showPasswordModal, setShowPasswordModal] = useState(false);

    // Fetch users
    const fetchUsers = useCallback(async () => {
        setLoading(true);
        try {
            const response = await fetch('/api/method/frappe.client.get_list', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Frappe-CSRF-Token': (window as any).csrf_token
                },
                body: JSON.stringify({
                    doctype: 'User',
                    fields: ['name', 'email', 'first_name', 'last_name', 'phone', 'enabled', 'last_login'],
                    filters: [
                        ['user_type', '=', 'System User'],
                        ['name', '!=', 'Administrator'],
                        ['name', '!=', 'Guest']
                    ],
                    limit_page_length: 1000,
                    order_by: 'creation desc'
                })
            });

            if (!response.ok) {
                throw new Error('Failed to fetch users');
            }

            const result = await response.json();
            setUsers(result.data);
        } catch (error: any) {
            console.error('Error fetching users:', error);
            message.error('Failed to fetch users');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    // Reset password
    const handleResetPassword = async (email: string) => {
        try {
            const response = await fetch('/api/method/careverse_hq.api.user_management.reset_user_password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Frappe-CSRF-Token': (window as any).csrf_token
                },
                body: JSON.stringify({
                    user_email: email
                })
            });

            if (!response.ok) {
                throw new Error('Failed to reset password');
            }

            const result = await response.json();
            setTempPassword(result.data.temp_password);
            setShowPasswordModal(true);
            message.success('Password reset successfully');
        } catch (error: any) {
            console.error('Error resetting password:', error);
            message.error('Failed to reset password');
        }
    };

    // Toggle user enabled status
    const handleToggleEnabled = async (email: string, currentEnabled: number) => {
        try {
            const response = await fetch('/api/method/careverse_hq.api.user_management.update_user', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Frappe-CSRF-Token': (window as any).csrf_token
                },
                body: JSON.stringify({
                    user_email: email,
                    enabled: currentEnabled === 1 ? 0 : 1
                })
            });

            if (!response.ok) {
                throw new Error('Failed to update user');
            }

            message.success(`User ${currentEnabled === 1 ? 'disabled' : 'enabled'} successfully`);
            fetchUsers();
        } catch (error: any) {
            console.error('Error updating user:', error);
            message.error('Failed to update user');
        }
    };

    // Copy password to clipboard
    const copyPassword = () => {
        if (tempPassword) {
            navigator.clipboard.writeText(tempPassword);
            message.success('Password copied to clipboard');
        }
    };

    // Filter users
    const getFilteredUsers = () => {
        let filtered = users;

        // Filter by search text
        if (searchText) {
            filtered = filtered.filter(user =>
                user.first_name?.toLowerCase().includes(searchText.toLowerCase()) ||
                user.last_name?.toLowerCase().includes(searchText.toLowerCase()) ||
                user.email.toLowerCase().includes(searchText.toLowerCase())
            );
        }

        // Filter by role (would need to fetch roles separately in real implementation)
        // This is a simplified version
        if (roleFilter !== 'all') {
            // Implement role filtering here
        }

        return filtered;
    };

    // Table columns
    const columns: ColumnsType<User> = [
        {
            title: 'Name',
            key: 'name',
            width: 250,
            render: (record: User) => (
                <div>
                    <Text strong>
                        {record.first_name} {record.last_name}
                    </Text>
                    <br />
                    <Text type="secondary" style={{ fontSize: 12 }}>
                        {record.email}
                    </Text>
                </div>
            )
        },
        {
            title: 'Phone',
            dataIndex: 'phone',
            key: 'phone',
            width: 150,
            render: (phone: string) => phone || <Text type="secondary">-</Text>
        },
        {
            title: 'Status',
            dataIndex: 'enabled',
            key: 'enabled',
            width: 120,
            render: (enabled: number) => (
                <Tag
                    color={enabled === 1 ? 'success' : 'default'}
                    icon={enabled === 1 ? <CheckCircleOutlined /> : <StopOutlined />}
                >
                    {enabled === 1 ? 'Enabled' : 'Disabled'}
                </Tag>
            )
        },
        {
            title: 'Last Login',
            dataIndex: 'last_login',
            key: 'last_login',
            width: 180,
            render: (date: string) => date ? new Date(date).toLocaleString() : <Text type="secondary">Never</Text>
        },
        {
            title: 'Actions',
            key: 'actions',
            fixed: 'right',
            width: 200,
            render: (record: User) => (
                <Space size="small">
                    <Button
                        type="link"
                        icon={<EditOutlined />}
                        onClick={() => navigateToRoute('edit-user', record.name)}
                        size="small"
                    >
                        Edit
                    </Button>
                    <Popconfirm
                        title="Reset Password"
                        description="Are you sure you want to reset this user's password?"
                        onConfirm={() => handleResetPassword(record.email)}
                        okText="Yes"
                        cancelText="No"
                    >
                        <Button
                            type="link"
                            icon={<LockOutlined />}
                            size="small"
                        >
                            Reset
                        </Button>
                    </Popconfirm>
                    <Popconfirm
                        title={record.enabled === 1 ? 'Disable User' : 'Enable User'}
                        description={`Are you sure you want to ${record.enabled === 1 ? 'disable' : 'enable'} this user?`}
                        onConfirm={() => handleToggleEnabled(record.email, record.enabled)}
                        okText="Yes"
                        cancelText="No"
                    >
                        <Button
                            type="link"
                            danger={record.enabled === 1}
                            icon={record.enabled === 1 ? <StopOutlined /> : <CheckCircleOutlined />}
                            size="small"
                        >
                            {record.enabled === 1 ? 'Disable' : 'Enable'}
                        </Button>
                    </Popconfirm>
                </Space>
            )
        }
    ];

    return (
        <div style={{ padding: '24px' }}>
            {/* Breadcrumb */}
            <Breadcrumb style={{ marginBottom: 24 }}>
                <Breadcrumb.Item>
                    <HomeOutlined />
                </Breadcrumb.Item>
                <Breadcrumb.Item>
                    <TeamOutlined /> User Management
                </Breadcrumb.Item>
            </Breadcrumb>

            {/* Main Card */}
            <Card
                style={{
                    borderRadius: 12,
                    border: 'none',
                    boxShadow: '0 2px 12px rgba(0,0,0,0.08)'
                }}
            >
                {/* Header */}
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: 24,
                    flexWrap: 'wrap',
                    gap: 16
                }}>
                    <div>
                        <Title level={2} style={{ margin: 0, marginBottom: 8 }}>
                            <TeamOutlined style={{ marginRight: 12, color: token.colorPrimary }} />
                            User Management
                        </Title>
                        <Text type="secondary">
                            Manage team members and their access permissions
                        </Text>
                    </div>
                    <Button
                        type="primary"
                        icon={<UserAddOutlined />}
                        size="large"
                        onClick={() => navigateToRoute('create-user')}
                    >
                        Create User
                    </Button>
                </div>

                {/* Filters */}
                <Space style={{ marginBottom: 16, width: '100%', justifyContent: 'space-between', flexWrap: 'wrap' }}>
                    <Space wrap>
                        <Input
                            placeholder="Search by name or email..."
                            prefix={<SearchOutlined />}
                            value={searchText}
                            onChange={(e) => setSearchText(e.target.value)}
                            style={{ width: 300 }}
                            allowClear
                        />
                        <Select
                            value={roleFilter}
                            onChange={setRoleFilter}
                            style={{ width: 200 }}
                            options={[
                                { label: 'All Roles', value: 'all' },
                                { label: 'County Executive', value: 'County Executive' },
                                { label: 'Assistant', value: 'Assistant' }
                            ]}
                        />
                    </Space>
                    <Button
                        icon={<ReloadOutlined />}
                        onClick={fetchUsers}
                        loading={loading}
                    >
                        Refresh
                    </Button>
                </Space>

                {/* Table */}
                <Table
                    dataSource={getFilteredUsers()}
                    columns={columns}
                    rowKey="name"
                    loading={loading}
                    pagination={{
                        pageSize: 20,
                        showSizeChanger: true,
                        showTotal: (total) => `Total ${total} users`
                    }}
                    scroll={{ x: 'max-content' }}
                />
            </Card>

            {/* Password Modal */}
            <Modal
                title="Password Reset Successful"
                open={showPasswordModal}
                onOk={() => setShowPasswordModal(false)}
                onCancel={() => setShowPasswordModal(false)}
                footer={[
                    <Button key="copy" onClick={copyPassword}>
                        Copy Password
                    </Button>,
                    <Button key="close" type="primary" onClick={() => setShowPasswordModal(false)}>
                        Close
                    </Button>
                ]}
            >
                <Space direction="vertical" style={{ width: '100%' }}>
                    <Text>The user's password has been reset. Please share the following temporary password with them:</Text>
                    <Card style={{ background: token.colorBgContainer, marginTop: 16 }}>
                        <Text strong style={{ fontSize: 16, fontFamily: 'monospace' }}>
                            {tempPassword}
                        </Text>
                    </Card>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                        The user will be required to change this password upon first login.
                    </Text>
                </Space>
            </Modal>
        </div>
    );
};

export default UserListPage;

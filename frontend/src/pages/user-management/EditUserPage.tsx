import React, { useState, useEffect } from 'react';
import {
    Card,
    Form,
    Input,
    Select,
    Button,
    Space,
    Typography,
    message,
    Breadcrumb,
    Spin,
    Modal,
    Popconfirm,
    theme
} from 'antd';
import {
    EditOutlined,
    ArrowLeftOutlined,
    SaveOutlined,
    LockOutlined,
    HomeOutlined,
    TeamOutlined
} from '@ant-design/icons';

const { Title, Text } = Typography;

interface EditUserPageProps {
    userId: string;
    navigateToRoute: (route: string, id?: string) => void;
}

interface User {
    name: string;
    email: string;
    first_name: string;
    last_name: string;
    phone?: string;
    enabled: number;
}

interface Department {
    name: string;
}

const EditUserPage: React.FC<EditUserPageProps> = ({ userId, navigateToRoute }) => {
    const { token } = theme.useToken();
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [user, setUser] = useState<User | null>(null);
    const [departments, setDepartments] = useState<Department[]>([]);
    const [tempPassword, setTempPassword] = useState<string | null>(null);
    const [showPasswordModal, setShowPasswordModal] = useState(false);

    // Fetch user data
    useEffect(() => {
        const fetchUser = async () => {
            setLoading(true);
            try {
                const response = await fetch('/api/method/frappe.client.get', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-Frappe-CSRF-Token': (window as any).csrf_token
                    },
                    body: JSON.stringify({
                        doctype: 'User',
                        name: userId
                    })
                });

                if (!response.ok) {
                    throw new Error('Failed to fetch user');
                }

                const result = await response.json();
                setUser(result.data);

                // Set form values
                form.setFieldsValue({
                    first_name: result.data.first_name,
                    last_name: result.data.last_name,
                    email: result.data.email,
                    phone: result.data.phone,
                    enabled: result.data.enabled
                });

            } catch (error: any) {
                console.error('Error fetching user:', error);
                message.error('Failed to load user data');
            } finally {
                setLoading(false);
            }
        };

        fetchUser();
    }, [userId, form]);

    // Fetch departments
    useEffect(() => {
        const fetchDepartments = async () => {
            try {
                const response = await fetch('/api/method/frappe.client.get_list', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-Frappe-CSRF-Token': (window as any).csrf_token
                    },
                    body: JSON.stringify({
                        doctype: 'Department',
                        fields: ['name'],
                        limit_page_length: 1000
                    })
                });

                if (response.ok) {
                    const result = await response.json();
                    setDepartments(result.data);
                }
            } catch (error) {
                console.error('Error fetching departments:', error);
            }
        };

        fetchDepartments();
    }, []);

    // Handle form submission
    const handleSubmit = async (values: any) => {
        setSubmitting(true);

        try {
            const response = await fetch('/api/method/careverse_hq.api.user_management.update_user', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Frappe-CSRF-Token': (window as any).csrf_token
                },
                body: JSON.stringify({
                    user_email: user?.email,
                    first_name: values.first_name,
                    last_name: values.last_name,
                    phone: values.phone,
                    enabled: values.enabled
                })
            });

            if (!response.ok) {
                const errorResult = await response.json();
                throw new Error(errorResult.message || 'Failed to update user');
            }

            message.success('User updated successfully!');
            setTimeout(() => {
                navigateToRoute('user-management');
            }, 1000);

        } catch (error: any) {
            console.error('Error updating user:', error);
            message.error(error.message || 'Failed to update user');
        } finally {
            setSubmitting(false);
        }
    };

    // Handle password reset
    const handleResetPassword = async () => {
        if (!user) return;

        try {
            const response = await fetch('/api/method/careverse_hq.api.user_management.reset_user_password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Frappe-CSRF-Token': (window as any).csrf_token
                },
                body: JSON.stringify({
                    user_email: user.email
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

    // Copy password to clipboard
    const copyPassword = () => {
        if (tempPassword) {
            navigator.clipboard.writeText(tempPassword);
            message.success('Password copied to clipboard');
        }
    };

    if (loading) {
        return (
            <div style={{ padding: '24px', display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
                <Spin size="large" />
            </div>
        );
    }

    if (!user) {
        return (
            <div style={{ padding: '24px' }}>
                <Card>
                    <Text>User not found</Text>
                </Card>
            </div>
        );
    }

    return (
        <div style={{ padding: '24px', maxWidth: 800, margin: '0 auto' }}>
            {/* Breadcrumb */}
            <Breadcrumb style={{ marginBottom: 24 }}>
                <Breadcrumb.Item>
                    <HomeOutlined />
                </Breadcrumb.Item>
                <Breadcrumb.Item>
                    <a onClick={() => navigateToRoute('user-management')}>
                        <TeamOutlined /> User Management
                    </a>
                </Breadcrumb.Item>
                <Breadcrumb.Item>Edit User</Breadcrumb.Item>
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
                    alignItems: 'flex-start',
                    marginBottom: 32
                }}>
                    <div>
                        <Title level={2} style={{ margin: 0, marginBottom: 8 }}>
                            <EditOutlined style={{ marginRight: 12, color: token.colorPrimary }} />
                            Edit User
                        </Title>
                        <Text type="secondary">
                            Update user information and permissions
                        </Text>
                    </div>
                    <Popconfirm
                        title="Reset Password"
                        description="Generate a new temporary password for this user?"
                        onConfirm={handleResetPassword}
                        okText="Yes"
                        cancelText="No"
                    >
                        <Button icon={<LockOutlined />}>
                            Reset Password
                        </Button>
                    </Popconfirm>
                </div>

                {/* Form */}
                <Form
                    form={form}
                    layout="vertical"
                    onFinish={handleSubmit}
                    requiredMark="optional"
                >
                    <Form.Item
                        label="Email"
                        name="email"
                    >
                        <Input size="large" disabled />
                    </Form.Item>

                    <Form.Item
                        label="First Name"
                        name="first_name"
                        rules={[{ required: true, message: 'Please enter first name' }]}
                    >
                        <Input size="large" placeholder="Enter first name" />
                    </Form.Item>

                    <Form.Item
                        label="Last Name"
                        name="last_name"
                        rules={[{ required: true, message: 'Please enter last name' }]}
                    >
                        <Input size="large" placeholder="Enter last name" />
                    </Form.Item>

                    <Form.Item
                        label="Phone Number"
                        name="phone"
                    >
                        <Input size="large" placeholder="+254712345678" />
                    </Form.Item>

                    <Form.Item
                        label="Status"
                        name="enabled"
                        rules={[{ required: true, message: 'Please select status' }]}
                    >
                        <Select
                            size="large"
                            options={[
                                { label: 'Enabled', value: 1 },
                                { label: 'Disabled', value: 0 }
                            ]}
                        />
                    </Form.Item>

                    {/* Actions */}
                    <Form.Item style={{ marginTop: 32, marginBottom: 0 }}>
                        <Space size="middle">
                            <Button
                                icon={<ArrowLeftOutlined />}
                                onClick={() => navigateToRoute('user-management')}
                                disabled={submitting}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="primary"
                                htmlType="submit"
                                icon={<SaveOutlined />}
                                loading={submitting}
                                size="large"
                            >
                                Save Changes
                            </Button>
                        </Space>
                    </Form.Item>
                </Form>
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
                        <Text
                            strong
                            style={{
                                fontSize: 16,
                                fontFamily: 'monospace',
                                wordBreak: 'break-all'
                            }}
                        >
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

export default EditUserPage;

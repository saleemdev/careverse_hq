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
    Alert,
    Modal,
    theme
} from 'antd';
import {
    UserAddOutlined,
    ArrowLeftOutlined,
    CheckCircleOutlined,
    HomeOutlined,
    TeamOutlined
} from '@ant-design/icons';

const { Title, Text } = Typography;

interface CreateUserPageProps {
    navigateToRoute: (route: string, id?: string) => void;
}

interface Department {
    name: string;
}

const CreateUserPage: React.FC<CreateUserPageProps> = ({ navigateToRoute }) => {
    const { token } = theme.useToken();
    const [form] = Form.useForm();
    const [submitting, setSubmitting] = useState(false);
    const [departments, setDepartments] = useState<Department[]>([]);
    const [tempPassword, setTempPassword] = useState<string | null>(null);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [createdUserEmail, setCreatedUserEmail] = useState<string>('');

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
            const response = await fetch('/api/method/careverse_hq.api.user_management.create_team_user', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Frappe-CSRF-Token': (window as any).csrf_token
                },
                body: JSON.stringify({
                    first_name: values.first_name,
                    last_name: values.last_name,
                    email: values.email,
                    phone: values.phone,
                    role: values.role,
                    county: values.county
                })
            });

            if (!response.ok) {
                const errorResult = await response.json();
                throw new Error(errorResult.message || 'Failed to create user');
            }

            const result = await response.json();
            setTempPassword(result.data.temp_password);
            setCreatedUserEmail(result.data.user.email);
            setShowSuccessModal(true);
            message.success('User created successfully!');
            form.resetFields();

        } catch (error: any) {
            console.error('Error creating user:', error);
            message.error(error.message || 'Failed to create user');
        } finally {
            setSubmitting(false);
        }
    };

    // Copy password to clipboard
    const copyPassword = () => {
        if (tempPassword) {
            navigator.clipboard.writeText(tempPassword);
            message.success('Password copied to clipboard');
        }
    };

    // Handle modal close
    const handleModalClose = () => {
        setShowSuccessModal(false);
        navigateToRoute('user-management');
    };

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
                <Breadcrumb.Item>Create User</Breadcrumb.Item>
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
                <div style={{ marginBottom: 32 }}>
                    <Title level={2} style={{ margin: 0, marginBottom: 8 }}>
                        <UserAddOutlined style={{ marginRight: 12, color: token.colorPrimary }} />
                        Create New User
                    </Title>
                    <Text type="secondary">
                        Create a new team member with access to the system
                    </Text>
                </div>

                {/* Info Alert */}
                <Alert
                    message="User Credentials"
                    description="A temporary password will be automatically generated and sent to the user via email. The user will be required to change their password upon first login."
                    type="info"
                    showIcon
                    style={{ marginBottom: 24, borderRadius: 8 }}
                />

                {/* Form */}
                <Form
                    form={form}
                    layout="vertical"
                    onFinish={handleSubmit}
                    requiredMark="optional"
                >
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
                        label="Email"
                        name="email"
                        rules={[
                            { required: true, message: 'Please enter email' },
                            { type: 'email', message: 'Please enter a valid email' }
                        ]}
                    >
                        <Input size="large" placeholder="user@example.com" />
                    </Form.Item>

                    <Form.Item
                        label="Phone Number"
                        name="phone"
                    >
                        <Input size="large" placeholder="+254712345678" />
                    </Form.Item>

                    <Form.Item
                        label="Role"
                        name="role"
                        rules={[{ required: true, message: 'Please select a role' }]}
                    >
                        <Select
                            size="large"
                            placeholder="Select user role"
                            options={[
                                { label: 'County Executive', value: 'County Executive' },
                                { label: 'Assistant', value: 'Assistant' },
                                { label: 'System Manager', value: 'System Manager' }
                            ]}
                        />
                    </Form.Item>

                    <Form.Item
                        label="County/Department"
                        name="county"
                        rules={[{ required: true, message: 'Please select a county/department' }]}
                    >
                        <Select
                            size="large"
                            placeholder="Select county or department"
                            showSearch
                            filterOption={(input, option) =>
                                (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                            }
                            options={departments.map(dept => ({
                                label: dept.name,
                                value: dept.name
                            }))}
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
                                icon={<CheckCircleOutlined />}
                                loading={submitting}
                                size="large"
                            >
                                Create User
                            </Button>
                        </Space>
                    </Form.Item>
                </Form>
            </Card>

            {/* Success Modal */}
            <Modal
                title={
                    <Space>
                        <CheckCircleOutlined style={{ color: token.colorSuccess, fontSize: 24 }} />
                        <span>User Created Successfully</span>
                    </Space>
                }
                open={showSuccessModal}
                onOk={handleModalClose}
                onCancel={handleModalClose}
                footer={[
                    <Button key="copy" onClick={copyPassword}>
                        Copy Password
                    </Button>,
                    <Button key="close" type="primary" onClick={handleModalClose}>
                        Back to User List
                    </Button>
                ]}
                width={600}
            >
                <Space direction="vertical" size="large" style={{ width: '100%' }}>
                    <Alert
                        message="Email Sent"
                        description={`An email with login credentials has been sent to ${createdUserEmail}`}
                        type="success"
                        showIcon
                    />

                    <div>
                        <Text strong style={{ display: 'block', marginBottom: 8 }}>
                            Temporary Password:
                        </Text>
                        <Card style={{ background: token.colorBgContainer }}>
                            <Text
                                strong
                                style={{
                                    fontSize: 18,
                                    fontFamily: 'monospace',
                                    wordBreak: 'break-all'
                                }}
                            >
                                {tempPassword}
                            </Text>
                        </Card>
                    </div>

                    <Alert
                        message="Important"
                        description="Please securely share this password with the user. They will be required to change it upon first login."
                        type="warning"
                        showIcon
                    />
                </Space>
            </Modal>
        </div>
    );
};

export default CreateUserPage;

import React, { useMemo, useState } from 'react';
import { Alert, Button, Card, Form, Input, Select, Space, Steps, Typography, message } from 'antd';
import type { UserScopePermission } from '../../../services/api';

const { Text, Title } = Typography;

interface UserCreateWizardProps {
    roles: string[];
    companies: string[];
    loading?: boolean;
    onSubmit: (payload: {
        first_name: string;
        last_name: string;
        email: string;
        phone?: string;
        roles: string[];
        scopes: UserScopePermission[];
    }) => Promise<{ success: boolean; tempPassword?: string; error?: string }>;
    onCancel: () => void;
    onCompleted: () => void;
}

const UserCreateWizard: React.FC<UserCreateWizardProps> = ({
    roles,
    companies,
    loading = false,
    onSubmit,
    onCancel,
    onCompleted,
}) => {
    const [currentStep, setCurrentStep] = useState(0);
    const [form] = Form.useForm();
    const [tempPassword, setTempPassword] = useState<string | undefined>();

    const draft = Form.useWatch([], form) || {};
    const reviewText = useMemo(() => {
        const scopeTokens = (draft.companies || []).map((item: string) => `Company:${item}`);
        return scopeTokens.join(', ');
    }, [draft]);

    const next = async () => {
        try {
            if (currentStep === 0) {
                await form.validateFields(['first_name', 'last_name', 'email', 'phone']);
            } else if (currentStep === 1) {
                await form.validateFields(['roles']);
            } else if (currentStep === 2) {
                await form.validateFields(['companies']);
            }
            setCurrentStep((value) => value + 1);
        } catch {
            // AntD form handles inline validation display.
        }
    };

    const previous = () => setCurrentStep((value) => value - 1);

    const submit = async () => {
        const values = await form.validateFields();
        const scopes: UserScopePermission[] = (values.companies || []).map((name: string) => ({
                allow: 'Company' as const,
                for_value: name,
                is_default: 0,
                apply_to_all_doctypes: 1,
            }));
        const result = await onSubmit({
            first_name: values.first_name,
            last_name: values.last_name,
            email: values.email,
            phone: values.phone,
            roles: values.roles || [],
            scopes,
        });
        if (!result.success) {
            message.error(result.error || 'Failed to create user');
            return;
        }
        setTempPassword(result.tempPassword);
        message.success('User created successfully');
        setCurrentStep(4);
    };

    return (
        <Card>
            <Title level={4} style={{ marginTop: 0 }}>
                Create User Wizard
            </Title>
            <Steps
                current={currentStep}
                style={{ marginBottom: 20 }}
                items={[
                    { title: 'Identity' },
                    { title: 'Roles' },
                    { title: 'Scope' },
                    { title: 'Review' },
                    { title: 'Done' },
                ]}
            />

            <Form form={form} layout="vertical" requiredMark="optional">
                {currentStep === 0 && (
                    <>
                        <Form.Item name="first_name" label="First Name" rules={[{ required: true, message: 'First name is required' }]}>
                            <Input />
                        </Form.Item>
                        <Form.Item name="last_name" label="Last Name" rules={[{ required: true, message: 'Last name is required' }]}>
                            <Input />
                        </Form.Item>
                        <Form.Item
                            name="email"
                            label="Email"
                            rules={[
                                { required: true, message: 'Email is required' },
                                { type: 'email', message: 'Enter a valid email' },
                            ]}
                        >
                            <Input />
                        </Form.Item>
                        <Form.Item name="phone" label="Phone Number">
                            <Input />
                        </Form.Item>
                    </>
                )}

                {currentStep === 1 && (
                    <Form.Item name="roles" label="Roles" rules={[{ required: true, message: 'Select at least one role' }]}>
                        <Select mode="multiple" options={roles.map((role) => ({ label: role, value: role }))} />
                    </Form.Item>
                )}

                {currentStep === 2 && (
                    <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                        <Form.Item name="companies" label="Company Scope">
                            <Select mode="multiple" showSearch options={companies.map((value) => ({ label: value, value }))} />
                        </Form.Item>
                    </Space>
                )}

                {currentStep === 3 && (
                    <Space direction="vertical" style={{ width: '100%' }}>
                        <Alert
                            showIcon
                            type="info"
                            message="Review before create"
                            description="Confirm identity, role assignment, and scope permissions before creating this user."
                        />
                        <Text><strong>Name:</strong> {draft.first_name} {draft.last_name}</Text>
                        <Text><strong>Email:</strong> {draft.email}</Text>
                        <Text><strong>Roles:</strong> {(draft.roles || []).join(', ') || 'None'}</Text>
                        <Text><strong>Scope:</strong> {reviewText || 'No scope restrictions selected'}</Text>
                    </Space>
                )}

                {currentStep === 4 && (
                    <Space direction="vertical" style={{ width: '100%' }}>
                        <Alert
                            showIcon
                            type="success"
                            message="User created"
                            description="The user can now sign in using temporary credentials and will be prompted to reset password."
                        />
                        {tempPassword && (
                            <Alert
                                showIcon
                                type="warning"
                                message="Temporary Password"
                                description={tempPassword}
                            />
                        )}
                    </Space>
                )}
            </Form>

            <Space style={{ marginTop: 20 }}>
                <Button onClick={onCancel} disabled={loading}>
                    Cancel
                </Button>
                {currentStep > 0 && currentStep < 4 && (
                    <Button onClick={previous} disabled={loading}>
                        Previous
                    </Button>
                )}
                {currentStep < 3 && (
                    <Button type="primary" onClick={next} disabled={loading}>
                        Next
                    </Button>
                )}
                {currentStep === 3 && (
                    <Button type="primary" onClick={submit} loading={loading}>
                        Create User
                    </Button>
                )}
                {currentStep === 4 && (
                    <Button type="primary" onClick={onCompleted}>
                        Back to Directory
                    </Button>
                )}
            </Space>
        </Card>
    );
};

export default UserCreateWizard;

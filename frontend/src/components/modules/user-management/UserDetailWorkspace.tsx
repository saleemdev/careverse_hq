import React, { useMemo, useState } from 'react';
import { Alert, Button, Drawer, Form, Input, Select, Space, Tabs, Timeline, Typography, message } from 'antd';
import { LockOutlined, SafetyCertificateOutlined } from '@ant-design/icons';
import type { UserManagementUser, UserScopePermission } from '../../../services/api';
import UserRolesEditor from './UserRolesEditor';
import UserScopeEditor from './UserScopeEditor';

const { Text } = Typography;

interface UserDetailWorkspaceProps {
    open: boolean;
    loading: boolean;
    user: UserManagementUser | null;
    availableRoles: string[];
    companies: string[];
    initialTab?: 'profile' | 'roles' | 'scope' | 'security' | 'audit';
    onClose: () => void;
    onSaveProfile: (payload: { first_name?: string; last_name?: string; phone?: string }) => Promise<boolean>;
    onSaveRoles: (roles: string[]) => Promise<boolean>;
    onSaveScopes: (scopes: UserScopePermission[]) => Promise<boolean>;
    onToggleStatus: (enabled: number, reason?: string) => Promise<boolean>;
    onResetPassword: () => Promise<{ success: boolean; tempPassword?: string; error?: string }>;
}

const UserDetailWorkspace: React.FC<UserDetailWorkspaceProps> = ({
    open,
    loading,
    user,
    availableRoles,
    companies,
    initialTab = 'profile',
    onClose,
    onSaveProfile,
    onSaveRoles,
    onSaveScopes,
    onToggleStatus,
    onResetPassword,
}) => {
    const [saving, setSaving] = useState(false);
    const [statusReason, setStatusReason] = useState('');
    const [activeTab, setActiveTab] = useState(initialTab);
    const [form] = Form.useForm();

    React.useEffect(() => {
        setActiveTab(initialTab);
    }, [initialTab, user?.id]);

    const title = useMemo(() => {
        if (!user) return 'User Workspace';
        return `${user.first_name} ${user.last_name}`.trim() || user.email;
    }, [user]);

    const handleProfileSave = async (values: { first_name?: string; last_name?: string; phone?: string }) => {
        setSaving(true);
        try {
            const ok = await onSaveProfile(values);
            if (ok) {
                message.success('Profile updated');
            } else {
                message.error('Failed to update profile');
            }
        } finally {
            setSaving(false);
        }
    };

    const handleRoleSave = async (roles: string[]) => {
        setSaving(true);
        try {
            const ok = await onSaveRoles(roles);
            if (ok) message.success('Roles updated');
            else message.error('Failed to update roles');
        } finally {
            setSaving(false);
        }
    };

    const handleScopeSave = async (scopes: UserScopePermission[]) => {
        setSaving(true);
        try {
            const ok = await onSaveScopes(scopes);
            if (ok) message.success('Scope permissions updated');
            else message.error('Failed to update scope permissions');
        } finally {
            setSaving(false);
        }
    };

    const handleToggleStatus = async () => {
        if (!user) return;
        setSaving(true);
        try {
            const ok = await onToggleStatus(user.enabled ? 0 : 1, statusReason);
            if (ok) {
                message.success(user.enabled ? 'User deactivated' : 'User activated');
            } else {
                message.error('Failed to update status');
            }
        } finally {
            setSaving(false);
        }
    };

    const handleResetPassword = async () => {
        setSaving(true);
        try {
            const result = await onResetPassword();
            if (!result.success) {
                message.error(result.error || 'Failed to reset password');
                return;
            }
            if (result.tempPassword) {
                message.success('Password reset successful. Temporary password copied to modal context.');
            } else {
                message.success('Password reset email sent.');
            }
        } finally {
            setSaving(false);
        }
    };

    return (
        <Drawer
            open={open}
            onClose={onClose}
            title={title}
            width={820}
            destroyOnClose
            styles={{ body: { paddingTop: 12 } }}
        >
            {!user ? (
                <Alert type="info" showIcon message="Select a user to open workspace." />
            ) : (
                <Tabs
                    activeKey={activeTab}
                    onChange={(key) => setActiveTab(key as 'profile' | 'roles' | 'scope' | 'security' | 'audit')}
                    items={[
                        {
                            key: 'profile',
                            label: 'Profile',
                            children: (
                                <Form
                                    form={form}
                                    layout="vertical"
                                    initialValues={{
                                        first_name: user.first_name,
                                        last_name: user.last_name,
                                        phone: user.phone,
                                    }}
                                    onFinish={handleProfileSave}
                                >
                                    <Form.Item label="Email">
                                        <Input value={user.email} disabled />
                                    </Form.Item>
                                    <Form.Item name="first_name" label="First Name" rules={[{ required: true }]}>
                                        <Input />
                                    </Form.Item>
                                    <Form.Item name="last_name" label="Last Name" rules={[{ required: true }]}>
                                        <Input />
                                    </Form.Item>
                                    <Form.Item name="phone" label="Phone Number">
                                        <Input />
                                    </Form.Item>
                                    <Button type="primary" htmlType="submit" loading={saving || loading}>
                                        Save Profile
                                    </Button>
                                </Form>
                            ),
                        },
                        {
                            key: 'roles',
                            label: 'Roles',
                            children: (
                                <UserRolesEditor
                                    availableRoles={availableRoles}
                                    currentRoles={user.roles || []}
                                    loading={saving || loading}
                                    onSave={handleRoleSave}
                                />
                            ),
                        },
                        {
                            key: 'scope',
                            label: 'Scope Permissions',
                            children: (
                                <UserScopeEditor
                                    companies={companies}
                                    currentScopes={user.scopes || []}
                                    loading={saving || loading}
                                    onSave={handleScopeSave}
                                />
                            ),
                        },
                        {
                            key: 'security',
                            label: 'Security',
                            children: (
                                <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                                    <Alert
                                        type="warning"
                                        showIcon
                                        message="Security actions are audited."
                                        description="Password resets and status changes are tracked with actor, target user, and timestamp."
                                    />

                                    <Space direction="vertical" style={{ width: '100%' }}>
                                        <Text strong>User Status</Text>
                                        <Select
                                            value={user.enabled ? 'enabled' : 'disabled'}
                                            disabled
                                            options={[
                                                { value: 'enabled', label: 'Enabled' },
                                                { value: 'disabled', label: 'Disabled' },
                                            ]}
                                        />
                                        <Input.TextArea
                                            rows={2}
                                            placeholder="Reason for status change (recommended)"
                                            value={statusReason}
                                            onChange={(event) => setStatusReason(event.target.value)}
                                        />
                                        <Button
                                            icon={<SafetyCertificateOutlined />}
                                            danger={user.enabled === 1}
                                            loading={saving || loading}
                                            onClick={handleToggleStatus}
                                        >
                                            {user.enabled ? 'Deactivate User' : 'Activate User'}
                                        </Button>
                                    </Space>

                                    <Space direction="vertical" style={{ width: '100%' }}>
                                        <Text strong>Password Management</Text>
                                        <Button icon={<LockOutlined />} loading={saving || loading} onClick={handleResetPassword}>
                                            Reset Password
                                        </Button>
                                    </Space>
                                </Space>
                            ),
                        },
                        {
                            key: 'audit',
                            label: 'Audit Timeline',
                            children: (
                                <Timeline
                                    items={[
                                        {
                                            children: 'Audit events are recorded on the backend logger for each mutation.',
                                        },
                                        {
                                            children: 'Profile, role, scope, status, and password actions include actor and timestamp.',
                                        },
                                    ]}
                                />
                            ),
                        },
                    ]}
                />
            )}
        </Drawer>
    );
};

export default UserDetailWorkspace;

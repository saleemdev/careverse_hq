import React from 'react';
import { Button, Dropdown, Popconfirm, Space, Table, Tag, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
    CheckCircleOutlined,
    EditOutlined,
    EyeOutlined,
    LockOutlined,
    MoreOutlined,
    StopOutlined,
} from '@ant-design/icons';
import type { UserManagementUser } from '../../../services/api';

const { Text } = Typography;

interface UserDirectoryTableProps {
    users: UserManagementUser[];
    loading: boolean;
    page: number;
    pageSize: number;
    total: number;
    onPageChange: (page: number) => void;
    onManageUser: (user: UserManagementUser) => void;
    onEditSecurity: (user: UserManagementUser) => void;
    onResetPassword: (user: UserManagementUser) => void;
    onToggleStatus: (user: UserManagementUser) => void;
}

const UserDirectoryTable: React.FC<UserDirectoryTableProps> = ({
    users,
    loading,
    page,
    pageSize,
    total,
    onPageChange,
    onManageUser,
    onEditSecurity,
    onResetPassword,
    onToggleStatus,
}) => {
    const columns: ColumnsType<UserManagementUser> = [
        {
            title: 'User',
            key: 'user',
            width: 260,
            render: (_, record) => (
                <div>
                    <Text strong>{record.full_name || `${record.first_name} ${record.last_name}`}</Text>
                    <br />
                    <Text type="secondary" style={{ fontSize: 12 }}>
                        {record.email}
                    </Text>
                </div>
            ),
        },
        {
            title: 'Roles',
            dataIndex: 'roles',
            key: 'roles',
            render: (roles: string[]) => (
                <Space size={4} wrap>
                    {(roles || []).slice(0, 2).map((role) => (
                        <Tag
                            key={role}
                            style={{
                                marginInlineEnd: 0,
                                color: 'var(--text-primary)',
                                background: 'var(--bg-tertiary)',
                                border: '1px solid var(--border-color)',
                                fontWeight: 500,
                            }}
                        >
                            {role}
                        </Tag>
                    ))}
                    {(roles || []).length > 2 && (
                        <Tag style={{ color: 'var(--text-secondary)', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)' }}>
                            +{roles.length - 2}
                        </Tag>
                    )}
                </Space>
            ),
        },
        {
            title: 'Scope',
            key: 'scope',
            render: (_, record) => (
                <Text type="secondary" style={{ fontSize: 12 }}>
                    {(record.scope_summary?.companies || 0)} companies
                </Text>
            ),
        },
        {
            title: 'Status',
            dataIndex: 'enabled',
            key: 'enabled',
            width: 160,
            render: (enabled: number) => (
                <Tag color={enabled ? 'success' : 'default'} icon={enabled ? <CheckCircleOutlined /> : <StopOutlined />}>
                    {enabled ? 'Enabled' : 'Disabled'}
                </Tag>
            ),
        },
        {
            title: 'Actions',
            key: 'actions',
            fixed: 'right',
            width: 180,
            render: (_, record) => {
                const menuItems = [
                    {
                        key: 'security',
                        icon: <EyeOutlined />,
                        label: 'Open Security View',
                        onClick: () => onEditSecurity(record),
                    },
                    {
                        key: 'reset',
                        icon: <LockOutlined />,
                        label: 'Reset Password',
                        onClick: () => onResetPassword(record),
                    },
                ];

                return (
                    <Space size={8}>
                        <Button
                            type="default"
                            icon={<EditOutlined />}
                            size="small"
                            onClick={() => onManageUser(record)}
                            style={{
                                color: 'var(--color-primary)',
                                borderColor: 'var(--color-primary)',
                                background: 'transparent',
                                fontWeight: 600,
                            }}
                        >
                            Manage
                        </Button>
                        <Popconfirm
                            title={record.enabled ? 'Deactivate User' : 'Activate User'}
                            description={`Are you sure you want to ${record.enabled ? 'deactivate' : 'activate'} this user?`}
                            onConfirm={() => onToggleStatus(record)}
                            okText="Confirm"
                            cancelText="Cancel"
                        >
                            <Button danger={record.enabled === 1} size="small">
                                {record.enabled ? 'Deactivate' : 'Activate'}
                            </Button>
                        </Popconfirm>
                        <Dropdown menu={{ items: menuItems }} trigger={['click']}>
                            <Button icon={<MoreOutlined />} size="small" />
                        </Dropdown>
                    </Space>
                );
            },
        },
    ];

    return (
        <Table
            rowKey="id"
            loading={loading}
            columns={columns}
            dataSource={users}
            scroll={{ x: 980 }}
            pagination={{
                current: page,
                pageSize,
                total,
                onChange: onPageChange,
                showSizeChanger: false,
                showTotal: (value) => `Total ${value} users`,
            }}
        />
    );
};

export default UserDirectoryTable;

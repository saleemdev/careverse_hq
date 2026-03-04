import React from 'react';
import { Button, Space, Typography } from 'antd';
import { UserAddOutlined, TeamOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

interface UserDirectoryHeaderProps {
    totalUsers: number;
    activeUsers: number;
    inactiveUsers: number;
    pendingResetUsers: number;
    onCreateUser: () => void;
}

const kpiCardStyle: React.CSSProperties = {
    minWidth: 120,
    borderRadius: 10,
    border: '1px solid var(--border-color)',
    background: 'var(--bg-tertiary)',
    padding: '10px 12px',
};

const labelStyle: React.CSSProperties = {
    display: 'block',
    color: 'var(--text-secondary)',
    fontSize: 12,
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
};

const valueStyle: React.CSSProperties = {
    color: 'var(--text-primary)',
    fontSize: 20,
    fontWeight: 700,
    lineHeight: 1.2,
};

const UserDirectoryHeader: React.FC<UserDirectoryHeaderProps> = ({
    totalUsers,
    activeUsers,
    inactiveUsers,
    pendingResetUsers,
    onCreateUser,
}) => {
    return (
        <div style={{ marginBottom: 16 }}>
            <div
                style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: 12,
                    marginBottom: 12,
                    flexWrap: 'wrap',
                }}
            >
                <div>
                    <Title level={3} style={{ margin: 0, color: 'var(--text-primary)' }}>
                        <TeamOutlined style={{ marginRight: 8, color: 'var(--color-primary)' }} />
                        User Management
                    </Title>
                    <Text style={{ color: 'var(--text-secondary)' }}>
                        Manage users, roles, and scoped permissions from one workspace.
                    </Text>
                </div>
                <Button type="primary" icon={<UserAddOutlined />} onClick={onCreateUser}>
                    Create User
                </Button>
            </div>

            <Space wrap size={8}>
                <div style={kpiCardStyle}>
                    <span style={labelStyle}>Total Users</span>
                    <span style={valueStyle}>{totalUsers}</span>
                </div>
                <div style={kpiCardStyle}>
                    <span style={labelStyle}>Active</span>
                    <span style={{ ...valueStyle, color: 'var(--color-success)' }}>{activeUsers}</span>
                </div>
                <div style={kpiCardStyle}>
                    <span style={labelStyle}>Inactive</span>
                    <span style={{ ...valueStyle, color: 'var(--color-error)' }}>{inactiveUsers}</span>
                </div>
                <div style={kpiCardStyle}>
                    <span style={labelStyle}>Pending Reset</span>
                    <span style={{ ...valueStyle, color: 'var(--color-warning)' }}>{pendingResetUsers}</span>
                </div>
            </Space>
        </div>
    );
};

export default UserDirectoryHeader;

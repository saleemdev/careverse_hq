import React from 'react';
import { Button, Input, Select, Space, Typography } from 'antd';
import { ReloadOutlined, SearchOutlined } from '@ant-design/icons';
import useResponsive from '../../../hooks/useResponsive';

interface UserFiltersBarProps {
    filters: {
        search: string;
        status: 'enabled' | 'disabled' | '';
        role: string;
        company: string;
    };
    roles: string[];
    companies: string[];
    loading: boolean;
    onFiltersChange: (filters: Partial<UserFiltersBarProps['filters']>) => void;
    onRefresh: () => void;
}

const UserFiltersBar: React.FC<UserFiltersBarProps> = ({
    filters,
    roles,
    companies,
    loading,
    onFiltersChange,
    onRefresh,
}) => {
    const { isMobile } = useResponsive();
    const { Text } = Typography;

    const fieldLabelStyle: React.CSSProperties = {
        display: 'block',
        marginBottom: 6,
        color: 'var(--text-secondary)',
        fontSize: 12,
        fontWeight: 600,
        letterSpacing: 0.2,
    };

    return (
        <div
            style={{
                border: '1px solid var(--border-color)',
                borderRadius: 10,
                padding: 12,
                marginBottom: 16,
                background: 'var(--bg-tertiary)',
            }}
        >
            <Space wrap style={{ width: '100%', justifyContent: 'space-between' }}>
                <Space wrap>
                    <div>
                        <Text style={fieldLabelStyle}>Search</Text>
                        <Input
                            allowClear
                            prefix={<SearchOutlined />}
                            placeholder="Name or email"
                            value={filters.search}
                            style={{ width: isMobile ? 220 : 260 }}
                            onChange={(event) => onFiltersChange({ search: event.target.value })}
                        />
                    </div>
                    <div>
                        <Text style={fieldLabelStyle}>Status</Text>
                        <Select
                            allowClear
                            placeholder="Any"
                            value={filters.status || undefined}
                            style={{ width: isMobile ? 130 : 150 }}
                            options={[
                                { value: 'enabled', label: 'Enabled' },
                                { value: 'disabled', label: 'Disabled' },
                            ]}
                            onChange={(value) => onFiltersChange({ status: (value as 'enabled' | 'disabled' | undefined) || '' })}
                        />
                    </div>
                    <div>
                        <Text style={fieldLabelStyle}>Role</Text>
                        <Select
                            allowClear
                            placeholder="Any role"
                            value={filters.role || undefined}
                            style={{ width: isMobile ? 180 : 220 }}
                            options={roles.map((role) => ({ label: role, value: role }))}
                            onChange={(value) => onFiltersChange({ role: (value as string) || '' })}
                        />
                    </div>
                    <div>
                        <Text style={fieldLabelStyle}>Company Scope</Text>
                        <Select
                            allowClear
                            showSearch
                            placeholder="Any company"
                            style={{ width: isMobile ? 180 : 240 }}
                            value={filters.company || undefined}
                            options={companies.map((company) => ({ label: company, value: company }))}
                            onChange={(value) => onFiltersChange({ company: (value as string) || '' })}
                        />
                    </div>
                </Space>

                <Button icon={<ReloadOutlined />} onClick={onRefresh} loading={loading}>
                    Refresh
                </Button>
            </Space>
        </div>
    );
};

export default UserFiltersBar;

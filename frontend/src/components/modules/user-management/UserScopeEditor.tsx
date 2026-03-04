import React, { useMemo, useState } from 'react';
import { Alert, Button, Card, Select, Space, Typography } from 'antd';
import type { UserScopePermission } from '../../../services/api';

const { Text } = Typography;

interface UserScopeEditorProps {
    companies: string[];
    currentScopes: UserScopePermission[];
    loading?: boolean;
    onSave: (scopes: UserScopePermission[]) => Promise<void>;
}

const UserScopeEditor: React.FC<UserScopeEditorProps> = ({
    companies,
    currentScopes,
    loading = false,
    onSave,
}) => {
    const initialCompanies = useMemo(
        () => currentScopes.filter((scope) => scope.allow === 'Company').map((scope) => scope.for_value),
        [currentScopes]
    );

    const [selectedCompanies, setSelectedCompanies] = useState<string[]>(initialCompanies);

    const diffText = useMemo(() => {
        const prev = [...currentScopes]
            .map((scope) => `${scope.allow}:${scope.for_value}`)
            .sort()
            .join(', ');
        const next = selectedCompanies
            .map((value) => `Company:${value}`)
            .sort()
            .join(', ');
        return { prev, next, changed: prev !== next };
    }, [currentScopes, selectedCompanies]);

    const buildScopesPayload = (): UserScopePermission[] => (
        selectedCompanies.map((company) => ({
            allow: 'Company' as const,
            for_value: company,
            is_default: 0,
            apply_to_all_doctypes: 1,
        }))
    );

    return (
        <Card size="small" bordered style={{ borderColor: 'var(--border-color-light)' }}>
            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                <Text strong>Scoped User Permissions</Text>
                <div>
                    <Text type="secondary">Company Scope</Text>
                    <Select
                        mode="multiple"
                        showSearch
                        style={{ width: '100%', marginTop: 6 }}
                        placeholder="Select companies"
                        options={companies.map((name) => ({ label: name, value: name }))}
                        value={selectedCompanies}
                        onChange={setSelectedCompanies}
                    />
                </div>

                {diffText.changed && (
                    <Alert
                        type="info"
                        showIcon
                        message="Pending scope changes"
                        description={`Current: ${diffText.prev || 'None'} -> New: ${diffText.next || 'None'}`}
                    />
                )}

                <Button type="primary" disabled={!diffText.changed} loading={loading} onClick={() => onSave(buildScopesPayload())}>
                    Save Scope Permissions
                </Button>
            </Space>
        </Card>
    );
};

export default UserScopeEditor;

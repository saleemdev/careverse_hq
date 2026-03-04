import React, { useMemo, useState } from 'react';
import { Alert, Button, Select, Space, Typography } from 'antd';

const { Text } = Typography;

interface UserRolesEditorProps {
    availableRoles: string[];
    currentRoles: string[];
    loading?: boolean;
    onSave: (roles: string[]) => Promise<void>;
}

const UserRolesEditor: React.FC<UserRolesEditorProps> = ({
    availableRoles,
    currentRoles,
    loading = false,
    onSave,
}) => {
    const [rolesDraft, setRolesDraft] = useState<string[]>(currentRoles);
    const hasChanges = useMemo(() => {
        const current = [...currentRoles].sort().join('|');
        const draft = [...rolesDraft].sort().join('|');
        return current !== draft;
    }, [currentRoles, rolesDraft]);

    return (
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
            <Text strong>Role Assignment</Text>
            <Select
                mode="multiple"
                value={rolesDraft}
                style={{ width: '100%' }}
                placeholder="Assign one or more roles"
                options={availableRoles.map((role) => ({ label: role, value: role }))}
                onChange={(values) => setRolesDraft(values)}
            />

            {hasChanges && (
                <Alert
                    type="info"
                    showIcon
                    message="Pending role changes"
                    description={`Current: ${currentRoles.join(', ') || 'None'} -> New: ${rolesDraft.join(', ') || 'None'}`}
                />
            )}

            <Button type="primary" disabled={!hasChanges} loading={loading} onClick={() => onSave(rolesDraft)}>
                Save Roles
            </Button>
        </Space>
    );
};

export default UserRolesEditor;

import React, { useEffect, useMemo, useState } from 'react';
import { Breadcrumb, Card, Modal, message } from 'antd';
import { HomeOutlined, TeamOutlined } from '@ant-design/icons';
import useUserManagementStore from '../../stores/modules/userManagementStore';
import type { UserManagementUser } from '../../services/api';
import UserDirectoryHeader from '../../components/modules/user-management/UserDirectoryHeader';
import UserFiltersBar from '../../components/modules/user-management/UserFiltersBar';
import UserDirectoryTable from '../../components/modules/user-management/UserDirectoryTable';
import UserDetailWorkspace from '../../components/modules/user-management/UserDetailWorkspace';
import UserCreateWizard from '../../components/modules/user-management/UserCreateWizard';

interface UserManagementPageProps {
    navigateToRoute: (route: string, id?: string) => void;
    selectedUserId?: string | null;
    viewMode?: 'directory' | 'create' | 'security';
}

const UserManagementPage: React.FC<UserManagementPageProps> = ({
    navigateToRoute,
    selectedUserId = null,
    viewMode = 'directory',
}) => {
    const {
        users,
        selectedUser,
        referenceData,
        filters,
        pagination,
        loadingList,
        loadingDetail,
        mutating,
        error,
        fetchReferenceData,
        fetchUsers,
        fetchUserDetail,
        setFilters,
        setPage,
        createUser,
        updateUserProfile,
        updateUserStatus,
        updateUserRoles,
        updateUserScopePermissions,
        resetUserPassword,
        clearSelectedUser,
    } = useUserManagementStore();

    const [detailOpen, setDetailOpen] = useState(false);

    useEffect(() => {
        fetchReferenceData();
    }, [fetchReferenceData]);

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers, filters, pagination.page]);

    useEffect(() => {
        if (selectedUserId) {
            fetchUserDetail(selectedUserId);
            setDetailOpen(true);
            return;
        }
        clearSelectedUser();
        setDetailOpen(false);
    }, [selectedUserId, fetchUserDetail, clearSelectedUser]);

    const stats = useMemo(() => {
        const activeUsers = users.filter((user) => user.enabled === 1).length;
        const inactiveUsers = users.filter((user) => user.enabled === 0).length;
        const pendingResetUsers = users.filter((user) => user.must_reset_password === 1).length;
        return {
            totalUsers: pagination.total || users.length,
            activeUsers,
            inactiveUsers,
            pendingResetUsers,
        };
    }, [users, pagination.total]);

    const openManageUser = (user: UserManagementUser) => {
        navigateToRoute('user-management', user.id);
    };

    const openSecurityView = (user: UserManagementUser) => {
        navigateToRoute('user-management/security', user.id);
    };

    const onResetPassword = async (user: UserManagementUser) => {
        const result = await resetUserPassword(user.id);
        if (!result.success) {
            message.error(result.error || 'Failed to reset password');
            return;
        }
        Modal.info({
            title: 'Password Reset Successful',
            content: result.tempPassword
                ? `Temporary Password: ${result.tempPassword}`
                : 'A password reset email has been sent to the user.',
        });
    };

    const onToggleUserStatus = async (user: UserManagementUser) => {
        const ok = await updateUserStatus(user.id, user.enabled ? 0 : 1, 'Changed from directory action');
        if (!ok) {
            message.error('Failed to update user status');
            return;
        }
        message.success(user.enabled ? 'User deactivated' : 'User activated');
    };

    const isCreateMode = viewMode === 'create';

    return (
        <div style={{ padding: '16px 20px' }}>
            <Breadcrumb style={{ marginBottom: 12 }}>
                <Breadcrumb.Item>
                    <HomeOutlined />
                </Breadcrumb.Item>
                <Breadcrumb.Item>
                    <TeamOutlined /> User Management
                </Breadcrumb.Item>
                {isCreateMode && <Breadcrumb.Item>Create User</Breadcrumb.Item>}
            </Breadcrumb>

            <Card style={{ borderRadius: 12 }}>
                {isCreateMode ? (
                    <UserCreateWizard
                        roles={referenceData.roles}
                        companies={referenceData.companies}
                        loading={mutating}
                        onSubmit={createUser}
                        onCancel={() => navigateToRoute('user-management')}
                        onCompleted={() => navigateToRoute('user-management')}
                    />
                ) : (
                    <>
                        <UserDirectoryHeader
                            totalUsers={stats.totalUsers}
                            activeUsers={stats.activeUsers}
                            inactiveUsers={stats.inactiveUsers}
                            pendingResetUsers={stats.pendingResetUsers}
                            onCreateUser={() => navigateToRoute('user-management/new')}
                        />

                        <UserFiltersBar
                            filters={filters}
                            roles={referenceData.roles}
                            companies={referenceData.companies}
                            loading={loadingList}
                            onFiltersChange={setFilters}
                            onRefresh={fetchUsers}
                        />

                        <UserDirectoryTable
                            users={users}
                            loading={loadingList}
                            page={pagination.page}
                            pageSize={pagination.pageSize}
                            total={pagination.total}
                            onPageChange={setPage}
                            onManageUser={openManageUser}
                            onEditSecurity={openSecurityView}
                            onResetPassword={onResetPassword}
                            onToggleStatus={onToggleUserStatus}
                        />
                    </>
                )}
            </Card>

            {error && (
                <div style={{ marginTop: 12, color: 'var(--color-error)', fontSize: 12 }}>
                    {error}
                </div>
            )}

            <UserDetailWorkspace
                open={detailOpen}
                loading={loadingDetail || mutating}
                user={selectedUser}
                availableRoles={referenceData.roles}
                companies={referenceData.companies}
                initialTab={viewMode === 'security' ? 'security' : 'profile'}
                onClose={() => navigateToRoute('user-management')}
                onSaveProfile={(payload) => selectedUser ? updateUserProfile(selectedUser.id, payload) : Promise.resolve(false)}
                onSaveRoles={(roles) => selectedUser ? updateUserRoles(selectedUser.id, roles) : Promise.resolve(false)}
                onSaveScopes={(scopes) => selectedUser ? updateUserScopePermissions(selectedUser.id, scopes) : Promise.resolve(false)}
                onToggleStatus={(enabled, reason) => selectedUser ? updateUserStatus(selectedUser.id, enabled, reason) : Promise.resolve(false)}
                onResetPassword={() => selectedUser ? resetUserPassword(selectedUser.id) : Promise.resolve({ success: false, error: 'No user selected' })}
            />
        </div>
    );
};

export default UserManagementPage;

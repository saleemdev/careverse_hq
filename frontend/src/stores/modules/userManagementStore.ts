import { create } from 'zustand';
import {
    userManagementApi,
    type UserManagementUser,
    type UserManagementReferenceData,
    type UserScopePermission,
} from '../../services/api';

interface UserManagementFilters {
    search: string;
    status: 'enabled' | 'disabled' | '';
    role: string;
    company: string;
}

interface UserManagementPagination {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
}

interface UserManagementStore {
    users: UserManagementUser[];
    selectedUser: UserManagementUser | null;
    referenceData: UserManagementReferenceData;
    filters: UserManagementFilters;
    pagination: UserManagementPagination;
    loadingList: boolean;
    loadingDetail: boolean;
    mutating: boolean;
    error: string | null;
    fetchReferenceData: () => Promise<void>;
    fetchUsers: () => Promise<void>;
    fetchUserDetail: (userId: string) => Promise<void>;
    setFilters: (filters: Partial<UserManagementFilters>) => void;
    setPage: (page: number) => void;
    createUser: (payload: {
        first_name: string;
        last_name: string;
        email: string;
        phone?: string;
        roles: string[];
        scopes: UserScopePermission[];
    }) => Promise<{ success: boolean; tempPassword?: string; error?: string }>;
    updateUserProfile: (userId: string, payload: { first_name?: string; last_name?: string; phone?: string }) => Promise<boolean>;
    updateUserStatus: (userId: string, enabled: number, reason?: string) => Promise<boolean>;
    updateUserRoles: (userId: string, roles: string[]) => Promise<boolean>;
    updateUserScopePermissions: (userId: string, scopes: UserScopePermission[]) => Promise<boolean>;
    resetUserPassword: (userId: string) => Promise<{ success: boolean; tempPassword?: string; error?: string }>;
    clearSelectedUser: () => void;
}

const defaultReferenceData: UserManagementReferenceData = {
    roles: [],
    companies: [],
};

const useUserManagementStore = create<UserManagementStore>((set, get) => ({
    users: [],
    selectedUser: null,
    referenceData: defaultReferenceData,
    filters: {
        search: '',
        status: '',
        role: '',
        company: '',
    },
    pagination: {
        page: 1,
        pageSize: 20,
        total: 0,
        totalPages: 1,
    },
    loadingList: false,
    loadingDetail: false,
    mutating: false,
    error: null,

    fetchReferenceData: async () => {
        const response = await userManagementApi.getReferenceData();
        if (response.success && response.data) {
            set({ referenceData: response.data });
        }
    },

    fetchUsers: async () => {
        const state = get();
        set({ loadingList: true, error: null });
        try {
            const response = await userManagementApi.listUsers({
                filters: {
                    search: state.filters.search,
                    status: state.filters.status,
                    role: state.filters.role || undefined,
                    company: state.filters.company || undefined,
                },
                page: state.pagination.page,
                page_size: state.pagination.pageSize,
            });

            if (!response.success || !response.data) {
                set({ error: response.error || 'Failed to load users' });
                return;
            }

            set({
                users: response.data.items || [],
                pagination: {
                    page: response.data.pagination.page,
                    pageSize: response.data.pagination.page_size,
                    total: response.data.pagination.total,
                    totalPages: response.data.pagination.total_pages,
                },
            });
        } finally {
            set({ loadingList: false });
        }
    },

    fetchUserDetail: async (userId: string) => {
        set({ loadingDetail: true, error: null, selectedUser: null });
        try {
            const response = await userManagementApi.getUserDetail(userId);
            if (!response.success || !response.data) {
                set({ error: response.error || 'Failed to load user details' });
                return;
            }
            set({ selectedUser: response.data.user });
        } finally {
            set({ loadingDetail: false });
        }
    },

    setFilters: (filters: Partial<UserManagementFilters>) => {
        set((state) => ({
            filters: { ...state.filters, ...filters },
            pagination: { ...state.pagination, page: 1 },
        }));
    },

    setPage: (page: number) => {
        set((state) => ({ pagination: { ...state.pagination, page } }));
    },

    createUser: async (payload) => {
        set({ mutating: true, error: null });
        try {
            const response = await userManagementApi.createUser(payload, 'email_and_display');
            if (!response.success || !response.data) {
                const error = response.error || 'Failed to create user';
                set({ error });
                return { success: false, error };
            }
            await get().fetchUsers();
            return {
                success: true,
                tempPassword: response.data.temp_password,
            };
        } finally {
            set({ mutating: false });
        }
    },

    updateUserProfile: async (userId, payload) => {
        set({ mutating: true, error: null });
        try {
            const response = await userManagementApi.updateUserProfile(userId, payload);
            if (!response.success) {
                set({ error: response.error || 'Failed to update profile' });
                return false;
            }
            await get().fetchUserDetail(userId);
            await get().fetchUsers();
            return true;
        } finally {
            set({ mutating: false });
        }
    },

    updateUserStatus: async (userId, enabled, reason) => {
        set({ mutating: true, error: null });
        try {
            const response = await userManagementApi.updateUserStatus(userId, enabled, reason);
            if (!response.success) {
                set({ error: response.error || 'Failed to update user status' });
                return false;
            }
            await get().fetchUsers();
            if (get().selectedUser?.id === userId) {
                await get().fetchUserDetail(userId);
            }
            return true;
        } finally {
            set({ mutating: false });
        }
    },

    updateUserRoles: async (userId, roles) => {
        set({ mutating: true, error: null });
        try {
            const response = await userManagementApi.updateUserRoles(userId, roles);
            if (!response.success) {
                set({ error: response.error || 'Failed to update user roles' });
                return false;
            }
            await get().fetchUserDetail(userId);
            await get().fetchUsers();
            return true;
        } finally {
            set({ mutating: false });
        }
    },

    updateUserScopePermissions: async (userId, scopes) => {
        set({ mutating: true, error: null });
        try {
            const response = await userManagementApi.updateUserScopePermissions(userId, scopes);
            if (!response.success) {
                set({ error: response.error || 'Failed to update user permissions' });
                return false;
            }
            await get().fetchUserDetail(userId);
            await get().fetchUsers();
            return true;
        } finally {
            set({ mutating: false });
        }
    },

    resetUserPassword: async (userId) => {
        set({ mutating: true, error: null });
        try {
            const response = await userManagementApi.resetUserPassword(userId, 'email_and_display');
            if (!response.success || !response.data) {
                const error = response.error || 'Failed to reset password';
                set({ error });
                return { success: false, error };
            }
            return { success: true, tempPassword: response.data.temp_password };
        } finally {
            set({ mutating: false });
        }
    },

    clearSelectedUser: () => set({ selectedUser: null, error: null }),
}));

export default useUserManagementStore;

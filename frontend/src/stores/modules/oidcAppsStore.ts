import { create } from 'zustand';
import {
    oidcAppsApi,
    type OidcApp,
    type OidcAppDetailResponse,
    type OidcAppReferenceData,
    type OidcQuickstartResponse,
} from '../../services/api';

interface OidcAppsFilters {
    search: string;
    status: string;
    client_type: string;
}

interface OidcAppsPagination {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
}

interface OidcAppsStore {
    apps: OidcApp[];
    selectedApp: OidcAppDetailResponse | null;
    quickstart: OidcQuickstartResponse | null;
    referenceData: OidcAppReferenceData;
    filters: OidcAppsFilters;
    pagination: OidcAppsPagination;
    loadingList: boolean;
    loadingDetail: boolean;
    loadingQuickstart: boolean;
    mutating: boolean;
    error: string | null;
    fetchReferenceData: () => Promise<void>;
    fetchApps: () => Promise<void>;
    fetchAppDetail: (appId: string) => Promise<boolean>;
    fetchQuickstart: (appId: string) => Promise<boolean>;
    createApp: (payload: {
        app_name: string;
        owner_system?: string;
        contacts?: string;
        status?: string;
        client_type: string;
        trusted_client: number;
        default_redirect_uri: string;
        redirect_uris: string[];
        scopes: string[];
        description?: string;
    }) => Promise<{ success: boolean; app?: OidcApp; credentials?: { client_id: string; client_secret: string }; error?: string }>;
    updateApp: (appId: string, payload: Record<string, unknown>) => Promise<boolean>;
    setAppStatus: (appId: string, status: string, reason?: string) => Promise<boolean>;
    rotateClientSecret: (appId: string, reason?: string) => Promise<{ success: boolean; client_secret?: string; error?: string }>;
    setFilters: (filters: Partial<OidcAppsFilters>) => void;
    setPage: (page: number) => void;
    clearSelectedApp: () => void;
}

const defaultReferenceData: OidcAppReferenceData = {
    client_types: [],
    statuses: [],
    supported_scopes: [],
};

const useOidcAppsStore = create<OidcAppsStore>((set, get) => ({
    apps: [],
    selectedApp: null,
    quickstart: null,
    referenceData: defaultReferenceData,
    filters: {
        search: '',
        status: '',
        client_type: '',
    },
    pagination: {
        page: 1,
        pageSize: 20,
        total: 0,
        totalPages: 1,
    },
    loadingList: false,
    loadingDetail: false,
    loadingQuickstart: false,
    mutating: false,
    error: null,

    fetchReferenceData: async () => {
        const response = await oidcAppsApi.getReferenceData();
        if (response.success && response.data) {
            set({ referenceData: response.data });
        }
    },

    fetchApps: async () => {
        const { filters, pagination } = get();
        set({ loadingList: true, error: null });
        try {
            const response = await oidcAppsApi.listApps({
                filters: {
                    search: filters.search || undefined,
                    status: filters.status || undefined,
                    client_type: filters.client_type || undefined,
                },
                page: pagination.page,
                page_size: pagination.pageSize,
            });

            if (!response.success || !response.data) {
                set({ error: response.error || "We couldn't load sign-in apps.", apps: [] });
                return;
            }

            set({
                apps: response.data.items || [],
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

    fetchAppDetail: async (appId: string) => {
        set({ loadingDetail: true, error: null, selectedApp: null });
        try {
            const response = await oidcAppsApi.getAppDetail(appId);
            if (!response.success || !response.data) {
                set({ error: response.error || "We couldn't load app details." });
                return false;
            }
            set({ selectedApp: response.data });
            return true;
        } finally {
            set({ loadingDetail: false });
        }
    },

    fetchQuickstart: async (appId: string) => {
        set({ loadingQuickstart: true, error: null, quickstart: null });
        try {
            const response = await oidcAppsApi.getQuickstart(appId);
            if (!response.success || !response.data) {
                set({ error: response.error || "We couldn't load setup details." });
                return false;
            }
            set({ quickstart: response.data });
            return true;
        } finally {
            set({ loadingQuickstart: false });
        }
    },

    createApp: async (payload) => {
        set({ mutating: true, error: null });
        try {
            const response = await oidcAppsApi.createApp(payload);
            if (!response.success || !response.data) {
                const error = response.error || "We couldn't create the sign-in app.";
                set({ error });
                return { success: false, error };
            }

            await get().fetchApps();
            return {
                success: true,
                app: response.data.app,
                credentials: response.data.credentials,
            };
        } finally {
            set({ mutating: false });
        }
    },

    updateApp: async (appId, payload) => {
        set({ mutating: true, error: null });
        try {
            const response = await oidcAppsApi.updateApp(appId, payload);
            if (!response.success) {
                set({ error: response.error || "We couldn't save app changes." });
                return false;
            }
            await get().fetchApps();
            if (get().selectedApp?.app?.id === appId) {
                await get().fetchAppDetail(appId);
            }
            return true;
        } finally {
            set({ mutating: false });
        }
    },

    setAppStatus: async (appId, status, reason) => {
        set({ mutating: true, error: null });
        try {
            const response = await oidcAppsApi.setAppStatus(appId, status, reason);
            if (!response.success) {
                set({ error: response.error || "We couldn't update app status." });
                return false;
            }
            await get().fetchApps();
            if (get().selectedApp?.app?.id === appId) {
                await get().fetchAppDetail(appId);
            }
            return true;
        } finally {
            set({ mutating: false });
        }
    },

    rotateClientSecret: async (appId, reason) => {
        set({ mutating: true, error: null });
        try {
            const response = await oidcAppsApi.rotateClientSecret(appId, reason);
            if (!response.success || !response.data) {
                const error = response.error || "We couldn't rotate the secret.";
                set({ error });
                return { success: false, error };
            }
            await get().fetchApps();
            if (get().selectedApp?.app?.id === appId) {
                await get().fetchAppDetail(appId);
            }
            return {
                success: true,
                client_secret: response.data.client_secret,
            };
        } finally {
            set({ mutating: false });
        }
    },

    setFilters: (filters) => {
        set((state) => ({
            filters: { ...state.filters, ...filters },
            pagination: { ...state.pagination, page: 1 },
        }));
    },

    setPage: (page) => {
        set((state) => ({
            pagination: { ...state.pagination, page },
        }));
    },

    clearSelectedApp: () => set({ selectedApp: null, quickstart: null, error: null }),
}));

export default useOidcAppsStore;

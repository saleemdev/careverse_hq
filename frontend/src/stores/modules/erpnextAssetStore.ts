import { create } from 'zustand';
import { erpnextAssetsApi } from '../../services/api';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface AssetItem {
    name: string;
    asset_name: string;
    item_code: string;
    item_name: string;
    asset_category: string;
    status: string;
    location: string;
    facility_name: string;
    facility_id: string;
    custodian: string;
    custodian_name: string;
    company: string;
    department: string;
    purchase_date: string;
    gross_purchase_amount: number;
    value_after_depreciation: number;
    maintenance_required: boolean;
    calculate_depreciation: boolean;
    creation: string;
}

export interface StatusAggregates {
    total: number;
    draft: number;
    submitted: number;
    partially_depreciated: number;
    fully_depreciated: number;
    in_maintenance: number;
    out_of_order: number;
    scrapped: number;
    sold: number;
}

export interface CategoryAggregate {
    category: string;
    count: number;
}

export interface AssetFilters {
    page: number;
    pageSize: number;
    status: string;
    category: string;
    search: string;
    facilities: string[];
    dateFrom: string;
    dateTo: string;
}

export interface AssetDetail extends AssetItem {
    available_for_use_date: string;
    net_purchase_amount: number;
    additional_asset_cost: number;
    total_asset_cost: number;
    is_existing_asset: boolean;
    policy_number: string;
    insurer: string;
    insured_value: number;
    insurance_start_date: string;
    insurance_end_date: string;
    insurance: any;
    maintenance_records: any[];
    maintenance_logs: any[];
    repairs: any[];
    movements: any[];
    depreciation_schedules: any[];
    finance_books: any[];
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

interface ERPNextAssetStore {
    // List
    assets: AssetItem[];
    loading: boolean;
    total: number;
    statusAggregates: StatusAggregates | null;
    categoryAggregates: CategoryAggregate[];
    dashboardLoading: boolean;
    filters: AssetFilters;

    // Detail
    selectedAsset: AssetDetail | null;
    selectedAssetLoading: boolean;
    maintenanceData: any | null;
    repairRecords: any[];
    movementRecords: any[];
    depreciationSummary: any | null;

    // List actions
    fetchAssets: (facilityIds?: string[]) => Promise<void>;
    fetchDashboard: (facilityIds?: string[]) => Promise<void>;
    setFilters: (f: Partial<AssetFilters>) => void;
    resetFilters: () => void;

    // Detail actions
    fetchAssetDetail: (name: string) => Promise<void>;
    clearSelectedAsset: () => void;
    fetchMaintenanceData: (name: string) => Promise<void>;
    fetchRepairs: (name: string) => Promise<void>;
    fetchMovements: (name: string) => Promise<void>;
    fetchDepreciation: (name: string) => Promise<void>;

    // Mutations
    createAsset: (data: any) => Promise<{ success: boolean; name?: string; error?: string }>;
    submitAsset: (name: string) => Promise<boolean>;
    createMaintenanceRequest: (data: any) => Promise<boolean>;
    completeMaintenanceLog: (data: any) => Promise<boolean>;
    createRepairRequest: (data: any) => Promise<boolean>;
    completeRepair: (data: any) => Promise<boolean>;
    createMovement: (data: any) => Promise<boolean>;
}

const DEFAULT_FILTERS: AssetFilters = {
    page: 1,
    pageSize: 20,
    status: '',
    category: '',
    search: '',
    facilities: [],
    dateFrom: '',
    dateTo: '',
};

const useERPNextAssetStore = create<ERPNextAssetStore>((set, get) => ({
    // List state
    assets: [],
    loading: false,
    total: 0,
    statusAggregates: null,
    categoryAggregates: [],
    dashboardLoading: false,
    filters: { ...DEFAULT_FILTERS },

    // Detail state
    selectedAsset: null,
    selectedAssetLoading: false,
    maintenanceData: null,
    repairRecords: [],
    movementRecords: [],
    depreciationSummary: null,

    // -----------------------------------------------------------------------
    // List actions
    // -----------------------------------------------------------------------

    fetchAssets: async (facilityIds) => {
        set({ loading: true });
        const { filters } = get();
        try {
            const response = await erpnextAssetsApi.getAssetsList({
                facilities: facilityIds || filters.facilities,
                page: filters.page,
                pageSize: filters.pageSize,
                status: filters.status,
                category: filters.category,
                search: filters.search,
            });
            if (response.success) {
                set({
                    assets: response.data?.items || [],
                    total: response.data?.total_count || 0,
                });
            }
        } catch (error) {
            console.error('Failed to fetch assets', error);
        } finally {
            set({ loading: false });
        }
    },

    fetchDashboard: async (facilityIds) => {
        set({ dashboardLoading: true });
        const { filters } = get();
        try {
            const response = await erpnextAssetsApi.getDashboard({
                facilities: facilityIds || filters.facilities,
            });
            if (response.success) {
                set({
                    statusAggregates: response.data?.status_aggregates || null,
                    categoryAggregates: response.data?.category_aggregates || [],
                });
            }
        } catch (error) {
            console.error('Failed to fetch dashboard', error);
        } finally {
            set({ dashboardLoading: false });
        }
    },

    setFilters: (newFilters) => {
        set((state) => ({
            filters: { ...state.filters, ...newFilters, page: newFilters.page || 1 },
        }));
    },

    resetFilters: () => {
        set({ filters: { ...DEFAULT_FILTERS } });
    },

    // -----------------------------------------------------------------------
    // Detail actions
    // -----------------------------------------------------------------------

    fetchAssetDetail: async (name) => {
        set({ selectedAssetLoading: true });
        try {
            const response = await erpnextAssetsApi.getAssetDetail(name);
            if (response.success) {
                set({ selectedAsset: response.data });
            }
        } catch (error) {
            console.error('Failed to fetch asset detail', error);
        } finally {
            set({ selectedAssetLoading: false });
        }
    },

    clearSelectedAsset: () => {
        set({
            selectedAsset: null,
            maintenanceData: null,
            repairRecords: [],
            movementRecords: [],
            depreciationSummary: null,
        });
    },

    fetchMaintenanceData: async (name) => {
        try {
            const response = await erpnextAssetsApi.getMaintenanceSchedule(name);
            if (response.success) {
                set({ maintenanceData: response.data });
            }
        } catch (error) {
            console.error('Failed to fetch maintenance', error);
        }
    },

    fetchRepairs: async (name) => {
        try {
            const response = await erpnextAssetsApi.getRepairs(name);
            if (response.success) {
                set({ repairRecords: response.data?.items || [] });
            }
        } catch (error) {
            console.error('Failed to fetch repairs', error);
        }
    },

    fetchMovements: async (name) => {
        try {
            const response = await erpnextAssetsApi.getMovements(name);
            if (response.success) {
                set({ movementRecords: response.data?.items || [] });
            }
        } catch (error) {
            console.error('Failed to fetch movements', error);
        }
    },

    fetchDepreciation: async (name) => {
        try {
            const response = await erpnextAssetsApi.getDepreciationSummary(name);
            if (response.success) {
                set({ depreciationSummary: response.data });
            }
        } catch (error) {
            console.error('Failed to fetch depreciation', error);
        }
    },

    // -----------------------------------------------------------------------
    // Mutations
    // -----------------------------------------------------------------------

    createAsset: async (data) => {
        try {
            const response = await erpnextAssetsApi.createAsset(data);
            if (response.success) {
                return { success: true, name: response.data?.name };
            }
            return { success: false, error: response.error || response.message || 'Failed to create asset' };
        } catch (error: any) {
            console.error('Failed to create asset', error);
            return { success: false, error: error?.message || 'Unexpected error creating asset' };
        }
    },

    submitAsset: async (name) => {
        try {
            const response = await erpnextAssetsApi.submitAsset(name);
            if (response.success) {
                // Refresh detail
                get().fetchAssetDetail(name);
                return true;
            }
            return false;
        } catch (error) {
            console.error('Failed to submit asset', error);
            return false;
        }
    },

    createMaintenanceRequest: async (data) => {
        try {
            const response = await erpnextAssetsApi.createMaintenanceRequest(data);
            if (response.success && data.asset_name) {
                get().fetchMaintenanceData(data.asset_name);
            }
            return response.success;
        } catch (error) {
            console.error('Failed to create maintenance', error);
            return false;
        }
    },

    completeMaintenanceLog: async (data) => {
        try {
            const response = await erpnextAssetsApi.completeMaintenanceLog(data);
            return response.success;
        } catch (error) {
            console.error('Failed to complete maintenance log', error);
            return false;
        }
    },

    createRepairRequest: async (data) => {
        try {
            const response = await erpnextAssetsApi.createRepairRequest(data);
            if (response.success && data.asset_name) {
                get().fetchRepairs(data.asset_name);
                get().fetchAssetDetail(data.asset_name);
            }
            return response.success;
        } catch (error) {
            console.error('Failed to create repair', error);
            return false;
        }
    },

    completeRepair: async (data) => {
        try {
            const response = await erpnextAssetsApi.completeRepair(data);
            return response.success;
        } catch (error) {
            console.error('Failed to complete repair', error);
            return false;
        }
    },

    createMovement: async (data) => {
        try {
            const response = await erpnextAssetsApi.createMovement(data);
            if (response.success && data.asset_name) {
                get().fetchMovements(data.asset_name);
                get().fetchAssetDetail(data.asset_name);
            }
            return response.success;
        } catch (error) {
            console.error('Failed to create movement', error);
            return false;
        }
    },
}));

export default useERPNextAssetStore;

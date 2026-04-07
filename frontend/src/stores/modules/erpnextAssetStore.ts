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
    purchase_receipt: string;
    purchase_invoice: string;
    opening_accumulated_depreciation: number;
    opening_number_of_booked_depreciations: number;
    policy_number: string;
    insurer: string;
    insured_value: number;
    insurance_start_date: string;
    insurance_end_date: string;
    insurance: AssetInsurance;
    maintenance_records: MaintenanceTask[];
    maintenance_logs: MaintenanceLog[];
    repairs: RepairRecord[];
    movements: MovementRecord[];
    depreciation_schedules: DepreciationScheduleGroup[];
    finance_books: AssetFinanceBook[];
}

export interface AssetInsurance {
    policy_number?: string;
    insurer?: string;
    insured_value?: number;
    insurance_start_date?: string;
    insurance_end_date?: string;
}

export interface MaintenanceTask {
    name: string;
    maintenance_type?: string;
    due_date?: string;
    maintenance_status?: string;
    completion_date?: string;
    actions_performed?: string;
}

export interface MaintenanceLog {
    name: string;
    maintenance_type?: string;
    maintenance_status?: string;
    completion_date?: string;
    actions_performed?: string;
}

export interface RepairRecord {
    name: string;
    failure_date?: string;
    description?: string;
    repair_status?: string;
    completion_date?: string;
    total_repair_cost?: number;
}

export interface MovementRecord {
    name: string;
    purpose: string;
    transaction_date: string;
    source_location?: string;
    source_location_name?: string;
    target_location?: string;
    target_location_name?: string;
    from_employee_name?: string;
    to_employee_name?: string;
}

export interface DepreciationScheduleEntry {
    schedule_date: string;
    depreciation_amount: number;
    accumulated_depreciation_amount: number;
    journal_entry?: string;
}

export interface DepreciationScheduleGroup {
    name: string;
    finance_book?: string;
    entries: DepreciationScheduleEntry[];
}

export interface DepreciationSummary {
    totals?: {
        value_after_depreciation?: number;
        next_depreciation_date?: string;
    };
    schedules?: DepreciationScheduleGroup[];
}

export interface AssetFinanceBook {
    finance_book?: string;
    depreciation_method?: string;
    total_number_of_depreciations?: number;
    frequency_of_depreciation?: number;
    expected_value_after_useful_life?: number;
    depreciation_start_date?: string;
    rate_of_depreciation?: number;
}

type MutationResult = { success: boolean; error?: string; warning?: string };
type CreateAssetResult = { success: boolean; name?: string; error?: string; warning?: string };

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

interface ERPNextAssetStore {
    // List
    assets: AssetItem[];
    loading: boolean;
    listError: string | null;
    total: number;
    statusAggregates: StatusAggregates | null;
    categoryAggregates: CategoryAggregate[];
    dashboardLoading: boolean;
    dashboardError: string | null;
    filters: AssetFilters;

    // Detail
    selectedAsset: AssetDetail | null;
    selectedAssetLoading: boolean;
    activeAssetName: string | null;
    detailError: string | null;
    maintenanceData: { tasks: MaintenanceTask[]; logs: MaintenanceLog[] } | null;
    repairRecords: RepairRecord[];
    movementRecords: MovementRecord[];
    depreciationSummary: DepreciationSummary | null;

    // List actions
    fetchAssets: (facilityIds?: string[]) => Promise<void>;
    fetchDashboard: (facilityIds?: string[]) => Promise<void>;
    setFilters: (f: Partial<AssetFilters>) => void;
    resetFilters: () => void;

    // Detail actions
    fetchAssetDetail: (name: string) => Promise<boolean>;
    clearSelectedAsset: () => void;
    fetchMaintenanceData: (name: string) => Promise<boolean>;
    fetchRepairs: (name: string) => Promise<boolean>;
    fetchMovements: (name: string) => Promise<boolean>;
    fetchDepreciation: (name: string) => Promise<boolean>;
    refreshAssetBundle: (name: string) => Promise<boolean>;

    // Mutations
    createAsset: (data: Record<string, unknown>) => Promise<CreateAssetResult>;
    updateAsset: (name: string, data: Record<string, unknown>) => Promise<MutationResult>;
    submitAsset: (name: string) => Promise<MutationResult>;
    createMaintenanceRequest: (data: Record<string, unknown>) => Promise<MutationResult>;
    completeMaintenanceLog: (data: Record<string, unknown>) => Promise<MutationResult>;
    createRepairRequest: (data: Record<string, unknown>) => Promise<MutationResult>;
    completeRepair: (data: Record<string, unknown>) => Promise<MutationResult>;
    createMovement: (data: Record<string, unknown>) => Promise<MutationResult>;
}

const getErrorMessage = (error: unknown, fallback: string) => (
    error instanceof Error ? error.message : fallback
);

const delay = async (milliseconds: number) => new Promise((resolve) => {
    window.setTimeout(resolve, milliseconds);
});

const reconcileAssetByName = async (assetName: string, attempts = 3): Promise<boolean> => {
    const normalizedName = assetName.trim();
    if (!normalizedName) {
        return false;
    }

    for (let attempt = 0; attempt < attempts; attempt += 1) {
        const response = await erpnextAssetsApi.getAssetDetail(normalizedName);
        if (response.success) {
            return true;
        }
        if (attempt < attempts - 1) {
            await delay(450);
        }
    }

    return false;
};

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

let assetsFetchSeq = 0;
let dashboardFetchSeq = 0;
let detailFetchSeq = 0;
let maintenanceFetchSeq = 0;
let repairsFetchSeq = 0;
let movementsFetchSeq = 0;
let depreciationFetchSeq = 0;

const useERPNextAssetStore = create<ERPNextAssetStore>((set, get) => ({
    // List state
    assets: [],
    loading: false,
    listError: null,
    total: 0,
    statusAggregates: null,
    categoryAggregates: [],
    dashboardLoading: false,
    dashboardError: null,
    filters: { ...DEFAULT_FILTERS },

    // Detail state
    selectedAsset: null,
    selectedAssetLoading: false,
    activeAssetName: null,
    detailError: null,
    maintenanceData: null,
    repairRecords: [],
    movementRecords: [],
    depreciationSummary: null,

    // -----------------------------------------------------------------------
    // List actions
    // -----------------------------------------------------------------------

    fetchAssets: async (facilityIds) => {
        const requestSeq = ++assetsFetchSeq;
        set({ loading: true, listError: null });
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
            if (requestSeq !== assetsFetchSeq) {
                return;
            }
            if (response.success) {
                set({
                    assets: response.data?.items || [],
                    total: response.data?.total_count || 0,
                    listError: null,
                });
            } else {
                set({
                    assets: [],
                    total: 0,
                    listError: response.error || response.message || 'Failed to fetch assets',
                });
            }
        } catch (error) {
            console.error('Failed to fetch assets', error);
            if (requestSeq === assetsFetchSeq) {
                set({
                    assets: [],
                    total: 0,
                    listError: getErrorMessage(error, 'Failed to fetch assets'),
                });
            }
        } finally {
            if (requestSeq === assetsFetchSeq) {
                set({ loading: false });
            }
        }
    },

    fetchDashboard: async (facilityIds) => {
        const requestSeq = ++dashboardFetchSeq;
        set({ dashboardLoading: true, dashboardError: null });
        const { filters } = get();
        try {
            const response = await erpnextAssetsApi.getDashboard({
                facilities: facilityIds || filters.facilities,
            });
            if (requestSeq !== dashboardFetchSeq) {
                return;
            }
            if (response.success) {
                set({
                    statusAggregates: response.data?.status_aggregates || null,
                    categoryAggregates: response.data?.category_aggregates || [],
                    dashboardError: null,
                });
            } else {
                set({
                    statusAggregates: null,
                    categoryAggregates: [],
                    dashboardError: response.error || response.message || 'Failed to fetch dashboard',
                });
            }
        } catch (error) {
            console.error('Failed to fetch dashboard', error);
            if (requestSeq === dashboardFetchSeq) {
                set({
                    statusAggregates: null,
                    categoryAggregates: [],
                    dashboardError: getErrorMessage(error, 'Failed to fetch dashboard'),
                });
            }
        } finally {
            if (requestSeq === dashboardFetchSeq) {
                set({ dashboardLoading: false });
            }
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
        const requestSeq = ++detailFetchSeq;
        set({ selectedAssetLoading: true, activeAssetName: name, detailError: null });
        try {
            const response = await erpnextAssetsApi.getAssetDetail(name);
            if (requestSeq !== detailFetchSeq || get().activeAssetName !== name) {
                return false;
            }
            if (response.success) {
                set({ selectedAsset: response.data, detailError: null });
                return true;
            } else {
                set({
                    selectedAsset: null,
                    detailError: response.error || response.message || 'Failed to load asset details',
                });
                return false;
            }
        } catch (error) {
            console.error('Failed to fetch asset detail', error);
            if (requestSeq === detailFetchSeq && get().activeAssetName === name) {
                set({
                    selectedAsset: null,
                    detailError: getErrorMessage(error, 'Failed to load asset details'),
                });
            }
            return false;
        } finally {
            if (requestSeq === detailFetchSeq && get().activeAssetName === name) {
                set({ selectedAssetLoading: false });
            }
        }
    },

    clearSelectedAsset: () => {
        set({
            selectedAsset: null,
            activeAssetName: null,
            selectedAssetLoading: false,
            detailError: null,
            maintenanceData: null,
            repairRecords: [],
            movementRecords: [],
            depreciationSummary: null,
        });
    },

    fetchMaintenanceData: async (name) => {
        const requestSeq = ++maintenanceFetchSeq;
        try {
            const response = await erpnextAssetsApi.getMaintenanceSchedule(name);
            if (response.success && requestSeq === maintenanceFetchSeq && get().activeAssetName === name) {
                set({ maintenanceData: response.data });
                return true;
            }
            return Boolean(response.success);
        } catch (error) {
            console.error('Failed to fetch maintenance', error);
            return false;
        }
    },

    fetchRepairs: async (name) => {
        const requestSeq = ++repairsFetchSeq;
        try {
            const response = await erpnextAssetsApi.getRepairs(name);
            if (response.success && requestSeq === repairsFetchSeq && get().activeAssetName === name) {
                set({ repairRecords: response.data?.items || [] });
                return true;
            }
            return Boolean(response.success);
        } catch (error) {
            console.error('Failed to fetch repairs', error);
            return false;
        }
    },

    fetchMovements: async (name) => {
        const requestSeq = ++movementsFetchSeq;
        try {
            const response = await erpnextAssetsApi.getMovements(name);
            if (response.success && requestSeq === movementsFetchSeq && get().activeAssetName === name) {
                set({ movementRecords: response.data?.items || [] });
                return true;
            }
            return Boolean(response.success);
        } catch (error) {
            console.error('Failed to fetch movements', error);
            return false;
        }
    },

    fetchDepreciation: async (name) => {
        const requestSeq = ++depreciationFetchSeq;
        try {
            const response = await erpnextAssetsApi.getDepreciationSummary(name);
            if (response.success && requestSeq === depreciationFetchSeq && get().activeAssetName === name) {
                set({ depreciationSummary: response.data });
                return true;
            }
            return Boolean(response.success);
        } catch (error) {
            console.error('Failed to fetch depreciation', error);
            return false;
        }
    },

    refreshAssetBundle: async (name) => {
        const detailOk = await get().fetchAssetDetail(name);
        const [maintenanceOk, repairsOk, movementsOk, depreciationOk] = await Promise.all([
            get().fetchMaintenanceData(name),
            get().fetchRepairs(name),
            get().fetchMovements(name),
            get().fetchDepreciation(name),
        ]);
        return detailOk && maintenanceOk && repairsOk && movementsOk && depreciationOk;
    },

    // -----------------------------------------------------------------------
    // Mutations
    // -----------------------------------------------------------------------

    createAsset: async (data) => {
        try {
            const response = await erpnextAssetsApi.createAsset(data);
            const timedOut = !response.success && Boolean((response.data as { __request_timeout?: boolean } | undefined)?.__request_timeout);
            const requestedAssetName = typeof data.asset_name === 'string' ? data.asset_name.trim() : '';
            if (timedOut) {
                const reconciled = await reconcileAssetByName(requestedAssetName);
                if (reconciled) {
                    return {
                        success: true,
                        name: requestedAssetName,
                        warning: 'Save response timed out, but the asset draft was created.',
                    };
                }
                return {
                    success: false,
                    error: 'Save request timed out. Confirm whether the draft was created before trying again.',
                };
            }
            if (response.success && response.data?.name) {
                return { success: true, name: response.data?.name };
            }
            return {
                success: false,
                error: response.error || response.message || 'Failed to create asset',
            };
        } catch (error: unknown) {
            console.error('Failed to create asset', error);
            return { success: false, error: getErrorMessage(error, 'Unexpected error creating asset') };
        }
    },

    updateAsset: async (name, data) => {
        try {
            const response = await erpnextAssetsApi.updateAsset({ asset_name: name, ...data });
            const timedOut = !response.success && Boolean((response.data as { __request_timeout?: boolean } | undefined)?.__request_timeout);
            if (timedOut) {
                const reconciled = await reconcileAssetByName(name);
                if (reconciled) {
                    const refreshed = await get().refreshAssetBundle(name);
                    if (!refreshed) {
                        return {
                            success: true,
                            warning: 'Update completed, but the latest data could not be refreshed. Reload to verify.',
                        };
                    }
                    return {
                        success: true,
                        warning: 'Update response timed out, but the asset appears to be updated.',
                    };
                }
                return {
                    success: false,
                    error: 'Update request timed out. Reload the asset before attempting another update.',
                };
            }
            if (response.success) {
                const refreshed = await get().refreshAssetBundle(name);
                if (!refreshed) {
                    return {
                        success: true,
                        warning: 'Asset updated, but the latest data could not be fully refreshed. Reload and verify the current state.',
                    };
                }
                return { success: true };
            }
            return { success: false, error: response.error || response.message || 'Failed to update asset' };
        } catch (error: unknown) {
            console.error('Failed to update asset', error);
            return { success: false, error: getErrorMessage(error, 'Unexpected error updating asset') };
        }
    },

    submitAsset: async (name) => {
        try {
            const response = await erpnextAssetsApi.submitAsset(name);
            const timedOut = !response.success && Boolean((response.data as { __request_timeout?: boolean } | undefined)?.__request_timeout);
            if (timedOut) {
                const reconciled = await reconcileAssetByName(name);
                if (reconciled) {
                    const refreshed = await get().refreshAssetBundle(name);
                    if (!refreshed) {
                        return {
                            success: true,
                            warning: 'Submit completed, but the latest data could not be refreshed. Reload to verify current status.',
                        };
                    }
                    return {
                        success: true,
                        warning: 'Submit response timed out, but the asset appears to be submitted.',
                    };
                }
            }
            if (response.success) {
                const refreshed = await get().refreshAssetBundle(name);
                if (!refreshed) {
                    return {
                        success: true,
                        warning: 'Asset submitted, but the latest details could not be refreshed. Reload and confirm the status.',
                    };
                }
                return { success: true };
            }
            return { success: false, error: response.error || response.message || 'Failed to submit asset' };
        } catch (error: unknown) {
            console.error('Failed to submit asset', error);
            return { success: false, error: getErrorMessage(error, 'Unexpected error submitting asset') };
        }
    },

    createMaintenanceRequest: async (data) => {
        try {
            const response = await erpnextAssetsApi.createMaintenanceRequest(data);
            if (response.success) {
                const assetName = typeof data.asset_name === 'string' ? data.asset_name : null;
                if (assetName) {
                    const refreshed = await get().fetchMaintenanceData(assetName);
                    if (!refreshed) {
                        return {
                            success: true,
                            warning: 'Maintenance scheduled, but the latest schedule could not be refreshed. Reload the asset view.',
                        };
                    }
                }
                return { success: true };
            }
            return { success: false, error: response.error || response.message || 'Failed to create maintenance schedule' };
        } catch (error: unknown) {
            console.error('Failed to create maintenance', error);
            return { success: false, error: getErrorMessage(error, 'Unexpected error creating maintenance schedule') };
        }
    },

    completeMaintenanceLog: async (data) => {
        try {
            const response = await erpnextAssetsApi.completeMaintenanceLog(data);
            if (response.success) {
                return { success: true };
            }
            return { success: false, error: response.error || response.message || 'Failed to complete maintenance log' };
        } catch (error: unknown) {
            console.error('Failed to complete maintenance log', error);
            return { success: false, error: getErrorMessage(error, 'Unexpected error completing maintenance log') };
        }
    },

    createRepairRequest: async (data) => {
        try {
            const response = await erpnextAssetsApi.createRepairRequest(data);
            if (response.success) {
                const assetName = typeof data.asset_name === 'string' ? data.asset_name : null;
                if (assetName) {
                    const [repairsOk, detailOk] = await Promise.all([
                        get().fetchRepairs(assetName),
                        get().fetchAssetDetail(assetName),
                    ]);
                    if (!repairsOk || !detailOk) {
                        return {
                            success: true,
                            warning: 'Repair request was created, but the asset view could not be refreshed. Reload and confirm the latest status.',
                        };
                    }
                }
                return { success: true };
            }
            return { success: false, error: response.error || response.message || 'Failed to create repair request' };
        } catch (error: unknown) {
            console.error('Failed to create repair', error);
            return { success: false, error: getErrorMessage(error, 'Unexpected error creating repair request') };
        }
    },

    completeRepair: async (data) => {
        try {
            const response = await erpnextAssetsApi.completeRepair(data);
            if (response.success) {
                return { success: true };
            }
            return { success: false, error: response.error || response.message || 'Failed to complete repair' };
        } catch (error: unknown) {
            console.error('Failed to complete repair', error);
            return { success: false, error: getErrorMessage(error, 'Unexpected error completing repair') };
        }
    },

    createMovement: async (data) => {
        try {
            const response = await erpnextAssetsApi.createMovement(data);
            if (response.success) {
                const assetName = typeof data.asset_name === 'string' ? data.asset_name : null;
                if (assetName) {
                    const [movementsOk, detailOk] = await Promise.all([
                        get().fetchMovements(assetName),
                        get().fetchAssetDetail(assetName),
                    ]);
                    if (!movementsOk || !detailOk) {
                        return {
                            success: true,
                            warning: 'Movement was completed, but the asset view could not be refreshed. Reload and confirm the latest status.',
                        };
                    }
                }
                return { success: true };
            }
            return { success: false, error: response.error || response.message || 'Failed to create movement' };
        } catch (error: unknown) {
            console.error('Failed to create movement', error);
            return { success: false, error: getErrorMessage(error, 'Unexpected error creating movement') };
        }
    },
}));

export default useERPNextAssetStore;

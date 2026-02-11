import { create } from 'zustand';
import { assetsApi } from '../../services/api';

interface Asset {
    name: string;
    device_id: string;
    device_name: string;
    category: string;
    status: string;
    health_facility: string;
}

interface AssetStore {
    assets: Asset[];
    loading: boolean;
    total: number;
    filters: {
        page: number;
        pageSize: number;
        status: string;
    };
    fetchAssets: (facilityIds?: string[]) => Promise<void>;
    setFilters: (filters: Partial<AssetStore['filters']>) => void;
    resetFilters: () => void;
}

const useAssetStore = create<AssetStore>((set, get) => ({
    assets: [],
    loading: false,
    total: 0,
    filters: {
        page: 1,
        pageSize: 10,
        status: '',
    },
    fetchAssets: async (facilityIds) => {
        set({ loading: true });
        const { filters } = get();
        try {
            const response = await assetsApi.getAssets({
                ...filters,
                facilities: facilityIds,
            });
            if (response.success) {
                set({
                    assets: response.data || [],
                    total: response.data?.length || 0
                });
            }
        } catch (error) {
            console.error('Failed to fetch assets', error);
        } finally {
            set({ loading: false });
        }
    },
    setFilters: (newFilters) => {
        set((state) => ({ filters: { ...state.filters, ...newFilters, page: 1 } }));
    },
    resetFilters: () => {
        set({ filters: { page: 1, pageSize: 10, status: '' } });
    },
}));

export default useAssetStore;

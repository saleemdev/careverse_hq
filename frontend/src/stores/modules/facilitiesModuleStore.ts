import { create } from 'zustand';
import { facilitiesApi } from '../../services/api';

interface HealthFacilityRecord {
    name: string;
    facility_name: string;
    kephl_level: string;
    hie_id: string;
    operational_status: string;
    county: string;
}

interface FacilitiesModuleStore {
    facilities: HealthFacilityRecord[];
    loading: boolean;
    total: number;
    filters: {
        page: number;
        pageSize: number;
    };
    fetchFacilities: () => Promise<void>;
    setFilters: (filters: Partial<FacilitiesModuleStore['filters']>) => void;
}

const useFacilitiesModuleStore = create<FacilitiesModuleStore>((set, get) => ({
    facilities: [],
    loading: false,
    total: 0,
    filters: {
        page: 1,
        pageSize: 50,
    },
    fetchFacilities: async () => {
        set({ loading: true });
        const { filters } = get();
        try {
            const response = await facilitiesApi.getFacilities(filters);
            if (response.success) {
                set({
                    facilities: response.data?.items || [],
                    total: response.data?.total_count || 0
                });
            }
        } catch (error) {
            console.error('Failed to fetch facilities', error);
        } finally {
            set({ loading: false });
        }
    },
    setFilters: (newFilters) => {
        set((state) => ({ filters: { ...state.filters, ...newFilters, page: 1 } }));
    },
}));

export default useFacilitiesModuleStore;

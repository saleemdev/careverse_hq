import { create } from 'zustand';
import { affiliationsApi } from '../../services/api';

interface Affiliation {
    name: string;
    health_professional_name: string;
    health_facility: string;
    affiliation_status: string;
    employment_type: string;
    requested_date: string;
}

interface AffiliationsModuleStore {
    affiliations: Affiliation[];
    loading: boolean;
    total: number;
    filters: {
        page: number;
        pageSize: number;
        status: string;
    };
    fetchAffiliations: (facilityIds?: string[]) => Promise<void>;
    setFilters: (filters: Partial<AffiliationsModuleStore['filters']>) => void;
}

const useAffiliationsModuleStore = create<AffiliationsModuleStore>((set, get) => ({
    affiliations: [],
    loading: false,
    total: 0,
    filters: {
        page: 1,
        pageSize: 10,
        status: '',
    },
    fetchAffiliations: async (facilityIds) => {
        set({ loading: true });
        const { filters } = get();
        try {
            const response = await affiliationsApi.getAffiliationsList({
                ...filters,
                facilities: facilityIds,
            });
            if (response.success) {
                set({
                    affiliations: response.data || [],
                    total: response.data?.length || 0
                });
            }
        } catch (error) {
            console.error('Failed to fetch affiliations', error);
        } finally {
            set({ loading: false });
        }
    },
    setFilters: (newFilters) => {
        set((state) => ({ filters: { ...state.filters, ...newFilters, page: 1 } }));
    },
}));

export default useAffiliationsModuleStore;

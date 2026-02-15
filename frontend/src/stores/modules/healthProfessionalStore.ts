import { create } from 'zustand';
import { HealthProfessional } from '../../types/modules';

// Will be imported from api.ts once we create it
// import { healthProfessionalsApi } from '../../services/api';

interface HealthProfessionalFilters {
    page: number;
    pageSize: number;
    search: string;
    status?: string;
    cadre?: string;
    specialty?: string;
}

interface HealthProfessionalMetrics {
    totalCount: number;
    licensedActive: number;
    cadreCount: number;
    activeAffiliations: number;
}

interface HealthProfessionalStore {
    healthProfessionals: HealthProfessional[];
    loading: boolean;
    total: number;
    filters: HealthProfessionalFilters;
    metrics: HealthProfessionalMetrics;
    fetchHealthProfessionals: () => Promise<void>;
    setFilters: (filters: Partial<HealthProfessionalFilters>) => void;
    resetFilters: () => void;
    setPage: (page: number) => void;
    setPageSize: (pageSize: number) => void;
}

const useHealthProfessionalStore = create<HealthProfessionalStore>((set, get) => ({
    healthProfessionals: [],
    loading: false,
    total: 0,
    filters: {
        page: 1,
        pageSize: 20,
        search: '',
        // No default status filter - let Frappe RBAC handle permissions
    },
    metrics: {
        totalCount: 0,
        licensedActive: 0,
        cadreCount: 0,
        activeAffiliations: 0,
    },

    fetchHealthProfessionals: async () => {
        set({ loading: true });
        const { filters } = get();
        try {
            // Dynamic import to avoid circular dependency
            const { healthProfessionalsApi } = await import('../../services/api');

            const response = await healthProfessionalsApi.getList({
                page: filters.page,
                page_size: filters.pageSize,
                search: filters.search,
                status: filters.status,
                cadre: filters.cadre,
                specialty: filters.specialty,
            });

            if (response.success) {
                // API returns { items: [], total_count: N, page: N, page_size: N, metrics: {...} }
                const items = response.data?.items || [];
                const total = response.data?.total_count || 0;
                const rawMetrics = response.data?.metrics || {};
                const metrics = {
                    totalCount: rawMetrics.total_count ?? rawMetrics.totalCount ?? 0,
                    licensedActive: rawMetrics.licensed_active ?? rawMetrics.licensedActive ?? 0,
                    cadreCount: rawMetrics.cadre_count ?? rawMetrics.cadreCount ?? 0,
                    activeAffiliations: rawMetrics.active_affiliations ?? rawMetrics.activeAffiliations ?? 0,
                };

                set({
                    healthProfessionals: items,
                    total: total,
                    metrics: metrics,
                    loading: false,
                });
            } else {
                set({ loading: false });
            }
        } catch (error) {
            console.error('Failed to fetch health professionals:', error);
            set({ loading: false });
        }
    },

    setFilters: (newFilters) => {
        set((state) => ({
            filters: { ...state.filters, ...newFilters, page: 1 }
        }));
    },

    resetFilters: () => {
        set({
            filters: {
                page: 1,
                pageSize: 20,
                search: '',
                status: undefined,
                cadre: undefined,
                specialty: undefined,
            }
        });
    },

    setPage: (page) => {
        set((state) => ({
            filters: { ...state.filters, page }
        }));
    },

    setPageSize: (pageSize) => {
        set((state) => ({
            filters: { ...state.filters, pageSize, page: 1 }
        }));
    },
}));

export default useHealthProfessionalStore;

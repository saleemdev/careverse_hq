import { create } from 'zustand';
import { claimsApi } from '../../services/api';
import type { FacilityClaim, FacilityClaimsSummary } from '../../types/modules';

const EXPORT_BATCH_SIZE = 1000;

interface ClaimsStore {
    claims: FacilityClaim[];
    summary: FacilityClaimsSummary | null;
    loading: boolean;
    exporting: boolean;
    /** How many records have been fetched so far during an export (0 when not exporting) */
    exportProgress: number;
    total: number;
    facilityIds: string[];
    /** Distinct values from data for filter dropdowns */
    insurerOptions: string[];
    useOptions: string[];
    errorGroupOptions: string[];
    filterOptionsLoading: boolean;
    filters: {
        page: number;
        pageSize: number;
        status: string;
        /** Month filter YYYY-MM; empty = all months */
        month: string;
        insurer: string;
        use: string;
        claim_upstream_error_group: string;
    };
    setFacilityIds: (ids: string[]) => void;
    fetchClaims: () => Promise<void>;
    fetchAllClaimsForExport: () => Promise<FacilityClaim[]>;
    fetchFilterOptions: () => Promise<void>;
    setFilters: (filters: Partial<ClaimsStore['filters']>) => void;
}


const useClaimsStore = create<ClaimsStore>((set, get) => ({
    claims: [],
    summary: null,
    loading: false,
    exporting: false,
    exportProgress: 0,
    total: 0,
    facilityIds: [],
    insurerOptions: [],
    useOptions: [],
    errorGroupOptions: [],
    filterOptionsLoading: false,
    filters: {
        page: 1,
        pageSize: 10,
        status: '',
        month: '',
        insurer: '',
        use: '',
        claim_upstream_error_group: '',
    },
    setFacilityIds: (ids) => set({ facilityIds: ids ?? [] }),
    fetchAllClaimsForExport: async () => {
        set({ exporting: true, exportProgress: 0 });
        const { filters, facilityIds } = get();

        let date_from: string | undefined;
        let date_to: string | undefined;
        if (filters.month) {
            const [y, m] = filters.month.split('-').map(Number);
            date_from = `${y}-${String(m).padStart(2, '0')}-01`;
            const lastDay = new Date(y, m, 0).getDate();
            date_to = `${y}-${String(m).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
        }

        const baseParams = {
            facilities: facilityIds.length ? facilityIds : undefined,
            page_size: EXPORT_BATCH_SIZE,
            status: filters.status || undefined,
            date_from,
            date_to,
            insurer: filters.insurer || undefined,
            use: filters.use || undefined,
            claim_upstream_error_group: filters.claim_upstream_error_group || undefined,
        };

        const accumulated: FacilityClaim[] = [];
        try {
            // Fetch the first page to learn the total count
            const firstResponse = await claimsApi.getFacilityClaims({ ...baseParams, page: 1 });
            if (!firstResponse.success || !firstResponse.data) return [];

            const firstData = firstResponse.data as { items?: FacilityClaim[]; total_count?: number };
            const batch = firstData.items ?? [];
            accumulated.push(...batch);
            set({ exportProgress: accumulated.length });

            const totalCount = firstData.total_count ?? batch.length;
            const totalPages = Math.ceil(totalCount / EXPORT_BATCH_SIZE);

            // Fetch remaining pages sequentially
            for (let page = 2; page <= totalPages; page++) {
                const response = await claimsApi.getFacilityClaims({ ...baseParams, page });
                if (!response.success || !response.data) break;
                const data = response.data as { items?: FacilityClaim[] };
                accumulated.push(...(data.items ?? []));
                set({ exportProgress: accumulated.length });
            }

            return accumulated;
        } catch (error) {
            console.error('Failed to fetch all claims for export', error);
            return accumulated; // return whatever was fetched before the error
        } finally {
            set({ exporting: false, exportProgress: 0 });
        }
    },
    fetchClaims: async () => {
        set({ loading: true });
        const { filters, facilityIds } = get();
        let date_from: string | undefined;
        let date_to: string | undefined;
        if (filters.month) {
            const [y, m] = filters.month.split('-').map(Number);
            date_from = `${y}-${String(m).padStart(2, '0')}-01`;
            const lastDay = new Date(y, m, 0).getDate();
            date_to = `${y}-${String(m).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
        }
        try {
            const response = await claimsApi.getFacilityClaims({
                facilities: facilityIds.length ? facilityIds : undefined,
                page: filters.page,
                page_size: filters.pageSize,
                status: filters.status || undefined,
                date_from,
                date_to,
                insurer: filters.insurer || undefined,
                use: filters.use || undefined,
                claim_upstream_error_group: filters.claim_upstream_error_group || undefined,
            });
            if (response.success && response.data) {
                const data = response.data as {
                    items?: FacilityClaim[];
                    total_count?: number;
                    summary?: FacilityClaimsSummary;
                };
                set({
                    claims: data.items ?? [],
                    total: data.total_count ?? 0,
                    summary: data.summary ?? null,
                });
            }
        } catch (error) {
            console.error('Failed to fetch facility claims', error);
        } finally {
            set({ loading: false });
        }
    },
    fetchFilterOptions: async () => {
        const { facilityIds } = get();
        set({ filterOptionsLoading: true });
        try {
            const response = await claimsApi.getFilterOptions(facilityIds.length ? facilityIds : undefined);
            if (response.success && response.data) {
                set({
                    insurerOptions: (response.data.insurers ?? []).filter(Boolean),
                    useOptions: (response.data.uses ?? []).filter(Boolean),
                    errorGroupOptions: (response.data.error_groups ?? []).filter(Boolean),
                });
            }
        } catch (error) {
            console.error('Failed to fetch claims filter options', error);
        } finally {
            set({ filterOptionsLoading: false });
        }
    },
    setFilters: (newFilters) => {
        const merged = { ...get().filters, ...newFilters };
        if (newFilters && ('status' in newFilters || 'month' in newFilters || 'insurer' in newFilters || 'use' in newFilters || 'claim_upstream_error_group' in newFilters)) merged.page = 1;
        set({ filters: merged });
        void get().fetchClaims();
    },
}));

export default useClaimsStore;

import { create } from 'zustand';
import { affiliationsApi } from '../../services/api';

interface Affiliation {
    name: string;
    health_professional_name: string;
    health_facility: string;
    facility_name?: string;   // NEW: Human-readable facility name
    facility_id?: string;     // NEW: HIE ID (FID)
    affiliation_status: string;
    employment_type: string;
    requested_date: string;
}

interface AffiliationsModuleStore {
    affiliations: Affiliation[];
    loading: boolean;
    total: number;
    statusAggregates: {      // NEW: Status aggregates from backend
        total: number;
        pending: number;
        confirmed: number;
        active: number;
        rejected: number;
        expired: number;
        inactive: number;
        confirmation_rate: number;
        rejection_rate: number;
        approval_rate?: number;
    } | null;
    filters: {
        page: number;
        pageSize: number;
        status: string;
        professional_name?: string;  // NEW: Professional name search
        dateFrom?: string;           // NEW: Date range filter start
        dateTo?: string;             // NEW: Date range filter end
        facilities?: string[];       // NEW: Facility filter
    };
    fetchAffiliations: (facilityIds?: string[]) => Promise<void>;
    setFilters: (filters: Partial<AffiliationsModuleStore['filters']>) => void;
}

const useAffiliationsModuleStore = create<AffiliationsModuleStore>((set, get) => ({
    affiliations: [],
    loading: false,
    total: 0,
    statusAggregates: null,  // NEW: Initialize as null
    filters: {
        page: 1,
        pageSize: 20,
        status: '',
        professional_name: '',  // NEW
        dateFrom: '',           // NEW
        dateTo: '',             // NEW
        facilities: []          // NEW
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
                    affiliations: response.data?.items || [],
                    total: response.data?.total_count || 0,
                    statusAggregates: response.data?.status_aggregates || null  // NEW
                });
            }
        } catch (error) {
            console.error('Failed to fetch affiliations', error);
        } finally {
            set({ loading: false });
        }
    },
    setFilters: (newFilters) => {
        const state = get();
        const updatedFilters = {
            ...state.filters,
            ...newFilters,
            // Reset to page 1 when filters change, except when only page changes
            page: newFilters.page !== undefined ? newFilters.page : 1
        };
        set({ filters: updatedFilters });
        // Auto-fetch with updated filters
        get().fetchAffiliations(updatedFilters.facilities);
    },
}));

export default useAffiliationsModuleStore;

import { create } from 'zustand';
import { recruitmentApi, type JobApplicant } from '../../services/api/recruitment';

interface CandidatePipelineFilters {
    page: number;
    pageSize: number;
    searchInput: string;
    searchQuery: string;
    statusFilter?: string;
}

interface RecruitmentCandidatePipelineStore {
    applicants: JobApplicant[];
    loading: boolean;
    total: number;
    filters: CandidatePipelineFilters;
    initialize: () => Promise<void>;
    refreshApplicants: () => Promise<void>;
    setPage: (page: number, pageSize: number) => Promise<void>;
    setSearchInput: (searchInput: string) => void;
    setSearchQuery: (searchQuery: string) => Promise<void>;
    setStatusFilter: (statusFilter?: string) => Promise<void>;
}

const useRecruitmentCandidatePipelineStore = create<RecruitmentCandidatePipelineStore>((set, get) => ({
    applicants: [],
    loading: false,
    total: 0,
    filters: {
        page: 1,
        pageSize: 20,
        searchInput: '',
        searchQuery: '',
        statusFilter: undefined,
    },

    initialize: async () => {
        await get().refreshApplicants();
    },

    refreshApplicants: async () => {
        set({ loading: true });
        try {
            const { filters } = get();
            const resp = await recruitmentApi.getCandidatePipeline({
                page: filters.page,
                page_size: filters.pageSize,
                status: filters.statusFilter,
                search: filters.searchQuery || undefined,
            });

            set({
                applicants: resp?.data?.applicants || [],
                total: resp?.pagination?.total_count || 0,
            });
        } finally {
            set({ loading: false });
        }
    },

    setPage: async (page, pageSize) => {
        set((state) => ({
            filters: {
                ...state.filters,
                page,
                pageSize,
            },
        }));
        await get().refreshApplicants();
    },

    setSearchInput: (searchInput) => {
        set((state) => ({
            filters: {
                ...state.filters,
                searchInput,
            },
        }));
    },

    setSearchQuery: async (searchQuery) => {
        const normalizedSearchQuery = (searchQuery || '').trim();
        set((state) => ({
            filters: {
                ...state.filters,
                searchInput: normalizedSearchQuery,
                searchQuery: normalizedSearchQuery,
                page: 1,
            },
        }));
        await get().refreshApplicants();
    },

    setStatusFilter: async (statusFilter) => {
        set((state) => ({
            filters: {
                ...state.filters,
                statusFilter,
                page: 1,
            },
        }));
        await get().refreshApplicants();
    },
}));

export default useRecruitmentCandidatePipelineStore;

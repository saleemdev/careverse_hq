import { create } from 'zustand';
import {
    recruitmentApi,
    type DesignationOption,
    type JobOpening,
} from '../../services/api/recruitment';

interface JobPostsFilters {
    page: number;
    pageSize: number;
    searchInput: string;
    searchQuery: string;
    statusFilter?: string;
}

interface RecruitmentJobPostsStore {
    jobs: JobOpening[];
    loading: boolean;
    total: number;
    filters: JobPostsFilters;
    designationOptions: DesignationOption[];
    designationLoading: boolean;
    employmentTypeOptions: string[];
    locationOptions: string[];
    initialize: () => Promise<void>;
    refreshJobs: () => Promise<void>;
    setPage: (page: number, pageSize: number) => Promise<void>;
    setSearchInput: (searchInput: string) => void;
    setSearchQuery: (searchQuery: string) => Promise<void>;
    setStatusFilter: (statusFilter?: string) => Promise<void>;
    fetchDesignationOptions: () => Promise<void>;
    fetchJobOpeningFormOptions: () => Promise<void>;
}

const useRecruitmentJobPostsStore = create<RecruitmentJobPostsStore>((set, get) => ({
    jobs: [],
    loading: false,
    total: 0,
    filters: {
        page: 1,
        pageSize: 20,
        searchInput: '',
        searchQuery: '',
        statusFilter: undefined,
    },
    designationOptions: [],
    designationLoading: false,
    employmentTypeOptions: [],
    locationOptions: [],

    initialize: async () => {
        await Promise.all([
            get().refreshJobs(),
            get().fetchDesignationOptions(),
            get().fetchJobOpeningFormOptions(),
        ]);
    },

    refreshJobs: async () => {
        set({ loading: true });
        try {
            const { filters } = get();
            const resp = await recruitmentApi.getJobOpenings({
                page: filters.page,
                page_size: filters.pageSize,
                status: filters.statusFilter,
                search: filters.searchQuery || undefined,
            });
            if (resp?.data?.jobs) {
                set({
                    jobs: resp.data.jobs,
                    total: resp.pagination?.total_count || 0,
                });
            } else {
                set({ jobs: [], total: 0 });
            }
        } catch (error) {
            console.error('Failed to fetch recruitment job posts', error);
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
        await get().refreshJobs();
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
        await get().refreshJobs();
    },

    setStatusFilter: async (statusFilter) => {
        set((state) => ({
            filters: {
                ...state.filters,
                statusFilter,
                page: 1,
            },
        }));
        await get().refreshJobs();
    },

    fetchDesignationOptions: async () => {
        set({ designationLoading: true });
        try {
            const options = await recruitmentApi.getDesignationOptions();
            set({ designationOptions: options });
        } catch (error) {
            console.error('Failed to load designation options', error);
            set({ designationOptions: [] });
        } finally {
            set({ designationLoading: false });
        }
    },

    fetchJobOpeningFormOptions: async () => {
        try {
            const options = await recruitmentApi.getJobOpeningFormOptions();
            set({
                employmentTypeOptions: Array.isArray(options?.employment_types) ? options.employment_types : [],
                locationOptions: Array.isArray(options?.locations) ? options.locations : [],
            });
        } catch (error) {
            console.error('Failed to load job opening form options', error);
            set({
                employmentTypeOptions: [],
                locationOptions: [],
            });
        }
    },
}));

export default useRecruitmentJobPostsStore;

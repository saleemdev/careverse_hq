import { create } from 'zustand';
import type { Employee } from '../../types/modules';

interface EmployeeFilters {
    page: number;
    pageSize: number;
    search: string;
    status?: string;
    company?: string;
    facility?: string;
    department?: string;
    cadre?: string;
}

interface EmployeeMetrics {
    totalEmployees: number;
    activeEmployees: number;
    licensedPractitioners: number;
    departmentsCount: number;
}

interface EmployeeStore {
    employees: Employee[];
    loading: boolean;
    total: number;
    filters: EmployeeFilters;
    metrics: EmployeeMetrics;
    fetchEmployees: () => Promise<void>;
    setFilters: (filters: Partial<EmployeeFilters>) => void;
    resetFilters: () => void;
    setPage: (page: number) => void;
    setPageSize: (pageSize: number) => void;
}

const useEmployeeStore = create<EmployeeStore>((set, get) => ({
    employees: [],
    loading: false,
    total: 0,
    filters: {
        page: 1,
        pageSize: 20,
        search: '',
        // No default filters - Frappe RBAC handles permissions
    },
    metrics: {
        totalEmployees: 0,
        activeEmployees: 0,
        licensedPractitioners: 0,
        departmentsCount: 0,
    },

    fetchEmployees: async () => {
        set({ loading: true });
        const { filters } = get();
        try {
            // Dynamic import to avoid circular dependencies
            const { employeesApi } = await import('../../services/api');

            const response = await employeesApi.getList({
                page: filters.page,
                page_size: filters.pageSize,
                search: filters.search,
                status: filters.status,
                company: filters.company,
                facility: filters.facility,
                department: filters.department,
                cadre: filters.cadre,
            });

            if (response.success) {
                const items = response.data?.items || [];
                const total = response.data?.total_count || 0;
                const rawMetrics = response.data?.metrics || {};
                const metrics = {
                    totalEmployees: rawMetrics.total_employees ?? rawMetrics.totalEmployees ?? 0,
                    activeEmployees: rawMetrics.active_employees ?? rawMetrics.activeEmployees ?? 0,
                    licensedPractitioners: rawMetrics.licensed_practitioners ?? rawMetrics.licensedPractitioners ?? 0,
                    departmentsCount: rawMetrics.departments_count ?? rawMetrics.departmentsCount ?? 0,
                };

                set({
                    employees: items,
                    total: total,
                    metrics: metrics,
                    loading: false,
                });
            } else {
                set({ loading: false });
            }
        } catch (error) {
            console.error('Failed to fetch employees:', error);
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
                company: undefined,
                facility: undefined,
                department: undefined,
                cadre: undefined,
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

export default useEmployeeStore;

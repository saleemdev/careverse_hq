import { create } from 'zustand';
import { hrApi } from '../../services/api';

interface Employee {
    name: string;
    employee_name: string;
    designation: string;
    department: string;
    cell_number: string;
    company_email: string;
    image: string;
    status: string;
    custom_facility_name: string;
    custom_is_licensed_practitioner: number;
}

interface EmployeeStore {
    employees: Employee[];
    loading: boolean;
    total: number;
    filters: {
        page: number;
        pageSize: number;
        search: string;
        department?: string;
    };
    metrics: {
        totalActive: number;
        licensedCount: number;
        deptCount: number;
        recentHires: number;
    };
    fetchEmployees: (facilityIds?: string[]) => Promise<void>;
    setFilters: (filters: Partial<EmployeeStore['filters']>) => void;
    resetFilters: () => void;
}

const useEmployeeStore = create<EmployeeStore>((set, get) => ({
    employees: [],
    loading: false,
    total: 0,
    filters: {
        page: 1,
        pageSize: 10,
        search: '',
    },
    metrics: {
        totalActive: 0,
        licensedCount: 0,
        deptCount: 0,
        recentHires: 0,
    },
    fetchEmployees: async (facilityIds) => {
        set({ loading: true });
        const { filters } = get();
        try {
            const response = await hrApi.getEmployees({
                ...filters,
                facilities: facilityIds,
            });
            if (response.success) {
                // API returns { items: [], total_count: N, page: N, page_size: N }
                const items = response.data?.items || [];
                const total = response.data?.total_count || 0;
                set({
                    employees: items,
                    total: total
                });
            }
        } catch (error) {
            console.error('Failed to fetch employees', error);
        } finally {
            set({ loading: false });
        }
    },
    setFilters: (newFilters) => {
        set((state) => ({ filters: { ...state.filters, ...newFilters, page: 1 } }));
    },
    resetFilters: () => {
        set({ filters: { page: 1, pageSize: 10, search: '' } });
    },
}));

export default useEmployeeStore;

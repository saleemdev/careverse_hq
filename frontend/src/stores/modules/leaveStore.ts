import { create } from 'zustand';
import { hrApi } from '../../services/api';

interface LeaveApplication {
    name: string;
    employee_name: string;
    leave_type: string;
    from_date: string;
    to_date: string;
    total_leave_days: number;
    status: string;
}

interface LeaveStore {
    leaves: LeaveApplication[];
    loading: boolean;
    total: number;
    filters: {
        page: number;
        pageSize: number;
        status: string;
    };
    fetchLeaves: (facilityIds?: string[]) => Promise<void>;
    setFilters: (filters: Partial<LeaveStore['filters']>) => void;
}

const useLeaveStore = create<LeaveStore>((set, get) => ({
    leaves: [],
    loading: false,
    total: 0,
    filters: {
        page: 1,
        pageSize: 10,
        status: '',
    },
    fetchLeaves: async (facilityIds) => {
        set({ loading: true });
        const { filters } = get();
        try {
            const response = await hrApi.getLeaveApplications({
                ...filters,
                facilities: facilityIds,
            });
            if (response.success) {
                // API returns { items: [], total_count: N, page: N, page_size: N }
                set({
                    leaves: response.data?.items || [],
                    total: response.data?.total_count || 0
                });
            }
        } catch (error) {
            console.error('Failed to fetch leaves', error);
        } finally {
            set({ loading: false });
        }
    },
    setFilters: (newFilters) => {
        set((state) => ({ filters: { ...state.filters, ...newFilters, page: 1 } }));
    },
}));

export default useLeaveStore;

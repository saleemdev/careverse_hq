import { dashboardApi } from '../api';

// Reusing the same pattern from api.ts
export const employeesApi = {
    getList: async (params: any) => {
        // Map ProTable params to Frappe API params
        const frappeParams = {
            page: params.current || 1,
            page_size: params.pageSize || 20,
            sort_field: params.sortField || 'modified',
            sort_order: params.sortOrder === 'ascend' ? 'asc' : 'desc',
            search: params.keyword || '',
            facility_ids: params.facility_ids?.join(',') || '',
            filters: JSON.stringify(params.filters || {})
        };

        return (dashboardApi as any).frappeCall('careverse_hq.api.modules.employees.get_employee_list', frappeParams);
    },

    getDetail: async (name: string) => {
        return (dashboardApi as any).frappeCall('careverse_hq.api.modules.employees.get_employee_detail', { name });
    }
};

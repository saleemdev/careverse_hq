/**
 * API Service for HealthPro ERP Dashboard
 * Manages all API calls to Frappe backend
 */

interface ApiResponse<T = any> {
    success: boolean;
    message?: string;
    data?: T;
    error?: string;
}

// Helper to get CSRF token
const getCsrfToken = (): string => {
    return (window as any).csrf_token || '';
};

// Base API call helper
const apiCall = async <T = any>(
    method: string,
    endpoint: string,
    data?: Record<string, any>
): Promise<ApiResponse<T>> => {
    try {
        const options: RequestInit = {
            method,
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'X-Frappe-CSRF-Token': getCsrfToken(),
            },
        };

        if (data && method !== 'GET') {
            options.body = JSON.stringify(data);
        }

        const response = await fetch(endpoint, options);
        const result = await response.json();

        if (!response.ok) {
            return {
                success: false,
                error: result.message || result.exc || 'Request failed',
            };
        }

        // Frappe wraps responses in { message: { status: "success", data: {...} } }
        // Extract the nested data field if it exists
        const apiResponse = result.message || result;
        const finalData = apiResponse.data || apiResponse;

        console.log(`[API] ${endpoint} - Raw result:`, result);
        console.log(`[API] ${endpoint} - Extracted data:`, finalData);

        return {
            success: true,
            data: finalData,
        };
    } catch (error: any) {
        console.error(`[API] Error calling ${endpoint}:`, error);
        return {
            success: false,
            error: error.message || 'Network error',
        };
    }
};

// Frappe method call helper
export const frappeCall = async <T = any>(
    methodName: string,
    params: Record<string, any> = {}
): Promise<ApiResponse<T>> => {
    const sanitizedParams = Object.entries(params).reduce<Record<string, string>>((acc, [key, value]) => {
        if (value === undefined || value === null) return acc;

        if (typeof value === 'string') {
            const trimmed = value.trim();
            const lowered = trimmed.toLowerCase();
            if (!trimmed || lowered === 'undefined' || lowered === 'null') return acc;
            acc[key] = trimmed;
            return acc;
        }

        acc[key] = String(value);
        return acc;
    }, {});

    const queryString = new URLSearchParams(sanitizedParams).toString();
    const endpoint = `/api/method/${methodName}${queryString ? `?${queryString}` : ''}`;
    return apiCall<T>('GET', endpoint);
};

// Dashboard API
export const dashboardApi = {
    // Get company/county overview stats
    getCompanyOverview: async (facilities?: string[]): Promise<ApiResponse> => {
        const params: Record<string, any> = {};
        if (facilities && facilities.length > 0) {
            params.facilities = facilities.join(',');
        }
        return frappeCall('careverse_hq.api.dashboard.get_company_overview', params);
    },

    // Get affiliation statistics
    getAffiliationStatistics: async (
        facilities?: string[],
        dateFrom?: string,
        dateTo?: string
    ): Promise<ApiResponse> => {
        const params: Record<string, any> = {};
        if (facilities?.length) params.facilities = facilities.join(',');
        if (dateFrom) params.date_from = dateFrom;
        if (dateTo) params.date_to = dateTo;
        return frappeCall('careverse_hq.api.dashboard.get_affiliation_statistics', params);
    },

    // Get pending affiliations list
    getPendingAffiliations: async (facilities?: string[], limit?: number): Promise<ApiResponse> => {
        const params: Record<string, any> = {};
        if (facilities && facilities.length > 0) {
            params.facilities = facilities.join(',');
        }
        if (limit) params.limit = limit;
        return frappeCall('careverse_hq.api.dashboard.get_pending_affiliations', params);
    },

    // Get facility metrics overview
    getFacilityMetricsOverview: async (
        facilities?: string[],
        metricType?: string,
        period?: string
    ): Promise<ApiResponse> => {
        const params: Record<string, any> = {};
        if (facilities?.length) params.facilities = facilities.join(',');
        if (metricType) params.metric_type = metricType;
        if (period) params.period = period;
        return frappeCall('careverse_hq.api.dashboard.get_facility_metrics_overview', params);
    },

    // Get license compliance overview
    getLicenseComplianceOverview: async (facilities?: string[]): Promise<ApiResponse> => {
        const params: Record<string, any> = {};
        if (facilities?.length) params.facilities = facilities.join(',');
        return frappeCall('careverse_hq.api.dashboard.get_license_compliance_overview', params);
    },

    // Get financial overview
    getFinancialOverview: async (
        facilities?: string[],
        fiscalYear?: string
    ): Promise<ApiResponse> => {
        const params: Record<string, any> = {};
        if (facilities?.length) params.facilities = facilities.join(',');
        if (fiscalYear) params.fiscal_year = fiscalYear;
        return frappeCall('careverse_hq.api.dashboard.get_financial_overview', params);
    },

    // Get recent activities
    getRecentActivities: async (
        facilities?: string[],
        limit?: number,
        activityType?: string
    ): Promise<ApiResponse> => {
        const params: Record<string, any> = {};
        if (facilities?.length) params.facilities = facilities.join(',');
        if (limit) params.limit = limit;
        if (activityType) params.activity_type = activityType;
        return frappeCall('careverse_hq.api.dashboard.get_recent_activities', params);
    },
};

// Approval API - Extends frappe workflow
export const approvalApi = {
    // Get pending approvals summary
    getPendingApprovals: async (): Promise<ApiResponse> => {
        return frappeCall('careverse_hq.api.approvals.get_pending_approvals');
    },

    // Get Purchase Order approvals
    getPurchaseOrderApprovals: async (): Promise<ApiResponse> => {
        return frappeCall('careverse_hq.api.approvals.get_purchase_order_approvals');
    },

    // Get Expense Claim approvals
    getExpenseClaimApprovals: async (): Promise<ApiResponse> => {
        return frappeCall('careverse_hq.api.approvals.get_expense_claim_approvals');
    },

    // Get Material Request approvals
    getMaterialRequestApprovals: async (): Promise<ApiResponse> => {
        return frappeCall('careverse_hq.api.approvals.get_material_request_approvals');
    },

    // Approve a workflow action
    approveWorkflowAction: async (
        doctype: string,
        docname: string,
        action: string
    ): Promise<ApiResponse> => {
        return apiCall('POST', '/api/method/careverse_hq.api.approvals.approve_workflow_action', {
            doctype,
            docname,
            action,
        });
    },

    // Reject a workflow action
    rejectWorkflowAction: async (
        doctype: string,
        docname: string,
        reason: string
    ): Promise<ApiResponse> => {
        return apiCall('POST', '/api/method/careverse_hq.api.approvals.reject_workflow_action', {
            doctype,
            docname,
            reason,
        });
    },
};

// Budget & Finance API
export const financeApi = {
    // Get chart of accounts summary
    getChartOfAccountsSummary: async (company?: string): Promise<ApiResponse> => {
        return frappeCall('careverse_hq.api.finance.get_chart_of_accounts_summary', { company });
    },

    // Get important account balances
    getAccountBalances: async (company?: string): Promise<ApiResponse> => {
        return frappeCall('careverse_hq.api.finance.get_account_balances', { company });
    },

    // Get budget summary
    getBudgetSummary: async (company?: string, fiscalYear?: string): Promise<ApiResponse> => {
        return frappeCall('careverse_hq.api.finance.get_budget_summary', { company, fiscal_year: fiscalYear });
    },

    // Get budget variance
    getBudgetVariance: async (company?: string): Promise<ApiResponse> => {
        return frappeCall('careverse_hq.api.finance.get_budget_variance', { company });
    },

    // Get purchase orders
    getPurchaseOrders: async (params: {
        page?: number;
        pageSize?: number;
        status?: string;
    }): Promise<ApiResponse> => {
        return frappeCall('careverse_hq.api.dashboard.get_purchase_orders', params);
    },

    // Get expense claims
    getExpenseClaims: async (params: {
        page?: number;
        pageSize?: number;
        status?: string;
    }): Promise<ApiResponse> => {
        return frappeCall('careverse_hq.api.dashboard.get_expense_claims', params);
    },

    // Get material requests
    getMaterialRequests: async (params: {
        page?: number;
        pageSize?: number;
        status?: string;
    }): Promise<ApiResponse> => {
        return frappeCall('careverse_hq.api.dashboard.get_material_requests', params);
    },
};

// HR & Employees API
export const hrApi = {
    // Get employees list
    getEmployees: async (params: {
        facilities?: string[];
        page?: number;
        pageSize?: number;
        search?: string;
        department?: string;
    }): Promise<ApiResponse> => {
        const queryParams: Record<string, any> = { ...params };
        if (params.facilities?.length) queryParams.facilities = params.facilities.join(',');
        return frappeCall('careverse_hq.api.dashboard.get_employees', queryParams);
    },

    // Get employee details
    getEmployeeDetail: async (employeeId: string): Promise<ApiResponse> => {
        return apiCall('GET', `/api/resource/Employee/${encodeURIComponent(employeeId)}`);
    },

    // Get attendance summary
    getAttendanceSummary: async (
        facilities?: string[],
        date?: string
    ): Promise<ApiResponse> => {
        const params: Record<string, any> = {};
        if (facilities?.length) params.facilities = facilities.join(',');
        if (date) params.date = date;
        return frappeCall('careverse_hq.api.dashboard.get_attendance_summary', params);
    },

    // Get detailed attendance records
    getAttendanceRecords: async (
        facilities?: string[],
        date?: string,
        department?: string
    ): Promise<ApiResponse> => {
        const params: Record<string, any> = {};
        if (facilities?.length) params.facilities = facilities.join(',');
        if (date) params.date = date;
        if (department) params.department = department;
        return frappeCall('careverse_hq.api.dashboard.get_attendance_records', params);
    },

    // Get leave balance summary
    getLeaveBalanceSummary: async (company?: string): Promise<ApiResponse> => {
        return frappeCall('careverse_hq.api.hr.get_leave_balance_summary', { company });
    },

    // Get leave applications
    getLeaveApplications: async (params: {
        facilities?: string[];
        page?: number;
        pageSize?: number;
        status?: string;
    }): Promise<ApiResponse> => {
        const queryParams: Record<string, any> = { ...params };
        if (params.facilities?.length) queryParams.facilities = params.facilities.join(',');
        return frappeCall('careverse_hq.api.dashboard.get_leave_applications', queryParams);
    },
};

// Health Professionals API - Complete health professional management
export const healthProfessionalsApi = {
    // Get health professionals list with pagination and filters
    getList: async (params: {
        page?: number;
        page_size?: number;
        search?: string;
        status?: string;
        cadre?: string;
        specialty?: string;
    }): Promise<ApiResponse> => {
        return frappeCall('careverse_hq.api.health_professionals.get_health_professionals', params);
    },

    // Get detailed health professional information including affiliations
    getDetail: async (id: string): Promise<ApiResponse> => {
        return frappeCall('careverse_hq.api.health_professionals.get_health_professional_detail', { id });
    },

    // Get list of professional cadres for dropdown
    getCadreOptions: async (): Promise<ApiResponse> => {
        return frappeCall('careverse_hq.api.health_professionals.get_professional_cadres');
    },

    // Get list of specialties, optionally filtered by cadre
    getSpecialtyOptions: async (cadre?: string): Promise<ApiResponse> => {
        const params: Record<string, any> = {};
        if (cadre) params.cadre = cadre;
        return frappeCall('careverse_hq.api.health_professionals.get_specialties_by_cadre', params);
    },
};

// Employees API - Employee management with Company-based RBAC
export const employeesApi = {
    // Get employees list with pagination and filters
    getList: async (params: {
        page?: number;
        page_size?: number;
        search?: string;
        status?: string;
        company?: string;
        facility?: string;
        department?: string;
        cadre?: string;
    }): Promise<ApiResponse> => {
        return frappeCall('careverse_hq.api.employees.get_employees', params);
    },

    // Get detailed employee information
    getDetail: async (id: string): Promise<ApiResponse> => {
        return frappeCall('careverse_hq.api.employees.get_employee_detail', { id });
    },

    // Get professional cadres dropdown
    getCadreOptions: async (): Promise<ApiResponse> => {
        return frappeCall('careverse_hq.api.employees.get_professional_cadres');
    },

    // Get departments dropdown
    getDepartments: async (company?: string): Promise<ApiResponse> => {
        const params: Record<string, any> = {};
        if (company) params.company = company;
        return frappeCall('careverse_hq.api.employees.get_departments', params);
    },

    // Get designations dropdown
    getDesignations: async (): Promise<ApiResponse> => {
        return frappeCall('careverse_hq.api.employees.get_designations');
    },
};

// Assets API
export const assetsApi = {
    getAssets: async (params: {
        facilities?: string[];
        page?: number;
        pageSize?: number;
        status?: string;
    }): Promise<ApiResponse> => {
        const queryParams: Record<string, any> = { ...params };
        if (params.facilities?.length) queryParams.facilities = params.facilities.join(',');
        return frappeCall('careverse_hq.api.dashboard.get_assets', queryParams);
    },
    getAssetDetail: async (assetId: string): Promise<ApiResponse> => {
        return apiCall('GET', `/api/resource/Health Automation Device/${encodeURIComponent(assetId)}`);
    }
};

// Facilities API
export const facilitiesApi = {
    getFacilities: async (params: {
        page?: number;
        pageSize?: number;
    }): Promise<ApiResponse> => {
        return frappeCall('careverse_hq.api.dashboard.get_facilities', params);
    },
    getFacilityDetail: async (facilityId: string): Promise<ApiResponse> => {
        const response = await frappeCall('careverse_hq.api.facility_detail.get_facility_detail', { facility_id: facilityId });

        if (response.success && response.data) {
            const backendData = response.data;
            const facilityDetails = backendData.facility_details || {};
            const orgDetails = backendData.healthcare_organization || {};

            // Transform nested backend structure to flat frontend structure
            response.data = {
                // Core facility fields
                name: facilityDetails.facility_id,
                facility_name: facilityDetails.facility_name,
                hie_id: facilityDetails.facility_id,
                facility_mfl: facilityDetails.facility_mfl,
                facility_type: facilityDetails.facility_type,
                kephl_level: facilityDetails.kephl_level,
                category: facilityDetails.category,
                industry: facilityDetails.industry,
                operational_status: facilityDetails.operational_status || 'N/A',

                // Contact info
                phone: facilityDetails.phone,
                email: facilityDetails.email,
                website: facilityDetails.website,

                // Administrative
                facility_administrator: facilityDetails.facility_admin,
                facility_owner: facilityDetails.facility_owner,
                organization_company: orgDetails.organization_name,

                // Registration
                board_registration_number: facilityDetails.board_registration_number,
                registration_number: facilityDetails.registration_number,

                // Capacity and operations
                bed_capacity: facilityDetails.bed_capacity,
                maximum_bed_allocation: facilityDetails.maximum_bed_allocation,
                open_whole_day: facilityDetails.open_whole_day,
                open_public_holiday: facilityDetails.open_public_holiday,
                open_weekends: facilityDetails.open_weekends,
                open_late_night: facilityDetails.open_late_night,

                // Location - flatten nested address object
                county: facilityDetails.address?.county,
                sub_county: facilityDetails.address?.sub_county,
                ward: facilityDetails.address?.ward,
                constituency: facilityDetails.constituency,
                latitude: facilityDetails.latitude,
                longitude: facilityDetails.longitude,

                // Child tables - transform field names to match frontend expectations
                bank_accounts: (facilityDetails.banks || []).map((bank: any) => ({
                    bank_name: bank.bank_name,
                    account_name: bank.account_name,
                    account_number: bank.account_number,
                    branch: bank.branch_name  // Backend: branch_name → Frontend: branch
                })),

                contacts: (facilityDetails.contacts || []).map((contact: any) => ({
                    contact_name: contact.contact_name,
                    phone: contact.phone_number,  // Backend: phone_number → Frontend: phone
                    email: contact.email || 'N/A',  // Email not in backend contacts table
                    designation: contact.designation
                })),

                services: (backendData.facility_available_services || [])
                    .filter((service: any) => service.is_available === 1)  // Only show available services
                    .map((service: any) => ({
                        service_name: service.available_services,
                        description: service.description || ''
                    }))
            };
        }

        return response;
    }
};

// Affiliations API - Facility Affiliations management
export const affiliationsApi = {
    // Get all affiliations with optional filters
    getAffiliations: async (filters?: {
        status?: string;
        facility?: string;
        health_professional?: string;
    }): Promise<ApiResponse> => {
        return frappeCall('careverse_hq.api.dashboard.get_affiliations', filters || {});
    },

    // Get paginated list of affiliations
    getAffiliationsList: async (params: {
        facilities?: string[];
        page?: number;
        pageSize?: number;
        status?: string;
        professional_name?: string;
        dateFrom?: string;
        dateTo?: string;
    }): Promise<ApiResponse> => {
        const queryParams: Record<string, any> = {};

        if (params.page !== undefined) queryParams.page = params.page;
        if (params.pageSize !== undefined) queryParams.page_size = params.pageSize;
        if (params.status) queryParams.status = params.status;
        if (params.professional_name) queryParams.professional_name = params.professional_name;
        if (params.dateFrom) queryParams.date_from = params.dateFrom;
        if (params.dateTo) queryParams.date_to = params.dateTo;
        if (params.facilities?.length) queryParams.facilities = params.facilities.join(',');

        return frappeCall('careverse_hq.api.dashboard.get_affiliations', queryParams);
    },

    // Get pending affiliations count
    getPendingAffiliations: async (company?: string): Promise<ApiResponse> => {
        return frappeCall('careverse_hq.api.dashboard.get_pending_affiliations', { company });
    },

    // Get affiliation statistics
    getAffiliationStats: async (): Promise<ApiResponse> => {
        return frappeCall('careverse_hq.api.dashboard.get_affiliation_stats');
    },

    // Confirm an affiliation
    confirmAffiliation: async (affiliationId: string, startDate?: string): Promise<ApiResponse> => {
        return apiCall('POST', '/api/method/careverse_hq.api.health_worker_onboarding_apis.confirm_affiliation', {
            affiliation_id: affiliationId,
            start_date: startDate,
        });
    },

    // Reject an affiliation
    rejectAffiliation: async (affiliationId: string, reason: string): Promise<ApiResponse> => {
        return apiCall('POST', '/api/method/careverse_hq.api.health_worker_onboarding_apis.reject_affiliation', {
            affiliation_id: affiliationId,
            reason,
        });
    },

    // Get affiliation details
    getAffiliationDetails: async (affiliationId: string): Promise<ApiResponse> => {
        return apiCall('GET', `/api/resource/Facility Affiliation/${encodeURIComponent(affiliationId)}`);
    },
};

// User Context API
export const userContextApi = {
    // Get user's company context and available facilities
    getUserCompanyContext: async (): Promise<ApiResponse> => {
        return frappeCall('careverse_hq.api.user_context.get_user_company_context');
    },

    // Get facilities for a specific company
    getFacilitiesForCompany: async (company: string): Promise<ApiResponse> => {
        return frappeCall('careverse_hq.api.user_context.get_facilities_for_company', { company });
    },
};

// Companies API
export const companiesApi = {
    // Get list of companies
    getCompanies: async (): Promise<ApiResponse> => {
        return apiCall('GET', '/api/resource/Company?fields=["name","company_name","abbr"]&limit_page_length=0');
    },
};

// Mock data for development (when APIs are not available)
export const mockData = {
    companyOverview: {
        total_employees: 1847,
        pending_affiliations: 23,
        total_departments: 156,
        total_facilities: 42,
        active_contracts: 89,
        trend: {
            employees: 5.2,
            affiliations: -12.5,
            departments: 3.1,
        },
    },
    pendingApprovals: {
        purchase_orders: { pending: 15, total_value: 2450000 },
        expense_claims: { pending: 8, total_value: 125000 },
        material_requests: { pending: 12, total_value: 890000 },
        leave_applications: { pending: 6 },
    },
    accountBalances: [
        { account: 'Cash and Bank', balance: 45000000, type: 'Asset' },
        { account: 'Accounts Receivable', balance: 12500000, type: 'Asset' },
        { account: 'Accounts Payable', balance: 8900000, type: 'Liability' },
        { account: 'Revenue', balance: 125000000, type: 'Income' },
        { account: 'Operating Expenses', balance: 78000000, type: 'Expense' },
        { account: 'Payroll', balance: 34000000, type: 'Expense' },
    ],
    budgetSummary: {
        total_budget: 150000000,
        utilized: 98000000,
        remaining: 52000000,
        utilization_percent: 65.3,
        by_department: [
            { department: 'Health Services', allocated: 45000000, spent: 32000000 },
            { department: 'Administration', allocated: 25000000, spent: 18000000 },
            { department: 'Infrastructure', allocated: 35000000, spent: 22000000 },
            { department: 'Education', allocated: 30000000, spent: 17000000 },
            { department: 'Social Services', allocated: 15000000, spent: 9000000 },
        ],
    },
    attendanceSummary: {
        total_employees: 1847,
        present: 1689,
        absent: 98,
        on_leave: 45,
        late: 15,
        attendance_rate: 91.4,
        by_department: [
            { department: 'Health Services', present: 423, total: 456 },
            { department: 'Administration', present: 234, total: 250 },
            { department: 'Infrastructure', present: 312, total: 340 },
            { department: 'Education', present: 456, total: 500 },
            { department: 'Social Services', present: 264, total: 301 },
        ],
    },
    affiliationStats: {
        total: 156,
        pending: 23,
        confirmed: 12,
        active: 98,
        rejected: 8,
        expired: 10,
        inactive: 5,
        by_facility_type: [
            { type: 'Hospital', count: 78 },
            { type: 'Health Center', count: 42 },
            { type: 'Dispensary', count: 28 },
            { type: 'Clinic', count: 8 },
        ],
        by_employment_type: [
            { type: 'Full-time Employee', count: 89 },
            { type: 'Part-time Employee', count: 23 },
            { type: 'Consultant', count: 18 },
            { type: 'Locum/Temporary', count: 12 },
            { type: 'Intern/Resident', count: 14 },
        ],
    },
};

// Licenses API
export const licensesApi = {
    /**
     * Get licenses overview with statistics
     */
    getOverview: async (selectedFacilities: string[]): Promise<any> => {
        const facilitiesParam = selectedFacilities.join(',');
        return frappeCall('careverse_hq.api.licenses.get_licenses_overview', {
            facilities: facilitiesParam,
        });
    },

    /**
     * Get detailed license information
     */
    getDetail: async (licenseId: string): Promise<any> => {
        return frappeCall('careverse_hq.api.licenses.get_license_detail', {
            license_id: licenseId,
        });
    },
};

export default {
    dashboard: dashboardApi,
    approvals: approvalApi,
    finance: financeApi,
    hr: hrApi,
    healthProfessionals: healthProfessionalsApi,
    employees: employeesApi,
    affiliations: affiliationsApi,
    companies: companiesApi,
    licenses: licensesApi,
    mock: mockData,
};

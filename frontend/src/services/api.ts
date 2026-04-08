/**
 * API Service for Admin Central Dashboard
 * Manages all API calls to the backend
 */
import { getCsrfToken, refreshCsrfToken, ensureCsrfToken } from '../utils/csrf';
import { notifyApiError } from '../utils/notifications';

export interface ApiResponse<T = any> {
    success: boolean;
    message?: string;
    data?: T;
    error?: string;
}

export interface ApiErrorDetails {
    source?: string;
    source_label?: string;
    kind?: string;
    status_code?: number;
    reason?: string;
    technical_message?: string;
    debug_traceback?: string;
}

export interface ApiErrorPayload {
    status?: string;
    message?: string;
    status_code?: number;
    details?: ApiErrorDetails;
}

export interface FacilityOnboardingRegionOption {
    name: string;
    region_name: string;
    parent_organization?: string | null;
    company?: string | null;
}

export interface FacilityOnboardingReferenceData {
    regions: FacilityOnboardingRegionOption[];
    public_owner_types: string[];
    organization_context?: {
        organization_id?: string | null;
        organization_name?: string | null;
        company_names?: string[];
        organization_region?: string | null;
        organization_region_name?: string | null;
        default_region?: string | null;
    };
}

export interface FacilityOnboardingLookupPayload {
    facility_id?: string;
    registration_number?: string;
}

export interface FacilityOnboardingOtpRequestPayload extends FacilityOnboardingLookupPayload {
    delivery_mode?: 'sms' | 'email';
}

export interface FacilityOnboardingFacilityPreview {
    facility_id?: string | null;
    facility_name?: string | null;
    facility_code?: string | null;
    registration_number?: string | null;
    facility_type?: string | null;
    facility_level?: string | null;
    operational_status?: string | null;
    county?: string | null;
    sub_county?: string | null;
    facility_owner_type?: string | null;
    facility_owner?: string | null;
}

export interface FacilityOnboardingOwnerMatch {
    matched: boolean;
    identification_number?: string | null;
    identification_type?: string | null;
    full_name?: string | null;
}

export interface FacilityOnboardingOtpSession {
    otp_id: string;
    channel: 'sms' | 'email';
    masked_destination: string;
    expires_in_seconds: number;
    expires_at?: number;
    resend_cooldown_seconds: number;
}

export interface FacilityOnboardingLookupResult {
    facility_preview: FacilityOnboardingFacilityPreview;
    already_onboarded?: {
        exists: boolean;
    } | null;
    owner_match: FacilityOnboardingOwnerMatch;
    owner_id_present: boolean;
    can_start_verification: boolean;
    message?: string | null;
}

export interface FacilityOnboardingOtpStartResult {
    facility_preview: FacilityOnboardingFacilityPreview;
    otp_session: FacilityOnboardingOtpSession;
    owner_match: FacilityOnboardingOwnerMatch;
}

export interface FacilityOnboardingFacilityDetails {
    facility_fid?: string | null;
    facility_name?: string | null;
    facility_type?: string | null;
    registration_number?: string | null;
    facility_category?: string | null;
    facility_level?: string | null;
    facility_code?: string | null;
    operational_status?: string | null;
}

export interface FacilityOnboardingAdminDetails {
    first_name?: string | null;
    middle_name?: string | null;
    last_name?: string | null;
    id_number?: string | null;
    phone_number?: string | null;
    email?: string | null;
    gender?: string | null;
    date_of_birth?: string | null;
    identification_type?: string | null;
}

export interface FacilityOnboardingLicenseDetails {
    current_license_number?: string | null;
    current_license_type?: string | null;
    current_license_expiry_date?: string | null;
    regulatory_body?: string | null;
    license_renewal_duration?: string | number | null;
    current_renewal_date?: string | null;
}

export interface FacilityOnboardingAdditionalDefaults {
    organization_owner_type?: string | null;
    organization_owner?: string | null;
    organization_owner_kra_pin?: string | null;
    physical_address?: string | null;
    email_address?: string | null;
    number_of_beds?: number | string | null;
    latitude?: string | null;
    longitude?: string | null;
    county?: string | null;
    sub_county?: string | null;
    ward?: string | null;
    constituency?: string | null;
    maximum_bed_allocation?: number | string | null;
    open_whole_day?: boolean | number | null;
    open_public_holiday?: boolean | number | null;
    open_weekends?: boolean | number | null;
    open_late_night?: boolean | number | null;
    owner_board_registration_number?: string | null;
    owner_current_license_number?: string | null;
    region?: string | null;
}

export interface FacilityOwnerOtpVerificationResult {
    facility_details: FacilityOnboardingFacilityDetails;
    admin_details: FacilityOnboardingAdminDetails;
    license_details: FacilityOnboardingLicenseDetails;
    additional_defaults: FacilityOnboardingAdditionalDefaults;
    verification: {
        expires_in_seconds: number;
        expires_at?: number;
    };
}

export interface FacilityOnboardingContact {
    contact_name: string;
    phone_number: string;
}

export interface FacilityOnboardingBank {
    bank_name: string;
    branch_name?: string;
    account_name?: string;
    account_number: string;
    purpose?: string;
}

export interface FacilityOnboardingSubmitPayload {
    facility_id: string;
    additional_details: FacilityOnboardingAdditionalDefaults;
    contacts: FacilityOnboardingContact[];
    banks: FacilityOnboardingBank[];
}

export interface FacilityOnboardingSubmitResult {
    facility_docname: string;
    facility_name: string;
    facility_hie_id: string;
    organization: string;
    region: string;
    department: string;
}

const isCsrfErrorResponse = (response: Response, result: any): boolean => {
    const payload = JSON.stringify(result || {});
    const hasCsrfSignal = payload.includes('CSRFTokenError') || payload.includes('Invalid Request');
    // Frappe CSRFTokenError returns HTTP 400; keep 403 for safety.
    // Only treat 400 as CSRF when the body confirms it (avoids false positives
    // on validation errors that also return 400).
    return (
        response.status === 403 ||
        (response.status === 400 && hasCsrfSignal) ||
        hasCsrfSignal
    );
};

const decodeServerMessageItem = (item: unknown): string | null => {
    if (!item) return null;
    if (typeof item === 'string') {
        try {
            const parsed = JSON.parse(item);
            if (parsed && typeof parsed.message === 'string' && parsed.message.trim()) {
                return parsed.message.trim();
            }
        } catch {
            if (item.trim()) {
                return item.trim();
            }
        }
        return null;
    }
    if (typeof item === 'object' && item !== null && typeof (item as any).message === 'string') {
        const message = String((item as any).message).trim();
        return message || null;
    }
    return null;
};

const extractServerMessages = (payload: any): string | null => {
    const raw = payload?._server_messages ?? payload?.server_messages;
    if (!raw) return null;

    let parsed = raw;
    if (typeof parsed === 'string') {
        try {
            parsed = JSON.parse(parsed);
        } catch {
            return parsed.trim() || null;
        }
    }

    if (!Array.isArray(parsed)) {
        return null;
    }

    const messages = parsed
        .map((item) => decodeServerMessageItem(item))
        .filter((item): item is string => Boolean(item));

    return messages.length ? messages.join('; ') : null;
};

const extractFrappeErrorMessage = (payload: any, fallback = 'Request failed'): string => {
    if (typeof payload?.message === 'string' && payload.message.trim()) {
        return payload.message.trim();
    }
    if (payload?.message && typeof payload.message === 'object') {
        const nested = payload.message;
        if (typeof nested.message === 'string' && nested.message.trim()) {
            return nested.message.trim();
        }
        const nestedServerMessage = extractServerMessages(nested);
        if (nestedServerMessage) {
            return nestedServerMessage;
        }
    }

    const serverMessage = extractServerMessages(payload);
    if (serverMessage) {
        return serverMessage;
    }

    if (typeof payload?.exc === 'string' && payload.exc.trim()) {
        return payload.exc.trim();
    }

    return fallback;
};

// Base API call helper
const apiCall = async <T = any>(
    method: string,
    endpoint: string,
    data?: Record<string, any>,
    requestConfig?: { signal?: AbortSignal }
): Promise<ApiResponse<T>> => {
    try {
        const csrfToken = method === 'GET' ? getCsrfToken() : await ensureCsrfToken();
        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'X-Frappe-CSRF-Token': csrfToken,
            'X-Requested-With': 'XMLHttpRequest',
        };
        const options: RequestInit = {
            method,
            credentials: 'include',
            headers,
            signal: requestConfig?.signal,
        };

        if (data && method !== 'GET') {
            options.body = JSON.stringify(data);
        }

        let response = await fetch(endpoint, options);
        let result = await response.json().catch(() => ({}));

        // One automatic retry on CSRF mismatch for write operations
        if (method !== 'GET' && isCsrfErrorResponse(response, result)) {
            const freshToken = await refreshCsrfToken();
            if (freshToken) {
                headers['X-Frappe-CSRF-Token'] = freshToken;
                response = await fetch(endpoint, options);
                result = await response.json().catch(() => ({}));
            }
        }

        if (!response.ok) {
            // Frappe wraps api_response dicts in {"message": {...}}, so result.message
            // can be an object like {"status":"error","message":"actual error text"}.
            const raw = result.message;
            const errorPayload =
                (typeof raw === 'object' && raw !== null)
                    ? raw
                    : (typeof result === 'object' && result !== null ? result : undefined);
            const errorMsg = extractFrappeErrorMessage(
                errorPayload ?? result,
                typeof raw === 'string' && raw.trim() ? raw : 'Request failed'
            );
            notifyApiError(errorMsg);
            return {
                success: false,
                error: errorMsg,
                message: errorMsg,
                data: errorPayload as T,
            };
        }

        // Detect api_response failures that arrived with HTTP 200.
        // Keep this check scoped to top-level `status` to avoid interpreting
        // arbitrary nested domain objects that may also contain a `status` field.
        if (result?.status === 'error') {
            const errorMsg =
                typeof result.message === 'string'
                    ? result.message
                    : 'Operation failed';
            notifyApiError(errorMsg);
            return {
                success: false,
                error: errorMsg,
                message: errorMsg,
                data: result as T,
            };
        }

        // Frappe can return either { status, data, message } or { message: { status, data } }
        // Prefer result.data when present so { status, data, message } is handled correctly
        const apiResponse = result.message ?? result;

        const finalData =
            (result.data !== undefined && result.data !== null)
                ? result.data
                : (typeof apiResponse === 'object' && apiResponse !== null && apiResponse.data !== undefined)
                    ? apiResponse.data
                    : apiResponse;

        return {
            success: true,
            data: finalData,
        };
    } catch (error: any) {
        if (error?.name === 'AbortError') {
            return {
                success: false,
                error: 'Request timed out. Verify the latest asset state before retrying.',
                data: { __request_timeout: true } as T,
            };
        }
        console.error(`[API] Error calling ${endpoint}:`, error);
        const errorMsg = error.message || 'Network error';
        notifyApiError(errorMsg);
        return {
            success: false,
            error: errorMsg,
        };
    }
};

const apiCallWithTimeout = async <T = any>(
    method: string,
    endpoint: string,
    data?: Record<string, any>,
    timeoutMs = 30000
): Promise<ApiResponse<T>> => {
    const controller = new AbortController();
    return await new Promise<ApiResponse<T>>((resolve) => {
        let settled = false;

        const finish = (result: ApiResponse<T>) => {
            if (settled) return;
            settled = true;
            clearTimeout(timeoutHandle);
            resolve(result);
        };

        const timeoutHandle = window.setTimeout(() => {
            controller.abort();
            finish({
                success: false,
                error: 'Request timed out. Verify the latest asset state before retrying.',
                data: { __request_timeout: true } as T,
            });
        }, timeoutMs);

        apiCall<T>(method, endpoint, data, { signal: controller.signal })
            .then(finish)
            .catch((error: unknown) => {
                finish({
                    success: false,
                    error: error instanceof Error ? error.message : 'Request failed',
                });
            });
    });
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

export const callFrappePostMethod = async <T = any>(
    methodName: string,
    args: Record<string, any>
): Promise<ApiResponse<T>> => {
    const FRAPPE_CALL_TIMEOUT_MS = 12000;
    const isCsrfText = (value: any): boolean => {
        const raw = JSON.stringify(value || {});
        return raw.includes('CSRFTokenError') || raw.includes('Invalid Request');
    };

    const getFallbackByGetAllowed = methodName === 'careverse_hq.api.affiliations.request_termination_otp'
        || methodName === 'careverse_hq.api.affiliations.terminate_affiliation';

    if ((window as any).frappe?.call) {
        const deskResult = await new Promise<ApiResponse<T>>((resolve) => {
            let settled = false;
            const finish = (result: ApiResponse<T>) => {
                if (settled) {
                    return;
                }
                settled = true;
                clearTimeout(timeoutHandle);
                resolve(result);
            };
            const timeoutHandle = window.setTimeout(() => {
                finish({
                    success: false,
                    error: 'Request timeout via Frappe bridge. The server may still process it; refresh and retry once.',
                    data: { __frappe_bridge_timeout: true } as any,
                });
            }, FRAPPE_CALL_TIMEOUT_MS);

            (window as any).frappe.call({
                method: methodName,
                type: 'POST',
                args,
                callback: (r: any) => {
                    const responseStatus = r?.status;
                    const payload = r?.message ?? r;

                    if (r?.exc) {
                        const excMsg = extractFrappeErrorMessage(payload ?? r, 'Request failed.');
                        finish({
                            success: false,
                            error: excMsg,
                            message: excMsg,
                            data: (typeof payload === 'object' && payload !== null ? payload : r) as any,
                        });
                        return;
                    }

                    if (responseStatus === 'error') {
                        const errorMessage = extractFrappeErrorMessage(payload ?? r, 'Request failed.');
                        finish({ success: false, error: errorMessage, message: errorMessage, data: r as any });
                        return;
                    }

                    if (typeof payload === 'object' && payload?.status === 'error') {
                        const errorMessage = extractFrappeErrorMessage(payload, 'Request failed.');
                        finish({ success: false, error: errorMessage, message: errorMessage, data: payload });
                        return;
                    }

                    // Prefer r.data when server returns { status, data, message }; else payload.data or payload
                    const data = (r?.data !== undefined && r?.data !== null)
                        ? r.data
                        : (typeof payload === 'object' && payload?.data !== undefined)
                            ? payload.data
                            : payload;
                    finish({ success: true, data });
                },
                error: (err: any) => {
                    // err can be an XHR response, parsed JSON, or Error object.
                    const raw = err?.responseJSON?.message ?? err?.message ?? err;
                    const errMsg = extractFrappeErrorMessage(raw ?? err, 'Request failed.');
                    finish({
                        success: false,
                        error: errMsg,
                        message: errMsg,
                        data: (typeof raw === 'object' && raw !== null ? raw : err) as any,
                    });
                },
            });
        });

        // Universal CSRF retry: if frappe.call failed due to stale token,
        // fall back to apiCall which refreshes the token from the server and retries.
        if (!deskResult.success && isCsrfText(deskResult.data || deskResult.error)) {
            return apiCall<T>('POST', `/api/method/${methodName}`, args);
        }

        if (!deskResult.success && getFallbackByGetAllowed) {
            return frappeCall<T>(methodName, args);
        }

        return deskResult;
    }

    const httpResult = await apiCall<T>('POST', `/api/method/${methodName}`, args);
    if (!httpResult.success && getFallbackByGetAllowed && isCsrfText(httpResult.error)) {
        return frappeCall<T>(methodName, args);
    }
    return httpResult;
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
    getChartOfAccountsSummary: async (): Promise<ApiResponse> => {
        return frappeCall('careverse_hq.api.finance.get_chart_of_accounts_summary');
    },

    // Get important account balances
    getAccountBalances: async (): Promise<ApiResponse> => {
        return frappeCall('careverse_hq.api.finance.get_account_balances');
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
        if (params.pageSize != null) queryParams.page_size = params.pageSize;
        delete queryParams.pageSize;
        return frappeCall('careverse_hq.api.dashboard.get_leave_applications', queryParams);
    },

    // Get single leave application detail for HR review/approval
    getLeaveApplicationDetail: async (name: string): Promise<ApiResponse> => {
        return frappeCall('careverse_hq.api.dashboard.get_leave_application_detail', { name });
    },

    // Approve leave application (submit)
    approveLeaveApplication: async (name: string): Promise<ApiResponse> => {
        return callFrappePostMethod('careverse_hq.api.dashboard.approve_leave_application', { name });
    },

    // Reject leave application
    rejectLeaveApplication: async (name: string): Promise<ApiResponse> => {
        return callFrappePostMethod('careverse_hq.api.dashboard.reject_leave_application', { name });
    },
};

// Facility Claims API – summary + paginated list for Claim Record.
// Backend returns mock data when Claim Record doctype is missing; switches to real DB automatically
// when the doctype exists (or set site_config claims_use_mock=1 to keep using mock for testing).
export const claimsApi = {
    getFacilityClaims: async (params: {
        facilities?: string[];
        page?: number;
        page_size?: number;
        status?: string;
        date_from?: string;
        date_to?: string;
        insurer?: string;
        use?: string;
        claim_upstream_error_group?: string;
    }): Promise<ApiResponse> => {
        const queryParams: Record<string, any> = {};
        // Only send facilities if there are actual IDs - empty array means "no filter" not "none"
        const validFacilities = params.facilities?.filter(f => f?.trim()) ?? [];
        if (validFacilities.length) queryParams.facilities = validFacilities.join(',');
        if (params.page != null) queryParams.page = params.page;
        if (params.page_size != null) queryParams.page_size = params.page_size;
        if (params.status) queryParams.status = params.status;
        if (params.date_from) queryParams.date_from = params.date_from;
        if (params.date_to) queryParams.date_to = params.date_to;
        if (params.insurer) queryParams.insurer = params.insurer;
        if (params.use) queryParams.use = params.use;
        if (params.claim_upstream_error_group) queryParams.claim_upstream_error_group = params.claim_upstream_error_group;
        return frappeCall('careverse_hq.api.claims.get_facility_claims', queryParams);
    },
    /** Get distinct filter options (insurers, uses, error_groups) for dropdowns */
    getFilterOptions: async (facilities?: string[]): Promise<ApiResponse> => {
        const queryParams: Record<string, any> = {};
        const validFacilities = facilities?.filter(f => f?.trim()) ?? [];
        if (validFacilities.length) queryParams.facilities = validFacilities.join(',');
        return frappeCall('careverse_hq.api.claims.get_facility_claim_filter_options', queryParams);
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

    // Sync health professional data from HWR
    syncFromHWR: async (id: string): Promise<ApiResponse> => {
        return frappeCall('careverse_hq.api.health_professionals.sync_health_professional_from_hwr', {
            health_professional_id: id
        });
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
    getDepartments: async (): Promise<ApiResponse> => {
        return frappeCall('careverse_hq.api.employees.get_departments');
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

export const facilityOnboardingApi = {
    getReferenceData: async (): Promise<ApiResponse<FacilityOnboardingReferenceData>> => {
        return frappeCall('careverse_hq.api.health_facility_onboarding.get_reference_data');
    },
    lookupFacility: async (
        payload: FacilityOnboardingLookupPayload
    ): Promise<ApiResponse<FacilityOnboardingLookupResult>> => {
        return callFrappePostMethod('careverse_hq.api.health_facility_onboarding.lookup_facility', payload);
    },
    startOwnerVerification: async (
        payload: FacilityOnboardingOtpRequestPayload
    ): Promise<ApiResponse<FacilityOnboardingOtpStartResult>> => {
        return callFrappePostMethod('careverse_hq.api.health_facility_onboarding.start_owner_verification', payload);
    },
    verifyOwnerOtp: async (
        payload: { facility_id: string; otp_id: string; otp_code: string }
    ): Promise<ApiResponse<FacilityOwnerOtpVerificationResult>> => {
        return callFrappePostMethod('careverse_hq.api.health_facility_onboarding.verify_owner_otp', payload);
    },
    completeOnboarding: async (
        payload: FacilityOnboardingSubmitPayload
    ): Promise<ApiResponse<FacilityOnboardingSubmitResult>> => {
        return callFrappePostMethod('careverse_hq.api.health_facility_onboarding.complete_onboarding', payload);
    },
};

// Affiliations API - Facility Affiliations management
export const affiliationsApi = {
    // Facilities list used by Add Single Affiliation flow
    getAffiliationFacilities: async (): Promise<ApiResponse<Array<{ hie_id: string; facility_name: string }>>> => {
        return frappeCall('careverse_hq.api.bulk_health_worker_onboarding.get_facilities');
    },

    // Search HP in local DB first, then HWR fallback for Add Single Affiliation
    searchHealthProfessional: async (
        searchTerm: string,
        searchBy: 'national_id' | 'alien_id' | 'registration_number' = 'national_id',
        searchMode: 'auto' | 'local' | 'hwr' = 'auto'
    ): Promise<ApiResponse<{ results: any[]; source: 'local' | 'hwr' | 'none' }>> => {
        return callFrappePostMethod('careverse_hq.api.single_affiliation.search_health_professional', {
            search_term: searchTerm,
            search_by: searchBy,
            search_mode: searchMode,
        });
    },

    // Create one facility affiliation (existing HP or HWR-cached HP)
    createSingleAffiliation: async (params: {
        hp_name?: string;
        hwr_cache_key?: string;
        employment_details: {
            fid: string;
            employment_type: string;
            designation: string;
            start_date: string;
            end_date?: string;
        };
    }): Promise<ApiResponse<{ health_professional: string; facility_affiliation: string; is_new_hp?: boolean }>> => {
        return callFrappePostMethod('careverse_hq.api.single_affiliation.create_single_affiliation', params);
    },

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
        expiryFrom?: string;
        expiryTo?: string;
    }): Promise<ApiResponse> => {
        const queryParams: Record<string, any> = {};

        if (params.page !== undefined) queryParams.page = params.page;
        if (params.pageSize !== undefined) queryParams.page_size = params.pageSize;
        if (params.status) queryParams.status = params.status;
        if (params.professional_name) queryParams.professional_name = params.professional_name;
        if (params.dateFrom) queryParams.date_from = params.dateFrom;
        if (params.dateTo) queryParams.date_to = params.dateTo;
        if (params.expiryFrom) queryParams.expiry_from = params.expiryFrom;
        if (params.expiryTo) queryParams.expiry_to = params.expiryTo;
        if (params.facilities?.length) queryParams.facilities = params.facilities.join(',');

        return frappeCall('careverse_hq.api.dashboard.get_affiliations', queryParams);
    },

    // Get pending affiliations count
    getPendingAffiliations: async (): Promise<ApiResponse> => {
        return frappeCall('careverse_hq.api.dashboard.get_pending_affiliations');
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

    // Terminate (unaffiliate) an active/confirmed affiliation
    terminateAffiliation: async (
        affiliationId: string,
        terminationReason: string,
        terminationDocuments?: string[],
        otpCode?: string,
        otpId?: string
    ): Promise<ApiResponse> => {
        return callFrappePostMethod('careverse_hq.api.affiliations.terminate_affiliation', {
            affiliation_id: affiliationId,
            termination_reason: terminationReason,
            termination_documents: terminationDocuments || [],
            otp_code: otpCode || '',
            otp_id: otpId || '',
        });
    },

    uploadTerminationAttachmentBase64: async (
        affiliationId: string,
        fileName: string,
        fileContentBase64: string
    ): Promise<ApiResponse<{ name: string; file_name: string; file_url?: string; stored_as_reference?: boolean }>> => {
        return callFrappePostMethod('careverse_hq.api.affiliations.upload_termination_attachment_base64', {
            affiliation_id: affiliationId,
            file_name: fileName,
            file_content_base64: fileContentBase64,
        });
    },

    requestTerminationOtp: async (
        affiliationId: string
    ): Promise<ApiResponse<{ otp_id: string; channel: string; masked_destination: string; destination_source?: string; expires_in_seconds: number }>> => {
        return frappeCall('careverse_hq.api.affiliations.request_termination_otp', {
            affiliation_id: affiliationId,
        });
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

// Profile API
export const profileApi = {
    getMyProfile: async (): Promise<ApiResponse> => {
        return frappeCall('careverse_hq.api.user_context.get_my_profile');
    },

    uploadMyAvatar: async (
        file: File,
        userDocname?: string
    ): Promise<ApiResponse<{ file_url: string; file_name: string }>> => {
        try {
            const csrfToken = await ensureCsrfToken();
            const formData = new FormData();
            formData.append('file', file);
            if (userDocname) {
                formData.append('doctype', 'User');
                formData.append('docname', userDocname);
            }
            formData.append('is_private', '0');

            const response = await fetch('/api/method/upload_file', {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'X-Frappe-CSRF-Token': csrfToken,
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                },
                body: formData,
            });

            const result = await response.json().catch(() => ({}));
            if (!response.ok) {
                return {
                    success: false,
                    error: result?.message || result?.exc || 'Failed to upload avatar file',
                };
            }

            const payload = result?.message || result;
            return {
                success: true,
                data: {
                    file_url: payload?.file_url,
                    file_name: payload?.file_name || file.name,
                },
            };
        } catch (error: any) {
            return {
                success: false,
                error: error?.message || 'Failed to upload avatar file',
            };
        }
    },

    setMyAvatar: async (fileUrl: string): Promise<ApiResponse<{ user_image: string }>> => {
        return callFrappePostMethod('careverse_hq.api.user_context.set_my_profile_avatar', {
            file_url: fileUrl,
        });
    },

    uploadMyAvatarBase64: async (
        fileName: string,
        fileContentBase64: string
    ): Promise<ApiResponse<{ user_image: string; file_name: string }>> => {
        return callFrappePostMethod('careverse_hq.api.user_context.upload_my_profile_avatar', {
            file_name: fileName,
            file_content_base64: fileContentBase64,
        });
    },
};

export interface UserScopePermission {
    name?: string;
    allow: 'Company';
    for_value: string;
    is_default?: number;
    apply_to_all_doctypes?: number;
    applicable_for?: string | null;
}

export interface UserManagementUser {
    id: string;
    name: string;
    email: string;
    first_name: string;
    last_name: string;
    full_name?: string;
    phone?: string;
    enabled: number;
    last_login?: string;
    must_reset_password?: number;
    roles: string[];
    scopes?: UserScopePermission[];
    scope_summary?: {
        companies: number;
        total: number;
    };
}

export interface UserManagementListResponse {
    items: UserManagementUser[];
    pagination: {
        page: number;
        page_size: number;
        total: number;
        total_pages: number;
    };
}

export interface UserManagementReferenceData {
    roles: string[];
    companies: string[];
}

export const userManagementApi = {
    getReferenceData: async (): Promise<ApiResponse<UserManagementReferenceData>> => {
        return frappeCall<UserManagementReferenceData>('careverse_hq.api.admin_user_management.get_reference_data', {});
    },

    listUsers: async (params: {
        filters?: {
            search?: string;
            status?: 'enabled' | 'disabled' | '';
            role?: string;
            company?: string;
        };
        page?: number;
        page_size?: number;
        sort?: string;
    }): Promise<ApiResponse<UserManagementListResponse>> => {
        return frappeCall<UserManagementListResponse>('careverse_hq.api.admin_user_management.list_users', {
            filters: params.filters || {},
            page: params.page || 1,
            page_size: params.page_size || 20,
            sort: params.sort || 'creation desc',
        });
    },

    getUserDetail: async (userId: string): Promise<ApiResponse<{ user: UserManagementUser }>> => {
        return frappeCall<{ user: UserManagementUser }>('careverse_hq.api.admin_user_management.get_user_detail', {
            user_id: userId,
        });
    },

    createUser: async (payload: {
        first_name: string;
        last_name: string;
        email: string;
        phone?: string;
        roles: string[];
        scopes: UserScopePermission[];
    }, deliveryMode: 'email_only' | 'display_only' | 'email_and_display' = 'email_only'): Promise<ApiResponse<{ user: UserManagementUser; temp_password?: string }>> => {
        return callFrappePostMethod<{ user: UserManagementUser; temp_password?: string }>('careverse_hq.api.admin_user_management.create_user', {
            payload,
            delivery_mode: deliveryMode,
        });
    },

    updateUserProfile: async (userId: string, payload: {
        first_name?: string;
        last_name?: string;
        phone?: string;
    }): Promise<ApiResponse<{ user: UserManagementUser }>> => {
        return callFrappePostMethod<{ user: UserManagementUser }>('careverse_hq.api.admin_user_management.update_user_profile', {
            user_id: userId,
            payload,
        });
    },

    updateUserStatus: async (userId: string, enabled: number, reason?: string): Promise<ApiResponse<{ user: UserManagementUser }>> => {
        return callFrappePostMethod<{ user: UserManagementUser }>('careverse_hq.api.admin_user_management.update_user_status', {
            user_id: userId,
            enabled,
            reason: reason || '',
        });
    },

    updateUserRoles: async (userId: string, roles: string[]): Promise<ApiResponse<{ user: UserManagementUser }>> => {
        return callFrappePostMethod<{ user: UserManagementUser }>('careverse_hq.api.admin_user_management.update_user_roles', {
            user_id: userId,
            roles,
        });
    },

    updateUserScopePermissions: async (userId: string, scopes: UserScopePermission[]): Promise<ApiResponse<{ user: UserManagementUser }>> => {
        return callFrappePostMethod<{ user: UserManagementUser }>('careverse_hq.api.admin_user_management.update_user_scope_permissions', {
            user_id: userId,
            scopes,
        });
    },

    resetUserPassword: async (
        userId: string,
        deliveryMode: 'email_only' | 'display_only' | 'email_and_display' = 'email_only'
    ): Promise<ApiResponse<{ user_id: string; delivery_mode: string; temp_password?: string }>> => {
        return callFrappePostMethod<{ user_id: string; delivery_mode: string; temp_password?: string }>('careverse_hq.api.admin_user_management.reset_user_password', {
            user_id: userId,
            delivery_mode: deliveryMode,
        });
    },
};

export interface OidcApp {
    id: string;
    app_name: string;
    owner_system?: string;
    contacts?: string;
    status: 'Draft' | 'Active' | 'Disabled' | 'Archived' | string;
    client_type: 'Web Confidential' | 'Native Public' | string;
    oauth_client?: string;
    trusted_client: number;
    default_redirect_uri: string;
    redirect_uris: string[];
    scopes: string[];
    description?: string;
    last_secret_rotated_on?: string;
    modified?: string;
}

export interface OidcAppReferenceData {
    client_types: string[];
    statuses: string[];
    supported_scopes: string[];
}

export interface OidcAppListResponse {
    items: OidcApp[];
    pagination: {
        page: number;
        page_size: number;
        total: number;
        total_pages: number;
    };
}

export interface OidcAppAuditEvent {
    event_time?: string;
    actor?: string;
    action?: string;
    reason?: string;
    details?: string;
}

export interface OidcAppDetailResponse {
    app: OidcApp;
    oauth_client?: {
        client_id?: string;
        grant_type?: string;
        response_type?: string;
        token_endpoint_auth_method?: string;
        skip_authorization?: number;
    };
    audit_events: OidcAppAuditEvent[];
}

export interface OidcQuickstartResponse {
    app: OidcApp;
    oauth: {
        client_id: string;
        token_endpoint_auth_method: string;
        authorization_endpoint: string;
        token_endpoint: string;
        userinfo_endpoint: string;
        scopes: string[];
        redirect_uris: string[];
    };
}

export const oidcAppsApi = {
    getReferenceData: async (): Promise<ApiResponse<OidcAppReferenceData>> => {
        return frappeCall<OidcAppReferenceData>('careverse_hq.api.oidc_apps.get_reference_data', {});
    },

    listApps: async (params: {
        filters?: {
            search?: string;
            status?: string;
            client_type?: string;
        };
        page?: number;
        page_size?: number;
        sort?: string;
    }): Promise<ApiResponse<OidcAppListResponse>> => {
        return callFrappePostMethod<OidcAppListResponse>('careverse_hq.api.oidc_apps.list_oidc_apps', {
            filters: params.filters || {},
            page: params.page || 1,
            page_size: params.page_size || 20,
            sort: params.sort || 'modified desc',
        });
    },

    getAppDetail: async (appId: string): Promise<ApiResponse<OidcAppDetailResponse>> => {
        return callFrappePostMethod<OidcAppDetailResponse>('careverse_hq.api.oidc_apps.get_oidc_app_detail', {
            app_id: appId,
        });
    },

    createApp: async (payload: {
        app_name: string;
        owner_system?: string;
        contacts?: string;
        status?: string;
        client_type: string;
        trusted_client: number;
        default_redirect_uri: string;
        redirect_uris: string[];
        scopes: string[];
        description?: string;
    }): Promise<ApiResponse<{ app: OidcApp; credentials?: { client_id: string; client_secret: string } }>> => {
        return callFrappePostMethod<{ app: OidcApp; credentials?: { client_id: string; client_secret: string } }>(
            'careverse_hq.api.oidc_apps.create_oidc_app',
            { payload }
        );
    },

    updateApp: async (
        appId: string,
        payload: Record<string, unknown>
    ): Promise<ApiResponse<{ app: OidcApp }>> => {
        return callFrappePostMethod<{ app: OidcApp }>('careverse_hq.api.oidc_apps.update_oidc_app', {
            app_id: appId,
            payload,
        });
    },

    setAppStatus: async (
        appId: string,
        status: string,
        reason?: string
    ): Promise<ApiResponse<{ app: OidcApp }>> => {
        return callFrappePostMethod<{ app: OidcApp }>('careverse_hq.api.oidc_apps.set_oidc_app_status', {
            app_id: appId,
            status,
            reason: reason || '',
        });
    },

    rotateClientSecret: async (
        appId: string,
        reason?: string
    ): Promise<ApiResponse<{ client_secret: string; last_secret_rotated_on?: string }>> => {
        return callFrappePostMethod<{ client_secret: string; last_secret_rotated_on?: string }>(
            'careverse_hq.api.oidc_apps.rotate_oidc_client_secret',
            {
                app_id: appId,
                reason: reason || '',
            }
        );
    },

    getQuickstart: async (appId: string): Promise<ApiResponse<OidcQuickstartResponse>> => {
        return callFrappePostMethod<OidcQuickstartResponse>('careverse_hq.api.oidc_apps.get_oidc_quickstart', {
            app_id: appId,
        });
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

// Bulk upload (affiliation) API – canonical submission and job listing
export const bulkUploadApi = {
    /**
     * Submit bulk health worker records via canonical backend API.
     * Uses facility_fid (Health Facility hie_id), saves the upload in HQ,
     * then hands processing off to healthpro_erp.
     */
    createUpload: async (args: {
        facility_fid: string;
        records: Array<{
            identification_type: string;
            identification_number: string;
            registration_number?: string;
            regulator?: string;
            employment_type: string;
            designation: string;
            start_date: string;
            end_date?: string;
        }>;
    }): Promise<ApiResponse<{ job_id: string; total_records: number }>> => {
        const result = await callFrappePostMethod<{ job_id: string; total_records: number }>(
            'careverse_hq.api.bulk_health_worker_onboarding.upload_bulk_health_workers',
            {
                facility_fid: args.facility_fid,
                records: JSON.stringify(args.records),
            }
        );
        if (!result.success) {
            return result;
        }
        const data = result.data as any;
        const jobId = data?.job_id ?? data?.data?.job_id;
        if (!jobId) {
            return {
                success: false,
                error: 'Server did not return job_id',
            };
        }
        return {
            success: true,
            data: {
                job_id: String(jobId),
                total_records: typeof data?.total_records === 'number' ? data.total_records : (data?.data?.total_records ?? args.records.length),
            },
        };
    },

    listJobs: async (params: { page?: number; per_page?: number } = {}): Promise<ApiResponse<{ jobs: any[] }>> => {
        const queryParams: Record<string, string> = {};
        if (params.page != null) queryParams.page = String(params.page);
        if (params.per_page != null) queryParams.per_page = String(params.per_page);
        const query = new URLSearchParams(queryParams).toString();
        const endpoint = `/api/method/careverse_hq.api.bulk_health_worker_onboarding.get_bulk_upload_jobs${query ? `?${query}` : ''}`;
        const res = await apiCall<{ jobs: any[] }>('GET', endpoint);
        if (!res.success) return res;
        const raw = res.data as any;
        const jobs = raw?.jobs ?? raw?.data?.jobs ?? [];
        return { success: true, data: { jobs } };
    },

    getJobDetails: async (jobId: string): Promise<ApiResponse<any>> => {
        const endpoint = `/api/method/careverse_hq.api.bulk_health_worker_onboarding.get_bulk_upload_job_details?job_id=${encodeURIComponent(jobId)}`;
        return apiCall('GET', endpoint);
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

// ERPNext Assets API (new — uses ERPNext Asset doctype natively)
export const erpnextAssetsApi = {
    getDashboard: async (params: {
        facilities?: string[];
    }): Promise<ApiResponse> => {
        const q: Record<string, any> = {};
        if (params.facilities?.length) q.facilities = params.facilities.join(',');
        return frappeCall('careverse_hq.api.erpnext_assets.get_asset_dashboard', q);
    },

    getAssetsList: async (params: {
        facilities?: string[];
        page?: number;
        pageSize?: number;
        status?: string;
        category?: string;
        search?: string;
        sortBy?: string;
        sortOrder?: string;
    }): Promise<ApiResponse> => {
        const q: Record<string, any> = {};
        if (params.facilities?.length) q.facilities = params.facilities.join(',');
        if (params.page) q.page = params.page;
        if (params.pageSize) q.page_size = params.pageSize;
        if (params.status) q.status = params.status;
        if (params.category) q.category = params.category;
        if (params.search) q.search = params.search;
        if (params.sortBy) q.sort_by = params.sortBy;
        if (params.sortOrder) q.sort_order = params.sortOrder;
        return frappeCall('careverse_hq.api.erpnext_assets.get_assets_list', q);
    },

    getAssetDetail: async (assetName: string): Promise<ApiResponse> => {
        return frappeCall('careverse_hq.api.erpnext_assets.get_asset_detail', { asset_name: assetName });
    },

    createAsset: async (data: Record<string, any>): Promise<ApiResponse> => {
        return apiCallWithTimeout('POST', '/api/method/careverse_hq.api.erpnext_assets.create_asset', data);
    },

    updateAsset: async (data: Record<string, any>): Promise<ApiResponse> => {
        return apiCallWithTimeout('POST', '/api/method/careverse_hq.api.erpnext_assets.update_asset', data);
    },

    submitAsset: async (assetName: string): Promise<ApiResponse> => {
        return apiCallWithTimeout('POST', '/api/method/careverse_hq.api.erpnext_assets.submit_asset', { asset_name: assetName });
    },

    createMaintenanceRequest: async (data: Record<string, any>): Promise<ApiResponse> => {
        return apiCallWithTimeout('POST', '/api/method/careverse_hq.api.erpnext_assets.create_maintenance_request', data);
    },

    getMaintenanceSchedule: async (assetName: string): Promise<ApiResponse> => {
        return frappeCall('careverse_hq.api.erpnext_assets.get_maintenance_schedule', { asset_name: assetName });
    },

    completeMaintenanceLog: async (data: Record<string, any>): Promise<ApiResponse> => {
        return apiCallWithTimeout('POST', '/api/method/careverse_hq.api.erpnext_assets.complete_maintenance_log', data);
    },

    createRepairRequest: async (data: Record<string, any>): Promise<ApiResponse> => {
        return apiCallWithTimeout('POST', '/api/method/careverse_hq.api.erpnext_assets.create_repair_request', data);
    },

    completeRepair: async (data: Record<string, any>): Promise<ApiResponse> => {
        return apiCallWithTimeout('POST', '/api/method/careverse_hq.api.erpnext_assets.complete_repair', data);
    },

    getRepairs: async (assetName: string, repairStatus?: string): Promise<ApiResponse> => {
        const q: Record<string, any> = { asset_name: assetName };
        if (repairStatus) q.repair_status = repairStatus;
        return frappeCall('careverse_hq.api.erpnext_assets.get_repairs', q);
    },

    createMovement: async (data: Record<string, any>): Promise<ApiResponse> => {
        return apiCallWithTimeout('POST', '/api/method/careverse_hq.api.erpnext_assets.create_asset_movement', data);
    },

    reassignAssetCustodian: async (data: {
        asset_name: string;
        to_employee: string;
        transaction_date?: string;
    }): Promise<ApiResponse> => {
        return apiCallWithTimeout('POST', '/api/method/careverse_hq.api.erpnext_assets.reassign_asset_custodian', data);
    },

    updateAssetCurrentValuation: async (data: {
        asset_name: string;
        new_asset_value: number;
        date?: string;
        finance_book?: string;
    }): Promise<ApiResponse> => {
        return apiCallWithTimeout('POST', '/api/method/careverse_hq.api.erpnext_assets.update_asset_current_valuation', data);
    },

    getMovements: async (assetName: string): Promise<ApiResponse> => {
        return frappeCall('careverse_hq.api.erpnext_assets.get_asset_movements', { asset_name: assetName });
    },

    getDepreciationSummary: async (assetName: string): Promise<ApiResponse> => {
        return frappeCall('careverse_hq.api.erpnext_assets.get_depreciation_summary', { asset_name: assetName });
    },

    getCategories: async (search?: string): Promise<ApiResponse> => {
        const q: Record<string, any> = {};
        if (search) q.search = search;
        return frappeCall('careverse_hq.api.erpnext_assets.get_asset_categories', q);
    },

    getMaintenanceTeams: async (company?: string): Promise<ApiResponse> => {
        const q: Record<string, any> = {};
        if (company) q.company = company;
        return frappeCall('careverse_hq.api.erpnext_assets.get_maintenance_teams', q);
    },

    createMaintenanceTeam: async (data: {
        maintenance_team_name: string;
        company: string;
        maintenance_manager?: string;
        members?: Array<{ team_member: string }>;
    }): Promise<ApiResponse> => {
        const payload: Record<string, any> = {
            maintenance_team_name: data.maintenance_team_name,
            company: data.company,
        };
        if (data.maintenance_manager) payload.maintenance_manager = data.maintenance_manager;
        if (data.members?.length) payload.members = JSON.stringify(data.members);
        return callFrappePostMethod('careverse_hq.api.erpnext_assets.create_maintenance_team', payload);
    },

    // Item management (for asset creation flow)
    searchFixedAssetItems: async (search: string, limit?: number): Promise<ApiResponse> => {
        const q: Record<string, any> = { search };
        if (limit) q.limit = limit;
        return frappeCall('careverse_hq.api.erpnext_assets.search_fixed_asset_items', q);
    },

    createFixedAssetItem: async (data: Record<string, any>): Promise<ApiResponse> => {
        return apiCallWithTimeout('POST', '/api/method/careverse_hq.api.erpnext_assets.create_fixed_asset_item', data);
    },

    getItemNamingConfig: async (): Promise<ApiResponse> => {
        return frappeCall('careverse_hq.api.erpnext_assets.get_item_naming_config');
    },

    getItemGroups: async (search?: string): Promise<ApiResponse> => {
        const q: Record<string, any> = {};
        if (search) q.search = search;
        return frappeCall('careverse_hq.api.erpnext_assets.get_item_groups', q);
    },

    getUserCompanies: async (): Promise<ApiResponse> => {
        return frappeCall('careverse_hq.api.erpnext_assets.get_user_companies');
    },

    getFinanceBooks: async (search?: string): Promise<ApiResponse> => {
        const q: Record<string, any> = {};
        if (search) q.search = search;
        return frappeCall('careverse_hq.api.erpnext_assets.get_finance_books', q);
    },

    searchPurchaseReceiptsForAsset: async (
        itemCode: string,
        company?: string,
        search?: string,
        excludeAssetName?: string,
    ): Promise<ApiResponse> => {
        const q: Record<string, any> = { item_code: itemCode };
        if (company) q.company = company;
        if (search) q.search = search;
        if (excludeAssetName) q.exclude_asset_name = excludeAssetName;
        return frappeCall('careverse_hq.api.erpnext_assets.search_purchase_receipts_for_asset', q);
    },

    searchPurchaseInvoicesForAsset: async (
        itemCode: string,
        company?: string,
        search?: string,
        excludeAssetName?: string,
    ): Promise<ApiResponse> => {
        const q: Record<string, any> = { item_code: itemCode };
        if (company) q.company = company;
        if (search) q.search = search;
        if (excludeAssetName) q.exclude_asset_name = excludeAssetName;
        return frappeCall('careverse_hq.api.erpnext_assets.search_purchase_invoices_for_asset', q);
    },

    searchEmployees: async (search: string, company?: string): Promise<ApiResponse> => {
        const q: Record<string, any> = { search };
        if (company) q.company = company;
        return frappeCall('careverse_hq.api.erpnext_assets.search_employees', q);
    },

    getDepartments: async (company?: string): Promise<ApiResponse> => {
        const q: Record<string, any> = {};
        if (company) q.company = company;
        return frappeCall('careverse_hq.api.erpnext_assets.get_departments', q);
    },
};

export interface ShiftStatusAggregates {
    total_assignments: number;
    active_assignments: number;
    inactive_assignments: number;
    employees_with_shifts: number;
    attendance_records: number;
    late_entries: number;
    missing_checkouts: number;
}

export interface ShiftDashboardPayload {
    status_aggregates: ShiftStatusAggregates;
}

export interface ShiftAssignmentItem {
    name: string;
    employee: string;
    employee_name: string;
    department?: string | null;
    company?: string | null;
    shift_type: string;
    shift_start_time?: string | null;
    shift_end_time?: string | null;
    start_date: string;
    end_date?: string | null;
    status: string;
    shift_location?: string | null;
    overtime_type?: string | null;
    facility_id?: string | null;
    facility_name?: string | null;
    enable_auto_attendance?: boolean;
}

export interface AttendanceVisibilityItem {
    name: string;
    attendance_date: string;
    employee: string;
    employee_name: string;
    department?: string | null;
    company?: string | null;
    status: string;
    shift?: string | null;
    late_entry: boolean;
    check_in?: string | null;
    check_out?: string | null;
    working_hours?: number | null;
    is_missing_checkout: boolean;
    facility_id?: string | null;
    facility_name?: string | null;
}

export interface ShiftFilterFacilityOption {
    hie_id: string;
    facility_name: string;
    facility_mfl?: string | null;
}

export interface ShiftFilterEmployeeOption {
    name: string;
    employee_name?: string | null;
    department?: string | null;
    company?: string | null;
    facility_id?: string | null;
    facility_name?: string | null;
}

export interface ShiftFilterTypeOption {
    name: string;
    start_time?: string | null;
    end_time?: string | null;
    enable_auto_attendance?: boolean;
    color?: string | null;
}

export interface ShiftFilterLocationOption {
    name: string;
    label?: string | null;
}

export interface ShiftTypeCreatePayload {
    name: string;
    start_time: string;
    end_time: string;
    color?: string;
    enable_auto_attendance?: boolean;
    process_attendance_after?: string;
}

export interface ShiftTypeCreateResult {
    name: string;
    start_time?: string | null;
    end_time?: string | null;
    color?: string | null;
    enable_auto_attendance?: boolean;
}

export interface ShiftFilterOptionsPayload {
    facilities: ShiftFilterFacilityOption[];
    employees: ShiftFilterEmployeeOption[];
    shift_types: ShiftFilterTypeOption[];
    locations: ShiftFilterLocationOption[];
    shift_status_options: string[];
    attendance_status_options: string[];
}

export interface PaginatedPayload<T> {
    items: T[];
    total_count: number;
    page: number;
    page_size: number;
}

export const shiftManagementApi = {
    getDashboard: async (params: {
        facilities?: string[];
        date_from?: string;
        date_to?: string;
    } = {}): Promise<ApiResponse<ShiftDashboardPayload>> => {
        const q: Record<string, any> = {};
        if (params.facilities?.length) q.facilities = params.facilities.join(',');
        if (params.date_from) q.date_from = params.date_from;
        if (params.date_to) q.date_to = params.date_to;
        return frappeCall<ShiftDashboardPayload>('careverse_hq.api.shift_management.get_shift_dashboard', q);
    },

    getShiftAssignments: async (params: {
        facilities?: string[];
        page?: number;
        page_size?: number;
        employee?: string;
        shift_type?: string;
        status?: string;
        date_from?: string;
        date_to?: string;
    } = {}): Promise<ApiResponse<PaginatedPayload<ShiftAssignmentItem>>> => {
        const q: Record<string, any> = {};
        if (params.facilities?.length) q.facilities = params.facilities.join(',');
        if (params.page != null) q.page = params.page;
        if (params.page_size != null) q.page_size = params.page_size;
        if (params.employee) q.employee = params.employee;
        if (params.shift_type) q.shift_type = params.shift_type;
        if (params.status) q.status = params.status;
        if (params.date_from) q.date_from = params.date_from;
        if (params.date_to) q.date_to = params.date_to;
        return frappeCall<PaginatedPayload<ShiftAssignmentItem>>('careverse_hq.api.shift_management.get_shift_assignments', q);
    },

    getAttendanceVisibility: async (params: {
        facilities?: string[];
        page?: number;
        page_size?: number;
        employee?: string;
        status?: string;
        date_from?: string;
        date_to?: string;
        late_only?: boolean;
        missing_checkout_only?: boolean;
    } = {}): Promise<ApiResponse<PaginatedPayload<AttendanceVisibilityItem>>> => {
        const q: Record<string, any> = {};
        if (params.facilities?.length) q.facilities = params.facilities.join(',');
        if (params.page != null) q.page = params.page;
        if (params.page_size != null) q.page_size = params.page_size;
        if (params.employee) q.employee = params.employee;
        if (params.status) q.status = params.status;
        if (params.date_from) q.date_from = params.date_from;
        if (params.date_to) q.date_to = params.date_to;
        if (params.late_only != null) q.late_only = params.late_only ? 1 : 0;
        if (params.missing_checkout_only != null) q.missing_checkout_only = params.missing_checkout_only ? 1 : 0;
        return frappeCall<PaginatedPayload<AttendanceVisibilityItem>>('careverse_hq.api.shift_management.get_attendance_visibility', q);
    },

    getFilterOptions: async (params: {
        facilities?: string[];
        employee_search?: string;
        employee_limit?: number;
    } = {}): Promise<ApiResponse<ShiftFilterOptionsPayload>> => {
        const q: Record<string, any> = {};
        if (params.facilities?.length) q.facilities = params.facilities.join(',');
        if (params.employee_search) q.employee_search = params.employee_search;
        if (params.employee_limit != null) q.employee_limit = params.employee_limit;
        return frappeCall<ShiftFilterOptionsPayload>('careverse_hq.api.shift_management.get_shift_filter_options', q);
    },

    createShiftAssignment: async (data: {
        employee: string;
        shift_type: string;
        start_date: string;
        end_date?: string;
        status?: string;
        shift_location?: string;
        overtime_type?: string;
    }): Promise<ApiResponse> => {
        return callFrappePostMethod('careverse_hq.api.shift_management.create_shift_assignment', data);
    },

    reassignShiftAssignment: async (data: {
        source_shift: string;
        target_employee: string;
        target_date: string;
        source_date?: string;
        target_shift?: string;
    }): Promise<ApiResponse> => {
        return callFrappePostMethod('careverse_hq.api.shift_management.reassign_shift_assignment', data);
    },

    createShiftType: async (data: ShiftTypeCreatePayload): Promise<ApiResponse<ShiftTypeCreateResult>> => {
        return callFrappePostMethod<ShiftTypeCreateResult>('careverse_hq.api.shift_management.create_shift_type', data);
    },

    createShiftLocation: async (data: {
        name: string;
        parent_location?: string;
        is_group?: boolean;
    }): Promise<ApiResponse<{ name: string }>> => {
        return callFrappePostMethod<{ name: string }>('careverse_hq.api.shift_management.create_shift_location', data);
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
    profile: profileApi,
    userManagement: userManagementApi,
    companies: companiesApi,
    licenses: licensesApi,
    erpnextAssets: erpnextAssetsApi,
    shiftManagement: shiftManagementApi,
    mock: mockData,
};

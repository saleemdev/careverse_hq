/**
 * TypeScript Interfaces for HealthPro ERP Modules
 */

export type StatusType = 'Active' | 'Inactive' | 'Pending' | 'Approved' | 'Rejected' | 'Draft' | 'Cancelled' | 'Submitted' | 'Open' | 'Closed';

export interface BaseRecord {
    name: string;
    creation: string;
    modified: string;
    modified_by: string;
    owner: string;
    docstatus: number;
}

export interface Employee extends BaseRecord {
    employee_name: string;
    employee_number: string;
    department: string;
    designation: string;
    status: string;
    date_of_joining: string;
    gender: string;
    cell_number?: string;
    personal_email?: string;
    company_email?: string;
    company: string;
    health_facility?: string;
    _related?: {
        education?: any[];
        external_work_history?: any[];
        internal_work_history?: any[];
    };
}

export interface Asset extends BaseRecord {
    device_name: string;
    serial_number: string;
    asset_category: string;
    model: string;
    manufacturer: string;
    status: string;
    health_facility: string;
    installation_date?: string;
    warranty_expiry?: string;
    last_maintenance_date?: string;
}

export interface HealthFacility extends BaseRecord {
    facility_name: string;
    hie_id: string;
    facility_mfl?: string;
    facility_type: string;
    category: string;
    county: string;
    sub_county?: string;
    kephl_level?: string;
    status: string;
}

export interface FacilityAffiliation extends BaseRecord {
    health_professional: string;
    health_professional_name: string;
    facility: string;
    facility_name: string;
    role: string;
    start_date: string;
    end_date?: string;
    status: string;
}

export interface PurchaseOrder extends BaseRecord {
    title: string;
    supplier: string;
    transaction_date: string;
    grand_total: number;
    currency: string;
    status: string;
    health_facility?: string;
    items?: any[];
}

export interface ExpenseClaim extends BaseRecord {
    employee: string;
    employee_name: string;
    posting_date: string;
    total_claimed_amount: number;
    approval_status: string;
    status: string;
    health_facility?: string;
    expenses?: any[];
}

export interface MaterialRequest extends BaseRecord {
    transaction_date: string;
    status: string;
    per_ordered: number;
    per_received: number;
    material_request_type: string;
    health_facility?: string;
    items?: any[];
}

export interface LeaveApplication extends BaseRecord {
    employee: string;
    employee_name: string;
    leave_type: string;
    from_date: string;
    to_date: string;
    total_leave_days: number;
    status: string;
}

export interface Attendance extends BaseRecord {
    employee: string;
    employee_name: string;
    attendance_date: string;
    status: string;
    in_time?: string;
    out_time?: string;
    shift?: string;
    health_facility?: string;
}

export interface AccountBalance {
    total: number;
    count: number;
    accounts?: any[];
}

export interface AccountTypesOverview {
    Asset: AccountBalance;
    Liability: AccountBalance;
    Income: AccountBalance;
    Expense: AccountBalance;
    Equity: AccountBalance;
}

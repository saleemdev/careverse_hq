/**
 * TypeScript Interfaces for Admin Central Modules
 */

export type StatusType = 'Active' | 'Inactive' | 'Terminated' | 'Pending' | 'Approved' | 'Rejected' | 'Draft' | 'Cancelled' | 'Submitted' | 'Open' | 'Closed';

export interface BaseRecord {
    name: string;
    creation: string;
    modified: string;
    modified_by: string;
    owner: string;
    docstatus: number;
}

export interface Employee extends BaseRecord {
    // Standard Employee fields
    employee_name: string;
    employee_number?: string;
    first_name?: string;
    last_name?: string;
    middle_name?: string;
    gender: string;
    date_of_birth?: string;
    date_of_joining: string;
    date_of_leaving?: string;

    // Employment details
    company: string;
    department: string;
    designation: string;
    employment_type?: string;
    status: string;

    // Contact details
    cell_number?: string;
    personal_email?: string;
    company_email?: string;
    image?: string;

    // Custom fields (existing in database)
    custom_health_professional?: string;  // Link to Health Professional
    custom_facility_id?: string;
    custom_facility_name?: string;
    custom_identification_type?: string;
    custom_identification_number?: string;
    custom_is_licensed_practitioner?: boolean;

    // Fields enriched from linked Health Professional (NOT in Employee table)
    professional_cadre?: string;  // From HP
    professional_specialty?: string;  // From HP
    sub_specialty?: string;  // From HP
    registration_number?: string;  // From HP
    license_id?: string;  // From HP
    license_type?: string;  // From HP
    license_start?: string;  // From HP
    license_end?: string;  // From HP
    licensing_body?: string;  // From HP
    phone?: string;  // From HP
    email?: string;  // From HP
    county?: string;  // From HP

    // Relations
    user?: string;
    health_professional_data?: HealthProfessional;  // Full HP record in detail view
    professional_affiliations?: ProfessionalAffiliation[];  // From detail API
}

export interface HealthProfessional extends BaseRecord {
    // Identity fields (11 fields)
    full_name: string;
    first_name: string;
    last_name: string;
    middle_name?: string;
    registration_number: string;
    registration_id: string;
    identification_type: string;
    identification_number: string;
    client_registry_id?: string;
    external_reference_id?: string;

    // Professional fields (7 fields)
    professional_cadre: string;
    professional_specialty: string;
    sub_specialty?: string;
    specialty?: string;
    discipline_name?: string;
    educational_qualifications?: string;
    practice_type?: string;

    // Licensing fields (6 fields)
    license_id?: string;
    license_external_reference_id?: string;
    license_type?: string;
    license_start?: string;
    license_end?: string;
    licensing_body?: string;

    // Contact fields (5 fields)
    phone: string;
    email: string;
    official_phone?: string;
    official_email?: string;
    postal_address?: string;

    // Location fields (5 fields)
    county: string;
    sub_county?: string;
    ward?: string;
    address?: string;
    nationality?: string;

    // Personal fields (3 fields)
    gender: string;
    date_of_birth?: string;
    status: string;

    // Relations (2 fields)
    user?: string;
    employee?: string;

    // Child table (1 field)
    professional_affiliations?: ProfessionalAffiliation[];

    // Employee record if exists
    employee_record?: {
        name: string;
        employee_name: string;
        department: string;
        designation: string;
        date_of_joining: string;
        company: string;
        image?: string;
    };

    // HWR Sync fields (4 fields)
    last_sync_date?: string;
    last_sync_status?: 'Success' | 'Failed' | 'Never Synced';
    last_sync_error?: string;
    sync_in_progress?: number;
}

export interface ProfessionalAffiliation {
    name: string;
    health_facility: string;
    health_facility_name?: string;
    role?: string;
    designation?: string;
    employment_type?: string;
    affiliation_status: string;
    start_date?: string;
    end_date?: string;
    facility_affiliation?: string;
    termination_reason?: string;
    termination_date?: string;
    terminated_by?: string;
}

export type LicenseStatus = 'Active' | 'Expiring Soon' | 'Expired' | 'Not Licensed';
export type ProfessionalCadre = string; // Dynamic from API

export interface Asset extends BaseRecord {
    device_name: string;
    serial_number: string;
    asset_category: string;
    model: string;
    manufacturer: string;
    status: string;
    health_facility: string;
    facility_name?: string;
    facility_id?: string;
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

/** Facility claim – key fields for list/summary and detail */
export interface FacilityClaim {
    name: string;
    claim_id: string;
    client: string;
    client_name: string;
    claim_status: string;
    /** Claim upstream error group (from API) */
    claim_upstream_error_group?: string;
    /** Claim upstream response (from API) */
    claim_upstream_response?: string;
    scheme_id: string;
    insurer: string;
    diagnoses: string;
    interventions: string;
    date_start: string;
    date_end: string;
    claim_subtype: string;
    claim_type: string;
    /** e.g. claim, preauthorization */
    use?: string;
    claim_amount: number;
    facility: string;
    facility_name: string;
    county?: string;
    sub_county?: string;
    creation?: string;
    modified?: string;
}

export interface FacilityClaimsSummary {
    total_count: number;
    by_status: Record<string, number>;
    /** Amount (KES) per status for current filters */
    by_status_amount?: Record<string, number>;
    total_amount: number;
}

export interface FacilityClaimsResponse {
    summary: FacilityClaimsSummary;
    total_count: number;
    page: number;
    page_size: number;
    items: FacilityClaim[];
}

export interface PublicJobsListItem {
  name: string;
  job_title?: string;
  designation?: string;
  company?: string;
  department?: string;
  location?: string;
  health_facility?: string;
  health_facility_name?: string;
  status?: string;
  employment_type?: string;
  posted_on?: string;
  closes_on?: string;
  lower_range?: number;
  upper_range?: number;
  currency?: string;
  salary_per?: string;
  creation?: string;
}

export interface PublicJobDetail extends PublicJobsListItem {
  description?: string;
  description_html?: string;
  slug?: string;
  related_jobs?: PublicJobsListItem[];
}

export interface PublicJobFilters {
  locations: string[];
  health_facilities: string[];
  employment_types: string[];
  designations: string[];
  companies: string[];
}

export interface Pagination {
  current_page: number;
  per_page: number;
  total_count: number;
}

export interface PublicJobsResponse {
  jobs: PublicJobsListItem[];
}

export interface PublicApplicationPayload {
  job_opening: string;
  applicant_name: string;
  email_id: string;
  phone?: string;
  cover_letter?: string;
  resume_link?: string;
  consent_given: 1;
  is_health_worker?: 0 | 1;
  registration_number?: string;
  registering_body?: string;
  website?: string;
}

export interface PublicRegulatorOption {
  value: string;
  label: string;
  abbreviation?: string;
}

export interface PublicJobsBoot {
  appName: string;
  logo?: string | null;
  currentYear: number;
  csrfToken: string;
  isAuthenticated: boolean;
  hasAdminAccess: boolean;
  userFullName?: string;
  userInitials?: string;
  userEmail?: string;
  userRoleLabel?: string;
  adminCentralLink: string;
  profileLink: string;
  signInLink: string;
  currentPath: string;
  jobSlug?: string;
}

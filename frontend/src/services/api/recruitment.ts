/**
 * Recruitment Desk API service
 *
 * Provides typed API calls for:
 * - Job Openings list/detail
 * - Candidate Pipeline (Job Applicants)
 * - Hiring orchestration (complete hire, check status)
 * - Public link generation
 */

import { frappeCall, callFrappePostMethod } from '../api';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface JobOpening {
    name: string;
    job_title: string;
    designation: string;
    company: string;
    location: string;
    health_facility?: string;
    health_facility_name?: string;
    status: string;
    publish?: number;
    employment_type?: string;
    description?: string;
    posted_on?: string;
    closes_on?: string;
    lower_range?: number;
    upper_range?: number;
    currency?: string;
    salary_per?: string;
    creation: string;
    modified: string;
}

export interface JobApplicant {
    name: string;
    applicant_name: string;
    email_id: string;
    phone?: string;
    job_title: string;
    designation?: string;
    status: string;
    source?: string;
    health_professional?: string;
    creation: string;
    modified: string;
}

export interface CandidateOffer {
    name: string;
    status: string;
    offer_date?: string;
    designation?: string;
    creation?: string;
}

export interface CandidateInterview {
    name: string;
    status?: string;
    scheduled_on?: string;
    interview_round?: string;
    creation?: string;
}

export interface CandidateHiringLog {
    status: string;
    facility_affiliation?: string;
    request_timestamp?: string;
    affiliation_status?: string;
}

export interface CandidateDetail {
    name: string;
    applicant_name: string;
    email_id: string;
    phone?: string;
    job_title?: string;
    designation?: string;
    status?: string;
    source?: string;
    health_professional?: string;
    creation?: string;
    modified?: string;
    cover_letter?: string;
    resume_link?: string;
    is_health_worker?: boolean;
    registration_number?: string;
    registering_body?: string;
    registering_body_label?: string;
    registering_body_abbreviation?: string;
    job_offers?: CandidateOffer[];
    interviews?: CandidateInterview[];
    hiring_log?: CandidateHiringLog;
}

export interface HireResult {
    facility_affiliation: string;
    health_professional: string;
    idempotency_key: string;
    idempotent_replay: boolean;
    job_offer?: string;
}

export interface HireStatus {
    status: string;
    job_offer: string;
    facility_affiliation?: string;
    affiliation_status?: string;
    employee_exists?: boolean;
    hp_name?: string;
}

export interface PublicJobLinks {
    jobs_list_url: string;
    job_detail_url?: string;
    job_opening?: string;
    slug?: string;
}

export interface DesignationOption {
    label: string;
    value: string;
}

export interface HpSearchResult {
    name: string;
    full_name?: string;
    registration_number?: string;
    status?: string;
}

export interface JobOpeningUpsertPayload {
    job_title?: string;
    designation?: string;
    company?: string;
    health_facility?: string;
    facility_id?: string;
    location?: string;
    employment_type?: string;
    description?: string;
    status?: string;
    posted_on?: string;
    closes_on?: string;
    lower_range?: number | null;
    upper_range?: number | null;
    currency?: string;
    salary_per?: string;
    publish?: number;
}

export interface JobOpeningFormOptions {
    employment_types: string[];
    locations: string[];
    health_facilities: string[];
    status_options: string[];
    salary_per_options: string[];
    currency_options: string[];
    employment_type_link_doctype?: string;
    location_link_doctype?: string;
    currency_link_doctype?: string;
    health_facility_link_doctype?: string;
}

const extractSavedJobOpeningId = (data: unknown, action: 'create' | 'update'): string => {
    const candidate = data as { name?: unknown } | null | undefined;
    const name = typeof candidate?.name === 'string' ? candidate.name.trim() : '';
    if (!name) {
        throw new Error(`Job post ${action} succeeded but no job ID was returned`);
    }
    return name;
};

// ---------------------------------------------------------------------------
// Job Openings
// ---------------------------------------------------------------------------

export const recruitmentApi = {
    /**
     * List Job Openings with pagination and filters
     */
    getJobOpenings: async (params: {
        page?: number;
        page_size?: number;
        status?: string;
        search?: string;
    }) => {
        return frappeCall(
            'careverse_hq.api.recruitment_desk.get_job_openings',
            params,
        );
    },

    /**
     * Get Job Opening detail
     */
    getJobOpeningDetail: async (name: string) => {
        return frappeCall(
            'careverse_hq.api.recruitment_desk.get_job_opening_detail',
            { name },
        );
    },

    /**
     * Get form options for Job Opening link fields.
     */
    getJobOpeningFormOptions: async (): Promise<JobOpeningFormOptions> => {
        const resp = await frappeCall(
            'careverse_hq.api.recruitment_desk.get_job_opening_form_options',
            {},
        );
        if (!resp?.success) {
            throw new Error(resp?.error || 'Failed to load job form options');
        }
        return (resp?.data || {
            employment_types: [],
            locations: [],
            health_facilities: [],
            status_options: [],
            salary_per_options: [],
            currency_options: [],
        }) as JobOpeningFormOptions;
    },

    /**
     * Get Designation suggestions for job post creation/edit
     */
    getDesignationOptions: async (): Promise<DesignationOption[]> => {
        const resp = await frappeCall(
            'careverse_hq.api.employees.get_designations',
            {},
        );
        if (!resp?.success) {
            throw new Error(resp?.error || 'Failed to load designations');
        }

        const optionsRaw: unknown[] = Array.isArray(resp.data) ? resp.data : [];
        return optionsRaw
            .map((row): DesignationOption | null => {
                if (typeof row === 'string') {
                    return { label: row, value: row };
                }
                if (!row || typeof row !== 'object') {
                    return null;
                }

                const source = row as Record<string, unknown>;
                const valueCandidate = source.value ?? source.name;
                const labelCandidate = source.label ?? source.designation_name;

                const value = typeof valueCandidate === 'string' ? valueCandidate : '';
                const label = typeof labelCandidate === 'string' ? labelCandidate : value;

                if (!value) {
                    return null;
                }
                return { value, label: label || value };
            })
            .filter((item): item is DesignationOption => !!item);
    },

    /**
     * Create Job Opening from Recruitment Desk UI
     */
    createJobOpening: async (payload: JobOpeningUpsertPayload): Promise<{ name: string }> => {
        const trimmedTitle = (payload.job_title || '').trim();
        const trimmedDesignation = (payload.designation || '').trim();

        if (!trimmedTitle) {
            throw new Error('Job title is required');
        }
        if (!trimmedDesignation) {
            throw new Error('Designation is required');
        }

        const resp = await callFrappePostMethod(
            'careverse_hq.api.recruitment_desk.create_job_opening',
            { payload },
        );
        if (!resp?.success) {
            throw new Error(resp?.error || 'Failed to create job opening');
        }
        const savedId = extractSavedJobOpeningId(resp?.data, 'create');
        return { name: savedId };
    },

    /**
     * Update Job Opening from Recruitment Desk UI
     */
    updateJobOpening: async (name: string, payload: JobOpeningUpsertPayload): Promise<{ name: string }> => {
        const trimmedName = (name || '').trim();
        if (!trimmedName) {
            throw new Error('Missing job opening ID');
        }

        const resp = await callFrappePostMethod(
            'careverse_hq.api.recruitment_desk.update_job_opening',
            { name: trimmedName, payload },
        );
        if (!resp?.success) {
            throw new Error(resp?.error || 'Failed to update job opening');
        }
        const savedId = extractSavedJobOpeningId(resp?.data, 'update');
        return { name: savedId };
    },

    /**
     * Toggle publish state of a Job Opening
     */
    toggleJobPublish: async (name: string) => {
        return callFrappePostMethod(
            'careverse_hq.api.recruitment_desk.toggle_job_publish',
            { name },
        );
    },

    // -----------------------------------------------------------------------
    // Candidate Pipeline
    // -----------------------------------------------------------------------

    /**
     * List Job Applicants (Candidate Pipeline)
     */
    getCandidatePipeline: async (params: {
        page?: number;
        page_size?: number;
        status?: string;
        job_opening?: string;
        search?: string;
    }) => {
        const resp = await frappeCall(
            'careverse_hq.api.recruitment_desk.get_candidate_pipeline',
            params,
        );
        if (!resp?.success) {
            throw new Error(resp?.error || 'Failed to load candidates');
        }
        return resp;
    },

    /**
     * Get Candidate (Job Applicant) detail
     */
    getCandidateDetail: async (name: string) => {
        const resp = await frappeCall(
            'careverse_hq.api.recruitment_desk.get_candidate_detail',
            { name },
        );
        if (!resp?.success) {
            throw new Error(resp?.error || 'Failed to load candidate details');
        }
        return resp;
    },

    // -----------------------------------------------------------------------
    // Hiring Orchestration
    // -----------------------------------------------------------------------

    /**
     * Complete Hire — terminal hiring step
     * Calls create_single_affiliation through the orchestration layer
     */
    completeHire: async (params: {
        job_offer_id: string;
        employment_details: {
            fid: string;
            employment_type: string;
            designation: string;
            start_date: string;
            end_date?: string;
        };
    }): Promise<HireResult> => {
        const resp = await callFrappePostMethod(
            'careverse_hq.api.hiring_orchestration.complete_hire',
            params,
        );
        if (!resp?.success) {
            throw new Error(resp?.error || 'Failed to complete hire');
        }
        return resp?.data;
    },

    /**
     * Check hire status (reconciliation)
     */
    checkHireStatus: async (jobOfferId: string): Promise<HireStatus> => {
        const resp = await frappeCall(
            'careverse_hq.api.hiring_orchestration.check_hire_status',
            { job_offer_id: jobOfferId },
        );
        if (!resp?.success) {
            throw new Error(resp?.error || 'Failed to check hire status');
        }
        return resp?.data;
    },

    // -----------------------------------------------------------------------
    // Public Links
    // -----------------------------------------------------------------------

    /**
     * Get public shareable links for a job opening
     */
    getPublicJobLinks: async (jobOpeningId?: string): Promise<PublicJobLinks> => {
        const resp = await frappeCall(
            'careverse_hq.api.hiring_orchestration.get_public_job_links',
            { job_opening_id: jobOpeningId },
        );
        if (!resp?.success) {
            throw new Error(resp?.error || 'Failed to generate public links');
        }
        return resp?.data;
    },

    // -----------------------------------------------------------------------
    // HP Resolution (BRD §9.2)
    // -----------------------------------------------------------------------

    /**
     * Search Health Professionals to link to a Job Applicant
     */
    searchHpForApplicant: async (params: {
        search_term: string;
        search_mode?: string;
        search_by?: string;
    }) => {
        const resp = await frappeCall(
            'careverse_hq.api.recruitment_desk.search_hp_for_applicant',
            params,
        );
        if (!resp?.success) {
            throw new Error(resp?.error || 'Search failed');
        }
        return resp;
    },

    /**
     * Link a Job Applicant to a Health Professional
     */
    linkApplicantToHp: async (params: {
        job_applicant: string;
        hp_name: string;
    }) => {
        const resp = await callFrappePostMethod(
            'careverse_hq.api.recruitment_desk.link_applicant_to_health_professional',
            params,
        );
        if (!resp?.success) {
            throw new Error(resp?.error || 'Failed to link Health Professional');
        }
        return resp;
    },

    /**
     * Update Candidate (Job Applicant) Status
     */
    updateCandidateStatus: async (params: {
        name: string;
        status: string;
    }): Promise<{ success: boolean; name: string }> => {
        const resp = await callFrappePostMethod(
            'careverse_hq.api.recruitment_desk.update_candidate_status',
            params,
        );
        if (!resp?.success) {
            throw new Error(resp?.error || 'Failed to update candidate status');
        }
        return resp?.data;
    },

    /**
     * Get pipeline summary (stage counts)
     */
    getPipelineSummary: async (jobOpening?: string) => {
        const resp = await frappeCall(
            'careverse_hq.api.recruitment_desk.get_pipeline_summary',
            { job_opening: jobOpening },
        );
        if (!resp?.success) {
            throw new Error(resp?.error || 'Failed to load pipeline summary');
        }
        return resp;
    },
};

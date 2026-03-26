import type {
  Pagination,
  PublicApplicationPayload,
  PublicJobDetail,
  PublicJobFilters,
  PublicJobsListItem,
} from './types';

const API_BASE = '/api/method/careverse_hq.api.public_jobs';

interface ApiEnvelope<T> {
  status?: string;
  data?: T;
  message?: string;
  pagination?: Pagination;
}

const normalizeEnvelope = <T>(raw: unknown): ApiEnvelope<T> => {
  if (raw && typeof raw === 'object') {
    const record = raw as Record<string, unknown>;
    if (record.message && typeof record.message === 'object') {
      return record.message as ApiEnvelope<T>;
    }
    return record as ApiEnvelope<T>;
  }
  return {};
};

const parseJsonSafe = async (response: Response): Promise<unknown> => {
  try {
    return await response.json();
  } catch {
    return {};
  }
};

const ensureSuccess = <T>(response: Response, envelope: ApiEnvelope<T>, fallbackMessage: string): ApiEnvelope<T> => {
  if (response.ok && envelope.status === 'success') {
    return envelope;
  }
  throw new Error(envelope.message || fallbackMessage);
};

const buildQuery = (params: Record<string, string | number | undefined>): string => {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined) return;
    const asText = String(value).trim();
    if (asText.length === 0) return;
    query.set(key, asText);
  });
  return query.toString();
};

export const publicJobsApi = {
  async getFilterOptions(): Promise<PublicJobFilters> {
    const response = await fetch(API_BASE + '.get_job_filter_options', {
      method: 'GET',
      credentials: 'same-origin',
      headers: { Accept: 'application/json' },
    });

    const envelope = normalizeEnvelope<PublicJobFilters>(await parseJsonSafe(response));
    const valid = ensureSuccess(response, envelope, 'Failed to load filter options');
    return valid.data || { locations: [], health_facilities: [], employment_types: [], designations: [], companies: [] };
  },

  async getJobs(params: {
    page?: number;
    page_size?: number;
    search?: string;
    location?: string;
    health_facility?: string;
    employment_type?: string;
    designation?: string;
    company?: string;
  }): Promise<{ jobs: PublicJobsListItem[]; pagination: Pagination }> {
    const query = buildQuery(params);
    const response = await fetch(API_BASE + '.get_public_jobs' + (query ? '?' + query : ''), {
      method: 'GET',
      credentials: 'same-origin',
      headers: { Accept: 'application/json' },
    });

    const envelope = normalizeEnvelope<{ jobs: PublicJobsListItem[] }>(await parseJsonSafe(response));
    const valid = ensureSuccess(response, envelope, 'Failed to load jobs');

    return {
      jobs: (valid.data && Array.isArray(valid.data.jobs)) ? valid.data.jobs : [],
      pagination: valid.pagination || { current_page: 1, per_page: 20, total_count: 0 },
    };
  },

  async getJobDetail(slug: string): Promise<PublicJobDetail> {
    const query = buildQuery({ slug });
    const response = await fetch(API_BASE + '.get_public_job_detail?' + query, {
      method: 'GET',
      credentials: 'same-origin',
      headers: { Accept: 'application/json' },
    });

    const envelope = normalizeEnvelope<PublicJobDetail>(await parseJsonSafe(response));
    const valid = ensureSuccess(response, envelope, 'Failed to load job detail');
    return valid.data || {};
  },

  async submitApplication(payload: PublicApplicationPayload): Promise<{ applicant_id?: string }> {
    const headers: Record<string, string> = {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    };

    if (window.csrf_token) {
      headers['X-Frappe-CSRF-Token'] = window.csrf_token;
    }

    const response = await fetch(API_BASE + '.submit_application', {
      method: 'POST',
      credentials: 'same-origin',
      headers,
      body: JSON.stringify(payload),
    });

    const envelope = normalizeEnvelope<{ applicant_id?: string }>(await parseJsonSafe(response));
    const valid = ensureSuccess(response, envelope, 'Failed to submit application');
    return valid.data || {};
  },
};

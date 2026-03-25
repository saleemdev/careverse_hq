import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { publicJobsApi } from '../api';
import type { PublicJobFilters, PublicJobsListItem, Pagination } from '../types';
import { formatDate, formatSalary, getDeadlineMeta, toJobSlug } from '../utils';

const DEFAULT_PAGE_SIZE = 20;

const EMPTY_FILTERS: PublicJobFilters = {
  locations: [],
  employment_types: [],
  designations: [],
  companies: [],
};

const EMPTY_PAGINATION: Pagination = {
  current_page: 1,
  per_page: DEFAULT_PAGE_SIZE,
  total_count: 0,
};

const toPositiveInt = (value: string | null, fallback: number): number => {
  const parsed = Number(value || '');
  if (Number.isFinite(parsed) && parsed >= 1) return Math.floor(parsed);
  return fallback;
};

const buildPaginationWindow = (currentPage: number, totalPages: number): number[] => {
  if (totalPages <= 1) return [1];
  const windowSize = 5;
  let start = Math.max(1, currentPage - Math.floor(windowSize / 2));
  const end = Math.min(totalPages, start + windowSize - 1);

  if ((end - start + 1) < windowSize) {
    start = Math.max(1, end - windowSize + 1);
  }

  const pages: number[] = [];
  for (let page = start; page <= end; page += 1) {
    pages.push(page);
  }
  return pages;
};

export function JobsListPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  const routeState = useMemo(() => {
    return {
      search: (searchParams.get('search') || '').trim(),
      location: (searchParams.get('location') || '').trim(),
      employmentType: (searchParams.get('employment_type') || '').trim(),
      designation: (searchParams.get('designation') || '').trim(),
      company: (searchParams.get('company') || '').trim(),
      page: toPositiveInt(searchParams.get('page'), 1),
    };
  }, [searchParams]);

  const [searchInput, setSearchInput] = useState(routeState.search);
  const [jobs, setJobs] = useState<PublicJobsListItem[]>([]);
  const [filters, setFilters] = useState<PublicJobFilters>(EMPTY_FILTERS);
  const [pagination, setPagination] = useState<Pagination>(EMPTY_PAGINATION);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [filterLoading, setFilterLoading] = useState<boolean>(true);

  useEffect(() => {
    setSearchInput(routeState.search);
  }, [routeState.search]);

  useEffect(() => {
    let cancelled = false;

    const loadFilters = async () => {
      setFilterLoading(true);
      try {
        const response = await publicJobsApi.getFilterOptions();
        if (cancelled) return;
        setFilters(response);
      } catch {
        if (cancelled) return;
        setFilters(EMPTY_FILTERS);
      } finally {
        if (cancelled === false) {
          setFilterLoading(false);
        }
      }
    };

    void loadFilters();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    const loadJobs = async () => {
      setLoading(true);
      setError('');

      try {
        const response = await publicJobsApi.getJobs({
          page: routeState.page,
          page_size: DEFAULT_PAGE_SIZE,
          search: routeState.search,
          location: routeState.location,
          employment_type: routeState.employmentType,
          designation: routeState.designation,
          company: routeState.company,
        });

        if (cancelled) return;
        setJobs(response.jobs);
        setPagination(response.pagination || EMPTY_PAGINATION);
      } catch (err) {
        if (cancelled) return;
        const message = err instanceof Error ? err.message : 'Failed to load jobs.';
        setError(message);
        setJobs([]);
        setPagination(EMPTY_PAGINATION);
      } finally {
        if (cancelled === false) {
          setLoading(false);
        }
      }
    };

    void loadJobs();
    return () => {
      cancelled = true;
    };
  }, [routeState.company, routeState.designation, routeState.employmentType, routeState.location, routeState.page, routeState.search]);

  const totalPages = Math.max(1, Math.ceil((pagination.total_count || 0) / (pagination.per_page || DEFAULT_PAGE_SIZE)));
  const pageWindow = buildPaginationWindow(routeState.page, totalPages);

  const setRouteValue = (updates: Partial<typeof routeState>, resetPage = false) => {
    const next = new URLSearchParams(searchParams);

    const apply = (key: string, value: string | number | undefined) => {
      if (value === undefined || value === null || String(value).trim().length === 0) {
        next.delete(key);
        return;
      }
      next.set(key, String(value));
    };

    if (updates.search !== undefined) apply('search', updates.search);
    if (updates.location !== undefined) apply('location', updates.location);
    if (updates.employmentType !== undefined) apply('employment_type', updates.employmentType);
    if (updates.designation !== undefined) apply('designation', updates.designation);
    if (updates.company !== undefined) apply('company', updates.company);
    if (updates.page !== undefined) apply('page', updates.page);

    if (resetPage) {
      next.delete('page');
    }

    setSearchParams(next, { replace: true });
  };

  const onSearchSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setRouteValue({ search: searchInput.trim() }, true);
  };

  const clearAllFilters = () => {
    setSearchInput('');
    setSearchParams({}, { replace: true });
  };

  const activeFilterCount = [
    routeState.search,
    routeState.location,
    routeState.employmentType,
    routeState.designation,
    routeState.company,
  ].filter((entry) => entry.length > 0).length;

  return (
    <main className="pj-main">
      <section className="pj-hero pj-shell">
        <p className="pj-eyebrow">Public Healthcare Hiring</p>
        <h1>Find your next role with verified healthcare facilities.</h1>
        <p>Browse open postings, compare timelines, and apply securely from one public jobs board.</p>
      </section>

      <section className="pj-shell pj-list-card">
        <form className="pj-search-row" onSubmit={onSearchSubmit}>
          <input
            className="pj-input"
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder="Search by role title or designation"
            maxLength={120}
            aria-label="Search jobs"
          />
          <button type="submit" className="pj-btn pj-btn-primary">Search</button>
        </form>

        <div className="pj-filters-grid">
          <label>
            <span>Facility</span>
            <select
              className="pj-select"
              value={routeState.company}
              onChange={(event) => setRouteValue({ company: event.target.value }, true)}
              disabled={filterLoading}
            >
              <option value="">All facilities</option>
              {filters.companies.map((entry) => (
                <option key={entry} value={entry}>{entry}</option>
              ))}
            </select>
          </label>

          <label>
            <span>Location</span>
            <select
              className="pj-select"
              value={routeState.location}
              onChange={(event) => setRouteValue({ location: event.target.value }, true)}
              disabled={filterLoading}
            >
              <option value="">All locations</option>
              {filters.locations.map((entry) => (
                <option key={entry} value={entry}>{entry}</option>
              ))}
            </select>
          </label>

          <label>
            <span>Employment type</span>
            <select
              className="pj-select"
              value={routeState.employmentType}
              onChange={(event) => setRouteValue({ employmentType: event.target.value }, true)}
              disabled={filterLoading}
            >
              <option value="">All types</option>
              {filters.employment_types.map((entry) => (
                <option key={entry} value={entry}>{entry}</option>
              ))}
            </select>
          </label>

          <label>
            <span>Role</span>
            <select
              className="pj-select"
              value={routeState.designation}
              onChange={(event) => setRouteValue({ designation: event.target.value }, true)}
              disabled={filterLoading}
            >
              <option value="">All roles</option>
              {filters.designations.map((entry) => (
                <option key={entry} value={entry}>{entry}</option>
              ))}
            </select>
          </label>
        </div>

        <div className="pj-results-meta">
          <div>
            <h2>{pagination.total_count} Open Position{pagination.total_count === 1 ? '' : 's'}</h2>
            <p>{activeFilterCount > 0 ? 'Filtered results shown.' : 'Showing all currently published openings.'}</p>
          </div>
          <button type="button" className="pj-btn pj-btn-ghost" onClick={clearAllFilters}>Reset Filters</button>
        </div>

        {loading ? <div className="pj-state">Loading open roles...</div> : null}
        {error.length > 0 ? <div className="pj-state pj-state-error">{error}</div> : null}

        {loading === false && error.length === 0 && jobs.length === 0 ? (
          <div className="pj-state">No jobs match your current filters. Try broadening your search.</div>
        ) : null}

        {loading === false && error.length === 0 && jobs.length > 0 ? (
          <>
            <div className="pj-jobs-grid">
              {jobs.map((job) => {
                const salary = formatSalary(job);
                const deadline = getDeadlineMeta(job.closes_on);
                const detailPath = '/jobs/' + encodeURIComponent(toJobSlug(job));

                return (
                  <Link key={job.name} className="pj-job-card" to={detailPath}>
                    <div className="pj-job-card-head">
                      <p className="pj-job-company">{job.company || 'Healthcare facility'}</p>
                      <span className={'pj-deadline ' + deadline.tone}>{deadline.label}</span>
                    </div>
                    <h3>{job.job_title || job.designation || 'Open role'}</h3>
                    <p className="pj-job-meta">
                      {[job.location, job.employment_type, job.designation].filter(Boolean).join(' • ') || 'Details available on role page'}
                    </p>
                    <div className="pj-job-highlight-row">
                      <span>{salary || 'Compensation shared during hiring process'}</span>
                      <span>{job.closes_on ? 'Deadline: ' + formatDate(job.closes_on) : 'Rolling review'}</span>
                    </div>
                  </Link>
                );
              })}
            </div>

            <div className="pj-pagination">
              <button
                type="button"
                className="pj-page-btn"
                disabled={routeState.page <= 1}
                onClick={() => setRouteValue({ page: routeState.page - 1 })}
              >
                Previous
              </button>

              {pageWindow.map((page) => (
                <button
                  key={page}
                  type="button"
                  className={'pj-page-btn' + (page === routeState.page ? ' active' : '')}
                  onClick={() => setRouteValue({ page })}
                >
                  {page}
                </button>
              ))}

              <button
                type="button"
                className="pj-page-btn"
                disabled={routeState.page >= totalPages}
                onClick={() => setRouteValue({ page: routeState.page + 1 })}
              >
                Next
              </button>
            </div>
          </>
        ) : null}
      </section>
    </main>
  );
}

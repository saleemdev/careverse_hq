import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { publicJobsApi } from '../api';
import { PublicStatePanel } from '../components/PublicStatePanel';
import { getPublicJobsBoot } from '../boot';
import type { PublicApplicationPayload, PublicJobDetail } from '../types';
import { PHONE_PATTERN, formatDate, formatSalary, getDeadlineMeta, isHttpUrl, isValidEmail, toJobSlug } from '../utils';

interface ApplicationState {
  applicant_name: string;
  email_id: string;
  phone: string;
  resume_link: string;
  cover_letter: string;
  consent_given: boolean;
  website: string;
}

const EMPTY_FORM: ApplicationState = {
  applicant_name: '',
  email_id: '',
  phone: '',
  resume_link: '',
  cover_letter: '',
  consent_given: false,
  website: '',
};

const makeInitialForm = (): ApplicationState => {
  const boot = getPublicJobsBoot();
  return {
    ...EMPTY_FORM,
    applicant_name: boot.userFullName || '',
    email_id: boot.userEmail || '',
  };
};

export function JobDetailPage() {
  const { jobSlug = '' } = useParams();
  const navigate = useNavigate();

  const [job, setJob] = useState<PublicJobDetail | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [form, setForm] = useState<ApplicationState>(makeInitialForm);
  const [formError, setFormError] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [submitted, setSubmitted] = useState<boolean>(false);
  const [step, setStep] = useState<1 | 2>(1);
  const [reloadToken, setReloadToken] = useState<number>(0);

  useEffect(() => {
    let cancelled = false;

    const loadDetail = async () => {
      if (jobSlug.trim().length === 0) {
        setError('Job not found.');
        setLoading(false);
        return;
      }

      setLoading(true);
      setError('');

      try {
        const detail = await publicJobsApi.getJobDetail(jobSlug);
        if (cancelled) return;
        setJob(detail);
      } catch (err) {
        if (cancelled) return;
        const message = err instanceof Error ? err.message : 'Failed to load job details.';
        setError(message);
        setJob(null);
      } finally {
        if (cancelled === false) {
          setLoading(false);
        }
      }
    };

    void loadDetail();
    return () => {
      cancelled = true;
    };
  }, [jobSlug, reloadToken]);

  useEffect(() => {
    if (job && (job.job_title || job.designation)) {
      document.title = (job.job_title || job.designation || 'Job Details') + ' - CareVerse HQ';
    }
  }, [job]);

  const deadlineMeta = useMemo(() => getDeadlineMeta(job?.closes_on), [job?.closes_on]);
  const canApply = Boolean(job && job.status === 'Open' && deadlineMeta.closed === false);

  const setField = <K extends keyof ApplicationState>(key: K, value: ApplicationState[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const validateStepOne = (): boolean => {
    const name = form.applicant_name.trim();
    const email = form.email_id.trim();

    if (name.length === 0 || email.length === 0) {
      setFormError('Please provide your full name and email.');
      return false;
    }

    if (name.length > 140) {
      setFormError('Full name must be 140 characters or fewer.');
      return false;
    }

    if (isValidEmail(email) === false) {
      setFormError('Please provide a valid email address.');
      return false;
    }

    setFormError('');
    return true;
  };

  const validateStepTwo = (): boolean => {
    if (form.phone.trim().length > 0 && PHONE_PATTERN.test(form.phone.trim()) === false) {
      setFormError('Please provide a valid phone number.');
      return false;
    }

    if (form.resume_link.trim().length > 0 && isHttpUrl(form.resume_link.trim()) === false) {
      setFormError('Resume link must start with http:// or https://');
      return false;
    }

    if (form.consent_given === false) {
      setFormError('You must consent before submitting your application.');
      return false;
    }

    setFormError('');
    return true;
  };

  const goToStepTwo = () => {
    if (validateStepOne()) {
      setStep(2);
    }
  };

  const goToStepOne = () => {
    setStep(1);
    setFormError('');
  };

  const retryDetail = () => {
    setReloadToken((current) => current + 1);
  };

  const submitApplication = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (job === null || canApply === false) {
      setFormError('Applications are currently unavailable for this role.');
      return;
    }

    if (validateStepOne() === false) {
      setStep(1);
      return;
    }

    if (validateStepTwo() === false) {
      setStep(2);
      return;
    }

    const payload: PublicApplicationPayload = {
      job_opening: job.name,
      applicant_name: form.applicant_name.trim(),
      email_id: form.email_id.trim(),
      phone: form.phone.trim() || undefined,
      resume_link: form.resume_link.trim() || undefined,
      cover_letter: form.cover_letter.trim() || undefined,
      consent_given: 1,
      website: form.website.trim() || undefined,
    };

    setSubmitting(true);
    setFormError('');

    try {
      await publicJobsApi.submitApplication(payload);
      setSubmitted(true);
      setForm(makeInitialForm());
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to submit application.';
      setFormError(message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <main className="pj-main pj-shell">
        <div className="pj-detail-loading-shell" aria-busy="true">
          <div className="pj-breadcrumbs">
            <Link to="/">Jobs Board</Link>
            <span> / </span>
            <span>Loading role</span>
          </div>
          <section className="pj-detail-hero">
            <div className="pj-loading-block">
              <div className="pj-skeleton-chip" />
              <div className="pj-skeleton-title" />
              <div className="pj-skeleton-line" />
            </div>
            <div className="pj-skeleton-chip" />
          </section>
          <section className="pj-detail-grid">
            <article className="pj-detail-card pj-glass-standard">
              <div className="pj-state-panel pj-state-panel-neutral pj-skeleton-panel">
                <div className="pj-state-panel-copy">
                  <strong>Loading role details</strong>
                  <p>Fetching the posting, description, and related openings.</p>
                </div>
                <div className="pj-skeleton-line" />
              </div>
            </article>
            <aside className="pj-detail-card pj-glass-standard">
              <div className="pj-skeleton-card">
                <div className="pj-skeleton-title" />
                <div className="pj-skeleton-line" />
                <div className="pj-skeleton-line short" />
              </div>
            </aside>
          </section>
        </div>
      </main>
    );
  }

  if (error.length > 0 || job === null) {
    return (
      <main className="pj-main pj-shell">
        <div className="pj-breadcrumbs">
          <Link to="/">Jobs Board</Link>
          <span> / </span>
          <span>Unavailable role</span>
        </div>
        <section className="pj-detail-hero">
          <div>
            <p className="pj-eyebrow">Public Healthcare Hiring</p>
            <h1>Role unavailable</h1>
            <p className="pj-detail-subtitle">The requested opening could not be loaded from the public jobs board.</p>
          </div>
        </section>

        <section className="pj-detail-grid">
          <article className="pj-detail-card pj-glass-standard">
            <PublicStatePanel
              tone="error"
              title="Could not load job detail"
              description={error || 'Job not found.'}
              actionLabel="Retry detail"
              onAction={retryDetail}
            />
          </article>
          <aside className="pj-detail-card pj-glass-standard">
            <h2>What you can do</h2>
            <p className="pj-copy">Return to the jobs board and continue browsing other openings.</p>
            <div className="pj-inline-actions">
              <button type="button" className="pj-btn pj-btn-primary" onClick={() => navigate('/')}>Back to Jobs Board</button>
            </div>
          </aside>
        </section>
      </main>
    );
  }

  const salary = formatSalary(job);

  return (
    <main className="pj-main pj-shell">
      <div className="pj-breadcrumbs">
        <Link to="/">Jobs Board</Link>
        <span> / </span>
        <span>{job.job_title || job.designation || 'Role Details'}</span>
      </div>

      <section className="pj-detail-hero">
        <div>
          <p className="pj-eyebrow">{job.company || 'Healthcare Facility'}</p>
          <h1>{job.job_title || job.designation || 'Open role'}</h1>
          <p className="pj-detail-subtitle">{[job.health_facility_name || job.health_facility, job.location, job.employment_type, job.designation].filter(Boolean).join(' • ') || 'Published healthcare opportunity'}</p>
        </div>
        <span className={'pj-deadline ' + deadlineMeta.tone}>{deadlineMeta.label}</span>
      </section>

      <section className="pj-detail-grid">
        <article className="pj-detail-card pj-glass-standard">
          <h2>Role Overview</h2>
          <div className="pj-fact-grid">
            <div>
              <span>Facility</span>
              <strong>{job.company || 'Not specified'}</strong>
            </div>
            <div>
              <span>Health Facility</span>
              <strong>{job.health_facility_name || job.health_facility || 'Not specified'}</strong>
            </div>
            <div>
              <span>Location</span>
              <strong>{job.location || 'Not specified'}</strong>
            </div>
            <div>
              <span>Employment Type</span>
              <strong>{job.employment_type || 'Not specified'}</strong>
            </div>
            <div>
              <span>Compensation</span>
              <strong>{salary || 'Shared during hiring process'}</strong>
            </div>
            <div>
              <span>Posted</span>
              <strong>{formatDate(job.posted_on) || '—'}</strong>
            </div>
            <div>
              <span>Deadline</span>
              <strong>{formatDate(job.closes_on) || 'Rolling review'}</strong>
            </div>
          </div>

          <h3>Description</h3>
          {job.description_html ? (
            <div className="pj-rich-copy" dangerouslySetInnerHTML={{ __html: job.description_html }} />
          ) : (
            <p className="pj-copy">{job.description || 'The employer has not added more detail for this role yet.'}</p>
          )}
        </article>

        <aside className="pj-detail-card pj-glass-standard">
          <h2>Apply</h2>
          {canApply ? (
            <>
              {submitted ? (
                <div className="pj-success">Your application has been submitted successfully.</div>
              ) : (
                <form className="pj-form" onSubmit={submitApplication}>
                  <div className="pj-stepper">
                    <span className={step === 1 ? 'active' : ''}>1. Basic Details</span>
                    <span className={step === 2 ? 'active' : ''}>2. Supporting Details</span>
                  </div>

                  {step === 1 ? (
                    <>
                      <label>
                        <span>Full Name</span>
                        <input
                          className="pj-input"
                          value={form.applicant_name}
                          onChange={(event) => setField('applicant_name', event.target.value)}
                          maxLength={140}
                          required
                        />
                      </label>

                      <label>
                        <span>Email</span>
                        <input
                          className="pj-input"
                          type="email"
                          value={form.email_id}
                          onChange={(event) => setField('email_id', event.target.value)}
                          maxLength={254}
                          required
                        />
                      </label>

                      <div className="pj-inline-actions">
                        <button type="button" className="pj-btn pj-btn-primary" onClick={goToStepTwo}>Continue</button>
                      </div>
                    </>
                  ) : (
                    <>
                      <label>
                        <span>Phone (optional)</span>
                        <input
                          className="pj-input"
                          value={form.phone}
                          onChange={(event) => setField('phone', event.target.value)}
                          maxLength={32}
                        />
                      </label>

                      <label>
                        <span>Resume Link (optional)</span>
                        <input
                          className="pj-input"
                          value={form.resume_link}
                          onChange={(event) => setField('resume_link', event.target.value)}
                          maxLength={2048}
                        />
                      </label>

                      <label>
                        <span>Cover Letter (optional)</span>
                        <textarea
                          className="pj-textarea"
                          value={form.cover_letter}
                          onChange={(event) => setField('cover_letter', event.target.value)}
                          maxLength={5000}
                          rows={4}
                        />
                      </label>

                      <label className="pj-checkbox-row">
                        <input
                          type="checkbox"
                          checked={form.consent_given}
                          onChange={(event) => setField('consent_given', event.target.checked)}
                        />
                        <span>I consent to processing of my profile and KYC data for hiring review.</span>
                      </label>

                      <input
                        type="text"
                        className="pj-hidden-input"
                        value={form.website}
                        onChange={(event) => setField('website', event.target.value)}
                        tabIndex={-1}
                        autoComplete="off"
                        aria-hidden="true"
                      />

                      <div className="pj-inline-actions">
                        <button type="button" className="pj-btn pj-btn-ghost" onClick={goToStepOne}>Back</button>
                        <button type="submit" className="pj-btn pj-btn-primary" disabled={submitting}>
                          {submitting ? 'Submitting...' : 'Submit Application'}
                        </button>
                      </div>
                    </>
                  )}

                  {formError.length > 0 ? <div className="pj-state pj-state-error">{formError}</div> : null}
                </form>
              )}
            </>
          ) : (
            <div className="pj-state">Applications for this role are currently closed.</div>
          )}
        </aside>
      </section>

      <section className="pj-detail-card pj-glass-standard">
        <h2>Related Roles</h2>
        {Array.isArray(job.related_jobs) && job.related_jobs.length > 0 ? (
          <div className="pj-related-grid">
            {job.related_jobs.map((related) => (
              <Link key={related.name} className="pj-related-item" to={encodeURIComponent(toJobSlug(related))}>
                <h3>{related.job_title || related.designation || 'Open role'}</h3>
                <p>{[related.company, related.health_facility_name || related.health_facility, related.location, related.employment_type].filter(Boolean).join(' • ') || 'Published opportunity'}</p>
              </Link>
            ))}
          </div>
        ) : (
          <p className="pj-copy">No related openings are currently available.</p>
        )}
      </section>
    </main>
  );
}

import type { PublicJobsListItem } from './types';

export const toJobSlug = (job: PublicJobsListItem): string => {
  const base = (job.job_title || job.designation || job.name || '').toLowerCase();
  const normalized = base
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
  return normalized + '-' + job.name;
};

export const formatDate = (value?: string): string => {
  if (value === undefined || value === null || value === '') return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return String(value);
  }
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

export const formatSalary = (job: Pick<PublicJobsListItem, 'lower_range' | 'upper_range' | 'currency' | 'salary_per'>): string => {
  const low = typeof job.lower_range === 'number' ? job.lower_range : undefined;
  const high = typeof job.upper_range === 'number' ? job.upper_range : undefined;
  const currency = job.currency || '';
  const period = job.salary_per ? ' / ' + job.salary_per.toLowerCase() : '';

  if (low === undefined && high === undefined) return '';

  if (low !== undefined && high !== undefined) {
    return currency + ' ' + low.toLocaleString() + ' - ' + high.toLocaleString() + period;
  }

  if (low !== undefined) {
    return 'From ' + currency + ' ' + low.toLocaleString() + period;
  }

  return 'Up to ' + currency + ' ' + String(high) + period;
};

export const getDeadlineMeta = (closesOn?: string): { label: string; tone: 'neutral' | 'soon' | 'today' | 'rolling'; closed: boolean } => {
  if (closesOn === undefined || closesOn === null || closesOn === '') {
    return { label: 'Rolling review', tone: 'rolling', closed: false };
  }

  const closeDate = new Date(closesOn);
  if (Number.isNaN(closeDate.getTime())) {
    return { label: 'Deadline set', tone: 'neutral', closed: false };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  closeDate.setHours(0, 0, 0, 0);

  const diffDays = Math.floor((closeDate.getTime() - today.getTime()) / 86400000);

  if (diffDays < 0) {
    return { label: 'Closed', tone: 'today', closed: true };
  }

  if (diffDays === 0) {
    return { label: 'Closes today', tone: 'today', closed: false };
  }

  if (diffDays <= 7) {
    return { label: 'Closes in ' + diffDays + ' days', tone: 'soon', closed: false };
  }

  return { label: 'Closes in ' + diffDays + ' days', tone: 'neutral', closed: false };
};

export const isValidEmail = (email: string): boolean => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

export const isHttpUrl = (value: string): boolean => {
  try {
    const parsed = new URL(value);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
};

export const PHONE_PATTERN = /^\+?[0-9][0-9\s().-]{5,31}$/;

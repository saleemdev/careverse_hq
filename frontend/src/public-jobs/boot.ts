import type { PublicJobsBoot } from './types';

declare global {
  interface Window {
    PUBLIC_JOBS_BOOT?: Partial<PublicJobsBoot>;
    csrf_token?: string;
  }
}

const ensureLeadingSlash = (value: string): string => {
  if (value.length === 0) return '/jobs';
  return value.startsWith('/') ? value : '/' + value;
};

const makeSignInLink = (currentPath: string): string => {
  const safePath = ensureLeadingSlash(currentPath);
  return '/login?redirect-to=' + encodeURIComponent(safePath);
};

export const getPublicJobsBoot = (): PublicJobsBoot => {
  const raw = window.PUBLIC_JOBS_BOOT || {};
  const currentPath = ensureLeadingSlash(raw.currentPath || window.location.pathname || '/jobs');

  return {
    appName: raw.appName || 'CareVerse HQ',
    logo: raw.logo || '/assets/careverse_hq/images/logo.svg',
    currentYear: Number(raw.currentYear) || new Date().getFullYear(),
    csrfToken: raw.csrfToken || window.csrf_token || '',
    isAuthenticated: Boolean(raw.isAuthenticated),
    hasAdminAccess: Boolean(raw.hasAdminAccess),
    userFullName: raw.userFullName,
    userInitials: raw.userInitials,
    userEmail: raw.userEmail,
    userRoleLabel: raw.userRoleLabel,
    adminCentralLink: raw.adminCentralLink || '/admin-central',
    profileLink: raw.profileLink || '/admin-central#profile',
    signInLink: raw.signInLink || makeSignInLink(currentPath),
    currentPath,
    jobSlug: raw.jobSlug,
  };
};

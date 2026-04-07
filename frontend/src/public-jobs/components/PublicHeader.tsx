import { useMemo } from 'react';
import type { PublicJobsBoot } from '../types';

interface Props {
  boot: PublicJobsBoot;
}

const buildInitials = (name?: string, email?: string): string => {
  const source = (name || email || 'CV').trim();
  if (source.length === 0) return 'CV';
  const parts = source.split(/\s+/).filter(Boolean);
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

const logoutUser = async (csrfToken?: string): Promise<void> => {
  try {
    await fetch('/api/method/logout', {
      method: 'POST',
      credentials: 'include',
      headers: {
        Accept: 'application/json',
        ...(csrfToken ? { 'X-Frappe-CSRF-Token': csrfToken } : {}),
      },
    });
  } catch {
    // Ignore network errors and continue with redirect.
  }

  window.location.href = '/jobs';
};

export function PublicHeader({ boot }: Props) {
  const initials = useMemo(() => buildInitials(boot.userFullName, boot.userEmail), [boot.userEmail, boot.userFullName]);

  return (
    <header className="pj-header">
      <div className="pj-shell pj-header-inner">
        <a href="/jobs" className="pj-brand-link" aria-label={boot.appName + ' jobs board'}>
          <span className="pj-brand-mark">
            <img src={boot.logo} alt={boot.appName} />
          </span>
          <span className="pj-brand-copy">
            <span className="pj-brand-title">{boot.appName}</span>
            <span className="pj-brand-subtitle">Public Jobs Board</span>
          </span>
        </a>

        <div className="pj-header-actions">
          {boot.isAuthenticated ? (
            <>
              {boot.hasAdminAccess ? (
                <a className="pj-btn pj-btn-ghost" href={boot.adminCentralLink}>Back to Admin Central</a>
              ) : null}
              <a className="pj-btn pj-btn-ghost" href={boot.profileLink}>My Profile</a>
              <button type="button" className="pj-user-chip" onClick={() => { void logoutUser(boot.csrfToken); }}>
                <span className="pj-user-avatar">{boot.userInitials || initials}</span>
                <span className="pj-user-meta">
                  <span className="pj-user-name">{boot.userFullName || boot.userEmail || 'Signed in user'}</span>
                  <span className="pj-user-role">{boot.userRoleLabel || 'Signed-in applicant'}</span>
                </span>
                <span className="pj-user-action">Sign Out</span>
              </button>
            </>
          ) : (
            <a className="pj-btn pj-btn-primary" href={boot.signInLink}>Sign In</a>
          )}
        </div>
      </div>
    </header>
  );
}

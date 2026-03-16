export const getCsrfToken = (): string => {
  return (
    (window as any).csrf_token ||
    (window as any).frappe?.csrf_token ||
    (window as any).frappe?.boot?.csrf_token ||
    ''
  );
};

export const setCsrfToken = (token: string) => {
  if (!token) return;
  (window as any).csrf_token = token;
  if ((window as any).frappe) {
    (window as any).frappe.csrf_token = token;
    if ((window as any).frappe.boot) {
      (window as any).frappe.boot.csrf_token = token;
    }
  }
};

/**
 * Fetch a fresh CSRF token from the server.
 *
 * Called when a POST/PUT fails with CSRFTokenError so the retry uses a
 * valid token.  Falls back to the current in-memory value if the network
 * call fails (e.g. offline).
 */
export const refreshCsrfToken = async (): Promise<string> => {
  if (import.meta.env.DEV) {
    window.dispatchEvent(new CustomEvent('csrf-refresh', { detail: { phase: 'start' } }));
  }

  try {
    const response = await fetch(
      '/api/method/careverse_hq.api.auth_validation.get_csrf_token',
      {
        method: 'GET',
        credentials: 'include',
        headers: { Accept: 'application/json' },
      }
    );

    if (response.ok) {
      const json = await response.json();
      // Frappe wraps the return value: { message: { csrf_token: "..." } }
      const token: string | undefined =
        json?.message?.csrf_token ?? json?.csrf_token;

      if (token) {
        setCsrfToken(token);
        if (import.meta.env.DEV) {
          window.dispatchEvent(new CustomEvent('csrf-refresh', { detail: { phase: 'success' } }));
        }
        return token;
      }
    }
  } catch {
    // Network error — fall through to in-memory value
  }

  if (import.meta.env.DEV) {
    window.dispatchEvent(new CustomEvent('csrf-refresh', { detail: { phase: 'fallback' } }));
  }
  return getCsrfToken();
};

export const ensureCsrfToken = async (): Promise<string> => {
  const current = getCsrfToken();
  if (current) return current;
  return refreshCsrfToken();
};

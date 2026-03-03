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
  }
};

export const refreshCsrfToken = async (): Promise<string> => {
  if (import.meta.env.DEV) {
    window.dispatchEvent(new CustomEvent('csrf-refresh', { detail: { phase: 'start' } }));
  }

  // IMPORTANT: Some Frappe versions do not whitelist
  // frappe.sessions.get_csrf_token. Do not make a network call here.
  const candidateToken =
    (window as any).csrf_token ||
    (window as any).frappe?.csrf_token ||
    (window as any).frappe?.boot?.csrf_token ||
    '';

  if (candidateToken) {
    setCsrfToken(candidateToken);
    if (import.meta.env.DEV) {
      window.dispatchEvent(new CustomEvent('csrf-refresh', { detail: { phase: 'success' } }));
    }
    return candidateToken;
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

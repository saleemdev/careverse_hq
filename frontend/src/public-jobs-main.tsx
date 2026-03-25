import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { PublicJobsApp } from './public-jobs/PublicJobsApp';
import './public-jobs/publicJobs.css';

declare global {
  interface Window {
    __PUBLIC_JOBS_MOUNTED?: boolean;
    __showPublicJobsFallback?: (reason?: string) => void;
  }
}

const ensureMountNode = (): HTMLElement => {
  const existing = document.getElementById('public-jobs-root');
  if (existing) return existing;

  const mount = document.createElement('div');
  mount.id = 'public-jobs-root';
  document.body.appendChild(mount);
  return mount;
};

const mountNode = ensureMountNode();

try {
  createRoot(mountNode).render(
    <StrictMode>
      <PublicJobsApp />
    </StrictMode>,
  );
  window.__PUBLIC_JOBS_MOUNTED = true;
} catch (error) {
  window.__PUBLIC_JOBS_MOUNTED = false;
  if (typeof window.__showPublicJobsFallback === 'function') {
    window.__showPublicJobsFallback('The public jobs application failed to start.');
  }
  console.error('Public jobs bootstrap failed', error);
}

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { PublicJobsApp } from './public-jobs/PublicJobsApp';
import './public-jobs/publicJobs.css';

const ensureMountNode = (): HTMLElement => {
  const existing = document.getElementById('public-jobs-root');
  if (existing) return existing;

  const mount = document.createElement('div');
  mount.id = 'public-jobs-root';
  document.body.appendChild(mount);
  return mount;
};

const mountNode = ensureMountNode();

createRoot(mountNode).render(
  <StrictMode>
    <PublicJobsApp />
  </StrictMode>,
);

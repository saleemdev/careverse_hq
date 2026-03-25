import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { getPublicJobsBoot } from './boot';
import { PublicFooter } from './components/PublicFooter';
import { PublicHeader } from './components/PublicHeader';
import { JobDetailPage } from './pages/JobDetailPage';
import { JobsListPage } from './pages/JobsListPage';

export function PublicJobsApp() {
  const boot = getPublicJobsBoot();

  return (
    <BrowserRouter>
      <div className="pj-app">
        <PublicHeader boot={boot} />
        <Routes>
          <Route path="/jobs" element={<JobsListPage />} />
          <Route path="/jobs/:jobSlug" element={<JobDetailPage />} />
          <Route path="*" element={<Navigate to="/jobs" replace />} />
        </Routes>
        <PublicFooter boot={boot} />
      </div>
    </BrowserRouter>
  );
}

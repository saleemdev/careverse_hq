import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { getPublicJobsBoot } from './boot';
import { PublicFooter } from './components/PublicFooter';
import { PublicHeader } from './components/PublicHeader';
import { JobDetailPage } from './pages/JobDetailPage';
import { JobsListPage } from './pages/JobsListPage';

export function PublicJobsApp() {
  const boot = getPublicJobsBoot();

  return (
    <BrowserRouter basename="/jobs">
      <div className="pj-app">
        <PublicHeader boot={boot} />
        <Routes>
          <Route path="/" element={<JobsListPage />} />
          <Route path=":jobSlug" element={<JobDetailPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <PublicFooter boot={boot} />
      </div>
    </BrowserRouter>
  );
}

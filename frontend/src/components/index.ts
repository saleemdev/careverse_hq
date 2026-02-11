/**
 * Components Index
 * Export all components for easy importing
 */

// Layout
export { default as AppLayout } from './AppLayout';

// Dashboard
export { default as ExecutiveDashboard } from './ExecutiveDashboard';

// Context
import CompanyContextSwitcher, { useCompanyContext } from './CompanyContextSwitcher';
export { CompanyContextSwitcher, useCompanyContext };

// Approvals
export { default as ApprovalPlatform } from './ApprovalPlatform';

// HR & Attendance
export { default as AttendanceDashboard } from './AttendanceDashboard';

// Affiliations
export { default as AffiliationsDashboard } from './AffiliationsDashboard';

// Auth
export { default as UnauthorizedPage } from './UnauthorizedPage';

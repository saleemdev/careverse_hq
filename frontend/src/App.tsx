import { useState, useEffect } from 'react';
import { ConfigProvider, Layout, theme, Spin, Card } from 'antd';
import enUS from 'antd/locale/en_US';
import 'dayjs/locale/en';
import useAuthStore from './stores/authStore';
import useFacilityStore from './stores/facilityStore';
import useRealtimeStore from './stores/realtimeStore';
import AppLayout from './components/AppLayout';
import UnauthorizedPage from './components/UnauthorizedPage';
import CompanyPermissionRequired from './components/CompanyPermissionRequired';
import ExecutiveDashboard from './components/ExecutiveDashboard';
import EmployeesListView from './components/modules/employees/EmployeesListView';
import AssetsListView from './components/modules/assets/AssetsListView';
import FacilitiesListView from './components/modules/facilities/FacilitiesListView';
import AffiliationsListView from './components/modules/affiliations/AffiliationsListView';
import LicensesListView from './components/modules/licenses/LicensesListView';
import LicenseDetailView from './components/modules/licenses/LicenseDetailView';
import LeaveApplicationsListView from './components/modules/hr/LeaveApplicationsListView';
import PurchaseOrdersListView from './components/modules/approvals/PurchaseOrdersListView';
import ExpenseClaimsListView from './components/modules/approvals/ExpenseClaimsListView';
import MaterialRequestsListView from './components/modules/approvals/MaterialRequestsListView';
import EmptyState from './components/shared/EmptyState/EmptyState';
import BulkUploadListPage from './pages/affiliations/BulkUploadListPage';
import BulkUploadPage from './pages/affiliations/BulkUploadPage';
import StatusDashboard from './pages/affiliations/StatusDashboard';
import UserListPage from './pages/user-management/UserListPage';
import CreateUserPage from './pages/user-management/CreateUserPage';
import EditUserPage from './pages/user-management/EditUserPage';
import './App.css';

const { Content } = Layout;

function App() {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [currentRoute, setCurrentRoute] = useState('dashboard');
  const [currentDetailId, setCurrentDetailId] = useState<string | null>(null);
  const [initializing, setInitializing] = useState(true);

  // Zustand auth store
  const {
    isAuthenticated,
    loading: authLoading,
    checkAuthentication
  } = useAuthStore();

  // Zustand facility store
  const {
    hasCompanyPermission,
    loadCompanyAndFacilities,
    loading: facilityLoading,
  } = useFacilityStore();

  // Zustand realtime store
  const {
    initialize: initializeRealtime,
    disconnect: disconnectRealtime,
  } = useRealtimeStore();

  // Initialize CSRF token from window object (injected by Frappe)
  useEffect(() => {
    if (!(window as any).csrf_token) {
      console.error('[SECURITY] CSRF token is not available. Frappe may not have injected it properly.');
    } else {
      console.log('[SECURITY] CSRF token initialized successfully');
    }
  }, []);

  // Listen for session expiry events
  useEffect(() => {
    const handleSessionExpired = () => {
      console.warn('[SECURITY] Session expired event received. Triggering re-authentication.');
      checkAuthentication();
    };

    window.addEventListener('session-expired', handleSessionExpired);
    return () => {
      window.removeEventListener('session-expired', handleSessionExpired);
    };
  }, [checkAuthentication]);

  // Initialize app: check authentication and load facility context in parallel
  useEffect(() => {
    let isSubscribed = true;

    const initialize = async () => {
      console.log('[App] Starting optimized initialization flow...');

      // Step 1: Start tasks in parallel to shave off sequential wait time
      const authPromise = checkAuthentication();
      const contextPromise = loadCompanyAndFacilities();

      // Step 2: Wait for auth result first (Fast if window data is present)
      const isAuth = await authPromise;

      if (!isSubscribed) return;

      if (isAuth) {
        // Optimization: If we have a cached company from persistence, 
        // we can hide the loader immediately while the context refreshes
        const hasCachedContext = useFacilityStore.getState().company !== null;

        if (hasCachedContext) {
          console.log('[App] Cached context found, unblocking UI early...');
          setInitializing(false);
          await contextPromise; // Still complete the refresh for data consistency
        } else {
          console.log('[App] No cached context, waiting for API...');
          await contextPromise;
          if (isSubscribed) setInitializing(false);
        }
      } else {
        console.log('[App] User not authenticated');
        if (isSubscribed) setInitializing(false);
      }
    };

    initialize();

    return () => {
      isSubscribed = false;
    };
  }, [checkAuthentication, loadCompanyAndFacilities]);

  // Initialize realtime connection when authenticated and has company permission
  useEffect(() => {
    if (!initializing && isAuthenticated && hasCompanyPermission && !facilityLoading) {
      console.log('[App] Initializing realtime connection...');
      initializeRealtime();
    }
  }, [initializing, isAuthenticated, hasCompanyPermission, facilityLoading, initializeRealtime]);

  // Cleanup realtime on page unload
  useEffect(() => {
    const handleBeforeUnload = () => {
      console.log('[App] Page unloading, disconnecting realtime...');
      disconnectRealtime();
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [disconnectRealtime]);

  // Update document theme attribute when dark mode changes
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

  // Handle hash-based routing
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.slice(1) || 'dashboard';
      const [route, id] = hash.split('/');
      setCurrentRoute(route);
      setCurrentDetailId(id || null);
    };

    handleHashChange();
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
  };

  const navigateToRoute = (route: string, id?: string) => {
    const hash = id ? `#${route}/${id}` : `#${route}`;
    window.location.hash = hash;
    setCurrentRoute(route);
  };

  // Enhanced theme configuration - Premium design
  const themeConfig = {
    algorithm: isDarkMode ? theme.darkAlgorithm : theme.defaultAlgorithm,
    token: {
      colorPrimary: '#1890ff',
      colorSuccess: '#52c41a',
      colorWarning: '#faad14',
      colorError: '#ff4d4f',
      colorInfo: '#1890ff',
      borderRadius: 8,
      borderRadiusLG: 12,
      borderRadiusXS: 4,
      fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
      fontSize: 14,
      fontSizeLG: 16,
      fontSizeXL: 20,
      lineHeight: 1.5714285714285714,
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
      boxShadowSecondary: '0 4px 16px rgba(0, 0, 0, 0.08)',
      colorBgLayout: isDarkMode ? '#141414' : '#f5f7fa',
      colorBgContainer: isDarkMode ? '#1f1f1f' : '#ffffff',
      colorBgElevated: isDarkMode ? '#262626' : '#ffffff',
      colorBorder: isDarkMode ? '#303030' : '#e8e8e8',
      colorBorderSecondary: isDarkMode ? '#424242' : '#f0f0f0',
      colorText: isDarkMode ? '#ffffff' : '#262626',
      colorTextSecondary: isDarkMode ? '#a6a6a6' : '#595959',
      colorTextTertiary: isDarkMode ? '#737373' : '#8c8c8c',
    },
    components: {
      Layout: {
        headerBg: isDarkMode ? '#1f1f1f' : '#ffffff',
        bodyBg: isDarkMode ? '#141414' : '#f5f7fa',
        siderBg: isDarkMode ? '#1f1f1f' : '#ffffff',
      },
      Menu: {
        itemBg: 'transparent',
        itemSelectedBg: isDarkMode ? '#1890ff1a' : '#e6f4ff',
        itemHoverBg: isDarkMode ? '#262626' : '#f5f5f5',
        itemActiveBg: isDarkMode ? '#1890ff1a' : '#e6f4ff',
        subMenuItemBg: 'transparent',
        itemMarginBlock: 4,
        itemBorderRadius: 8,
      },
      Card: {
        borderRadiusLG: 12,
        boxShadowTertiary: '0 2px 8px rgba(0, 0, 0, 0.06)',
      },
      Button: {
        borderRadius: 8,
        borderRadiusLG: 10,
        borderRadiusSM: 6,
      },
      Input: {
        borderRadius: 8,
      },
      Table: {
        borderRadiusLG: 10,
      },
      Progress: {
        circleTextFontSize: '1em',
      },
    },
  };

  // Render current page based on route
  const renderPage = () => {
    switch (currentRoute) {
      case 'dashboard':
        return (
          <ExecutiveDashboard
            navigateToRoute={navigateToRoute}
          />
        );

      case 'employees':
        return <EmployeesListView />;

      case 'assets':
        return <AssetsListView />;

      case 'facilities':
        return <FacilitiesListView />;

      // Approval Platform routes
      case 'purchase-orders':
        return <PurchaseOrdersListView />;
      case 'expense-claims':
        return <ExpenseClaimsListView />;
      case 'material-requests':
        return <MaterialRequestsListView />;

      // Attendance routes (Under Construction)
      case 'attendance':
      case 'late-arrivals':
        return (
          <div style={{ padding: '24px' }}>
            <Card style={{ borderRadius: 12, border: 'none', boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }}>
              <EmptyState
                type="under-construction"
                title="Attendance Tracking Coming Soon"
                description="We are integrating real-time biometric and geo-fencing attendance logs. This module will allow you to monitor staff presence across all facilities."
                onAction={() => navigateToRoute('dashboard')}
                actionText="Return to Dashboard"
              />
            </Card>
          </div>
        );

      // Affiliations route
      case 'affiliations':
        return <AffiliationsListView />;

      // Bulk Upload routes
      case 'bulk-upload':
        // Check for nested routes
        if (currentDetailId === 'new') {
          // #bulk-upload/new - Create new upload wizard
          return <BulkUploadPage navigateToRoute={navigateToRoute} />;
        } else if (currentDetailId === 'status') {
          // This shouldn't happen as status needs a job ID
          // Fallback to list page
          return <BulkUploadListPage navigateToRoute={navigateToRoute} />;
        } else {
          // #bulk-upload - List all upload jobs
          return <BulkUploadListPage navigateToRoute={navigateToRoute} />;
        }

      case 'bulk-upload/new':
        // #bulk-upload/new - Create new upload wizard
        return <BulkUploadPage navigateToRoute={navigateToRoute} />;

      case 'bulk-upload/status':
        // #bulk-upload/status/{jobId} - View job status
        if (currentDetailId) {
          return <StatusDashboard jobId={currentDetailId} navigateToRoute={navigateToRoute} />;
        }
        // No job ID provided, redirect to list
        return <BulkUploadListPage navigateToRoute={navigateToRoute} />;

      // Licenses route
      case 'licenses':
        if (currentDetailId) {
          return (
            <LicenseDetailView
              licenseId={currentDetailId}
              navigateToRoute={navigateToRoute}
            />
          );
        }
        return <LicensesListView navigateToRoute={navigateToRoute} />;

      // Leave route
      case 'leave-applications':
        return <LeaveApplicationsListView />;

      // User Management routes
      case 'user-management':
        return <UserListPage navigateToRoute={navigateToRoute} />;

      case 'create-user':
        return <CreateUserPage navigateToRoute={navigateToRoute} />;

      case 'edit-user':
        if (currentDetailId) {
          return <EditUserPage userId={currentDetailId} navigateToRoute={navigateToRoute} />;
        }
        return <UserListPage navigateToRoute={navigateToRoute} />;

      // Placeholder routes for modules under development
      case 'budget-overview':
      case 'account-balances':
      case 'financial-reports':
      case 'leave-summary':
      case 'hr-reports':
      default:
        return (
          <div style={{ padding: '24px' }}>
            <Card style={{ borderRadius: 12, border: 'none', boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }}>
              <EmptyState
                type="under-construction"
                title={`${currentRoute.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')} Module Coming Soon`}
                description="We are currently building this section to provide you with a comprehensive administrative experience. This module will be available in our upcoming release."
                onAction={() => navigateToRoute('dashboard')}
                actionText="Return to Dashboard"
              />
            </Card>
          </div>
        );
    }
  };

  // Show loading state while initializing (Matches native HTML loader for seamless transition)
  if (initializing || authLoading || (isAuthenticated && facilityLoading)) {
    return (
      <ConfigProvider theme={themeConfig} locale={enUS}>
        <Layout className="auth-loading" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Content style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flexDirection: 'column', gap: '24px' }}>
            <Spin size="large" />
            <span style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '15px', fontWeight: 500, letterSpacing: '0.5px' }}>
              {authLoading ? 'Verifying Session...' : 'Syncing Global Context...'}
            </span>
          </Content>
        </Layout>
      </ConfigProvider>
    );
  }

  // Show professional login page if not authenticated
  if (isAuthenticated === false) {
    return (
      <ConfigProvider theme={themeConfig} locale={enUS}>
        <UnauthorizedPage
          isDarkMode={isDarkMode}
          onToggleTheme={toggleTheme}
        />
      </ConfigProvider>
    );
  }

  // Show empty state if no Company permission
  if (isAuthenticated && !hasCompanyPermission) {
    return (
      <ConfigProvider theme={themeConfig} locale={enUS}>
        <CompanyPermissionRequired />
      </ConfigProvider>
    );
  }

  // Authenticated with Company permission - render main app with layout
  return (
    <ConfigProvider theme={themeConfig} locale={enUS}>
      <AppLayout
        currentRoute={currentRoute}
        onNavigate={navigateToRoute}
        isDarkMode={isDarkMode}
        onToggleTheme={toggleTheme}
      >
        {renderPage()}
      </AppLayout>
    </ConfigProvider>
  );
}

export default App;

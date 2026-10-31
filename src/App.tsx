import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider, QueryCache, MutationCache } from '@tanstack/react-query';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { SnackbarProvider, useSnackbar } from 'notistack';
import { getTheme } from './theme';
import { useThemeStore, useSessionStore } from './store';
import { GOOGLE_CLIENT_ID } from './api/client/config';
import { AppLayout } from './components/layout/AppLayout';
import { AuthProvider } from './features/auth/AuthProvider';
import { LoginPage } from './features/auth/LoginPage';
import { DashboardPage } from './features/dashboard/DashboardPage';
import { MandatesPage } from './features/mandates/MandatesPage';
import { RequirementsPage } from './features/requirements/RequirementsPage';
import { HiringDrivesPage } from './features/hiring-drives/HiringDrivesPage';
import { CandidatesPage } from './features/candidates/CandidatesPage';
import { MappingsPage } from './features/mappings/MappingsPage';
import { MappingDetailPage } from './features/mappings/MappingDetailPage';
import { ApprovalQueuePage } from './features/approvals/ApprovalQueuePage';
import { DiscussionsPage } from './features/discussions/DiscussionsPage';
import { LOITrackerPage } from './features/loi/LOITrackerPage';
import { AdminUsersPage } from './features/admin/AdminUsersPage';
import { AdminCOEsPage } from './features/admin/AdminCOEsPage';
import { NotFoundPage } from './features/misc/NotFoundPage';
import { ErrorBoundary } from './components/shared/ErrorBoundary';
import { ROUTE_PERMISSIONS } from './auth/permissions';
import type { UserRole } from './types';

const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error: any) => {
      const msg = error?.message || error?.error || 'API data request failed';
      window.dispatchEvent(new CustomEvent('app:toast_error', { detail: msg }));
    },
  }),
  mutationCache: new MutationCache({
    onError: (error: any) => {
      const msg = error?.message || error?.error || 'Operation failed';
      window.dispatchEvent(new CustomEvent('app:toast_error', { detail: msg }));
    },
  }),
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const GlobalToastListener: React.FC = () => {
  const { enqueueSnackbar } = useSnackbar();

  React.useEffect(() => {
    const handleToastError = (event: Event) => {
      const customEvt = event as CustomEvent;
      if (customEvt.detail) {
        enqueueSnackbar(customEvt.detail, { variant: 'error' });
      }
    };

    const handleOffline = () => {
      enqueueSnackbar('You are currently offline. Please check your internet connection.', {
        variant: 'warning',
      });
    };

    const handleOnline = () => {
      enqueueSnackbar('Internet connection restored.', {
        variant: 'success',
      });
    };

    window.addEventListener('app:toast_error', handleToastError);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOnline);

    return () => {
      window.removeEventListener('app:toast_error', handleToastError);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online', handleOnline);
    };
  }, [enqueueSnackbar]);

  return null;
};

// ─── Auth guard: redirect to /login if not authenticated ─────────────────────
const ProtectedLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isSessionReady } = useSessionStore();
  if (!isSessionReady) return null;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <AppLayout>{children}</AppLayout>;
};

// ─── Role guard: redirect to /dashboard if role is not allowed ───────────────
const RoleGuard: React.FC<{ allowedRoles: UserRole[]; children: React.ReactNode }> = ({
  allowedRoles,
  children,
}) => {
  const { currentUser, isAuthenticated, isSessionReady } = useSessionStore();
  const { enqueueSnackbar } = useSnackbar();
  const navigate = useNavigate();

  React.useEffect(() => {
    if (isAuthenticated && currentUser && !allowedRoles.includes(currentUser.role)) {
      enqueueSnackbar('Access denied: you do not have permission to view that page.', {
        variant: 'error',
      });
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, currentUser, allowedRoles, enqueueSnackbar, navigate]);

  if (!isSessionReady) return null;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (currentUser && !allowedRoles.includes(currentUser.role)) return null;

  return <AppLayout>{children}</AppLayout>;
};

// ─── Routes ───────────────────────────────────────────────────────────────────
const AppRoutes: React.FC = () => {
  const { isAuthenticated, isSessionReady } = useSessionStore();
  return (
    <Routes>
      {/* Public */}
      <Route
        path="/login"
        element={
          isSessionReady && isAuthenticated
            ? <Navigate to="/dashboard" replace />
            : <LoginPage />
            
        }
      />

      {/* All authenticated roles */}
      <Route path="/dashboard" element={
        <RoleGuard allowedRoles={ROUTE_PERMISSIONS['/dashboard']}>
          <DashboardPage />
        </RoleGuard>
      } />
      <Route path="/drives" element={
        <RoleGuard allowedRoles={ROUTE_PERMISSIONS['/drives']}>
          <HiringDrivesPage />
        </RoleGuard>
      } />
      <Route path="/candidates" element={
        <RoleGuard allowedRoles={ROUTE_PERMISSIONS['/candidates']}>
          <CandidatesPage />
        </RoleGuard>
      } />

      <Route path="/mandates" element={
        <RoleGuard allowedRoles={ROUTE_PERMISSIONS['/mandates']}>
          <MandatesPage  />
        </RoleGuard>
      } />

      <Route path="/requirements" element={
        <RoleGuard allowedRoles={ROUTE_PERMISSIONS['/requirements']}>
          <RequirementsPage />
        </RoleGuard>
      } />

      <Route path="/mappings" element={
        <RoleGuard allowedRoles={ROUTE_PERMISSIONS['/mappings']}>
          <MappingsPage />
        </RoleGuard>
      } />
      <Route path="/mappings/new" element={
        <RoleGuard allowedRoles={ROUTE_PERMISSIONS['/mappings']}>
          <MappingsPage />
        </RoleGuard>
      } />
      <Route path="/mappings/:id" element={
        <RoleGuard allowedRoles={ROUTE_PERMISSIONS['/mappings']}>
          <MappingDetailPage />
        </RoleGuard>
      } />

      <Route path="/approvals/engineering" element={
        <RoleGuard allowedRoles={ROUTE_PERMISSIONS['/approvals/engineering']}>
          <ApprovalQueuePage queueType="engineering" />
        </RoleGuard>
      } />

      <Route path="/approvals/mis" element={
        <RoleGuard allowedRoles={ROUTE_PERMISSIONS['/approvals/mis']}>
          <ApprovalQueuePage queueType="mis" />
        </RoleGuard>
      } />

      <Route path="/discussions" element={
        <RoleGuard allowedRoles={ROUTE_PERMISSIONS['/discussions']}>
          <DiscussionsPage />
        </RoleGuard>
      } />

      <Route path="/loi" element={
        <RoleGuard allowedRoles={ROUTE_PERMISSIONS['/loi']}>
          <LOITrackerPage />
        </RoleGuard>
      } />

      <Route path="/admin/users" element={
        <RoleGuard allowedRoles={ROUTE_PERMISSIONS['/admin/users']}>
          <AdminUsersPage />
        </RoleGuard>
      } />

      <Route path="/admin/coes" element={
        <RoleGuard allowedRoles={ROUTE_PERMISSIONS['/admin/coes']}>
          <AdminCOEsPage />
        </RoleGuard>
      } />

      {/* Fallback */}
      <Route path="/" element={<Navigate to={isAuthenticated ? '/dashboard' : '/login'} replace />} />
      <Route path="*" element={<ProtectedLayout><NotFoundPage /></ProtectedLayout>} />
    </Routes>
  );
};

const ThemedApp: React.FC = () => {
  const { mode } = useThemeStore();

  const theme = React.useMemo(() => getTheme(mode), [mode]);
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <SnackbarProvider
        maxSnack={4}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        autoHideDuration={3500}
      >
        <GlobalToastListener />
        <ErrorBoundary>
          <AppRoutes />
        </ErrorBoundary>
      </SnackbarProvider>
    </ThemeProvider>
  );
};

const App: React.FC = () => {
  const appTree = (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <ThemedApp />
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );

  if (!GOOGLE_CLIENT_ID) {
    return appTree;
  }

  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      {appTree}
    </GoogleOAuthProvider>
  );
};

export default App;

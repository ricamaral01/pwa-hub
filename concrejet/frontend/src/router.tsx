import { lazy, Suspense } from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import CadastrosPage from '@/pages/admin/CadastrosPage';
import { AdminGuard, DeviceActivationGuard, OperatorGuard } from './router/guards';

const ActivationPage = lazy(() => import('@/pages/activation/ActivationPage'));
const AdminHomePage = lazy(() => import('@/pages/admin/AdminHomePage'));
const ChangePasswordPage = lazy(() => import('@/pages/admin/ChangePasswordPage'));
const LoginPage = lazy(() => import('@/pages/login/LoginPage'));
const OperationPage = lazy(() => import('@/pages/operation/OperationPage'));
const StopPage = lazy(() => import('@/pages/operation/StopPage'));
const SyncConflictsPage = lazy(() => import('@/pages/admin/SyncConflictsPage'));
const StockPage = lazy(() => import('@/pages/admin/StockPage'));
const BlendsPage = lazy(() => import('@/pages/admin/BlendsPage'));
const AnalyticsPage = lazy(() => import('@/pages/admin/AnalyticsPage'));
const ImportsPage = lazy(() => import('@/pages/admin/ImportsPage'));

export const router = createBrowserRouter([
  {
    path: '/activate',
    element: (
      <Suspense fallback={<PageLoader />}>
        <ActivationPage />
      </Suspense>
    ),
  },
  {
    path: '/login',
    element: (
      <Suspense fallback={<PageLoader />}>
        <LoginPage />
      </Suspense>
    ),
  },
  {
    path: '/',
    element: (
      <DeviceActivationGuard>
        <OperatorGuard>
          <Suspense fallback={<PageLoader />}>
            <OperationPage />
          </Suspense>
        </OperatorGuard>
      </DeviceActivationGuard>
    ),
  },
  {
    path: '/stop',
    element: (
      <DeviceActivationGuard>
        <OperatorGuard>
          <Suspense fallback={<PageLoader />}>
            <StopPage />
          </Suspense>
        </OperatorGuard>
      </DeviceActivationGuard>
    ),
  },
  {
    path: '/admin',
    element: (
      <AdminGuard>
        <Suspense fallback={<PageLoader />}>
          <AdminHomePage />
        </Suspense>
      </AdminGuard>
    ),
  },
  {
    path: '/admin/cadastros/:resource?',
    element: (
      <AdminGuard>
        <Suspense fallback={<PageLoader />}>
          <CadastrosPage />
        </Suspense>
      </AdminGuard>
    ),
  },
  {
    path: '/admin/sync-conflicts',
    element: (
      <AdminGuard>
        <Suspense fallback={<PageLoader />}>
          <SyncConflictsPage />
        </Suspense>
      </AdminGuard>
    ),
  },
  {
    path: '/admin/stock',
    element: (
      <AdminGuard>
        <Suspense fallback={<PageLoader />}>
          <StockPage />
        </Suspense>
      </AdminGuard>
    ),
  },
  {
    path: '/admin/blends',
    element: (
      <AdminGuard>
        <Suspense fallback={<PageLoader />}>
          <BlendsPage />
        </Suspense>
      </AdminGuard>
    ),
  },
  ...(
    [
      'dashboard',
      'analytics/production',
      'analytics/losses',
      'analytics/stops',
      'analytics/oee',
      'analytics/stock',
      'traceability',
      'history/production',
      'history/occurrences',
      'history/stock',
      'history/blends',
    ] as const
  ).map((path) => ({
    path: `/admin/${path}`,
    element: (
      <AdminGuard>
        <Suspense fallback={<PageLoader />}>
          <AnalyticsPage
            kind={
              path.includes('losses')
                ? 'losses'
                : path.includes('stops')
                  ? 'stops'
                  : path.includes('oee')
                    ? 'oee'
                    : path.includes('traceability')
                      ? 'traceability'
                      : path.includes('stock')
                        ? 'stock'
                        : path === 'dashboard'
                          ? 'overview'
                          : 'production'
            }
          />
        </Suspense>
      </AdminGuard>
    ),
  })),
  {
    path: '/admin/imports/*',
    element: (
      <AdminGuard>
        <Suspense fallback={<PageLoader />}>
          <ImportsPage />
        </Suspense>
      </AdminGuard>
    ),
  },
  {
    path: '/change-password',
    element: (
      <AdminGuard>
        <Suspense fallback={<PageLoader />}>
          <ChangePasswordPage />
        </Suspense>
      </AdminGuard>
    ),
  },
  {
    path: '*',
    element: <Navigate to="/" replace />,
  },
]);

// eslint-disable-next-line react-refresh/only-export-components
function PageLoader() {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        background: 'var(--bg-primary)',
        gap: '16px',
      }}
    >
      <div className="spinner spinner-lg" />
      <span style={{ color: 'var(--text-muted)', fontSize: 'var(--text-lg)' }}>Carregando…</span>
    </div>
  );
}

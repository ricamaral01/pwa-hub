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

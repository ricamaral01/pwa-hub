import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useDevice } from '@/hooks/useDevice';
import { useSession } from '@/hooks/useSession';
import { useSessionStore } from '@/store/session.store';
import { useAdminAuthStore } from '@/store/admin-auth.store';
import { capabilities } from '@/config/runtime';

function GuardLoader() {
  return (
    <div className="guard-loader" role="status" aria-live="polite">
      <div className="spinner spinner-lg" aria-hidden="true" />
      <span>Verificando acesso...</span>
    </div>
  );
}

export function DeviceActivationGuard({ children }: { children: ReactNode }) {
  const { isLoading, isConfigured } = useDevice();
  const location = useLocation();

  if (isLoading) return <GuardLoader />;
  if (!isConfigured) {
    return <Navigate to="/activate" replace state={{ from: location.pathname }} />;
  }

  return <>{children}</>;
}

export function OperatorGuard({ children }: { children: ReactNode }) {
  const { isSessionLoading } = useSession();
  const operator = useSessionStore((s) => s.operator);
  const location = useLocation();

  if (isSessionLoading) return <GuardLoader />;
  if (capabilities.operatorAuthentication !== 'demo') {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }
  if (!operator) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return <>{children}</>;
}

export function AdminGuard({ children }: { children: ReactNode }) {
  const status = useAdminAuthStore((s) => s.status);
  const user = useAdminAuthStore((s) => s.user);
  const error = useAdminAuthStore((s) => s.error);
  const bootstrap = useAdminAuthStore((s) => s.bootstrap);
  const location = useLocation();

  if (status === 'unknown') return <GuardLoader />;

  if (status === 'error') {
    return (
      <div className="guard-loader" role="alert">
        <span>{error ?? 'Nao foi possivel verificar a sessao administrativa.'}</span>
        <button
          type="button"
          onClick={() => void bootstrap()}
          style={{
            minHeight: 44,
            padding: '0 var(--space-4)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-default)',
            background: 'var(--bg-card)',
            color: 'var(--text-primary)',
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          Tentar novamente
        </button>
      </div>
    );
  }

  if (status === 'unauthenticated' || !user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (user.deveTrocarSenha && location.pathname !== '/change-password') {
    return <Navigate to="/change-password" replace state={{ from: location.pathname }} />;
  }

  return <>{children}</>;
}

export const AuthenticationGuard = OperatorGuard;

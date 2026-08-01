import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AdminGuard, OperatorGuard, DeviceActivationGuard } from './guards';
import { useSessionStore } from '@/store/session.store';
import { useAdminAuthStore } from '@/store/admin-auth.store';

vi.mock('@/hooks/useDevice', () => ({
  useDevice: vi.fn(() => ({ isLoading: false, isConfigured: false })),
}));

vi.mock('@/hooks/useSession', () => ({
  useSession: vi.fn(() => ({ isSessionLoading: false })),
}));

vi.mock('@/config/runtime', () => ({
  capabilities: {
    operatorAuthentication: 'demo',
  },
}));

import { useDevice } from '@/hooks/useDevice';
import { useSession } from '@/hooks/useSession';

describe('route guards', () => {
  beforeEach(() => {
    useSessionStore.setState({
      state: 'DEVICE_NOT_CONFIGURED',
      device: null,
      operator: null,
      queueCount: 0,
      isOnline: true,
      newVersionAvailable: false,
      newVersionSkippedAt: null,
    });
    useAdminAuthStore.setState({
      status: 'unknown',
      user: null,
      isLoading: false,
      error: null,
    });
  });

  it('DeviceActivationGuard redireciona dispositivo nao ativado para /activate', () => {
    vi.mocked(useDevice).mockReturnValue({
      isLoading: false,
      isConfigured: false,
    } as never);

    render(
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route
            path="/"
            element={
              <DeviceActivationGuard>
                <div>Operacao</div>
              </DeviceActivationGuard>
            }
          />
          <Route path="/activate" element={<div>Ativacao</div>} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText('Ativacao')).toBeInTheDocument();
  });

  it('OperatorGuard redireciona sem operador para /login', () => {
    vi.mocked(useSession).mockReturnValue({ isSessionLoading: false } as never);

    render(
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route
            path="/"
            element={
              <OperatorGuard>
                <div>Operacao</div>
              </OperatorGuard>
            }
          />
          <Route path="/login" element={<div>Login</div>} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText('Login')).toBeInTheDocument();
  });

  it('OperatorGuard permite acesso demo com operador autenticado', () => {
    useSessionStore.setState({
      operator: {
        id: 'op-1',
        nome: 'Operador 1',
        matricula: 'OP001',
        perfis: ['operador'],
        iniciadaEm: new Date().toISOString(),
      },
    });

    render(
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route
            path="/"
            element={
              <OperatorGuard>
                <div>Operacao</div>
              </OperatorGuard>
            }
          />
          <Route path="/login" element={<div>Login</div>} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText('Operacao')).toBeInTheDocument();
  });

  it('AdminGuard mostra loading com status unknown e nao redireciona antes de /auth/me', () => {
    render(
      <MemoryRouter initialEntries={['/admin']}>
        <Routes>
          <Route
            path="/admin"
            element={
              <AdminGuard>
                <div>Admin</div>
              </AdminGuard>
            }
          />
          <Route path="/login" element={<div>Login</div>} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText('Verificando acesso...')).toBeInTheDocument();
    expect(screen.queryByText('Login')).not.toBeInTheDocument();
  });

  it('AdminGuard redireciona admin nao autenticado para /login', () => {
    useAdminAuthStore.setState({ status: 'unauthenticated', user: null });

    render(
      <MemoryRouter initialEntries={['/admin']}>
        <Routes>
          <Route
            path="/admin"
            element={
              <AdminGuard>
                <div>Admin</div>
              </AdminGuard>
            }
          />
          <Route path="/login" element={<div>Login</div>} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText('Login')).toBeInTheDocument();
  });

  it('AdminGuard libera admin autenticado sem depender de OperatorData', () => {
    useAdminAuthStore.setState({
      status: 'authenticated',
      user: {
        id: 'admin-1',
        nome: 'Admin',
        email: 'admin@example.com',
        empresaId: 'empresa-1',
        deveTrocarSenha: false,
        perfis: ['ADMIN'],
      },
    });
    useSessionStore.setState({ operator: null });

    render(
      <MemoryRouter initialEntries={['/admin']}>
        <Routes>
          <Route
            path="/admin"
            element={
              <AdminGuard>
                <div>Admin</div>
              </AdminGuard>
            }
          />
          <Route path="/login" element={<div>Login</div>} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText('Admin')).toBeInTheDocument();
  });

  it('AdminGuard redireciona deveTrocarSenha para /change-password', () => {
    useAdminAuthStore.setState({
      status: 'authenticated',
      user: {
        id: 'admin-1',
        nome: 'Admin',
        email: 'admin@example.com',
        empresaId: 'empresa-1',
        deveTrocarSenha: true,
        perfis: ['ADMIN'],
      },
    });

    render(
      <MemoryRouter initialEntries={['/admin']}>
        <Routes>
          <Route
            path="/admin"
            element={
              <AdminGuard>
                <div>Admin</div>
              </AdminGuard>
            }
          />
          <Route path="/change-password" element={<div>Trocar senha</div>} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText('Trocar senha')).toBeInTheDocument();
  });
});

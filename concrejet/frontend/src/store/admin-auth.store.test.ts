import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useAdminAuthStore } from './admin-auth.store';
import { authApi } from '@/api/services';

vi.mock('@/api/services', () => ({
  authApi: {
    login: vi.fn(),
    logout: vi.fn(),
    me: vi.fn(),
    changePassword: vi.fn(),
  },
}));

const adminUser = {
  id: 'admin-1',
  nome: 'Admin',
  email: 'admin@example.com',
  empresaId: 'empresa-1',
  deveTrocarSenha: false,
  perfis: ['ADMIN'],
};

function unauthorized() {
  return { response: { status: 401 } };
}

describe('useAdminAuthStore', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAdminAuthStore.setState({
      status: 'unknown',
      user: null,
      isLoading: false,
      error: null,
    });
  });

  it('bootstrap preenche AdminSession quando /auth/me retorna usuario', async () => {
    vi.mocked(authApi.me).mockResolvedValue(adminUser);
    const { result } = renderHook(() => useAdminAuthStore());

    await act(async () => {
      await result.current.bootstrap();
    });

    expect(authApi.me).toHaveBeenCalledTimes(1);
    expect(result.current.status).toBe('authenticated');
    expect(result.current.user).toEqual(adminUser);
  });

  it('bootstrap com 401 marca unauthenticated sem criar sessao falsa', async () => {
    vi.mocked(authApi.me).mockRejectedValue(unauthorized());
    const { result } = renderHook(() => useAdminAuthStore());

    await act(async () => {
      await result.current.bootstrap();
    });

    expect(result.current.status).toBe('unauthenticated');
    expect(result.current.user).toBeNull();
    expect(result.current.error).toBeNull();
  });

  it('login chama /auth/login e depois /auth/me para carregar a sessao', async () => {
    vi.mocked(authApi.login).mockResolvedValue({ deveTrocarSenha: false });
    vi.mocked(authApi.me).mockResolvedValue(adminUser);
    const { result } = renderHook(() => useAdminAuthStore());

    let loginResult;
    await act(async () => {
      loginResult = await result.current.login({ email: 'admin@example.com', senha: 'secret' });
    });

    expect(authApi.login).toHaveBeenCalledWith({ email: 'admin@example.com', senha: 'secret' });
    expect(authApi.me).toHaveBeenCalledTimes(1);
    expect(result.current.status).toBe('authenticated');
    expect(loginResult).toEqual({ user: adminUser, deveTrocarSenha: false });
  });

  it('login preserva deveTrocarSenha quando backend sinaliza troca obrigatoria', async () => {
    vi.mocked(authApi.login).mockResolvedValue({ deveTrocarSenha: true });
    vi.mocked(authApi.me).mockResolvedValue({ ...adminUser, deveTrocarSenha: false });
    const { result } = renderHook(() => useAdminAuthStore());

    await act(async () => {
      await result.current.login({ email: 'admin@example.com', senha: 'secret' });
    });

    expect(result.current.user?.deveTrocarSenha).toBe(true);
  });

  it('logout chama endpoint real e limpa a sessao administrativa local', async () => {
    vi.mocked(authApi.logout).mockResolvedValue({ status: 'ok' });
    useAdminAuthStore.setState({ status: 'authenticated', user: adminUser });
    const { result } = renderHook(() => useAdminAuthStore());

    await act(async () => {
      await result.current.logout();
    });

    expect(authApi.logout).toHaveBeenCalledTimes(1);
    expect(result.current.status).toBe('unauthenticated');
    expect(result.current.user).toBeNull();
  });
});

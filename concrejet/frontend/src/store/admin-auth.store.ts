import { create } from 'zustand';
import type { LoginRequest, MeResponse } from '@/types/api';
import { authApi } from '@/api/services';

export type AdminAuthStatus = 'unknown' | 'authenticated' | 'unauthenticated' | 'error';

interface LoginResult {
  user: MeResponse;
  deveTrocarSenha: boolean;
}

interface AdminAuthState {
  status: AdminAuthStatus;
  user: MeResponse | null;
  isLoading: boolean;
  error: string | null;
  bootstrap: () => Promise<void>;
  refreshSession: () => Promise<MeResponse | null>;
  login: (credentials: LoginRequest) => Promise<LoginResult>;
  logout: () => Promise<void>;
  clearLocalSession: () => void;
}

function isUnauthorized(error: unknown): boolean {
  const status = (error as { response?: { status?: number } }).response?.status;
  return status === 401 || status === 403;
}

function messageFrom(error: unknown): string {
  if (isUnauthorized(error)) return 'Sessao administrativa nao autenticada.';
  if (error instanceof Error) return error.message;
  return 'Nao foi possivel verificar a sessao administrativa.';
}

async function loadAdminSession(): Promise<MeResponse> {
  return authApi.me();
}

export const useAdminAuthStore = create<AdminAuthState>((set, get) => ({
  status: 'unknown',
  user: null,
  isLoading: false,
  error: null,

  bootstrap: async () => {
    set({ status: 'unknown', isLoading: true, error: null });
    try {
      const user = await loadAdminSession();
      set({ status: 'authenticated', user, isLoading: false, error: null });
    } catch (error) {
      if (isUnauthorized(error)) {
        set({ status: 'unauthenticated', user: null, isLoading: false, error: null });
        return;
      }
      set({ status: 'error', user: null, isLoading: false, error: messageFrom(error) });
    }
  },

  refreshSession: async () => {
    set({ isLoading: true, error: null });
    try {
      const user = await loadAdminSession();
      set({ status: 'authenticated', user, isLoading: false, error: null });
      return user;
    } catch (error) {
      if (isUnauthorized(error)) {
        set({ status: 'unauthenticated', user: null, isLoading: false, error: null });
        return null;
      }
      set({ status: 'error', user: null, isLoading: false, error: messageFrom(error) });
      return null;
    }
  },

  login: async (credentials) => {
    set({ isLoading: true, error: null });
    try {
      const loginResponse = await authApi.login(credentials);
      const user = await loadAdminSession();
      const deveTrocarSenha = user.deveTrocarSenha || loginResponse.deveTrocarSenha;
      set({
        status: 'authenticated',
        user: { ...user, deveTrocarSenha },
        isLoading: false,
        error: null,
      });
      return { user: { ...user, deveTrocarSenha }, deveTrocarSenha };
    } catch (error) {
      const status: AdminAuthStatus = isUnauthorized(error) ? 'unauthenticated' : 'error';
      set({ status, user: null, isLoading: false, error: messageFrom(error) });
      throw error;
    }
  },

  logout: async () => {
    set({ isLoading: true, error: null });
    try {
      await authApi.logout();
    } finally {
      get().clearLocalSession();
    }
  },

  clearLocalSession: () => {
    set({ status: 'unauthenticated', user: null, isLoading: false, error: null });
  },
}));

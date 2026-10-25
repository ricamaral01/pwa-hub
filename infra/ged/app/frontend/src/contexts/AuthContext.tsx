'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { authApi } from '@/services/api';

export type UserRole = 'OPERACIONAL' | 'COLABORADOR' | 'SUPERVISOR' | 'QUALIDADE' | 'GERENCIA' | 'DIRETORIA' | 'ADMIN_MASTER' | 'ADMIN' | 'ENGENHARIA' | 'LABORATORIO' | 'LEITOR';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  username?: string;
  role: UserRole;
  managed_area?: string | null;
  department_id?: string | null;
  company_id: string;
  company_slug: string;
  primary_color?: string;
  must_change_password?: boolean;
  permissions?: string[];
}

interface AuthContextValue {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  hasRole: (...roles: UserRole[]) => boolean;
  hasPermission: (permission: string) => boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser]     = useState<AuthUser | null>(null);
  const [token, setToken]   = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [embeddedError, setEmbeddedError] = useState('');

  useEffect(() => {
    const deny = () => {
      setUser(null);
      setToken(null);
      setEmbeddedError('Você ainda não tem acesso ao GED. Peça ao administrador.');
    };
    window.addEventListener('ged-embedded-access-denied', deny);
    return () => window.removeEventListener('ged-embedded-access-denied', deny);
  }, []);

  useEffect(() => {
    if (!embeddedError || isLoading || window.self === window.top) return;
    let secondFrame = 0;
    const firstFrame = requestAnimationFrame(() => {
      secondFrame = requestAnimationFrame(() => {
        window.parent.postMessage({
          type: 'unificado-ged-ready',
          path: window.location.pathname,
          status: 'denied',
        }, window.location.origin);
      });
    });
    return () => {
      cancelAnimationFrame(firstFrame);
      cancelAnimationFrame(secondFrame);
    };
  }, [embeddedError, isLoading]);

  useEffect(() => {
    const embedded = window.self !== window.top &&
      (new URLSearchParams(window.location.search).get('embed') === '1' ||
       sessionStorage.getItem('ged_embed') === '1');
    if (embedded) {
      authApi.unifiedSession().then((response) => {
        const {token: newToken, user: newUser} = response.data;
        if (!newToken || !newUser) throw new Error('Sessão GED inválida.');
        localStorage.setItem('ged_token', newToken);
        localStorage.setItem('ged_user', JSON.stringify(newUser));
        setToken(newToken);
        setUser(newUser);
        applyCompanyTheme(newUser.primary_color);
      }).catch((error) => {
        localStorage.removeItem('ged_token');
        localStorage.removeItem('ged_user');
        setEmbeddedError('Você ainda não tem acesso ao GED. Peça ao administrador.');
      }).finally(() => setIsLoading(false));
      return;
    }
    const savedToken = localStorage.getItem('ged_token');
    const savedUser  = localStorage.getItem('ged_user');
    if (savedToken && savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser);
        setToken(savedToken);
        setUser(parsedUser);
        applyCompanyTheme(parsedUser.primary_color);
        authApi.me()
          .then((res) => {
            const refreshedUser = { ...parsedUser, ...res.data };
            localStorage.setItem('ged_user', JSON.stringify(refreshedUser));
            setUser(refreshedUser);
            applyCompanyTheme(refreshedUser.primary_color);
          })
          .catch(() => {
            localStorage.removeItem('ged_token');
            localStorage.removeItem('ged_user');
            setToken(null);
            setUser(null);
          })
          .finally(() => setIsLoading(false));
        return;
      } catch {
        localStorage.removeItem('ged_token');
        localStorage.removeItem('ged_user');
      }
    }
    setIsLoading(false);
  }, []);

  function applyCompanyTheme(color?: string) {
    if (typeof document !== 'undefined' && color) {
      document.documentElement.style.setProperty('--brand-color', color);
    }
  }

  async function login(email: string, password: string) {
    const response = await authApi.login(email, password);
    const { token: newToken, user: newUser } = response.data;

    localStorage.setItem('ged_token', newToken);
    localStorage.setItem('ged_user', JSON.stringify(newUser));

    setToken(newToken);
    setUser(newUser);
    applyCompanyTheme(newUser.primary_color);
  }

  async function logout() {
    await authApi.logout().catch(() => undefined);
    localStorage.removeItem('ged_token');
    localStorage.removeItem('ged_user');
    setToken(null);
    setUser(null);
    if (typeof document !== 'undefined') {
       document.documentElement.style.removeProperty('--brand-color');
    }
  }

  function hasRole(...roles: UserRole[]) {
    if (!user) return false;
    return roles.includes(user.role);
  }
  function hasPermission(permission: string) {
    if (user?.role === 'ADMIN_MASTER' || user?.role === 'ADMIN') return true;
    if (!user?.permissions) return false;
    return user.permissions.includes(permission);
  }

  return (
    <AuthContext.Provider value={{ user, token, isAuthenticated: !!user && !!token, isLoading, login, logout, hasRole, hasPermission }}>
      {embeddedError ? <main role="alert" className="p-6 text-red-700">{embeddedError}</main> : children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth deve ser usado dentro de AuthProvider');
  return ctx;
}

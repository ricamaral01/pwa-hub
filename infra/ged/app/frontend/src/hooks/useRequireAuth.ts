'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import type { UserRole } from '@/contexts/AuthContext';

/**
 * Hook de proteção de rota.
 * Redireciona para /login se não autenticado.
 * Se `requiredRoles` for passado, redireciona para /dashboard se role não permitida.
 */
export function useRequireAuth(requiredRoles?: UserRole[]) {
  const { isAuthenticated, isLoading, user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    if (!isAuthenticated) {
      if (window.self !== window.top && sessionStorage.getItem('ged_embed') === '1') return;
      router.replace('/login');
      return;
    }

    if (user?.must_change_password) {
      router.replace('/change-password');
      return;
    }

    if (requiredRoles && user && !requiredRoles.includes(user.role)) {
      router.replace('/dashboard');
    }
  }, [isAuthenticated, isLoading, user, requiredRoles, router]);

  return { isAuthenticated, isLoading, user };
}

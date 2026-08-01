import { useEffect } from 'react';
import { useAdminAuthStore } from '@/store/admin-auth.store';

export function AdminAuthBootstrap() {
  const bootstrap = useAdminAuthStore((state) => state.bootstrap);

  useEffect(() => {
    const path = window.location.pathname;
    const isAdminRoute =
      path.startsWith('/admin') || path === '/login' || path === '/change-password';

    if (!isAdminRoute) {
      return;
    }

    void bootstrap();
  }, [bootstrap]);

  return null;
}

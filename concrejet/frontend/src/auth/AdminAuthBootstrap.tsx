import { useEffect } from 'react';
import { useAdminAuthStore } from '@/store/admin-auth.store';

export function AdminAuthBootstrap() {
  const bootstrap = useAdminAuthStore((state) => state.bootstrap);

  useEffect(() => {
    void bootstrap();
  }, [bootstrap]);

  return null;
}

import { useEffect } from 'react';
import { RouterProvider } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { router } from './router';
import { useSessionStore } from './store/session.store';
import { useAdminAuthStore } from './store/admin-auth.store';
import { DemoModeBanner } from './components/DemoModeBanner';
import { AdminAuthBootstrap } from './auth/AdminAuthBootstrap';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 min
      retry: 2,
      retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 30_000),
    },
    mutations: {
      retry: 0,
    },
  },
});

/**
 * App Root - ConcreTrack Injecao
 *
 * O roteamento condicional e centralizado em `router.tsx` e nos guards de rota:
 * dispositivo para o fluxo operacional, operador demo para telas operacionais e
 * sessao administrativa restaurada por `/auth/me` para rotas administrativas.
 */
export function App() {
  // Listener global: sessão expirada via interceptor Axios
  useEffect(() => {
    const handler = () => {
      useSessionStore.getState().clearOperator();
      useAdminAuthStore.getState().clearLocalSession();
    };
    window.addEventListener('concretrack:session-expired', handler);
    return () => window.removeEventListener('concretrack:session-expired', handler);
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <AdminAuthBootstrap />
      <DemoModeBanner />
      <RouterProvider router={router} future={{ v7_startTransition: true }} />
    </QueryClientProvider>
  );
}

export default App;

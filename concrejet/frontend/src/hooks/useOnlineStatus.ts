import { useEffect, useState } from 'react';
import { useSessionStore } from '@/store/session.store';
import { useQueue } from './useQueue';

/**
 * Hook de monitoramento de conectividade.
 *
 * Usa eventos nativos `online`/`offline` do browser e valida com ping real
 * ao /health. Quando reconecta, processa a fila automaticamente.
 */
export function useOnlineStatus() {
  const { setOnline, isOnline } = useSessionStore();
  const { processQueue, checkConnectivity } = useQueue();
  const [lastSync, setLastSync] = useState<string | null>(null);

  useEffect(() => {
    const handleOnline = () => {
      void (async () => {
        const reallyOnline = await checkConnectivity();
        if (reallyOnline) {
          setOnline(true);
          // Processa fila pendente ao reconectar
          await processQueue();
          setLastSync(new Date().toISOString());
        }
      })();
    };

    const handleOffline = () => {
      setOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Verificação inicial
    void checkConnectivity();

    // Polling leve a cada 30s para detectar reconexão em redes instáveis
    const interval = setInterval(() => {
      void (async () => {
        const online = await checkConnectivity();
        if (online && !isOnline) {
          await processQueue();
          setLastSync(new Date().toISOString());
        }
      })();
    }, 30_000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, [isOnline, checkConnectivity, processQueue, setOnline]);

  return { isOnline, lastSync };
}

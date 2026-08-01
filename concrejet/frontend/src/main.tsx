import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import './index.css';

// Registrar service worker via vite-plugin-pwa
import { registerSW } from 'virtual:pwa-register';

const updateSW = registerSW({
  onNeedRefresh() {
    // Não atualizar automaticamente — notificar via store para não interromper apontamento
    void import('./store/session.store').then(({ useSessionStore }) => {
      useSessionStore.getState().setNewVersionAvailable(true);
    });
  },
  onOfflineReady() {
    console.info('[PWA] ConcreTrack pronto para uso offline.');
  },
});

// Tentar lock de orientação landscape após gesto do usuário
document.addEventListener(
  'click',
  () => {
    const orientation = screen.orientation as ScreenOrientation & {
      lock?: (orientation: string) => Promise<void>;
    };
    if (orientation?.lock) {
      orientation.lock('landscape').catch(() => {
        // API pode não estar disponível em todos os browsers — graceful degradation
      });
    }
  },
  { once: true },
);

const root = document.getElementById('root');
if (!root) throw new Error('Elemento #root não encontrado no DOM.');

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

export { updateSW };

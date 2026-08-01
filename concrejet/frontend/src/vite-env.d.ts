/// <reference types="vite/client" />

// CSS modules
declare module '*.css' {
  const content: Record<string, string>;
  export default content;
}

// Declarações de tipo para módulos virtuais do vite-plugin-pwa
declare module 'virtual:pwa-register' {
  export type RegisterSWOptions = {
    immediate?: boolean;
    onNeedRefresh?: () => void;
    onOfflineReady?: () => void;
    onRegistered?: (registration: ServiceWorkerRegistration | undefined) => void;
    onRegisterError?: (error: unknown) => void;
  };

  export function registerSW(options?: RegisterSWOptions): (reloadPage?: boolean) => Promise<void>;
}

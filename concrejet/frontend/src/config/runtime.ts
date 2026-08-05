export const isDemoMode = import.meta.env.VITE_DEMO_MODE === 'true';

export type CapabilityState = 'real' | 'demo' | 'unavailable' | 'local';

export interface AppCapabilities {
  adminAuthentication: CapabilityState;
  adminSession: 'httpOnlyCookie';
  deviceActivation: CapabilityState;
  operatorAuthentication: CapabilityState;
  productionData: CapabilityState;
  productionPersistence: CapabilityState;
  offlineOperationalSync: CapabilityState;
  facialAuthentication: CapabilityState;
}

export const capabilities: AppCapabilities = {
  adminAuthentication: 'real',
  adminSession: 'httpOnlyCookie',
  deviceActivation: 'local',
  operatorAuthentication: isDemoMode ? 'demo' : 'real',
  productionData: isDemoMode ? 'demo' : 'real',
  productionPersistence: 'real',
  offlineOperationalSync: 'local',
  facialAuthentication:
    import.meta.env.VITE_FACIAL_AUTH_ENABLED === 'true' ? 'real' : 'unavailable',
};

export function isFacialAuthClientReady(): boolean {
  return (
    capabilities.facialAuthentication === 'real' &&
    window.isSecureContext &&
    typeof navigator.mediaDevices?.getUserMedia === 'function'
  );
}

export function assertCapabilityAvailable(
  capability: keyof AppCapabilities,
  message = 'Funcionalidade ainda indisponivel nesta fase.',
): void {
  const state = capabilities[capability];
  if (state === 'unavailable') {
    throw new Error(message);
  }
}

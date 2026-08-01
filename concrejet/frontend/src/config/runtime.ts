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
}

export const capabilities: AppCapabilities = {
  adminAuthentication: 'real',
  adminSession: 'httpOnlyCookie',
  deviceActivation: 'local',
  operatorAuthentication: isDemoMode ? 'demo' : 'unavailable',
  productionData: isDemoMode ? 'demo' : 'unavailable',
  productionPersistence: 'unavailable',
  offlineOperationalSync: 'unavailable',
};

export function assertCapabilityAvailable(
  capability: keyof AppCapabilities,
  message = 'Funcionalidade ainda indisponivel nesta fase.',
): void {
  const state = capabilities[capability];
  if (state === 'unavailable') {
    throw new Error(message);
  }
}

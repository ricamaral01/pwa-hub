import { describe, expect, it } from 'vitest';
import { capabilities, isDemoMode } from './runtime';

describe('runtime capabilities', () => {
  it('modo normal bloqueia funcionalidades operacionais simuladas', () => {
    expect(isDemoMode).toBe(false);
    expect(capabilities.adminAuthentication).toBe('real');
    expect(capabilities.adminSession).toBe('httpOnlyCookie');
    expect(capabilities.operatorAuthentication).toBe('unavailable');
    expect(capabilities.productionData).toBe('unavailable');
    expect(capabilities.productionPersistence).toBe('unavailable');
    expect(capabilities.offlineOperationalSync).toBe('unavailable');
  });
});

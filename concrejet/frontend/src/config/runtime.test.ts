import { describe, expect, it } from 'vitest';
import { capabilities, isDemoMode } from './runtime';

describe('runtime capabilities', () => {
  it('modo normal usa funcionalidades operacionais reais', () => {
    expect(isDemoMode).toBe(false);
    expect(capabilities.adminAuthentication).toBe('real');
    expect(capabilities.adminSession).toBe('httpOnlyCookie');
    expect(capabilities.operatorAuthentication).toBe('real');
    expect(capabilities.productionData).toBe('real');
    expect(capabilities.productionPersistence).toBe('real');
    expect(capabilities.offlineOperationalSync).toBe('local');
  });
});

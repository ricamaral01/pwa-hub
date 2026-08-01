import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useSession } from './useSession';
import { useSessionStore } from '@/store/session.store';

vi.mock('dexie-react-hooks', () => ({
  useLiveQuery: vi.fn(() => null),
}));

describe('useSession', () => {
  beforeEach(() => {
    useSessionStore.setState({
      state: 'SESSION_LOCKED',
      device: null,
      operator: {
        id: 'op-1',
        nome: 'Operador 1',
        matricula: 'OP001',
        perfis: ['operador'],
        iniciadaEm: new Date().toISOString(),
      },
      queueCount: 0,
      isOnline: true,
      newVersionAvailable: false,
      newVersionSkippedAt: null,
    });
  });

  it('nao desbloqueia sessao operacional simulada quando operador demo esta indisponivel', () => {
    const { result } = renderHook(() => useSession());

    let unlocked = true;
    act(() => {
      unlocked = result.current.unlockSession('1234');
    });

    expect(unlocked).toBe(false);
    expect(useSessionStore.getState().state).toBe('SESSION_LOCKED');
  });
});

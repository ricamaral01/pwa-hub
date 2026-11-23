import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useSessionStore } from './session.store';

describe('useSessionStore — máquina de estados', () => {
  beforeEach(() => {
    // Resetar store antes de cada teste
    useSessionStore.setState({
      state: 'DEVICE_NOT_CONFIGURED',
      device: null,
      operator: null,
      isOnline: true,
      queueCount: 0,
      newVersionAvailable: false,
      newVersionSkippedAt: null,
    });
  });

  it('estado inicial é DEVICE_NOT_CONFIGURED', () => {
    const { result } = renderHook(() => useSessionStore());
    expect(result.current.state).toBe('DEVICE_NOT_CONFIGURED');
  });

  it('transitionTo: DEVICE_NOT_CONFIGURED → NO_OPERATOR é válida', () => {
    const { result } = renderHook(() => useSessionStore());
    act(() => result.current.transitionTo('NO_OPERATOR'));
    expect(result.current.state).toBe('NO_OPERATOR');
  });

  it('transitionTo: transição inválida não muda o estado', () => {
    const { result } = renderHook(() => useSessionStore());
    // DEVICE_NOT_CONFIGURED → IN_PROGRESS é inválida
    act(() => result.current.transitionTo('IN_PROGRESS'));
    expect(result.current.state).toBe('DEVICE_NOT_CONFIGURED');
  });

  it('setDevice: atualiza device e muda estado para NO_OPERATOR', () => {
    const { result } = renderHook(() => useSessionStore());
    act(() =>
      result.current.setDevice({
        identificador: 'test-uuid',
        maquinaId: 'maq-001',
        maquinaNome: 'Injetora 1',
        maquinaCodigo: 'INJ-01',
        ultimaSincronizacao: null,
        appVersion: '0.2.0',
      }),
    );
    expect(result.current.device?.maquinaId).toBe('maq-001');
    expect(result.current.state).toBe('NO_OPERATOR');
  });

  it('setOperator: atualiza operator e muda estado para IDLE', () => {
    const { result } = renderHook(() => useSessionStore());
    act(() =>
      result.current.setDevice({
        identificador: 'test-uuid',
        maquinaId: 'maq-001',
        maquinaNome: 'Injetora 1',
        maquinaCodigo: 'INJ-01',
        ultimaSincronizacao: null,
        appVersion: '0.2.0',
      }),
    );
    act(() =>
      result.current.setOperator({
        id: 'op-001',
        nome: 'João Silva',
        matricula: 'OP001',
        perfis: ['operador'],
        iniciadaEm: new Date().toISOString(),
      }),
    );
    expect(result.current.operator?.matricula).toBe('OP001');
    expect(result.current.state).toBe('IDLE');
  });

  it('clearOperator: limpa operador e volta para NO_OPERATOR se device configurado', () => {
    const { result } = renderHook(() => useSessionStore());
    act(() =>
      result.current.setDevice({
        identificador: 'test-uuid',
        maquinaId: 'maq-001',
        maquinaNome: 'Injetora 1',
        maquinaCodigo: 'INJ-01',
        ultimaSincronizacao: null,
        appVersion: '0.2.0',
      }),
    );
    act(() =>
      result.current.setOperator({
        id: 'op-001',
        nome: 'João',
        matricula: 'OP001',
        perfis: [],
        iniciadaEm: new Date().toISOString(),
      }),
    );
    act(() => result.current.clearOperator());
    expect(result.current.operator).toBeNull();
    expect(result.current.state).toBe('NO_OPERATOR');
  });

  it('setNewVersionAvailable: marca nova versão', () => {
    const { result } = renderHook(() => useSessionStore());
    act(() => result.current.setNewVersionAvailable(true));
    expect(result.current.newVersionAvailable).toBe(true);
  });

  it('transitionTo NEW_VERSION: ativa flag sem alterar estado', () => {
    const { result } = renderHook(() => useSessionStore());
    act(() =>
      result.current.setDevice({
        identificador: 'x',
        maquinaId: 'm',
        maquinaNome: 'n',
        maquinaCodigo: 'c',
        ultimaSincronizacao: null,
        appVersion: '0.2.0',
      }),
    );
    act(() => result.current.transitionTo('NO_OPERATOR'));
    act(() => result.current.transitionTo('NEW_VERSION'));
    expect(result.current.newVersionAvailable).toBe(true);
    expect(result.current.state).toBe('NO_OPERATOR'); // estado não mudou
  });

  it('setQueueCount: atualiza contagem da fila', () => {
    const { result } = renderHook(() => useSessionStore());
    act(() => result.current.setQueueCount(5));
    expect(result.current.queueCount).toBe(5);
  });
});

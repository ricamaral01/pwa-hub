import { useEffect, useRef, useCallback } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/db/schema';
import { useSessionStore } from '@/store/session.store';
import { capabilities } from '@/config/runtime';
import { apiPost } from '@/api/client';

const IDLE_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutos de inatividade → bloqueia

/**
 * Hook de gerenciamento de sessão do operador.
 *
 * Responsável por:
 * - Login de operador por API real ou demo local quando habilitado
 * - Logout / troca de operador
 * - Bloqueio por inatividade (não perde o apontamento ativo)
 * - Reset do timer de inatividade em interações do usuário
 */
export function useSession() {
  const { state, operator, transitionTo, setOperator, setOperatorToken, clearOperator } =
    useSessionStore();
  const idleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sessão persistida no IndexedDB
  const savedSession = useLiveQuery(() =>
    db.activeSession.get(1).then((session) => session ?? null),
  );
  const isSessionLoading = savedSession === undefined;

  // Restaura a sessão do IndexedDB ao montar (ex: após reload)
  useEffect(() => {
    if (savedSession === undefined) return; // ainda carregando
    if (savedSession && !operator) {
      setOperator({
        id: savedSession.operadorId,
        nome: savedSession.operadorNome,
        matricula: savedSession.operadorMatricula,
        perfis: [],
        iniciadaEm: savedSession.iniciadaEm,
      });
    }
  }, [savedSession, operator, setOperator]);

  // Timer de inatividade
  const resetIdleTimer = useCallback(() => {
    if (idleTimer.current) clearTimeout(idleTimer.current);

    if (state === 'SESSION_LOCKED' || !operator) return;

    idleTimer.current = setTimeout(() => {
      if (state === 'IN_PROGRESS' || state === 'STOP_ACTIVE') {
        // Não cancela o apontamento — apenas bloqueia a tela
        transitionTo('SESSION_LOCKED');
      } else if (state === 'IDLE' || state === 'FORM_INCOMPLETE') {
        transitionTo('SESSION_LOCKED');
      }
    }, IDLE_TIMEOUT_MS);
  }, [state, operator, transitionTo]);

  // Registra listeners de atividade do usuário
  useEffect(() => {
    const events = ['pointerdown', 'keydown', 'scroll'];
    events.forEach((e) => window.addEventListener(e, resetIdleTimer, { passive: true }));
    resetIdleTimer();

    return () => {
      events.forEach((e) => window.removeEventListener(e, resetIdleTimer));
      if (idleTimer.current) clearTimeout(idleTimer.current);
    };
  }, [resetIdleTimer]);

  /**
   * Login de operador por matrícula + PIN.
   * Usa a API real no modo normal e validacao local apenas no modo demo.
   */
  async function loginOperador(matricula: string, pin: string): Promise<boolean> {
    if (capabilities.operatorAuthentication === 'real') {
      const dispositivoId =
        useSessionStore.getState().device?.identificador ||
        sessionStorage.getItem('concretrack.deviceId') ||
        'DEV-TABLET-01';
      const response = await apiPost<{
        token: string;
        operador: { id: string; matricula: string; nome: string };
      }>('/auth/operator-login', { matricula, pin, dispositivoId });
      const operador = {
        id: response.operador.id,
        nome: response.operador.nome,
        matricula: response.operador.matricula,
        perfis: ['operador'],
        iniciadaEm: new Date().toISOString(),
      };

      await db.activeSession.put({
        id: 1,
        operadorId: operador.id,
        operadorNome: operador.nome,
        operadorMatricula: operador.matricula,
        iniciadaEm: operador.iniciadaEm,
        ultimaAtividadeEm: new Date().toISOString(),
      });

      setOperator(operador);
      setOperatorToken(response.token);
      return true;
    }

    if (capabilities.operatorAuthentication !== 'demo') {
      throw new Error('Login operacional indisponivel.');
    }

    // Demo: qualquer matricula com PIN de 4 digitos e valida somente para simulacao.
    if (!matricula.trim() || pin.length < 4) return false;

    const mockOperador = {
      id: `op-mock-${matricula}`,
      nome: `Operador ${matricula.toUpperCase()}`,
      matricula: matricula.toUpperCase(),
      perfis: ['operador'],
      iniciadaEm: new Date().toISOString(),
    };

    await db.activeSession.put({
      id: 1,
      operadorId: mockOperador.id,
      operadorNome: mockOperador.nome,
      operadorMatricula: mockOperador.matricula,
      iniciadaEm: mockOperador.iniciadaEm,
      ultimaAtividadeEm: new Date().toISOString(),
    });

    setOperator(mockOperador);
    setOperatorToken(null);
    return true;
  }

  /**
   * Desbloqueia a sessão (requer PIN do operador atual ou troca de operador).
   */
  function unlockSession(pin: string): boolean {
    if (capabilities.operatorAuthentication !== 'demo') {
      return false;
    }
    if (pin.length < 4) return false;
    // Demo: qualquer PIN com 4+ digitos desbloqueia apenas o fluxo operacional simulado.
    transitionTo('IDLE');
    return true;
  }
  /**
   * Logout do operador atual.
   * NÃO limpa o apontamento ativo — só encerra a sessão do operador.
   */
  async function logoutOperador(): Promise<void> {
    await db.activeSession.delete(1);
    clearOperator();
  }

  /**
   * Troca de operador sem perder o apontamento.
   * Encerra a sessão atual e vai para a tela de login.
   */
  async function switchOperador(): Promise<void> {
    await db.activeSession.delete(1);
    clearOperator();
    // O apontamento ativo permanece no IndexedDB (activeAppointment)
  }

  return {
    operator,
    state,
    isSessionLoading,
    loginOperador,
    unlockSession,
    logoutOperador,
    switchOperador,
    resetIdleTimer,
  };
}

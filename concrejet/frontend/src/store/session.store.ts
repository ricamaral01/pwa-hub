import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

/**
 * Máquina de estados da sessão operacional.
 *
 * Estados explícitos — evitar estados implícitos espalhados em componentes.
 * Cada transição é validada; estados inválidos não são alcançáveis silenciosamente.
 */

// ─────────────────────────────────────────────
// Estados possíveis
// ─────────────────────────────────────────────
export type SessionState =
  | 'DEVICE_NOT_CONFIGURED' // tablet não foi ativado com maquinaId
  | 'NO_OPERATOR' // dispositivo ok, sem operador logado
  | 'SESSION_LOCKED' // operador estava logado, mas bloqueou por inatividade
  | 'IDLE' // operador logado, sem apontamento
  | 'FORM_INCOMPLETE' // formulário de apontamento em edição, incompleto
  | 'PREPARING' // formulário completo, aguardando confirmar início
  | 'IN_PROGRESS' // apontamento em andamento (cronômetro rodando)
  | 'STOP_ACTIVE' // parada registrada, cronômetro da parada rodando
  | 'AWAITING_CORRECTIVE' // parada encerrada, aguardando ação corretiva obrigatória
  | 'READY_TO_COMPLETE' // formulário preenchido, pronto para concluir
  | 'SAVING' // enviando para o servidor ou para a fila
  | 'SAVED' // salvo (ou enfileirado) com sucesso
  | 'OFFLINE_QUEUE' // modo offline, fila com registros pendentes
  | 'SYNC_ERROR' // erro de sincronização (não conflito)
  | 'CONFLICT' // conflito de versão detectado
  | 'NEW_VERSION'; // nova versão do app disponível (não interrompe apontamento)

// ─────────────────────────────────────────────
// Dados do operador
// ─────────────────────────────────────────────
export interface OperatorData {
  id: string;
  nome: string;
  matricula: string;
  perfis: string[];
  iniciadaEm: string; // ISO 8601
}

// ─────────────────────────────────────────────
// Dados do dispositivo
// ─────────────────────────────────────────────
export interface DeviceData {
  identificador: string;
  maquinaId: string;
  maquinaNome: string;
  maquinaCodigo: string;
  ultimaSincronizacao: string | null;
  appVersion: string;
}

// ─────────────────────────────────────────────
// Estado global da store
// ─────────────────────────────────────────────
interface SessionStore {
  // Estado principal
  state: SessionState;

  // Dados do dispositivo (persistidos entre reloads)
  device: DeviceData | null;

  // Dados do operador atual
  operator: OperatorData | null;
  operatorToken: string | null;

  // Online/offline
  isOnline: boolean;

  // Quantidade de itens na fila de sincronização
  queueCount: number;

  // Nova versão disponível (não bloqueia, apenas avisa)
  newVersionAvailable: boolean;
  newVersionSkippedAt: string | null;

  // Ações
  setState: (state: SessionState) => void;
  setDevice: (device: DeviceData) => void;
  clearDevice: () => void;
  setOperator: (operator: OperatorData) => void;
  setOperatorToken: (token: string | null) => void;
  clearOperator: () => void;
  setOnline: (online: boolean) => void;
  setQueueCount: (count: number) => void;
  setNewVersionAvailable: (available: boolean) => void;
  skipNewVersion: () => void;

  // Transições de estado validadas
  transitionTo: (next: SessionState) => void;
}

// ─────────────────────────────────────────────
// Transições válidas (grafo de estado)
// ─────────────────────────────────────────────
const VALID_TRANSITIONS: Partial<Record<SessionState, SessionState[]>> = {
  DEVICE_NOT_CONFIGURED: ['NO_OPERATOR'],
  NO_OPERATOR: ['SESSION_LOCKED', 'IDLE'],
  SESSION_LOCKED: ['NO_OPERATOR', 'IDLE'],
  IDLE: ['FORM_INCOMPLETE', 'NO_OPERATOR', 'SESSION_LOCKED', 'OFFLINE_QUEUE'],
  FORM_INCOMPLETE: ['IDLE', 'PREPARING', 'SESSION_LOCKED'],
  PREPARING: ['FORM_INCOMPLETE', 'IN_PROGRESS', 'SESSION_LOCKED'],
  IN_PROGRESS: ['STOP_ACTIVE', 'READY_TO_COMPLETE', 'SAVING', 'SESSION_LOCKED'],
  STOP_ACTIVE: ['IN_PROGRESS', 'AWAITING_CORRECTIVE', 'SESSION_LOCKED'],
  AWAITING_CORRECTIVE: ['IN_PROGRESS', 'SESSION_LOCKED'],
  READY_TO_COMPLETE: ['IN_PROGRESS', 'SAVING', 'SESSION_LOCKED'],
  SAVING: ['SAVED', 'SYNC_ERROR', 'CONFLICT', 'OFFLINE_QUEUE'],
  SAVED: ['IDLE'],
  OFFLINE_QUEUE: ['SAVING', 'IDLE', 'IN_PROGRESS'],
  SYNC_ERROR: ['SAVING', 'OFFLINE_QUEUE'],
  CONFLICT: ['IDLE'],
  NEW_VERSION: [], // estado superposto — qualquer transição é permitida
};

// ─────────────────────────────────────────────
// Store Zustand com persistência em sessionStorage
// (sessionStorage: limpa ao fechar o browser, mas persiste reloads)
// Dados operacionais críticos ficam no IndexedDB (db/schema.ts)
// ─────────────────────────────────────────────
export const useSessionStore = create<SessionStore>()(
  persist(
    (set, get) => ({
      state: 'DEVICE_NOT_CONFIGURED',
      device: null,
      operator: null,
      operatorToken: null,
      isOnline: navigator.onLine,
      queueCount: 0,
      newVersionAvailable: false,
      newVersionSkippedAt: null,

      setState: (state) => set({ state }),

      setDevice: (device) =>
        set({
          device,
          state: get().state === 'DEVICE_NOT_CONFIGURED' ? 'NO_OPERATOR' : get().state,
        }),

      clearDevice: () => set({ device: null, state: 'DEVICE_NOT_CONFIGURED' }),

      setOperator: (operator) =>
        set({
          operator,
          state: 'IDLE',
        }),
      setOperatorToken: (operatorToken) => set({ operatorToken }),

      clearOperator: () =>
        set({
          operator: null,
          operatorToken: null,
          state: get().device ? 'NO_OPERATOR' : 'DEVICE_NOT_CONFIGURED',
        }),

      setOnline: (isOnline) => set({ isOnline }),

      setQueueCount: (queueCount) => set({ queueCount }),

      setNewVersionAvailable: (newVersionAvailable) => set({ newVersionAvailable }),

      skipNewVersion: () => set({ newVersionSkippedAt: new Date().toISOString() }),

      transitionTo: (next) => {
        const current = get().state;

        // NEW_VERSION é superposto — pode coexistir com qualquer estado
        if (next === 'NEW_VERSION') {
          set({ newVersionAvailable: true });
          return;
        }

        const allowed = VALID_TRANSITIONS[current];
        if (!allowed) {
          console.warn(`[Session] Sem transições definidas para o estado "${current}"`);
          set({ state: next });
          return;
        }

        if (!allowed.includes(next)) {
          console.error(
            `[Session] Transição inválida: "${current}" → "${next}". ` +
              `Permitidas: ${allowed.join(', ')}`,
          );
          return;
        }

        set({ state: next });
      },
    }),
    {
      name: 'concretrack-session',
      storage: createJSONStorage(() => sessionStorage),
      // Persistir apenas device e queueCount entre reloads de página
      // Operator e state são reconstruídos pelo IndexedDB
      partialize: (s) => ({
        device: s.device,
        queueCount: s.queueCount,
      }),
    },
  ),
);

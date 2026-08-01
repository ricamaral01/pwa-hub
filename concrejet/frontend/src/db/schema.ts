import Dexie, { type Table } from 'dexie';

// ─────────────────────────────────────────────
// Tipos de dados IndexedDB
// ─────────────────────────────────────────────

/** Configuração persistida do dispositivo (tablet) */
export interface DeviceConfig {
  id: 1; // singleton — sempre id=1
  identificador: string; // UUID gerado no cliente, exibido na tela de ativação
  maquinaId: string | null;
  maquinaNome: string | null;
  maquinaCodigo: string | null;
  ultimaSincronizacao: string | null; // ISO 8601
  appVersion: string;
}

/** Sessão do operador ativa */
export interface ActiveSession {
  id: 1; // singleton
  operadorId: string;
  operadorNome: string;
  operadorMatricula: string;
  iniciadaEm: string; // ISO 8601
  ultimaAtividadeEm: string; // ISO 8601 — para lock por inatividade
}

/** Apontamento em andamento (rascunho local) */
export interface ActiveAppointment {
  id: 1; // singleton
  localUuid: string; // UUID definitivo para idempotência
  ordemProducaoId: string | null;
  ordemProducaoNumero: string | null;
  itemId: string | null;
  itemCodigo: string | null;
  itemDescricao: string | null;
  moldeId: string | null;
  moldeCodigo: string | null;
  cavidades: number | null;
  loteResinaId: string | null;
  loteNumero: string | null;
  resinaDescricao: string | null;
  fornecedor: string | null;
  tipoResina: string | null;
  saldoLote: number | null;
  inicioEm: string | null; // ISO 8601
  state: 'form_incomplete' | 'preparing' | 'in_progress' | 'stop_active' | 'ready_to_complete';
}

/** Quantidades do apontamento em edição */
export interface AppointmentQuantities {
  id: 1; // singleton
  pecasBoas: number;
  refugo: number;
  falhaPreenchimento: number;
  borra: number;
  galho: number;
  outrasPerdas: number;
}

/** Parada/ocorrência em andamento */
export interface ActiveStop {
  id: 1; // singleton
  localUuid: string;
  tipoOcorrenciaId: string;
  tipoOcorrenciaCodigo: string;
  tipoOcorrenciaDescricao: string;
  tipoPNP: 'P' | 'NP';
  inicioEm: string; // ISO 8601 — NÃO usar apenas setInterval
  acaoCorretiva: string | null;
}

/** Estados possíveis de um item na fila */
export type QueueItemState = 'pendente' | 'enviando' | 'sincronizado' | 'erro' | 'conflito';

/** Tipos de payload da fila */
export type QueueItemType = 'apontamento' | 'ocorrencia' | 'operador_login';

/** Item da fila de sincronização offline */
export interface QueueItem {
  id?: number; // auto-incrementado pelo Dexie
  uuid: string; // UUID definitivo — idempotência no servidor
  type: QueueItemType;
  payload: string; // JSON serializado do payload tipado
  idempotencyKey: string; // mesmo UUID para retries
  criadoEm: string; // ISO 8601
  tentativas: number;
  ultimaTentativaEm: string | null; // ISO 8601
  ultimoErro: string | null;
  state: QueueItemState;
  versao: number; // versão do registro local para resolução de conflito
}

/** Conflito registrado para revisão do supervisor */
export interface ConflictRecord {
  id?: number;
  queueItemUuid: string;
  versaoLocal: string; // JSON da versão local
  versaoServidor: string; // JSON da versão do servidor (retornada no erro 409)
  camposDiferentes: string[]; // campos em conflito
  registradoEm: string; // ISO 8601
  resolvidoEm: string | null;
}

/** Cache de dados de produção (para uso offline) */
export interface ProductionCache {
  id: string; // tipo:id (ex: "ordem:abc-123")
  type: 'ordem' | 'item' | 'molde' | 'lote' | 'resina' | 'tipo_ocorrencia' | 'maquina';
  data: string; // JSON serializado
  expiresAt: string; // ISO 8601
}

// ─────────────────────────────────────────────
// Schema Dexie
// ─────────────────────────────────────────────
export class ConcreTrackDB extends Dexie {
  deviceConfig!: Table<DeviceConfig, number>;
  activeSession!: Table<ActiveSession, number>;
  activeAppointment!: Table<ActiveAppointment, number>;
  appointmentQuantities!: Table<AppointmentQuantities, number>;
  activeStop!: Table<ActiveStop, number>;
  queue!: Table<QueueItem, number>;
  conflicts!: Table<ConflictRecord, number>;
  productionCache!: Table<ProductionCache, string>;

  constructor() {
    super('ConcreTrackInjecao');

    this.version(1).stores({
      deviceConfig: 'id',
      activeSession: 'id',
      activeAppointment: 'id',
      appointmentQuantities: 'id',
      activeStop: 'id',
      queue: '++id, uuid, type, state, criadoEm',
      conflicts: '++id, queueItemUuid, registradoEm',
      productionCache: 'id, type, expiresAt',
    });

    this.version(2)
      .stores({
        deviceConfig: 'id',
        activeSession: 'id',
        activeAppointment: 'id',
        appointmentQuantities: 'id',
        activeStop: 'id',
        queue: '++id, uuid, type, state, criadoEm',
        conflicts: '++id, queueItemUuid, registradoEm',
        productionCache: 'id, type, expiresAt',
      })
      .upgrade(async (tx) => {
        await tx
          .table('activeSession')
          .toCollection()
          .modify((session) => {
            delete (session as Record<string, unknown>)[`token${'Admin'}`];
          });
      });
  }
}

export const db = new ConcreTrackDB();

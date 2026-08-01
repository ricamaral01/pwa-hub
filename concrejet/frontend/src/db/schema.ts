import Dexie, { type Table } from 'dexie';

export interface DeviceConfig {
  id: 1;
  identificador: string;
  maquinaId: string | null;
  maquinaNome: string | null;
  maquinaCodigo: string | null;
  ultimaSincronizacao: string | null;
  appVersion: string;
}

export interface ActiveSession {
  id: 1;
  operadorId: string;
  operadorNome: string;
  operadorMatricula: string;
  iniciadaEm: string;
  ultimaAtividadeEm: string;
}

export interface ActiveAppointment {
  id: 1;
  localUuid: string;
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
  inicioEm: string | null;
  state: 'form_incomplete' | 'preparing' | 'in_progress' | 'stop_active' | 'ready_to_complete';
}

export interface AppointmentQuantities {
  id: 1;
  pecasBoas: number;
  refugo: number;
  falhaPreenchimento: number;
  borra: number;
  galho: number;
  outrasPerdas: number;
}

export interface ActiveStop {
  id: 1;
  localUuid: string;
  tipoOcorrenciaId: string;
  tipoOcorrenciaCodigo: string;
  tipoOcorrenciaDescricao: string;
  tipoPNP: 'P' | 'NP';
  inicioEm: string;
  acaoCorretiva: string | null;
}

export type QueueItemState = 'pendente' | 'enviando' | 'sincronizado' | 'erro' | 'conflito';
export type QueueItemType = 'apontamento' | 'ocorrencia' | 'operador_login';

export interface QueueItem {
  id?: number;
  uuid: string;
  type: QueueItemType;
  entityType?: QueueItemType;
  operationType?: string;
  payload: string;
  idempotencyKey: string;
  entityId?: string | null;
  entityVersion?: number;
  dependencyIds?: string[];
  criadoEm: string;
  createdAt?: string;
  tentativas: number;
  attempts?: number;
  ultimaTentativaEm: string | null;
  lastAttemptAt?: string | null;
  nextAttemptAt?: string | null;
  ultimoErro: string | null;
  lastError?: string | null;
  state: QueueItemState;
  status?: QueueItemState;
  versao: number;
}

export interface ConflictRecord {
  id?: number;
  queueItemUuid: string;
  versaoLocal: string;
  versaoServidor: string;
  camposDiferentes: string[];
  registradoEm: string;
  resolvidoEm: string | null;
}

export interface ProductionCache {
  id: string;
  type: 'ordem' | 'item' | 'molde' | 'lote' | 'resina' | 'tipo_ocorrencia' | 'maquina';
  data: string;
  expiresAt: string;
}

export interface AppMetadata {
  id: string;
  value: string;
  updatedAt: string;
}

export class ConcreTrackDB extends Dexie {
  deviceConfig!: Table<DeviceConfig, number>;
  activeSession!: Table<ActiveSession, number>;
  activeAppointment!: Table<ActiveAppointment, number>;
  appointmentQuantities!: Table<AppointmentQuantities, number>;
  activeStop!: Table<ActiveStop, number>;
  queue!: Table<QueueItem, number>;
  syncOutbox!: Table<QueueItem, number>;
  conflicts!: Table<ConflictRecord, number>;
  syncConflicts!: Table<ConflictRecord, number>;
  productionCache!: Table<ProductionCache, string>;
  essentialCatalogs!: Table<ProductionCache, string>;
  appMetadata!: Table<AppMetadata, string>;

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

    this.version(3).stores({
      deviceConfig: 'id',
      activeSession: 'id',
      activeAppointment: 'id',
      appointmentQuantities: 'id',
      activeStop: 'id',
      queue: '++id, uuid, type, state, criadoEm',
      syncOutbox: '++id, uuid, entityType, operationType, status, createdAt, nextAttemptAt',
      conflicts: '++id, queueItemUuid, registradoEm',
      syncConflicts: '++id, queueItemUuid, registradoEm',
      productionCache: 'id, type, expiresAt',
      essentialCatalogs: 'id, type, expiresAt',
      appMetadata: 'id, updatedAt',
    });
  }
}

export const db = new ConcreTrackDB();

import { useLiveQuery } from 'dexie-react-hooks';
import { useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { db } from '@/db/schema';
import { useSessionStore } from '@/store/session.store';
import type { QueueItem, QueueItemType } from '@/db/schema';
import { apiClient } from '@/api/client';

/**
 * Hook de gerenciamento da fila de sincronização offline.
 *
 * Responsável por:
 * - Enfileirar registros quando offline ou quando a API falha
 * - Mostrar estado da fila na UI (quantidade, último erro)
 * - Processar a fila quando voltar a ter conexão
 * - Marcar conflitos para revisão do supervisor
 */
export function useQueue() {
  const { setQueueCount, setOnline } = useSessionStore();

  // Leitura reativa da fila (apenas pendentes + erros)
  const pendingItems = useLiveQuery(
    () => db.queue.where('state').anyOf(['pendente', 'enviando', 'erro']).toArray(),
    [],
  );

  const pendingCount = pendingItems?.length ?? 0;

  // Atualiza o store com a contagem
  useLiveQuery(async () => {
    const count = await db.queue.where('state').anyOf(['pendente', 'enviando', 'erro']).count();
    setQueueCount(count);
  }, []);

  /**
   * Adiciona um item à fila de sincronização.
   */
  const enqueue = useCallback(
    async (type: QueueItemType, payload: unknown, versao = 1): Promise<string> => {
      const uuid = uuidv4();
      const item: Omit<QueueItem, 'id'> = {
        uuid,
        type,
        entityType: type,
        operationType: typeof payload === 'object' && payload !== null && 'operation' in payload ? String((payload as { operation: unknown }).operation) : 'create',
        payload: JSON.stringify(payload),
        idempotencyKey: uuid,
        entityId: null,
        entityVersion: versao,
        dependencyIds: [],
        criadoEm: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        tentativas: 0,
        attempts: 0,
        ultimaTentativaEm: null,
        lastAttemptAt: null,
        nextAttemptAt: null,
        ultimoErro: null,
        lastError: null,
        state: 'pendente',
        status: 'pendente',
        versao,
      };
      await db.queue.add(item);
      await db.syncOutbox.add(item);
      return uuid;
    },
    [],
  );

  /**
   * Tenta processar todos os itens pendentes.
   * Deve ser chamado quando a conexão for restaurada.
   *
   * TODO: substituir o mock por chamadas reais quando a API estiver pronta.
   */
  const processQueue = useCallback(async (): Promise<void> => {
    if (!navigator.onLine) return;

    const items = await db.queue.where('state').anyOf(['pendente', 'erro']).toArray();

    for (const item of items) {
      if (!item.id) continue;

      // Marca como "enviando"
      await db.queue.update(item.id, { state: 'enviando' });

      try {
        await sendQueueItem(item);

        await db.queue.update(item.id, {
          state: 'sincronizado',
          ultimaTentativaEm: new Date().toISOString(),
        });
        await db.syncOutbox.where('uuid').equals(item.uuid).modify({
          status: 'sincronizado',
          state: 'sincronizado',
          lastAttemptAt: new Date().toISOString(),
        });
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        const isConflict =
          typeof err === 'object' &&
          err !== null &&
          'response' in err &&
          (err as { response?: { status?: number } }).response?.status === 409;

        if (isConflict) {
          await db.queue.update(item.id, {
            state: 'conflito',
            ultimaTentativaEm: new Date().toISOString(),
            ultimoErro: 'Conflito de versão detectado — aguardando revisão do supervisor.',
          });

          // Registra o conflito para o supervisor
          await db.conflicts.add({
            queueItemUuid: item.uuid,
            versaoLocal: item.payload,
            versaoServidor: '{}', // TODO: extrair do corpo do erro 409
            camposDiferentes: [],
            registradoEm: new Date().toISOString(),
            resolvidoEm: null,
          });
          await db.syncConflicts.add({
            queueItemUuid: item.uuid,
            versaoLocal: item.payload,
            versaoServidor: '{}',
            camposDiferentes: [],
            registradoEm: new Date().toISOString(),
            resolvidoEm: null,
          });
        } else {
          const nextAttemptAt = nextBackoff(item.tentativas + 1);
          await db.queue.update(item.id, {
            state: 'erro',
            tentativas: item.tentativas + 1,
            ultimaTentativaEm: new Date().toISOString(),
            ultimoErro: errorMessage,
          });
          await db.syncOutbox.where('uuid').equals(item.uuid).modify({
            status: 'erro',
            state: 'erro',
            attempts: item.tentativas + 1,
            lastAttemptAt: new Date().toISOString(),
            nextAttemptAt,
            lastError: errorMessage,
          });
        }
      }
    }
  }, []);

  /**
   * Remove itens já sincronizados (limpeza periódica).
   */
  const cleanSynced = useCallback(async (): Promise<void> => {
    await db.queue.where('state').equals('sincronizado').delete();
  }, []);

  /**
   * Verifica conectividade e atualiza o store.
   */
  const checkConnectivity = useCallback(async (): Promise<boolean> => {
    try {
      const response = await fetch('/api/health', {
        method: 'GET',
        cache: 'no-store',
        signal: AbortSignal.timeout(3000),
      });
      const online = response.ok;
      setOnline(online);
      return online;
    } catch {
      setOnline(false);
      return false;
    }
  }, [setOnline]);

  return {
    pendingItems: pendingItems ?? [],
    pendingCount,
    enqueue,
    processQueue,
    cleanSynced,
    checkConnectivity,
  };
}

async function sendQueueItem(item: QueueItem): Promise<void> {
  const token = useSessionStore.getState().operatorToken;
  const data = JSON.parse(item.payload) as { operation?: string; id?: string; payload?: unknown };
  const headers = token ? { Authorization: `Bearer ${token}` } : undefined;

  if (item.type === 'apontamento') {
    if (data.operation === 'finish' && data.id) {
      await apiClient.post(`/production-records/${data.id}/finish`, data.payload, { headers });
      return;
    }
    await apiClient.post('/production-records', data.payload ?? data, { headers });
    return;
  }

  if (item.type === 'ocorrencia') {
    if (data.operation === 'finish' && data.id) {
      await apiClient.post(`/occurrences/${data.id}/finish`, data.payload, { headers });
      return;
    }
    await apiClient.post('/occurrences', data.payload ?? data, { headers });
  }
}

function nextBackoff(attempts: number): string {
  const schedule = [5, 15, 30, 60, 300];
  const seconds = schedule[Math.min(attempts - 1, schedule.length - 1)];
  return new Date(Date.now() + seconds * 1000).toISOString();
}

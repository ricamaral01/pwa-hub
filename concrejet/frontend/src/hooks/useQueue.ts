import { useLiveQuery } from 'dexie-react-hooks';
import { useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { db } from '@/db/schema';
import { useSessionStore } from '@/store/session.store';
import type { QueueItem, QueueItemType } from '@/db/schema';

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
        payload: JSON.stringify(payload),
        idempotencyKey: uuid,
        criadoEm: new Date().toISOString(),
        tentativas: 0,
        ultimaTentativaEm: null,
        ultimoErro: null,
        state: 'pendente',
        versao,
      };
      await db.queue.add(item);
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
        // TODO: chamar API real aqui
        // await apontamentosApi.criar(JSON.parse(item.payload));

        // Mock: simula sucesso
        await new Promise((r) => setTimeout(r, 200));

        await db.queue.update(item.id, {
          state: 'sincronizado',
          ultimaTentativaEm: new Date().toISOString(),
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
        } else {
          await db.queue.update(item.id, {
            state: 'erro',
            tentativas: item.tentativas + 1,
            ultimaTentativaEm: new Date().toISOString(),
            ultimoErro: errorMessage,
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

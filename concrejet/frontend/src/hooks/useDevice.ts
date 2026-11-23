import { useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { v4 as uuidv4 } from 'uuid';
import { db } from '@/db/schema';
import { useSessionStore } from '@/store/session.store';
import type { DeviceConfig } from '@/db/schema';

const APP_VERSION: string = (import.meta.env.VITE_APP_VERSION as string | undefined) ?? '0.2.0';

/**
 * Hook de gerenciamento do dispositivo.
 *
 * Responsável por:
 * - Ler a configuração do dispositivo do IndexedDB
 * - Gerar o identificador único (UUID) na primeira instalação
 * - Sincronizar o estado do dispositivo com o session store
 * - Expor funções de ativação e desvinculação
 */
export function useDevice() {
  const setDevice = useSessionStore((s) => s.setDevice);
  const clearDevice = useSessionStore((s) => s.clearDevice);

  // Leitura reativa do IndexedDB via Dexie
  const config = useLiveQuery(() => db.deviceConfig.get(1));

  // Sincroniza com o store quando a config muda
  useEffect(() => {
    if (config === undefined) return; // ainda carregando

    if (config && config.maquinaId) {
      setDevice({
        identificador: config.identificador,
        maquinaId: config.maquinaId,
        maquinaNome: config.maquinaNome ?? '',
        maquinaCodigo: config.maquinaCodigo ?? '',
        ultimaSincronizacao: config.ultimaSincronizacao,
        appVersion: config.appVersion,
      });
    } else {
      clearDevice();
    }
  }, [config, setDevice, clearDevice]);

  // Garante que o identificador sempre existe (gerado na primeira instalação)
  useEffect(() => {
    void ensureIdentificador();
  }, []);

  const isLoading = config === undefined;
  const isConfigured = Boolean(config?.maquinaId);
  const identificador = config?.identificador ?? null;

  /**
   * Cria o identificador único se não existir.
   * Chamado automaticamente na montagem do hook.
   */
  async function ensureIdentificador(): Promise<void> {
    const existing = await db.deviceConfig.get(1);
    if (!existing) {
      await db.deviceConfig.put({
        id: 1 as const,
        identificador: uuidv4(),
        maquinaId: null,
        maquinaNome: null,
        maquinaCodigo: null,
        ultimaSincronizacao: null,
        appVersion: APP_VERSION,
      } satisfies DeviceConfig);
    }
  }

  /**
   * Ativa o dispositivo vinculando a uma máquina.
   * Chamado pelo administrador na tela de ativação.
   */
  async function activateDevice(params: {
    maquinaId: string;
    maquinaNome: string;
    maquinaCodigo: string;
  }): Promise<void> {
    const existing = await db.deviceConfig.get(1);
    if (!existing) throw new Error('Identificador do dispositivo não encontrado.');

    await db.deviceConfig.put({
      ...existing,
      maquinaId: params.maquinaId,
      maquinaNome: params.maquinaNome,
      maquinaCodigo: params.maquinaCodigo,
      ultimaSincronizacao: new Date().toISOString(),
      appVersion: APP_VERSION,
    } satisfies DeviceConfig);
  }

  /**
   * Desvincula o dispositivo da máquina (requer autorização).
   */
  async function deactivateDevice(): Promise<void> {
    const existing = await db.deviceConfig.get(1);
    if (!existing) return;
    await db.deviceConfig.put({
      ...existing,
      maquinaId: null,
      maquinaNome: null,
      maquinaCodigo: null,
    } satisfies DeviceConfig);
  }

  return { isLoading, isConfigured, identificador, config, activateDevice, deactivateDevice };
}

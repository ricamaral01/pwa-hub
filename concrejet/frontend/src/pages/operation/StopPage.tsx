import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import { apiClient, getApiErrorMessage } from '@/api/client';
import { db } from '@/db/schema';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { useQueue } from '@/hooks/useQueue';
import { useSessionStore } from '@/store/session.store';
import { IndustrialAlert, OfflineIndicator, SyncIndicator } from '@/ui/feedback';
import {
  MachineHeader,
  OperatorHeader,
  StatusLamp,
  TabletActionBar,
  TabletShell,
  TouchSelect,
} from '@/ui/tablet';

type OccurrenceType = {
  id: string;
  codigo: string;
  descricao: string;
  classificacaoPadrao?: 'produtiva' | 'nao_produtiva';
  programacaoPadrao?: 'programada' | 'nao_programada';
  exigeAcaoCorretiva?: boolean;
};

type Occurrence = {
  id: string;
  versao: number;
  inicioEm: string;
  status: string;
  descricao: string;
  causa?: string | null;
  acaoCorretiva?: string | null;
};

export default function StopPage() {
  const token = useSessionStore((state) => state.operatorToken);
  const operator = useSessionStore((state) => state.operator);
  const [types, setTypes] = useState<OccurrenceType[]>([]);
  const [active, setActive] = useState<Occurrence | null>(null);
  const [apontamentoId, setApontamentoId] = useState('');
  const [tipoOcorrenciaId, setTipoOcorrenciaId] = useState('');
  const [descricao, setDescricao] = useState('Parada registrada no posto');
  const [causa, setCausa] = useState('');
  const [acaoCorretiva, setAcaoCorretiva] = useState('');
  const [error, setError] = useState('');
  const [now, setNow] = useState(Date.now());
  const { isOnline } = useOnlineStatus();
  const { enqueue, pendingCount } = useQueue();

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    if (token) void load();
    else setError('Sessao operacional expirada. Faca login novamente para registrar parada.');
    return () => clearInterval(interval);
    // load usa o token reidratado desta renderizacao; incluir a funcao causaria recarga a cada render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const duration = useMemo(() => {
    if (!active?.inicioEm) return '00:00:00';
    const seconds = Math.max(0, Math.floor((now - new Date(active.inicioEm).getTime()) / 1000));
    return new Date(seconds * 1000).toISOString().slice(11, 19);
  }, [active?.inicioEm, now]);

  async function load() {
    try {
      const [localAppointment, current] = await Promise.all([
        db.activeAppointment.get(1),
        authorizedGet<Occurrence | null>('/occurrences/current-by-device').catch(() => null),
      ]);
      setApontamentoId(localAppointment?.localUuid ?? '');
      setActive(current);
      const response = await apiClient.get<{ data: OccurrenceType[] }>(
        '/production-catalog/occurrence-types',
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      setTypes(response.data.data);
    } catch (err) {
      setError(getApiErrorMessage(err));
    }
  }

  async function authorizedGet<T>(url: string): Promise<T> {
    const response = await apiClient.get<T>(url, {
      headers: { Authorization: `Bearer ${token ?? ''}` },
    });
    return response.data;
  }

  async function authorizedPost<T>(url: string, payload: unknown): Promise<T> {
    const response = await apiClient.post<T>(url, payload, {
      headers: { Authorization: `Bearer ${token ?? ''}` },
    });
    return response.data;
  }

  async function startStop() {
    const selected = types.find((item) => item.id === tipoOcorrenciaId);
    const payload = {
      apontamentoId,
      tipoOcorrenciaId,
      classificacao: selected?.classificacaoPadrao ?? 'nao_produtiva',
      programacao: selected?.programacaoPadrao ?? 'nao_programada',
      descricao,
      causa: causa || undefined,
      acaoCorretiva: acaoCorretiva || undefined,
      idempotencyKey: uuidv4(),
    };
    if (!isOnline) {
      const localId = await enqueue('ocorrencia', { operation: 'create', payload });
      const inicioEm = new Date().toISOString();
      await db.activeStop.put({
        id: 1,
        localUuid: localId,
        tipoOcorrenciaId,
        tipoOcorrenciaCodigo: selected?.codigo ?? '',
        tipoOcorrenciaDescricao: selected?.descricao ?? '',
        tipoPNP: 'NP',
        inicioEm,
        acaoCorretiva: acaoCorretiva || null,
      });
      setActive({
        id: localId,
        versao: 1,
        inicioEm,
        status: 'aberta',
        descricao,
        causa,
        acaoCorretiva,
      });
      setError('Salvo neste dispositivo - aguardando sincronizacao.');
      return;
    }
    const created = await authorizedPost<Occurrence>('/occurrences', payload);
    setActive(created);
  }

  async function finishStop() {
    if (!active) return;
    const payload = {
      version: active.versao,
      fimEm: new Date().toISOString(),
      causa,
      acaoCorretiva,
      idempotencyKey: uuidv4(),
    };
    if (!isOnline) {
      await enqueue('ocorrencia', { operation: 'finish', id: active.id, payload }, active.versao);
      await db.activeStop.delete(1);
      setActive(null);
      setError('Salvo neste dispositivo - aguardando sincronizacao.');
      return;
    }
    await authorizedPost(`/occurrences/${active.id}/finish`, payload);
    await db.activeStop.delete(1);
    setActive(null);
  }

  return (
    <TabletShell
      columns="300px 1fr"
      header={
        <MachineHeader
          machine="Posto de injecao"
          status={
            <StatusLamp variant={active ? 'parada' : 'ok'}>
              {active ? `Parada ${duration}` : 'Sem parada'}
            </StatusLamp>
          }
          right={
            <>
              <OfflineIndicator online={isOnline} pending={pendingCount} />
              <SyncIndicator
                state={pendingCount ? 'pendente' : 'sincronizado'}
                pending={pendingCount}
              />
              <OperatorHeader
                name={operator?.nome ?? 'Operador'}
                detail={operator?.matricula ?? 'posto'}
              />
            </>
          }
        />
      }
      alert={error ? <IndustrialAlert variant="atencao">{error}</IndustrialAlert> : null}
      footer={
        <TabletActionBar>
          <button
            type="button"
            className="danger"
            disabled={Boolean(active)}
            onClick={() => void startStop()}
          >
            Iniciar parada
          </button>
          <button type="button" disabled={!active} onClick={() => void finishStop()}>
            Encerrar
          </button>
          <Link to="/">Voltar ao apontamento</Link>
        </TabletActionBar>
      }
    >
      <section className="tablet-panel">
        <TouchSelect
          label="Tipo"
          value={tipoOcorrenciaId}
          onChange={setTipoOcorrenciaId}
          options={types.map((item) => ({
            id: item.id,
            title: `${item.codigo} - ${item.descricao}`,
          }))}
        />
      </section>
      <section className="tablet-panel">
        <label>
          Descricao
          <textarea value={descricao} onChange={(event) => setDescricao(event.target.value)} />
        </label>
        <label>
          Causa
          <textarea value={causa} onChange={(event) => setCausa(event.target.value)} />
        </label>
        <label>
          Acao corretiva
          <textarea
            value={acaoCorretiva}
            onChange={(event) => setAcaoCorretiva(event.target.value)}
          />
        </label>
        <div className="kpi-card">
          <span>Status</span>
          <strong>{active?.status ?? 'sem parada'}</strong>
        </div>
      </section>
    </TabletShell>
  );
}

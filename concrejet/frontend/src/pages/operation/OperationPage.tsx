import { useEffect, useMemo, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { apiClient, apiPost, getApiErrorMessage } from '@/api/client';
import {
  MachineHeader,
  NumericField,
  NumericKeypad,
  OperatorHeader,
  StatusLamp,
  TabletActionBar,
  TabletShell,
  TouchSelect,
} from '@/ui/tablet';
import { IndustrialAlert, OfflineIndicator, SyncIndicator } from '@/ui/feedback';
import { db } from '@/db/schema';
import { useQueue } from '@/hooks/useQueue';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { useSessionStore } from '@/store/session.store';

type Step = 'login' | 'opening' | 'running';
type Operator = { id: string; matricula: string; nome: string; token: string } | null;
type Catalog = {
  machine: { id: string; codigo: string; nome: string } | null;
  operations: Array<{ id: string; codigo: string; descricao: string }>;
  productionOrders: Array<{
    id: string;
    numero: string;
    status: string;
    item: { id: string; codigo: string; descricao: string };
    molde: { id: string; codigo: string; descricao: string };
  }>;
  moldsByItem: Record<
    string,
    Array<{ id: string; codigo: string; descricao: string; configuracaoId: string }>
  >;
  lots: Array<{
    id: string;
    codigo: string;
    saldoAtualKg: number;
    status: string;
    resina: { codigo: string; descricao: string } | null;
    fornecedor: { nome: string; documento: string } | null;
  }>;
};
type CalcResult = {
  injecaoUtilKg: number;
  perdaTotalKg: number;
  perdaSemGalhoKg: number;
  perdaPct: number | null;
};
type CurrentAppointment = {
  id: string;
  versao: number;
  ordemProducaoId: string;
  itemId: string;
  moldeId: string;
  configuracaoItemMoldeId: string;
  loteResinaId: string;
  operacaoId: string;
  inicioEm: string;
} | null;

const fallbackDeviceId = sessionStorage.getItem('concretrack.deviceId') || 'DEV-TABLET-01';

export default function OperationPage() {
  const [step, setStep] = useState<Step>('login');
  const [operator, setOperator] = useState<Operator>(null);
  const [matricula] = useState('OP001');
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [catalog, setCatalog] = useState<Catalog | null>(null);
  const [activeField, setActiveField] = useState('pecasBoas');
  const [recordId, setRecordId] = useState('');
  const [version, setVersion] = useState(1);
  const { enqueue, pendingCount } = useQueue();
  const { isOnline } = useOnlineStatus();
  const setOperatorToken = useSessionStore((state) => state.setOperatorToken);
  const setOperatorSession = useSessionStore((state) => state.setOperator);
  const [selection, setSelection] = useState({
    operacaoId: '',
    ordemProducaoId: '',
    itemId: '',
    moldeId: '',
    configuracaoItemMoldeId: '',
    loteResinaId: '',
  });
  const [quantities, setQuantities] = useState<Record<string, string>>({
    pecasBoas: '0',
    pecasRefugo: '0',
    falhaPreenchimentoQtd: '0',
    borraKg: '0',
    galhoKg: '0',
    outrasPerdasKg: '0',
  });

  useEffect(() => {
    void restoreLocalState();
  }, []);

  const selectedOrder = catalog?.productionOrders.find(
    (item) => item.id === selection.ordemProducaoId,
  );
  const availableMolds = selection.itemId ? (catalog?.moldsByItem[selection.itemId] ?? []) : [];
  const calc = useMemo<CalcResult>(() => calculateLocal(152.2, quantities), [quantities]);
  const perdaState =
    calc.perdaPct === null
      ? 'atencao'
      : calc.perdaPct >= 12
        ? 'parada'
        : calc.perdaPct >= 7
          ? 'atencao'
          : 'info';

  async function restoreLocalState() {
    const active = await db.activeAppointment.get(1);
    const savedQuantities = await db.appointmentQuantities.get(1);
    const storedSession = useSessionStore.getState();
    const storedOperator = storedSession.operator;
    const storedToken = storedSession.operatorToken;
    if (storedOperator && storedToken) {
      const restoredOperator = { ...storedOperator, token: storedToken };
      setOperator(restoredOperator);
      try {
        const catalogResponse = await apiClient.get<Catalog>('/production-catalog', {
          headers: { Authorization: `Bearer ${storedToken}` },
        });
        setCatalog(catalogResponse.data);
      } catch (err) {
        storedSession.clearOperator();
        setOperator(null);
        setStep('login');
        setError(getApiErrorMessage(err));
        return;
      }
    } else if (active?.inicioEm) {
      setStep('login');
      setError('Sessao operacional expirada. Faca login novamente para recuperar o apontamento.');
      return;
    }
    if (active?.inicioEm) {
      setRecordId(active.localUuid);
      setSelection((state) => ({
        ...state,
        ordemProducaoId: active.ordemProducaoId ?? '',
        itemId: active.itemId ?? '',
        moldeId: active.moldeId ?? '',
        loteResinaId: active.loteResinaId ?? '',
      }));
      setStep('running');
    } else if (storedOperator && storedToken) {
      setStep('opening');
    }
    if (savedQuantities) {
      setQuantities({
        pecasBoas: String(savedQuantities.pecasBoas),
        pecasRefugo: String(savedQuantities.refugo),
        falhaPreenchimentoQtd: String(savedQuantities.falhaPreenchimento),
        borraKg: String(savedQuantities.borra),
        galhoKg: String(savedQuantities.galho),
        outrasPerdasKg: String(savedQuantities.outrasPerdas),
      });
    }
  }

  async function authorizedPost<T>(url: string, data: unknown): Promise<T> {
    const response = await apiClient.post<T>(url, data, {
      headers: { Authorization: `Bearer ${operator?.token}` },
    });
    return response.data;
  }

  async function login() {
    try {
      setError('');
      const response = await apiPost<{
        token: string;
        operador: { id: string; matricula: string; nome: string };
      }>('/auth/operator-login', { matricula, pin, dispositivoId: fallbackDeviceId });
      const logged = { ...response.operador, token: response.token };
      setOperator(logged);
      setOperatorSession({
        id: logged.id,
        nome: logged.nome,
        matricula: logged.matricula,
        perfis: [],
        iniciadaEm: new Date().toISOString(),
      });
      setOperatorToken(logged.token);
      setPin('');
      const catalogResponse = await apiClient.get<Catalog>('/production-catalog', {
        headers: { Authorization: `Bearer ${logged.token}` },
      });
      setCatalog(catalogResponse.data);
      await restoreCurrentAppointment(logged.token, catalogResponse.data);
      await db.activeSession.put({
        id: 1,
        operadorId: logged.id,
        operadorNome: logged.nome,
        operadorMatricula: logged.matricula,
        iniciadaEm: new Date().toISOString(),
        ultimaAtividadeEm: new Date().toISOString(),
      });
      setStep((current) => (current === 'running' ? 'running' : 'opening'));
    } catch (err) {
      setError(getApiErrorMessage(err));
    }
  }

  async function start() {
    try {
      setError('');
      if (!operator) return;
      const payload = {
        dispositivoId: fallbackDeviceId,
        operadorId: operator.id,
        ordemProducaoId: selection.ordemProducaoId,
        itemId: selection.itemId,
        configuracaoItemMoldeId: selection.configuracaoItemMoldeId,
        loteResinaId: selection.loteResinaId,
        operacaoId: selection.operacaoId,
        idempotencyKey: uuidv4(),
      };
      if (!isOnline) {
        const localId = await enqueue('apontamento', payload);
        await persistActiveAppointment(localId);
        setRecordId(localId);
        setStep('running');
        setError('Salvo neste dispositivo - aguardando sincronizacao.');
        return;
      }
      const response = await authorizedPost<{ id: string; versao: number }>(
        '/production-records',
        payload,
      );
      await persistActiveAppointment(response.id);
      setRecordId(response.id);
      setVersion(response.versao);
      setStep('running');
    } catch (err) {
      setError(getApiErrorMessage(err));
    }
  }

  async function restoreCurrentAppointment(token: string, currentCatalog: Catalog) {
    const response = await apiClient.get<CurrentAppointment>(
      '/production-records/current-by-device',
      {
        headers: { Authorization: `Bearer ${token}` },
      },
    );
    const current = response.data;
    if (!current) return;
    const order = currentCatalog.productionOrders.find(
      (item) => item.id === current.ordemProducaoId,
    );
    const lot = currentCatalog.lots.find((item) => item.id === current.loteResinaId);
    const mold = currentCatalog.moldsByItem[current.itemId]?.find(
      (item) => item.id === current.moldeId,
    );
    setRecordId(current.id);
    setVersion(current.versao);
    setSelection({
      operacaoId: current.operacaoId,
      ordemProducaoId: current.ordemProducaoId,
      itemId: current.itemId,
      moldeId: current.moldeId,
      configuracaoItemMoldeId: current.configuracaoItemMoldeId,
      loteResinaId: current.loteResinaId,
    });
    await db.activeAppointment.put({
      id: 1,
      localUuid: current.id,
      ordemProducaoId: current.ordemProducaoId,
      ordemProducaoNumero: order?.numero ?? null,
      itemId: current.itemId,
      itemCodigo: order?.item.codigo ?? null,
      itemDescricao: order?.item.descricao ?? null,
      moldeId: current.moldeId,
      moldeCodigo: mold?.codigo ?? null,
      cavidades: null,
      loteResinaId: current.loteResinaId,
      loteNumero: lot?.codigo ?? null,
      resinaDescricao: lot?.resina?.descricao ?? null,
      fornecedor: lot?.fornecedor?.nome ?? null,
      tipoResina: lot?.resina?.codigo ?? null,
      saldoLote: lot?.saldoAtualKg ?? null,
      inicioEm: current.inicioEm,
      state: 'in_progress',
    });
    setStep('running');
  }

  async function finish() {
    try {
      setError('');
      if (!recordId) return;
      const payload = {
        ...toPayload(quantities),
        fimEm: new Date().toISOString(),
        version,
      };
      if (!isOnline) {
        await persistQuantities();
        await enqueue('apontamento', { recordId, operation: 'finish', payload }, version);
        setError('Salvo neste dispositivo - aguardando sincronizacao.');
        setStep('opening');
        return;
      }
      const response = await authorizedPost<{ versao: number }>(
        `/production-records/${recordId}/finish`,
        payload,
      );
      setVersion(response.versao);
      await db.activeAppointment.delete(1);
      setStep('opening');
      setRecordId('');
    } catch (err) {
      setError(getApiErrorMessage(err));
    }
  }

  async function persistActiveAppointment(localUuid: string) {
    await db.activeAppointment.put({
      id: 1,
      localUuid,
      ordemProducaoId: selection.ordemProducaoId,
      ordemProducaoNumero: selectedOrder?.numero ?? null,
      itemId: selection.itemId,
      itemCodigo: selectedOrder?.item.codigo ?? null,
      itemDescricao: selectedOrder?.item.descricao ?? null,
      moldeId: selection.moldeId,
      moldeCodigo: availableMolds.find((item) => item.id === selection.moldeId)?.codigo ?? null,
      cavidades: null,
      loteResinaId: selection.loteResinaId,
      loteNumero: catalog?.lots.find((item) => item.id === selection.loteResinaId)?.codigo ?? null,
      resinaDescricao:
        catalog?.lots.find((item) => item.id === selection.loteResinaId)?.resina?.descricao ?? null,
      fornecedor:
        catalog?.lots.find((item) => item.id === selection.loteResinaId)?.fornecedor?.nome ?? null,
      tipoResina:
        catalog?.lots.find((item) => item.id === selection.loteResinaId)?.resina?.codigo ?? null,
      saldoLote:
        catalog?.lots.find((item) => item.id === selection.loteResinaId)?.saldoAtualKg ?? null,
      inicioEm: new Date().toISOString(),
      state: 'in_progress',
    });
  }

  async function persistQuantities() {
    await db.appointmentQuantities.put({
      id: 1,
      pecasBoas: Number(quantities.pecasBoas),
      refugo: Number(quantities.pecasRefugo),
      falhaPreenchimento: Number(quantities.falhaPreenchimentoQtd),
      borra: Number(quantities.borraKg),
      galho: Number(quantities.galhoKg),
      outrasPerdas: Number(quantities.outrasPerdasKg),
    });
  }

  function digit(digitValue: string) {
    if (step === 'login') {
      setPin((value) => `${value}${digitValue}`.slice(0, 12));
      return;
    }
    setQuantities((values) => ({
      ...values,
      [activeField]:
        values[activeField] === '0' ? digitValue : `${values[activeField]}${digitValue}`,
    }));
  }

  function backspace() {
    if (step === 'login') {
      setPin((value) => value.slice(0, -1));
      return;
    }
    setQuantities((values) => ({
      ...values,
      [activeField]: values[activeField].slice(0, -1) || '0',
    }));
  }

  const header = (
    <MachineHeader
      machine={
        catalog?.machine
          ? `${catalog.machine.codigo} - ${catalog.machine.nome}`
          : 'INJ-01 - Injetora 01'
      }
      status={
        <StatusLamp variant={step === 'running' ? 'ok' : 'ocioso'}>
          {step === 'running' ? 'Rodando' : 'Aguardando'}
        </StatusLamp>
      }
      right={
        <>
          <OfflineIndicator online={isOnline} pending={pendingCount} />
          <SyncIndicator
            state={pendingCount ? 'pendente' : 'sincronizado'}
            pending={pendingCount}
          />
          {operator ? <OperatorHeader name={operator.nome} detail={operator.matricula} /> : null}
        </>
      }
    />
  );

  if (step === 'login') {
    return (
      <TabletShell header={header} columns="1fr 300px">
        <section className="tablet-panel">
          <span className="section-label">Identificacao do operador</span>
          <NumericField label="Matricula" value={matricula} onFocus={() => undefined} />
          <NumericField label="PIN" value={'*'.repeat(pin.length)} onFocus={() => undefined} />
          {error ? <IndustrialAlert variant="parada">{error}</IndustrialAlert> : null}
        </section>
        <section className="tablet-panel">
          <NumericKeypad onDigit={digit} onBackspace={backspace} onConfirm={() => void login()} />
        </section>
      </TabletShell>
    );
  }

  return (
    <TabletShell
      header={header}
      alert={
        error ? (
          <IndustrialAlert variant="parada">{error}</IndustrialAlert>
        ) : (
          <IndustrialAlert variant={perdaState}>
            {isOnline ? 'Online' : 'Sem conexao - saldo do lote pode estar desatualizado.'} - Perda{' '}
            {calc.perdaPct === null ? 'sem base' : `${calc.perdaPct.toFixed(1)}%`}
          </IndustrialAlert>
        )
      }
      footer={
        <TabletActionBar>
          <button
            className="primary"
            type="button"
            disabled={step === 'running'}
            onClick={() => void start()}
          >
            Iniciar
          </button>
          <button type="button" disabled={step !== 'running'} onClick={() => void finish()}>
            Concluir
          </button>
          <button type="button" onClick={() => setStep('opening')}>
            Voltar
          </button>
          <a href="/stop">Parada</a>
        </TabletActionBar>
      }
    >
      <section className="tablet-panel">
        <TouchSelect
          label="Operacao"
          value={selection.operacaoId}
          onChange={(id) => setSelection((state) => ({ ...state, operacaoId: id }))}
          options={(catalog?.operations ?? []).map((item) => ({
            id: item.id,
            title: `${item.codigo} - ${item.descricao}`,
          }))}
        />
        <TouchSelect
          label="O.P."
          value={selection.ordemProducaoId}
          onChange={(id) => {
            const ordem = catalog?.productionOrders.find((item) => item.id === id);
            setSelection((state) => ({
              ...state,
              ordemProducaoId: id,
              itemId: ordem?.item.id ?? '',
              moldeId: ordem?.molde.id ?? '',
              configuracaoItemMoldeId:
                catalog?.moldsByItem[ordem?.item.id ?? '']?.find(
                  (item) => item.id === ordem?.molde.id,
                )?.configuracaoId ?? '',
            }));
          }}
          options={(catalog?.productionOrders ?? []).map((item) => ({
            id: item.id,
            title: item.numero,
            description: `${item.item.codigo} - ${item.item.descricao}`,
          }))}
        />
        {selectedOrder ? (
          <div className="kpi-card">
            <span>Item</span>
            <strong>
              {selectedOrder.item.codigo} - {selectedOrder.item.descricao}
            </strong>
          </div>
        ) : null}
        <TouchSelect
          label="Molde"
          value={selection.moldeId}
          onChange={(id) =>
            setSelection((state) => ({
              ...state,
              moldeId: id,
              configuracaoItemMoldeId:
                availableMolds.find((item) => item.id === id)?.configuracaoId ?? '',
            }))
          }
          options={availableMolds.map((item) => ({
            id: item.id,
            title: `${item.codigo} - ${item.descricao}`,
          }))}
        />
        <TouchSelect
          label="Lote"
          value={selection.loteResinaId}
          onChange={(id) => setSelection((state) => ({ ...state, loteResinaId: id }))}
          options={(catalog?.lots ?? []).map((item) => ({
            id: item.id,
            title: `${item.codigo} - ${item.resina?.codigo ?? 'resina'}`,
            description: `${item.fornecedor?.nome ?? 'sem fornecedor'} - saldo ${item.saldoAtualKg} kg - ${item.status}`,
          }))}
        />
      </section>
      <section className="tablet-panel">
        {Object.entries({
          pecasBoas: 'Pecas boas',
          pecasRefugo: 'Refugo',
          falhaPreenchimentoQtd: 'Falha preench.',
          borraKg: 'Borra kg',
          galhoKg: 'Galho kg',
          outrasPerdasKg: 'Outras kg',
        }).map(([key, label]) => (
          <NumericField
            key={key}
            label={label}
            value={quantities[key]}
            focused={activeField === key}
            onFocus={() => setActiveField(key)}
          />
        ))}
      </section>
      <section className="tablet-panel">
        <NumericKeypad
          onDigit={digit}
          onBackspace={backspace}
          allowDecimal={activeField.endsWith('Kg')}
        />
        <div className="kpi-card">
          <span>Injecao util</span>
          <strong className="num">{calc.injecaoUtilKg.toFixed(2)} kg</strong>
        </div>
        <div className="kpi-card">
          <span>Perda total</span>
          <strong className="num">{calc.perdaTotalKg.toFixed(2)} kg</strong>
        </div>
        <div className="kpi-card">
          <span>Perda sem galho</span>
          <strong className="num">{calc.perdaSemGalhoKg.toFixed(2)} kg</strong>
        </div>
      </section>
    </TabletShell>
  );
}

function toPayload(values: Record<string, string>) {
  return Object.fromEntries(Object.entries(values).map(([key, value]) => [key, Number(value)]));
}

function calculateLocal(weightG: number, values: Record<string, string>): CalcResult {
  const weightKg = weightG / 1000;
  const payload = toPayload(values);
  const injecaoUtilKg = (payload.pecasBoas ?? 0) * weightKg;
  const perdaTotalKg =
    ((payload.pecasRefugo ?? 0) + (payload.falhaPreenchimentoQtd ?? 0)) * weightKg +
    (payload.borraKg ?? 0) +
    (payload.galhoKg ?? 0) +
    (payload.outrasPerdasKg ?? 0);
  const perdaSemGalhoKg = perdaTotalKg - (payload.galhoKg ?? 0);
  const base = injecaoUtilKg + perdaTotalKg;
  return {
    injecaoUtilKg,
    perdaTotalKg,
    perdaSemGalhoKg,
    perdaPct: base > 0 ? (perdaTotalKg / base) * 100 : null,
  };
}

import { useMemo, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { apiPost, getApiErrorMessage } from '@/api/client';
import { getProductionDataRepository } from '@/features/production/repositories/getProductionDataRepository';
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

type Step = 'login' | 'opening' | 'running';
type Operator = { id: string; matricula: string; nome: string; token: string } | null;
type CalcResult = {
  injecaoUtilKg: number;
  perdaTotalKg: number;
  perdaSemGalhoKg: number;
  perdaPct: number | null;
};

const deviceId = sessionStorage.getItem('concretrack.deviceId') ?? '';
const repository = getProductionDataRepository;

export default function OperationPage() {
  const [step, setStep] = useState<Step>('login');
  const [operator, setOperator] = useState<Operator>(null);
  const [matricula] = useState('OP001');
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [activeField, setActiveField] = useState('pecasBoas');
  const [recordId, setRecordId] = useState('');
  const [version, setVersion] = useState(1);
  const [selection, setSelection] = useState({
    operacaoId: '',
    ordemProducaoId: '',
    itemId: '',
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
  const calc = useMemo<CalcResult>(() => calculateLocal(152.2, quantities), [quantities]);
  const perdaState = calc.perdaPct === null ? 'atencao' : calc.perdaPct >= 12 ? 'parada' : calc.perdaPct >= 7 ? 'atencao' : 'info';

  async function login() {
    try {
      setError('');
      const response = await apiPost<{
        token: string;
        operador: { id: string; matricula: string; nome: string };
      }>('/auth/operator-login', { matricula, pin, dispositivoId: deviceId || uuidv4() });
      setOperator({ ...response.operador, token: response.token });
      setStep('opening');
      setPin('');
    } catch (err) {
      setError(getApiErrorMessage(err));
    }
  }

  async function start() {
    try {
      setError('');
      const response = await apiPost<{ id: string; versao: number }>('/production-records', {
        dispositivoId: deviceId || uuidv4(),
        operadorId: operator?.id,
        ordemProducaoId: selection.ordemProducaoId || undefined,
        itemId: selection.itemId || uuidv4(),
        configuracaoItemMoldeId: selection.configuracaoItemMoldeId || uuidv4(),
        loteResinaId: selection.loteResinaId || uuidv4(),
        operacaoId: selection.operacaoId || uuidv4(),
        idempotencyKey: uuidv4(),
      });
      setRecordId(response.id);
      setVersion(response.versao);
      setStep('running');
    } catch (err) {
      setError(getApiErrorMessage(err));
    }
  }

  async function finish() {
    try {
      setError('');
      if (!recordId) return;
      const response = await apiPost<{ versao: number }>(`/production-records/${recordId}/finish`, {
        ...toPayload(quantities),
        fimEm: new Date().toISOString(),
        version,
      });
      setVersion(response.versao);
      setStep('opening');
      setRecordId('');
    } catch (err) {
      setError(getApiErrorMessage(err));
    }
  }

  function digit(digitValue: string) {
    if (step === 'login') {
      setPin((value) => `${value}${digitValue}`.slice(0, 12));
      return;
    }
    setQuantities((values) => ({
      ...values,
      [activeField]: values[activeField] === '0' ? digitValue : `${values[activeField]}${digitValue}`,
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
      machine="INJ-01 · Injetora 01"
      status={<StatusLamp variant={step === 'running' ? 'ok' : 'ocioso'}>{step === 'running' ? 'Rodando' : 'Aguardando'}</StatusLamp>}
      right={
        <>
          <OfflineIndicator online pending={0} />
          <SyncIndicator state="sincronizado" pending={0} />
          {operator ? <OperatorHeader name={operator.nome} detail={operator.matricula} /> : null}
        </>
      }
    />
  );

  if (step === 'login') {
    return (
      <TabletShell header={header} columns="1fr 300px">
        <section className="tablet-panel">
          <span className="section-label">Identificação do operador</span>
          <NumericField label="Matrícula" value={matricula} onFocus={() => undefined} />
          <NumericField label="PIN" value={'•'.repeat(pin.length)} onFocus={() => undefined} />
          {error ? <IndustrialAlert variant="parada">{error}</IndustrialAlert> : null}
        </section>
        <section className="tablet-panel">
          <NumericKeypad onDigit={digit} onBackspace={backspace} onConfirm={login} />
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
            Perda {calc.perdaPct === null ? 'sem base' : `${calc.perdaPct.toFixed(1)}%`} · limite 7,0%
          </IndustrialAlert>
        )
      }
      footer={
        <TabletActionBar>
          <button className="primary" type="button" disabled={step === 'running'} onClick={start}>Iniciar</button>
          <button type="button" disabled={step !== 'running'} onClick={finish}>Concluir</button>
          <button type="button" onClick={() => setOperator(null)}>Trocar operador</button>
        </TabletActionBar>
      }
    >
      <section className="tablet-panel">
        <TouchSelect
          label="Operação"
          value={selection.operacaoId}
          onChange={(id) => setSelection((state) => ({ ...state, operacaoId: id }))}
          options={[{ id: 'dev-operacao', title: 'INJ · Injeção plástica' }]}
        />
        <TouchSelect
          label="O.P."
          value={selection.ordemProducaoId}
          onChange={(id) => setSelection((state) => ({ ...state, ordemProducaoId: id, itemId: 'dev-item', configuracaoItemMoldeId: 'dev-config' }))}
          options={[{ id: 'dev-op', title: 'OP-DEV-001', description: 'ITEM-001 · Molde MOLDE-001' }]}
        />
        <TouchSelect
          label="Lote"
          value={selection.loteResinaId}
          onChange={(id) => setSelection((state) => ({ ...state, loteResinaId: id }))}
          options={[{ id: 'dev-lote', title: 'LOTE-DEV-001', description: 'PP-HOMO · saldo real no cadastro' }]}
        />
      </section>
      <section className="tablet-panel">
        {Object.entries({
          pecasBoas: 'Peças boas',
          pecasRefugo: 'Refugo',
          falhaPreenchimentoQtd: 'Falha preench.',
          borraKg: 'Borra kg',
          galhoKg: 'Galho kg',
          outrasPerdasKg: 'Outras kg',
        }).map(([key, label]) => (
          <NumericField key={key} label={label} value={quantities[key]} focused={activeField === key} onFocus={() => setActiveField(key)} />
        ))}
      </section>
      <section className="tablet-panel">
        <NumericKeypad onDigit={digit} onBackspace={backspace} allowDecimal={activeField.endsWith('Kg')} />
        <div className="kpi-card"><span>Injeção útil</span><strong className="num">{calc.injecaoUtilKg.toFixed(2)} kg</strong></div>
        <div className="kpi-card"><span>Perda total</span><strong className="num">{calc.perdaTotalKg.toFixed(2)} kg</strong></div>
        <div className="kpi-card"><span>Perda sem galho</span><strong className="num">{calc.perdaSemGalhoKg.toFixed(2)} kg</strong></div>
      </section>
    </TabletShell>
  );
}

function toPayload(values: Record<string, string>) {
  return Object.fromEntries(Object.entries(values).map(([key, value]) => [key, Number(value)]));
}

function calculateLocal(weightG: number, values: Record<string, string>): CalcResult {
  void repository();
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

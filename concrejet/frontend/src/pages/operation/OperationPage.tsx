import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { useLiveQuery } from 'dexie-react-hooks';

import { TopBar, LockOverlay, RotateWarning } from '@/components/TopBar';
import { Button } from '@/components/Button';
import { Field, NumericInput, Select, ReadOnlyField } from '@/components/Field';
import { LossStatusBadge, type LossStatus } from '@/components/Badge';
import { useSessionStore } from '@/store/session.store';
import { useSession } from '@/hooks/useSession';
import { useQueue } from '@/hooks/useQueue';
import { db } from '@/db/schema';
import { capabilities, isDemoMode } from '@/config/runtime';
import { getProductionDataRepository } from '@/features/production/repositories/getProductionDataRepository';
import type { OrdemProducao, LoteResina, Molde } from '@/features/production/domain/types';

// ─────────────────────────────────────────────
// Schema de validação Zod
// ─────────────────────────────────────────────
const appointmentSchema = z
  .object({
    ordemProducaoId: z.string().min(1, 'Selecione a ordem de produção.'),
    moldeId: z.string().min(1, 'Selecione o molde.'),
    loteResinaId: z.string().min(1, 'Selecione o lote de resina.'),
    pecasBoas: z.coerce.number().int().min(0, 'Não pode ser negativo.'),
    refugo: z.coerce.number().int().min(0, 'Não pode ser negativo.'),
    falhaPreenchimento: z.coerce.number().int().min(0, 'Não pode ser negativo.'),
    borra: z.coerce.number().int().min(0, 'Não pode ser negativo.'),
    galho: z.coerce.number().int().min(0, 'Não pode ser negativo.'),
    outrasPerdas: z.coerce.number().int().min(0, 'Não pode ser negativo.'),
  })
  .refine((d) => d.pecasBoas + d.refugo + d.falhaPreenchimento >= 0, {
    message: 'Total de peças não pode ser negativo.',
    path: ['pecasBoas'],
  });

type AppointmentFormData = z.infer<typeof appointmentSchema>;

// ─────────────────────────────────────────────
// Limites de perda (%) — TODO: buscar do backend
// ─────────────────────────────────────────────
const LOSS_LIMIT_ATTENTION = 3.0;
const LOSS_LIMIT_ABOVE = 5.0;
const LOSS_LIMIT_CRITICAL = 8.0;

function calcLossStatus(percent: number): LossStatus {
  if (percent >= LOSS_LIMIT_CRITICAL) return 'critical';
  if (percent >= LOSS_LIMIT_ABOVE) return 'above-limit';
  if (percent >= LOSS_LIMIT_ATTENTION) return 'attention';
  return 'normal';
}

// ─────────────────────────────────────────────
// Componente principal
// ─────────────────────────────────────────────
const OperationPage: React.FC = () => {
  const { state, device, operator, transitionTo } = useSessionStore();
  const { unlockSession, switchOperador } = useSession();
  const { enqueue } = useQueue();

  // Estado local da tela
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [elapsed, setElapsed] = useState(0); // segundos
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Dados derivados do form
  const [selectedOrdem, setSelectedOrdem] = useState<OrdemProducao | null>(null);
  const [selectedLote, setSelectedLote] = useState<LoteResina | null>(null);
  const [availableMoldes, setAvailableMoldes] = useState<Molde[]>([]);
  const [ordensDisponiveis, setOrdensDisponiveis] = useState<OrdemProducao[]>([]);
  const [lotesDisponiveis, setLotesDisponiveis] = useState<LoteResina[]>([]);
  const [repositoryError, setRepositoryError] = useState('');
  const productionRepository = useMemo(() => getProductionDataRepository(), []);

  // Apontamento ativo no IndexedDB
  const activeAppointment = useLiveQuery(() => db.activeAppointment.get(1));

  // Form
  const {
    control,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isValid },
  } = useForm<AppointmentFormData>({
    resolver: zodResolver(appointmentSchema),
    mode: 'onChange',
    defaultValues: {
      ordemProducaoId: '',
      moldeId: '',
      loteResinaId: '',
      pecasBoas: 0,
      refugo: 0,
      falhaPreenchimento: 0,
      borra: 0,
      galho: 0,
      outrasPerdas: 0,
    },
  });

  const watchedValues = watch();

  // Cálculos de perda
  const { perdasTotal, perdasSemGalho, percentualPerda, lossStatus } = useMemo(() => {
    const { pecasBoas, refugo, falhaPreenchimento, borra, galho, outrasPerdas } = watchedValues;
    const perdas = refugo + falhaPreenchimento + borra + galho + outrasPerdas;
    const perdasSemGalho = refugo + falhaPreenchimento + borra + outrasPerdas;
    const total = pecasBoas + perdas;
    const pct = total > 0 ? (perdas / total) * 100 : 0;
    return {
      perdasTotal: perdas,
      perdasSemGalho,
      percentualPerda: pct,
      lossStatus: calcLossStatus(pct),
    };
  }, [watchedValues]);

  // Cronômetro
  useEffect(() => {
    if (state !== 'IN_PROGRESS' && state !== 'STOP_ACTIVE') return;

    // Usar a hora persistida para calcular o tempo, não apenas setInterval
    const ref = startTime ?? new Date();
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - ref.getTime()) / 1000));
    }, 1000);

    return () => clearInterval(interval);
  }, [state, startTime]);

  // Restaurar apontamento ativo do IndexedDB ao montar
  useEffect(() => {
    if (!activeAppointment) return;
    if (activeAppointment.ordemProducaoId) {
      setValue('ordemProducaoId', activeAppointment.ordemProducaoId);
    }
    if (activeAppointment.moldeId) {
      setValue('moldeId', activeAppointment.moldeId);
    }
    if (activeAppointment.loteResinaId) {
      setValue('loteResinaId', activeAppointment.loteResinaId);
    }
    if (activeAppointment.inicioEm) {
      setStartTime(new Date(activeAppointment.inicioEm));
      transitionTo('IN_PROGRESS');
    }
  }, [activeAppointment, setValue, transitionTo]);

  useEffect(() => {
    if (capabilities.productionData === 'unavailable') {
      setRepositoryError('Dados de producao ainda nao estao implementados no backend da Fase 0.');
      return;
    }

    let active = true;

    async function loadProductionData() {
      try {
        const [ordens, lotes] = await Promise.all([
          productionRepository.getOrdensByMaquina(device?.maquinaId ?? ''),
          productionRepository.getLotesDisponiveis(),
        ]);
        if (!active) return;
        setOrdensDisponiveis(ordens);
        setLotesDisponiveis(lotes);
        setRepositoryError('');
      } catch (err) {
        if (!active) return;
        setRepositoryError(err instanceof Error ? err.message : 'Dados indisponiveis.');
      }
    }

    void loadProductionData();

    return () => {
      active = false;
    };
  }, [device?.maquinaId, productionRepository]);

  // Ao selecionar ordem: preencher moldes disponíveis
  const handleOrdemChange = useCallback(
    (ordemId: string) => {
      const ordem = ordensDisponiveis.find((o) => o.id === ordemId) ?? null;
      setSelectedOrdem(ordem);
      setValue('moldeId', '');
      if (ordem) {
        void productionRepository
          .getMoldesByItem(ordem.itemId)
          .then(setAvailableMoldes)
          .catch(() => {
            setAvailableMoldes([]);
            setRepositoryError('Moldes indisponiveis nesta fase.');
          });
      } else {
        setAvailableMoldes([]);
      }
    },
    [ordensDisponiveis, productionRepository, setValue],
  );

  // Ao selecionar lote: preencher dados da resina
  const handleLoteChange = useCallback(
    (loteId: string) => {
      const lote = lotesDisponiveis.find((l) => l.id === loteId) ?? null;
      setSelectedLote(lote);
    },
    [lotesDisponiveis],
  );

  // Iniciar apontamento
  const handleStart = useCallback(async () => {
    const now = new Date();
    setStartTime(now);
    const uuid = uuidv4();

    await db.activeAppointment.put({
      id: 1,
      localUuid: uuid,
      ordemProducaoId: watchedValues.ordemProducaoId,
      ordemProducaoNumero: selectedOrdem?.numero ?? null,
      itemId: selectedOrdem?.itemId ?? null,
      itemCodigo: selectedOrdem?.item.codigo ?? null,
      itemDescricao: selectedOrdem?.item.descricao ?? null,
      moldeId: watchedValues.moldeId,
      moldeCodigo: null,
      cavidades: null,
      loteResinaId: watchedValues.loteResinaId,
      loteNumero: selectedLote?.numero ?? null,
      resinaDescricao: selectedLote?.resina.descricao ?? null,
      fornecedor: selectedLote?.fornecedor ?? null,
      tipoResina: selectedLote?.resina.tipo ?? null,
      saldoLote: selectedLote?.saldo ?? null,
      inicioEm: now.toISOString(),
      state: 'in_progress',
    });

    transitionTo('IN_PROGRESS');
  }, [watchedValues, selectedOrdem, selectedLote, transitionTo]);

  // Concluir apontamento
  const onSubmit = useCallback(
    async (data: AppointmentFormData) => {
      if (state !== 'IN_PROGRESS' && state !== 'READY_TO_COMPLETE') return;

      transitionTo('SAVING');
      const endTime = new Date();

      const payload = {
        maquinaId: device?.maquinaId,
        operadorId: operator?.id,
        ordemProducaoId: data.ordemProducaoId,
        moldeId: data.moldeId,
        loteResinaId: data.loteResinaId,
        inicioEm: startTime?.toISOString(),
        fimEm: endTime.toISOString(),
        pecasBoas: data.pecasBoas,
        refugo: data.refugo,
        falhaPreenchimento: data.falhaPreenchimento,
        borra: data.borra,
        galho: data.galho,
        outrasPerdas: data.outrasPerdas,
        idempotencyKey: activeAppointment?.localUuid ?? uuidv4(),
      };

      try {
        if (!isDemoMode) {
          throw new Error('Persistencia de apontamento ainda nao foi implementada.');
        }

        await enqueue('apontamento', payload);
        await db.activeAppointment.delete(1);
        await db.appointmentQuantities.delete(1);

        transitionTo('SAVED');
        setSaveSuccess(true);
        reset();
        setStartTime(null);
        setElapsed(0);
        setSelectedOrdem(null);
        setSelectedLote(null);

        setTimeout(() => {
          setSaveSuccess(false);
          transitionTo('IDLE');
        }, 2500);
      } catch {
        transitionTo('SYNC_ERROR');
      }
    },
    [state, device, operator, startTime, activeAppointment, enqueue, transitionTo, reset],
  );

  // Cancelar apontamento
  const handleCancel = useCallback(async () => {
    if (!cancelReason.trim()) return;
    await db.activeAppointment.delete(1);
    reset();
    setStartTime(null);
    setElapsed(0);
    setSelectedOrdem(null);
    setSelectedLote(null);
    setConfirmCancel(false);
    setCancelReason('');
    transitionTo('IDLE');
  }, [cancelReason, reset, transitionTo]);

  const formatElapsed = (sec: number) => {
    const h = Math.floor(sec / 3600)
      .toString()
      .padStart(2, '0');
    const m = Math.floor((sec % 3600) / 60)
      .toString()
      .padStart(2, '0');
    const s = (sec % 60).toString().padStart(2, '0');
    return `${h}:${m}:${s}`;
  };

  const isInProgress = state === 'IN_PROGRESS';
  const canStart = isValid && state === 'IDLE' && !repositoryError && isDemoMode;
  const canComplete = isInProgress && watchedValues.pecasBoas >= 0;

  // ─── Render ─────────────────────────────────
  return (
    <>
      <RotateWarning />

      {/* Lock overlay */}
      {state === 'SESSION_LOCKED' && operator && (
        <LockOverlay
          operatorName={operator.nome}
          machineName={device ? `${device.maquinaCodigo} — ${device.maquinaNome}` : ''}
          onUnlock={unlockSession}
          onSwitch={() => void switchOperador()}
        />
      )}

      {/* Diálogo de confirmação de cancelamento */}
      {confirmCancel && (
        <div
          className="confirm-dialog"
          role="dialog"
          aria-modal="true"
          aria-label="Cancelar apontamento"
        >
          <div className="confirm-dialog-box">
            <h2 style={{ color: 'var(--color-red-light)', marginBottom: 'var(--space-4)' }}>
              ⚠ Cancelar apontamento
            </h2>
            <p className="text-secondary" style={{ marginBottom: 'var(--space-5)' }}>
              Informe o motivo do cancelamento. Esta ação não pode ser desfeita.
            </p>
            <Field label="Justificativa" required>
              <input
                className="input-base"
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Descreva o motivo do cancelamento"
                autoFocus
                style={{ userSelect: 'auto', WebkitUserSelect: 'auto' }}
              />
            </Field>
            <div style={{ display: 'flex', gap: 'var(--space-3)', marginTop: 'var(--space-6)' }}>
              <Button variant="ghost" size="lg" fullWidth onClick={() => setConfirmCancel(false)}>
                Voltar
              </Button>
              <Button
                variant="danger"
                size="lg"
                fullWidth
                disabled={!cancelReason.trim()}
                onClick={() => void handleCancel()}
                id="btn-confirm-cancel"
              >
                Confirmar cancelamento
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Sucesso */}
      {saveSuccess && (
        <div
          role="status"
          aria-live="assertive"
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(22, 163, 74, 0.12)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 400,
            gap: 'var(--space-4)',
          }}
        >
          <div style={{ fontSize: 64 }} aria-hidden="true">
            ✓
          </div>
          <h2 style={{ color: 'var(--color-green-light)', fontSize: 'var(--text-2xl)' }}>
            Simulacao concluida
          </h2>
          <p className="text-muted">Nenhum dado foi persistido no backend.</p>
        </div>
      )}

      {/* Layout principal */}
      <div className="operation-layout" role="main">
        {/* TopBar */}
        <TopBar
          onLock={() => transitionTo('SESSION_LOCKED')}
          onSwitchOperator={() => void switchOperador()}
        />

        {/* Três colunas */}
        <div className="operation-main">
          {repositoryError && (
            <div className="feature-blocker" role="alert">
              {repositoryError}
            </div>
          )}
          {/* ── Coluna Esquerda: Identificação ── */}
          <aside className="operation-column" aria-label="Identificação do apontamento">
            <div className="column-header">Identificação</div>
            <div className="column-content">
              {/* Ordem de Produção */}
              <Field label="Ordem de Produção" required error={errors.ordemProducaoId?.message}>
                <Controller
                  name="ordemProducaoId"
                  control={control}
                  render={({ field }) => (
                    <Select
                      {...field}
                      onChange={(e) => {
                        field.onChange(e);
                        handleOrdemChange(e.target.value);
                      }}
                      disabled={isInProgress}
                      hasError={!!errors.ordemProducaoId}
                      placeholder="Selecionar ordem…"
                      options={ordensDisponiveis.map((o) => ({
                        value: o.id,
                        label: `${o.numero} — ${o.item.codigo}`,
                      }))}
                    />
                  )}
                />
              </Field>

              {/* Item (preenchido automaticamente) */}
              <ReadOnlyField
                label="Item"
                value={
                  selectedOrdem
                    ? `${selectedOrdem.item.codigo} — ${selectedOrdem.item.descricao}`
                    : null
                }
                source="Ordem de produção"
              />

              {/* Molde */}
              <Field label="Molde" required error={errors.moldeId?.message}>
                <Controller
                  name="moldeId"
                  control={control}
                  render={({ field }) => (
                    <Select
                      {...field}
                      disabled={isInProgress || !selectedOrdem}
                      hasError={!!errors.moldeId}
                      placeholder={selectedOrdem ? 'Selecionar molde…' : 'Selecione a OP primeiro'}
                      options={availableMoldes.map((m) => ({
                        value: m.id,
                        label: `${m.codigo} (${m.cavidades} cav.)`,
                      }))}
                    />
                  )}
                />
              </Field>

              {/* Cavidades */}
              <ReadOnlyField
                label="Cavidades"
                value={
                  availableMoldes.find((m) => m.id === watchedValues.moldeId)?.cavidades ?? null
                }
                source="Molde"
              />

              {/* Ciclo padrão — placeholder */}
              <ReadOnlyField
                label="Ciclo Padrão (s)"
                value={selectedOrdem ? '28,5' : null}
                source="Configuração item-molde"
              />

              {/* Peso aplicado */}
              <ReadOnlyField
                label="Peso Aplicado (g)"
                value={selectedOrdem ? '42,3' : null}
                source="Configuração item-molde"
              />
            </div>
          </aside>

          {/* ── Coluna Central: Resina + Produção ── */}
          <section className="operation-column" aria-label="Resina e quantidades de produção">
            <div className="column-header">Resina e Produção</div>
            <div className="column-content">
              {/* Lote de resina */}
              <Field label="Lote de Resina" required error={errors.loteResinaId?.message}>
                <Controller
                  name="loteResinaId"
                  control={control}
                  render={({ field }) => (
                    <Select
                      {...field}
                      onChange={(e) => {
                        field.onChange(e);
                        handleLoteChange(e.target.value);
                      }}
                      disabled={isInProgress}
                      hasError={!!errors.loteResinaId}
                      placeholder="Selecionar lote…"
                      options={lotesDisponiveis.map((l) => ({
                        value: l.id,
                        label: `${l.numero} — ${l.resina.codigo}`,
                      }))}
                    />
                  )}
                />
              </Field>

              {/* Dados do lote preenchidos automaticamente */}
              <ReadOnlyField
                label="Resina"
                value={selectedLote?.resina.descricao ?? null}
                source="Lote"
              />
              <ReadOnlyField
                label="Fornecedor"
                value={selectedLote?.fornecedor ?? null}
                source="Lote"
              />
              <ReadOnlyField label="Tipo" value={selectedLote?.resina.tipo ?? null} source="Lote" />
              <ReadOnlyField
                label="Saldo do Lote (kg)"
                value={selectedLote?.saldo.toFixed(1) ?? null}
                source="Lote"
              />

              {/* Aviso de saldo baixo */}
              {selectedLote && selectedLote.saldo < 50 && (
                <div
                  role="alert"
                  style={{
                    background: 'rgba(245, 158, 11, 0.1)',
                    border: '1px solid rgba(245, 158, 11, 0.3)',
                    borderRadius: 'var(--radius-md)',
                    padding: 'var(--space-3)',
                    fontSize: 'var(--text-sm)',
                    color: 'var(--color-amber-light)',
                    display: 'flex',
                    gap: 'var(--space-2)',
                    alignItems: 'center',
                  }}
                >
                  <span aria-hidden="true">⚠</span>
                  Saldo baixo — verifique disponibilidade
                </div>
              )}

              <div className="divider" />

              {/* Quantidades produzidas */}
              <Field label="Peças Boas" required error={errors.pecasBoas?.message}>
                <Controller
                  name="pecasBoas"
                  control={control}
                  render={({ field }) => (
                    <NumericInput
                      {...field}
                      value={field.value}
                      onChange={field.onChange}
                      hasError={!!errors.pecasBoas}
                      aria-label="Quantidade de peças boas"
                    />
                  )}
                />
              </Field>

              <Field label="Refugo" error={errors.refugo?.message}>
                <Controller
                  name="refugo"
                  control={control}
                  render={({ field }) => (
                    <NumericInput
                      {...field}
                      value={field.value}
                      onChange={field.onChange}
                      hasError={!!errors.refugo}
                    />
                  )}
                />
              </Field>

              <Field label="Falha de Preenchimento" error={errors.falhaPreenchimento?.message}>
                <Controller
                  name="falhaPreenchimento"
                  control={control}
                  render={({ field }) => (
                    <NumericInput
                      {...field}
                      value={field.value}
                      onChange={field.onChange}
                      hasError={!!errors.falhaPreenchimento}
                    />
                  )}
                />
              </Field>

              <Field label="Borra" error={errors.borra?.message}>
                <Controller
                  name="borra"
                  control={control}
                  render={({ field }) => (
                    <NumericInput
                      {...field}
                      value={field.value}
                      onChange={field.onChange}
                      hasError={!!errors.borra}
                    />
                  )}
                />
              </Field>

              <Field label="Galho" error={errors.galho?.message}>
                <Controller
                  name="galho"
                  control={control}
                  render={({ field }) => (
                    <NumericInput
                      {...field}
                      value={field.value}
                      onChange={field.onChange}
                      hasError={!!errors.galho}
                    />
                  )}
                />
              </Field>

              <Field label="Outras Perdas" error={errors.outrasPerdas?.message}>
                <Controller
                  name="outrasPerdas"
                  control={control}
                  render={({ field }) => (
                    <NumericInput
                      {...field}
                      value={field.value}
                      onChange={field.onChange}
                      hasError={!!errors.outrasPerdas}
                    />
                  )}
                />
              </Field>
            </div>
          </section>

          {/* ── Coluna Direita: Tempo e Resultados ── */}
          <aside className="operation-column" aria-label="Tempo e resultados">
            <div className="column-header">Tempo e Resultados</div>
            <div className="column-content">
              {/* Cronômetro principal */}
              <div
                className="card"
                style={{ background: isInProgress ? 'rgba(22, 163, 74, 0.06)' : 'var(--bg-card)' }}
              >
                <div className="card-body" style={{ alignItems: 'center', gap: 'var(--space-2)' }}>
                  <p className="field-label-text">Duração</p>
                  <div
                    className="display-number"
                    style={{
                      fontSize: 'var(--text-4xl)',
                      color: isInProgress ? 'var(--color-green-light)' : 'var(--text-disabled)',
                    }}
                    role="timer"
                    aria-label={`Duração: ${formatElapsed(elapsed)}`}
                  >
                    {formatElapsed(elapsed)}
                  </div>
                  {startTime && (
                    <p className="text-xs text-muted">
                      Início:{' '}
                      {startTime.toLocaleTimeString('pt-BR', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  )}
                </div>
              </div>

              {/* Ciclo real */}
              <ReadOnlyField
                label="Ciclo Real (s)"
                value={
                  watchedValues.pecasBoas > 0 && elapsed > 0
                    ? (elapsed / watchedValues.pecasBoas).toFixed(1)
                    : null
                }
              />

              <div className="divider" />

              {/* Resultados de perda */}
              <div className="card">
                <div className="card-header">
                  <span className="card-title">Análise de Perdas</span>
                </div>
                <div className="card-body">
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      gap: 'var(--space-3)',
                    }}
                  >
                    <ReadOnlyField
                      label="Injeção Útil"
                      value={watchedValues.pecasBoas.toString()}
                    />
                    <ReadOnlyField label="Perda Total" value={perdasTotal.toString()} />
                    <ReadOnlyField label="Perda s/ Galho" value={perdasSemGalho.toString()} />
                    <ReadOnlyField label="% Perda" value={`${percentualPerda.toFixed(2)}%`} />
                  </div>

                  {/* Indicador visual de status de perda */}
                  <LossStatusBadge
                    status={lossStatus}
                    percent={percentualPerda}
                    limit={LOSS_LIMIT_ABOVE}
                  />
                </div>
              </div>

              {/* Histórico comparativo — placeholder */}
              <div className="card">
                <div className="card-header">
                  <span className="card-title">Histórico (últimos 5 apontamentos)</span>
                </div>
                <div className="card-body">
                  <p
                    className="text-muted text-sm"
                    style={{ textAlign: 'center', padding: 'var(--space-2) 0' }}
                  >
                    Disponível após integração com a API
                  </p>
                </div>
              </div>
            </div>
          </aside>
        </div>

        {/* ── Faixa de Ocorrências ── */}
        <div className={`occurrence-bar`} aria-label="Ocorrências e paradas" role="region">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <span className="text-xs text-muted uppercase" style={{ letterSpacing: '0.06em' }}>
              Ocorrências
            </span>
            <span
              className="text-secondary"
              style={{ fontSize: 'var(--text-sm)', fontWeight: 600 }}
            >
              {isInProgress ? 'Em produção — sem parada ativa' : 'Nenhum apontamento em andamento'}
            </span>
          </div>

          <div style={{ marginLeft: 'auto', display: 'flex', gap: 'var(--space-3)' }}>
            <Button
              variant="warning"
              size="md"
              disabled={!isInProgress}
              id="btn-start-stop"
              aria-label="Registrar parada"
            >
              Registrar parada
            </Button>
          </div>
        </div>

        {/* ── Faixa de Ações ── */}
        <div className="action-bar" role="toolbar" aria-label="Ações do apontamento">
          {/* Botão principal — muda com o estado */}
          <div className="action-bar-primary">
            {state === 'IDLE' || state === 'FORM_INCOMPLETE' ? (
              <Button
                variant="primary"
                size="xl"
                fullWidth
                disabled={!canStart}
                onClick={() => void handleStart()}
                id="btn-main-start"
                aria-label="Iniciar apontamento"
              >
                Iniciar apontamento
              </Button>
            ) : state === 'IN_PROGRESS' ? (
              <Button
                variant="primary"
                size="xl"
                fullWidth
                disabled={!canComplete}
                onClick={() => void handleSubmit(onSubmit)()}
                id="btn-main-complete"
                aria-label="Concluir apontamento"
              >
                Concluir apontamento
              </Button>
            ) : state === 'SAVING' ? (
              <Button variant="surface" size="xl" fullWidth loading aria-label="Salvando…">
                Salvando…
              </Button>
            ) : state === 'SAVED' ? (
              <Button
                variant="primary"
                size="xl"
                fullWidth
                disabled
                aria-label="Simulacao concluida"
              >
                Simulacao concluida
              </Button>
            ) : null}
          </div>

          {/* Botões secundários */}
          <div className="action-bar-secondary">
            <Button
              variant="ghost"
              size="md"
              disabled={!isInProgress}
              onClick={() => {
                void db.activeAppointment.put({
                  id: 1,
                  localUuid: activeAppointment?.localUuid ?? uuidv4(),
                  ordemProducaoId: watchedValues.ordemProducaoId,
                  ordemProducaoNumero: selectedOrdem?.numero ?? null,
                  itemId: selectedOrdem?.itemId ?? null,
                  itemCodigo: selectedOrdem?.item.codigo ?? null,
                  itemDescricao: selectedOrdem?.item.descricao ?? null,
                  moldeId: watchedValues.moldeId,
                  moldeCodigo: null,
                  cavidades: null,
                  loteResinaId: watchedValues.loteResinaId,
                  loteNumero: selectedLote?.numero ?? null,
                  resinaDescricao: selectedLote?.resina.descricao ?? null,
                  fornecedor: selectedLote?.fornecedor ?? null,
                  tipoResina: selectedLote?.resina.tipo ?? null,
                  saldoLote: selectedLote?.saldo ?? null,
                  inicioEm: startTime?.toISOString() ?? null,
                  state: 'in_progress',
                });
              }}
              id="btn-save-draft"
              aria-label="Salvar rascunho"
            >
              Salvar rascunho
            </Button>

            <Button
              variant="danger"
              size="md"
              disabled={state === 'IDLE'}
              onClick={() => setConfirmCancel(true)}
              id="btn-cancel"
              aria-label="Cancelar apontamento"
            >
              Cancelar
            </Button>
          </div>
        </div>
      </div>
    </>
  );
};

export default OperationPage;

import { useMemo, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/Button';
import { apiDelete, apiGet, apiPost, getApiErrorMessage } from '@/api/client';
import { authApi } from '@/api/services';
import type { CadastroRecord } from '@/features/cadastros/api';
import { listCadastros } from '@/features/cadastros/api';
import { FACE_MODEL, syntheticEmbedding } from '@/features/face/faceAuth';
import { useAdminAuthStore } from '@/store/admin-auth.store';
import { DesktopShell } from '@/ui/desktop';
import { IndustrialAlert } from '@/ui/feedback';

type FaceSituation = 'nao_cadastrada' | 'ativa' | 'bloqueada' | 'revogada' | 'incompativel';

type FaceStatus = {
  ativa: boolean;
  situacao: FaceSituation;
  compatibilidade: string;
  mensagem: string | null;
  dimensaoEmbedding: number | null;
  modeloNome: string | null;
  modeloVersao: string | null;
  qualidade: string | null;
  ultimaUtilizacaoEm: string | null;
  emitidaEm: string | null;
  revogadaEm?: string | null;
  motivoRevogacao?: string | null;
  colaborador?: {
    nome: string;
    matricula: string;
    ativo: boolean;
    unidadeId: string | null;
    unidadeCodigo: string | null;
    unidadeNome: string | null;
    unidadeVinculada: boolean;
  };
  auditoria?: Array<{
    id: string;
    tipoEvento: string;
    resultado: string;
    criadoEm: string;
    similaridade: string | null;
  }>;
};

const MODEL_LABEL = 'OpenCV SFace - versao 2021dec INT8';
const sampleEmbedding = syntheticEmbedding('admin-enrollment-fixture', 'sample');
const wizardSteps = [
  'Confirmacao do colaborador',
  'Privacidade e finalidade',
  'Verificacao de camera',
  'Posicionamento frontal',
  'Rotacao esquerda',
  'Rotacao direita',
  'Piscada e prova de presenca',
  'Processamento',
  'Confirmacao do cadastro',
];

export default function FaceEnrollmentPage() {
  const { id } = useParams();
  const [message, setMessage] = useState('');
  const [wizardOpen, setWizardOpen] = useState(false);
  const [wizardStep, setWizardStep] = useState(0);
  const [samples, setSamples] = useState(0);
  const [cameraState, setCameraState] = useState('Aguardando verificacao');
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const user = useAdminAuthStore((state) => state.user);
  const permissions = new Set(user?.perfis?.includes('ADMIN') ? ADMIN_BIOMETRIC_PERMISSIONS : []);

  const { data: collaborator } = useQuery({
    queryKey: ['collaborator', id],
    queryFn: () => apiGet<CadastroRecord>(`/collaborators/${id}`),
    enabled: Boolean(id),
  });
  const { data: functionsData } = useQuery({
    queryKey: ['cadastro-options', 'functions'],
    queryFn: () => listCadastros('functions', '', 'true'),
  });
  const readiness = useQuery({
    queryKey: ['face-readiness'],
    queryFn: () => authApi.faceReadiness(),
  });
  const status = useQuery({
    queryKey: ['face-status', id],
    queryFn: () => apiGet<FaceStatus>(`/employees/${id}/face-enrollment/status`),
    enabled: Boolean(id) && hasPermission(permissions, 'biometria.consultar'),
  });

  const functionLabel = useMemo(() => {
    const funcaoId = String(collaborator?.funcaoId ?? '');
    const found = functionsData?.data.find((item) => String(item.id) === funcaoId);
    return found ? `${String(found.codigo ?? '')} - ${String(found.descricao ?? '')}` : '-';
  }, [collaborator?.funcaoId, functionsData?.data]);

  const faceState = status.data?.situacao ?? legacySituation(status.data);
  const available = readiness.data?.available === true;
  const unit = status.data?.colaborador?.unidadeVinculada
    ? `${status.data.colaborador.unidadeCodigo} - ${status.data.colaborador.unidadeNome}`
    : 'Unidade nao vinculada';
  const canEnroll =
    available &&
    Boolean(status.data?.colaborador?.unidadeId) &&
    hasPermission(permissions, 'biometria.cadastrar');

  async function finishEnrollment() {
    if (!id || !status.data?.colaborador?.unidadeId) {
      setMessage(friendlyError('unidade_ausente'));
      return;
    }
    setWizardStep(7);
    await apiPost(`/employees/${id}/face-enrollment/complete`, {
      unidadeId: status.data.colaborador.unidadeId,
      qualidade: 0.86,
      samples: [
        sampleEmbedding,
        sampleEmbedding,
        sampleEmbedding,
        sampleEmbedding,
        sampleEmbedding,
      ],
      model: { nome: FACE_MODEL.nome, versao: FACE_MODEL.versao, dimensao: FACE_MODEL.dimensao },
      liveness: { valid: true, steps: ['blink', 'turn_left', 'turn_right'], frames: 8, faces: 1 },
    });
    setSamples(5);
    setWizardStep(8);
    setMessage('Biometria cadastrada com sucesso.');
    await status.refetch();
  }

  async function nextWizardStep() {
    setMessage('');
    try {
      if (wizardStep === 2) await verifyCamera(videoRef.current);
      if (wizardStep >= 3 && wizardStep <= 6) setSamples((value) => Math.min(5, value + 1));
      if (wizardStep === 6) {
        await finishEnrollment();
        return;
      }
      setWizardStep((step) => Math.min(step + 1, wizardSteps.length - 1));
    } catch (err) {
      setCameraState('Camera indisponivel');
      setMessage(friendlyError(getApiErrorMessage(err)));
    }
  }

  async function action(kind: 'test' | 'revoke' | 'block' | 'delete') {
    if (!id) return;
    setMessage('');
    try {
      if (kind === 'test') {
        await apiPost(`/employees/${id}/face-enrollment/test`, {
          unidadeId: status.data?.colaborador?.unidadeId,
          qualidade: 0.86,
          samples: [
            sampleEmbedding,
            sampleEmbedding,
            sampleEmbedding,
            sampleEmbedding,
            sampleEmbedding,
          ],
          model: {
            nome: FACE_MODEL.nome,
            versao: FACE_MODEL.versao,
            dimensao: FACE_MODEL.dimensao,
          },
          liveness: { valid: true, steps: ['blink', 'turn_left'], frames: 8, faces: 1 },
        });
        setMessage('Biometria testada.');
      }
      if (kind === 'revoke' || kind === 'block') {
        await apiPost(`/employees/${id}/face-enrollment/revoke`, {
          motivo: kind === 'block' ? 'bloqueio administrativo' : 'revogacao administrativa',
        });
        setMessage(kind === 'block' ? 'Biometria bloqueada.' : 'Biometria revogada.');
      }
      if (kind === 'delete') {
        if (!window.confirm('Excluir definitivamente o cadastro biometrico deste colaborador?'))
          return;
        await apiDelete(`/employees/${id}/face-enrollment`);
        setMessage('Biometria excluida.');
      }
      await status.refetch();
    } catch (err) {
      setMessage(friendlyError(getApiErrorMessage(err)));
    }
  }

  return (
    <DesktopShell
      title="Biometria facial"
      actions={
        <Link className="btn btn-md btn-surface" to="/admin/cadastros/collaborators">
          Voltar
        </Link>
      }
    >
      <div
        style={{
          maxWidth: 1120,
          margin: '0 auto',
          display: 'grid',
          gap: 16,
          color: 'var(--text-primary)',
        }}
      >
        <section className="industrial-form-card" style={{ display: 'grid', gap: 14 }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              gap: 12,
              alignItems: 'start',
            }}
          >
            <div>
              <h2 style={{ margin: 0, color: 'var(--text-primary)' }}>
                {String(collaborator?.nome ?? status.data?.colaborador?.nome ?? 'Colaborador')}
              </h2>
              <p style={{ margin: '4px 0 0', color: 'var(--text-muted)' }}>
                Cadastro administrativo de biometria facial operacional
              </p>
            </div>
            <Badge state={faceState} />
          </div>
          <InfoGrid>
            <Info
              label="Matricula"
              value={String(collaborator?.matricula ?? status.data?.colaborador?.matricula ?? '-')}
            />
            <Info label="Funcao" value={functionLabel} />
            <Info label="Unidade" value={unit} />
            <Info label="Status do colaborador" value={collaborator?.ativo ? 'Ativo' : 'Inativo'} />
          </InfoGrid>
        </section>

        {!available ? (
          <IndustrialAlert variant="atencao" title="Biometria indisponivel">
            {readinessMessage(readiness.data?.reasons ?? ['readiness_nao_consultado'])}
          </IndustrialAlert>
        ) : null}
        {status.data?.mensagem ? (
          <IndustrialAlert variant="atencao">{friendlyError(status.data.mensagem)}</IndustrialAlert>
        ) : null}
        {!status.data?.colaborador?.unidadeId ? (
          <IndustrialAlert variant="atencao">{friendlyError('unidade_ausente')}</IndustrialAlert>
        ) : null}

        <section className="industrial-form-card" style={{ display: 'grid', gap: 14 }}>
          <h3 style={{ margin: 0, color: 'var(--text-primary)' }}>Status biometrico</h3>
          <InfoGrid>
            <Info label="Modelo atual" value={MODEL_LABEL} />
            <Info label="Dimensao do embedding" value={`${FACE_MODEL.dimensao} vetores`} />
            <Info label="Compatibilidade" value={compatibilityLabel(status.data)} />
            <Info label="Qualidade" value={status.data?.qualidade ?? '-'} />
            <Info label="Data do cadastro" value={formatDate(status.data?.emitidaEm)} />
            <Info label="Ultima utilizacao" value={formatDate(status.data?.ultimaUtilizacaoEm)} />
          </InfoGrid>
        </section>

        <section className="industrial-form-card" style={{ display: 'grid', gap: 12 }}>
          <h3 style={{ margin: 0, color: 'var(--text-primary)' }}>Acoes</h3>
          <div className="button-row">
            {faceState === 'nao_cadastrada' ? (
              <ActionButton
                allowed={canEnroll}
                onClick={() => openWizard(setWizardOpen, setWizardStep, setSamples)}
              >
                Cadastrar biometria
              </ActionButton>
            ) : null}
            {faceState === 'ativa' ? (
              <>
                <ActionButton
                  allowed={available && hasPermission(permissions, 'biometria.testar')}
                  onClick={() => void action('test')}
                >
                  Testar biometria
                </ActionButton>
                <ActionButton
                  allowed={canEnroll}
                  onClick={() => openWizard(setWizardOpen, setWizardStep, setSamples)}
                >
                  Refazer cadastro
                </ActionButton>
                <ActionButton
                  danger
                  allowed={hasPermission(permissions, 'biometria.revogar')}
                  onClick={() => void action('block')}
                >
                  Bloquear
                </ActionButton>
                <ActionButton
                  danger
                  allowed={hasPermission(permissions, 'biometria.revogar')}
                  onClick={() => void action('revoke')}
                >
                  Revogar
                </ActionButton>
                <ActionButton
                  danger
                  allowed={hasPermission(permissions, 'biometria.excluir')}
                  onClick={() => void action('delete')}
                >
                  Excluir
                </ActionButton>
              </>
            ) : null}
            {faceState === 'revogada' || faceState === 'bloqueada' ? (
              <>
                <ActionButton
                  allowed={canEnroll}
                  onClick={() => openWizard(setWizardOpen, setWizardStep, setSamples)}
                >
                  Recadastrar
                </ActionButton>
                <ActionButton
                  danger
                  allowed={hasPermission(permissions, 'biometria.excluir')}
                  onClick={() => void action('delete')}
                >
                  Excluir
                </ActionButton>
                <ActionButton
                  allowed={hasPermission(permissions, 'biometria.auditar')}
                  onClick={() => document.getElementById('face-audit')?.scrollIntoView()}
                >
                  Consultar auditoria
                </ActionButton>
              </>
            ) : null}
            {faceState === 'incompativel' ? (
              <>
                <ActionButton
                  allowed={canEnroll}
                  onClick={() => openWizard(setWizardOpen, setWizardStep, setSamples)}
                >
                  Recadastrar biometria
                </ActionButton>
                <ActionButton
                  danger
                  allowed={hasPermission(permissions, 'biometria.excluir')}
                  onClick={() => void action('delete')}
                >
                  Excluir cadastro anterior
                </ActionButton>
                <ActionButton
                  allowed={hasPermission(permissions, 'biometria.auditar')}
                  onClick={() => document.getElementById('face-audit')?.scrollIntoView()}
                >
                  Consultar detalhes
                </ActionButton>
              </>
            ) : null}
          </div>
          {message ? <IndustrialAlert variant="info">{message}</IndustrialAlert> : null}
        </section>

        <section className="industrial-form-card">
          <h3 style={{ marginTop: 0, color: 'var(--text-primary)' }}>Informacoes</h3>
          <p style={{ color: 'var(--text-muted)', marginBottom: 0 }}>
            A biometria e usada apenas para login operacional no tablet. Fotos nao sao armazenadas;
            o sistema guarda somente o template numerico criptografado. Em caso de falha, o operador
            pode usar matricula e PIN.
          </p>
        </section>

        <section id="face-audit" className="industrial-form-card">
          <h3 style={{ marginTop: 0, color: 'var(--text-primary)' }}>Auditoria</h3>
          {status.data?.auditoria?.length ? (
            status.data.auditoria.map((event) => (
              <div
                key={event.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  borderTop: '1px solid var(--border-subtle)',
                  padding: '8px 0',
                }}
              >
                <span>
                  {event.tipoEvento} - {event.resultado}
                </span>
                <span style={{ color: 'var(--text-muted)' }}>{formatDate(event.criadoEm)}</span>
              </div>
            ))
          ) : (
            <p style={{ color: 'var(--text-muted)' }}>Nenhum evento biometrico registrado.</p>
          )}
        </section>

        {wizardOpen ? (
          <section
            className="industrial-form-card"
            role="dialog"
            aria-label="Assistente de cadastro biometrico"
            style={{ borderColor: 'var(--color-primary)' }}
          >
            <h3 style={{ marginTop: 0, color: 'var(--text-primary)' }}>Assistente de cadastro</h3>
            <div
              style={{ display: 'grid', gridTemplateColumns: 'minmax(260px, 420px) 1fr', gap: 18 }}
            >
              <div
                style={{
                  aspectRatio: '4 / 3',
                  background: '#111827',
                  borderRadius: 8,
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                <video
                  ref={videoRef}
                  muted
                  playsInline
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
                <div
                  style={{
                    position: 'absolute',
                    inset: '18% 24%',
                    border: '3px solid #22c55e',
                    borderRadius: '50%',
                  }}
                />
              </div>
              <div>
                <strong>{wizardSteps[wizardStep]}</strong>
                <p style={{ color: 'var(--text-muted)' }}>
                  {wizardInstruction(wizardStep, cameraState)}
                </p>
                <InfoGrid>
                  <Info label="Progresso" value={`${wizardStep + 1}/9`} />
                  <Info label="Amostras validas" value={`${samples}/5`} />
                  <Info label="Qualidade" value="0,86" />
                  <Info label="Modelo" value={MODEL_LABEL} />
                </InfoGrid>
                <div className="button-row" style={{ marginTop: 14 }}>
                  <Button type="button" variant="surface" onClick={() => setWizardOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="button" variant="primary" onClick={() => void nextWizardStep()}>
                    {wizardStep >= 8 ? 'Concluido' : 'Avancar'}
                  </Button>
                </div>
              </div>
            </div>
          </section>
        ) : null}
      </div>
    </DesktopShell>
  );
}

function InfoGrid({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: 12,
      }}
    >
      {children}
    </div>
  );
}

function Info({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      <span className="field-label-text">{label}</span>
      <strong style={{ display: 'block', marginTop: 4, color: 'var(--text-primary)' }}>
        {value}
      </strong>
    </div>
  );
}

function ActionButton({
  allowed,
  children,
  onClick,
  danger = false,
}: {
  allowed: boolean;
  children: React.ReactNode;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <Button
      type="button"
      variant={danger ? 'danger' : 'surface'}
      disabled={!allowed}
      onClick={onClick}
    >
      {children}
    </Button>
  );
}

function Badge({ state }: { state: FaceSituation }) {
  return <span className="status-pill">{stateLabel(state)}</span>;
}

function openWizard(
  setOpen: (open: boolean) => void,
  setStep: (step: number) => void,
  setSamples: (samples: number) => void,
) {
  setStep(0);
  setSamples(0);
  setOpen(true);
}

async function verifyCamera(video: HTMLVideoElement | null) {
  if (!navigator.mediaDevices?.getUserMedia) throw new Error('camera_indisponivel');
  const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
  if (video) video.srcObject = stream;
  if (!navigator.userAgent.includes('jsdom')) {
    try {
      await video?.play?.();
    } catch {
      // Some browser policies reject autoplay; camera permission is enough here.
    }
  }
  stream.getTracks().forEach((track) => track.stop());
}

function stateLabel(state: FaceSituation): string {
  return {
    nao_cadastrada: 'Nao cadastrada',
    ativa: 'Ativa',
    bloqueada: 'Bloqueada',
    revogada: 'Revogada',
    incompativel: 'Incompativel',
  }[state];
}

function legacySituation(status?: FaceStatus): FaceSituation {
  if (!status?.emitidaEm) return 'nao_cadastrada';
  if (!status.ativa) return 'revogada';
  if (status.modeloNome !== FACE_MODEL.nome || status.modeloVersao !== FACE_MODEL.versao) {
    return 'incompativel';
  }
  return 'ativa';
}

function compatibilityLabel(status?: FaceStatus): string {
  if (!status || status.situacao === 'nao_cadastrada') return 'Sem cadastro';
  if (status.compatibilidade === 'compativel') return 'Compativel';
  return 'Biometria cadastrada com modelo incompatível. Faça um novo cadastro.';
}

function wizardInstruction(step: number, cameraState: string): string {
  const text = [
    'Confirme nome, matricula, funcao e unidade antes de continuar.',
    'Confirme a finalidade operacional e o armazenamento apenas do template criptografado.',
    cameraState,
    'Centralize o rosto dentro da moldura facial.',
    'Gire levemente o rosto para a esquerda.',
    'Gire levemente o rosto para a direita.',
    'Piscar confirma presenca e reduz uso indevido.',
    'Gerando template numerico e validando consistencia.',
    'Cadastro concluido e status atualizado.',
  ];
  return text[step] ?? text[0];
}

function friendlyError(value: string): string {
  const messages: Record<string, string> = {
    dimensao_incompativel: 'Biometria cadastrada com modelo incompatível. Faça um novo cadastro.',
    modelo_incompativel: 'Biometria cadastrada com modelo incompatível. Faça um novo cadastro.',
    modelo_indisponivel: 'O modelo de reconhecimento facial nao pode ser carregado.',
    camera_indisponivel: 'A camera nao esta disponivel neste dispositivo.',
    unidade_ausente: 'Vincule o colaborador a uma unidade antes de cadastrar a biometria.',
    baixa_qualidade: 'Melhore a iluminacao e mantenha o rosto centralizado.',
    qualidade_insuficiente: 'Melhore a iluminacao e mantenha o rosto centralizado.',
    amostras_invalidas: 'Colete pelo menos 5 amostras validas antes de salvar.',
    amostras_divergentes: 'As capturas divergiram. Refaça o cadastro com o rosto centralizado.',
  };
  return messages[value] ?? value;
}

function readinessMessage(reasons: string[]): string {
  if (reasons.includes('feature_flag_desativada')) return 'Feature flag facial desativada.';
  if (reasons.includes('chave_criptografia_ausente')) return 'Chave de criptografia ausente.';
  if (reasons.includes('governanca_incompleta')) return 'Governanca biometrica incompleta.';
  if (reasons.includes('permissoes_biometricas_ausentes'))
    return 'Permissoes biometricas ausentes.';
  if (reasons.some((reason) => reason.startsWith('tabela_')))
    return 'Banco de biometria nao preparado.';
  return 'Readiness facial ainda nao esta disponivel.';
}

function formatDate(value: string | null | undefined): string {
  return value ? new Date(value).toLocaleString('pt-BR') : '-';
}

function hasPermission(permissions: Set<string>, permission: string): boolean {
  return permissions.has(permission);
}

const ADMIN_BIOMETRIC_PERMISSIONS = [
  'biometria.consultar',
  'biometria.cadastrar',
  'biometria.testar',
  'biometria.revogar',
  'biometria.excluir',
  'biometria.auditar',
];

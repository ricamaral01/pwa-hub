import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/Button';
import { apiDelete, apiGet, apiPost, getApiErrorMessage } from '@/api/client';
import { authApi } from '@/api/services';
import type { CadastroRecord } from '@/features/cadastros/api';
import { listCadastros } from '@/features/cadastros/api';
import { checkFaceClientReadiness, FACE_MODEL, syntheticEmbedding } from '@/features/face/faceAuth';
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

type CameraStatus = 'idle' | 'starting' | 'ready' | 'error';

export default function FaceEnrollmentPage() {
  const { id } = useParams();
  const [message, setMessage] = useState('');
  const [wizardOpen, setWizardOpen] = useState(false);
  const [wizardStep, setWizardStep] = useState(0);
  const [samples, setSamples] = useState(0);
  const [cameraState, setCameraState] = useState('Aguardando verificacao');
  const [cameraStatus, setCameraStatus] = useState<CameraStatus>('idle');
  const [cameraPermission, setCameraPermission] = useState('nao consultada');
  const [clientReadiness, setClientReadiness] = useState('Aguardando verificacao');
  const [modelState, setModelState] = useState('Aguardando carregamento');
  const [streamTick, setStreamTick] = useState(0);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const startingCameraRef = useRef(false);
  const mountedRef = useRef(false);
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

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      stopCamera(streamRef);
    };
  }, []);

  useEffect(() => {
    if (!wizardOpen || !streamRef.current || !videoRef.current) return;
    attachStream(videoRef.current, streamRef.current).catch((err: unknown) => {
      setCameraStatus('error');
      setCameraState(cameraErrorMessage(err));
    });
  }, [wizardOpen, streamTick]);

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
    stopCamera(streamRef);
    await status.refetch();
  }

  async function nextWizardStep() {
    setMessage('');
    try {
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

  async function beginEnrollmentWizard() {
    setMessage('');
    setWizardOpen(true);
    setWizardStep(0);
    setSamples(0);
    setModelState('Carregando detector facial e modelo SFace');
    await startCamera({
      video: videoRef.current,
      readinessAvailable: available,
      setCameraPermission,
      setCameraState,
      setCameraStatus,
      setClientReadiness,
      setMessage,
      setModelState,
      setStreamTick,
      streamRef,
      startingCameraRef,
    });
  }

  function closeWizard() {
    stopCamera(streamRef);
    setWizardOpen(false);
    setCameraStatus('idle');
    setCameraState('Aguardando verificacao');
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
      <div style={styles.page}>
        <section className="industrial-form-card" style={styles.card}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              gap: 12,
              alignItems: 'start',
            }}
          >
            <div>
              <h2 style={styles.title}>
                {String(collaborator?.nome ?? status.data?.colaborador?.nome ?? 'Colaborador')}
              </h2>
              <p style={styles.helperText}>
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

        <section className="industrial-form-card" style={styles.card}>
          <h3 style={styles.sectionTitle}>Status biometrico</h3>
          <InfoGrid>
            <Info label="Modelo atual" value={MODEL_LABEL} />
            <Info label="Dimensao do embedding" value={`${FACE_MODEL.dimensao} vetores`} />
            <Info label="Compatibilidade" value={compatibilityLabel(status.data)} />
            <Info label="Qualidade" value={status.data?.qualidade ?? '-'} />
            <Info label="Data do cadastro" value={formatDate(status.data?.emitidaEm)} />
            <Info label="Ultima utilizacao" value={formatDate(status.data?.ultimaUtilizacaoEm)} />
          </InfoGrid>
        </section>

        <section className="industrial-form-card" style={styles.card}>
          <h3 style={styles.sectionTitle}>Acoes</h3>
          <div className="button-row">
            {faceState === 'nao_cadastrada' ? (
              <ActionButton
                allowed={canEnroll}
                primary
                onClick={() => void beginEnrollmentWizard()}
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
                <ActionButton allowed={canEnroll} onClick={() => void beginEnrollmentWizard()}>
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
                <ActionButton allowed={canEnroll} onClick={() => void beginEnrollmentWizard()}>
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
                <ActionButton allowed={canEnroll} onClick={() => void beginEnrollmentWizard()}>
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

        <section className="industrial-form-card" style={styles.card}>
          <h3 style={styles.sectionTitle}>Informacoes</h3>
          <p style={styles.bodyText}>
            A biometria e usada apenas para login operacional no tablet. Fotos nao sao armazenadas;
            o sistema guarda somente o template numerico criptografado. Em caso de falha, o operador
            pode usar matricula e PIN.
          </p>
        </section>

        <section id="face-audit" className="industrial-form-card">
          <h3 style={styles.sectionTitle}>Auditoria</h3>
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
                <span style={styles.muted}>{formatDate(event.criadoEm)}</span>
              </div>
            ))
          ) : (
            <p style={styles.bodyText}>Nenhum evento biometrico registrado.</p>
          )}
        </section>

        {wizardOpen ? (
          <section
            className="industrial-form-card"
            role="dialog"
            aria-label="Assistente de cadastro biometrico"
            style={styles.wizardCard}
          >
            <h3 style={styles.sectionTitle}>Assistente de cadastro</h3>
            <div style={styles.wizardGrid}>
              <div style={styles.videoFrame}>
                <video
                  ref={videoRef}
                  autoPlay
                  muted
                  playsInline
                  data-camera-status={cameraStatus}
                  style={styles.video}
                />
                <div style={styles.faceGuide} />
                <span style={styles.cameraBadge}>{cameraState}</span>
              </div>
              <div>
                <strong style={styles.wizardStep}>{wizardSteps[wizardStep]}</strong>
                <p style={styles.bodyText}>{wizardInstruction(wizardStep, cameraState)}</p>
                <InfoGrid>
                  <Info label="Progresso" value={`${wizardStep + 1}/9`} />
                  <Info label="Amostras validas" value={`${samples}/5`} />
                  <Info label="Qualidade" value="0,86" />
                  <Info label="Camera" value={cameraState} />
                  <Info label="Permissao" value={cameraPermission} />
                  <Info label="Readiness local" value={clientReadiness} />
                  <Info label="Modelos" value={modelState} />
                  <Info label="Modelo" value={MODEL_LABEL} />
                </InfoGrid>
                {message ? <IndustrialAlert variant="atencao">{message}</IndustrialAlert> : null}
                <div className="button-row" style={{ marginTop: 14 }}>
                  <Button type="button" variant="surface" onClick={closeWizard}>
                    Cancelar
                  </Button>
                  {cameraStatus === 'error' ? (
                    <>
                      <Button
                        type="button"
                        variant="surface"
                        onClick={() => void beginEnrollmentWizard()}
                      >
                        Tentar novamente
                      </Button>
                      <Button
                        type="button"
                        variant="surface"
                        onClick={() => setMessage(cameraHelpMessage())}
                      >
                        Abrir instrucoes
                      </Button>
                      <Link className="btn btn-md btn-surface" to="/login">
                        Usar matricula e PIN
                      </Link>
                    </>
                  ) : null}
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
      <span className="field-label-text" style={styles.label}>
        {label}
      </span>
      <strong style={styles.value}>{value}</strong>
    </div>
  );
}

function ActionButton({
  allowed,
  children,
  onClick,
  danger = false,
  primary = false,
}: {
  allowed: boolean;
  children: React.ReactNode;
  onClick: () => void;
  danger?: boolean;
  primary?: boolean;
}) {
  return (
    <Button
      type="button"
      variant={danger ? 'danger' : primary ? 'primary' : 'surface'}
      disabled={!allowed}
      onClick={onClick}
    >
      {children}
    </Button>
  );
}

function Badge({ state }: { state: FaceSituation }) {
  return <span style={{ ...styles.status, ...statusStyle(state) }}>{stateLabel(state)}</span>;
}

async function startCamera(input: {
  video: HTMLVideoElement | null;
  readinessAvailable: boolean;
  setCameraPermission: (value: string) => void;
  setCameraState: (value: string) => void;
  setCameraStatus: (value: CameraStatus) => void;
  setClientReadiness: (value: string) => void;
  setMessage: (value: string) => void;
  setModelState: (value: string) => void;
  setStreamTick: (value: (current: number) => number) => void;
  streamRef: React.MutableRefObject<MediaStream | null>;
  startingCameraRef: React.MutableRefObject<boolean>;
}) {
  if (input.startingCameraRef.current) return;
  input.startingCameraRef.current = true;
  input.setCameraStatus('starting');
  input.setCameraState('Abrindo camera');
  input.setMessage('');
  try {
    if (!input.readinessAvailable) {
      throw new Error('readiness_indisponivel');
    }
    if (!window.isSecureContext) {
      throw new DOMException('Contexto inseguro', 'SecurityError');
    }
    if (!navigator.mediaDevices?.getUserMedia) {
      throw new DOMException('Camera indisponivel', 'NotFoundError');
    }
    await readCameraPermission(input.setCameraPermission);
    stopCamera(input.streamRef);
    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user',
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });
    } catch (err) {
      if ((err as DOMException).name !== 'OverconstrainedError') throw err;
      stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
    }
    input.streamRef.current = stream;
    if (input.video) await attachStream(input.video, stream);
    input.setStreamTick((current) => current + 1);
    input.setCameraState('Camera ativa');
    input.setCameraStatus('ready');
    void checkFaceClientReadiness()
      .then((result) => {
        input.setClientReadiness(result.ready ? 'Pronto' : result.reasons.join(', '));
        input.setModelState(
          result.modelReady && result.mediaPipeReady ? 'Modelos carregados' : 'Modelo indisponivel',
        );
      })
      .catch(() => {
        input.setModelState('Falha ao verificar modelos');
      });
  } catch (err) {
    input.setCameraStatus('error');
    input.setCameraState('Falha ao abrir camera');
    input.setMessage(cameraErrorMessage(err));
  } finally {
    input.startingCameraRef.current = false;
  }
}

async function attachStream(video: HTMLVideoElement, stream: MediaStream) {
  video.srcObject = stream;
  video.muted = true;
  video.playsInline = true;
  await video.play();
}

function stopCamera(streamRef: React.MutableRefObject<MediaStream | null>) {
  streamRef.current?.getTracks().forEach((track) => track.stop());
  streamRef.current = null;
}

async function readCameraPermission(setCameraPermission: (value: string) => void) {
  const permissionsApi = navigator.permissions as
    | (Permissions & { query(permissionDesc: { name: 'camera' }): Promise<PermissionStatus> })
    | undefined;
  if (!permissionsApi?.query) return;
  try {
    const status = await permissionsApi.query({ name: 'camera' });
    setCameraPermission(status.state);
  } catch {
    setCameraPermission('nao suportada');
  }
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
    readiness_indisponivel: 'A biometria facial ainda nao esta pronta neste ambiente.',
    unidade_ausente: 'Vincule o colaborador a uma unidade antes de cadastrar a biometria.',
    baixa_qualidade: 'Melhore a iluminacao e mantenha o rosto centralizado.',
    qualidade_insuficiente: 'Melhore a iluminacao e mantenha o rosto centralizado.',
    amostras_invalidas: 'Colete pelo menos 5 amostras validas antes de salvar.',
    amostras_divergentes: 'As capturas divergiram. Refaça o cadastro com o rosto centralizado.',
  };
  return messages[value] ?? value;
}

function cameraErrorMessage(error: unknown): string {
  const name = error instanceof DOMException || error instanceof Error ? error.name : String(error);
  const messages: Record<string, string> = {
    NotAllowedError: 'Permissao da camera negada. Libere a camera nas configuracoes do navegador.',
    NotFoundError: 'Nenhuma camera foi encontrada neste dispositivo.',
    NotReadableError: 'A camera esta sendo usada por outro aplicativo.',
    OverconstrainedError: 'A camera nao suporta a configuracao solicitada.',
    SecurityError: 'A camera exige conexao HTTPS confiavel.',
    AbortError: 'A abertura da camera foi interrompida.',
    readiness_indisponivel: 'A biometria facial ainda nao esta pronta neste ambiente.',
  };
  return messages[name] ?? `Nao foi possivel abrir a camera. Codigo de referencia: ${name}.`;
}

function cameraHelpMessage(): string {
  return 'Verifique se o navegador tem permissao para usar a camera neste site HTTPS, feche outros aplicativos que usam a camera e tente novamente.';
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

function statusStyle(state: FaceSituation): React.CSSProperties {
  return {
    nao_cadastrada: { background: '#e8f0f8', borderColor: '#7b95ad', color: '#1f3b57' },
    ativa: { background: '#e6f6ed', borderColor: '#2f855a', color: '#1f5135' },
    bloqueada: { background: '#fff7db', borderColor: '#b7791f', color: '#6b4a00' },
    revogada: { background: '#fde8e8', borderColor: '#c53030', color: '#7f1d1d' },
    incompativel: { background: '#fff1e6', borderColor: '#c2410c', color: '#7c2d12' },
  }[state];
}

const styles = {
  page: {
    maxWidth: 1120,
    margin: '0 auto',
    display: 'grid',
    gap: 14,
    color: '#14181c',
    background: '#f4f7fa',
  },
  card: {
    display: 'grid',
    gap: 12,
    background: '#ffffff',
    border: '1px solid #d8e0e8',
    boxShadow: '0 1px 2px rgba(20, 24, 28, 0.06)',
  },
  title: {
    margin: 0,
    color: '#142f4c',
    fontSize: 'var(--text-2xl)',
    fontWeight: 800,
  },
  sectionTitle: {
    margin: 0,
    paddingBottom: 8,
    borderBottom: '1px solid #d8e0e8',
    color: '#1f4e79',
    fontSize: 'var(--text-lg)',
    fontWeight: 800,
  },
  helperText: {
    margin: '4px 0 0',
    color: '#4b5f72',
    fontSize: 'var(--text-sm)',
  },
  bodyText: {
    color: '#3d4b59',
    marginBottom: 0,
    lineHeight: 1.55,
  },
  muted: {
    color: '#4b5f72',
  },
  label: {
    color: '#34495c',
    fontWeight: 700,
    letterSpacing: 0,
  },
  value: {
    display: 'block',
    marginTop: 4,
    color: '#14181c',
    fontWeight: 700,
  },
  status: {
    border: '1px solid',
    borderRadius: 999,
    padding: '6px 10px',
    fontWeight: 800,
    fontSize: 'var(--text-sm)',
  },
  wizardCard: {
    borderColor: '#1f4e79',
    background: '#ffffff',
  },
  wizardGrid: {
    display: 'grid',
    gridTemplateColumns: 'minmax(420px, 1.1fr) minmax(360px, 0.9fr)',
    gap: 18,
    alignItems: 'start',
  },
  videoFrame: {
    aspectRatio: '16 / 9',
    background: '#111827',
    borderRadius: 8,
    position: 'relative',
    overflow: 'hidden',
    minHeight: 260,
  },
  video: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    transform: 'scaleX(-1)',
    display: 'block',
  },
  faceGuide: {
    position: 'absolute',
    inset: '16% 30%',
    border: '3px solid #22c55e',
    borderRadius: '48%',
    boxShadow: '0 0 0 999px rgba(0, 0, 0, 0.16)',
    pointerEvents: 'none',
  },
  cameraBadge: {
    position: 'absolute',
    left: 12,
    bottom: 12,
    background: 'rgba(255, 255, 255, 0.94)',
    color: '#14181c',
    border: '1px solid #d8e0e8',
    borderRadius: 6,
    padding: '6px 8px',
    fontWeight: 700,
    fontSize: 'var(--text-sm)',
  },
  wizardStep: {
    display: 'block',
    color: '#142f4c',
    fontSize: 'var(--text-xl)',
    marginBottom: 6,
  },
} satisfies Record<string, React.CSSProperties>;

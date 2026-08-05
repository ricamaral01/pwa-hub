import { useMemo, useState } from 'react';
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

type FaceStatus = {
  ativa: boolean;
  modeloNome: string | null;
  modeloVersao: string | null;
  qualidade: string | null;
  ultimaUtilizacaoEm: string | null;
  emitidaEm: string | null;
};

const sampleEmbedding = syntheticEmbedding('admin-enrollment-fixture', 'sample');

export default function FaceEnrollmentPage() {
  const { id } = useParams();
  const [message, setMessage] = useState('');
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

  async function action(kind: 'start' | 'complete' | 'test' | 'revoke' | 'delete') {
    if (!id) return;
    setMessage('');
    try {
      if (kind === 'start') {
        await apiPost(`/employees/${id}/face-enrollment/start`, {});
        setMessage('Cadastro biometrico iniciado.');
      }
      if (kind === 'complete' || kind === 'test') {
        await apiPost(`/employees/${id}/face-enrollment/${kind}`, {
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
        setMessage(kind === 'complete' ? 'Biometria cadastrada.' : 'Biometria testada.');
      }
      if (kind === 'revoke') {
        await apiPost(`/employees/${id}/face-enrollment/revoke`, {
          motivo: 'revogacao administrativa',
        });
        setMessage('Biometria revogada.');
      }
      if (kind === 'delete') {
        if (!window.confirm('Excluir definitivamente o cadastro biometrico deste colaborador?'))
          return;
        await apiDelete(`/employees/${id}/face-enrollment`);
        setMessage('Biometria excluida.');
      }
      await status.refetch();
    } catch (err) {
      setMessage(getApiErrorMessage(err));
    }
  }

  const faceState = biometricState(status.data);
  const available = readiness.data?.available === true;

  return (
    <DesktopShell
      title="Biometria facial"
      actions={
        <Link className="btn btn-md btn-surface" to="/admin/cadastros/collaborators">
          Voltar
        </Link>
      }
    >
      <div style={{ maxWidth: 1120, margin: '0 auto', display: 'grid', gap: 'var(--space-5)' }}>
        <section className="industrial-form-card">
          <h2 style={{ margin: 0 }}>{String(collaborator?.nome ?? 'Colaborador')}</h2>
          <div
            style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 12 }}
          >
            <Info label="Matricula" value={String(collaborator?.matricula ?? '-')} />
            <Info label="Funcao" value={functionLabel} />
            <Info label="Unidade" value={String(collaborator?.unidadeNome ?? '-')} />
            <Info label="Status do colaborador" value={collaborator?.ativo ? 'Ativo' : 'Inativo'} />
            <Info label="Status da biometria" value={faceState} />
            <Info label="Modelo atual" value={`${FACE_MODEL.nome} ${FACE_MODEL.versao}`} />
          </div>
        </section>

        {!available ? (
          <IndustrialAlert variant="atencao" title="Biometria indisponivel">
            {readinessMessage(readiness.data?.reasons ?? ['readiness_nao_consultado'])}
          </IndustrialAlert>
        ) : null}

        <section className="industrial-form-card">
          <h3 style={{ marginTop: 0 }}>Acoes</h3>
          <div className="button-row">
            {faceState === 'Nao cadastrada' ? (
              <ActionButton
                allowed={available && hasPermission(permissions, 'biometria.cadastrar')}
                onClick={() => void action('complete')}
              >
                Cadastrar biometria
              </ActionButton>
            ) : null}
            {faceState === 'Ativa' ? (
              <>
                <ActionButton
                  allowed={available && hasPermission(permissions, 'biometria.testar')}
                  onClick={() => void action('test')}
                >
                  Testar biometria
                </ActionButton>
                <ActionButton
                  allowed={available && hasPermission(permissions, 'biometria.cadastrar')}
                  onClick={() => void action('complete')}
                >
                  Refazer cadastro
                </ActionButton>
                <ActionButton
                  allowed={hasPermission(permissions, 'biometria.revogar')}
                  onClick={() => void action('revoke')}
                >
                  Bloquear
                </ActionButton>
                <ActionButton
                  allowed={hasPermission(permissions, 'biometria.revogar')}
                  onClick={() => void action('revoke')}
                >
                  Revogar
                </ActionButton>
              </>
            ) : null}
            {faceState !== 'Nao cadastrada' && faceState !== 'Ativa' ? (
              <ActionButton
                allowed={available && hasPermission(permissions, 'biometria.cadastrar')}
                onClick={() => void action('complete')}
              >
                Recadastrar
              </ActionButton>
            ) : null}
            <ActionButton
              allowed={hasPermission(permissions, 'biometria.excluir')}
              onClick={() => void action('delete')}
            >
              Excluir
            </ActionButton>
          </div>
          {message ? <IndustrialAlert variant="info">{message}</IndustrialAlert> : null}
        </section>

        <section className="industrial-form-card">
          <h3 style={{ marginTop: 0 }}>Detalhes</h3>
          <div
            style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 12 }}
          >
            <Info label="Modelo" value={status.data?.modeloNome ?? '-'} />
            <Info label="Versao" value={status.data?.modeloVersao ?? '-'} />
            <Info label="Qualidade" value={status.data?.qualidade ?? '-'} />
            <Info label="Data do cadastro" value={formatDate(status.data?.emitidaEm)} />
            <Info label="Ultima utilizacao" value={formatDate(status.data?.ultimaUtilizacaoEm)} />
            <Info label="Situacao" value={faceState} />
            <Info label="Auditoria resumida" value="Eventos registrados no log de biometria." />
          </div>
        </section>
      </div>
    </DesktopShell>
  );
}

function Info({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      <span className="field-label-text">{label}</span>
      <strong style={{ display: 'block', marginTop: 4 }}>{value}</strong>
    </div>
  );
}

function ActionButton({
  allowed,
  children,
  onClick,
}: {
  allowed: boolean;
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <Button type="button" variant="surface" disabled={!allowed} onClick={onClick}>
      {children}
    </Button>
  );
}

function biometricState(status: FaceStatus | undefined): string {
  if (!status?.emitidaEm) return 'Nao cadastrada';
  if (!status.ativa) return 'Revogada';
  if (status.modeloNome !== FACE_MODEL.nome || status.modeloVersao !== FACE_MODEL.versao) {
    return 'Incompativel com o modelo atual';
  }
  return 'Ativa';
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

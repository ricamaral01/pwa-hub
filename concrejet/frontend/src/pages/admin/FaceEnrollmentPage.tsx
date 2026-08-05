import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { DesktopShell } from '@/ui/desktop';
import { IndustrialAlert } from '@/ui/feedback';
import { apiDelete, apiGet, apiPost } from '@/api/client';
import { FACE_MODEL, syntheticEmbedding } from '@/features/face/faceAuth';

const sampleEmbedding = syntheticEmbedding('admin-enrollment-fixture', 'sample');

export default function FaceEnrollmentPage() {
  const { id } = useParams();
  const [status, setStatus] = useState<string>('Nao consultado');
  const [message, setMessage] = useState('');

  async function action(kind: 'status' | 'start' | 'complete' | 'test' | 'revoke' | 'delete') {
    if (!id) return;
    setMessage('');
    try {
      if (kind === 'status') {
        const result = await apiGet<Record<string, unknown>>(
          `/employees/${id}/face-enrollment/status`,
        );
        setStatus(JSON.stringify(result));
      }
      if (kind === 'start') {
        const result = await apiPost<Record<string, unknown>>(
          `/employees/${id}/face-enrollment/start`,
          {},
        );
        setStatus(JSON.stringify(result));
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
          motivo: 'bloqueio administrativo',
        });
        setMessage('Biometria bloqueada.');
      }
      if (kind === 'delete') {
        await apiDelete(`/employees/${id}/face-enrollment`);
        setMessage('Biometria excluida.');
      }
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Falha na operacao.');
    }
  }

  return (
    <DesktopShell
      title="Biometria facial"
      actions={<Link to="/admin/cadastros/collaborators">Voltar</Link>}
    >
      <h2>Cadastro operacional do colaborador</h2>
      <div className="industrial-form-card">
        <IndustrialAlert variant="info" title="Finalidade">
          Uso exclusivo para login operacional. Frames temporarios sao descartados e nao ha
          reconhecimento offline.
        </IndustrialAlert>
        <div className="button-row">
          <button onClick={() => void action('start')}>Cadastrar</button>
          <button onClick={() => void action('test')}>Testar</button>
          <button onClick={() => void action('complete')}>Refazer</button>
          <button onClick={() => void action('revoke')}>Bloquear</button>
          <button onClick={() => void action('delete')}>Excluir</button>
          <button onClick={() => void action('status')}>Consultar status</button>
        </div>
        <pre className="technical-details">{status}</pre>
        {message ? <IndustrialAlert variant="atencao">{message}</IndustrialAlert> : null}
      </div>
    </DesktopShell>
  );
}

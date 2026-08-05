import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDevice } from '@/hooks/useDevice';
import { Field, Input } from '@/components/Field';
import { Button } from '@/components/Button';
import { IndustrialAlert } from '@/ui/feedback';

const ActivationPage: React.FC = () => {
  const { identificador, isLoading, activateDevice } = useDevice();
  const navigate = useNavigate();
  const [maquinaId, setMaquinaId] = useState('maq-001');
  const [maquinaNome, setMaquinaNome] = useState('Injetora 1 - Arburg 420C');
  const [maquinaCodigo, setMaquinaCodigo] = useState('INJ-01');
  const [activating, setActivating] = useState(false);
  const [error, setError] = useState('');

  const deviceCode = useMemo(() => makeDeviceCode(identificador), [identificador]);

  const handleActivate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!maquinaId.trim() || !maquinaNome.trim() || !maquinaCodigo.trim()) {
      setError('Preencha todos os campos.');
      return;
    }
    setActivating(true);
    setError('');
    try {
      await activateDevice({ maquinaId, maquinaNome, maquinaCodigo });
      navigate('/', { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao ativar o dispositivo.');
    } finally {
      setActivating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="activation-layout">
        <div className="loading-state">
          <div className="spinner spinner-lg" />
          <p>Inicializando terminal</p>
        </div>
      </div>
    );
  }

  return (
    <main className="activation-layout" aria-label="Ativacao do dispositivo">
      <div className="activation-card animate-fade-scale-in">
        <header className="activation-header">
          <div className="activation-logo" aria-hidden="true">
            CT
          </div>
          <div>
            <p className="section-eyebrow">ConcreTrack Injecao</p>
            <h1>Ativacao do terminal</h1>
            <p className="text-muted">
              Vincule este tablet a uma maquina antes de liberar a operacao.
            </p>
          </div>
        </header>

        <section className="activation-summary" aria-label="Resumo do terminal">
          <div>
            <span>Codigo do tablet</span>
            <strong>{deviceCode}</strong>
          </div>
          <div>
            <span>Status</span>
            <strong>Aguardando ativacao</strong>
          </div>
        </section>

        <IndustrialAlert variant="info" title="Ativacao local de desenvolvimento">
          O identificador tecnico do dispositivo fica oculto na interface operacional.
        </IndustrialAlert>

        <form onSubmit={(e) => void handleActivate(e)} noValidate>
          <div className="activation-form">
            <Field label="Codigo da maquina" required>
              <Input
                value={maquinaCodigo}
                onChange={(e) => setMaquinaCodigo(e.target.value)}
                placeholder="Ex: INJ-01"
                autoComplete="off"
                aria-label="Codigo da maquina"
                required
              />
            </Field>

            <Field label="Nome da maquina" required>
              <Input
                value={maquinaNome}
                onChange={(e) => setMaquinaNome(e.target.value)}
                placeholder="Ex: Injetora 1 - Arburg 420C"
                autoComplete="off"
                aria-label="Nome da maquina"
                required
              />
            </Field>

            <Field label="Codigo interno da maquina" required hint="Fornecido pelo administrador.">
              <Input
                value={maquinaId}
                onChange={(e) => setMaquinaId(e.target.value)}
                placeholder="Codigo interno"
                autoComplete="off"
                aria-label="Codigo interno da maquina"
                required
              />
            </Field>

            {error ? (
              <IndustrialAlert variant="parada" title="Falha na ativacao">
                {error}
              </IndustrialAlert>
            ) : null}

            <Button
              type="submit"
              variant="primary"
              size="lg"
              loading={activating}
              fullWidth
              id="btn-activate-device"
            >
              Ativar terminal
            </Button>
          </div>
        </form>
      </div>
    </main>
  );
};

function makeDeviceCode(identifier?: string | null): string {
  if (!identifier) return 'GERANDO';
  return `TAB-${identifier
    .replace(/[^a-z0-9]/gi, '')
    .slice(-6)
    .toUpperCase()}`;
}

export default ActivationPage;

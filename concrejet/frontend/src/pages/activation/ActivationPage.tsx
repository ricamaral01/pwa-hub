import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDevice } from '@/hooks/useDevice';
import { Field, Input } from '@/components/Field';
import { Button } from '@/components/Button';

/**
 * Tela de Ativação do Dispositivo.
 *
 * Exibida quando o tablet não está configurado (sem maquinaId).
 * O identificador único é gerado automaticamente pelo hook useDevice.
 * O administrador usa este identificador para associar o tablet
 * ao cadastro de dispositivo/máquina no backend.
 *
 * Fluxo (mock nesta sprint):
 * 1. Admin vê o UUID do dispositivo
 * 2. Admin informa código da máquina e nome
 * 3. Tablet é ativado e redireciona para login do operador
 *
 * TODO: quando a API de dispositivos existir, buscar maquinaId pelo identificador
 * via GET /dispositivos?identificador={uuid}
 */
const ActivationPage: React.FC = () => {
  const { identificador, isLoading, activateDevice } = useDevice();
  const navigate = useNavigate();
  const [maquinaId, setMaquinaId] = useState('maq-001'); // mock
  const [maquinaNome, setMaquinaNome] = useState('Injetora 1 — Arburg 420C');
  const [maquinaCodigo, setMaquinaCodigo] = useState('INJ-01');
  const [activating, setActivating] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  const handleCopyId = async () => {
    if (!identificador) return;
    try {
      await navigator.clipboard.writeText(identificador);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback silencioso — clipboard pode não estar disponível em HTTP
    }
  };

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
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 'var(--space-4)',
          }}
        >
          <div className="spinner spinner-lg" />
          <p className="text-muted">Inicializando dispositivo…</p>
        </div>
      </div>
    );
  }

  return (
    <main className="activation-layout" aria-label="Ativação do dispositivo">
      <div className="activation-card animate-fade-scale-in">
        {/* Header */}
        <div style={{ textAlign: 'center' }}>
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: 'var(--radius-xl)',
              background: 'rgba(22, 163, 74, 0.12)',
              border: '1px solid rgba(22, 163, 74, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto var(--space-5)',
            }}
          >
            <TabletIcon />
          </div>
          <h1 style={{ fontSize: 'var(--text-2xl)' }}>Ativação do Dispositivo</h1>
          <p
            className="text-muted"
            style={{ marginTop: 'var(--space-2)', fontSize: 'var(--text-base)' }}
          >
            Este tablet ainda não está configurado. Informe os dados da máquina para continuar.
          </p>
        </div>

        {/* Identificador do dispositivo */}
        <div>
          <p className="field-label-text" style={{ marginBottom: 'var(--space-2)' }}>
            Identificador deste dispositivo
          </p>
          <div
            className="device-id-display"
            role="textbox"
            aria-readonly="true"
            aria-label={`Identificador do dispositivo: ${identificador ?? 'gerando…'}`}
          >
            {identificador ?? 'Gerando identificador…'}
          </div>
          <button
            onClick={() => void handleCopyId()}
            style={{
              marginTop: 'var(--space-2)',
              background: 'none',
              border: 'none',
              color: copied ? 'var(--color-green-light)' : 'var(--text-muted)',
              fontSize: 'var(--text-sm)',
              cursor: 'pointer',
              padding: 'var(--space-2) 0',
              minHeight: 'var(--touch-sm)',
            }}
            aria-label={copied ? 'Copiado!' : 'Copiar identificador'}
          >
            {copied ? '✓ Copiado!' : '↗ Copiar para a área de transferência'}
          </button>
          <p className="text-xs text-muted" style={{ marginTop: 'var(--space-1)' }}>
            Informe este código ao administrador para registrar o dispositivo no sistema.
          </p>
        </div>

        <div className="divider" />

        {/* Formulário de ativação */}
        <form onSubmit={(e) => void handleActivate(e)} noValidate>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
            <Field label="Código da Máquina" required>
              <Input
                value={maquinaCodigo}
                onChange={(e) => setMaquinaCodigo(e.target.value)}
                placeholder="Ex: INJ-01"
                autoComplete="off"
                aria-label="Codigo da maquina"
                required
              />
            </Field>

            <Field label="Nome da Máquina" required>
              <Input
                value={maquinaNome}
                onChange={(e) => setMaquinaNome(e.target.value)}
                placeholder="Ex: Injetora 1 — Arburg 420C"
                autoComplete="off"
                aria-label="Nome da maquina"
                required
              />
            </Field>

            <Field
              label="ID da Máquina (sistema)"
              required
              hint="Obtido com o administrador do sistema."
            >
              <Input
                value={maquinaId}
                onChange={(e) => setMaquinaId(e.target.value)}
                placeholder="UUID da máquina"
                autoComplete="off"
                aria-label="ID da maquina"
                required
              />
            </Field>

            {error && (
              <p
                role="alert"
                style={{ color: 'var(--color-red-light)', fontSize: 'var(--text-sm)' }}
              >
                ⚠ {error}
              </p>
            )}

            <Button
              type="submit"
              variant="primary"
              size="lg"
              loading={activating}
              fullWidth
              id="btn-activate-device"
            >
              Ativar este dispositivo
            </Button>
          </div>
        </form>
      </div>
    </main>
  );
};

const TabletIcon: React.FC = () => (
  <svg
    width="32"
    height="32"
    viewBox="0 0 24 24"
    fill="none"
    stroke="var(--color-green)"
    strokeWidth="1.5"
    aria-hidden="true"
  >
    <rect x="4" y="2" width="16" height="20" rx="2" />
    <path d="M12 18h.01" />
  </svg>
);

export default ActivationPage;

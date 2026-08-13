import React, { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSession } from '@/hooks/useSession';
import { useSessionStore } from '@/store/session.store';
import { Button } from '@/components/Button';
import { Field, Input } from '@/components/Field';
import { OnlineBadge } from '@/components/Badge';
import { capabilities, isDemoMode } from '@/config/runtime';
import { useAdminAuthStore } from '@/store/admin-auth.store';

/**
 * Tela de Login — ConcreTrack Injeção
 *
 * Modo operador: matrícula + PIN (teclado numérico grande, usável com luvas)
 * Modo admin: e-mail + senha (usa o endpoint real POST /auth/login)
 *
 * Comportamento:
 * - Exibe máquina vinculada, horário e status de rede
 * - Após inatividade: mostra lock overlay (veja LockOverlay em TopBar.tsx)
 * - Não limpa dados do apontamento ao trocar de operador
 */
const LoginPage: React.FC = () => {
  const [mode, setMode] = useState<'operator' | 'admin'>('operator');
  const [matricula, setMatricula] = useState('');
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const navigate = useNavigate();

  const { loginOperador } = useSession();
  const { device, isOnline, queueCount } = useSessionStore();

  // Relógio
  useEffect(() => {
    const t = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const formattedTime = currentTime.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
  const formattedDate = currentTime.toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });

  // PIN keyboard handler
  const handlePinKey = useCallback(
    (key: string) => {
      setError('');
      if (key === 'DEL') {
        setPin((p) => p.slice(0, -1));
        return;
      }
      if (pin.length >= 6) return;
      setPin((p) => p + key);
    },
    [pin],
  );

  // Submit do login de operador
  const handleOperatorLogin = useCallback(async () => {
    if (!matricula.trim()) {
      setError('Informe a matrícula.');
      return;
    }
    if (pin.length < 4) {
      setError('PIN deve ter pelo menos 4 dígitos.');
      return;
    }
    setError('');
    try {
      const ok = await loginOperador(matricula, pin);
      if (!ok) {
        setError('Matrícula ou PIN inválidos.');
        setPin('');
      } else {
        navigate('/', { replace: true });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao efetuar login. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }, [matricula, pin, loginOperador, navigate]);

  // Auto-submit quando PIN atingir 4 ou 6 dígitos
  useEffect(() => {
    if (isDemoMode && (pin.length === 4 || pin.length === 6) && matricula.trim()) {
      void handleOperatorLogin();
    }
  }, [pin, matricula, handleOperatorLogin]);

  const PIN_KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'DEL', '0', '✓'];

  return (
    <main className="login-layout" aria-label="Login do operador">
      {/* Faixa superior com status */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          padding: 'var(--space-4) var(--space-6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
          <ConcreTrackLogo />
          <span
            style={{ fontFamily: 'var(--font-tight)', fontWeight: 800, fontSize: 'var(--text-lg)' }}
          >
            ConcreTrack Injeção
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
          <OnlineBadge isOnline={isOnline} queueCount={queueCount} />
          <time
            style={{
              fontFamily: 'var(--font-tight)',
              fontSize: 'var(--text-xl)',
              fontWeight: 700,
              fontVariantNumeric: 'tabular-nums',
            }}
            dateTime={currentTime.toISOString()}
          >
            {formattedTime}
          </time>
        </div>
      </div>

      {/* Card principal */}
      <div
        className={`login-card ${mode === 'admin' ? 'login-card-wide' : ''} animate-fade-scale-in`}
        style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}
      >
        {/* Máquina vinculada */}
        {device && (
          <div
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              padding: 'var(--space-3) var(--space-4)',
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-3)',
            }}
          >
            <MachineIcon />
            <div>
              <p className="field-label-text">Máquina vinculada</p>
              <p style={{ fontWeight: 600, fontSize: 'var(--text-base)' }}>
                {device.maquinaCodigo} — {device.maquinaNome}
              </p>
            </div>
          </div>
        )}

        {/* Título e troca de modo */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h1 style={{ fontSize: 'var(--text-2xl)' }}>
            {mode === 'operator' ? 'Identificação do Operador' : 'Acesso Administrativo'}
          </h1>
          <button
            onClick={() => {
              setMode((m) => (m === 'operator' ? 'admin' : 'operator'));
              setError('');
              setPin('');
            }}
            style={{
              background: 'none',
              border: '1px solid var(--border-default)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--text-muted)',
              fontSize: 'var(--text-sm)',
              cursor: 'pointer',
              padding: 'var(--space-2) var(--space-3)',
              minHeight: 'var(--touch-sm)',
              fontWeight: 600,
            }}
            aria-label={`Mudar para ${mode === 'operator' ? 'login administrativo' : 'login de operador'}`}
          >
            {mode === 'operator' ? 'Admin ↗' : '← Operador'}
          </button>
        </div>

        {mode === 'operator' ? (
          <OperatorLoginForm
            matricula={matricula}
            pin={pin}
            error={error}
            loading={loading}
            demoMode={isDemoMode}
            operatorAuthentication={capabilities.operatorAuthentication}
            onMatriculaChange={(v) => {
              setMatricula(v);
              setError('');
            }}
            onPinKey={handlePinKey}
            onSubmit={() => void handleOperatorLogin()}
            pinKeys={PIN_KEYS}
          />
        ) : (
          <AdminLoginForm />
        )}

        {/* Data */}
        <p
          className="text-muted text-sm"
          style={{ textAlign: 'center', textTransform: 'capitalize' }}
        >
          {formattedDate}
        </p>
      </div>
    </main>
  );
};

// ─────────────────────────────────────────────
// Formulário de login de operador
// ─────────────────────────────────────────────
interface OperatorLoginFormProps {
  matricula: string;
  pin: string;
  error: string;
  loading: boolean;
  demoMode: boolean;
  operatorAuthentication: string;
  onMatriculaChange: (v: string) => void;
  onPinKey: (key: string) => void;
  onSubmit: () => void;
  pinKeys: string[];
}

const OperatorLoginForm: React.FC<OperatorLoginFormProps> = ({
  matricula,
  pin,
  error,
  loading,
  demoMode,
  operatorAuthentication,
  onMatriculaChange,
  onPinKey,
  onSubmit,
  pinKeys,
}) => (
  <div style={{ display: 'flex', gap: 'var(--space-8)' }}>
    {/* Campo matrícula */}
    <div style={{ flex: 1 }}>
      <Field label="Matrícula" required>
        <Input
          value={matricula}
          onChange={(e) => onMatriculaChange(e.target.value)}
          placeholder="Ex: OP001"
          autoComplete="username"
          autoFocus
          aria-label="Matrícula do operador"
          disabled={operatorAuthentication !== 'demo'}
          style={{ fontSize: 'var(--text-xl)', fontWeight: 700, letterSpacing: '0.1em' }}
        />
      </Field>

      {operatorAuthentication !== 'demo' ? (
        <p role="alert" className="capability-warning">
          Login operacional ainda nao foi implementado no backend. Use o acesso administrativo real
          ou habilite VITE_DEMO_MODE=true apenas para demonstracao visual.
        </p>
      ) : (
        <p role="status" className="capability-warning demo">
          Operador simulado. Nenhuma sessao real sera criada no servidor.
        </p>
      )}

      {/* Dots de PIN */}
      <div style={{ marginTop: 'var(--space-5)' }}>
        <p className="field-label-text" style={{ marginBottom: 'var(--space-3)' }}>
          PIN
        </p>
        <div
          className="pin-display"
          role="status"
          aria-live="polite"
          aria-label={`${pin.length} dígitos digitados`}
        >
          {Array.from({ length: 6 }).map((_, i) => (
            <span
              key={i}
              className={`pin-dot ${i < pin.length ? 'filled' : ''}`}
              aria-hidden="true"
            />
          ))}
        </div>
      </div>

      {error && (
        <p
          role="alert"
          style={{
            color: 'var(--color-red-light)',
            fontSize: 'var(--text-sm)',
            marginTop: 'var(--space-3)',
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-1)',
          }}
        >
          <span aria-hidden="true">⚠</span> {error}
        </p>
      )}
    </div>

    {/* Teclado PIN */}
    <div>
      <div className="pin-grid" style={{ width: 284 }} role="group" aria-label="Teclado numérico">
        {pinKeys.map((k) => (
          <button
            key={k}
            className="pin-key"
            onClick={() => (k === '✓' ? onSubmit() : onPinKey(k))}
            disabled={loading || !demoMode}
            style={k === '✓' ? { background: 'var(--color-green)', color: 'white' } : undefined}
            aria-label={k === 'DEL' ? 'Apagar' : k === '✓' ? 'Entrar' : k}
          >
            {loading && k === '✓' ? (
              <span className="spinner" aria-hidden="true" />
            ) : k === 'DEL' ? (
              '⌫'
            ) : (
              k
            )}
          </button>
        ))}
      </div>
    </div>
  </div>
);

// ─────────────────────────────────────────────
// Formulário de login administrativo
// ─────────────────────────────────────────────
const AdminLoginForm: React.FC = () => {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const login = useAdminAuthStore((state) => state.login);
  const adminStatus = useAdminAuthStore((state) => state.status);
  const adminUser = useAdminAuthStore((state) => state.user);
  const loading = useAdminAuthStore((state) => state.isLoading);

  useEffect(() => {
    if (adminStatus !== 'authenticated') return;
    navigate(adminUser?.deveTrocarSenha ? '/change-password' : '/admin', { replace: true });
  }, [adminStatus, adminUser?.deveTrocarSenha, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !senha) {
      setError('Preencha e-mail e senha.');
      return;
    }
    setError('');
    try {
      const result = await login({ email, senha });
      navigate(result.deveTrocarSenha ? '/change-password' : '/admin', { replace: true });
    } catch {
      setError('Credenciais invalidas ou servidor indisponivel.');
    }
  };
  return (
    <form
      onSubmit={(e) => void handleSubmit(e)}
      style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}
    >
      <Field label="E-mail" required>
        <Input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="admin@empresa.com"
          autoComplete="email"
          autoFocus
        />
      </Field>
      <Field label="Senha" required>
        <Input
          type="password"
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
          autoComplete="current-password"
        />
      </Field>
      {error && (
        <p role="alert" style={{ color: 'var(--color-red-light)', fontSize: 'var(--text-sm)' }}>
          ⚠ {error}
        </p>
      )}
      <Button
        type="submit"
        variant="primary"
        size="lg"
        loading={loading}
        fullWidth
        id="btn-admin-login"
      >
        Entrar
      </Button>
    </form>
  );
};

// Ícones
const ConcreTrackLogo: React.FC = () => (
  <svg width="32" height="32" viewBox="0 0 32 32" fill="none" aria-hidden="true">
    <rect width="32" height="32" rx="8" fill="#16A34A" />
    <path d="M8 16 L14 10 L20 16 L14 22 Z" fill="white" />
    <path d="M16 10 L22 16 L16 22" stroke="white" strokeWidth="2" fill="none" />
  </svg>
);

const MachineIcon: React.FC = () => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="var(--color-green)"
    strokeWidth="1.5"
    aria-hidden="true"
  >
    <rect x="2" y="7" width="20" height="14" rx="2" />
    <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
    <line x1="12" y1="12" x2="12" y2="16" />
    <line x1="10" y1="14" x2="14" y2="14" />
  </svg>
);

export default LoginPage;

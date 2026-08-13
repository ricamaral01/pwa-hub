import React, { useEffect, useState, useCallback } from 'react';
import { useSessionStore } from '@/store/session.store';
import { OnlineBadge } from './Badge';
import { Button } from './Button';

interface TopBarProps {
  onLock?: () => void;
  onSwitchOperator?: () => void;
}

/**
 * Barra superior da tela operacional.
 *
 * Exibe: logo, máquina, operador, OP ativa, horário, online/offline, fila.
 * Não depende de clock global — usa setInterval interno com timestamp real.
 */
export const TopBar: React.FC<TopBarProps> = ({ onLock, onSwitchOperator }) => {
  const { device, operator, isOnline, queueCount } = useSessionStore();
  const [time, setTime] = useState(() => new Date());

  // Relógio atualizado a cada segundo
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formattedTime = time.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });

  return (
    <header className="topbar" role="banner">
      {/* Brand */}
      <div className="topbar-brand">
        <ConcreTrackLogo />
        <span className="topbar-brand-name">ConcreTrack</span>
      </div>

      <div className="topbar-divider" aria-hidden="true" />

      {/* Informações da sessão */}
      <div className="topbar-info">
        {/* Máquina */}
        <div className="topbar-meta">
          <span className="topbar-meta-label">Máquina</span>
          <span className="topbar-meta-value">
            {device ? `${device.maquinaCodigo} — ${device.maquinaNome}` : '—'}
          </span>
        </div>

        <div className="topbar-divider" aria-hidden="true" />

        {/* Operador */}
        <div className="topbar-meta">
          <span className="topbar-meta-label">Operador</span>
          <span className="topbar-meta-value">
            {operator ? `${operator.matricula} — ${operator.nome}` : '—'}
          </span>
        </div>

        <div className="topbar-divider" aria-hidden="true" />

        {/* Status online */}
        <OnlineBadge isOnline={isOnline} queueCount={queueCount} />
      </div>

      {/* Relógio e ações */}
      <div className="topbar-actions" style={{ marginLeft: 'auto' }}>
        <time
          className="topbar-clock"
          dateTime={time.toISOString()}
          aria-label={`Horário: ${formattedTime}`}
        >
          {formattedTime}
        </time>

        <div className="topbar-divider" aria-hidden="true" />

        {onSwitchOperator && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onSwitchOperator}
            aria-label="Trocar operador"
            title="Trocar operador"
          >
            <SwitchIcon />
          </Button>
        )}

        {onLock && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onLock}
            aria-label="Bloquear tela"
            title="Bloquear tela"
          >
            <LockIcon />
          </Button>
        )}
      </div>
    </header>
  );
};

// ─── Ícones inline (sem dependência externa) ──────────────────────────────
const ConcreTrackLogo: React.FC = () => (
  <svg width="32" height="32" viewBox="0 0 32 32" fill="none" aria-hidden="true">
    <rect width="32" height="32" rx="8" fill="#16A34A" />
    <path d="M8 16 L14 10 L20 16 L14 22 Z" fill="white" />
    <path d="M16 10 L22 16 L16 22" stroke="white" strokeWidth="2" fill="none" />
  </svg>
);

const LockIcon: React.FC = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    aria-hidden="true"
  >
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);

const SwitchIcon: React.FC = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    aria-hidden="true"
  >
    <path d="M17 1l4 4-4 4" />
    <path d="M3 11V9a4 4 0 0 1 4-4h14" />
    <path d="M7 23l-4-4 4-4" />
    <path d="M21 13v2a4 4 0 0 1-4 4H3" />
  </svg>
);

// ─── Aviso de rotação ─────────────────────────────────────────────────────
export const RotateWarning: React.FC = () => (
  <div className="rotate-warning" role="alert" aria-live="assertive">
    <svg
      className="rotate-icon"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      aria-hidden="true"
    >
      <rect x="4" y="2" width="16" height="20" rx="2" />
      <path d="M12 18h.01" />
    </svg>
    <h2 style={{ fontSize: 'var(--text-2xl)', fontWeight: 800 }}>Gire o tablet para continuar</h2>
    <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-lg)', textAlign: 'center' }}>
      Esta aplicação funciona apenas em modo paisagem (horizontal).
    </p>
  </div>
);

// ─── Overlay de bloqueio de sessão ────────────────────────────────────────
interface LockOverlayProps {
  operatorName: string;
  machineName: string;
  onUnlock: (pin: string) => boolean | Promise<boolean>;
  onSwitch: () => void;
}

export const LockOverlay: React.FC<LockOverlayProps> = ({
  operatorName,
  machineName,
  onUnlock,
  onSwitch,
}) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleKey = useCallback(
    (key: string) => {
      if (key === 'DEL') {
        setPin((p) => p.slice(0, -1));
        setError('');
        return;
      }
      if (pin.length >= 6) return;
      const next = pin + key;
      setPin(next);
      setError('');
    },
    [pin],
  );

  useEffect(() => {
    if (pin.length === 4 || pin.length === 6) {
      void (async () => {
        setLoading(true);
        const ok = await onUnlock(pin);
        if (!ok) {
          setError('PIN incorreto. Tente novamente.');
          setPin('');
        }
        setLoading(false);
      })();
    }
  }, [pin, onUnlock]);

  const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'DEL', '0', 'OK'];

  return (
    <div className="lock-overlay" role="dialog" aria-modal="true" aria-label="Tela bloqueada">
      <div style={{ textAlign: 'center', marginBottom: 'var(--space-4)' }}>
        <p className="text-muted text-sm uppercase" style={{ letterSpacing: '0.1em' }}>
          Sessão bloqueada
        </p>
        <h2 style={{ fontSize: 'var(--text-2xl)', marginTop: 'var(--space-2)' }}>{operatorName}</h2>
        <p className="text-muted" style={{ marginTop: 'var(--space-1)' }}>
          {machineName}
        </p>
      </div>

      {/* Dots de PIN */}
      <div className="pin-display" aria-label="Dígitos digitados" aria-live="polite">
        {Array.from({ length: 6 }).map((_, i) => (
          <span
            key={i}
            className={`pin-dot ${i < pin.length ? 'filled' : ''}`}
            aria-hidden="true"
          />
        ))}
      </div>

      {error && (
        <p
          role="alert"
          style={{
            color: 'var(--color-red-light)',
            fontSize: 'var(--text-sm)',
            marginBottom: 'var(--space-2)',
          }}
        >
          {error}
        </p>
      )}

      {/* Teclado PIN */}
      <div
        className="pin-grid"
        style={{ width: 280, marginTop: 'var(--space-4)' }}
        role="group"
        aria-label="Teclado numérico"
      >
        {KEYS.map((k) => (
          <button
            key={k}
            className="pin-key"
            onClick={() => handleKey(k)}
            disabled={loading}
            aria-label={k === 'DEL' ? 'Apagar' : k === 'OK' ? 'Confirmar' : k}
          >
            {k === 'DEL' ? '⌫' : k}
          </button>
        ))}
      </div>

      <button
        onClick={onSwitch}
        style={{
          marginTop: 'var(--space-6)',
          background: 'none',
          border: 'none',
          color: 'var(--text-muted)',
          fontSize: 'var(--text-sm)',
          cursor: 'pointer',
          padding: 'var(--space-3)',
          borderRadius: 'var(--radius-md)',
          minHeight: 'var(--touch-sm)',
        }}
      >
        Trocar de operador
      </button>
    </div>
  );
};

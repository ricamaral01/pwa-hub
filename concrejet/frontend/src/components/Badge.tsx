import React from 'react';

// ─── Badge ────────────────────────────────────────────────────────────────
interface BadgeProps {
  variant: 'online' | 'offline' | 'error' | 'neutral';
  children: React.ReactNode;
  showDot?: boolean;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  variant,
  children,
  showDot = true,
  className = '',
}) => (
  <span className={`badge badge-${variant} ${className}`} role="status">
    {showDot && <span className="badge-dot" aria-hidden="true" />}
    {children}
  </span>
);

// ─── OnlineBadge ──────────────────────────────────────────────────────────
interface OnlineBadgeProps {
  isOnline: boolean;
  queueCount?: number;
}

export const OnlineBadge: React.FC<OnlineBadgeProps> = ({ isOnline, queueCount = 0 }) => {
  if (isOnline && queueCount === 0) {
    return <Badge variant="online">Online</Badge>;
  }

  if (!isOnline && queueCount > 0) {
    return (
      <Badge variant="offline">
        Offline — {queueCount} {queueCount === 1 ? 'registro aguardando' : 'registros aguardando'}
      </Badge>
    );
  }

  if (!isOnline) {
    return <Badge variant="offline">Offline</Badge>;
  }

  // Online mas com fila pendente (sincronizando)
  return <Badge variant="neutral">Sincronizando {queueCount}…</Badge>;
};

// ─── StatusBadge de perda ─────────────────────────────────────────────────
export type LossStatus = 'normal' | 'attention' | 'above-limit' | 'critical';

interface LossStatusBadgeProps {
  status: LossStatus;
  percent: number;
  limit: number;
}

const LOSS_ICONS: Record<LossStatus, string> = {
  normal: '✓',
  attention: '⚠',
  'above-limit': '✕',
  critical: '‼',
};

const LOSS_LABELS: Record<LossStatus, string> = {
  normal: 'Normal',
  attention: 'Atenção',
  'above-limit': 'Acima do limite',
  critical: 'Crítico',
};

export const LossStatusBadge: React.FC<LossStatusBadgeProps> = ({ status, percent, limit }) => {
  const icon = LOSS_ICONS[status];
  const label = LOSS_LABELS[status];

  return (
    <div
      className={`loss-indicator status-${status}`}
      role="status"
      aria-label={`Perda: ${percent.toFixed(1)}% — ${label} (limite: ${limit}%)`}
    >
      <span className="text-xl font-bold" aria-hidden="true">
        {icon}
      </span>
      <div className="flex flex-col">
        <span className="font-bold text-sm">{label}</span>
        <span className="text-xs text-muted">
          {percent.toFixed(1)}% / limite {limit}%
        </span>
      </div>
    </div>
  );
};

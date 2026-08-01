import type { ReactNode } from 'react';

export function IndustrialAlert({
  variant,
  children,
}: {
  variant: 'info' | 'atencao' | 'parada';
  children: ReactNode;
}) {
  const icon = variant === 'parada' ? '✕' : variant === 'atencao' ? '▲' : '●';
  return <div className={`industrial-alert ${variant}`} role="alert">{icon} {children}</div>;
}

export function OfflineIndicator({ online, pending }: { online: boolean; pending: number }) {
  return <span className={`sync-pill ${online ? 'ok' : 'atencao'}`}>{online ? '✓ Online' : `▲ Offline · ${pending} pendentes`}</span>;
}

export function SyncIndicator({ state, pending }: { state: 'sincronizado' | 'pendente' | 'enviando' | 'erro'; pending: number }) {
  const text = state === 'sincronizado' ? '✓ Sincronizado' : state === 'enviando' ? `↻ Enviando ${pending}` : state === 'erro' ? '✕ Erro ao sincronizar' : `▲ ${pending} pendentes`;
  return <span className={`sync-pill ${state === 'erro' ? 'parada' : state === 'sincronizado' ? 'ok' : 'atencao'}`}>{text}</span>;
}

export function LoadingState({ description = 'Carregando...' }: { description?: string }) {
  return <div className="state-box">{description}</div>;
}

export function EmptyState({ title }: { title: string }) {
  return <div className="state-box">{title}</div>;
}

export function ErrorState({ title }: { title: string }) {
  return <div className="state-box error">{title}</div>;
}

export function ConfirmationDialog({ title, onCancel, onConfirm }: { title: string; onCancel: () => void; onConfirm: () => void }) {
  return (
    <div className="dialog-backdrop" role="dialog" aria-modal="true">
      <div className="dialog">
        <h2>{title}</h2>
        <button type="button" onClick={onCancel}>Voltar</button>
        <button type="button" onClick={onConfirm}>Confirmar</button>
      </div>
    </div>
  );
}

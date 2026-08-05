import type { ReactNode } from 'react';

type AlertVariant = 'info' | 'atencao' | 'parada' | 'sucesso';

export function IndustrialAlert({
  variant,
  title,
  children,
}: {
  variant: AlertVariant;
  title?: string;
  children: ReactNode;
}) {
  const icon =
    variant === 'parada' ? '!' : variant === 'atencao' ? '^' : variant === 'sucesso' ? 'OK' : 'i';
  return (
    <div className={`industrial-alert ${variant}`} role={variant === 'info' ? 'status' : 'alert'}>
      <span aria-hidden="true">{icon}</span>
      <span>
        {title ? <strong>{title}</strong> : null}
        {children}
      </span>
    </div>
  );
}

export function OfflineIndicator({ online, pending }: { online: boolean; pending: number }) {
  const text = online
    ? 'Online'
    : pending
      ? `Sem conexao - ${pending} aguardando sincronizacao`
      : 'Sem conexao';
  return (
    <span className={`sync-pill ${online ? 'ok' : 'atencao'}`} title={text}>
      <span aria-hidden="true">{online ? 'OK' : '!'}</span>
      {text}
    </span>
  );
}

export function SyncIndicator({
  state,
  pending,
}: {
  state: 'sincronizado' | 'pendente' | 'enviando' | 'erro';
  pending: number;
}) {
  const text =
    state === 'sincronizado'
      ? 'Sincronizado'
      : state === 'enviando'
        ? `Sincronizando ${pending}`
        : state === 'erro'
          ? 'Erro de sincronizacao'
          : `${pending} pendentes`;
  return (
    <span
      className={`sync-pill ${state === 'erro' ? 'parada' : state === 'sincronizado' ? 'ok' : 'atencao'}`}
      title={text}
    >
      <span aria-hidden="true">
        {state === 'sincronizado' ? 'OK' : state === 'erro' ? '!' : '...'}
      </span>
      {text}
    </span>
  );
}

export function LoadingState({ description = 'Carregando...' }: { description?: string }) {
  return <div className="state-box loading">{description}</div>;
}

export function EmptyState({ title }: { title: string }) {
  return <div className="state-box empty">{title}</div>;
}

export function ErrorState({ title }: { title: string }) {
  return <div className="state-box error">{title}</div>;
}

export function AppToast({
  children,
  variant = 'info',
}: {
  children: ReactNode;
  variant?: AlertVariant;
}) {
  return <div className={`toast toast-${variant}`}>{children}</div>;
}

export function ConfirmationDialog({
  title,
  onCancel,
  onConfirm,
}: {
  title: string;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="dialog-backdrop" role="dialog" aria-modal="true">
      <div className="dialog">
        <h2>{title}</h2>
        <div className="dialog-actions">
          <button type="button" onClick={onCancel}>
            Voltar
          </button>
          <button type="button" onClick={onConfirm}>
            Confirmar
          </button>
        </div>
      </div>
    </div>
  );
}

export const AppDialog = ConfirmationDialog;

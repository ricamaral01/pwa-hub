import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode, SelectHTMLAttributes } from 'react';
import type { SaveStatus } from '../data/sync';
import { Icon } from './icons';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'dark' | 'accent';
export function Button({ variant='primary', size, children, className, ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant; size?: 'sm' }) {
  return <button className={`ct-button ct-button--${variant}${size === 'sm' ? ' ct-button--sm' : ''}${className ? ` ${className}` : ''}`} type="button" {...props}>{children}</button>;
}

/** Campo digitado: borda. A unidade fica dentro da caixa, à direita, e também no nome acessível. */
export function Input({ label, id, error, unit, ...props }: InputHTMLAttributes<HTMLInputElement> & { label: string; id: string; error?: string; unit?: string }) {
  const input = <input id={id} aria-invalid={!!error} aria-describedby={error ? `${id}-error` : undefined} {...props}/>;
  return <div className="ct-field">
    <label htmlFor={id}>{label}{unit && <span className="ct-sr"> ({unit})</span>}</label>
    {unit ? <div className="ct-input-box">{input}<span className="ct-unit" aria-hidden="true">{unit}</span></div> : input}
    {error && <small id={`${id}-error`}>{error}</small>}
  </div>;
}
export function NumberInput({ label, id, error, unit, ...props }: InputHTMLAttributes<HTMLInputElement> & { label: string; id: string; error?: string; unit?: string }) { return <Input label={label} id={id} unit={unit} error={error} type="text" inputMode="decimal" {...props}/>; }
/** Valor calculado: fundo cinza, sem borda. */
export function CalcField({ label, value, unit }: { label: string; value: ReactNode; unit?: string }) {
  return <div className="ct-field"><span>{label}</span><div className="ct-calc"><span>{value}</span>{unit && <span className="ct-unit">{unit}</span>}</div></div>;
}
export function Select({ label, id, children, ...props }: SelectHTMLAttributes<HTMLSelectElement> & { label: string; id: string; children: ReactNode }) { return <div className="ct-field"><label htmlFor={id}>{label}</label><select id={id} {...props}>{children}</select></div>; }
export function Card({ title, subtitle, children, actions, id, className }: { title?: string; subtitle?: string; children: ReactNode; actions?: ReactNode; id?: string; className?: string }) {
  return <section className={`ct-card${className ? ` ${className}` : ''}`} id={id}>
    {title && <div className="ct-card-head"><h2>{title}</h2>{subtitle && <p>{subtitle}</p>}{actions && <div className="ct-card-actions">{actions}</div>}</div>}
    {children}
  </section>;
}

export type Tone = 'ok' | 'warn' | 'crit' | 'info' | 'mute' | 'pilot';
const toneIcon: Record<Tone, string | null> = { ok: 'check', warn: 'alerta', crit: 'erro', info: 'info', mute: null, pilot: 'alerta' };
/** Estado sempre com ícone e palavra (regra do design system). */
export function Pill({ tone, children, title, role }: { tone: Tone; children: ReactNode; title?: string; role?: string }) {
  const icon = toneIcon[tone];
  return <span className={`ct-pill ct-pill--${tone}`} title={title} role={role}>{icon && <Icon name={icon} size={14} strokeWidth={2.4}/>}{children}</span>;
}
export function SaveStatusView({ status, message }: { status: SaveStatus; message?: string }) {
  const labels: Record<SaveStatus, string> = { rascunho_local:'Rascunho local', sem_rede:'Sem rede · na fila', pendente:'Pendente de envio', enviando:'Enviando', salvo_servidor:'Salvo no servidor', conflito:'Conflito de revisão', erro:'Falha ao salvar' };
  const kind = status === 'salvo_servidor' ? 'ok' : status === 'erro' || status === 'conflito' ? 'crit' : 'warn';
  return <span role="status" className={`ct-chip ct-chip--${kind}`} title={message}><Icon name={kind === 'ok' ? 'check' : kind === 'crit' ? 'erro' : 'relogio'} size={14} strokeWidth={2.4}/><span className="ct-chip-text">{labels[status]}</span></span>;
}
export function EmptyState({ title, description, action }: { title: string; description: string; action?: ReactNode }) { return <div className="ct-empty"><strong>{title}</strong><p>{description}</p>{action}</div>; }

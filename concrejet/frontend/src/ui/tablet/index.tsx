import type { ReactNode } from 'react';

export function TabletShell({
  header,
  children,
  footer,
  alert,
  columns = 'minmax(260px, 320px) minmax(0, 1fr) minmax(240px, 300px)',
}: {
  header: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  alert?: ReactNode;
  columns?: string;
}) {
  return (
    <main className="tablet-shell">
      <div className="portrait-warning">Gire o tablet para operar em modo paisagem.</div>
      <div className="tablet-app">
        {header}
        <TabletContent columns={columns}>{children}</TabletContent>
        {alert ? <div className="tablet-alert-slot">{alert}</div> : null}
        {footer}
      </div>
    </main>
  );
}

export function TabletContent({ children, columns }: { children: ReactNode; columns: string }) {
  return (
    <section className="tablet-body" style={{ gridTemplateColumns: columns }}>
      {children}
    </section>
  );
}

export function TabletPanel({ title, children }: { title?: string; children: ReactNode }) {
  return (
    <section className="tablet-panel">
      {title ? <span className="section-label">{title}</span> : null}
      {children}
    </section>
  );
}

export function MachineHeader({
  machine,
  status,
  right,
  context,
}: {
  machine: string;
  status: ReactNode;
  right?: ReactNode;
  context?: ReactNode;
}) {
  const [code, ...name] = machine.split(' - ');
  return (
    <header className="machine-header">
      <div className="machine-plate">
        <strong className="num">{code}</strong>
        <span>{name.join(' - ') || 'Posto de injecao'}</span>
      </div>
      <div className="machine-context">{context}</div>
      {status}
      <div className="machine-header-right">{right}</div>
    </header>
  );
}

export function OperatorHeader({ name, detail }: { name: string; detail: string }) {
  return (
    <div className="operator-header">
      <span>{name}</span>
      <small>{detail}</small>
    </div>
  );
}

export function StatusLamp({
  variant,
  children,
}: {
  variant: 'ok' | 'atencao' | 'parada' | 'ocioso';
  children: ReactNode;
}) {
  return (
    <span className={`status-lamp ${variant}`}>
      <span aria-hidden="true">●</span>
      {children}
    </span>
  );
}

export function TouchButton({
  children,
  variant = 'surface',
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'surface' | 'primary' | 'danger' | 'warning';
}) {
  return (
    <button className={`touch-button ${variant}`} type="button" {...props}>
      {children}
    </button>
  );
}

export function TouchCard({
  title,
  description,
  meta,
  selected,
  disabled,
  onClick,
}: {
  title: string;
  description?: string;
  meta?: string;
  selected?: boolean;
  disabled?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      className={`touch-card ${selected ? 'selected' : ''}`}
      disabled={disabled}
      onClick={onClick}
      type="button"
    >
      <strong>{title}</strong>
      {description ? <span>{description}</span> : null}
      {meta ? <small>{meta}</small> : null}
    </button>
  );
}

export function TouchSelect({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: Array<{ id: string; title: string; description?: string; meta?: string }>;
  value: string;
  onChange: (id: string) => void;
}) {
  return (
    <div className="touch-select">
      <span className="section-label">{label}</span>
      {!options.length ? <div className="tablet-empty">Nenhuma opcao disponivel.</div> : null}
      <div className="touch-grid">
        {options.map((option) => (
          <TouchCard
            key={option.id}
            title={option.title}
            description={option.description}
            meta={option.meta}
            selected={option.id === value}
            onClick={() => onChange(option.id)}
          />
        ))}
      </div>
    </div>
  );
}

export function NumericField({
  label,
  value,
  unit,
  focused,
  onFocus,
}: {
  label: string;
  value: string;
  unit?: string;
  focused?: boolean;
  onFocus: () => void;
}) {
  return (
    <button className={`numeric-field ${focused ? 'focused' : ''}`} type="button" onClick={onFocus}>
      <span>{label}</span>
      <strong className="num">
        {value || '0'}
        {unit ? ` ${unit}` : ''}
      </strong>
    </button>
  );
}

export function NumericKeypad({
  onDigit,
  onBackspace,
  onConfirm,
  allowDecimal,
  onClear,
}: {
  onDigit: (digit: string) => void;
  onBackspace: () => void;
  onConfirm?: () => void;
  allowDecimal?: boolean;
  onClear?: () => void;
}) {
  return (
    <div className="numeric-keypad">
      {'123456789'.split('').map((digit) => (
        <button key={digit} type="button" onClick={() => onDigit(digit)}>
          {digit}
        </button>
      ))}
      <button type="button" disabled={!allowDecimal} onClick={() => onDigit('.')}>
        ,
      </button>
      <button type="button" onClick={() => onDigit('0')}>
        0
      </button>
      <button type="button" onClick={onBackspace}>
        Apagar
      </button>
      {onClear ? (
        <button type="button" onClick={onClear}>
          Limpar
        </button>
      ) : null}
      {onConfirm ? (
        <button className="primary" type="button" onClick={onConfirm}>
          Entrar
        </button>
      ) : null}
    </div>
  );
}

export function TabletActionBar({ children }: { children: ReactNode }) {
  return <footer className="tablet-action-bar">{children}</footer>;
}

export function OperationalStatus({ children }: { children: ReactNode }) {
  return <div className="operational-status">{children}</div>;
}

export const TabletHeader = MachineHeader;

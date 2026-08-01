import type { ReactNode } from 'react';

export function TabletShell({
  header,
  children,
  footer,
  alert,
  columns = '320px 1fr 300px',
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
      {header}
      <section className="tablet-body" style={{ gridTemplateColumns: columns }}>
        {children}
      </section>
      {alert}
      {footer}
    </main>
  );
}

export function MachineHeader({
  machine,
  status,
  right,
}: {
  machine: string;
  status: ReactNode;
  right?: ReactNode;
}) {
  return (
    <header className="machine-header">
      <div>
        <span className="section-label">Máquina</span>
        <strong>{machine}</strong>
      </div>
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
  const icon = variant === 'ok' ? '●' : variant === 'parada' ? '■' : variant === 'atencao' ? '▲' : '○';
  return <span className={`status-lamp ${variant}`}>{icon} {children}</span>;
}

export function TouchCard({
  title,
  description,
  selected,
  disabled,
  onClick,
}: {
  title: string;
  description?: string;
  selected?: boolean;
  disabled?: boolean;
  onClick?: () => void;
}) {
  return (
    <button className={`touch-card ${selected ? 'selected' : ''}`} disabled={disabled} onClick={onClick} type="button">
      <strong>{title}</strong>
      {description ? <span>{description}</span> : null}
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
  options: Array<{ id: string; title: string; description?: string }>;
  value: string;
  onChange: (id: string) => void;
}) {
  return (
    <div className="touch-select">
      <span className="section-label">{label}</span>
      <div className="touch-grid">
        {options.map((option) => (
          <TouchCard
            key={option.id}
            title={option.title}
            description={option.description}
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
      <strong className="num">{value || '0'}{unit ? ` ${unit}` : ''}</strong>
    </button>
  );
}

export function NumericKeypad({
  onDigit,
  onBackspace,
  onConfirm,
  allowDecimal,
}: {
  onDigit: (digit: string) => void;
  onBackspace: () => void;
  onConfirm?: () => void;
  allowDecimal?: boolean;
}) {
  return (
    <div className="numeric-keypad">
      {'123456789'.split('').map((digit) => (
        <button key={digit} type="button" onClick={() => onDigit(digit)}>{digit}</button>
      ))}
      <button type="button" disabled={!allowDecimal} onClick={() => onDigit('.')}> , </button>
      <button type="button" onClick={() => onDigit('0')}>0</button>
      <button type="button" onClick={onBackspace}>Apagar</button>
      {onConfirm ? <button className="primary" type="button" onClick={onConfirm}>Entrar</button> : null}
    </div>
  );
}

export function TabletActionBar({ children }: { children: ReactNode }) {
  return <footer className="tablet-action-bar">{children}</footer>;
}

import React, { useId, forwardRef } from 'react';

interface FieldProps {
  label: string;
  error?: string;
  hint?: string;
  source?: string; // "preenchido automaticamente", "ERP", etc.
  required?: boolean;
  children: React.ReactNode;
  className?: string;
}

/**
 * Wrapper de campo com rótulo permanente (nunca depende só de placeholder).
 */
export const Field: React.FC<FieldProps> = ({
  label,
  error,
  hint,
  source,
  required,
  children,
  className = '',
}) => {
  const generatedInputId = useId();
  const hintId = useId();
  const errorId = useId();
  const childArray = React.Children.toArray(children);
  const firstChild = childArray.find(React.isValidElement);
  const firstChildProps = firstChild?.props as Record<string, unknown> | undefined;
  const inputId = typeof firstChildProps?.id === 'string' ? firstChildProps.id : generatedInputId;

  return (
    <div className={`field ${className}`}>
      <label className="field-label-text" htmlFor={inputId}>
        {label}
        {required && (
          <span aria-label="obrigatório" style={{ color: 'var(--color-amber)', marginLeft: 4 }}>
            *
          </span>
        )}
      </label>
      {/* Passa IDs de acessibilidade via cloneElement */}
      {childArray.map((child) => {
        if (React.isValidElement(child)) {
          const childProps = child.props as Record<string, unknown>;
          const childId = typeof childProps.id === 'string' ? childProps.id : inputId;
          return React.cloneElement(child as React.ReactElement<Record<string, unknown>>, {
            id: childId,
            'aria-describedby':
              [error ? errorId : null, hint ? hintId : null].filter(Boolean).join(' ') || undefined,
            'aria-invalid': error ? true : undefined,
          });
        }
        return child;
      })}
      {source && <span className="field-source">Origem: {source}</span>}
      {hint && !error && (
        <span id={hintId} className="text-xs text-muted">
          {hint}
        </span>
      )}
      {error && (
        <span id={errorId} role="alert" className="field-error">
          <span aria-hidden="true">⚠</span>
          {error}
        </span>
      )}
    </div>
  );
};

// ─── Input texto / numérico ───────────────────────────────────────────────
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  hasError?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ hasError, className = '', ...props }, ref) => (
    <input
      ref={ref}
      className={`input-base ${hasError ? 'is-error' : ''} ${className}`}
      {...props}
    />
  ),
);
Input.displayName = 'Input';

// ─── Select ───────────────────────────────────────────────────────────────
interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  hasError?: boolean;
  placeholder?: string;
  options: { value: string; label: string; disabled?: boolean }[];
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ hasError, placeholder, options, className = '', ...props }, ref) => (
    <select
      ref={ref}
      className={`input-base ${hasError ? 'is-error' : ''} ${className}`}
      style={{ cursor: 'pointer' }}
      {...props}
    >
      {placeholder && (
        <option value="" disabled>
          {placeholder}
        </option>
      )}
      {options.map((opt) => (
        <option key={opt.value} value={opt.value} disabled={opt.disabled}>
          {opt.label}
        </option>
      ))}
    </select>
  ),
);
Select.displayName = 'Select';

// ─── Campo de valor read-only ─────────────────────────────────────────────
interface ReadOnlyFieldProps {
  label: string;
  value: string | number | null | undefined;
  source?: string;
  className?: string;
}

export const ReadOnlyField: React.FC<ReadOnlyFieldProps> = ({
  label,
  value,
  source,
  className = '',
}) => (
  <div className={`field ${className}`}>
    <span className="field-label-text">{label}</span>
    <span className="field-value">
      {value !== null && value !== undefined && value !== '' ? (
        value
      ) : (
        <span style={{ color: 'var(--text-disabled)' }}>—</span>
      )}
    </span>
    {source && <span className="field-source">Origem: {source}</span>}
  </div>
);

// ─── Input numérico com teclado numérico no mobile ────────────────────────
interface NumericInputProps extends Omit<InputProps, 'type' | 'inputMode' | 'pattern'> {
  allowDecimal?: boolean;
}

export const NumericInput = forwardRef<HTMLInputElement, NumericInputProps>(
  ({ allowDecimal = false, ...props }, ref) => (
    <Input
      ref={ref}
      type="text"
      inputMode={allowDecimal ? 'decimal' : 'numeric'}
      pattern={allowDecimal ? '[0-9]*[.,]?[0-9]*' : '[0-9]*'}
      autoComplete="off"
      {...props}
    />
  ),
);
NumericInput.displayName = 'NumericInput';

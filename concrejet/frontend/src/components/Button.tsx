import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'danger' | 'warning' | 'ghost' | 'surface';
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'icon';
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
}

/**
 * Componente Button — design system ConcreTrack.
 *
 * Tamanhos: sm (44px), md (52px), lg (56px), xl (72px)
 * Todos respeitam o mínimo de toque de 44px (52-56px para uso com luvas).
 */
export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  loading = false,
  leftIcon,
  rightIcon,
  fullWidth = false,
  children,
  disabled,
  className = '',
  ...props
}) => {
  const sizeClass = {
    sm: 'btn-sm',
    md: 'btn-md',
    lg: 'btn-lg',
    xl: 'btn-xl',
    icon: 'btn-icon btn-md',
  }[size];

  const variantClass = {
    primary: 'btn-primary',
    danger: 'btn-danger',
    warning: 'btn-warning',
    ghost: 'btn-ghost',
    surface: 'btn-surface',
  }[variant];

  return (
    <button
      className={`btn ${sizeClass} ${variantClass} ${fullWidth ? 'w-full' : ''} ${className}`}
      disabled={disabled ?? loading}
      aria-disabled={disabled ?? loading}
      {...props}
    >
      {loading ? (
        <span className="spinner" aria-hidden="true" />
      ) : (
        leftIcon && (
          <span className="btn-icon-left" aria-hidden="true">
            {leftIcon}
          </span>
        )
      )}
      {children && <span>{children}</span>}
      {!loading && rightIcon && (
        <span className="btn-icon-right" aria-hidden="true">
          {rightIcon}
        </span>
      )}
    </button>
  );
};

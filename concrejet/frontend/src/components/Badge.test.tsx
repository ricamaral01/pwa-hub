import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Badge, OnlineBadge, LossStatusBadge } from './Badge';

describe('Badge', () => {
  it('renderiza com variante online', () => {
    render(<Badge variant="online">Online</Badge>);
    expect(screen.getByRole('status')).toHaveClass('badge-online');
  });

  it('renderiza com variante offline', () => {
    render(<Badge variant="offline">Offline</Badge>);
    expect(screen.getByRole('status')).toHaveClass('badge-offline');
  });

  it('não renderiza dot quando showDot=false', () => {
    const { container } = render(
      <Badge variant="online" showDot={false}>
        Online
      </Badge>,
    );
    expect(container.querySelector('.badge-dot')).not.toBeInTheDocument();
  });
});

describe('OnlineBadge', () => {
  it('exibe "Online" quando online e sem fila', () => {
    render(<OnlineBadge isOnline={true} queueCount={0} />);
    expect(screen.getByText(/online/i)).toBeInTheDocument();
  });

  it('exibe mensagem de offline com contagem', () => {
    render(<OnlineBadge isOnline={false} queueCount={3} />);
    expect(screen.getByText(/3 registros aguardando/i)).toBeInTheDocument();
  });

  it('exibe "Offline" quando offline sem fila', () => {
    render(<OnlineBadge isOnline={false} queueCount={0} />);
    expect(screen.getByText(/offline/i)).toBeInTheDocument();
  });

  it('exibe singular "1 registro aguardando"', () => {
    render(<OnlineBadge isOnline={false} queueCount={1} />);
    expect(screen.getByText(/1 registro aguardando/i)).toBeInTheDocument();
  });
});

describe('LossStatusBadge', () => {
  it('renderiza status normal', () => {
    const { container } = render(<LossStatusBadge status="normal" percent={1.5} limit={5} />);
    expect(container.querySelector('.status-normal')).toBeInTheDocument();
  });

  it('renderiza status crítico', () => {
    const { container } = render(<LossStatusBadge status="critical" percent={10} limit={5} />);
    expect(container.querySelector('.status-critical')).toBeInTheDocument();
  });

  it('inclui percentual e limite no aria-label', () => {
    render(<LossStatusBadge status="attention" percent={3.5} limit={5} />);
    const el = screen.getByRole('status');
    expect(el).toHaveAttribute('aria-label', expect.stringContaining('3.5%'));
    expect(el).toHaveAttribute('aria-label', expect.stringContaining('5%'));
  });
});

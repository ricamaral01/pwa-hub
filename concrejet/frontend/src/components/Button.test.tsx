import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from './Button';

describe('Button', () => {
  it('renderiza com texto', () => {
    render(<Button>Iniciar apontamento</Button>);
    expect(screen.getByText('Iniciar apontamento')).toBeInTheDocument();
  });

  it('fica desabilitado quando disabled=true', () => {
    render(<Button disabled>Concluir</Button>);
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('fica desabilitado quando loading=true', () => {
    render(<Button loading>Salvando</Button>);
    const btn = screen.getByRole('button');
    expect(btn).toBeDisabled();
    expect(btn).toHaveAttribute('aria-disabled', 'true');
  });

  it('exibe spinner quando loading=true', () => {
    const { container } = render(<Button loading>Texto</Button>);
    expect(container.querySelector('.spinner')).toBeInTheDocument();
  });

  it('chama onClick quando clicado e não está desabilitado', async () => {
    const handler = vi.fn();
    const user = userEvent.setup();
    render(<Button onClick={handler}>Clicar</Button>);
    await user.click(screen.getByRole('button'));
    expect(handler).toHaveBeenCalledOnce();
  });

  it('não chama onClick quando desabilitado', async () => {
    const handler = vi.fn();
    const user = userEvent.setup();
    render(
      <Button disabled onClick={handler}>
        Clicar
      </Button>,
    );
    await user.click(screen.getByRole('button'));
    expect(handler).not.toHaveBeenCalled();
  });

  it('aplica a classe btn-primary por padrão', () => {
    render(<Button>Botão</Button>);
    expect(screen.getByRole('button')).toHaveClass('btn-primary');
  });

  it('aplica btn-danger para variant=danger', () => {
    render(<Button variant="danger">Cancelar</Button>);
    expect(screen.getByRole('button')).toHaveClass('btn-danger');
  });

  it('aplica w-full para fullWidth=true', () => {
    render(<Button fullWidth>Concluir</Button>);
    expect(screen.getByRole('button')).toHaveClass('w-full');
  });

  it('aplica btn-xl para size=xl', () => {
    render(<Button size="xl">Grande</Button>);
    expect(screen.getByRole('button')).toHaveClass('btn-xl');
  });
});

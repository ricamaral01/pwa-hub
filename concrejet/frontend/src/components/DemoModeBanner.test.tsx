import { render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

describe('DemoModeBanner', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it('nao aparece no modo normal', async () => {
    vi.stubEnv('VITE_DEMO_MODE', 'false');
    vi.resetModules();
    const { DemoModeBanner } = await import('./DemoModeBanner');

    render(<DemoModeBanner />);

    expect(screen.queryByText('MODO DEMONSTRACAO')).not.toBeInTheDocument();
  });

  it('aparece quando VITE_DEMO_MODE=true', async () => {
    vi.stubEnv('VITE_DEMO_MODE', 'true');
    vi.resetModules();
    const { DemoModeBanner } = await import('./DemoModeBanner');

    render(<DemoModeBanner />);

    expect(screen.getByText('MODO DEMONSTRACAO')).toBeInTheDocument();
    expect(
      screen.getByText('Dados simulados - nenhuma informacao sera enviada ao servidor'),
    ).toBeInTheDocument();
  });
});

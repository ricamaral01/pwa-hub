import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import AnalyticsPage from './AnalyticsPage';
import { apiClient } from '@/api/client';

vi.mock('@/api/client', async () => {
  const actual = await vi.importActual<typeof import('@/api/client')>('@/api/client');
  return {
    ...actual,
    apiClient: {
      get: vi.fn(),
    },
  };
});

describe('AnalyticsPage', () => {
  it('renderiza cards, graficos, filtros e memoria de OEE com dados reais da API', async () => {
    // eslint-disable-next-line @typescript-eslint/unbound-method
    const getMock = vi.mocked(apiClient.get);
    getMock.mockResolvedValueOnce({
      data: {
        periodo: { inicio: '2026-07-27T00:00:00.000Z', fim: '2026-07-30T23:59:59.999Z' },
        resumo: { disponibilidade: 0.9, performance: 0.8, qualidade: 0.95, oee: 0.684 },
        porMaquina: [{ maquinaCodigo: 'INJ-01', oee: 0.684, value: 0.684 }],
        evolucao: [{ label: '2026-07-27', value: 1000 }],
        memoria: {
          tempoBrutoTurnoS: 28800,
          intervalosExcluidosS: 3600,
          indisponibilidadesPlanejadasS: 0,
          tempoPlanejadoS: 25200,
          tempoOperacionalS: 22000,
          quantidadeProduzida: 1000,
          cicloPadraoMedioS: 38,
          cavidadesMedia: 2,
          formulaVersion: 'oee-v1-2026-08-01',
        },
      },
    });

    render(
      <MemoryRouter>
        <AnalyticsPage kind="oee" />
      </MemoryRouter>,
    );

    expect(screen.getByLabelText(/Inicio/i)).toBeInTheDocument();
    await waitFor(() => expect(screen.getByText('Disponibilidade')).toBeInTheDocument());
    expect(screen.getByText('OEE por maquina')).toBeInTheDocument();
    expect(screen.getByText('Memoria de calculo OEE')).toBeInTheDocument();
    expect(screen.getByText('oee-v1-2026-08-01')).toBeInTheDocument();
  });
});

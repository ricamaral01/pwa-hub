import { BadRequestException } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';

describe('AnalyticsService', () => {
  const query = { inicio: '2026-07-27T00:00:00.000Z', fim: '2026-07-30T23:59:59.999Z' };
  const dataSource = {
    query: jest.fn(),
  };
  const plannedTime = {
    calculate: jest.fn(),
  };
  const service = new AnalyticsService(dataSource as never, plannedTime as never);
  const user = { empresaId: '00000000-0000-4000-8000-000000000001' };

  beforeEach(() => {
    dataSource.query.mockReset();
    plannedTime.calculate.mockReset();
  });

  it('valida periodo excessivo antes de consultar o banco', async () => {
    await expect(
      service.production(user, {
        inicio: '2026-01-01T00:00:00.000Z',
        fim: '2027-12-31T00:00:00.000Z',
      }),
    ).rejects.toThrow(BadRequestException);
    expect(dataSource.query).not.toHaveBeenCalled();
  });

  it('reconcilia producao, perdas e OEE com tolerancias explicitas', async () => {
    dataSource.query.mockImplementation((sql: string) => {
      if (sql.includes('count(*)::int as apontamentos')) {
        return Promise.resolve([
          {
            apontamentos: 2,
            apontamentos_concluidos: 2,
            pecas_total: 100,
            pecas_boas: 95,
            pecas_refugo: 5,
            falha_preenchimento: 0,
            ciclo_medio_real_s: 40,
            ciclo_padrao_medio_s: 38,
            desvio_medio_ciclo_s: 2,
          },
        ]);
      }
      if (sql.includes('perda_pecas_kg')) {
        return Promise.resolve([
          {
            pecas_refugo: 5,
            falha_preenchimento: 0,
            borra_kg: 1,
            galho_kg: 1,
            outras_perdas_kg: 1,
            injecao_util_kg: 10,
            perda_pecas_kg: 1,
            perda_total_kg: 4,
            perda_sem_galho_kg: 3,
            perda_reais: 34,
          },
        ]);
      }
      if (sql.includes('tempo_apontado_s')) {
        return Promise.resolve([
          {
            tempo_apontado_s: 1000,
            quantidade_total: 100,
            pecas_boas: 95,
            tempo_ideal_s: 900,
            ciclo_padrao_medio_s: 38,
            cavidades_media: 1,
          },
        ]);
      }
      if (sql.includes('coalesce(sum(pecas_boas),0)::float pecas_boas')) {
        return Promise.resolve([{ pecas_boas: 95, pecas_refugo: 5 }]);
      }
      return Promise.resolve([]);
    });
    plannedTime.calculate.mockResolvedValue({
      tempoBrutoTurnoS: 28800,
      intervalosExcluidosS: 3600,
      indisponibilidadesPlanejadasS: 0,
      tempoPlanejadoLiquidoS: 25200,
      turnos: [{ inicio: '2026-07-27T11:00:00.000Z', fim: '2026-07-27T20:00:00.000Z' }],
      inconsistencias: [],
    });

    const result = await service.reconciliation(user, query);

    expect(result.toleranciaDecimal).toEqual({ unidades: 0, kg: 0.001, indicadores: 0.000001 });
    expect(result.divergencias).toEqual([]);
    expect(result.checks.map((item) => item.nome)).toContain('oee');
  });
});

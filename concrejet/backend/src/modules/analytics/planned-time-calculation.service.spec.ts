import { PlannedTimeCalculationService } from './planned-time-calculation.service';

describe('PlannedTimeCalculationService', () => {
  function service(rows: unknown[]) {
    return new PlannedTimeCalculationService({ query: jest.fn().mockResolvedValue(rows) } as never);
  }

  it('calcula turno parcial com intervalo de refeicao', async () => {
    const result = await service([
      {
        id: 'turno-1',
        unidade_id: 'unidade-1',
        maquina_id: 'maquina-1',
        dia_semana: 1,
        inicio_hora: '08:00:00',
        fim_hora: '17:00:00',
        intervalos_excluidos: [{ inicio: '12:00:00', fim: '13:00:00', motivo: 'Refeicao' }],
        indisponibilidades_planejadas: [],
      },
    ]).calculate({
      empresaId: 'empresa-1',
      inicio: '2026-08-03T11:00:00.000-03:00',
      fim: '2026-08-03T14:00:00.000-03:00',
      unidadeId: 'unidade-1',
      maquinaId: 'maquina-1',
    });

    expect(result.tempoBrutoTurnoS).toBe(10800);
    expect(result.intervalosExcluidosS).toBe(3600);
    expect(result.tempoPlanejadoLiquidoS).toBe(7200);
    expect(result.turnos).toHaveLength(1);
  });

  it('calcula turno noturno cruzando meia-noite', async () => {
    const result = await service([
      {
        id: 'turno-noite',
        unidade_id: 'unidade-1',
        maquina_id: null,
        dia_semana: 1,
        inicio_hora: '22:00:00',
        fim_hora: '06:00:00',
        intervalos_excluidos: [],
        indisponibilidades_planejadas: [],
      },
    ]).calculate({
      empresaId: 'empresa-1',
      inicio: '2026-08-03T21:00:00.000-03:00',
      fim: '2026-08-04T07:00:00.000-03:00',
    });

    expect(result.tempoPlanejadoLiquidoS).toBe(28800);
  });

  it('separa indisponibilidade planejada dos demais intervalos excluidos', async () => {
    const result = await service([
      {
        id: 'turno-1',
        unidade_id: 'unidade-1',
        maquina_id: 'maquina-1',
        dia_semana: 1,
        inicio_hora: '08:00:00',
        fim_hora: '17:00:00',
        intervalos_excluidos: [{ inicio: '12:00:00', fim: '13:00:00', motivo: 'Refeicao' }],
        indisponibilidades_planejadas: [
          { inicio: '15:00:00', fim: '16:00:00', motivo: 'Manutencao' },
        ],
      },
    ]).calculate({
      empresaId: 'empresa-1',
      inicio: '2026-08-03T08:00:00.000-03:00',
      fim: '2026-08-03T17:00:00.000-03:00',
      unidadeId: 'unidade-1',
      maquinaId: 'maquina-1',
    });

    expect(result.intervalosExcluidosS).toBe(7200);
    expect(result.indisponibilidadesPlanejadasS).toBe(3600);
    expect(result.tempoPlanejadoLiquidoS).toBe(25200);
  });

  it('retorna configuracao ausente sem assumir 24 horas', async () => {
    const result = await service([]).calculate({
      empresaId: 'empresa-1',
      inicio: '2026-08-03T00:00:00.000-03:00',
      fim: '2026-08-04T00:00:00.000-03:00',
    });

    expect(result.tempoPlanejadoLiquidoS).toBe(0);
    expect(result.inconsistencias).toContain(
      'Calendario produtivo ausente para o periodo consultado.',
    );
  });
});

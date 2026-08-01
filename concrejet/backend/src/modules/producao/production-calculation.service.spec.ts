import { ProductionCalculationService } from './production-calculation.service';

describe('ProductionCalculationService', () => {
  const service = new ProductionCalculationService();

  it('calcula massas e perda percentual pelo servico central', () => {
    const result = service.calculate({
      pesoPecaAplicadoG: 152.2,
      pecasBoas: 618,
      pecasRefugo: 19,
      falhaPreenchimentoQtd: 0,
      borraKg: 7.085,
      galhoKg: 2.315,
      outrasPerdasKg: 1.135,
    });

    expect(result.massaPecasBoasKg).toBe(94.06);
    expect(result.massaRefugoKg).toBe(2.892);
    expect(result.perdaTotalKg).toBe(13.427);
    expect(result.injecaoComPerdasKg).toBe(107.486);
    expect(result.perdaPct).toBe(12.4916);
  });

  it('trata divisao por zero sem NaN ou Infinity', () => {
    const result = service.calculate({ pesoPecaAplicadoG: 152.2 });

    expect(result.injecaoComPerdasKg).toBe(0);
    expect(result.perdaPct).toBeNull();
  });
});

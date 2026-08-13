import { Injectable } from '@nestjs/common';

export interface ProductionCalculationInput {
  pesoPecaAplicadoG: number;
  pecasBoas?: number;
  pecasRefugo?: number;
  falhaPreenchimentoQtd?: number;
  borraKg?: number;
  galhoKg?: number;
  outrasPerdasKg?: number;
}

export interface ProductionCalculationResult {
  pesoPecaKg: number;
  massaPecasBoasKg: number;
  massaRefugoKg: number;
  perdaTotalKg: number;
  injecaoUtilKg: number;
  injecaoComPerdasKg: number;
  perdaSemGalhoKg: number;
  perdaPct: number | null;
}

@Injectable()
export class ProductionCalculationService {
  calculate(input: ProductionCalculationInput): ProductionCalculationResult {
    const pesoPecaKg = input.pesoPecaAplicadoG / 1000;
    const pecasBoas = input.pecasBoas ?? 0;
    const pecasRefugo = input.pecasRefugo ?? 0;
    const falhaPreenchimentoQtd = input.falhaPreenchimentoQtd ?? 0;
    const borraKg = input.borraKg ?? 0;
    const galhoKg = input.galhoKg ?? 0;
    const outrasPerdasKg = input.outrasPerdasKg ?? 0;

    const massaPecasBoasKg = pecasBoas * pesoPecaKg;
    const massaRefugoKg = (pecasRefugo + falhaPreenchimentoQtd) * pesoPecaKg;
    const perdaTotalKg = massaRefugoKg + borraKg + galhoKg + outrasPerdasKg;
    const injecaoUtilKg = massaPecasBoasKg;
    const injecaoComPerdasKg = injecaoUtilKg + perdaTotalKg;
    const perdaSemGalhoKg = perdaTotalKg - galhoKg;
    const perdaPct = injecaoComPerdasKg > 0 ? (perdaTotalKg / injecaoComPerdasKg) * 100 : null;

    return {
      pesoPecaKg: this.round(pesoPecaKg, 6),
      massaPecasBoasKg: this.round(massaPecasBoasKg),
      massaRefugoKg: this.round(massaRefugoKg),
      perdaTotalKg: this.round(perdaTotalKg),
      injecaoUtilKg: this.round(injecaoUtilKg),
      injecaoComPerdasKg: this.round(injecaoComPerdasKg),
      perdaSemGalhoKg: this.round(perdaSemGalhoKg),
      perdaPct: perdaPct === null ? null : this.round(perdaPct, 4),
    };
  }

  private round(value: number, decimals = 3): number {
    const factor = 10 ** decimals;
    return Math.round((value + Number.EPSILON) * factor) / factor;
  }
}

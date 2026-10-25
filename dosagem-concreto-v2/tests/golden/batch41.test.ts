import { expect, it } from 'vitest';
import fixture from '../../shared/golden/alternative-4.1.json';
import { calculateAlternative41, type AlternativeInput } from '../../src/core/calc/alternative41';
import { calculateBatchCorrection41 } from '../../src/core/calc/batch41';

it('A1 corrige a betonada e o aditivo de 1000 L com os valores da planilha', () => {
  const input = fixture.a1 as AlternativeInput;
  const result = calculateAlternative41(input, 'spreadsheet');
  const batch = calculateBatchCorrection41(result, input.waterEffectiveKg,
    input.admixtures.map(item => item.density), {
      volumeL: 1000, referenceCondition: 'sss',
      aggregates: [{ humidityPct: 11, absorptionPct: 0 }, { humidityPct: 10, absorptionPct: 0 },
        { humidityPct: 0.5, absorptionPct: 0 }],
    });
  expect(batch.weighMassesKg[0]).toBeCloseTo(173.16, 3);
  expect(batch.weighMassesKg[1]).toBeCloseTo(695.2, 3);
  expect(batch.weighMassesKg[2]).toBeCloseTo(1042.185, 3);
  expect(batch.waterToDoseKg).toBeCloseTo(114.455, 3);
  expect(batch.admixtureMassesG[0]).toBeCloseTo(2176, 2);
  expect(batch.admixtureVolumesMl[0]).toBeCloseTo(1996.33, 2);
  expect(batch.waterEffectiveKg).toBeCloseTo(batch.waterToDoseKg + batch.freeWaterKg + batch.waterFromAdmixturesKg, 6);
});

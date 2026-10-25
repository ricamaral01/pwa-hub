import { expect, it } from 'vitest';
import fixture from '../../shared/golden/alternative-4.1.json';
import { calculateAlternative41, referenceAlternative41, type AlternativeInput } from '../../src/core/calc/alternative41';
import { correctMoisture41 } from '../../src/core/calc/moisture41';

it('A1 — método alternativo e betonada corrigida', () => {
  const result = calculateAlternative41(fixture.a1 as AlternativeInput, 'spreadsheet');
  for (const [key, expected] of Object.entries(fixture.a1.expected)) {
    const actual = result[key as keyof typeof result];
    const tolerance = key.endsWith('Fraction') || key.endsWith('Ratio') ? 0.0001 : 0.05;
    if (Array.isArray(expected)) expected.forEach((value, i) => expect(Math.abs((actual as number[])[i] - value)).toBeLessThanOrEqual(tolerance));
    else expect(Math.abs((actual as number) - expected)).toBeLessThanOrEqual(tolerance);
  }
  const moisture = correctMoisture41([
    { referenceMassKg: 156, humidityFraction: 0.11, absorptionFraction: 0 },
    { referenceMassKg: 632, humidityFraction: 0.10, absorptionFraction: 0 },
    { referenceMassKg: 1037, humidityFraction: 0.005, absorptionFraction: 0 }
  ], 'sss', 200);
  [173.16, 695.2, 1042.185].forEach((value, i) => expect(moisture.weighMassesKg[i]).toBeCloseTo(value, 3));
  expect(moisture.waterToDoseKg).toBeCloseTo(114.455, 3);
  expect(result.admixtureMassesKg[0] * 1000 / 1.09).toBeCloseTo(1996.33, 2);
});

it('A2 — frações do miúdo incompletas bloqueiam', () => {
  const data = structuredClone(fixture.a1) as AlternativeInput;
  data.sands[1].volumeFraction = 0.668;
  expect(() => calculateAlternative41(data, 'spreadsheet')).toThrow(/86,8/);
});

it('A3 — frações volumétricas de referência sem aditivo nas britas', () => {
  const result = referenceAlternative41(fixture.a3);
  for (const [key, expected] of Object.entries(fixture.a3.expected)) {
    const actual = result[key as keyof typeof result];
    if (Array.isArray(expected)) expected.forEach((value, i) => expect(Math.abs((actual as number[])[i] - value)).toBeLessThanOrEqual(0.001));
    else expect(Math.abs((actual as number) - expected)).toBeLessThanOrEqual(key === 'admixturePctCement' ? 0.001 : 0.0001);
  }
});

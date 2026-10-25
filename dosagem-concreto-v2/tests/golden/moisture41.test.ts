import { expect, it } from 'vitest';
import fixture from '../../shared/golden/moisture-4.1.json';
import { correctMoisture41 } from '../../src/core/calc/moisture41';

it('P6: SSS, absorção, água livre e identidade de água', () => {
  const result = correctMoisture41(fixture.aggregates, 'sss', fixture.waterEffectiveKg, fixture.waterFromAdmixturesKg);
  for (const [key, expected] of Object.entries(fixture.expected)) {
    const actual = result[key as keyof typeof result];
    if (Array.isArray(expected)) expected.forEach((value, i) => expect(Math.abs((actual as number[])[i] - value)).toBeLessThanOrEqual(0.001));
    else expect(Math.abs((actual as number) - expected)).toBeLessThanOrEqual(0.001);
  }
  expect(result.waterToDoseKg + result.freeWaterKg + fixture.waterFromAdmixturesKg).toBeCloseTo(fixture.waterEffectiveKg, 8);
});

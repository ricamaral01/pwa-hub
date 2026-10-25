import { describe, expect, it } from 'vitest';
import fixture from '../../shared/golden/principal-4.1.json';
import { calculatePrincipal41, type PrincipalInput } from '../../src/core/calc/principal41';

function inputFor(testCase: (typeof fixture.cases)[number]): PrincipalInput {
  const input: PrincipalInput = structuredClone(fixture.base);
  if (testCase.changes?.additionFraction != null) input.additionFraction = testCase.changes.additionFraction;
  if (testCase.changes?.admixture0SolidsFraction != null) input.admixtures[0].solidsFraction = testCase.changes.admixture0SolidsFraction;
  return input;
}

describe('spec 4.1 principal golden', () => {
  for (const testCase of fixture.cases) {
    it(testCase.id, () => {
      const result = calculatePrincipal41(inputFor(testCase), testCase.mode as 'complete' | 'spreadsheet');
      for (const [key, expected] of Object.entries(testCase.expected)) {
        const actual = result[key as keyof typeof result];
        if (Array.isArray(expected)) {
          expect(actual).toBeInstanceOf(Array);
          expected.forEach((value, index) => expect(Math.abs((actual as number[])[index] - value)).toBeLessThanOrEqual(0.05));
        } else {
          const tolerance = key.endsWith('Ratio') ? 0.001 : 0.05;
          expect(Math.abs((actual as number) - expected)).toBeLessThanOrEqual(tolerance);
        }
      }
      if (testCase.mode === 'complete') expect(Math.abs(result.physicalVolumeL - 1000)).toBeLessThanOrEqual(0.05);
      if (testCase.id === 'P7') expect(result.waterLiquidKg + result.waterFromAdmixturesKg).toBeCloseTo(189, 8);
    });
  }
  it('200 valid random mixes close physical volume', () => {
    for (let i = 0; i < 200; i++) {
      const input = structuredClone(fixture.base) as PrincipalInput;
      input.waterEffectiveKg = 150 + i * 0.4;
      input.binderKg = 290 + i * 0.55;
      input.mortarVolumeFraction = 0.4 + (i % 20) * 0.005;
      input.additionFraction = (i % 9) * 0.01;
      input.admixtures[0].solidsFraction = (i % 10) / 10;
      expect(Math.abs(calculatePrincipal41(input).physicalVolumeL - 1000)).toBeLessThanOrEqual(0.05);
    }
  });
});

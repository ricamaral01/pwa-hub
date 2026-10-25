import { expect, it } from 'vitest';
import principal from '../../shared/golden/principal-4.1.json';
import adjustment from '../../shared/golden/adjustment-4.1.json';
import { adjustBatch41 } from '../../src/core/calc/adjustment41';
import type { PrincipalInput } from '../../src/core/calc/principal41';

for (const testCase of adjustment.cases) it(`${testCase.id}: ajuste na betoneira`, () => {
  const result = adjustBatch41(principal.base as PrincipalInput, testCase.mode as 'complete' | 'spreadsheet', adjustment.batchLiters, adjustment.extra);
  for (const [key, expected] of Object.entries(testCase.expected)) {
    const actual = result[key as keyof typeof result];
    if (Array.isArray(expected)) expected.forEach((value, i) => expect(Math.abs((actual as number[])[i] - value)).toBeLessThanOrEqual(0.01));
    else expect(Math.abs((actual as number) - expected)).toBeLessThanOrEqual(0.01);
  }
  if (testCase.mode === 'complete') expect(Math.abs(result.binderCorrectedKg - 332.538)).toBeGreaterThan(0.04);
});

it('P5: adição sem acréscimo conserva 321 kg de aglomerante', () => {
  const data = { ...principal.base, additionFraction: 0.08 } as PrincipalInput;
  const result = adjustBatch41(data, 'complete', 25, {});
  expect(result.binderCorrectedKg).toBeCloseTo(321, 8);
});

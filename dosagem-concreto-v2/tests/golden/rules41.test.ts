import { expect, it } from 'vitest';
import fixture from '../../shared/golden/rules-4.1.json';
import { approvalWaterCement41, normativeSd41, preparationAvailable41, type Preparation, type StrengthResult } from '../../src/core/calc/norms41';
import { regressionAdjustment41 } from '../../src/core/calc/regression41';

it('N1 — condições, sd de 20 resultados em 30 dias e a/c', () => {
  for (const [fck, condition, expected] of fixture.n1.conditions) expect(preparationAvailable41(fck as number, condition as Preparation)).toBe(expected);
  const spread = 1.6 * Math.sqrt(19 / 20);
  const results: StrengthResult[] = Array.from({ length: 20 }, (_, i) => ({ date: `2026-01-${String(i + 1).padStart(2, '0')}`, strength: 30 + (i % 2 ? spread : -spread), family: 'A', valid: true }));
  expect(normativeSd41(results.slice(0, 19), 'B', 'A').sd).toBe(5.5);
  expect(normativeSd41(results, 'B', 'A')).toMatchObject({ sd: 2, normative: true, n: 20 });
  results[19].date = '2026-02-01';
  expect(normativeSd41(results, 'B', 'A')).toMatchObject({ sd: 5.5, normative: false });
  expect(approvalWaterCement41(.58, 'III')).toBe(false);
});

it('R1 — histórico, fatores correlacionados e IC95', () => {
  expect(regressionAdjustment41(fixture.r1.historical).recommend).toBe(false);
  const correlated = regressionAdjustment41(fixture.r1.correlated);
  expect(correlated.recommend).toBe(false);
  expect(correlated.reason).toMatch(/variaram juntos/);
  const independent = regressionAdjustment41(fixture.r1.independent);
  expect(independent.recommend).toBe(true);
  expect(independent.adjustedR2!).toBeGreaterThanOrEqual(.6);
  expect(independent.confidence95).toHaveLength(3);
  independent.confidence95!.forEach(([low, high], i) => {
    expect(low).toBeLessThan(independent.coefficients![i]);
    expect(high).toBeGreaterThan(independent.coefficients![i]);
  });
});

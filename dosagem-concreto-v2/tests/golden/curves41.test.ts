import { describe, expect, it } from 'vitest';
import fixture from '../../shared/golden/curves-4.1.json';
import { fitAbrams41, fitAge41, projectAbrams41, type Pair } from '../../src/core/calc/curves41';
import { optimizeRetained41 } from '../../src/core/calc/optimization41';

const near = (actual: number, target: number, tol: number) => expect(Math.abs(actual - target)).toBeLessThanOrEqual(tol);

describe('spec 4.1 P2/I1/O1', () => {
  it('P2 — potência, exponencial e tabela', () => {
    const pairs = fixture.abrams.pairs as Pair[];
    const fit = fitAbrams41(pairs);
    for (const [key, target] of Object.entries(fixture.abrams.expected)) near(fit[key as keyof typeof fit], target, key.includes('R2') ? 0.00001 : 0.0005);
    for (const [fck, sd, fcj, ratio, water, cement] of fixture.abrams.project) {
      const result = projectAbrams41(pairs, fixture.abrams.waterPairs as Pair[], fck, sd);
      near(result.fcj, fcj, 0.00001);
      near(result.ratio, ratio, 0.0001);
      expect(result.water).toBe(water);
      expect(result.cement).toBe(cement);
    }
    expect(projectAbrams41(pairs, fixture.abrams.waterPairs as Pair[], 40, 5).extrapolation).toBe(true);
  });
  it('I1 — curva de idade e extrapolação', () => {
    const fit = fitAge41(fixture.age.pairs as Pair[]);
    near(fit.fc28, fixture.age.expected.fc28, 0.001);
    near(fit.s, fixture.age.expected.s, 0.00001);
    near(fit.r2, fixture.age.expected.r2, 0.00001);
    for (const [days, expected] of [[0.5, fixture.age.expected.twelveHours], [0.75, fixture.age.expected.eighteenHours], [1, fixture.age.expected.oneDay]]) {
      const estimate = fit.estimate(days);
      near(estimate.strength, expected, 0.01);
      expect(estimate.extrapolation).toBe(true);
    }
    near(fit.daysTo(15), fixture.age.expected.daysTo15, 0.001);
  });
  it('O1 — otimização das areias em grade 0,1 %', () => {
    const data = fixture.sandOptimization;
    const result = optimizeRetained41(data.retained, data.targetCumulative, [data.currentFirstFraction, 1 - data.currentFirstFraction], 0.001);
    near(result.best.firstFraction, data.expected.bestFirstFraction, 0.00001);
    near(result.best.squaredError, data.expected.bestSquaredError, 0.001);
    near(result.current.squaredError, data.expected.currentSquaredError, 0.001);
    near(result.current.fineness, data.expected.currentFineness, 0.001);
    near(result.best.fineness, data.expected.bestFineness, 0.001);
  });
});

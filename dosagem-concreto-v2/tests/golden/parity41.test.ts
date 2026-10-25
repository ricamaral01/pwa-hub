import { expect, it } from 'vitest';
import { execFileSync } from 'node:child_process';
import principal from '../../shared/golden/principal-4.1.json';
import alternative from '../../shared/golden/alternative-4.1.json';
import adjustment from '../../shared/golden/adjustment-4.1.json';
import curves from '../../shared/golden/curves-4.1.json';
import moisture from '../../shared/golden/moisture-4.1.json';
import rules from '../../shared/golden/rules-4.1.json';
import { calculatePrincipal41, type PrincipalInput } from '../../src/core/calc/principal41';
import { calculateAlternative41, referenceAlternative41, type AlternativeInput } from '../../src/core/calc/alternative41';
import { adjustBatch41 } from '../../src/core/calc/adjustment41';
import { fitAbrams41, fitAge41, type Pair } from '../../src/core/calc/curves41';
import { correctMoisture41 } from '../../src/core/calc/moisture41';
import { optimizeRetained41 } from '../../src/core/calc/optimization41';
import { normativeSd41, type StrengthResult } from '../../src/core/calc/norms41';
import { regressionAdjustment41 } from '../../src/core/calc/regression41';
import { calculateRecipe41, presentation41, type Recipe41 } from '../../src/core/calc/view41';

const script = new URL('../../api/app/calc/parity41.py', import.meta.url).pathname.replace(/^\/(\w:)/, '$1');
function python(kind: string, data: unknown) {
  return JSON.parse(execFileSync('python', [script], { input: JSON.stringify({ kind, data }), encoding: 'utf8', env: { ...process.env, PYTHONIOENCODING: 'utf-8' } }));
}
function equalNumeric(left: unknown, right: unknown, key = ''): void {
  if (typeof left === 'number' && typeof right === 'number') { expect(Math.abs(left - right), key).toBeLessThanOrEqual(1e-8); return; }
  if (Array.isArray(left) && Array.isArray(right)) { expect(left.length).toBe(right.length); left.forEach((v, i) => equalNumeric(v, right[i], `${key}[${i}]`)); return; }
  if (left && right && typeof left === 'object' && typeof right === 'object') {
    for (const [k, v] of Object.entries(left)) if (k in right) equalNumeric(v, (right as Record<string, unknown>)[k], `${key}.${k}`);
    return;
  }
  expect(left).toEqual(right);
}

it('paridade direta TS × Python dos casos 4.1', () => {
  for (const testCase of principal.cases) {
    const input = structuredClone(principal.base) as PrincipalInput;
    if (testCase.changes?.additionFraction != null) input.additionFraction = testCase.changes.additionFraction;
    if (testCase.changes?.admixture0SolidsFraction != null) input.admixtures[0].solidsFraction = testCase.changes.admixture0SolidsFraction;
    equalNumeric(calculatePrincipal41(input, testCase.mode as 'complete' | 'spreadsheet'), python('principal', { input, mode: testCase.mode }), testCase.id);
  }
  equalNumeric(correctMoisture41(moisture.aggregates, 'sss', 200), python('moisture', moisture), 'P6');
  for (const testCase of adjustment.cases) equalNumeric(
    adjustBatch41(principal.base as PrincipalInput, testCase.mode as 'complete' | 'spreadsheet', adjustment.batchLiters, adjustment.extra),
    python('adjustment', { input: principal.base, mode: testCase.mode, batchLiters: adjustment.batchLiters, extras: adjustment.extra }), testCase.id);
  equalNumeric(calculateAlternative41(alternative.a1 as AlternativeInput, 'spreadsheet'), python('alternative', { input: alternative.a1, mode: 'spreadsheet' }), 'A1');
  equalNumeric(referenceAlternative41(alternative.a3), python('reference', alternative.a3), 'A3');
  equalNumeric(fitAbrams41(curves.abrams.pairs as Pair[]), python('abrams', curves.abrams.pairs), 'P2');
  const age = fitAge41(curves.age.pairs as Pair[]);
  equalNumeric({ fc28: age.fc28, s: age.s, r2: age.r2 }, python('age', curves.age.pairs), 'I1');
  equalNumeric(optimizeRetained41(curves.sandOptimization.retained, curves.sandOptimization.targetCumulative, [.2, .8], .001),
    python('optimization', { retained: curves.sandOptimization.retained, targetCumulative: curves.sandOptimization.targetCumulative, current: [.2, .8], step: .001 }), 'O1');
  const spread = 1.6 * Math.sqrt(19 / 20);
  const results: StrengthResult[] = Array.from({ length: 20 }, (_, i) => ({ date: `2026-01-${String(i + 1).padStart(2, '0')}`, strength: 30 + (i % 2 ? spread : -spread), family: 'A', valid: true }));
  equalNumeric(normativeSd41(results, 'B', 'A'), python('norms', { results, condition: 'B', family: 'A' }), 'N1');
  equalNumeric(regressionAdjustment41(rules.r1.independent), python('regression', rules.r1.independent), 'R1');
  for (const recipe of [
    { metodo: 'principal_abrams', balanco: 'complete', metodoDados: principal.base, custosRsKg: { m0: .78, m2: .085, m7: 9.5 } },
    { metodo: 'alternativo_concrefer', balanco: 'spreadsheet', metodoDados: alternative.a1, custosRsKg: { m0: .78, m2: .085, m5: 9.5 } }
  ] as Recipe41[]) {
    const client = calculateRecipe41(recipe);
    const server = python('traco', recipe) as { result: Record<string, unknown>; summary: Record<string, unknown>; items: Array<{ massaKgM3: number; massaEspecificaKgDm3: number; custoRsM3: number }> };
    equalNumeric(client.result, server.result, `${recipe.metodo}.result`);
    equalNumeric(client.summary, server.summary, `${recipe.metodo}.summary`);
    client.items.forEach((item, i) => {
      equalNumeric(item.massaKgM3, server.items[i].massaKgM3, `${recipe.metodo}.item${i}.mass`);
      equalNumeric(item.massaEspecificaKgDm3, server.items[i].massaEspecificaKgDm3, `${recipe.metodo}.item${i}.density`);
      equalNumeric(item.custoRsM3, server.items[i].custoRsM3, `${recipe.metodo}.item${i}.cost`);
    });
    expect(presentation41(client).letter.physicalVolumeL).toBeCloseTo(server.result.physicalVolumeL as number, 8);
  }
}, 60_000);

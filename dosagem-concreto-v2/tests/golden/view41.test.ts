import { expect, it } from 'vitest';
import principal from '../../shared/golden/principal-4.1.json';
import alternative from '../../shared/golden/alternative-4.1.json';
import { calculateRecipe41, presentation41, type Recipe41 } from '../../src/core/calc/view41';

for (const recipe of [
  { metodo: 'principal_abrams', balanco: 'complete', metodoDados: principal.base },
  { metodo: 'alternativo_concrefer', balanco: 'spreadsheet', metodoDados: alternative.a1 }
] as Recipe41[]) it(`X1 local — ${recipe.metodo} usa o mesmo resultado nas quatro superfícies`, () => {
  const calculation = calculateRecipe41(recipe);
  const views = presentation41(calculation);
  expect(views.panel).toBe(views.comparison);
  expect(views.panel).toBe(views.letter);
  expect(views.panel).toBe(views.print);
  expect(calculation.summary.physicalVolumeL).toBe(calculation.result.physicalVolumeL);
  expect(calculation.summary.alpha).toBe(calculation.result.mortarMassFraction);
  expect(calculation.summary.alpha).toBeCloseTo(recipe.metodo === 'principal_abrams' ? 0.4880 : 0.5234, 4);
  expect(calculation.items.reduce((sum, item) => sum + item.massaKgM3 / item.massaEspecificaKgDm3, 0)
    + (recipe.metodoDados.airFraction * 1000)).toBeCloseTo(recipe.metodo === 'principal_abrams' || recipe.balanco === 'complete' ? calculation.result.physicalVolumeL : calculation.result.physicalVolumeL + calculation.result.minorVolumeL, 6);
});

import { calculatePrincipal41, type PrincipalInput } from './principal41';
import { calculateAlternative41, type AlternativeInput } from './alternative41';

export type Recipe41 = ({ metodo: 'principal_abrams'; balanco: 'complete' | 'spreadsheet'; metodoDados: PrincipalInput }
  | { metodo: 'alternativo_concrefer'; balanco: 'complete' | 'spreadsheet'; metodoDados: AlternativeInput })
  & { custosRsKg?: Record<string, number> };
export type RecipeItem41 = { id: string; nome: string; categoria: string; massaKgM3: number; massaEspecificaKgDm3: number; custoRsKg: number; custoRsM3: number };

export function calculateRecipe41(recipe: Recipe41) {
  const data = recipe.metodoDados;
  const result = recipe.metodo === 'principal_abrams'
    ? calculatePrincipal41(data as PrincipalInput, recipe.balanco)
    : calculateAlternative41(data as AlternativeInput, recipe.balanco);
  const raw: Array<[string, number, number]> = [
    ['cimento', result.cementKg, data.cementDensity],
    ['adicao', result.additionKg, data.additionDensity],
    ...result.sandMassesKg.map((mass, i): [string, number, number] => ['areia', mass, data.sands[i].density]),
    ...result.gravelMassesKg.map((mass, i): [string, number, number] => ['brita', mass, data.gravels[i].density]),
    ['agua', result.waterLiquidKg, 1],
    ...result.admixtureMassesKg.map((mass, i): [string, number, number] => ['aditivo', mass, data.admixtures[i].density]),
  ];
  if (recipe.metodo === 'principal_abrams' && 'minorAdditionMassesKg' in result) {
    const principal = recipe.metodoDados;
    raw.push(...result.minorAdditionMassesKg.map((mass, i): [string, number, number] => ['outro', mass, principal.minorAdditions[i].density]));
  }
  const costs = recipe.custosRsKg || {};
  if (Object.values(costs).some(cost => !Number.isFinite(cost) || cost < 0)) throw new Error('Custo unitário inválido');
  const items: RecipeItem41[] = raw.map(([categoria, massaKgM3, massaEspecificaKgDm3], i) => ({
    id: `m${i}`, nome: `${categoria} ${i + 1}`, categoria, massaKgM3, massaEspecificaKgDm3,
    custoRsKg: costs[`m${i}`] || 0, custoRsM3: massaKgM3 * (costs[`m${i}`] || 0)
  })).filter(item => item.massaKgM3 > 0);
  const ratio = data.waterEffectiveKg / result.cementKg;
  const summary = { cementKg: result.cementKg, waterEffectiveKg: data.waterEffectiveKg, waterLiquidKg: result.waterLiquidKg,
    physicalVolumeL: result.physicalVolumeL, waterCementRatio: ratio, waterBinderRatio: result.waterBinderRatio,
    sandKg: result.sandMassesKg.reduce((a, b) => a + b, 0), gravelKg: result.gravelMassesKg.reduce((a, b) => a + b, 0),
    alpha: result.mortarMassFraction, costRsM3: items.reduce((sum, item) => sum + item.custoRsM3, 0),
    ...('finesKg' in result ? { finesKg: result.finesKg } : {}) };
  return { result, items, summary };
}

export function presentation41(calculation: ReturnType<typeof calculateRecipe41>) {
  // All surfaces use this one calculated value; letter/print do not recalculate.
  return { panel: calculation.summary, comparison: calculation.summary, letter: calculation.summary, print: calculation.summary };
}

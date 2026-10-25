export type AggregateFraction = { fraction: number; density: number };
export type BinderFraction = { fractionOfBinder: number; density: number };
export type AdmixtureFraction = BinderFraction & { solidsFraction?: number };

export type PrincipalInput = {
  waterEffectiveKg: number;
  binderKg: number;
  additionFraction: number;
  cementDensity: number;
  additionDensity: number;
  mortarVolumeFraction: number;
  airFraction: number;
  sands: AggregateFraction[];
  gravels: AggregateFraction[];
  admixtures: AdmixtureFraction[];
  minorAdditions: BinderFraction[];
};

export type PrincipalMode = 'complete' | 'spreadsheet';

function finitePositive(value: number, name: string, allowZero = false): void {
  if (!Number.isFinite(value) || (allowZero ? value < 0 : value <= 0)) throw new Error(`${name}: valor inválido`);
}

function groupVolumeMasses(volume: number, group: AggregateFraction[], name: string): number[] {
  if (!group.length || group.length > 3) throw new Error(`${name}: informe de uma a três frações`);
  for (const part of group) {
    finitePositive(part.fraction, `${name}.fraction`, true);
    finitePositive(part.density, `${name}.density`);
  }
  if (Math.abs(group.reduce((sum, part) => sum + part.fraction, 0) - 1) > 0.001) throw new Error(`${name}: frações devem somar 1`);
  const denominator = group.reduce((sum, part) => sum + part.fraction / part.density, 0);
  return group.map(part => volume * part.fraction / denominator);
}

export function calculatePrincipal41(input: PrincipalInput, mode: PrincipalMode = 'complete') {
  for (const [name, value] of Object.entries({
    waterEffectiveKg: input.waterEffectiveKg, binderKg: input.binderKg,
    cementDensity: input.cementDensity, additionDensity: input.additionDensity
  })) finitePositive(value, name);
  for (const [name, value] of Object.entries({ additionFraction: input.additionFraction, airFraction: input.airFraction, mortarVolumeFraction: input.mortarVolumeFraction })) {
    finitePositive(value, name, true);
    if (value >= 1) throw new Error(`${name}: deve ser menor que 1`);
  }
  const cementKg = input.binderKg * (1 - input.additionFraction);
  const additionKg = input.binderKg * input.additionFraction;
  const admixtureMassesKg = input.admixtures.map(part => {
    finitePositive(part.fractionOfBinder, 'admixture.fractionOfBinder', true);
    finitePositive(part.density, 'admixture.density');
    if (part.solidsFraction != null && (!Number.isFinite(part.solidsFraction) || part.solidsFraction < 0 || part.solidsFraction > 1)) throw new Error('admixture.solidsFraction: valor inválido');
    return input.binderKg * part.fractionOfBinder;
  });
  const minorAdditionMassesKg = input.minorAdditions.map(part => {
    finitePositive(part.fractionOfBinder, 'minor.fractionOfBinder', true);
    finitePositive(part.density, 'minor.density');
    return input.binderKg * part.fractionOfBinder;
  });
  const minorVolumeL = input.admixtures.reduce((sum, part, i) => sum + admixtureMassesKg[i] / part.density, 0)
    + input.minorAdditions.reduce((sum, part, i) => sum + minorAdditionMassesKg[i] / part.density, 0);
  const waterFromAdmixturesKg = mode === 'complete'
    ? input.admixtures.reduce((sum, part, i) => sum + admixtureMassesKg[i] * (part.solidsFraction == null ? 0 : 1 - part.solidsFraction), 0)
    : 0;
  const waterLiquidKg = input.waterEffectiveKg - waterFromAdmixturesKg;
  if (waterLiquidKg < 0) throw new Error('Água líquida negativa');
  const solidVolumeL = 1000 - 1000 * input.airFraction - waterLiquidKg - (mode === 'complete' ? minorVolumeL : 0);
  const sandVolumeL = input.mortarVolumeFraction * solidVolumeL - cementKg / input.cementDensity - additionKg / input.additionDensity;
  const gravelVolumeL = (1 - input.mortarVolumeFraction) * solidVolumeL;
  if (sandVolumeL < 0 || gravelVolumeL < 0) throw new Error('Volume de agregado negativo');
  const sandMassesKg = groupVolumeMasses(sandVolumeL, input.sands, 'sands');
  const gravelMassesKg = groupVolumeMasses(gravelVolumeL, input.gravels, 'gravels');
  const physicalVolumeL = 1000 * input.airFraction + waterLiquidKg + cementKg / input.cementDensity + additionKg / input.additionDensity
    + sandMassesKg.reduce((sum, mass, i) => sum + mass / input.sands[i].density, 0)
    + gravelMassesKg.reduce((sum, mass, i) => sum + mass / input.gravels[i].density, 0)
    + (mode === 'complete' ? minorVolumeL : 0);
  return {
    cementKg, additionKg, admixtureMassesKg, minorAdditionMassesKg,
    waterFromAdmixturesKg, waterLiquidKg, minorVolumeL,
    solidVolumeL, sandVolumeL, gravelVolumeL, sandMassesKg, gravelMassesKg,
    physicalVolumeL, outsideBalanceL: mode === 'spreadsheet' ? minorVolumeL : 0,
    waterCementRatio: input.waterEffectiveKg / cementKg,
    waterBinderRatio: input.waterEffectiveKg / input.binderKg,
    mortarMassFraction: (input.binderKg + sandMassesKg.reduce((a, b) => a + b, 0)) /
      (input.binderKg + sandMassesKg.reduce((a, b) => a + b, 0) + gravelMassesKg.reduce((a, b) => a + b, 0))
  };
}

export type AlternativePart = { volumeFraction: number; density: number; finesFraction?: number };
export type AlternativeInput = {
  waterEffectiveKg: number; waterCementRatio: number; additionFractionOfCement: number;
  cementDensity: number; additionDensity: number; mortarVolumeFraction: number; airFraction: number;
  sands: AlternativePart[]; gravels: AlternativePart[];
  admixtures: { fraction: number; base: 'cement' | 'binder'; density: number; solidsFraction?: number }[];
};

function checkGroup(parts: AlternativePart[], label: string) {
  if (!parts.length || parts.length > 3 || parts.some(p => !Number.isFinite(p.volumeFraction) || p.volumeFraction < 0 || !Number.isFinite(p.density) || p.density <= 0)) throw new Error(`${label}: frações inválidas`);
  const total = parts.reduce((sum, part) => sum + part.volumeFraction, 0);
  if (Math.abs(total - 1) > 0.001) throw new Error(`frações do ${label} somam ${(total * 100).toLocaleString('pt-BR', { maximumFractionDigits: 1 })} %`);
}

export function calculateAlternative41(input: AlternativeInput, mode: 'complete' | 'spreadsheet' = 'complete') {
  checkGroup(input.sands, 'miúdo'); checkGroup(input.gravels, 'graúdo');
  if (![input.waterEffectiveKg, input.waterCementRatio, input.cementDensity, input.additionDensity].every(x => Number.isFinite(x) && x > 0)
    || ![input.additionFractionOfCement, input.airFraction, input.mortarVolumeFraction].every(x => Number.isFinite(x) && x >= 0 && x < 1)) throw new Error('Entradas inválidas');
  const cementKg = Math.round(input.waterEffectiveKg / input.waterCementRatio);
  const additionKg = cementKg * input.additionFractionOfCement;
  const binderKg = cementKg + additionKg;
  const admixtureMassesKg = input.admixtures.map(a => Math.round(a.fraction * (a.base === 'cement' ? cementKg : binderKg) * 1000) / 1000);
  const minorVolumeL = input.admixtures.reduce((sum, a, i) => sum + admixtureMassesKg[i] / a.density, 0);
  const waterFromAdmixturesKg = mode === 'complete' ? input.admixtures.reduce((sum, a, i) => sum + (a.solidsFraction == null ? 0 : admixtureMassesKg[i] * (1 - a.solidsFraction)), 0) : 0;
  const waterLiquidKg = input.waterEffectiveKg - waterFromAdmixturesKg;
  if (waterLiquidKg < 0) throw new Error('Água líquida negativa');
  const gravelVolumeL = (1000 - 1000 * input.airFraction - waterLiquidKg - (mode === 'complete' ? minorVolumeL : 0)) * (1 - input.mortarVolumeFraction);
  const gravelMassesKg = input.gravels.map(part => Math.round(gravelVolumeL * part.volumeFraction * part.density));
  const fixedVolumeL = cementKg / input.cementDensity + additionKg / input.additionDensity + gravelMassesKg.reduce((sum, mass, i) => sum + mass / input.gravels[i].density, 0) + waterLiquidKg + (mode === 'complete' ? minorVolumeL : 0);
  const sandVolumeL = 1000 - 1000 * input.airFraction - fixedVolumeL;
  if (sandVolumeL < 0) throw new Error('Volume de areia negativo');
  const sandMassesKg = input.sands.map(part => Math.round(sandVolumeL * part.volumeFraction * part.density));
  const sandKg = sandMassesKg.reduce((a, b) => a + b, 0), gravelKg = gravelMassesKg.reduce((a, b) => a + b, 0);
  const physicalVolumeL = 1000 * input.airFraction + fixedVolumeL + sandMassesKg.reduce((sum, mass, i) => sum + mass / input.sands[i].density, 0);
  return { cementKg, additionKg, gravelVolumeL, gravelMassesKg, fixedVolumeL, sandVolumeL, sandMassesKg,
    admixtureMassesKg, minorVolumeL, waterFromAdmixturesKg, waterLiquidKg, physicalVolumeL,
    totalMassKg: binderKg + sandKg + gravelKg + input.waterEffectiveKg + admixtureMassesKg.reduce((a, b) => a + b, 0),
    waterBinderRatio: input.waterEffectiveKg / binderKg, mortarMassFraction: (binderKg + sandKg) / (binderKg + sandKg + gravelKg),
    sandAggregateFraction: sandKg / (sandKg + gravelKg), waterDryFraction: input.waterEffectiveKg / (binderKg + sandKg + gravelKg),
    finesKg: cementKg + sandMassesKg.reduce((sum, mass, i) => sum + mass * (input.sands[i].finesFraction ?? 0), 0)
      + gravelMassesKg.reduce((sum, mass, i) => sum + mass * (input.gravels[i].finesFraction ?? 0), 0) };
}

export function referenceAlternative41(input: { cementKg: number; sandMassesKg: number[]; sandDensities: number[]; gravelMassesKg: number[]; gravelDensities: number[]; admixtureKg: number; waterKg: number }) {
  const volumes = (masses: number[], densities: number[]) => masses.map((mass, i) => mass / densities[i]);
  const sandVolumes = volumes(input.sandMassesKg, input.sandDensities), gravelVolumes = volumes(input.gravelMassesKg, input.gravelDensities);
  const normalize = (values: number[]) => values.map(v => v / values.reduce((a, b) => a + b, 0));
  const sandKg = input.sandMassesKg.reduce((a, b) => a + b, 0), gravelKg = input.gravelMassesKg.reduce((a, b) => a + b, 0);
  return { sandVolumeFractions: normalize(sandVolumes), gravelVolumeFractions: normalize(gravelVolumes),
    mortarMassFraction: (input.cementKg + sandKg) / (input.cementKg + sandKg + gravelKg),
    waterCementRatio: input.waterKg / input.cementKg, admixturePctCement: input.admixtureKg / input.cementKg * 100 };
}

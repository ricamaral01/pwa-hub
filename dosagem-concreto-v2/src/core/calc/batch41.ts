import { correctMoisture41, type ReferenceCondition } from './moisture41';

export type BatchCorrectionInput41 = {
  volumeL: number;
  referenceCondition: ReferenceCondition;
  aggregates: { humidityPct: number; absorptionPct: number }[];
};

export function calculateBatchCorrection41(
  result: { sandMassesKg: number[]; gravelMassesKg: number[]; admixtureMassesKg: number[]; waterFromAdmixturesKg: number },
  waterEffectiveKgM3: number,
  admixtureDensities: number[],
  input: BatchCorrectionInput41,
) {
  const { volumeL, aggregates, referenceCondition } = input;
  const masses = [...result.sandMassesKg, ...result.gravelMassesKg];
  if (!Number.isFinite(volumeL) || volumeL <= 0 || volumeL > 100_000 || aggregates.length !== masses.length ||
      admixtureDensities.length !== result.admixtureMassesKg.length ||
      admixtureDensities.some(density => !Number.isFinite(density) || density <= 0) ||
      aggregates.some(({ humidityPct, absorptionPct }) =>
        !Number.isFinite(humidityPct) || !Number.isFinite(absorptionPct) ||
        humidityPct < 0 || humidityPct > 100 || absorptionPct < 0 || absorptionPct > 100)) {
    throw new Error('Volume, umidade ou absorção da betonada inválidos');
  }
  const scale = volumeL / 1000;
  const correction = correctMoisture41(masses.map((referenceMassKg, index) => ({
    referenceMassKg: referenceMassKg * scale,
    humidityFraction: aggregates[index].humidityPct / 100,
    absorptionFraction: aggregates[index].absorptionPct / 100,
  })), referenceCondition, waterEffectiveKgM3 * scale, result.waterFromAdmixturesKg * scale);
  const admixtureMassesKg = result.admixtureMassesKg.map(mass => mass * scale);
  const admixtureVolumesMl = admixtureMassesKg.map((mass, index) => mass / admixtureDensities[index] * 1000);
  return {
    volumeL, referenceCondition, ...correction,
    waterEffectiveKg: waterEffectiveKgM3 * scale,
    waterFromAdmixturesKg: result.waterFromAdmixturesKg * scale,
    admixtureMassesKg,
    admixtureMassesG: admixtureMassesKg.map(mass => mass * 1000),
    admixtureVolumesMl,
  };
}

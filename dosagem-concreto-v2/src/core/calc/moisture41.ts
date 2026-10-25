export type AggregateMoisture = { referenceMassKg: number; humidityFraction: number; absorptionFraction: number };
export type ReferenceCondition = 'dry' | 'sss';

export function correctMoisture41(aggregates: AggregateMoisture[], referenceCondition: ReferenceCondition,
  waterEffectiveKg: number, waterFromAdmixturesKg = 0) {
  if (!['dry', 'sss'].includes(referenceCondition) || !Number.isFinite(waterEffectiveKg) || !Number.isFinite(waterFromAdmixturesKg)
    || waterEffectiveKg < 0 || waterFromAdmixturesKg < 0 || waterFromAdmixturesKg > waterEffectiveKg) throw new Error('Água ou referência inválida');
  const dryMassesKg = aggregates.map(a => {
    if (![a.referenceMassKg, a.humidityFraction, a.absorptionFraction].every(Number.isFinite)
      || a.referenceMassKg < 0 || a.humidityFraction < 0 || a.absorptionFraction < 0) throw new Error('Agregado inválido');
    return referenceCondition === 'dry' ? a.referenceMassKg : a.referenceMassKg / (1 + a.absorptionFraction);
  });
  const weighMassesKg = aggregates.map((a, i) => dryMassesKg[i] * (1 + a.humidityFraction));
  const freeWaterKg = aggregates.reduce((sum, a, i) => sum + dryMassesKg[i] * (a.humidityFraction - a.absorptionFraction), 0);
  const waterToDoseKg = waterEffectiveKg - waterFromAdmixturesKg - freeWaterKg;
  if (waterToDoseKg < 0) throw new Error('Água dosada negativa');
  return { dryMassesKg, weighMassesKg, freeWaterKg, waterToDoseKg };
}

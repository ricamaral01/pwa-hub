import { calculatePrincipal41, type PrincipalInput, type PrincipalMode } from './principal41';

export type BatchExtras = {
  cementKg?: number; additionKg?: number; sandWetKg?: number[]; gravelWetKg?: number[];
  aggregateHumidity?: number[]; waterKg?: number; admixtureKg?: number[]; minorAdditionKg?: number[];
};

export function adjustBatch41(input: PrincipalInput, mode: PrincipalMode, batchLiters: number, extras: BatchExtras) {
  if (!Number.isFinite(batchLiters) || batchLiters <= 0) throw new Error('Betonada inválida');
  const original = calculatePrincipal41(input, mode);
  const factor = batchLiters / 1000;
  const cementBatch = original.cementKg * factor + (extras.cementKg ?? 0);
  const additionBatch = original.additionKg * factor + (extras.additionKg ?? 0);
  const binderBatch = cementBatch + additionBatch;
  if (binderBatch <= 0) throw new Error('Aglomerante inválido');
  const humidity = extras.aggregateHumidity ?? [];
  let waterExtra = 0;
  const adjustedGroup = (masses: number[], wet: number[], offset: number) => masses.map((mass, i) => {
    const h = humidity[offset + i] ?? 0;
    if (!Number.isFinite(h) || h < 0) throw new Error('Umidade inválida');
    const additionDry = (wet[i] ?? 0) / (1 + h);
    waterExtra += (wet[i] ?? 0) - additionDry;
    return mass * factor + additionDry;
  });
  const sandsBatch = adjustedGroup(original.sandMassesKg, extras.sandWetKg ?? [], 0);
  const gravelsBatch = adjustedGroup(original.gravelMassesKg, extras.gravelWetKg ?? [], original.sandMassesKg.length);
  const admixturesBatch = original.admixtureMassesKg.map((mass, i) => mass * factor + (extras.admixtureKg?.[i] ?? 0));
  const minorsBatch = original.minorAdditionMassesKg.map((mass, i) => mass * factor + (extras.minorAdditionKg?.[i] ?? 0));
  const waterBatch = original.waterLiquidKg * factor + (extras.waterKg ?? 0) + waterExtra;
  const perBinder = (masses: number[]) => masses.map(mass => mass / binderBatch);
  const sandUnit = perBinder(sandsBatch), gravelUnit = perBinder(gravelsBatch);
  const admixtureUnit = perBinder(admixturesBatch), minorUnit = perBinder(minorsBatch);
  const waterUnit = waterBatch / binderBatch;
  const volumePerBinder = cementBatch / binderBatch / input.cementDensity + additionBatch / binderBatch / input.additionDensity
    + sandUnit.reduce((sum, unit, i) => sum + unit / input.sands[i].density, 0)
    + gravelUnit.reduce((sum, unit, i) => sum + unit / input.gravels[i].density, 0)
    + waterUnit + (mode === 'complete' ? admixtureUnit.reduce((sum, unit, i) => sum + unit / input.admixtures[i].density, 0)
      + minorUnit.reduce((sum, unit, i) => sum + unit / input.minorAdditions[i].density, 0) : 0);
  const binderCorrectedKg = (1000 - 1000 * input.airFraction) / volumePerBinder;
  const sandMassesKg = sandUnit.map(unit => unit * binderCorrectedKg);
  const gravelMassesKg = gravelUnit.map(unit => unit * binderCorrectedKg);
  const admixtureMassesKg = admixtureUnit.map(unit => unit * binderCorrectedKg);
  const minorAdditionMassesKg = minorUnit.map(unit => unit * binderCorrectedKg);
  const waterLiquidKg = waterUnit * binderCorrectedKg;
  const minorVolumeL = admixtureMassesKg.reduce((sum, mass, i) => sum + mass / input.admixtures[i].density, 0)
    + minorAdditionMassesKg.reduce((sum, mass, i) => sum + mass / input.minorAdditions[i].density, 0);
  const physicalVolumeL = binderCorrectedKg * (cementBatch / binderBatch / input.cementDensity + additionBatch / binderBatch / input.additionDensity)
    + sandMassesKg.reduce((sum, mass, i) => sum + mass / input.sands[i].density, 0)
    + gravelMassesKg.reduce((sum, mass, i) => sum + mass / input.gravels[i].density, 0)
    + waterLiquidKg + 1000 * input.airFraction + (mode === 'complete' ? minorVolumeL : 0);
  return { binderCorrectedKg, sandMassesKg, gravelMassesKg, admixtureMassesKg, minorAdditionMassesKg,
    waterLiquidKg, minorVolumeL, physicalVolumeL };
}

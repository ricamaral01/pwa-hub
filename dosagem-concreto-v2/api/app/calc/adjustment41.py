"""Mixer correction with variable admixture volume, specification 4.1 §7.5."""

import math

from .principal41 import calculate_principal41


def adjust_batch41(data, mode, batch_liters, extras):
    if not math.isfinite(batch_liters) or batch_liters <= 0:
        raise ValueError("Betonada inválida")
    original = calculate_principal41(data, mode)
    factor = batch_liters / 1000
    cement_batch = original["cementKg"] * factor + extras.get("cementKg", 0)
    addition_batch = original["additionKg"] * factor + extras.get("additionKg", 0)
    binder_batch = cement_batch + addition_batch
    if binder_batch <= 0:
        raise ValueError("Aglomerante inválido")
    humidity = extras.get("aggregateHumidity", [])
    water_extra = 0
    def adjusted_group(masses, wet, offset):
        nonlocal water_extra
        result = []
        for i, mass in enumerate(masses):
            h = humidity[offset + i] if offset + i < len(humidity) else 0
            if not math.isfinite(h) or h < 0:
                raise ValueError("Umidade inválida")
            addition_dry = (wet[i] if i < len(wet) else 0) / (1 + h)
            water_extra += (wet[i] if i < len(wet) else 0) - addition_dry
            result.append(mass * factor + addition_dry)
        return result
    sands_batch = adjusted_group(original["sandMassesKg"], extras.get("sandWetKg", []), 0)
    gravels_batch = adjusted_group(original["gravelMassesKg"], extras.get("gravelWetKg", []), len(sands_batch))
    admixtures_batch = [mass * factor + (extras.get("admixtureKg", [])[i] if i < len(extras.get("admixtureKg", [])) else 0) for i, mass in enumerate(original["admixtureMassesKg"])]
    minors_batch = [mass * factor + (extras.get("minorAdditionKg", [])[i] if i < len(extras.get("minorAdditionKg", [])) else 0) for i, mass in enumerate(original["minorAdditionMassesKg"])]
    water_batch = original["waterLiquidKg"] * factor + extras.get("waterKg", 0) + water_extra
    sands_unit = [mass / binder_batch for mass in sands_batch]
    gravels_unit = [mass / binder_batch for mass in gravels_batch]
    admixtures_unit = [mass / binder_batch for mass in admixtures_batch]
    minors_unit = [mass / binder_batch for mass in minors_batch]
    water_unit = water_batch / binder_batch
    volume_per_binder = cement_batch / binder_batch / data["cementDensity"] + addition_batch / binder_batch / data["additionDensity"] + sum(unit / part["density"] for unit, part in zip(sands_unit, data["sands"])) + sum(unit / part["density"] for unit, part in zip(gravels_unit, data["gravels"])) + water_unit
    if mode == "complete":
        volume_per_binder += sum(unit / part["density"] for unit, part in zip(admixtures_unit, data["admixtures"])) + sum(unit / part["density"] for unit, part in zip(minors_unit, data["minorAdditions"]))
    binder_corrected = (1000 - 1000 * data["airFraction"]) / volume_per_binder
    sands = [unit * binder_corrected for unit in sands_unit]
    gravels = [unit * binder_corrected for unit in gravels_unit]
    admixtures = [unit * binder_corrected for unit in admixtures_unit]
    minors = [unit * binder_corrected for unit in minors_unit]
    water = water_unit * binder_corrected
    minor_volume = sum(mass / part["density"] for mass, part in zip(admixtures, data["admixtures"])) + sum(mass / part["density"] for mass, part in zip(minors, data["minorAdditions"]))
    physical_volume = binder_corrected * (cement_batch / binder_batch / data["cementDensity"] + addition_batch / binder_batch / data["additionDensity"]) + sum(mass / part["density"] for mass, part in zip(sands, data["sands"])) + sum(mass / part["density"] for mass, part in zip(gravels, data["gravels"])) + water + 1000 * data["airFraction"] + (minor_volume if mode == "complete" else 0)
    return {"binderCorrectedKg": binder_corrected, "sandMassesKg": sands, "gravelMassesKg": gravels,
            "admixtureMassesKg": admixtures, "minorAdditionMassesKg": minors, "waterLiquidKg": water,
            "minorVolumeL": minor_volume, "physicalVolumeL": physical_volume}

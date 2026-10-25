"""Concrefer alternative method and reference recipe, specification 4.1 §8."""

import math


def _check_group(parts, label):
    if not 1 <= len(parts) <= 3 or any(not math.isfinite(p["volumeFraction"]) or p["volumeFraction"] < 0 or not math.isfinite(p["density"]) or p["density"] <= 0 for p in parts):
        raise ValueError(f"{label}: frações inválidas")
    total = sum(part["volumeFraction"] for part in parts)
    if abs(total - 1) > 0.001:
        raise ValueError(f"frações do {label} somam {total * 100:.1f} %".replace(".", ","))


def _round_positive(value, decimals=0):
    factor = 10 ** decimals
    return math.floor(value * factor + 0.5) / factor


def calculate_alternative41(data, mode="complete"):
    if mode not in ("complete", "spreadsheet"):
        raise ValueError("Modo inválido")
    _check_group(data["sands"], "miúdo")
    _check_group(data["gravels"], "graúdo")
    if any(not math.isfinite(data[key]) or data[key] <= 0 for key in ("waterEffectiveKg", "waterCementRatio", "cementDensity", "additionDensity")) or any(not math.isfinite(data[key]) or not 0 <= data[key] < 1 for key in ("additionFractionOfCement", "airFraction", "mortarVolumeFraction")):
        raise ValueError("Entradas inválidas")
    cement = _round_positive(data["waterEffectiveKg"] / data["waterCementRatio"])
    addition = cement * data["additionFractionOfCement"]
    binder = cement + addition
    admixtures = [_round_positive(a["fraction"] * (cement if a["base"] == "cement" else binder), 3) for a in data["admixtures"]]
    minor_volume = sum(mass / a["density"] for mass, a in zip(admixtures, data["admixtures"]))
    admixture_water = sum(mass * (1 - a["solidsFraction"]) for mass, a in zip(admixtures, data["admixtures"]) if a.get("solidsFraction") is not None) if mode == "complete" else 0
    liquid_water = data["waterEffectiveKg"] - admixture_water
    if liquid_water < 0:
        raise ValueError("Água líquida negativa")
    gravel_volume = (1000 - 1000 * data["airFraction"] - liquid_water - (minor_volume if mode == "complete" else 0)) * (1 - data["mortarVolumeFraction"])
    gravels = [_round_positive(gravel_volume * part["volumeFraction"] * part["density"]) for part in data["gravels"]]
    fixed_volume = cement / data["cementDensity"] + addition / data["additionDensity"] + sum(mass / part["density"] for mass, part in zip(gravels, data["gravels"])) + liquid_water + (minor_volume if mode == "complete" else 0)
    sand_volume = 1000 - 1000 * data["airFraction"] - fixed_volume
    if sand_volume < 0:
        raise ValueError("Volume de areia negativo")
    sands = [_round_positive(sand_volume * part["volumeFraction"] * part["density"]) for part in data["sands"]]
    sand_kg = sum(sands)
    gravel_kg = sum(gravels)
    physical_volume = 1000 * data["airFraction"] + fixed_volume + sum(mass / part["density"] for mass, part in zip(sands, data["sands"]))
    return {"cementKg": cement, "additionKg": addition, "gravelVolumeL": gravel_volume,
            "gravelMassesKg": gravels, "fixedVolumeL": fixed_volume, "sandVolumeL": sand_volume,
            "sandMassesKg": sands, "admixtureMassesKg": admixtures, "minorVolumeL": minor_volume,
            "waterFromAdmixturesKg": admixture_water, "waterLiquidKg": liquid_water,
            "physicalVolumeL": physical_volume,
            "totalMassKg": binder + sand_kg + gravel_kg + data["waterEffectiveKg"] + sum(admixtures),
            "waterBinderRatio": data["waterEffectiveKg"] / binder,
            "mortarMassFraction": (binder + sand_kg) / (binder + sand_kg + gravel_kg),
            "sandAggregateFraction": sand_kg / (sand_kg + gravel_kg),
            "waterDryFraction": data["waterEffectiveKg"] / (binder + sand_kg + gravel_kg),
            "finesKg": cement + sum(mass * part.get("finesFraction", 0) for mass, part in zip(sands, data["sands"])) + sum(mass * part.get("finesFraction", 0) for mass, part in zip(gravels, data["gravels"]))}


def reference_alternative41(data):
    sand_volumes = [mass / density for mass, density in zip(data["sandMassesKg"], data["sandDensities"])]
    gravel_volumes = [mass / density for mass, density in zip(data["gravelMassesKg"], data["gravelDensities"])]
    sand_kg = sum(data["sandMassesKg"])
    gravel_kg = sum(data["gravelMassesKg"])
    return {"sandVolumeFractions": [v / sum(sand_volumes) for v in sand_volumes],
            "gravelVolumeFractions": [v / sum(gravel_volumes) for v in gravel_volumes],
            "mortarMassFraction": (data["cementKg"] + sand_kg) / (data["cementKg"] + sand_kg + gravel_kg),
            "waterCementRatio": data["waterKg"] / data["cementKg"],
            "admixturePctCement": data["admixtureKg"] / data["cementKg"] * 100}

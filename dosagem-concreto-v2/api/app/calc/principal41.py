"""Principal concrete mix volume balance, specification 4.1 §§6.2 and 7.3."""

from __future__ import annotations

import math


def _positive(value: float, name: str, allow_zero: bool = False) -> None:
    if not isinstance(value, (int, float)) or isinstance(value, bool) or not math.isfinite(value) or (value < 0 if allow_zero else value <= 0):
        raise ValueError(f"{name}: valor inválido")


def _group_masses(volume: float, group: list[dict], name: str) -> list[float]:
    if not 1 <= len(group) <= 3:
        raise ValueError(f"{name}: informe de uma a três frações")
    for part in group:
        _positive(part["fraction"], f"{name}.fraction", True)
        _positive(part["density"], f"{name}.density")
    if abs(sum(part["fraction"] for part in group) - 1) > 0.001:
        raise ValueError(f"{name}: frações devem somar 1")
    denominator = sum(part["fraction"] / part["density"] for part in group)
    return [volume * part["fraction"] / denominator for part in group]


def calculate_principal41(data: dict, mode: str = "complete") -> dict:
    if mode not in ("complete", "spreadsheet"):
        raise ValueError("mode: valor inválido")
    for name in ("waterEffectiveKg", "binderKg", "cementDensity", "additionDensity"):
        _positive(data[name], name)
    for name in ("additionFraction", "airFraction", "mortarVolumeFraction"):
        _positive(data[name], name, True)
        if data[name] >= 1:
            raise ValueError(f"{name}: deve ser menor que 1")
    binder = data["binderKg"]
    cement = binder * (1 - data["additionFraction"])
    addition = binder * data["additionFraction"]
    admixtures = data["admixtures"]
    minors = data["minorAdditions"]
    admixture_masses = []
    for part in admixtures:
        _positive(part["fractionOfBinder"], "admixture.fractionOfBinder", True)
        _positive(part["density"], "admixture.density")
        solids = part.get("solidsFraction")
        if solids is not None and (not isinstance(solids, (int, float)) or not math.isfinite(solids) or not 0 <= solids <= 1):
            raise ValueError("admixture.solidsFraction: valor inválido")
        admixture_masses.append(binder * part["fractionOfBinder"])
    minor_masses = []
    for part in minors:
        _positive(part["fractionOfBinder"], "minor.fractionOfBinder", True)
        _positive(part["density"], "minor.density")
        minor_masses.append(binder * part["fractionOfBinder"])
    minor_volume = sum(mass / part["density"] for mass, part in zip(admixture_masses, admixtures)) + sum(
        mass / part["density"] for mass, part in zip(minor_masses, minors)
    )
    water_from_admixtures = sum(mass * (1 - part["solidsFraction"]) for mass, part in zip(admixture_masses, admixtures) if part.get("solidsFraction") is not None) if mode == "complete" else 0
    liquid_water = data["waterEffectiveKg"] - water_from_admixtures
    if liquid_water < 0:
        raise ValueError("Água líquida negativa")
    solid_volume = 1000 - 1000 * data["airFraction"] - liquid_water - (minor_volume if mode == "complete" else 0)
    sand_volume = data["mortarVolumeFraction"] * solid_volume - cement / data["cementDensity"] - addition / data["additionDensity"]
    gravel_volume = (1 - data["mortarVolumeFraction"]) * solid_volume
    if sand_volume < 0 or gravel_volume < 0:
        raise ValueError("Volume de agregado negativo")
    sands = _group_masses(sand_volume, data["sands"], "sands")
    gravels = _group_masses(gravel_volume, data["gravels"], "gravels")
    physical_volume = 1000 * data["airFraction"] + liquid_water + cement / data["cementDensity"] + addition / data["additionDensity"] + sum(
        mass / part["density"] for mass, part in zip(sands, data["sands"])
    ) + sum(mass / part["density"] for mass, part in zip(gravels, data["gravels"])) + (minor_volume if mode == "complete" else 0)
    return {
        "cementKg": cement, "additionKg": addition,
        "admixtureMassesKg": admixture_masses, "minorAdditionMassesKg": minor_masses,
        "waterFromAdmixturesKg": water_from_admixtures, "waterLiquidKg": liquid_water,
        "minorVolumeL": minor_volume, "solidVolumeL": solid_volume,
        "sandVolumeL": sand_volume, "gravelVolumeL": gravel_volume,
        "sandMassesKg": sands, "gravelMassesKg": gravels,
        "physicalVolumeL": physical_volume,
        "outsideBalanceL": minor_volume if mode == "spreadsheet" else 0,
        "waterCementRatio": data["waterEffectiveKg"] / cement,
        "waterBinderRatio": data["waterEffectiveKg"] / binder,
        "mortarMassFraction": (binder + sum(sands)) / (binder + sum(sands) + sum(gravels)),
    }

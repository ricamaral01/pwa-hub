"""Aggregate water correction, specification 4.1 §6.4."""

import math


def correct_moisture41(aggregates: list[dict], reference_condition: str, water_effective_kg: float,
                       water_from_admixtures_kg: float = 0) -> dict:
    if reference_condition not in ("dry", "sss") or not all(math.isfinite(x) for x in (water_effective_kg, water_from_admixtures_kg)) or water_effective_kg < 0 or not 0 <= water_from_admixtures_kg <= water_effective_kg:
        raise ValueError("Água ou referência inválida")
    dry_masses = []
    for aggregate in aggregates:
        mass = aggregate["referenceMassKg"]
        humidity = aggregate["humidityFraction"]
        absorption = aggregate["absorptionFraction"]
        if not all(math.isfinite(x) and x >= 0 for x in (mass, humidity, absorption)):
            raise ValueError("Agregado inválido")
        dry_masses.append(mass if reference_condition == "dry" else mass / (1 + absorption))
    weigh_masses = [mass * (1 + aggregate["humidityFraction"]) for mass, aggregate in zip(dry_masses, aggregates)]
    free_water = sum(mass * (aggregate["humidityFraction"] - aggregate["absorptionFraction"]) for mass, aggregate in zip(dry_masses, aggregates))
    water_to_dose = water_effective_kg - water_from_admixtures_kg - free_water
    if water_to_dose < 0:
        raise ValueError("Água dosada negativa")
    return {"dryMassesKg": dry_masses, "weighMassesKg": weigh_masses,
            "freeWaterKg": free_water, "waterToDoseKg": water_to_dose}

"""Server authority for version 4.1 recipe methods."""
import math

from .alternative41 import calculate_alternative41
from .moisture41 import correct_moisture41
from .principal41 import calculate_principal41


def calculate_trace41(trace: dict) -> dict:
    method = trace.get("metodo")
    mode = trace.get("balanco", "complete")
    data = trace.get("metodoDados")
    if not isinstance(data, dict) or mode not in ("complete", "spreadsheet"):
        raise ValueError("Parâmetros do método ou balanço inválidos")
    if method == "principal_abrams":
        result = calculate_principal41(data, mode)
        items = [
            ("cimento", result["cementKg"], data["cementDensity"]),
            ("adicao", result["additionKg"], data["additionDensity"]),
            *(("areia", mass, part["density"]) for mass, part in zip(result["sandMassesKg"], data["sands"])),
            *(("brita", mass, part["density"]) for mass, part in zip(result["gravelMassesKg"], data["gravels"])),
            ("agua", result["waterLiquidKg"], 1),
            *(("aditivo", mass, part["density"]) for mass, part in zip(result["admixtureMassesKg"], data["admixtures"])),
            *(("outro", mass, part["density"]) for mass, part in zip(result["minorAdditionMassesKg"], data["minorAdditions"])),
        ]
    elif method == "alternativo_concrefer":
        result = calculate_alternative41(data, mode)
        items = [
            ("cimento", result["cementKg"], data["cementDensity"]),
            ("adicao", result["additionKg"], data["additionDensity"]),
            *(("areia", mass, part["density"]) for mass, part in zip(result["sandMassesKg"], data["sands"])),
            *(("brita", mass, part["density"]) for mass, part in zip(result["gravelMassesKg"], data["gravels"])),
            ("agua", result["waterLiquidKg"], 1),
            *(("aditivo", mass, part["density"]) for mass, part in zip(result["admixtureMassesKg"], data["admixtures"])),
        ]
    else:
        raise ValueError("Método 4.1 inválido")
    material_ids = trace.get("materialIds") or []
    costs = trace.get("custosRsKg") or {}
    if not isinstance(costs, dict) or any(not isinstance(cost, (int, float)) or not math.isfinite(cost) or cost < 0 for cost in costs.values()):
        raise ValueError("Custo unitário inválido")
    normalized_items = [
        {"id": f"m{i}", "materialId": material_ids[i] if i < len(material_ids) else None,
         "nome": f"{category} {i + 1}", "categoria": category,
         "massaKgM3": mass, "massaEspecificaKgDm3": density,
         "custoRsKg": costs.get(f"m{i}", 0), "custoRsM3": mass * costs.get(f"m{i}", 0)}
        for i, (category, mass, density) in enumerate(items) if mass > 0
    ]
    summary = {"cementKg": result["cementKg"], "waterEffectiveKg": data["waterEffectiveKg"],
               "waterLiquidKg": result["waterLiquidKg"], "physicalVolumeL": result["physicalVolumeL"],
               "waterCementRatio": data["waterEffectiveKg"] / result["cementKg"],
               "waterBinderRatio": result["waterBinderRatio"],
               "sandKg": sum(result["sandMassesKg"]), "gravelKg": sum(result["gravelMassesKg"]),
               "alpha": result["mortarMassFraction"], "costRsM3": sum(item["custoRsM3"] for item in normalized_items)}
    if "finesKg" in result:
        summary["finesKg"] = result["finesKg"]
    calculated = {"result": result, "items": normalized_items, "summary": summary}
    if trace.get("correcaoUmidade") is not None:
        calculated["correctedBatch"] = calculate_batch_correction41(
            result, data["waterEffectiveKg"], data["admixtures"], trace["correcaoUmidade"])
    return calculated


def calculate_batch_correction41(result: dict, water_effective_kg_m3: float,
                                 admixtures: list[dict], batch: dict) -> dict:
    if not isinstance(batch, dict):
        raise ValueError("Volume, umidade ou absorção da betonada inválidos")
    volume_l = batch.get("volumeL")
    measurements = batch.get("aggregates")
    masses = result["sandMassesKg"] + result["gravelMassesKg"]
    if (not isinstance(volume_l, (int, float)) or isinstance(volume_l, bool) or
        not math.isfinite(volume_l) or not 0 < volume_l <= 100_000 or
        not isinstance(measurements, list) or len(measurements) != len(masses) or
        len(admixtures) != len(result["admixtureMassesKg"])):
        raise ValueError("Volume, umidade ou absorção da betonada inválidos")
    aggregates = []
    for mass, measurement in zip(masses, measurements):
        if not isinstance(measurement, dict):
            raise ValueError("Volume, umidade ou absorção da betonada inválidos")
        humidity = measurement.get("humidityPct")
        absorption = measurement.get("absorptionPct")
        if any(not isinstance(value, (int, float)) or isinstance(value, bool) or
               not math.isfinite(value) or not 0 <= value <= 100
               for value in (humidity, absorption)):
            raise ValueError("Volume, umidade ou absorção da betonada inválidos")
        aggregates.append({"referenceMassKg": mass * volume_l / 1000,
                           "humidityFraction": humidity / 100, "absorptionFraction": absorption / 100})
    densities = [item.get("density") for item in admixtures]
    if any(not isinstance(density, (int, float)) or isinstance(density, bool) or
           not math.isfinite(density) or density <= 0 for density in densities):
        raise ValueError("Densidade do aditivo inválida")
    scale = volume_l / 1000
    correction = correct_moisture41(
        aggregates, batch.get("referenceCondition"), water_effective_kg_m3 * scale,
        result["waterFromAdmixturesKg"] * scale)
    admixture_masses = [mass * scale for mass in result["admixtureMassesKg"]]
    return {"volumeL": volume_l, "referenceCondition": batch["referenceCondition"], **correction,
            "waterEffectiveKg": water_effective_kg_m3 * scale,
            "waterFromAdmixturesKg": result["waterFromAdmixturesKg"] * scale,
            "admixtureMassesKg": admixture_masses,
            "admixtureMassesG": [mass * 1000 for mass in admixture_masses],
            "admixtureVolumesMl": [mass / density * 1000 for mass, density in zip(admixture_masses, densities)]}

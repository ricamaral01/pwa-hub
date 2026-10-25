import json
from pathlib import Path

import pytest

from app.calc.traco41 import calculate_trace41


FIXTURE = json.loads((Path(__file__).resolve().parents[2] / "shared/golden/alternative-4.1.json").read_text(encoding="utf-8"))


def test_a1_corrected_batch_is_recalculated_by_server():
    trace = {
        "metodo": "alternativo_concrefer", "balanco": "spreadsheet",
        "metodoDados": FIXTURE["a1"],
        "correcaoUmidade": {
            "volumeL": 1000, "referenceCondition": "sss",
            "aggregates": [
                {"humidityPct": 11, "absorptionPct": 0},
                {"humidityPct": 10, "absorptionPct": 0},
                {"humidityPct": 0.5, "absorptionPct": 0},
            ],
        },
    }
    batch = calculate_trace41(trace)["correctedBatch"]
    assert batch["weighMassesKg"] == pytest.approx([173.16, 695.2, 1042.185])
    assert batch["waterToDoseKg"] == pytest.approx(114.455)
    assert batch["admixtureMassesG"] == pytest.approx([2176])
    assert batch["admixtureVolumesMl"] == pytest.approx([1996.330275], abs=0.001)
    assert batch["waterEffectiveKg"] == pytest.approx(
        batch["waterToDoseKg"] + batch["freeWaterKg"] + batch["waterFromAdmixturesKg"])


def test_a1_corrected_batch_rejects_invalid_measurement():
    trace = {
        "metodo": "alternativo_concrefer", "balanco": "spreadsheet",
        "metodoDados": FIXTURE["a1"],
        "correcaoUmidade": {
            "volumeL": 1000, "referenceCondition": "sss",
            "aggregates": [{"humidityPct": -1, "absorptionPct": 0}] * 3,
        },
    }
    with pytest.raises(ValueError, match="Volume, umidade ou absorção"):
        calculate_trace41(trace)

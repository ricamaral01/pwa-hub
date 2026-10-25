import copy
import json
from pathlib import Path

import pytest

from app.calc.alternative41 import calculate_alternative41, reference_alternative41
from app.calc.moisture41 import correct_moisture41

FIXTURE = json.loads((Path(__file__).resolve().parents[2] / "shared/golden/alternative-4.1.json").read_text(encoding="utf-8"))


def test_a1():
    result = calculate_alternative41(FIXTURE["a1"], "spreadsheet")
    for key, expected in FIXTURE["a1"]["expected"].items():
        tolerance = 0.0001 if key.endswith(("Fraction", "Ratio")) else 0.05
        if isinstance(expected, list):
            assert all(abs(actual - target) <= tolerance for actual, target in zip(result[key], expected)), key
        else:
            assert abs(result[key] - expected) <= tolerance, (key, result[key], expected)
    moisture = correct_moisture41([
        {"referenceMassKg": 156, "humidityFraction": .11, "absorptionFraction": 0},
        {"referenceMassKg": 632, "humidityFraction": .10, "absorptionFraction": 0},
        {"referenceMassKg": 1037, "humidityFraction": .005, "absorptionFraction": 0},
    ], "sss", 200)
    assert all(abs(a - b) <= 0.001 for a, b in zip(moisture["weighMassesKg"], [173.16, 695.2, 1042.185]))
    assert abs(moisture["waterToDoseKg"] - 114.455) <= 0.001
    assert abs(result["admixtureMassesKg"][0] * 1000 / 1.09 - 1996.33) <= 0.01


def test_a2():
    data = copy.deepcopy(FIXTURE["a1"])
    data["sands"][1]["volumeFraction"] = .668
    with pytest.raises(ValueError, match="86,8"):
        calculate_alternative41(data, "spreadsheet")


def test_a3():
    result = reference_alternative41(FIXTURE["a3"])
    for key, expected in FIXTURE["a3"]["expected"].items():
        tolerance = .001 if key == "admixturePctCement" or isinstance(expected, list) else .0001
        if isinstance(expected, list):
            assert all(abs(actual - target) <= tolerance for actual, target in zip(result[key], expected)), key
        else:
            assert abs(result[key] - expected) <= tolerance, key

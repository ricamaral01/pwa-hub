import json
from pathlib import Path

from app.calc.moisture41 import correct_moisture41


def test_moisture41_golden():
    fixture = json.loads((Path(__file__).resolve().parents[2] / "shared/golden/moisture-4.1.json").read_text(encoding="utf-8"))
    result = correct_moisture41(fixture["aggregates"], fixture["referenceCondition"], fixture["waterEffectiveKg"], fixture["waterFromAdmixturesKg"])
    for key, expected in fixture["expected"].items():
        if isinstance(expected, list):
            assert all(abs(a - b) <= 0.001 for a, b in zip(result[key], expected)), key
        else:
            assert abs(result[key] - expected) <= 0.001, key
    assert abs(result["waterToDoseKg"] + result["freeWaterKg"] + fixture["waterFromAdmixturesKg"] - fixture["waterEffectiveKg"]) < 1e-9

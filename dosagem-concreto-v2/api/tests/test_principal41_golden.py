import copy
import json
from pathlib import Path

from app.calc.principal41 import calculate_principal41


FIXTURE = json.loads((Path(__file__).resolve().parents[2] / "shared/golden/principal-4.1.json").read_text(encoding="utf-8"))


def test_principal41_golden():
    for case in FIXTURE["cases"]:
        data = copy.deepcopy(FIXTURE["base"])
        if "additionFraction" in case.get("changes", {}):
            data["additionFraction"] = case["changes"]["additionFraction"]
        if "admixture0SolidsFraction" in case.get("changes", {}):
            data["admixtures"][0]["solidsFraction"] = case["changes"]["admixture0SolidsFraction"]
        result = calculate_principal41(data, case["mode"])
        for key, expected in case["expected"].items():
            tolerance = 0.001 if key.endswith("Ratio") else 0.05
            if isinstance(expected, list):
                assert all(abs(actual - target) <= tolerance for actual, target in zip(result[key], expected)), (case["id"], key)
            else:
                assert abs(result[key] - expected) <= tolerance, (case["id"], key, result[key], expected)
        if case["mode"] == "complete":
            assert abs(result["physicalVolumeL"] - 1000) <= 0.05
        if case["id"] == "P7":
            assert abs(result["waterLiquidKg"] + result["waterFromAdmixturesKg"] - 189) < 1e-9


def test_200_valid_mix_volumes():
    for i in range(200):
        data = copy.deepcopy(FIXTURE["base"])
        data["waterEffectiveKg"] = 150 + i * 0.4
        data["binderKg"] = 290 + i * 0.55
        data["mortarVolumeFraction"] = 0.4 + i % 20 * 0.005
        data["additionFraction"] = i % 9 * 0.01
        data["admixtures"][0]["solidsFraction"] = i % 10 / 10
        assert abs(calculate_principal41(data)["physicalVolumeL"] - 1000) <= 0.05

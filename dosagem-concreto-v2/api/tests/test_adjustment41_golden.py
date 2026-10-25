import json
from pathlib import Path

from app.calc.adjustment41 import adjust_batch41

ROOT = Path(__file__).resolve().parents[2] / "shared/golden"
PRINCIPAL = json.loads((ROOT / "principal-4.1.json").read_text(encoding="utf-8"))["base"]
ADJUSTMENT = json.loads((ROOT / "adjustment-4.1.json").read_text(encoding="utf-8"))


def test_p3_p3b():
    for case in ADJUSTMENT["cases"]:
        result = adjust_batch41(PRINCIPAL, case["mode"], ADJUSTMENT["batchLiters"], ADJUSTMENT["extra"])
        for key, expected in case["expected"].items():
            if isinstance(expected, list):
                assert all(abs(actual - target) <= 0.01 for actual, target in zip(result[key], expected)), (case["id"], key)
            else:
                assert abs(result[key] - expected) <= 0.01, (case["id"], key)
        if case["mode"] == "complete":
            assert abs(result["binderCorrectedKg"] - 332.538) > 0.04


def test_p5_adjustment():
    data = {**PRINCIPAL, "additionFraction": 0.08}
    assert abs(adjust_batch41(data, "complete", 25, {})["binderCorrectedKg"] - 321) < 1e-8

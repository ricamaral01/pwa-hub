import json
import math
from pathlib import Path

from app.calc.norms41 import approval_water_cement41, normative_sd41, preparation_available41
from app.calc.regression41 import regression_adjustment41

FIXTURE = json.loads((Path(__file__).resolve().parents[2] / "shared/golden/rules-4.1.json").read_text(encoding="utf-8"))


def test_n1():
    for fck, condition, expected in FIXTURE["n1"]["conditions"]:
        assert preparation_available41(fck, condition) == expected
    spread = 1.6 * math.sqrt(19 / 20)
    results = [{"date": f"2026-01-{i + 1:02d}", "strength": 30 + (spread if i % 2 else -spread), "family": "A", "valid": True} for i in range(20)]
    assert normative_sd41(results[:19], "B", "A")["sd"] == 5.5
    assert normative_sd41(results, "B", "A") == {"sd": 2, "normative": True, "n": 20}
    results[19]["date"] = "2026-02-01"
    assert normative_sd41(results, "B", "A")["normative"] is False
    assert not approval_water_cement41(.58, "III")


def test_r1():
    data = FIXTURE["r1"]
    assert regression_adjustment41(data["historical"])["recommend"] is False
    correlated = regression_adjustment41(data["correlated"])
    assert correlated["recommend"] is False and "variaram juntos" in correlated["reason"]
    independent = regression_adjustment41(data["independent"])
    assert independent["recommend"] is True
    assert independent["adjustedR2"] >= .6
    assert len(independent["confidence95"]) == 3
    for coefficient, (low, high) in zip(independent["coefficients"], independent["confidence95"]):
        assert low < coefficient < high

import json
from pathlib import Path

from app.calc.curves41 import fit_abrams41, fit_age41, project_abrams41, estimate_age41, days_to_strength41
from app.calc.optimization41 import optimize_retained41

FIXTURE = json.loads((Path(__file__).resolve().parents[2] / "shared/golden/curves-4.1.json").read_text(encoding="utf-8"))


def test_p2():
    data = FIXTURE["abrams"]
    fit = fit_abrams41(data["pairs"])
    for key, expected in data["expected"].items():
        assert abs(fit[key] - expected) <= (0.00001 if "R2" in key else 0.0005), key
    for fck, sd, fcj, ratio, water, cement in data["project"]:
        result = project_abrams41(data["pairs"], data["waterPairs"], fck, sd)
        assert abs(result["fcj"] - fcj) <= 0.00001
        assert abs(result["ratio"] - ratio) <= 0.0001
        assert (result["water"], result["cement"]) == (water, cement)
    assert project_abrams41(data["pairs"], data["waterPairs"], 40, 5)["extrapolation"]


def test_i1():
    data = FIXTURE["age"]
    curve = fit_age41(data["pairs"])
    for key, tolerance in (("fc28", 0.001), ("s", 0.00001), ("r2", 0.00001)):
        assert abs(curve[key] - data["expected"][key]) <= tolerance
    for age, key in ((0.5, "twelveHours"), (0.75, "eighteenHours"), (1, "oneDay")):
        estimate = estimate_age41(curve, age)
        assert abs(estimate["strength"] - data["expected"][key]) <= 0.01
        assert estimate["extrapolation"]
    assert abs(days_to_strength41(curve, 15) - data["expected"]["daysTo15"]) <= 0.001


def test_o1():
    data = FIXTURE["sandOptimization"]
    result = optimize_retained41(data["retained"], data["targetCumulative"], [data["currentFirstFraction"], 1 - data["currentFirstFraction"]], 0.001)
    expected = data["expected"]
    for section, key, target_key, tolerance in (("best", "firstFraction", "bestFirstFraction", 0.00001), ("best", "squaredError", "bestSquaredError", 0.001), ("current", "squaredError", "currentSquaredError", 0.001), ("current", "fineness", "currentFineness", 0.001), ("best", "fineness", "bestFineness", 0.001)):
        assert abs(result[section][key] - expected[target_key]) <= tolerance

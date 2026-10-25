"""JSON stdin/stdout adapter for cross-language parity tests; no database or network."""

import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[2]))

from app.calc.adjustment41 import adjust_batch41
from app.calc.alternative41 import calculate_alternative41, reference_alternative41
from app.calc.curves41 import fit_abrams41, fit_age41
from app.calc.moisture41 import correct_moisture41
from app.calc.norms41 import normative_sd41
from app.calc.optimization41 import optimize_retained41
from app.calc.principal41 import calculate_principal41
from app.calc.regression41 import regression_adjustment41
from app.calc.traco41 import calculate_trace41


def dispatch(request):
    kind = request["kind"]
    data = request["data"]
    if kind == "principal":
        return calculate_principal41(data["input"], data["mode"])
    if kind == "traco":
        return calculate_trace41(data)
    if kind == "adjustment":
        return adjust_batch41(data["input"], data["mode"], data["batchLiters"], data["extras"])
    if kind == "alternative":
        return calculate_alternative41(data["input"], data["mode"])
    if kind == "reference":
        return reference_alternative41(data)
    if kind == "moisture":
        return correct_moisture41(data["aggregates"], data["referenceCondition"], data["waterEffectiveKg"], data["waterFromAdmixturesKg"])
    if kind == "abrams":
        return fit_abrams41(data)
    if kind == "age":
        return fit_age41(data)
    if kind == "optimization":
        return optimize_retained41(data["retained"], data["targetCumulative"], data["current"], data["step"])
    if kind == "norms":
        return normative_sd41(data["results"], data["condition"], data["family"])
    if kind == "regression":
        return regression_adjustment41(data)
    raise ValueError(f"Unknown kind: {kind}")


if __name__ == "__main__":
    print(json.dumps(dispatch(json.load(sys.stdin)), ensure_ascii=False, allow_nan=False))

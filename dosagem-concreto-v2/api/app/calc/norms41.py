"""Preparation classes and normative standard deviation, spec 4.1 §6.5."""

import math
from datetime import datetime

CONDITIONS = {"A": (4, math.inf), "B": (5.5, 20), "C": (7, 15)}


def preparation_available41(fck, condition):
    return math.isfinite(fck) and 0 < fck <= CONDITIONS[condition][1]


def normative_sd41(results, condition, family):
    fallback = CONDITIONS[condition][0]
    run = []
    selected = None
    for item in sorted(results, key=lambda x: x["date"]):
        try:
            date = datetime.fromisoformat(item["date"].replace("Z", "+00:00"))
        except ValueError:
            date = None
        if not item["valid"] or item["family"] != family or not math.isfinite(item["strength"]) or item["strength"] <= 0 or date is None:
            run = []
            continue
        run.append((item, date))
        if len(run) > 20:
            run.pop(0)
        if len(run) == 20 and (run[-1][1] - run[0][1]).total_seconds() <= 30 * 86400:
            selected = [x[0]["strength"] for x in run]
    if selected is None:
        return {"sd": fallback, "normative": False, "n": 0}
    mean = sum(selected) / 20
    sample = math.sqrt(sum((x - mean) ** 2 for x in selected) / 19)
    return {"sd": max(2, sample), "normative": True, "n": 20}


def approval_water_cement41(ratio, exposure):
    return math.isfinite(ratio) and ratio <= {"I": .65, "II": .60, "III": .55, "IV": .45}[exposure]

"""Geometric aggregate gradation search, specification 4.1 §10."""

import math


def mix_retained41(retained, fractions):
    if not retained or len(retained) != len(fractions) or any(len(row) != len(retained[0]) for row in retained):
        raise ValueError("Curvas incompatíveis")
    if abs(sum(fractions) - 1) > 1e-9 or any(not math.isfinite(f) or f < 0 for f in fractions):
        raise ValueError("Frações inválidas")
    cumulative = []
    total = 0
    for sieve in range(len(retained[0])):
        total += sum(row[sieve] * fractions[i] for i, row in enumerate(retained))
        cumulative.append(total)
    return {"cumulative": cumulative, "fineness": sum(cumulative[1:]) / 100}


def optimize_retained41(retained, target_cumulative, current, step=0.005):
    if len(retained) != 2 or len(retained[0]) != len(target_cumulative) or not 0 < step <= 1:
        raise ValueError("Busca de duas curvas inválida")
    def score(fraction):
        mixed = mix_retained41(retained, [fraction, 1 - fraction])
        return {**mixed, "firstFraction": fraction,
                "squaredError": sum((value - target_cumulative[i]) ** 2 for i, value in enumerate(mixed["cumulative"]))}
    current_result = score(current[0])
    best = score(0)
    for i in range(1, round(1 / step) + 1):
        candidate = score(min(1, i * step))
        if candidate["squaredError"] < best["squaredError"]:
            best = candidate
    return {"current": current_result, "best": best}

"""Abrams and age curves with logarithmic least squares (specification 4.1)."""

import math


def _linear_log_fit(pairs, transform):
    if len(pairs) < 3:
        raise ValueError("Mínimo de três pontos")
    if any(not math.isfinite(x) or not math.isfinite(y) or x <= 0 or y <= 0 for x, y in pairs):
        raise ValueError("Ponto inválido")
    xy = [(transform(x), math.log(y)) for x, y in pairs]
    mx = sum(x for x, _ in xy) / len(xy)
    my = sum(y for _, y in xy) / len(xy)
    xx = sum((x - mx) ** 2 for x, _ in xy)
    if xx <= 1e-12:
        raise ValueError("Pontos sem variação")
    slope = sum((x - mx) * (y - my) for x, y in xy) / xx
    intercept = my - slope * mx
    ss = sum((y - my) ** 2 for _, y in xy)
    residual = sum((y - intercept - slope * x) ** 2 for x, y in xy)
    return intercept, slope, 1 - residual / ss


def fit_abrams41(pairs):
    pi, ps, pr = _linear_log_fit(pairs, math.log)
    ei, es, er = _linear_log_fit(pairs, lambda x: x)
    return {"powerA": math.exp(pi), "powerB": ps, "powerR2": pr,
            "expK1": math.exp(ei), "expK2": math.exp(-es), "expR2": er}


def interpolate_lyse41(pairs, ratio):
    if not math.isfinite(ratio) or len(pairs) < 2:
        raise ValueError("Curva de água inválida")
    sorted_pairs = sorted(pairs)
    if ratio <= sorted_pairs[0][0]:
        return {"water": sorted_pairs[0][1], "extrapolation": ratio < sorted_pairs[0][0]}
    if ratio >= sorted_pairs[-1][0]:
        return {"water": sorted_pairs[-1][1], "extrapolation": ratio > sorted_pairs[-1][0]}
    high = next(i for i, pair in enumerate(sorted_pairs) if pair[0] >= ratio)
    x0, y0 = sorted_pairs[high - 1]
    x1, y1 = sorted_pairs[high]
    return {"water": y0 + (ratio - x0) / (x1 - x0) * (y1 - y0), "extrapolation": False}


def project_abrams41(pairs, water_pairs, fck, sd):
    fit = fit_abrams41(pairs)
    fcj = fck + 1.65 * sd
    ratio = (fcj / fit["powerA"]) ** (1 / fit["powerB"])
    lyse = interpolate_lyse41(water_pairs, ratio)
    water = math.floor(lyse["water"] + 1e-9)
    return {"fcj": fcj, "ratio": ratio, "water": water,
            "cement": math.ceil(water / ratio - 1e-9),
            "extrapolation": lyse["extrapolation"] or not min(p[0] for p in pairs) <= ratio <= max(p[0] for p in pairs)}


def fit_age41(pairs):
    intercept, slope, r2 = _linear_log_fit(pairs, lambda days: 1 - math.sqrt(28 / days))
    return {"fc28": math.exp(intercept), "s": slope, "r2": r2,
            "minAge": min(p[0] for p in pairs), "maxAge": max(p[0] for p in pairs)}


def estimate_age41(curve, days):
    if not math.isfinite(days) or days <= 0:
        raise ValueError("Idade inválida")
    return {"strength": curve["fc28"] * math.exp(curve["s"] * (1 - math.sqrt(28 / days))),
            "extrapolation": days < curve["minAge"] or days > curve["maxAge"]}


def days_to_strength41(curve, strength):
    if not math.isfinite(strength) or strength <= 0 or curve["s"] <= 0:
        raise ValueError("Resistência inválida")
    term = 1 - math.log(strength / curve["fc28"]) / curve["s"]
    if term <= 0:
        raise ValueError("Resistência fora do modelo")
    return 28 / term ** 2

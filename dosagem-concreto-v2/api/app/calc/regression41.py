"""Two-factor experimental adjustment regression with eligibility gates."""

import math


def _inverse3(m):
    (a, b, c), (d, e, f), (g, h, i) = m
    det = a * (e * i - f * h) - b * (d * i - f * g) + c * (d * h - e * g)
    if abs(det) < 1e-10:
        return None
    return [[v / det for v in row] for row in ((e * i - f * h, c * h - b * i, b * f - c * e),
                                                (f * g - d * i, a * i - c * g, c * d - a * f),
                                                (d * h - e * g, b * g - a * h, a * e - b * d))]


def regression_adjustment41(points):
    if len(points) < 8:
        return {"recommend": False, "reason": "histórico: mínimo de 8 ajustes"}
    if any(not all(math.isfinite(p[k]) for k in ("water", "admixture", "workability")) for p in points):
        raise ValueError("Ajuste inválido")
    n = len(points)
    df = n - 3
    if df < 5:
        return {"recommend": False, "reason": "graus de liberdade insuficientes"}
    if len({p["water"] for p in points}) < 3 or len({p["admixture"] for p in points}) < 3:
        return {"recommend": False, "reason": "variar cada fator em três níveis"}
    mw = sum(p["water"] for p in points) / n
    ma = sum(p["admixture"] for p in points) / n
    my = sum(p["workability"] for p in points) / n
    sw = sum((p["water"] - mw) ** 2 for p in points)
    sa = sum((p["admixture"] - ma) ** 2 for p in points)
    cross = sum((p["water"] - mw) * (p["admixture"] - ma) for p in points)
    correlation = cross / math.sqrt(sw * sa)
    if not math.isfinite(correlation) or abs(correlation) >= .7:
        return {"recommend": False, "reason": "água e aditivo variaram juntos", "correlation": correlation}
    matrix = [[n, sum(p["water"] for p in points), sum(p["admixture"] for p in points)],
              [sum(p["water"] for p in points), sum(p["water"] ** 2 for p in points), sum(p["water"] * p["admixture"] for p in points)],
              [sum(p["admixture"] for p in points), sum(p["water"] * p["admixture"] for p in points), sum(p["admixture"] ** 2 for p in points)]]
    inverse = _inverse3(matrix)
    if inverse is None:
        return {"recommend": False, "reason": "fatores dependentes", "correlation": correlation}
    rhs = [sum(p["workability"] for p in points), sum(p["water"] * p["workability"] for p in points), sum(p["admixture"] * p["workability"] for p in points)]
    coefficients = [sum(v * rhs[j] for j, v in enumerate(row)) for row in inverse]
    rss = sum((p["workability"] - coefficients[0] - coefficients[1] * p["water"] - coefficients[2] * p["admixture"]) ** 2 for p in points)
    tss = sum((p["workability"] - my) ** 2 for p in points)
    adjusted_r2 = 1 - (rss / df) / (tss / (n - 1))
    if not math.isfinite(adjusted_r2) or adjusted_r2 < .6:
        return {"recommend": False, "reason": "R² ajustado abaixo de 0,6", "correlation": correlation, "adjustedR2": adjusted_r2}
    t95 = {5: 2.5706, 6: 2.4469, 7: 2.3646, 8: 2.3060}.get(df, 1.96 + 2.89 / df)
    confidence = []
    for j, value in enumerate(coefficients):
        half = t95 * math.sqrt(rss / df * inverse[j][j])
        confidence.append([value - half, value + half])
    return {"recommend": True, "reason": "sugestão para a próxima betonada; validar em laboratório",
            "correlation": correlation, "adjustedR2": adjusted_r2, "coefficients": coefficients,
            "confidence95": confidence, "n": n}

"""Method-study statistics, in effective minutes."""
from __future__ import annotations

from math import ceil, sqrt
from statistics import mean, stdev


def resumo(valores: list[float], *, z: float = 1.96, erro_pct: float = 5,
           k: float = 2) -> dict:
    clean = [float(x) for x in valores if x is not None and float(x) >= 0]
    all_count = len(clean)
    if all_count > 3 and k > 0:
        avg, sd = mean(clean), stdev(clean)
        if sd > 0:
            clean = [x for x in clean if abs(x - avg) <= k * sd]
    n = len(clean)
    avg = mean(clean) if n else 0.0
    sd = stdev(clean) if n > 1 else 0.0
    cv = sd / avg if avg > 0 else 0.0
    required = ceil((z * sd / (erro_pct / 100 * avg)) ** 2) if avg > 0 and erro_pct > 0 else 0
    return {"n": n, "n_excluidas": all_count - n, "media_min": avg,
            "desvio_min": sd, "cv": cv, "n_necessario": max(10, required),
            "faixa_2s": [avg - 2 * sd, avg + 2 * sd]}


def resumo_medicoes(rows: list[dict], *, z: float = 1.96, erro_pct: float = 5,
                    k: float = 2) -> dict:
    valid = [row for row in rows if row.get("valido", True)]
    values = [float(row["duracao_s"]) / 60 for row in valid]
    result = resumo(values, z=z, erro_pct=erro_pct, k=k)
    total_minutes = sum(values)
    result["pessoas_media"] = (sum(value * float(row["pessoas"])
                                     for row, value in zip(valid, values)) / total_minutes
                                if total_minutes else 0.0)
    result["por_setor"] = {}
    result["por_tipo_poste"] = {}
    for field, target in (("setor", "por_setor"), ("tipo_poste", "por_tipo_poste")):
        keys = {row.get(field) for row in valid if row.get(field) is not None}
        for key in keys:
            subset = [float(row["duracao_s"]) / 60 for row in valid if row.get(field) == key]
            result[target][str(key)] = resumo(subset, z=z, erro_pct=erro_pct, k=k)
    moving = [row for row in valid if row.get("distancia_m") is not None]
    minutes = sum(float(row["duracao_s"]) / 60 for row in moving)
    result["velocidade_m_min"] = (sum(float(row["distancia_m"]) for row in moving) / minutes
                                    if len(moving) >= 3 and minutes > 0 else None)
    return result

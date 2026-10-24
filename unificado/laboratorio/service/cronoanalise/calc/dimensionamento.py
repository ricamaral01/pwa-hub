"""Classical standard-time and staffing calculations."""
from __future__ import annotations

from math import ceil


def tempo_padrao(to_min: float, ritmo_pct: float, tolerancias_pct: float) -> dict:
    factor = 1 / (1 - tolerancias_pct / 100)
    tn = to_min * ritmo_pct / 100
    return {"TO": to_min, "TN": tn, "FT": factor, "TP": tn * factor}


def dimensionar(atividades: list[dict], estatisticas: dict[str, dict],
                parametros: dict, cacambas_por_forma: float) -> dict:
    tolerancias = sum(float(parametros[key]) for key in ("tolPes", "tolFad", "tolEsp"))
    if not 0 <= tolerancias < 100:
        raise ValueError("Tolerâncias precisam somar menos de 100%")
    disponivel = float(parametros["turno"]) - float(parametros["intervalos"])
    demanda = float(parametros["demanda"])
    eta = float(parametros["eta"]) / 100
    if disponivel <= 0 or demanda <= 0 or not 0 < eta <= 1:
        raise ValueError("Jornada, demanda e eficiência inválidas")
    takt = disponivel / demanda
    by_stage: dict[str, float] = {}
    details = []
    alerts = []
    for activity in atividades:
        code = activity["codigo"]
        over = parametros.get("over", {}).get(code, {})
        use = over.get("usar", activity["tipo"] != "espera")
        if not use:
            continue
        stats = estatisticas.get(code, {})
        measured = stats.get("n", 0) > 0
        to_min = float(stats["media_min"] if measured else activity["estimativa_min"])
        people = float(stats["pessoas_media"] if measured else activity["pessoas_padrao"])
        rhythm = float(over.get("ritmo", 100))
        frequency = float(over.get("freq", cacambas_por_forma if activity["por_cacamba"] else 1))
        standard = tempo_padrao(to_min, rhythm, tolerancias)
        hm = standard["TP"] * people * frequency
        by_stage[activity["processo"]] = by_stage.get(activity["processo"], 0) + hm
        details.append({"codigo": code, "processo": activity["processo"], "n": stats.get("n", 0),
                        "fonte": "medido" if measured else "estimativa", "pessoas": people,
                        "ritmo": rhythm, "freq": frequency, "HMf": hm, **standard})
        if measured and stats["n"] < stats["n_necessario"]:
            alerts.append({"codigo": code, "tipo": "amostra_insuficiente"})
        if standard["TP"] * frequency > takt:
            alerts.append({"codigo": code, "tipo": "tempo_maior_que_takt"})
    hm_total = sum(by_stage.values())
    theoretical = hm_total * demanda / disponivel
    people = theoretical / eta
    available_people = float(parametros["disponiveis"])
    return {"atividades": details, "etapas": by_stage, "FT": 1 / (1 - tolerancias / 100),
            "HM": hm_total, "T_disp": disponivel, "takt": takt,
            "N_teorico": theoretical, "N": people, "N_arred": ceil(people - 1e-9),
            "capacidade": available_people * disponivel * eta / hm_total if hm_total > 0 else None,
            "alertas": alerts}

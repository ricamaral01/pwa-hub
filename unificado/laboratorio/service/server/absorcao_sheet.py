"""Calculations for the standalone water absorption form."""
from decimal import Decimal, InvalidOperation


def calculate_sheet(bodies, criteria):
    if not bodies or len(bodies) > 20:
        raise ValueError("Informe de 1 a 20 corpos de prova.")
    rows = []
    values = []
    for index, body in enumerate(bodies, 1):
        saturated = body.get("massa_saturada_g")
        dry = body.get("massas_secas_g") or []
        if len(dry) > 8:
            raise ValueError("Cada corpo de prova aceita até 8 pesagens secas.")
        if saturated in (None, "") and not any(v not in (None, "") for v in dry):
            rows.append({"cp": index, "status": "PENDENTE", "absorcao_pct": None, "variacao_final_pct": None})
            continue
        try:
            wet = Decimal(str(saturated).replace(",", "."))
            masses = [Decimal(str(v).replace(",", ".")) for v in dry if v not in (None, "")]
        except (InvalidOperation, TypeError):
            raise ValueError(f"Massas inválidas no CP {index}.") from None
        if not wet.is_finite() or wet <= 0 or any(not m.is_finite() or m <= 0 for m in masses):
            raise ValueError(f"Massas inválidas no CP {index}.")
        if not masses or wet < masses[-1]:
            raise ValueError(f"A massa saturada do CP {index} deve ser maior ou igual à massa seca final.")
        absorption = (wet - masses[-1]) / masses[-1] * 100
        variation = abs(masses[-1] - masses[-2]) / masses[-2] * 100 if len(masses) >= 2 else None
        stable = variation is not None and variation <= Decimal("0.5")
        status = "PENDENTE" if not stable else "FORA" if absorption > Decimal(str(criteria["absorcao_ind_max_pct"])) else "DENTRO"
        rows.append({"cp": index, "status": status, "absorcao_pct": float(absorption),
                     "variacao_final_pct": float(variation) if variation is not None else None,
                     "massa_seca_final_g": float(masses[-1])})
        if stable:
            values.append(absorption)
    mean = sum(values) / len(values) if len(values) == len(bodies) else None
    statuses = [row["status"] for row in rows]
    overall = "FORA" if "FORA" in statuses or mean is not None and mean > Decimal(str(criteria["absorcao_media_max_pct"])) else "PENDENTE" if "PENDENTE" in statuses else "DENTRO"
    return {"corpos": rows, "media_pct": float(mean) if mean is not None else None, "status": overall,
            "limite_individual_pct": float(criteria["absorcao_ind_max_pct"]),
            "limite_media_pct": float(criteria["absorcao_media_max_pct"])}


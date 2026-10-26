"""Pure FL-PRO-22 calculations. Stored results always come from this module."""
from decimal import Decimal


# ABNT NBR 8451-2:2020, Table A.1: height, nominal resistance, top,
# base with conicity A (20 mm/m), base with conicity B (15 mm/m), in mm.
CIRCULAR_MODELS = [
    (9,150,140,320,275),(9,200,140,320,275),(9,300,170,350,305),(9,400,170,350,305),(9,600,190,370,325),(9,1000,230,410,365),
    (10,150,140,340,290),(10,300,170,370,320),(10,400,170,370,320),(10,600,190,390,340),(10,1000,230,430,380),(10,1500,290,490,440),
    (10.5,150,140,350,297),(10.5,300,170,380,328),(10.5,600,190,400,347),(10.5,1000,230,440,387),
    (11,200,140,360,305),(11,300,170,390,335),(11,400,170,390,335),(11,600,190,410,355),(11,1000,230,450,395),(11,1500,290,510,455),
    (12,300,170,410,350),(12,400,170,410,350),(12,600,190,430,370),(12,1000,230,470,410),(12,1500,290,530,470),(12,2000,330,570,510),(12,3000,430,670,610),
    (13,300,170,430,365),(13,400,170,430,365),(13,600,190,450,385),(13,1000,230,490,425),(13,1500,290,550,485),(13,2000,330,590,525),
    (14,400,170,450,380),(14,600,190,470,400),(14,1000,230,510,440),(14,1500,290,570,500),
    (15,600,190,490,415),(15,1000,230,530,455),(15,2000,330,630,555),
    (18,600,190,550,460),(18,1000,230,590,500),(18,2000,330,690,600),
    (20,1000,230,630,530),(20,2000,330,730,630),
]
CIRCULAR_DIMENSIONS = {
    f"C|{height:g}|{resistance}|C|{variant}": {"diametro_topo": top, "diametro_base": base}
    for height, resistance, top, base_a, base_b in CIRCULAR_MODELS
    for variant, base in (("A", base_a), ("B", base_b))
}

# ABNT NBR 8451-2:2020, Table A.2. Each load is the nominal load on face B.
# Values are (a, A, b, B), in mm. Shared table cells apply to all listed loads.
DT_GROUPS = [
    (9, (150,200), (120,264,100,190)), (9, (300,400,600), (140,392,110,290)), (9, (1000,), (182,434,140,320)),
    (10, (150,), (120,280,100,200)), (10, (300,400,600), (140,420,110,310)), (10, (1000,), (182,462,140,340)),
    (10.5, (150,), (120,288,100,205)), (10.5, (300,600), (140,434,110,320)), (10.5, (1000,), (182,476,140,350)), (10.5, (2000,), (266,560,200,410)),
    (11, (200,), (120,296,100,210)), (11, (300,400,600), (140,448,110,330)), (11, (1000,), (182,490,140,360)),
    (12, (200,), (120,312,100,220)), (12, (300,400,600), (140,476,110,350)), (12, (1000,), (182,518,140,380)), (12, (2000,), (266,602,200,440)), (12, (3000,), (308,644,230,470)),
    (13, (300,400,600), (140,504,110,370)),
    (13.5, (600,), (140,518,110,380)), (13.5, (1000,), (182,560,140,410)), (13.5, (2000,), (266,644,200,470)), (13.5, (3000,), (308,686,230,500)),
    (15, (600,), (140,560,110,410)), (15, (3000,), (308,728,230,530)),
    (18, (600,), (140,644,110,470)),
]
DT_DIMENSIONS = {
    f"DT|{height:g}|{load}|B": {
        "largura_topo": dimensions[0], "largura_base": dimensions[1],
        "espessura_topo": dimensions[2], "espessura_base": dimensions[3],
    }
    for height, loads, dimensions in DT_GROUPS for load in loads
}


def catalog_nominals(pole, reference=None):
    """Fill missing catalog sections from the already registered NBR A.1/A.2 tables.

    Explicit dimensions entered for a model always take precedence. Unknown models
    stay without a reference instead of receiving dimensions from another pole.
    """
    saved = dict(pole.dimensoes_nominais or {})
    if reference is not None:
        return {**reference, **saved}
    if pole.norma_parte != "8451-2":
        return saved
    section = pole.tipo.upper()
    height = f"{Decimal(str(pole.altura_m)).normalize():f}"
    resistance = f"{Decimal(str(pole.resistencia_daN)).normalize():f}"
    if section in {"C", "R", "SC"} and pole.face == "C":
        reference = CIRCULAR_DIMENSIONS.get(
            f"C|{height}|{resistance}|C|{pole.conicidade or 'A'}", {})
    elif section == "DT" and pole.face in {"A", "B"}:
        reference = DT_DIMENSIONS.get(f"DT|{height}|{resistance}|B", {})
    else:
        reference = {}
    return {**reference, **saved}

# Existing values formerly in the frontend, in millimetres. Version with criteria.
GROUNDING_DIMENSIONS = {
    "C": {"9": (75, 1000, 1500), "10": (975, 1100, 1600),
          "10.5": (1375, 1150, 1650), "11": (1875, 1200, 1700),
          "12": (2775, 1300, 1800), "13": (2775, 1400, 1900),
          "14": (2775, 1500, 2000), "15": (2775, 1600, 2100),
          "18": (2775, 1900, 2400), "20": (2775, 2100, 2600)},
    "DT": {"9": (75, 1000, 1500), "10": (975, 1100, 1600),
           "10.5": (1475, 1150, 1650), "11": (1875, 1200, 1700),
           "12": (2775, 1300, 1800), "13": (2775, 1400, 1900),
           "13.5": (2775, 1450, 1950), "15": (2775, 1600, 2100),
           "18": (2775, 1900, 2400)},
}


DEFAULT_CRITERIA = {
    "flecha_nom_pct": {"A": "5.0", "B": "3.5", "C": "3.5"},
    "flecha_res_pct": {"A": "0.50", "B": "0.35", "C": "0.35"},
    "fissura_max_mm": "0.30", "fator_excepcional": "1.4",
    "fator_ruptura": "2.0", "carro_fator": "0.30",
    "absorcao_media_max_pct": "5.5", "absorcao_ind_max_pct": "7.0",
    "validade_calibracao_meses": 12,
    # New records use nominal measures saved on each catalog model.
    # Historical tables above remain available only for review of earlier data.
    "dimensional": {
        "fonte": "Tabelas A.1/A.2 fornecidas; comprimento ±50 mm, seções ±5 mm e cota e ±15 mm; F/J sem critério ativo",
        "tolerancia_comprimento_mm": "50",
        "tolerancia_secao_mm": "5",
        "tolerancia_engastamento_mm": "15",
        "tolerancia_furacao_mm": None,
        "usar_nominais_modelo": True,
        "modelos": {},
    },
}

INSPECTION_ITEMS = {
    "identificacao": "Identificação e marcação legíveis",
    "acabamento": "Acabamento e superfície íntegros",
    "armadura": "Sem armadura exposta",
    "fissuras": "Sem fissuras ou danos visíveis",
    "furos": "Furos e acessórios conformes",
}
MEASUREMENT_ITEMS = {
    "comprimento": ("Comprimento do poste", "mm"),
    "largura_base": ("Face A · base", "mm"),
    "largura_topo": ("Face A · topo", "mm"),
    "espessura_base": ("Face B · base", "mm"),
    "espessura_topo": ("Face B · topo", "mm"),
    "diametro_base": ("Diâmetro da base", "mm"),
    "diametro_topo": ("Diâmetro do topo", "mm"),
    "engastamento": ("Engastamento (e)", "mm"),
    "furacao_f": ("Cota de furação F", "mm"),
    "furacao_j": ("Cota de furação J", "mm"),
}


def dec(value):
    if value is None or value == "":
        return None
    return Decimal(str(value).replace(",", "."))


def model_key(poste):
    height = dec(poste["altura_m"]).normalize()
    resistance = dec(poste["resistencia_daN"]).normalize()
    section = "C" if poste["tipo"].upper() == "R" else poste["tipo"].upper()
    return f"{section}|{height:f}|{resistance:f}|{poste['face'].upper()}"


def _without_standard_sections(limits, poste):
    if poste.get("nao_normatizado_8451"):
        for key in limits:
            if key.endswith(("_topo", "_base")):
                limits[key] = {"nominal_mm": None, "min_mm": None,
                               "max_mm": None, "aplicavel": False}
    return limits


def limites_dimensionais(poste, criteria):
    """Return only sourced intervals; unknown sections remain non-applicable."""
    dim = criteria.get("dimensional") or {}
    if not dim:
        return None
    if dim.get("usar_nominais_modelo"):
        nominals = poste.get("dimensoes_nominais") or {}
        section_tolerance = dec(dim.get("tolerancia_secao_mm"))
        circular = poste["tipo"].upper() in {"C", "R"}
        limits = {}
        for key in MEASUREMENT_ITEMS:
            shape_applies = (key in {"comprimento", "engastamento", "furacao_f", "furacao_j"} or
                             (key.startswith("diametro_") if circular else
                              not key.startswith("diametro_")))
            nominal = dec(nominals.get(key)) if shape_applies else None
            tolerance = (dec(dim.get("tolerancia_comprimento_mm")) if key == "comprimento" else
                         dec(dim.get("tolerancia_engastamento_mm")) if key == "engastamento" else
                         dec(dim.get("tolerancia_furacao_mm")) if key in {"furacao_f", "furacao_j"} else
                         section_tolerance)
            applicable = nominal is not None and tolerance is not None
            limits[key] = {"nominal_mm": nominal,
                           "min_mm": nominal - tolerance if applicable else None,
                           "max_mm": nominal + tolerance if applicable else None,
                           "aplicavel": applicable}
        return _without_standard_sections(limits, poste)
    section_tolerance = dec(dim["tolerancia_secao_mm"])
    models = dim.get("modelos", {})
    circular = poste["tipo"].upper() in {"C", "R"}
    if circular:
        variant = poste.get("conicidade") or "A"
        model = models.get(f"{model_key(poste)}|{variant}") or (
            models.get(model_key(poste), {}) if variant == "A" else {})
    else:
        model = models.get(model_key(poste)) or models.get(model_key({**poste, "face": "B"}), {})
    limits = {}
    grounding = ((dim.get("grounding") or {}).get("C" if circular else "DT", {})
                 .get(f"{dec(poste['altura_m']):g}")) if model else None
    for key in MEASUREMENT_ITEMS:
        if key in {"engastamento", "furacao_f", "furacao_j"}:
            index = {"furacao_f": 0, "furacao_j": 1, "engastamento": 2}[key]
            nominal = dec(grounding[index]) if grounding else None
            tolerance = dec(dim.get("tolerancia_engastamento_mm")) if key == "engastamento" else dec(dim.get("tolerancia_furacao_mm"))
            limits[key] = ({"nominal_mm": nominal, "min_mm": nominal - tolerance,
                            "max_mm": nominal + tolerance, "aplicavel": True}
                           if nominal is not None and tolerance is not None else
                           {"nominal_mm": nominal, "min_mm": None, "max_mm": None, "aplicavel": False})
            continue
        applicable_shape = key.startswith("diametro_") if circular else not key.startswith("diametro_")
        nominal = dec(model.get(key, model.get(key.replace("diametro_", "largura_")))) if applicable_shape else None
        limits[key] = ({"nominal_mm": nominal, "min_mm": nominal - section_tolerance,
                        "max_mm": nominal + section_tolerance, "aplicavel": True}
                       if nominal is not None else
                       {"nominal_mm": None, "min_mm": None, "max_mm": None, "aplicavel": False})
    return _without_standard_sections(limits, poste)


def normalizar_inspecao(inspecao, poste, criteria):
    """Keep sourced limits authoritative and accept manual gaps for measured dimensions."""
    if inspecao is None:
        return None
    limits = limites_dimensionais(poste, criteria)
    if limits is None:  # Historical criterion snapshots retain their original limits.
        return inspecao
    measures = inspecao.get("medidas") or {}
    circular = poste["tipo"].upper() in {"C", "R"}
    manual_keys = {"comprimento", "engastamento"} | (
        {"diametro_base", "diametro_topo"} if circular else
        {"largura_base", "largura_topo", "espessura_base", "espessura_topo"})
    normalized = {}
    manual_used = False
    for key, limit in limits.items():
        alias = (key.replace("espessura_", "diametro_") if poste["face"].upper() == "B" else
                 key.replace("largura_", "diametro_"))
        submitted = measures.get(key) or measures.get(alias) or {}
        reading = submitted.get("leitura_mm")
        if limit["aplicavel"]:
            normalized[key] = {**limit, "leitura_mm": reading, "origem": "tabela"}
        elif key in manual_keys and any(submitted.get(field) is not None
                                        for field in ("min_mm", "max_mm", "leitura_mm")):
            normalized[key] = {**limit, "min_mm": submitted.get("min_mm"),
                               "max_mm": submitted.get("max_mm"), "leitura_mm": reading,
                               "aplicavel": True, "origem": "manual"}
            manual_used = True
        else:
            normalized[key] = {**limit, "leitura_mm": None}
    source = ("ABNT NBR 8451-5:2020, Anexo A: L ± 0,05 m; seção sem modelo correspondente (N/A)"
              if poste["tipo"].upper() == "PL" else criteria["dimensional"]["fonte"])
    if manual_used:
        source += "; limites sem referência informados manualmente no ensaio"
    return {"checklist": inspecao.get("checklist") or {},
            "medidas": normalized,
            "fonte_limites": source}


def avaliar_inspecao(inspecao):
    """Evaluate recorded visual checks and measured intervals without inventing NBR limits."""
    if not inspecao:
        return None
    checks = inspecao.get("checklist", {})
    measurements = inspecao.get("medidas", {})
    check_results = {key: ("DENTRO" if checks.get(key) is True else
                           "FORA" if checks.get(key) is False else "PENDENTE")
                     for key in INSPECTION_ITEMS}
    measure_results = {}
    for key in MEASUREMENT_ITEMS:
        raw = measurements.get(key) or {}
        if raw.get("aplicavel") is False or (key in {"comprimento", "engastamento", "furacao_f", "furacao_j"} and key not in measurements):
            measure_results[key] = {"status": "N/A", "min_mm": None, "max_mm": None,
                                    "leitura_mm": None, "uso_tolerancia_pct": None}
            continue
        low, high, reading = (dec(raw.get(field)) for field in ("min_mm", "max_mm", "leitura_mm"))
        if low is None or high is None or reading is None:
            status, use = "PENDENTE", None
        elif low < 0 or high <= low or reading < 0:
            status, use = "PENDENTE", None
        else:
            midpoint = (low + high) / 2
            use = abs(reading - midpoint) / ((high - low) / 2) * 100
            status = "DENTRO" if low <= reading <= high else "FORA"
        measure_results[key] = {"status": status, "min_mm": low, "max_mm": high,
                                "leitura_mm": reading, "uso_tolerancia_pct": use}
    statuses = list(check_results.values()) + [item["status"] for item in measure_results.values()]
    if not str(inspecao.get("fonte_limites", "")).strip():
        statuses.append("PENDENTE")
    status = "FORA" if "FORA" in statuses else "PENDENTE" if "PENDENTE" in statuses else "DENTRO"
    return {"checklist": check_results, "medidas": measure_results, "status": status}


def parametros(poste, crit=DEFAULT_CRITERIA):
    height = dec(poste["altura_m"])
    resistance = dec(poste["resistencia_daN"])
    face = poste["face"]
    nominal = dec(crit["flecha_nom_pct"][face])
    residual = dec(crit["flecha_res_pct"][face])
    return {
        "engaste_cm": (height * dec("0.1") + dec("0.6")) * 100,
        "carro_cm": height * dec(crit["carro_fator"]) * 100,
        "carga_nom_daN": resistance,
        "flecha_max_mm": height * 1000 * nominal / 100,
        "carga_exc_daN": resistance * dec(crit["fator_excepcional"]),
        "residual_max_mm": height * 1000 * residual / 100,
        "ruptura_min_daN": resistance * dec(crit["fator_ruptura"]),
        "flecha_nom_pct": nominal, "flecha_res_pct": residual,
    }


def avaliar(poste, leituras, crit=DEFAULT_CRITERIA, inspecao_ok=True, inspecao=None):
    par = parametros(poste, crit)
    height_mm = dec(poste["altura_m"]) * 1000
    steps = {}
    steps["e1"] = {"status": "DENTRO" if leituras.get("e1") is True else "PENDENTE"}
    e2 = leituras.get("e2") or {}
    if not e2.get("aplicavel", False):
        steps["e2"] = {"status": "N/A"}
    else:
        ok = e2.get("ok")
        fiss = dec(e2.get("fissura_mm"))
        applied_ma = dec(e2.get("ma_daNm"))
        if ok is False or fiss is not None and fiss > dec(crit["fissura_max_mm"]):
            status = "FORA"
        elif ok is None or fiss is None or applied_ma is None:
            status = "PENDENTE"
        else:
            status = "DENTRO"
        steps["e2"] = {"status": status, "fissura_mm": fiss, "ma_daNm": applied_ma}
    for key, name, limit in (("e3", "flecha_mm", "flecha_max_mm"), ("e4", "flecha_mm", "residual_max_mm")):
        reading = leituras.get(key) or {}
        value = dec(reading.get(name))
        fiss = dec(reading.get("fissura_mm"))
        if value is None:
            steps[key] = {"status": "PENDENTE"}
            continue
        outside = value > par[limit] or fiss is not None and fiss > dec(crit["fissura_max_mm"])
        status = "FORA" if outside else "PENDENTE" if fiss is None else "DENTRO"
        steps[key] = {"status": status, "valor_mm": value, "limite_mm": par[limit],
                      "fissura_mm": fiss, "pct_L": value / height_mm * 100,
                      "uso_pct": value / par[limit] * 100}
    value = dec((leituras.get("e5") or {}).get("carga_daN"))
    steps["e5"] = {"status": "PENDENTE"} if value is None else {
        "status": "DENTRO" if value >= par["ruptura_min_daN"] else "FORA",
        "valor_daN": value, "limite_daN": par["ruptura_min_daN"],
        "pct_min": value / par["ruptura_min_daN"] * 100,
        "vezes_nominal": value / par["carga_nom_daN"],
    }
    inspection = avaliar_inspecao(inspecao)
    statuses = [item["status"] for item in steps.values()]
    if inspection:
        statuses.append(inspection["status"])
    verdict = ("REPROVADO" if (inspection is None and not inspecao_ok) or "FORA" in statuses else
               "EM ANDAMENTO" if "PENDENTE" in statuses else "APROVADO")
    return {"etapas": steps, "inspecao": inspection, "veredito": verdict, "parametros": par}


def absorcao(corpos, crit=DEFAULT_CRITERIA):
    results = []
    for body in corpos:
        dry, saturated = dec(body.get("massa_seca_g")), dec(body.get("massa_saturada_g"))
        if dry is None or saturated is None:
            continue
        if dry <= 0 or saturated < dry:
            raise ValueError("Massas de absorção inválidas.")
        results.append((saturated - dry) / dry * 100)
    mean = sum(results) / len(results) if results else None
    outside = any(v > dec(crit["absorcao_ind_max_pct"]) for v in results)
    outside |= mean is not None and mean > dec(crit["absorcao_media_max_pct"])
    return {"valores_pct": results, "media_pct": mean,
            "status": "FORA" if outside else "DENTRO" if len(results) == 3 else "PENDENTE"}

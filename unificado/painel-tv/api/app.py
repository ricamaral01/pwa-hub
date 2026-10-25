"""Read-only production TV summary. Nginx owns screen authorization."""

from __future__ import annotations

import json
import os
import re
import threading
import time
from collections import defaultdict
from datetime import date, datetime
from decimal import Decimal
from pathlib import Path
from zoneinfo import ZoneInfo

import psycopg
from psycopg.rows import dict_row
from flask import Flask, jsonify, request


ZONE = ZoneInfo("America/Sao_Paulo")
CATALOG = json.loads((Path(__file__).parent / "formas_fisicas.json").read_text(encoding="utf-8"))
SHEET_REFERENCES = json.loads((Path(__file__).parent / "referencias_planilha.json").read_text(encoding="utf-8"))
EXPECTED_CAPACITY = {1: 93, 2: 87, 3: 52, 4: 37}
CACHE_SECONDS = 30
app = Flask(__name__)
_cache: dict[tuple[str, str], tuple[float, dict]] = {}
_lock = threading.Lock()


def normalized(value: object) -> str:
    return re.sub(r"\s+", "", str(value or "").strip()).upper()


def sector_number(value: object) -> int | None:
    match = re.fullmatch(r"(?:SETOR\s*)?([1-4])", str(value or "").strip(), re.I)
    return int(match.group(1)) if match else None


def decimal(value: object) -> Decimal | None:
    return Decimal(str(value)) if value is not None else None


def read_pcp(day: date) -> tuple[dict[int, dict[str, dict]], dict[int, list[dict]], dict[str, dict]]:
    with psycopg.connect(os.environ["TV_PCP_READ_DSN"], row_factory=dict_row, connect_timeout=2) as conn:
        with conn.cursor() as cur:
            cur.execute("""SELECT setor_id,codigo_forma,poste AS tipo,volume_m3
                           FROM public.mapeamento_formas WHERE ativo AND setor_id IN (1,2)
                           UNION ALL
                           SELECT setor_id,codigo_forma,poste_circular AS tipo,volume_m3
                           FROM public.mapeamento_forma_postes WHERE ativo AND setor_id IN (3,4)""")
            catalog_rows = cur.fetchall()
            cur.execute("""SELECT setor_id,codigo,nome,volume FROM public.produtos
                           WHERE setor_id BETWEEN 1 AND 4""")
            product_rows = cur.fetchall()
            cur.execute("""SELECT p.setor_id,p.codigo_forma,p.quantidade_programada,
                                  p.volume_m3_programado,r.codigo AS codigo_produto,
                                  r.nome AS tipo,r.volume AS volume_unitario
                           FROM public.programacoes p
                           LEFT JOIN public.produtos r ON r.id=p.produto_id
                           WHERE p.data=%s AND p.setor_id BETWEEN 1 AND 4
                             AND p.quantidade_programada>0""", (day,))
            plan_rows = cur.fetchall()
            for sector in (3, 4):
                table = f"programacoes_circular_s{sector}"
                cur.execute(f"""SELECT %s AS setor_id,codigo_forma,1 AS quantidade_programada,
                                      volume_m3_unitario AS volume_m3_programado,
                                      codigo_produto,modelo AS tipo,
                                      volume_m3_unitario AS volume_unitario
                               FROM public.{table} WHERE data=%s""", (sector, day))
                plan_rows.extend(cur.fetchall())
    catalog: dict[int, dict[str, dict]] = {i: {} for i in range(1, 5)}
    for row in catalog_rows:
        sector = row["setor_id"]
        code = normalized(row["codigo_forma"])
        entry = catalog[sector].setdefault(code, {"codigo": row["codigo_forma"], "tipos": {}})
        unit = decimal(row["volume_m3"])
        entry["tipos"][str(row["tipo"] or "")] = float(unit) if unit and unit > 0 else None
    products = {f'{row["setor_id"]}:{normalized(row["codigo"])}': row for row in product_rows if row["codigo"]}
    plans = defaultdict(list)
    seen_form_plan: set[tuple[int, str]] = set()
    for row in plan_rows:
        sector = row["setor_id"]
        code = normalized(row["codigo_forma"])
        if code:
            key = (sector, code)
            if key in seen_form_plan:
                continue  # regular programming takes precedence over circular view
            seen_form_plan.add(key)
        plans[sector].append(dict(row))
    return catalog, plans, products


def read_mapa(day: date) -> dict[str, dict[int, dict[str, dict]]]:
    result: dict[str, dict[int, dict[str, dict]]] = {"programacao": defaultdict(dict),
                                                      "liberacao": defaultdict(dict),
                                                      "producao": defaultdict(dict)}
    selects = {
        "programacao": ("programacao_pcp", "forma,modelo,codigo_produto,descricao_poste,data_hora"),
        "liberacao": ("liberacao_formas", "forma,data_hora"),
        "producao": ("producao", "forma,modelo,codigo_produto,descricao_poste,status,tipo_concreto,data_hora"),
    }
    with psycopg.connect(os.environ["TV_MAPA_READ_DSN"], row_factory=dict_row, connect_timeout=2) as conn:
        with conn.cursor() as cur:
            for kind, (table, cols) in selects.items():
                cur.execute(f"""SELECT setor,{cols} FROM public.{table}
                                WHERE data_fabricacao=%s AND setor IN
                                ('Setor 1','Setor 2','Setor 3','Setor 4')
                                ORDER BY data_hora DESC NULLS LAST""", (day,))
                for row in cur.fetchall():
                    sector = sector_number(row["setor"])
                    code = normalized(row["forma"])
                    if sector and code and code not in result[kind][sector]:
                        result[kind][sector][code] = dict(row)
    return result


def totals(programmed: int, realized: int, released: int, previous: Decimal | None,
           actual: Decimal | None) -> dict:
    return {
        "programadas": programmed,
        "concretadas": realized,
        "liberadas": released,
        "faltam": max(0, programmed - realized),
        "percentual_realizado": round(realized * 100 / programmed) if programmed else None,
        "percentual_falta": round(max(0, programmed - realized) * 100 / programmed) if programmed else None,
        "volume_previsto_m3": float(previous) if previous is not None else None,
        "volume_realizado_m3": float(actual) if actual is not None else None,
        "volume_realizado_estimado": actual is not None,
    }


def make_summary(day: date) -> dict:
    catalog, plans, products = read_pcp(day)
    mapa = read_mapa(day)
    sectors = []
    warnings = []
    sheet_reference = SHEET_REFERENCES.get(day.isoformat(), {})
    for sector in range(1, 5):
        physical = CATALOG[str(sector)]
        form_catalog = catalog[sector]
        planned_rows = plans[sector]
        official_forms = {normalized(p["codigo_forma"]): p for p in planned_rows if normalized(p["codigo_forma"])}
        official_total = sum(int(p["quantidade_programada"] or 0) for p in planned_rows)
        mapa_program = mapa["programacao"][sector]
        if sector in (1, 2):
            programmed_codes = set(mapa_program)
            programmed_total = official_total if planned_rows else len(programmed_codes)
            if official_total != len(programmed_codes):
                warnings.append(f"Setor {sector}: Programação PCP {official_total}; formas marcadas no Mapa {len(programmed_codes)}.")
        else:
            programmed_codes = set(official_forms)
            programmed_total = len(programmed_codes)
            if not official_forms and mapa_program:
                warnings.append(f"Setor {sector}: sem programação oficial por forma; {len(mapa_program)} registros do Mapa fora da programação não entram no total.")
        if len(form_catalog) != EXPECTED_CAPACITY[sector]:
            warnings.append(f"Setor {sector}: cadastro PCP {len(form_catalog)} formas; Ricardo confirmou {EXPECTED_CAPACITY[sector]}.")
        physical_codes = {normalized(row["codigo"]) for row in physical}
        if len(physical) != len(form_catalog):
            warnings.append(f"Setor {sector}: layout físico do Mapa {len(physical)} códigos; cadastro PCP {len(form_catalog)}.")
        all_codes = list(physical)
        for code in sorted((programmed_codes | set(mapa["producao"][sector]) | set(mapa["liberacao"][sector])) - physical_codes):
            all_codes.append({"codigo": code, "modelo": ""})
        if len(all_codes) > len(physical):
            warnings.append(f"Setor {sector}: {len(all_codes)-len(physical)} códigos apontados fora do layout físico do Mapa.")
        form_rows = []
        realized_codes = set()
        released_codes = set()
        previous_volume = Decimal(0)
        actual_volume = Decimal(0)
        volume_previous_complete = bool(planned_rows)
        volume_actual_complete = True
        type_groups: dict[str, dict] = {}
        for plan in planned_rows:
            v = decimal(plan["volume_m3_programado"])
            if v is None or v <= 0:
                volume_previous_complete = False
            else:
                previous_volume += v
            kind = str(plan["tipo"] or "Tipo não identificado")
            item = type_groups.setdefault(kind, {"tipo": kind, "programadas": 0, "concretadas": 0,
                                                 "liberadas": 0, "volume_previsto_m3": 0.0,
                                                 "volume_realizado_m3": 0.0, "formas": []})
            item["programadas"] += int(plan["quantidade_programada"] or 0)
            item["volume_previsto_m3"] += float(v or 0)
        for entry in all_codes:
            code = normalized(entry["codigo"])
            program = code in programmed_codes
            production = mapa["producao"][sector].get(code)
            release = code in mapa["liberacao"][sector]
            if program and production:
                realized_codes.add(code)
            if program and release:
                released_codes.add(code)
            state = ("concretada" if production else
                     "liberada" if program and release else
                     "programada" if program else "sem_programacao")
            plan = official_forms.get(code)
            code_product = normalized((production or {}).get("codigo_produto"))
            product = products.get(f"{sector}:{code_product}")
            # The Mapa's description is not the official PCP product label. Resolve
            # by product code so the per-type numerator matches the PCP denominator.
            kind = str((plan or {}).get("tipo") or (product or {}).get("nome") or
                       ((production or {}).get("descricao_poste") if production else None) or
                       "Tipo não identificado no apontamento")
            unit = decimal((plan or {}).get("volume_unitario")) or decimal((product or {}).get("volume"))
            if unit is None and code in form_catalog and len(form_catalog[code]["tipos"]) == 1:
                unit = decimal(next(iter(form_catalog[code]["tipos"].values())))
            if code in realized_codes:
                if unit and unit > 0:
                    actual_volume += unit
                else:
                    volume_actual_complete = False
            row = {"codigo": entry["codigo"], "tipo": kind, "estado": state,
                   "programada": program, "liberada": release, "concretada": bool(production),
                   "fora_programacao": bool(production and not program),
                   "no_layout_mapa": code in physical_codes,
                   "volume_unitario_m3": float(unit) if unit and unit > 0 else None}
            form_rows.append(row)
            if program and not planned_rows:
                group = type_groups.setdefault(kind, {"tipo": kind, "programadas": 0, "concretadas": 0,
                                                        "liberadas": 0, "volume_previsto_m3": None,
                                                        "volume_realizado_m3": None, "formas": []})
                group["programadas"] += 1
            if program and (not planned_rows or kind != "Tipo não identificado no apontamento"):
                group = type_groups.setdefault(kind, {"tipo": kind, "programadas": 0, "concretadas": 0,
                                                        "liberadas": 0, "volume_previsto_m3": None,
                                                        "volume_realizado_m3": None, "formas": []})
                group["formas"].append(entry["codigo"])
                if code in realized_codes:
                    group["concretadas"] += 1
                    if unit and unit > 0 and group["volume_realizado_m3"] is not None:
                        group["volume_realizado_m3"] += float(unit)
                    else:
                        group["volume_realizado_m3"] = None
                if code in released_codes:
                    group["liberadas"] += 1
        if not planned_rows:
            volume_previous_complete = False
        if len(realized_codes) < programmed_total:
            # No volume value is imputed for pending forms.
            pass
        out = totals(programmed_total, len(realized_codes), len(released_codes),
                     previous_volume if volume_previous_complete else None,
                     actual_volume if volume_actual_complete and realized_codes else None)
        out.update({"id": sector, "nome": f"Setor {sector}",
                    "formas_cadastradas": len(form_catalog), "formas_confirmadas": EXPECTED_CAPACITY[sector],
                    "formas_layout_mapa": len(physical), "formas": form_rows,
                    "tipos": sorted(type_groups.values(), key=lambda item: item["tipo"]),
                    "apontadas_mapa": len(mapa["producao"][sector]),
                    "referencia_planilha_realizado": sheet_reference.get(str(sector)),
                    "concretadas_fora_programacao": len(set(mapa["producao"][sector]) - programmed_codes),
                    "fonte_programacao": "PCP + Mapa por forma" if planned_rows and sector in (1, 2)
                    else "PCP por forma" if official_forms else "PCP (sem programação)"})
        sectors.append(out)
        if sector in (3, 4) and sheet_reference.get(str(sector)) is not None:
            sheet_count = sheet_reference[str(sector)]
            map_count = len(mapa["producao"][sector])
            if map_count != sheet_count:
                warnings.insert(0, f"Setor {sector}: Mapa {map_count} etiquetas apontadas; planilha {sheet_count} postes realizados. Diferença {map_count - sheet_count:+d}.")
    result_total = totals(sum(s["programadas"] for s in sectors),
                          sum(s["concretadas"] for s in sectors),
                          sum(s["liberadas"] for s in sectors),
                          sum((decimal(s["volume_previsto_m3"]) or 0) for s in sectors)
                          if all(s["volume_previsto_m3"] is not None or s["programadas"] == 0 for s in sectors) else None,
                          sum((decimal(s["volume_realizado_m3"]) or 0) for s in sectors)
                          if all(s["volume_realizado_m3"] is not None or s["concretadas"] == 0 for s in sectors) else None)
    result_total["apontadas_mapa"] = sum(s["apontadas_mapa"] for s in sectors)
    return {"unidade": "campinas", "data": day.isoformat(),
            "lido_em": datetime.now(ZONE).isoformat(timespec="seconds"),
            "cache_segundos": CACHE_SECONDS, "setores": sectors, "total": result_total,
            "avisos": warnings}


@app.get("/health")
def health():
    return jsonify(ok=True)


@app.get("/resumo")
def resumo():
    unit = request.args.get("unidade", "campinas").strip().lower()
    if unit != "campinas":
        return jsonify(erro="Ainda não há fonte de dados confirmada para esta unidade."), 422
    raw_day = request.args.get("data", datetime.now(ZONE).date().isoformat())
    try:
        if not re.fullmatch(r"\d{4}-\d{2}-\d{2}", raw_day):
            raise ValueError("invalid date")
        day = date.fromisoformat(raw_day)
    except ValueError:
        return jsonify(erro="Informe a data no formato AAAA-MM-DD."), 400
    key = (unit, raw_day)
    with _lock:
        cached = _cache.get(key)
        if cached and time.monotonic() - cached[0] < CACHE_SECONDS:
            return jsonify(cached[1])
    try:
        payload = make_summary(day)
    except (psycopg.Error, OSError, KeyError, ValueError):
        app.logger.exception("TV summary unavailable")
        return jsonify(erro="Dados da produção temporariamente indisponíveis."), 503
    with _lock:
        _cache[key] = (time.monotonic(), payload)
        for old_key, (created, _) in list(_cache.items()):
            if time.monotonic() - created > CACHE_SECONDS:
                _cache.pop(old_key, None)
    return jsonify(payload)

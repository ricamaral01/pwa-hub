"""Weekly S1/S2 planning. All persisted schema changes are owned by Alembic."""
from __future__ import annotations

import logging
import math
import re
import unicodedata
from collections import defaultdict
from datetime import date, datetime, timedelta, timezone
from decimal import Decimal, ROUND_HALF_UP
from typing import Literal

import httpx
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import get_db
from app.core.security import require_roles
from app.models.mapeamento_forma import MapeamentoForma
from app.models.produto import Produto
from app.models.producao import ApontamentoMega, Producao, ProgramacaoAlex
from app.models.usuario import NivelAcesso, Usuario
from app.api.routers.pcp import _ORDEM_CODIGOS_MONTAGEM_SETOR12_INDEX

router = APIRouter(prefix="/api", tags=["programacao-semanal"])
logger = logging.getLogger("uvicorn.error")
READ = (NivelAcesso.ADMIN, NivelAcesso.PCP, NivelAcesso.PRODUCAO, NivelAcesso.CONSULTA)
WRITE = (NivelAcesso.ADMIN, NivelAcesso.PCP)
Q3 = Decimal("0.001")


class CreateWeek(BaseModel):
    semana_inicio: date
    origem: Literal["vazia", "publicada", "semana_anterior"] = "vazia"


class ItemIn(BaseModel):
    data: date
    setor_id: Literal[1, 2]
    produto_id: int
    quantidade: int = Field(ge=0)


class DayIn(BaseModel):
    data: date
    produz: bool
    mod_prevista: int


class ParametersIn(BaseModel):
    mod_padrao: int = Field(gt=0)
    estoque_seg_dias: int = Field(ge=0)


class SuggestIn(BaseModel):
    estoque_seg_dias: int = Field(ge=0)


class PublishIn(BaseModel):
    motivo: str | None = None
    avisar_producao: bool = False


def _norm(value: object) -> str:
    s = unicodedata.normalize("NFKD", str(value or "").strip().lower())
    return re.sub(r"[^a-z0-9]+", "", s.encode("ascii", "ignore").decode("ascii"))


def _monday(value: date) -> date:
    if value.weekday() != 0:
        raise HTTPException(422, "semana_inicio deve ser uma segunda-feira")
    return value


def _dates(start: date) -> list[date]:
    return [start + timedelta(days=n) for n in range(5)]


def _one(db: Session, sql: str, **params):
    return db.execute(text(sql), params).mappings().first()


def _all(db: Session, sql: str, **params):
    return [dict(row) for row in db.execute(text(sql), params).mappings()]


def _config(db: Session) -> dict:
    rows = _all(db, "SELECT chave, valor FROM public.pcp_configuracao WHERE chave LIKE 'pcp.semanal.%'")
    return {row["chave"].removeprefix("pcp.semanal."): row["valor"] for row in rows}


def _week(db: Session, week_id: int, lock: bool = False) -> dict:
    suffix = " FOR UPDATE" if lock else ""
    row = _one(db, "SELECT * FROM public.programacao_semana WHERE id=:id" + suffix, id=week_id)
    if not row:
        raise HTTPException(404, "Semana não encontrada")
    return dict(row)


def _selected_week(db: Session, start: date) -> dict | None:
    row = _one(db, """
      SELECT * FROM public.programacao_semana WHERE semana_inicio=:start
      AND status IN ('rascunho','publicada')
      ORDER BY CASE status WHEN 'rascunho' THEN 0 ELSE 1 END LIMIT 1
    """, start=start)
    return dict(row) if row else None


def _published(db: Session, start: date) -> dict | None:
    row = _one(db, """
      SELECT * FROM public.programacao_semana
      WHERE semana_inicio=:start AND status='publicada' LIMIT 1
    """, start=start)
    return dict(row) if row else None


def _days(db: Session, week_id: int) -> list[dict]:
    return _all(db, "SELECT * FROM public.programacao_semana_dia WHERE semana_id=:id ORDER BY data", id=week_id)


def _items(db: Session, week_id: int) -> list[dict]:
    return _all(db, "SELECT * FROM public.programacao_semana_item WHERE semana_id=:id ORDER BY data,setor_id,produto_id", id=week_id)


def _lock_week_key(db: Session, start: date):
    if db.bind is not None and db.bind.dialect.name == "postgresql":
        db.execute(text("SELECT pg_advisory_xact_lock(hashtextextended(:key, 0))"), {"key": f"pcp-week:{start}"})


def _mapa_locked_days(start: date) -> set[date]:
    """Fresh operational read; a failed read must never unlock a day."""
    if not settings.SUPABASE_URL or not settings.SUPABASE_ANON_KEY:
        raise HTTPException(503, "Fonte de apontamentos do Mapa não configurada")
    url = f"{settings.SUPABASE_URL.rstrip('/')}/rest/v1/{settings.SUPABASE_PRODUCAO_TABLE}"
    headers = {"apikey": settings.SUPABASE_ANON_KEY,
               "Authorization": f"Bearer {settings.SUPABASE_ANON_KEY}"}
    params = {
        "select": "data_fabricacao,setor",
        "data_fabricacao": [f"gte.{start.isoformat()}", f"lte.{(start + timedelta(days=4)).isoformat()}"],
        "setor": "in.(\"Setor 1\",\"Setor 2\")",
        "status": "in.(LIBERADO,INSPECIONADO)",
    }
    locked: set[date] = set()
    try:
        with httpx.Client(timeout=15) as client:
            offset = 0
            while True:
                response = client.get(url, headers=headers, params={**params, "limit": 1000, "offset": offset})
                response.raise_for_status()
                rows = response.json()
                if not isinstance(rows, list):
                    raise ValueError("Resposta inesperada do Mapa")
                locked.update(date.fromisoformat(row["data_fabricacao"]) for row in rows if row.get("data_fabricacao"))
                if len(rows) < 1000:
                    break
                offset += 1000
    except (httpx.HTTPError, ValueError, KeyError) as exc:
        logger.warning("Consulta de travamento do Mapa falhou: %s", exc)
        raise HTTPException(503, "Não foi possível confirmar os apontamentos do Mapa") from exc
    return locked


def _locked_days(db: Session, start: date) -> set[date]:
    locked = _mapa_locked_days(start)
    end = start + timedelta(days=4)
    rows = db.query(ApontamentoMega.data).filter(
        ApontamentoMega.data.between(start, end), ApontamentoMega.setor_id.in_((1, 2)),
    ).all()
    locked.update(row[0] for row in rows)
    rows = db.query(Producao.data).filter(
        Producao.data.between(start, end), Producao.setor_id.in_((1, 2)),
    ).all()
    locked.update(row[0] for row in rows)
    rows = _all(db, """
      SELECT DISTINCT d.data FROM public.programacao_semana_dia d
      WHERE d.semana_inicio=:start AND d.travado=true
    """, start=start)
    locked.update(row["data"] for row in rows)
    return locked


def _sync_locks(db: Session, start: date) -> set[date]:
    locked = _locked_days(db, start)
    for day in locked:
        db.execute(text("""
          UPDATE public.programacao_semana_dia SET travado=true,
            travado_em=COALESCE(travado_em, now())
          WHERE semana_inicio=:start AND data=:day AND travado=false
        """), {"start": start, "day": day})
    return locked


def _ensure_draft(week: dict):
    if week["status"] != "rascunho":
        raise HTTPException(409, "Somente rascunhos podem ser editados")


def _refused(days: list[dict], touched: list[date], locked: set[date], *, items: bool = True) -> list[dict]:
    by_date = {row["data"]: row for row in days}
    refused = []
    for day in sorted(set(touched)):
        row = by_date.get(day)
        reason = ("fora da semana" if row is None else
                  "apontado" if day in locked or row["travado"] else
                  "sem produção" if items and not row["produz"] else None)
        if reason:
            refused.append({"data": day.isoformat(), "motivo": reason})
    return refused


def _check_cells(refused: list[dict]):
    if refused:
        raise HTTPException(409, {"celulas_recusadas": refused})


def _mega(db: Session, start: date) -> tuple[date | None, int, dict[str, dict]]:
    ref = db.query(ProgramacaoAlex.data).filter(
        ProgramacaoAlex.data <= start,
        (ProgramacaoAlex.setor_id.in_((1, 2)) | ProgramacaoAlex.setor_id.is_(None)),
    ).order_by(ProgramacaoAlex.data.desc()).first()
    if not ref:
        return None, 0, {}
    ref_day = ref[0]
    rows = db.query(ProgramacaoAlex).filter(
        ProgramacaoAlex.data == ref_day,
        (ProgramacaoAlex.setor_id.in_((1, 2)) | ProgramacaoAlex.setor_id.is_(None)),
    ).order_by(ProgramacaoAlex.id.desc()).all()
    grouped = {}
    for row in rows:
        key = _norm(row.codigo_item)
        if not key:
            continue
        entry = grouped.setdefault(key, {
            "estoque": Decimal(row.qtde_estoque or 0),
            "reserva": Decimal(row.reserva or 0),
            "carteira": Decimal(row.qtde_carteira or 0),
            "saldo": Decimal(row.qtde_estoque or 0) - Decimal(row.reserva or 0) - Decimal(row.qtde_carteira or 0),
            "prod_diaria_mega": 0,
        })
        entry["prod_diaria_mega"] += int(row.producao_diaria or 0)
    return ref_day, len(rows), grouped


def _catalog(db: Session, start: date) -> tuple[list[dict], dict[int, int], dict]:
    config = _config(db)
    fallback = Decimal(config.get("kg_por_m3_fallback", "2300"))
    products = db.query(Produto).filter(Produto.setor_id.in_((1, 2))).all()
    forms = db.query(MapeamentoForma).filter(
        MapeamentoForma.setor_id.in_((1, 2)), MapeamentoForma.ativo.is_(True),
    ).all()
    by_name = {(p.setor_id, _norm(p.nome)): p for p in products}
    by_code = {(p.setor_id, _norm(p.codigo)): p for p in products if p.codigo}
    capacities: dict[int, int] = defaultdict(int)
    form_volumes: dict[int, Decimal] = {}
    form_totals: dict[int, int] = defaultdict(int)
    for form in forms:
        sid = form.setor_id
        form_totals[sid] += 1
        code = str(form.codigo_forma or "").strip().upper()
        product = None
        if sid == 2 and (re.fullmatch(r"PL\s*[- ]\s*[1-6]", code) or re.fullmatch(r"S2-934-\d+", code)):
            product = by_code.get((2, "934"))
        if product is None:
            product = by_name.get((sid, _norm(form.poste)))
        if product is None:
            product = by_name.get((sid, _norm(form.tipo_forma)))
        if product is None and form.codigo_modelo_mega:
            product = by_code.get((sid, _norm(form.codigo_modelo_mega)))
        if product is None:
            match = re.match(r"S[12]-(\d+)-", code)
            if match:
                product = by_code.get((sid, match.group(1)))
        if product:
            capacities[product.id] += 1
            form_volumes.setdefault(product.id, Decimal(form.volume_m3 or 0))
    pl = by_code.get((2, "934"))
    ple = by_code.get((2, "ple")) or by_code.get((2, "15351"))
    if pl and ple:
        capacities[ple.id] = capacities[pl.id]
        if pl.id in form_volumes:
            form_volumes[ple.id] = form_volumes[pl.id]
    mega_day, mega_count, mega = _mega(db, start)
    result = []
    for product in products:
        volume = form_volumes.get(product.id) or Decimal(product.volume or 0)
        weight_estimated = product.peso is None
        weight = Decimal(product.peso) if product.peso is not None else volume * fallback
        mega_code = _norm(product.codigo)
        stock = mega.get(mega_code)
        if stock is None and mega_code in ("ple", "15351"):
            stock = mega.get("15351" if mega_code == "ple" else "ple")
        stock = stock or {}
        result.append({
            "id": product.id, "setor_id": product.setor_id,
            "codigo": product.codigo, "nome": product.nome,
            "grupo_formas": "PL" if pl and ple and product.id in (pl.id, ple.id) else None,
            "formas": capacities[product.id],
            "vol_unit": volume.quantize(Q3, rounding=ROUND_HALF_UP),
            "peso_unit_kg": weight, "peso_estimado": weight_estimated,
            "estoque": stock.get("estoque", Decimal(0)),
            "reserva": stock.get("reserva", Decimal(0)),
            "carteira": stock.get("carteira", Decimal(0)),
            "saldo": stock.get("saldo", Decimal(0)),
            "prod_diaria_mega": stock.get("prod_diaria_mega", 0),
        })
    result.sort(key=lambda p: (
        _ORDEM_CODIGOS_MONTAGEM_SETOR12_INDEX.get(str(p["codigo"] or ""), 9999),
        p["setor_id"], str(p["codigo"] or ""), p["id"],
    ))
    return result, form_totals, {"data": mega_day, "itens_lidos": mega_count, "arquivo": None}


def _quantities(items: list[dict]) -> dict[tuple[date, int, int], int]:
    return {(row["data"], row["setor_id"], row["produto_id"]): int(row["quantidade"]) for row in items}


def _official_locked(db: Session, start: date) -> dict[tuple[date, int, int], int]:
    rows = _all(db, """
      SELECT data,setor_id,produto_id,SUM(quantidade_programada) AS quantidade
      FROM public.programacoes WHERE data BETWEEN :start AND :end
        AND setor_id IN (1,2) AND codigo_forma IS NULL AND produto_id IS NOT NULL
      GROUP BY data,setor_id,produto_id
    """, start=start, end=start + timedelta(days=4))
    return _quantities(rows)


def _baseline_locked(db: Session, start: date, published: dict | None) -> dict[tuple[date, int, int], int]:
    if published:
        return _quantities(_items(db, published["id"]))
    return _official_locked(db, start)


def _indicators(days: list[dict], items: list[dict], catalog: list[dict], form_totals: dict[int, int]) -> dict:
    products = {p["id"]: p for p in catalog}
    by_day = []
    forms_total = sum(form_totals.values())
    for day in days:
        day_items = [row for row in items if row["data"] == day["data"]]
        postes = sum(int(row["quantidade"]) for row in day_items)
        volume = sum((Decimal(row["volume_m3"]) for row in day_items), Decimal(0))
        weight = sum((products.get(row["produto_id"], {}).get("peso_unit_kg", Decimal(0)) * int(row["quantidade"]) for row in day_items), Decimal(0))
        mod = day["mod_prevista"] if day["produz"] else 0
        by_day.append({
            "data": day["data"], "postes": postes, "volume_m3": volume,
            "peso_kg": weight, "mod_prevista": mod,
            "postes_por_homem": round(postes / mod, 2) if mod else None,
            "kg_por_homem": round(float(weight) / mod, 2) if mod else None,
            "ocupacao_formas": round(postes / forms_total, 4) if forms_total and day["produz"] else None,
        })
    total_postes = sum(day["postes"] for day in by_day)
    total_volume = sum((day["volume_m3"] for day in by_day), Decimal(0))
    total_weight = sum((day["peso_kg"] for day in by_day), Decimal(0))
    total_mod = sum(day["mod_prevista"] for day in by_day)
    return {
        "dias": by_day,
        "semana": {
            "postes": total_postes, "volume_m3": total_volume,
            "peso_kg": total_weight, "mod_prevista": total_mod,
            "postes_por_homem": round(total_postes / total_mod, 2) if total_mod else None,
            "kg_por_homem": round(float(total_weight) / total_mod, 2) if total_mod else None,
            "ocupacao_formas": round(total_postes / (forms_total * sum(bool(d["produz"]) for d in days)), 4)
            if forms_total and any(d["produz"] for d in days) else None,
            "pico_m3": max((day["volume_m3"] for day in by_day), default=Decimal(0)),
        },
    }


def _validate(db: Session, week: dict, days: list[dict], items: list[dict],
              catalog: list[dict], locked: set[date]) -> dict:
    by_product = {p["id"]: p for p in catalog}
    by_day = {d["data"]: d for d in days}
    blocks, warnings = [], []
    quantities = _quantities(items)
    baseline = _baseline_locked(db, week["semana_inicio"], _published(db, week["semana_inicio"]))
    pl_by_day: dict[date, int] = defaultdict(int)
    pl_capacity = next((p["formas"] for p in catalog if p["codigo"] == "934" and p["setor_id"] == 2), 0)
    weekly_by_product: dict[int, int] = defaultdict(int)
    estimated: set[int] = set()
    for item in items:
        day, sid, pid, qty = item["data"], item["setor_id"], item["produto_id"], int(item["quantidade"])
        product = by_product.get(pid)
        if product is None or product["setor_id"] != sid or day not in by_day:
            blocks.append({"codigo": "B4", "data": day, "setor_id": sid, "produto_id": pid, "detalhe": "Produto ou setor sem vínculo"})
            continue
        if qty > product["formas"]:
            blocks.append({"codigo": "B1", "data": day, "setor_id": sid, "produto_id": pid,
                           "detalhe": f"{qty} postes para {product['formas']} formas"})
        if not by_day[day]["produz"] and qty > 0:
            blocks.append({"codigo": "B3", "data": day, "setor_id": sid, "produto_id": pid,
                           "detalhe": "Dia sem produção tem quantidade"})
        if product["grupo_formas"] == "PL":
            pl_by_day[day] += qty
        weekly_by_product[pid] += qty
        if qty > 0 and product["peso_estimado"]:
            estimated.add(pid)
    for day, total in pl_by_day.items():
        if total > pl_capacity:
            blocks.append({"codigo": "B2", "data": day, "detalhe": f"PL + PLE = {total}; limite {pl_capacity}"})
    for day in locked:
        if day not in by_day:
            continue
        keys = {key for key in set(quantities) | set(baseline) if key[0] == day}
        for key in keys:
            if quantities.get(key, 0) != baseline.get(key, 0):
                blocks.append({"codigo": "B3", "data": day, "setor_id": key[1], "produto_id": key[2],
                               "detalhe": "Dia apontado difere da programação publicada"})
    for day in days:
        if day["produz"] and day["mod_prevista"] <= 0:
            blocks.append({"codigo": "B5", "data": day["data"], "detalhe": "MOD prevista deve ser positiva"})
        if day["produz"] and not any(item["data"] == day["data"] and item["quantidade"] > 0 for item in items):
            warnings.append({"codigo": "A2", "data": day["data"], "detalhe": "Nenhum poste programado"})
    negative = [
        {"produto_id": p["id"], "codigo": p["codigo"],
         "saldo_projetado": p["saldo"] + weekly_by_product[p["id"]]}
        for p in catalog if p["saldo"] + weekly_by_product[p["id"]] < 0
    ]
    if negative:
        warnings.append({"codigo": "A1", "itens": negative, "detalhe": "Saldo projetado negativo"})
    if estimated:
        warnings.append({"codigo": "A3", "produto_ids": sorted(estimated), "detalhe": "Peso estimado por volume"})
    return {"bloqueios": blocks, "avisos": warnings}


def _suggest(catalog: list[dict], days: list[dict], items: list[dict], locked: set[date],
             estoque_seg_dias: int) -> list[dict]:
    day_list = [d["data"] for d in days if d["produz"] and d["data"] not in locked]
    locked_qty: dict[int, int] = defaultdict(int)
    for item in items:
        if item["data"] in locked:
            locked_qty[item["produto_id"]] += int(item["quantidade"])
    needs = {
        p["id"]: max(0, math.ceil(p["prod_diaria_mega"] * estoque_seg_dias - p["saldo"] - locked_qty[p["id"]]))
        for p in catalog
    }
    ranked = sorted(catalog, key=lambda p: (p["saldo"], _ORDEM_CODIGOS_MONTAGEM_SETOR12_INDEX.get(str(p["codigo"]), 9999), p["id"]))
    proposed = []
    for index, day in enumerate(day_list):
        remaining_days = len(day_list) - index
        pl_used = 0
        for p in ranked:
            cap = p["formas"]
            if p["grupo_formas"] == "PL":
                cap = max(0, cap - pl_used)
            qty = max(0, min(cap, math.ceil(needs[p["id"]] / remaining_days)))
            needs[p["id"]] -= qty
            if p["grupo_formas"] == "PL":
                pl_used += qty
            proposed.append({"data": day, "setor_id": p["setor_id"],
                             "produto_id": p["id"], "quantidade": qty})
    return proposed


@router.get("/programacao-semanal/versoes")
def versions(semana: date = Query(...), db: Session = Depends(get_db),
             user: Usuario = Depends(require_roles(*READ))):
    start = _monday(semana)
    return {"semana_inicio": start, "versoes": _all(db, """
      SELECT id,versao,status,motivo,criado_em,publicado_em,publicado_por
      FROM public.programacao_semana WHERE semana_inicio=:start ORDER BY versao DESC
    """, start=start)}


@router.get("/programacao-semanal")
def get_week(semana: date = Query(...), db: Session = Depends(get_db),
             user: Usuario = Depends(require_roles(*READ))):
    start = _monday(semana)
    week = _selected_week(db, start)
    locked = _sync_locks(db, start)
    db.commit()
    catalog, totals, mega = _catalog(db, start)
    current = _published(db, start)
    days = _days(db, week["id"]) if week else [
        {"data": d, "produz": True, "mod_prevista": int(_config(db).get("mod_padrao", 13)),
         "travado": d in locked, "travado_em": None} for d in _dates(start)
    ]
    items = _items(db, week["id"]) if week else []
    for day in days:
        day["travado"] = day["travado"] or day["data"] in locked
    return {
        "semana": week, "dias": days,
        "setores": [{"id": sid, "formas_total": totals.get(sid, 0),
                     "produtos": [p for p in catalog if p["setor_id"] == sid]} for sid in (1, 2)],
        "itens": items, "mega_base": mega,
        "publicada_atual": {
            "versao": current["versao"], "publicado_por": current["publicado_por"],
            "publicado_por_nome": db.query(Usuario.nome).filter(Usuario.id == current["publicado_por"]).scalar()
            if current["publicado_por"] else None,
            "publicado_em": current["publicado_em"],
        } if current else None,
        "indicadores": _indicators(days, items, catalog, totals),
    }


@router.post("/programacao-semana", status_code=201)
def create_week(body: CreateWeek, db: Session = Depends(get_db),
                user: Usuario = Depends(require_roles(*WRITE))):
    start = _monday(body.semana_inicio)
    _lock_week_key(db, start)
    if _selected_week(db, start) and _selected_week(db, start)["status"] == "rascunho":
        raise HTTPException(409, "Já existe rascunho para esta semana")
    current = _published(db, start)
    prior = _published(db, start - timedelta(days=7)) if body.origem == "semana_anterior" else None
    if body.origem == "publicada" and not current:
        raise HTTPException(409, "Não há semana publicada para criar revisão")
    if body.origem == "semana_anterior" and not prior:
        raise HTTPException(409, "Não há semana anterior publicada para copiar")
    source = current if body.origem == "publicada" else prior
    locked = _locked_days(db, start)
    config = _config(db)
    mega_day, _, _ = _mega(db, start)
    next_version = int(_one(db, "SELECT COALESCE(MAX(versao),0)+1 AS v FROM public.programacao_semana WHERE semana_inicio=:start", start=start)["v"])
    row = _one(db, """
      INSERT INTO public.programacao_semana
        (semana_inicio,versao,status,mod_padrao,estoque_seg_dias,mega_data_ref,criado_por,atualizado_por)
      VALUES (:start,:version,'rascunho',:mod,:safety,:mega,:user,:user) RETURNING *
    """, start=start, version=next_version,
        mod=current["mod_padrao"] if current else int(config.get("mod_padrao", 13)),
        safety=current["estoque_seg_dias"] if current else int(config.get("estoque_seg_dias", 5)),
        mega=mega_day, user=user.id)
    week = dict(row)
    source_days = {d["data"].weekday(): d for d in _days(db, source["id"])} if source else {}
    current_days = {d["data"]: d for d in _days(db, current["id"])} if current else {}
    for day in _dates(start):
        copied = current_days.get(day) if day in locked else source_days.get(day.weekday())
        _one(db, """
          INSERT INTO public.programacao_semana_dia
            (semana_id,semana_inicio,data,produz,mod_prevista,travado,travado_em)
          VALUES (:id,:start,:day,:produz,:mod,:locked,:locked_at) RETURNING id
        """, id=week["id"], start=start, day=day,
            produz=copied["produz"] if copied else True,
            mod=copied["mod_prevista"] if copied else week["mod_padrao"],
            locked=day in locked, locked_at=datetime.now(timezone.utc) if day in locked else None)
    source_items = _items(db, source["id"]) if source else []
    locked_baseline = _baseline_locked(db, start, current)
    cells: dict[tuple[date, int, int], tuple[int, Decimal]] = {}
    for item in source_items:
        new_day = start + timedelta(days=item["data"].weekday())
        if new_day not in locked:
            cells[(new_day, item["setor_id"], item["produto_id"])] = (item["quantidade"], item["volume_m3"])
    products, _, _ = _catalog(db, start)
    product_map = {p["id"]: p for p in products}
    for (day, sid, pid), quantity in locked_baseline.items():
        if day in locked:
            cells[(day, sid, pid)] = (quantity, product_map.get(pid, {}).get("vol_unit", Decimal(0)) * quantity)
    for (day, sid, pid), (quantity, volume) in cells.items():
        db.execute(text("""
          INSERT INTO public.programacao_semana_item
            (semana_id,data,setor_id,produto_id,quantidade,volume_m3)
          VALUES (:id,:day,:sid,:pid,:qty,:vol)
        """), {"id": week["id"], "day": day, "sid": sid, "pid": pid, "qty": quantity, "vol": volume})
    db.commit()
    return {"id": week["id"], "semana_inicio": start, "versao": next_version, "status": "rascunho"}


@router.put("/programacao-semana/{week_id}/itens")
def put_items(week_id: int, body: list[ItemIn], db: Session = Depends(get_db),
              user: Usuario = Depends(require_roles(*WRITE))):
    week = _week(db, week_id, lock=True)
    _ensure_draft(week)
    locked = _sync_locks(db, week["semana_inicio"])
    days = _days(db, week_id)
    by_date = {day["data"]: day for day in days}
    refused = []
    for item in body:
        day = by_date.get(item.data)
        reason = ("fora da semana" if day is None else
                  "apontado" if item.data in locked or day["travado"] else
                  "sem produção" if not day["produz"] else None)
        if reason:
            refused.append({"data": item.data.isoformat(), "setor_id": item.setor_id,
                            "produto_id": item.produto_id, "motivo": reason})
    _check_cells(refused)
    catalog, _, _ = _catalog(db, week["semana_inicio"])
    products = {p["id"]: p for p in catalog}
    invalid = [item for item in body if item.produto_id not in products or products[item.produto_id]["setor_id"] != item.setor_id]
    if invalid:
        raise HTTPException(409, {"celulas_recusadas": [
            {"data": item.data.isoformat(), "setor_id": item.setor_id,
             "produto_id": item.produto_id, "motivo": "produto sem vínculo no setor"} for item in invalid]})
    unique = {(item.data, item.setor_id, item.produto_id): item for item in body}
    for (day, sid, pid), item in unique.items():
        volume = (products[pid]["vol_unit"] * item.quantidade).quantize(Q3, rounding=ROUND_HALF_UP)
        db.execute(text("""
          INSERT INTO public.programacao_semana_item
            (semana_id,data,setor_id,produto_id,quantidade,volume_m3)
          VALUES (:id,:day,:sid,:pid,:qty,:volume)
          ON CONFLICT (semana_id,data,setor_id,produto_id)
          DO UPDATE SET quantidade=EXCLUDED.quantidade,volume_m3=EXCLUDED.volume_m3
        """), {"id": week_id, "day": day, "sid": sid, "pid": pid,
               "qty": item.quantidade, "volume": volume})
    db.execute(text("UPDATE public.programacao_semana SET atualizado_por=:user,atualizado_em=now() WHERE id=:id"),
               {"user": user.id, "id": week_id})
    db.commit()
    return {"atualizados": len(unique)}


@router.put("/programacao-semana/{week_id}/dias")
def put_days(week_id: int, body: list[DayIn], db: Session = Depends(get_db),
             user: Usuario = Depends(require_roles(*WRITE))):
    week = _week(db, week_id, lock=True)
    _ensure_draft(week)
    locked = _sync_locks(db, week["semana_inicio"])
    days = _days(db, week_id)
    _check_cells(_refused(days, [item.data for item in body], locked, items=False))
    by_date = {d["data"]: d for d in days}
    for item in body:
        if item.produz and item.mod_prevista <= 0:
            raise HTTPException(409, {"celulas_recusadas": [{"data": item.data.isoformat(), "motivo": "MOD inválida"}]})
        if not item.produz and not by_date[item.data]["produz"] and item.mod_prevista != by_date[item.data]["mod_prevista"]:
            raise HTTPException(409, {"celulas_recusadas": [{"data": item.data.isoformat(), "motivo": "dia sem produção"}]})
    for item in body:
        db.execute(text("""
          UPDATE public.programacao_semana_dia SET produz=:produz,mod_prevista=:mod
          WHERE semana_id=:id AND data=:day
        """), {"produz": item.produz, "mod": item.mod_prevista, "id": week_id, "day": item.data})
        if not item.produz:
            db.execute(text("""
              UPDATE public.programacao_semana_item SET quantidade=0,volume_m3=0
              WHERE semana_id=:id AND data=:day
            """), {"id": week_id, "day": item.data})
    db.execute(text("UPDATE public.programacao_semana SET atualizado_por=:user,atualizado_em=now() WHERE id=:id"),
               {"user": user.id, "id": week_id})
    db.commit()
    return {"atualizados": len(body)}


@router.put("/programacao-semana/{week_id}/parametros")
def put_parameters(week_id: int, body: ParametersIn, db: Session = Depends(get_db),
                   user: Usuario = Depends(require_roles(*WRITE))):
    week = _week(db, week_id, lock=True)
    _ensure_draft(week)
    locked = _sync_locks(db, week["semana_inicio"])
    mod_changed = body.mod_padrao != week["mod_padrao"]
    db.execute(text("""
      UPDATE public.programacao_semana
      SET mod_padrao=:mod,estoque_seg_dias=:safety,atualizado_por=:user,atualizado_em=now()
      WHERE id=:id
    """), {"mod": body.mod_padrao, "safety": body.estoque_seg_dias,
           "user": user.id, "id": week_id})
    for day in _days(db, week_id):
        if mod_changed and day["data"] not in locked and day["produz"]:
            db.execute(text("""
              UPDATE public.programacao_semana_dia SET mod_prevista=:mod WHERE id=:id
            """), {"mod": body.mod_padrao, "id": day["id"]})
    db.commit()
    return {"mod_padrao": body.mod_padrao, "estoque_seg_dias": body.estoque_seg_dias}


@router.post("/programacao-semana/{week_id}/sugerir")
def suggest(week_id: int, body: SuggestIn, db: Session = Depends(get_db),
            user: Usuario = Depends(require_roles(*WRITE))):
    week = _week(db, week_id)
    _ensure_draft(week)
    locked = _sync_locks(db, week["semana_inicio"])
    db.commit()  # Persist only newly detected locks; the suggestion itself is not stored.
    catalog, _, _ = _catalog(db, week["semana_inicio"])
    return {"itens": _suggest(catalog, _days(db, week_id), _items(db, week_id), locked,
                              body.estoque_seg_dias)}


@router.post("/programacao-semana/{week_id}/validar")
def validate(week_id: int, db: Session = Depends(get_db),
             user: Usuario = Depends(require_roles(*READ))):
    week = _week(db, week_id)
    locked = _sync_locks(db, week["semana_inicio"])
    db.commit()
    catalog, _, _ = _catalog(db, week["semana_inicio"])
    return _validate(db, week, _days(db, week_id), _items(db, week_id), catalog, locked)


@router.get("/programacao-semana/{week_id}/diff")
def diff(week_id: int, db: Session = Depends(get_db),
         user: Usuario = Depends(require_roles(*READ))):
    week = _week(db, week_id)
    current = _published(db, week["semana_inicio"])
    before = _quantities(_items(db, current["id"])) if current and current["id"] != week_id else {}
    after = _quantities(_items(db, week_id))
    changes = [
        {"data": day, "setor_id": sid, "produto_id": pid,
         "antes": before.get((day, sid, pid), 0), "agora": after.get((day, sid, pid), 0),
         "diferenca": after.get((day, sid, pid), 0) - before.get((day, sid, pid), 0)}
        for day, sid, pid in sorted(set(before) | set(after))
        if before.get((day, sid, pid), 0) != after.get((day, sid, pid), 0)
    ]
    return {"versao_anterior": current["versao"] if current else None, "alteracoes": changes}


def _audit_publish(db: Session, week: dict, previous: dict | None, user: Usuario):
    db.execute(text("""
      INSERT INTO producao.auditoria
        (unidade_id,entidade,entidade_id,campo,valor_de,valor_para,usuario,origem)
      VALUES (1,'programacao_semana',:id,'publicacao',:before,:after,:user,'desktop')
    """), {"id": week["id"], "before": str(previous["versao"]) if previous else None,
           "after": str(week["versao"]), "user": user.username})


@router.get("/programacao-semanal/aviso-producao")
def production_notice(db: Session = Depends(get_db),
                      user: Usuario = Depends(require_roles(*READ))):
    """Publication metadata for authenticated PCP readers."""
    row = _one(db, """
      SELECT w.id,w.semana_inicio,w.versao,w.publicado_em
      FROM public.programacao_semana w
      WHERE w.status='publicada' AND EXISTS (
        SELECT 1 FROM producao.auditoria a
        WHERE a.entidade='programacao_semana' AND a.entidade_id=w.id
          AND a.campo='aviso_producao'
      )
      ORDER BY w.publicado_em DESC,w.id DESC LIMIT 1
    """)
    return {"aviso": dict(row) if row else None}


@router.post("/programacao-semana/{week_id}/publicar")
def publish(week_id: int, body: PublishIn, db: Session = Depends(get_db),
            user: Usuario = Depends(require_roles(*WRITE))):
    week = _week(db, week_id, lock=True)
    _ensure_draft(week)
    _lock_week_key(db, week["semana_inicio"])
    previous = _published(db, week["semana_inicio"])
    if week["versao"] > 1 and not (body.motivo or "").strip():
        raise HTTPException(422, {"bloqueios": [{"codigo": "MOTIVO", "detalhe": "Motivo da revisão obrigatório"}]})
    locked = _sync_locks(db, week["semana_inicio"])
    days = _days(db, week_id)
    items = _items(db, week_id)
    catalog, _, _ = _catalog(db, week["semana_inicio"])
    result = _validate(db, week, days, items, catalog, locked)
    if result["bloqueios"]:
        raise HTTPException(422, result)
    for day in days:
        if day["data"] in locked:
            continue
        db.execute(text("""
          DELETE FROM public.programacoes
          WHERE data=:day AND setor_id IN (1,2)
        """), {"day": day["data"]})
        for item in items:
            if item["data"] != day["data"] or item["quantidade"] <= 0:
                continue
            db.execute(text("""
              INSERT INTO public.programacoes
                (data,setor_id,produto_id,codigo_forma,quantidade_programada,
                 volume_m3_programado,programacao_semana_id,programacao_semana_versao)
              VALUES (:day,:sid,:pid,NULL,:qty,:volume,:id,:version)
            """), {"day": day["data"], "sid": item["setor_id"],
                   "pid": item["produto_id"], "qty": item["quantidade"],
                   "volume": item["volume_m3"], "id": week_id, "version": week["versao"]})
    if previous:
        db.execute(text("UPDATE public.programacao_semana SET status='substituida' WHERE id=:id"),
                   {"id": previous["id"]})
    db.execute(text("""
      UPDATE public.programacao_semana
      SET status='publicada',publicado_por=:user,publicado_em=now(),
          atualizado_por=:user,atualizado_em=now(),motivo=:motivo
      WHERE id=:id
    """), {"id": week_id, "user": user.id,
           "motivo": (body.motivo or "").strip() or None})
    _audit_publish(db, week, previous, user)
    if body.avisar_producao:
        db.execute(text("""
          INSERT INTO producao.auditoria
            (unidade_id,entidade,entidade_id,campo,valor_de,valor_para,usuario,origem)
          VALUES (1,'programacao_semana',:id,'aviso_producao',NULL,'setores_1_2',:user,'desktop')
        """), {"id": week_id, "user": user.username})
    newly_locked = _locked_days(db, week["semana_inicio"]) - locked
    if newly_locked:
        db.rollback()
        raise HTTPException(409, {"celulas_recusadas": [
            {"data": day.isoformat(), "motivo": "apontado durante publicação"}
            for day in sorted(newly_locked)]})
    db.commit()
    return {"id": week_id, "versao": week["versao"], "status": "publicada",
            "avisos": result["avisos"],
            "aviso_producao": "disponivel_unificado" if body.avisar_producao else "nao_solicitado"}

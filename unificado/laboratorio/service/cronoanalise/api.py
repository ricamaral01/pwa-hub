"""Cronoanálise API mounted on the existing Laboratório FastAPI service."""
from __future__ import annotations

import csv
import io
import json
import math
import re
from collections import defaultdict
from datetime import datetime, timedelta, timezone
from decimal import Decimal
from typing import Any, Literal
from uuid import UUID

from fastapi import APIRouter, Depends, Request
from fastapi.encoders import jsonable_encoder
from fastapi.responses import Response, StreamingResponse
from openpyxl import Workbook
from pydantic import BaseModel, ConfigDict, Field, model_validator
from pydantic import ValidationError
from sqlalchemy import text
from sqlalchemy.exc import IntegrityError

from server.postes_api import gateway_user
from .calc.dimensionamento import dimensionar
from .calc.estatistica import resumo_medicoes

router = APIRouter(prefix="/api/laboratorio/cronoanalise", tags=["Cronoanálise"])
UNIT = "concrefer"


class CronoError(Exception):
    def __init__(self, status: int, code: str, message: str):
        self.status, self.code, self.message = status, code, message


async def crono_error_handler(_request: Request, error: CronoError):
    from fastapi.responses import JSONResponse
    return JSONResponse(status_code=error.status,
                        content={"erro": error.code, "mensagem": error.message})


def actor(request: Request):
    user = gateway_user(request)
    if not user:
        raise CronoError(401, "sessao_invalida", "Entre novamente no Unificado.")
    if not user.crono_screens:
        raise CronoError(403, "sem_permissao", "Cronoanálise não liberada para este usuário.")
    return user


def require(action: str):
    def dependency(user=Depends(actor)):
        if f"laboratorio.cronoanalise.{action}" not in user.crono_actions:
            raise CronoError(403, "sem_permissao", f"Ação {action} não liberada.")
        return user
    return dependency


def session(request: Request):
    factory = getattr(request.app.state, "postes_session", None)
    if factory is None:
        raise CronoError(503, "banco_indisponivel", "Banco do Laboratório indisponível.")
    with factory() as db:
        yield db


def rows(db, sql: str, values: dict | None = None) -> list[dict]:
    return [dict(row) for row in db.execute(text(sql), values or {}).mappings()]


def one(db, sql: str, values: dict | None = None) -> dict | None:
    row = db.execute(text(sql), values or {}).mappings().first()
    return dict(row) if row else None


def payload(value: Any):
    return jsonable_encoder(value, custom_encoder={Decimal: float})


def audit(db, user_id: str, table: str, record_id: str, action: str,
          before=None, after=None, reason=None):
    db.execute(text("""INSERT INTO cronoanalise.auditoria
      (usuario_id,tabela,registro_id,acao,antes,depois,justificativa)
      VALUES (:user,:table,:record,:action,CAST(:before AS jsonb),CAST(:after AS jsonb),:reason)"""),
      {"user": user_id, "table": table, "record": record_id, "action": action,
       "before": json.dumps(payload(before), ensure_ascii=False) if before is not None else None,
       "after": json.dumps(payload(after), ensure_ascii=False) if after is not None else None,
       "reason": reason})


class Strict(BaseModel):
    model_config = ConfigDict(extra="forbid", allow_inf_nan=False)


class Pause(Strict):
    inicio: datetime
    fim: datetime
    motivo: str = Field(min_length=1)


class Measurement(Strict):
    id: UUID
    atividade_codigo: str
    setor: int | None = Field(default=None, ge=1, le=4)
    forma: str | None = None
    tipo_poste: str | None = None
    equipamento: str | None = None
    batelada: str | None = None
    pessoas: int = Field(ge=1, le=20)
    inicio: datetime
    fim: datetime
    bruta_s: Decimal = Field(ge=0)
    duracao_s: Decimal = Field(ge=0)
    pausas: list[Pause] = Field(default_factory=list)
    distancia_m: Decimal | None = Field(default=None, gt=0)
    observacao: str | None = None
    cronometrista_nome: str | None = None
    dispositivo_id: str | None = None
    app_versao: str | None = None

    @model_validator(mode="after")
    def check_time(self):
        if self.inicio.tzinfo is None or self.fim.tzinfo is None or self.fim < self.inicio:
            raise ValueError("Informe início e fim com fuso e em ordem.")
        if self.duracao_s > self.bruta_s + 1:
            raise ValueError("Duração efetiva maior que a bruta.")
        if any(p.inicio.tzinfo is None or p.fim.tzinfo is None or p.fim < p.inicio
               or p.inicio < self.inicio or p.fim > self.fim for p in self.pausas):
            raise ValueError("Pausa fora do intervalo da medição.")
        return self


class Batch(Strict):
    medicoes: list[Measurement] = Field(max_length=500)


class Reason(Strict):
    motivo: str = Field(min_length=1)


class ActivityInput(Strict):
    codigo: str = Field(pattern=r"^[A-Z][0-9]{2,3}$")
    processo: Literal["desforma", "montagem", "usina", "concretagem"]
    nome: str = Field(min_length=1)
    tipo: Literal["trabalho", "deslocamento", "espera"]
    pessoas_padrao: int = Field(ge=1, le=20)
    estimativa_min: Decimal = Field(gt=0)
    por_cacamba: bool
    ponto_inicio: str
    ponto_fim: str
    ordem: int
    ativo: bool = True


@router.get("/status")
def status(user=Depends(actor), db=Depends(session)):
    state = one(db, """SELECT count(*) AS medicoes,max(criado_em) AS ultima_medicao
                  FROM cronoanalise.medicoes WHERE unidade_codigo=:unit""", {"unit": UNIT})
    versions = [r["versao"] for r in rows(db, "SELECT versao FROM cronoanalise.schema_migrations ORDER BY versao")]
    return payload({"schema": "cronoanalise", "revisao": versions, **state})


@router.get("/atividades")
def activities(user=Depends(actor), db=Depends(session)):
    return payload(rows(db, """SELECT * FROM cronoanalise.atividades
        WHERE unidade_codigo=:unit ORDER BY ordem,codigo""", {"unit": UNIT}))


@router.post("/atividades")
def create_activity(item: ActivityInput, user=Depends(require("configurar")), db=Depends(session)):
    data = item.model_dump(mode="json")
    try:
        db.execute(text("""INSERT INTO cronoanalise.atividades
          (unidade_codigo,codigo,processo,nome,tipo,pessoas_padrao,estimativa_min,
           por_cacamba,ponto_inicio,ponto_fim,ordem,ativo,atualizado_por)
          VALUES (:unit,:codigo,:processo,:nome,:tipo,:pessoas_padrao,:estimativa_min,
                  :por_cacamba,:ponto_inicio,:ponto_fim,:ordem,:ativo,:user)"""),
          {**data, "unit": UNIT, "user": user.id})
        audit(db, user.id, "atividades", item.codigo, "criar", after=data)
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise CronoError(409, "codigo_existente", "Código já cadastrado.") from exc
    return data


@router.put("/atividades/{codigo}")
def update_activity(codigo: str, item: ActivityInput, user=Depends(require("configurar")), db=Depends(session)):
    if item.codigo != codigo:
        raise CronoError(422, "codigo_imutavel", "O código da atividade não pode mudar.")
    before = one(db, "SELECT * FROM cronoanalise.atividades WHERE unidade_codigo=:unit AND codigo=:code",
                 {"unit": UNIT, "code": codigo})
    if not before:
        raise CronoError(404, "nao_encontrada", "Atividade não encontrada.")
    data = item.model_dump(mode="json")
    db.execute(text("""UPDATE cronoanalise.atividades SET nome=:nome,tipo=:tipo,
      pessoas_padrao=:pessoas_padrao,estimativa_min=:estimativa_min,por_cacamba=:por_cacamba,
      ponto_inicio=:ponto_inicio,ponto_fim=:ponto_fim,ordem=:ordem,ativo=:ativo,
      atualizado_por=:user,atualizado_em=now()
      WHERE unidade_codigo=:unit AND codigo=:codigo"""), {**data, "user": user.id, "unit": UNIT})
    audit(db, user.id, "atividades", codigo, "alterar", before, data)
    db.commit()
    return data


def save_measurement(db, item: Measurement, user_id: str) -> str:
    if one(db, "SELECT id FROM cronoanalise.medicoes WHERE id=:id", {"id": item.id}):
        return "ja_existia"
    activity = one(db, """SELECT processo,tipo FROM cronoanalise.atividades
                       WHERE unidade_codigo=:unit AND codigo=:code AND ativo""",
                   {"unit": UNIT, "code": item.atividade_codigo})
    if not activity:
        raise ValueError("Atividade inexistente ou inativa")
    if activity["tipo"] == "deslocamento" and item.distancia_m is None:
        raise ValueError("Distância obrigatória para deslocamento")
    data = item.model_dump()
    db.execute(text("""INSERT INTO cronoanalise.medicoes
      (id,unidade_codigo,atividade_codigo,processo,setor,forma,tipo_poste,equipamento,
       batelada,pessoas,inicio,fim,bruta_s,duracao_s,distancia_m,observacao,
       cronometrista_nome,autor_id,dispositivo_id,app_versao)
      VALUES (:id,:unit,:atividade_codigo,:processo,:setor,:forma,:tipo_poste,:equipamento,
       :batelada,:pessoas,:inicio,:fim,:bruta_s,:duracao_s,:distancia_m,:observacao,
       :cronometrista_nome,:autor_id,:dispositivo_id,:app_versao)"""),
       {**data, "unit": UNIT, "processo": activity["processo"], "autor_id": user_id})
    for pause in item.pausas:
        db.execute(text("""INSERT INTO cronoanalise.pausas(medicao_id,inicio,fim,motivo)
                           VALUES (:id,:inicio,:fim,:motivo)"""),
                   {"id": item.id, **pause.model_dump()})
    audit(db, user_id, "medicoes", str(item.id), "criar", after=item.model_dump(mode="json"))
    return "gravada"


@router.post("/medicoes/lote")
def batch(body: Batch, user=Depends(require("coletar")), db=Depends(session)):
    result = {"gravadas": [], "ja_existiam": [], "rejeitadas": []}
    for item in body.medicoes:
        try:
            with db.begin_nested():
                outcome = save_measurement(db, item, user.id)
            result["gravadas" if outcome == "gravada" else "ja_existiam"].append(str(item.id))
        except (ValueError, IntegrityError) as exc:
            result["rejeitadas"].append({"id": str(item.id), "motivo": str(exc)})
    db.commit()
    return result


@router.post("/medicoes/importar-prototipo")
async def import_prototype(request: Request, user=Depends(require("analisar")), db=Depends(session)):
    raw = (await request.body()).decode("utf-8-sig")
    reader = csv.DictReader(io.StringIO(raw), delimiter=";")
    required = {"id", "inicio", "fim", "atividade_id", "pessoas", "duracao_s", "bruta_s"}
    if not reader.fieldnames or not required.issubset(reader.fieldnames):
        raise CronoError(422, "csv_invalido", "CSV do protótipo sem as colunas obrigatórias.")
    result = {"gravadas": [], "ja_existiam": [], "rejeitadas": []}
    for line, source in enumerate(reader, start=2):
        try:
            def number(value):
                return value.replace(",", ".") if value else None
            item = Measurement(id=source["id"], atividade_codigo=source["atividade_id"],
                setor=int(source["setor"]) if source.get("setor") else None,
                forma=source.get("forma") or None, tipo_poste=source.get("tipo_poste") or None,
                equipamento=source.get("equipamento") or None, batelada=source.get("batelada") or None,
                pessoas=int(source["pessoas"]), inicio=source["inicio"], fim=source["fim"],
                bruta_s=number(source["bruta_s"]), duracao_s=number(source["duracao_s"]),
                distancia_m=number(source.get("distancia_m")), observacao=source.get("obs") or None,
                cronometrista_nome=source.get("cronometrista") or None)
            with db.begin_nested():
                outcome = save_measurement(db, item, user.id)
                if outcome == "gravada" and source.get("valido", "").lower() in {"false", "0", "não", "nao"}:
                    reason = source.get("invalid_motivo") or "Invalidada no protótipo"
                    db.execute(text("""UPDATE cronoanalise.medicoes SET valido=false,
                      invalid_motivo=:reason,invalid_por=:user,invalid_em=now() WHERE id=:id"""),
                      {"reason": reason, "user": user.id, "id": item.id})
                    audit(db, user.id, "medicoes", str(item.id), "invalidar", reason=reason)
            result["gravadas" if outcome == "gravada" else "ja_existiam"].append(str(item.id))
        except (ValueError, IntegrityError, TypeError, ValidationError) as exc:
            result["rejeitadas"].append({"linha": line, "id": source.get("id"), "motivo": str(exc)})
    db.commit()
    return result


def measurements_query(filters: dict):
    where = ["m.unidade_codigo=:unit"]
    values = {"unit": UNIT}
    names = {"processo": "m.processo", "atividade": "m.atividade_codigo", "setor": "m.setor",
             "valido": "m.valido", "autor": "m.autor_id", "tipo_poste": "m.tipo_poste"}
    for key, col in names.items():
        if filters.get(key) is not None:
            where.append(f"{col}=:{key}")
            values[key] = filters[key]
    if filters.get("de"):
        where.append("m.inicio >= :de")
        values["de"] = filters["de"]
    if filters.get("ate"):
        where.append("m.inicio <= :ate")
        values["ate"] = filters["ate"]
    if filters.get("cursor"):
        where.append("(m.inicio,m.id) < (:cursor_inicio,:cursor_id)")
        try:
            values["cursor_inicio"], values["cursor_id"] = filters["cursor"].split("|", 1)
        except ValueError as exc:
            raise CronoError(422, "cursor_invalido", "Cursor inválido.") from exc
    return " AND ".join(where), values


@router.get("/medicoes")
def list_measurements(request: Request, limite: int = 100, user=Depends(actor), db=Depends(session)):
    if not 1 <= limite <= 500:
        raise CronoError(422, "limite_invalido", "Limite deve estar entre 1 e 500.")
    filters = dict(request.query_params)
    where, values = measurements_query(filters)
    items = rows(db, f"""SELECT m.* FROM cronoanalise.medicoes m WHERE {where}
                       ORDER BY m.inicio DESC,m.id DESC LIMIT :limit""", {**values, "limit": limite + 1})
    next_cursor = None
    if len(items) > limite:
        items = items[:limite]
        next_cursor = f"{items[-1]['inicio'].isoformat()}|{items[-1]['id']}"
    return payload({"medicoes": items, "proximo_cursor": next_cursor})


def export_rows(db, request):
    where, values = measurements_query(dict(request.query_params))
    return rows(db, f"SELECT m.* FROM cronoanalise.medicoes m WHERE {where} ORDER BY m.inicio DESC,m.id DESC", values)


EXPORT_FIELDS = ("id", "inicio", "fim", "processo", "atividade_codigo", "setor", "forma",
                 "tipo_poste", "equipamento", "batelada", "pessoas", "duracao_s", "bruta_s",
                 "distancia_m", "cronometrista_nome", "valido", "invalid_motivo", "observacao")


@router.get("/medicoes/exportar.csv")
def export_csv(request: Request, user=Depends(require("analisar")), db=Depends(session)):
    out = io.StringIO()
    writer = csv.writer(out, delimiter=";")
    writer.writerow(EXPORT_FIELDS)
    for row in export_rows(db, request):
        writer.writerow([str(row.get(key, "") or "").replace(".", ",") if isinstance(row.get(key), Decimal)
                         else row.get(key, "") for key in EXPORT_FIELDS])
    return Response("\ufeff" + out.getvalue(), media_type="text/csv; charset=utf-8",
                    headers={"Content-Disposition": 'attachment; filename="cronoanalise.csv"'})


@router.get("/medicoes/exportar.xlsx")
def export_xlsx(request: Request, user=Depends(require("analisar")), db=Depends(session)):
    book = Workbook(write_only=True)
    sheet = book.create_sheet("Medições")
    sheet.append(EXPORT_FIELDS)
    for row in export_rows(db, request):
        sheet.append([float(value) if isinstance(value := row.get(key), Decimal) else value
                      for key in EXPORT_FIELDS])
    stream = io.BytesIO()
    book.save(stream)
    stream.seek(0)
    return StreamingResponse(stream,
      media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      headers={"Content-Disposition": 'attachment; filename="cronoanalise.xlsx"'})


@router.get("/medicoes/{id}")
def measurement_detail(id: UUID, user=Depends(actor), db=Depends(session)):
    item = one(db, "SELECT * FROM cronoanalise.medicoes WHERE id=:id AND unidade_codigo=:unit",
               {"id": id, "unit": UNIT})
    if not item:
        raise CronoError(404, "nao_encontrada", "Medição não encontrada.")
    return payload({**item,
      "pausas": rows(db, "SELECT inicio,fim,motivo FROM cronoanalise.pausas WHERE medicao_id=:id ORDER BY inicio", {"id": id}),
      "auditoria": rows(db, """SELECT em,usuario_id,acao,antes,depois,justificativa
                          FROM cronoanalise.auditoria WHERE tabela='medicoes' AND registro_id=:id ORDER BY em""",
                         {"id": str(id)})})


@router.post("/medicoes/{id}/invalidar")
def invalidate(id: UUID, body: Reason, user=Depends(actor), db=Depends(session)):
    before = one(db, "SELECT * FROM cronoanalise.medicoes WHERE id=:id AND unidade_codigo=:unit FOR UPDATE",
                 {"id": id, "unit": UNIT})
    if not before:
        raise CronoError(404, "nao_encontrada", "Medição não encontrada.")
    analyst = "laboratorio.cronoanalise.analisar" in user.crono_actions
    collector = "laboratorio.cronoanalise.coletar" in user.crono_actions
    if not analyst and not (collector and before["autor_id"] == user.id and
                            datetime.now(timezone.utc) - before["criado_em"] <= timedelta(hours=24)):
        raise CronoError(403, "sem_permissao", "Só o autor pode invalidar nas primeiras 24 horas.")
    if not before["valido"]:
        raise CronoError(409, "ja_invalidada", "Medição já invalidada.")
    db.execute(text("""UPDATE cronoanalise.medicoes SET valido=false,invalid_motivo=:reason,
                       invalid_por=:user,invalid_em=now() WHERE id=:id"""),
               {"reason": body.motivo, "user": user.id, "id": id})
    audit(db, user.id, "medicoes", str(id), "invalidar", before,
          {"valido": False, "invalid_motivo": body.motivo}, body.motivo)
    db.commit()
    return {"valido": False}


@router.post("/medicoes/{id}/restaurar")
def restore(id: UUID, user=Depends(require("analisar")), db=Depends(session)):
    before = one(db, "SELECT * FROM cronoanalise.medicoes WHERE id=:id AND unidade_codigo=:unit FOR UPDATE",
                 {"id": id, "unit": UNIT})
    if not before:
        raise CronoError(404, "nao_encontrada", "Medição não encontrada.")
    db.execute(text("""UPDATE cronoanalise.medicoes SET valido=true,invalid_motivo=NULL,
                       invalid_por=NULL,invalid_em=NULL WHERE id=:id"""), {"id": id})
    audit(db, user.id, "medicoes", str(id), "restaurar", before, {"valido": True})
    db.commit()
    return {"valido": True}


def statistics(db):
    params = one(db, """SELECT dados FROM cronoanalise.parametros_dimensionamento
                       WHERE unidade_codigo=:unit""", {"unit": UNIT})
    config = params["dados"] if params else {}
    measured = rows(db, """SELECT atividade_codigo,duracao_s,pessoas,valido,setor,tipo_poste,distancia_m
                         FROM cronoanalise.medicoes WHERE unidade_codigo=:unit""", {"unit": UNIT})
    by_code = defaultdict(list)
    for row in measured:
        by_code[row["atividade_codigo"]].append(row)
    return {code: resumo_medicoes(group, z=float(config.get("conf", 1.96)),
                    erro_pct=float(config.get("erro", 5)), k=float(config.get("outl", 2)))
            for code, group in by_code.items()}


@router.get("/estatisticas")
def get_statistics(user=Depends(actor), db=Depends(session)):
    counts = rows(db, """SELECT codigo FROM cronoanalise.atividades
                        WHERE unidade_codigo=:unit ORDER BY ordem""", {"unit": UNIT})
    found = statistics(db)
    return payload({row["codigo"]: found.get(row["codigo"], resumo_medicoes([])) for row in counts})


class ConfigInput(Strict):
    dados: dict[str, Any]


def update_config(db, user, table: str, data: dict):
    before = one(db, f"SELECT dados FROM cronoanalise.{table} WHERE unidade_codigo=:unit", {"unit": UNIT})
    db.execute(text(f"""INSERT INTO cronoanalise.{table}(unidade_codigo,dados,atualizado_por)
        VALUES (:unit,CAST(:data AS jsonb),:user)
        ON CONFLICT (unidade_codigo) DO UPDATE SET dados=EXCLUDED.dados,
        atualizado_por=EXCLUDED.atualizado_por,atualizado_em=now()"""),
        {"unit": UNIT, "data": json.dumps(data, ensure_ascii=False), "user": user.id})
    audit(db, user.id, table, UNIT, "alterar", before, data)
    db.commit()
    return data


@router.get("/dimensionamento/parametros")
def dimension_params(user=Depends(actor), db=Depends(session)):
    item = one(db, "SELECT dados FROM cronoanalise.parametros_dimensionamento WHERE unidade_codigo=:unit",
               {"unit": UNIT})
    return item["dados"] if item else {}


@router.put("/dimensionamento/parametros")
def save_dimension_params(body: ConfigInput, user=Depends(require("configurar")), db=Depends(session)):
    required = {"turno", "intervalos", "demanda", "disponiveis", "tolPes", "tolFad", "tolEsp", "eta"}
    if not required.issubset(body.dados):
        raise CronoError(422, "parametros_invalidos", "Parâmetros obrigatórios ausentes.")
    return update_config(db, user, "parametros_dimensionamento", body.dados)


def bucket_count(layout: list[dict]) -> tuple[int, int]:
    forms = buckets = 0
    for sector in layout:
        n = int(sector["filas"]) * int(sector["formas_por_fila"])
        forms += n
        rule = sector["regra_cacambas"]
        if re.fullmatch(r"\d+/\d+", rule):
            numerator, denominator = (int(part) for part in rule.split("/"))
            amount = n * numerator / denominator
        else:
            amount = 0
            ranges = re.findall(r"(\d+)-(\d+):\s*([\d/,]+)", rule)
            if not ranges:
                raise CronoError(422, "layout_invalido", "Regra de caçambas inválida.")
            for start, end, fraction in ranges:
                fraction = fraction.replace(",", ".")
                if "/" in fraction:
                    a, b = fraction.split("/")
                    value = float(a) / float(b)
                else:
                    value = float(fraction)
                amount += (int(end) - int(start) + 1) * int(sector["filas"]) * value
        buckets += math.ceil(amount - 1e-9)
    return forms, buckets


@router.get("/dimensionamento/resultado")
def dimension_result(user=Depends(actor), db=Depends(session)):
    activities = rows(db, """SELECT codigo,processo,tipo,pessoas_padrao,estimativa_min,por_cacamba
                            FROM cronoanalise.atividades WHERE unidade_codigo=:unit AND ativo ORDER BY ordem""",
                      {"unit": UNIT})
    layout = rows(db, "SELECT * FROM cronoanalise.layout_setores WHERE unidade_codigo=:unit ORDER BY setor",
                  {"unit": UNIT})
    params = dimension_params(user, db)
    forms, buckets = bucket_count(layout)
    if not forms:
        raise CronoError(409, "layout_vazio", "Configure o layout antes de dimensionar.")
    try:
        return payload({**dimensionar(activities, statistics(db), params, buckets / forms),
                        "formas": forms, "cacambas": buckets})
    except (ValueError, KeyError) as exc:
        raise CronoError(422, "parametros_invalidos", str(exc)) from exc


@router.get("/simulacao/config")
def simulation_config(user=Depends(actor), db=Depends(session)):
    item = one(db, "SELECT dados FROM cronoanalise.config_simulacao WHERE unidade_codigo=:unit",
               {"unit": UNIT})
    return item["dados"] if item else {}


@router.put("/simulacao/config")
def save_simulation_config(body: ConfigInput, user=Depends(require("configurar")), db=Depends(session)):
    return update_config(db, user, "config_simulacao", body.dados)


@router.get("/simulacao/layout")
def simulation_layout(user=Depends(actor), db=Depends(session)):
    return payload(rows(db, """SELECT * FROM cronoanalise.layout_setores
                     WHERE unidade_codigo=:unit ORDER BY setor""", {"unit": UNIT}))


class LayoutRow(Strict):
    setor: int = Field(ge=1, le=4)
    distancia_monovia_m: Decimal = Field(ge=0)
    filas: int = Field(ge=1)
    formas_por_fila: int = Field(ge=1)
    primeira_forma_m: Decimal = Field(ge=0)
    ultima_forma_m: Decimal = Field(ge=0)
    lancamento_min_por_forma: Decimal = Field(gt=0)
    regra_cacambas: str = Field(min_length=1)
    corredor_m: Decimal | None = None
    setor_montagem_m: Decimal | None = None


@router.put("/simulacao/layout")
def save_simulation_layout(layout: list[LayoutRow], user=Depends(require("configurar")), db=Depends(session)):
    if {row.setor for row in layout} != {1, 2, 3, 4}:
        raise CronoError(422, "layout_invalido", "Informe exatamente os quatro setores.")
    by_sector = {row.setor: row for row in layout}
    if not (by_sector[4].distancia_monovia_m < by_sector[3].distancia_monovia_m <
            by_sector[2].distancia_monovia_m < by_sector[1].distancia_monovia_m):
        raise CronoError(422, "layout_invalido", "A monovia deve seguir S4, S3, S2, S1.")
    before = simulation_layout(user, db)
    bucket_count([row.model_dump() for row in layout])
    fields = ("setor", "distancia_monovia_m", "filas", "formas_por_fila", "primeira_forma_m",
              "ultima_forma_m", "lancamento_min_por_forma", "regra_cacambas", "corredor_m", "setor_montagem_m")
    for row in layout:
        values = row.model_dump()
        db.execute(text("""INSERT INTO cronoanalise.layout_setores
          (unidade_codigo,setor,distancia_monovia_m,filas,formas_por_fila,primeira_forma_m,
           ultima_forma_m,lancamento_min_por_forma,regra_cacambas,corredor_m,setor_montagem_m,atualizado_por)
          VALUES (:unit,:setor,:distancia_monovia_m,:filas,:formas_por_fila,:primeira_forma_m,
                  :ultima_forma_m,:lancamento_min_por_forma,:regra_cacambas,:corredor_m,:setor_montagem_m,:user)
          ON CONFLICT (unidade_codigo,setor) DO UPDATE SET
          distancia_monovia_m=EXCLUDED.distancia_monovia_m,filas=EXCLUDED.filas,
          formas_por_fila=EXCLUDED.formas_por_fila,primeira_forma_m=EXCLUDED.primeira_forma_m,
          ultima_forma_m=EXCLUDED.ultima_forma_m,
          lancamento_min_por_forma=EXCLUDED.lancamento_min_por_forma,
          regra_cacambas=EXCLUDED.regra_cacambas,corredor_m=EXCLUDED.corredor_m,
          setor_montagem_m=EXCLUDED.setor_montagem_m,atualizado_por=EXCLUDED.atualizado_por,
          atualizado_em=now()"""), {**values, "unit": UNIT, "user": user.id})
    audit(db, user.id, "layout_setores", UNIT, "alterar", before,
          [row.model_dump(mode="json") for row in layout])
    db.commit()
    return [row.model_dump(mode="json") for row in layout]


@router.get("/simulacao/tempos")
def simulation_times(user=Depends(actor), db=Depends(session)):
    activities = rows(db, """SELECT codigo,estimativa_min FROM cronoanalise.atividades
                            WHERE unidade_codigo=:unit AND ativo ORDER BY ordem""", {"unit": UNIT})
    found = statistics(db)
    result = {}
    for item in activities:
        stat = found.get(item["codigo"], {})
        measured = stat.get("n", 0) >= 3
        result[item["codigo"]] = {"media": stat["media_min"] if measured else float(item["estimativa_min"]),
           "cv": stat["cv"] if measured else 0.3, "fonte": "medido" if measured else "estimativa",
           "n": stat.get("n", 0), "por_setor": stat.get("por_setor", {})}
    return result


class ScenarioInput(Strict):
    nome: str = Field(min_length=1, max_length=120)
    dados: dict[str, Any]


@router.get("/cenarios")
def scenarios(user=Depends(actor), db=Depends(session)):
    return payload(rows(db, """SELECT * FROM cronoanalise.cenarios
                     WHERE unidade_codigo=:unit ORDER BY criado_em DESC""", {"unit": UNIT}))


@router.post("/cenarios")
def create_scenario(body: ScenarioInput, user=Depends(require("analisar")), db=Depends(session)):
    created = one(db, """INSERT INTO cronoanalise.cenarios(unidade_codigo,nome,dados,criado_por)
       VALUES (:unit,:name,CAST(:data AS jsonb),:user) RETURNING *""",
       {"unit": UNIT, "name": body.nome, "data": json.dumps(body.dados, ensure_ascii=False),
        "user": user.id})
    audit(db, user.id, "cenarios", str(created["id"]), "criar", after=created)
    db.commit()
    return payload(created)


@router.delete("/cenarios/{id}")
def delete_scenario(id: UUID, user=Depends(require("analisar")), db=Depends(session)):
    before = one(db, "SELECT * FROM cronoanalise.cenarios WHERE id=:id AND unidade_codigo=:unit",
                 {"id": id, "unit": UNIT})
    if not before:
        raise CronoError(404, "nao_encontrado", "Cenário não encontrado.")
    db.execute(text("DELETE FROM cronoanalise.cenarios WHERE id=:id"), {"id": id})
    audit(db, user.id, "cenarios", str(id), "excluir", before=before)
    db.commit()
    return {"excluido": str(id)}


class SimulationInput(Strict):
    tipo: Literal["base_cenario", "sequencias"]
    replicacoes: int = Field(ge=1, le=1000)
    entradas: dict[str, Any]
    resultado: dict[str, Any]
    motor_versao: str = Field(min_length=1, max_length=80)
    nota: str | None = None


@router.post("/simulacoes")
def create_simulation(body: SimulationInput, user=Depends(require("analisar")), db=Depends(session)):
    created = one(db, """INSERT INTO cronoanalise.simulacoes
       (unidade_codigo,tipo,replicacoes,entradas,resultado,motor_versao,criado_por,nota)
       VALUES (:unit,:type,:replicas,CAST(:inputs AS jsonb),CAST(:result AS jsonb),:engine,:user,:note)
       RETURNING *""", {"unit": UNIT, "type": body.tipo, "replicas": body.replicacoes,
       "inputs": json.dumps(body.entradas, ensure_ascii=False),
       "result": json.dumps(body.resultado, ensure_ascii=False),
       "engine": body.motor_versao, "user": user.id, "note": body.nota})
    audit(db, user.id, "simulacoes", str(created["id"]), "criar", after=created)
    db.commit()
    return payload(created)


@router.get("/simulacoes")
def simulations(user=Depends(actor), db=Depends(session)):
    return payload(rows(db, """SELECT id,tipo,replicacoes,motor_versao,criado_por,criado_em,nota,
                     resultado FROM cronoanalise.simulacoes WHERE unidade_codigo=:unit
                     ORDER BY criado_em DESC LIMIT 200""", {"unit": UNIT}))


@router.get("/simulacoes/{id}")
def simulation_detail(id: UUID, user=Depends(actor), db=Depends(session)):
    found = one(db, "SELECT * FROM cronoanalise.simulacoes WHERE id=:id AND unidade_codigo=:unit",
                {"id": id, "unit": UNIT})
    if not found:
        raise CronoError(404, "nao_encontrada", "Simulação não encontrada.")
    return payload(found)

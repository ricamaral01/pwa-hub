"""Pole test API mounted into the existing temperature application."""
from __future__ import annotations
import hashlib
import base64
import hmac
import json
import io
import os
import secrets
from pathlib import Path
from uuid import uuid4
from types import SimpleNamespace
from calendar import monthrange
from datetime import date, datetime, timedelta, timezone
from decimal import Decimal
from typing import Any, Literal

from fastapi import APIRouter, Cookie, Depends, File, HTTPException, Request, Response, UploadFile
from fastapi.encoders import jsonable_encoder
from fastapi.responses import FileResponse, HTMLResponse, StreamingResponse
from pydantic import BaseModel, ConfigDict, Field, field_validator
from sqlalchemy import desc, select, text

from .postes_db import (Absorption, AbsorptionSheet, Criterion, Equipment, InspectionPhoto, TestAttachment, CertificateAccess, CertificateSession, Pole, Responsible, Session, Test,
                        TestStep, User, password_hash, verify_password)
from .postes_rules import (INSPECTION_ITEMS, MEASUREMENT_ITEMS, absorcao, avaliar,
                           catalog_nominals, dec, normalizar_inspecao, parametros)
from .postes_report_v2 import report_html_v2 as report_html, report_pdf_v2 as report_pdf
from .postes_reports import report_xlsx
from .absorcao_sheet import calculate_sheet

COOKIE = "ct_session"
router = APIRouter()


def gateway_user(request: Request):
    """Accept only a short-lived assertion from the local unified proxy."""
    if os.getenv("LAB_UNIFIED_COPY") != "1" or request.client is None or request.client.host != "127.0.0.1":
        return None
    secret = os.getenv("LAB_GATEWAY_SIGNING_KEY", "")
    value = request.headers.get("x-lab-assertion", "")
    if len(secret) < 32 or len(value) > 2048 or value.count(".") != 1:
        return None
    try:
        encoded, signature = value.split(".", 1)
        expected = base64.urlsafe_b64encode(hmac.new(secret.encode(), encoded.encode(), hashlib.sha256).digest()).rstrip(b"=").decode()
        if not hmac.compare_digest(signature, expected):
            return None
        payload = json.loads(base64.urlsafe_b64decode(encoded + "=" * (-len(encoded) % 4)))
        name = payload.get('name')
        role = payload.get('role')
        if (not isinstance(payload.get('id'), str) or not isinstance(name, str)
                or not name.strip() or len(name) > 200
                or role not in {'tecnico', 'engenheiro', 'admin'}):
            return None
        if not isinstance(payload.get("exp"), int) or not 0 <= payload["exp"] - int(datetime.now(timezone.utc).timestamp()) <= 30:
            return None
        crono_screens = payload.get('crono_screens', [])
        crono_actions = payload.get('crono_actions', [])
        if (not isinstance(crono_screens, list) or not isinstance(crono_actions, list)
                or any(not isinstance(item, str) or not item.startswith('cronoanalise.')
                       for item in crono_screens)
                or any(not isinstance(item, str) or not item.startswith('laboratorio.cronoanalise.')
                       for item in crono_actions)):
            return None
        return SimpleNamespace(id=payload['id'], username=name.strip(), role=role,
                               active=True, crono_screens=frozenset(crono_screens),
                               crono_actions=frozenset(crono_actions))
    except (ValueError, TypeError, KeyError):
        return None


def json_data(value):
    return jsonable_encoder(value, custom_encoder={Decimal: float})


def db(request: Request):
    factory = getattr(request.app.state, "postes_session", None)
    if factory is None:
        raise HTTPException(503, "Banco PostgreSQL não configurado. Defina DATABASE_URL.")
    with factory() as session:
        yield session


def current_user(request: Request, session=Depends(db)):
    gateway = gateway_user(request)
    if gateway:
        return gateway
    raw = request.cookies.get(COOKIE, "")
    if not raw:
        raise HTTPException(401, "Faça login para acessar a aplicação.")
    record = session.get(Session, hashlib.sha256(raw.encode()).hexdigest())
    expiry = record.expires_at.replace(tzinfo=timezone.utc) if record and record.expires_at.tzinfo is None else record.expires_at if record else None
    if record is None or expiry < datetime.now(timezone.utc):
        raise HTTPException(401, "Sessão expirada. Faça login novamente.")
    user = session.get(User, record.user_id)
    if user is None or not user.active:
        raise HTTPException(401, "Usuário inativo.")
    return user


def privileged(user=Depends(current_user)):
    if user.role not in ("engenheiro", "admin"):
        raise HTTPException(403, "Apenas engenheiro ou administrador pode alterar este registro.")
    return user


class Strict(BaseModel):
    model_config = ConfigDict(extra="forbid")


class Login(Strict):
    username: str = Field(min_length=1, max_length=80)
    password: str = Field(min_length=1)


class UserInput(Strict):
    username: str = Field(min_length=3, max_length=80, pattern=r"^[A-Za-z0-9_.-]+$")
    password: str = Field(min_length=12, max_length=200)
    role: Literal["tecnico", "engenheiro", "admin"] = "tecnico"


class PoleInput(Strict):
    tipo: str = Field(min_length=1, max_length=20)
    face: Literal["A", "B", "C"]
    conicidade: Literal["A", "B"] = "A"
    altura_m: Decimal = Field(ge=5, le=30)
    resistencia_daN: Decimal = Field(ge=50, le=5000)
    ma_daNm: Decimal | None = Field(default=None, ge=0)
    norma_parte: str = "8451-2"
    descricao: str = ""
    dimensoes_nominais: dict[str, Decimal | None] = Field(default_factory=dict)

    @field_validator("dimensoes_nominais")
    @classmethod
    def validate_nominals(cls, values):
        allowed = {"largura_topo", "espessura_topo", "largura_base", "espessura_base",
                   "diametro_topo", "diametro_base", "comprimento", "engastamento", "furacao_f", "furacao_j"}
        if set(values) - allowed or any(v is not None and (not v.is_finite() or v <= 0) for v in values.values()):
            raise ValueError("Informe medidas nominais válidas em milímetros.")
        return values

    @field_validator("altura_m", "resistencia_daN", "ma_daNm", mode="before")
    @classmethod
    def comma(cls, value):
        return value.replace(",", ".") if isinstance(value, str) else value


class MeasurementInput(Strict):
    nominal_mm: Decimal | None = Field(default=None, ge=0)
    min_mm: Decimal | None = Field(default=None, ge=0)
    max_mm: Decimal | None = Field(default=None, ge=0)
    leitura_mm: Decimal | None = Field(default=None, ge=0)
    aplicavel: bool | None = None

    @field_validator("nominal_mm", "min_mm", "max_mm", "leitura_mm", mode="before")
    @classmethod
    def comma(cls, value):
        return value.replace(",", ".") if isinstance(value, str) and value else None if value == "" else value

    @field_validator("nominal_mm", "min_mm", "max_mm", "leitura_mm")
    @classmethod
    def finite(cls, value):
        if value is not None and not value.is_finite():
            raise ValueError("A medição deve ser um número finito.")
        return value


class InspectionInput(Strict):
    checklist: dict[str, bool | None] = Field(default_factory=dict)
    medidas: dict[str, MeasurementInput] = Field(default_factory=dict)
    fonte_limites: str = Field(default="", max_length=200)

    @field_validator("checklist")
    @classmethod
    def check_names(cls, value):
        if set(value) - set(INSPECTION_ITEMS):
            raise ValueError("Item de checklist desconhecido.")
        return value

    @field_validator("medidas")
    @classmethod
    def measure_names(cls, value):
        if set(value) - set(MEASUREMENT_ITEMS):
            raise ValueError("Medição desconhecida.")
        return value


class TestInput(Strict):
    numero_amostra: str = Field(min_length=1, max_length=40)
    numero_serie_poste: str | None = Field(default=None, max_length=80)
    poste: PoleInput
    poste_modelo_id: str | None = None
    data_fabricacao: date | None = None
    data_ensaio: date = Field(default_factory=date.today)
    fabrica: str = Field(default="Concrefer Campinas", max_length=150)
    inspecao_geral_ok: bool = True
    inspecao: InspectionInput | None = None
    equipamento_id: str | None = None
    inspetor_id: str | None = None
    engenheiro_id: str | None = None
    leituras: dict[str, Any] = Field(default_factory=dict)
    absorcao: list[dict[str, Any]] = Field(default_factory=list, max_length=3)
    observacoes: str = Field(default="", max_length=5000)


class RevisionInput(Strict):
    motivo: str = Field(min_length=8, max_length=1000)
    ensaio: TestInput


class AbsorptionBodyInput(Strict):
    massa_saturada_g: str = Field(default="", max_length=30)
    massas_secas_g: list[str] = Field(default_factory=list, max_length=8)


class AbsorptionSheetInput(Strict):
    modelo: str = Field(min_length=1, max_length=150)
    numero_amostra: str = Field(default="", max_length=80)
    inicio_imersao: str = Field(default="", max_length=50)
    entrada_estufa: str = Field(default="", max_length=50)
    fim_ensaio: str = Field(default="", max_length=50)
    balanca: str = Field(default="", max_length=100)
    estufa: str = Field(default="", max_length=100)
    responsavel: str = Field(default="", max_length=150)
    corpos: list[AbsorptionBodyInput] = Field(min_length=1, max_length=20)


class CriterionInput(Strict):
    valores: dict[str, Any]
    motivo: str = Field(min_length=8, max_length=1000)


class EquipmentInput(Strict):
    descricao: str = Field(min_length=1, max_length=150)
    capacidade_kgf: Decimal = Field(gt=0)
    numero_serie: str = Field(min_length=1)
    certificado: str = Field(min_length=1)
    data_calibracao: date
    validade_meses: int = Field(ge=1, le=120, default=12)


class ResponsibleInput(Strict):
    nome: str = Field(min_length=1, max_length=150)
    funcao: Literal["inspetor", "engenheiro"]
    registro: str | None = None


def latest_criterion(session):
    return session.scalar(select(Criterion).order_by(desc(Criterion.versao)).limit(1))


def references_by_model(session):
    """Read the imported A.1/A.2 tables once for the whole model catalog."""
    rows = session.execute(text("""
        SELECT tipo,face,conicidade,comprimento_m,carga_nominal_dan,
               tabela,item,subtipo,massa_aproximada_kg,dimensoes_nominais
        FROM ensaio_postes.referencia_dimensional
    """)).mappings()
    return {
        (r["tipo"], r["face"], r["conicidade"], Decimal(r["comprimento_m"]),
         Decimal(r["carga_nominal_dan"])): r
        for r in rows
    }


def reference_for_model(references, model):
    if model.norma_parte != "8451-2":
        return None
    key = (model.tipo.upper(), model.face.upper(), model.conicidade,
           Decimal(model.altura_m), Decimal(model.resistencia_daN))
    return references.get(key)


def resolve_nominals(session, payload: TestInput):
    """Resolve an exact catalog model even when its specifications were typed."""
    payload.poste.dimensoes_nominais = {}
    if payload.poste_modelo_id:
        model = session.get(Pole, payload.poste_modelo_id)
    else:
        rows = session.scalars(select(Pole).where(
            Pole.ativo.is_(True), Pole.tipo == payload.poste.tipo,
            Pole.altura_m == payload.poste.altura_m,
            Pole.resistencia_daN == payload.poste.resistencia_daN,
            Pole.conicidade == payload.poste.conicidade)).all()
        matches = [row for row in rows if row.face == payload.poste.face]
        if len(matches) != 1:
            return
        model = matches[0]
        payload.poste_modelo_id = model.id
    if model is None or not model.ativo:
        raise HTTPException(422, "Modelo de poste não encontrado no cadastro.")
    if (model.tipo != payload.poste.tipo or
            model.face != payload.poste.face or
            model.conicidade != payload.poste.conicidade or
            Decimal(model.altura_m) != payload.poste.altura_m or
            Decimal(model.resistencia_daN) != payload.poste.resistencia_daN):
        raise HTTPException(422, "O modelo selecionado não corresponde aos dados do poste.")
    reference = reference_for_model(references_by_model(session), model)
    payload.poste.dimensoes_nominais = catalog_nominals(
        model, reference["dimensoes_nominais"] if reference else {})


def evaluate_payload(payload: TestInput, criteria):
    for name, reading in payload.leituras.items():
        if name not in {"e1", "e2", "e3", "e4", "e5"}:
            raise HTTPException(422, f"Etapa inválida: {name}")
        if name == "e1" and not isinstance(reading, bool):
            raise HTTPException(422, "Acomodação deve ser confirmada com verdadeiro ou falso.")
        if name != "e1" and not isinstance(reading, dict):
            raise HTTPException(422, f"Leituras da etapa {name} inválidas.")
        if isinstance(reading, dict):
            for key, value in reading.items():
                if key in {"flecha_mm", "fissura_mm", "carga_daN", "ma_daNm"} and value not in (None, ""):
                    try:
                        numeric = Decimal(str(value).replace(",", "."))
                        if not numeric.is_finite():
                            raise HTTPException(422, "Leitura numérica inválida.")
                        if numeric < 0:
                            raise HTTPException(422, "Leituras não podem ser negativas.")
                    except (ValueError, ArithmeticError) as exc:
                        raise HTTPException(422, "Leitura numérica inválida.") from exc
    poste = payload.poste.model_dump()
    try:
        inspection = normalizar_inspecao(payload.inspecao.model_dump() if payload.inspecao else None,
                                         poste, criteria)
        result = avaliar(poste, payload.leituras, criteria, payload.inspecao_geral_ok, inspection)
    except (ValueError, ArithmeticError, TypeError, KeyError) as exc:
        raise HTTPException(422, "Leituras inválidas.") from exc
    try:
        result["absorcao"] = absorcao(payload.absorcao, criteria)
    except (ValueError, ArithmeticError) as exc:
        raise HTTPException(422, str(exc)) from exc
    return json_data(result)


def record_dict(record: Test):
    return json_data({"id": record.id, "numero_amostra": record.numero_amostra,
        "numero_serie_poste": record.numero_serie_poste, "inspecao": record.inspecao_data,
        "poste_modelo_id": record.poste_modelo_id, "poste": record.poste_snapshot,
        "data_fabricacao": record.data_fabricacao, "data_ensaio": record.data_ensaio,
        "fabrica": record.fabrica, "inspecao_geral_ok": record.inspecao_geral_ok,
        "equipamento_id": record.equipamento_id, "inspetor_id": record.inspetor_id,
        "engenheiro_id": record.engenheiro_id, "criterio_versao": record.criterio_versao,
        "criterios_snapshot": record.criterios_snapshot, "parametros_calculados": record.parametros_calculados,
        "leituras": record.leituras, "absorcao": record.absorcao_data, "resultados": record.resultados, "status": record.status,
        "veredito": record.veredito, "revisao": record.revisao, "anterior_id": record.anterior_id,
        "motivo_revisao": record.motivo_revisao, "observacoes": record.observacoes or "",
        "criado_em": record.criado_em, "criado_por": record.criado_por})


def save_steps(session, record):
    for row in session.scalars(select(TestStep).where(TestStep.ensaio_id == record.id)).all():
        session.delete(row)
    session.flush()
    for n in range(1, 6):
        key = f"e{n}"
        reading = record.leituras.get(key, {})
        session.add(TestStep(ensaio_id=record.id, etapa=n,
            aplicavel=not (n == 2 and not (reading or {}).get("aplicavel", False)),
            leituras=json_data(reading), resultado=record.resultados["etapas"][key]))


def save_absorption(session, record, bodies):
    for row in session.scalars(select(Absorption).where(Absorption.ensaio_id == record.id)).all():
        session.delete(row)
    session.flush()
    values = record.resultados["absorcao"]["valores_pct"]
    complete = [(i, body) for i, body in enumerate(bodies, 1)
                if dec(body.get("massa_seca_g")) is not None and dec(body.get("massa_saturada_g")) is not None]
    for (index, body), value in zip(complete, values):
        session.add(Absorption(ensaio_id=record.id, cp=index,
            massa_seca_g=dec(body["massa_seca_g"]), massa_saturada_g=dec(body["massa_saturada_g"]), absorcao_pct=value))


def update_test(session, record, payload, result):
    record.numero_amostra = payload.numero_amostra
    record.numero_serie_poste = payload.numero_serie_poste.strip() if payload.numero_serie_poste else None
    record.poste_modelo_id = payload.poste_modelo_id
    record.poste_snapshot = json_data(payload.poste.model_dump())
    record.data_fabricacao = payload.data_fabricacao
    record.data_ensaio = payload.data_ensaio
    record.fabrica = payload.fabrica
    record.inspecao_data = json_data(normalizar_inspecao(payload.inspecao.model_dump(),
                                                       payload.poste.model_dump(), record.criterios_snapshot)) if payload.inspecao else {}
    inspection_status = result.get("inspecao", {}).get("status") if result.get("inspecao") else None
    record.inspecao_geral_ok = inspection_status == "DENTRO" if inspection_status else payload.inspecao_geral_ok
    record.equipamento_id = payload.equipamento_id
    record.inspetor_id = payload.inspetor_id
    record.engenheiro_id = payload.engenheiro_id
    record.leituras = json_data(payload.leituras)
    record.absorcao_data = json_data(payload.absorcao)
    record.observacoes = payload.observacoes.strip()
    record.parametros_calculados = result["parametros"]
    record.resultados = result
    record.veredito = result["veredito"]
    session.flush()
    save_steps(session, record)
    save_absorption(session, record, payload.absorcao)


def get_test(session, test_id):
    record = session.get(Test, test_id)
    if record is None:
        raise HTTPException(404, "Ensaio não encontrado.")
    return record


@router.post("/api/auth/login")
def login(payload: Login, request: Request, response: Response, session=Depends(db)):
    user = session.scalar(select(User).where(User.username == payload.username))
    if user is None or not user.active or not verify_password(payload.password, user.password_hash):
        raise HTTPException(401, "Usuário ou senha inválidos.")
    raw = secrets.token_urlsafe(32)
    session.add(Session(token_hash=hashlib.sha256(raw.encode()).hexdigest(), user_id=user.id,
                        expires_at=datetime.now(timezone.utc) + timedelta(hours=12)))
    session.commit()
    response.set_cookie(COOKIE, raw, max_age=43200, httponly=True, secure=request.url.scheme == "https",
                        samesite="lax", path="/")
    return {"username": user.username, "role": user.role}


@router.post("/api/auth/logout")
def logout(request: Request, response: Response, session=Depends(db)):
    raw = request.cookies.get(COOKIE, "")
    if raw:
        record = session.get(Session, hashlib.sha256(raw.encode()).hexdigest())
        if record:
            session.delete(record)
            session.commit()
    response.delete_cookie(COOKIE, path="/")
    return {"ok": True}


@router.get("/api/auth/me")
def me(user=Depends(current_user)):
    return {"username": user.username, "role": user.role}


@router.post("/api/auth/users", status_code=201)
def create_user(payload: UserInput, user=Depends(privileged), session=Depends(db)):
    if user.role != "admin":
        raise HTTPException(403, "Apenas administrador pode criar usuários.")
    if session.scalar(select(User).where(User.username == payload.username)):
        raise HTTPException(409, "Usuário já existe.")
    session.add(User(username=payload.username, password_hash=password_hash(payload.password), role=payload.role))
    session.commit()
    return {"username": payload.username, "role": payload.role}


@router.get("/api/auth/users")
def list_users(user=Depends(privileged), session=Depends(db)):
    if user.role != "admin":
        raise HTTPException(403, "Apenas administrador pode listar usuários.")
    return [{"username": u.username, "role": u.role, "active": u.active}
            for u in session.scalars(select(User).order_by(User.username)).all()]


@router.get("/api/postes")
def poles(q: str = "", user=Depends(current_user), session=Depends(db)):
    rows = session.scalars(select(Pole).where(Pole.ativo == True).order_by(Pole.tipo, Pole.altura_m, Pole.resistencia_daN, Pole.conicidade)).all()
    references = references_by_model(session)
    result = []
    for r in rows:
        if q.lower() not in (r.descricao or "").lower():
            continue
        reference = reference_for_model(references, r)
        result.append(json_data({
            "id": r.id, "tipo": r.tipo, "face": r.face, "conicidade": r.conicidade,
            "altura_m": r.altura_m, "resistencia_daN": r.resistencia_daN,
            "ma_daNm": r.ma_daNm, "descricao": r.descricao, "norma_parte": r.norma_parte,
            "dimensoes_nominais": catalog_nominals(
                r, reference["dimensoes_nominais"] if reference else {}),
            "referencia": ({"tabela": reference["tabela"], "item": reference["item"],
                            "subtipo": reference["subtipo"],
                            "massa_aproximada_kg": reference["massa_aproximada_kg"]}
                           if reference else None),
        }))
    return result


@router.post("/api/postes", status_code=201)
def add_pole(payload: PoleInput, user=Depends(current_user), session=Depends(db)):
    row = Pole(**json_data(payload.model_dump()))
    session.add(row); session.commit()
    return {"id": row.id}


@router.put("/api/postes/{pole_id}")
def edit_pole(pole_id: str, payload: PoleInput, user=Depends(current_user), session=Depends(db)):
    row = session.get(Pole, pole_id)
    if row is None: raise HTTPException(404, "Poste não encontrado.")
    for key, value in json_data(payload.model_dump()).items(): setattr(row, key, value)
    session.commit()
    return {"id": row.id}


@router.get("/api/criterios")
def criteria(user=Depends(current_user), session=Depends(db)):
    return [json_data({"versao": c.versao, "valores": c.valores, "motivo": c.motivo,
             "vigente_desde": c.vigente_desde, "criado_por": c.criado_por})
             for c in session.scalars(select(Criterion).order_by(desc(Criterion.versao))).all()]


@router.post("/api/criterios", status_code=201)
def add_criterion(payload: CriterionInput, user=Depends(privileged), session=Depends(db)):
    old = latest_criterion(session)
    values = {**old.valores, **payload.valores}
    try:
        for face in ("A", "B", "C"):
            for key in ("flecha_nom_pct", "flecha_res_pct"):
                if not 0 < Decimal(str(values[key][face]).replace(",", ".")) <= 100:
                    raise ValueError(key)
        for key in ("fissura_max_mm", "fator_excepcional", "fator_ruptura",
                    "carro_fator", "absorcao_media_max_pct", "absorcao_ind_max_pct"):
            if Decimal(str(values[key]).replace(",", ".")) <= 0:
                raise ValueError(key)
        if Decimal(str(values["carro_fator"]).replace(",", ".")) > 1:
            raise ValueError("carro_fator")
        if not 1 <= int(values["validade_calibracao_meses"]) <= 120:
            raise ValueError("validade_calibracao_meses")
        dimensional = values.get("dimensional") or {}
        if dimensional.get("usar_nominais_modelo"):
            for name in ("tolerancia_secao_mm", "tolerancia_engastamento_mm"):
                tolerance = dec(dimensional.get(name))
                if tolerance is None or tolerance <= 0:
                    raise ValueError(name)
            drilling = dec(dimensional.get("tolerancia_furacao_mm"))
            if drilling is not None and drilling <= 0:
                raise ValueError("tolerancia_furacao_mm")
        parametros({"altura_m": 9, "resistencia_daN": 300, "face": "A"}, values)
    except (KeyError, ValueError, ArithmeticError, TypeError) as exc:
        raise HTTPException(422, "Critérios inválidos.") from exc
    row = Criterion(versao=old.versao + 1, valores=values, criado_por=user.username, motivo=payload.motivo)
    session.add(row); session.commit()
    return {"versao": row.versao}


@router.get("/api/equipamentos")
def equipment(user=Depends(current_user), session=Depends(db)):
    return [json_data({"id": e.id, "descricao": e.descricao, "capacidade_kgf": e.capacidade_kgf,
        "numero_serie": e.numero_serie, "certificado": e.certificado,
        "data_calibracao": e.data_calibracao, "validade_meses": e.validade_meses})
        for e in session.scalars(select(Equipment).where(Equipment.ativo == True)).all()]


@router.post("/api/equipamentos", status_code=201)
def add_equipment(payload: EquipmentInput, user=Depends(privileged), session=Depends(db)):
    row = Equipment(**payload.model_dump()); session.add(row); session.commit(); return {"id": row.id}


@router.put("/api/equipamentos/{equipment_id}")
def edit_equipment(equipment_id: str, payload: EquipmentInput, user=Depends(privileged), session=Depends(db)):
    old = session.get(Equipment, equipment_id)
    if old is None or not old.ativo: raise HTTPException(404, "Equipamento ativo não encontrado.")
    old.ativo = False  # Preserve the original equipment on historical reports.
    row = Equipment(**payload.model_dump())
    session.add(row); session.commit()
    return {"id": row.id, "substitui": equipment_id}


@router.get("/api/responsaveis")
def responsibles(user=Depends(current_user), session=Depends(db)):
    return [json_data({"id": r.id, "nome": r.nome, "funcao": r.funcao, "registro": r.registro})
            for r in session.scalars(select(Responsible).where(Responsible.ativo == True)).all()]


@router.post("/api/responsaveis", status_code=201)
def add_responsible(payload: ResponsibleInput, user=Depends(privileged), session=Depends(db)):
    row = Responsible(**payload.model_dump()); session.add(row); session.commit(); return {"id": row.id}


@router.put("/api/responsaveis/{responsible_id}")
def edit_responsible(responsible_id: str, payload: ResponsibleInput, user=Depends(privileged), session=Depends(db)):
    old = session.get(Responsible, responsible_id)
    if old is None or not old.ativo: raise HTTPException(404, "Responsável ativo não encontrado.")
    old.ativo = False
    row = Responsible(**payload.model_dump())
    session.add(row); session.commit()
    return {"id": row.id, "substitui": responsible_id}


@router.post("/api/calculo/parametros")
def calculate(payload: PoleInput, user=Depends(current_user), session=Depends(db)):
    return json_data(parametros(payload.model_dump(), latest_criterion(session).valores))


@router.post("/api/calculo/avaliar")
def preview(payload: TestInput, user=Depends(current_user), session=Depends(db)):
    resolve_nominals(session, payload)
    return evaluate_payload(payload, latest_criterion(session).valores)


@router.post("/api/ensaios", status_code=201)
def create_test(payload: TestInput, user=Depends(current_user), session=Depends(db)):
    resolve_nominals(session, payload)
    criterion = latest_criterion(session)
    result = evaluate_payload(payload, criterion.valores)
    record = Test(numero_amostra=payload.numero_amostra, poste_snapshot={}, data_ensaio=payload.data_ensaio,
                  criterio_versao=criterion.versao, criterios_snapshot=criterion.valores,
                  parametros_calculados={}, criado_por=user.username)
    session.add(record); session.flush()
    update_test(session, record, payload, result)
    session.commit()
    return record_dict(record)


@router.patch("/api/ensaios/{test_id}")
def patch_test(test_id: str, payload: TestInput, user=Depends(current_user), session=Depends(db)):
    record = get_test(session, test_id)
    if record.status != "rascunho": raise HTTPException(409, "Ensaio finalizado; crie uma revisão.")
    resolve_nominals(session, payload)
    if "dimensional" not in record.criterios_snapshot:
        current = latest_criterion(session)
        record.criterio_versao = current.versao
        record.criterios_snapshot = current.valores
    result = evaluate_payload(payload, record.criterios_snapshot)
    update_test(session, record, payload, result)
    session.commit()
    return record_dict(record)


@router.post("/api/ensaios/{test_id}/finalizar")
def finalize(test_id: str, user=Depends(current_user), session=Depends(db)):
    record = get_test(session, test_id)
    if record.status != "rascunho": raise HTTPException(409, "Ensaio já finalizado.")
    if any(s["status"] == "PENDENTE" for s in record.resultados["etapas"].values()):
        raise HTTPException(409, "Complete as etapas pendentes antes de finalizar.")
    inspection = record.resultados.get("inspecao")
    if inspection and (inspection["status"] == "PENDENTE"
                       or "PENDENTE" in inspection["checklist"].values()
                       or any(row["status"] == "PENDENTE" for row in inspection["medidas"].values())
                       or not str(record.inspecao_data.get("fonte_limites", "")).strip()):
        raise HTTPException(409, "Complete a checklist e as medições da inspeção geral.")
    if inspection and not record.numero_serie_poste:
        raise HTTPException(409, "Informe o número de série do poste.")
    if record.equipamento_id is None: raise HTTPException(409, "Selecione o equipamento de ensaio.")
    equipment = session.get(Equipment, record.equipamento_id)
    if equipment is None: raise HTTPException(422, "Equipamento inválido.")
    cal = equipment.data_calibracao
    month = cal.month - 1 + equipment.validade_meses
    year = cal.year + month // 12
    month = month % 12 + 1
    expiration = date(year, month, min(cal.day, monthrange(year, month)[1]))
    if record.data_ensaio > expiration:
        raise HTTPException(409, f"Calibração vencida em {expiration.isoformat()}.")
    if float(record.parametros_calculados["ruptura_min_daN"]) > float(equipment.capacidade_kgf) * 0.980665:
        raise HTTPException(409, "Capacidade do dinamômetro insuficiente para a ruptura mínima.")
    record.status = "finalizado"
    session.commit()
    return record_dict(record)


@router.post("/api/ensaios/{test_id}/revisar", status_code=201)
def revise(test_id: str, payload: RevisionInput, user=Depends(privileged), session=Depends(db)):
    old = get_test(session, test_id)
    if old.status != "finalizado": raise HTTPException(409, "Apenas ensaio finalizado pode ser revisado.")
    resolve_nominals(session, payload.ensaio)
    current = latest_criterion(session) if "dimensional" not in old.criterios_snapshot else None
    criterion_values = current.valores if current else old.criterios_snapshot
    criterion_version = current.versao if current else old.criterio_versao
    result = evaluate_payload(payload.ensaio, criterion_values)
    record = Test(numero_amostra=payload.ensaio.numero_amostra, poste_snapshot={},
                  data_ensaio=payload.ensaio.data_ensaio, criterio_versao=criterion_version,
                  criterios_snapshot=criterion_values, parametros_calculados={},
                  criado_por=user.username, revisao=old.revisao + 1, anterior_id=old.id,
                  motivo_revisao=payload.motivo)
    session.add(record); session.flush()
    update_test(session, record, payload.ensaio, result)
    session.commit()
    return record_dict(record)


@router.get("/api/ensaios")
def list_tests(de: date | None = None, ate: date | None = None, tipo: str = "", veredito: str = "",
               user=Depends(current_user), session=Depends(db)):
    query = select(Test).order_by(desc(Test.criado_em)).limit(1000)
    if de: query = query.where(Test.data_ensaio >= de)
    if ate: query = query.where(Test.data_ensaio <= ate)
    if veredito: query = query.where(Test.veredito == veredito)
    rows = session.scalars(query).all()
    return [record_dict(r) for r in rows if not tipo or r.poste_snapshot.get("tipo") == tipo]


def photo_root():
    return Path(os.getenv("POSTES_UPLOAD_DIR", str(Path(__file__).resolve().parents[1] / "data" / "postes_uploads"))).resolve()


@router.get("/api/ensaios/{test_id}/fotos")
def list_photos(test_id: str, user=Depends(current_user), session=Depends(db)):
    get_test(session, test_id)
    rows = session.scalars(select(InspectionPhoto).where(InspectionPhoto.ensaio_id == test_id)
                           .order_by(InspectionPhoto.criado_em)).all()
    return [{"id": row.id, "item": row.item, "criado_em": row.criado_em,
             "url": f"/api/ensaios/{test_id}/fotos/{row.id}"} for row in rows]


@router.post("/api/ensaios/{test_id}/fotos", status_code=201)
async def add_photo(test_id: str, request: Request, item: str,
                    user=Depends(current_user), session=Depends(db)):
    record = get_test(session, test_id)
    inspection = record.resultados.get("inspecao") or {}
    statuses = {**{key: value.get("status") for key, value in record.resultados.get("etapas", {}).items()},
                **inspection.get("checklist", {}),
                **{key: value.get("status") for key, value in inspection.get("medidas", {}).items()}}
    if item not in statuses or statuses[item] != "FORA":
        raise HTTPException(409, "Selecione um item fora do padrão para anexar a foto.")
    parts = []
    size = 0
    async for chunk in request.stream():
        size += len(chunk)
        if size > 10 * 1024 * 1024:
            raise HTTPException(413, "Foto maior que 10 MB.")
        parts.append(chunk)
    content = b"".join(parts)
    mime = request.headers.get("content-type", "").split(";", 1)[0].lower()
    signatures = {"image/jpeg": content.startswith(b"\xff\xd8\xff"),
                  "image/png": content.startswith(b"\x89PNG\r\n\x1a\n"),
                  "image/webp": content.startswith(b"RIFF") and content[8:12] == b"WEBP"}
    if not signatures.get(mime, False):
        raise HTTPException(415, "Envie uma foto JPEG, PNG ou WebP.")
    ext = {"image/jpeg": ".jpg", "image/png": ".png", "image/webp": ".webp"}[mime]
    photo_id = str(uuid4())
    filename = photo_id + ext
    target = photo_root() / filename
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_bytes(content)
    try:
        session.add(InspectionPhoto(id=photo_id, ensaio_id=test_id, item=item, arquivo=filename,
                                    tipo_mime=mime, criado_em=datetime.now(timezone.utc),
                                    criado_por=user.username))
        session.commit()
    except Exception:
        target.unlink(missing_ok=True)
        raise
    return {"id": photo_id, "item": item, "url": f"/api/ensaios/{test_id}/fotos/{photo_id}"}


@router.get("/api/ensaios/{test_id}/fotos/{photo_id}")
def read_photo(test_id: str, photo_id: str, user=Depends(current_user), session=Depends(db)):
    row = session.get(InspectionPhoto, photo_id)
    if row is None or row.ensaio_id != test_id:
        raise HTTPException(404, "Foto não encontrada.")
    target = photo_root() / row.arquivo
    if not target.is_file():
        raise HTTPException(404, "Arquivo da foto não encontrado.")
    return FileResponse(target, media_type=row.tipo_mime, headers={"Cache-Control": "private, no-store"})


def attachment_dict(row: TestAttachment):
    return {"id": row.id, "nome": row.nome_original, "tipo_mime": row.tipo_mime,
            "tamanho": row.tamanho, "criado_em": row.criado_em,
            "url": f"/api/ensaios/{row.ensaio_id}/anexos/{row.id}"}


@router.get("/api/ensaios/{test_id}/anexos")
def list_attachments(test_id: str, user=Depends(current_user), session=Depends(db)):
    get_test(session, test_id)
    return [attachment_dict(row) for row in session.scalars(select(TestAttachment)
            .where(TestAttachment.ensaio_id == test_id).order_by(TestAttachment.criado_em)).all()]


@router.post("/api/ensaios/{test_id}/anexos", status_code=201)
async def add_attachment(test_id: str, file: UploadFile = File(...),
                         user=Depends(current_user), session=Depends(db)):
    record = get_test(session, test_id)
    if record.status != "rascunho":
        raise HTTPException(409, "Ensaio finalizado; crie uma revisão para adicionar anexos.")
    content = await file.read(10 * 1024 * 1024 + 1)
    if not content or len(content) > 10 * 1024 * 1024:
        raise HTTPException(413, "Anexo vazio ou maior que 10 MB.")
    mime = (file.content_type or "").split(";", 1)[0].lower()
    valid = {"application/pdf": content.startswith(b"%PDF-"),
             "image/jpeg": content.startswith(b"\xff\xd8\xff"),
             "image/png": content.startswith(b"\x89PNG\r\n\x1a\n"),
             "image/webp": content.startswith(b"RIFF") and content[8:12] == b"WEBP"}
    if not valid.get(mime, False):
        raise HTTPException(415, "Envie PDF, JPEG, PNG ou WebP.")
    ext = {"application/pdf": ".pdf", "image/jpeg": ".jpg", "image/png": ".png", "image/webp": ".webp"}[mime]
    attachment_id = str(uuid4())
    filename = attachment_id + ext
    target = photo_root() / "anexos" / filename
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_bytes(content)
    try:
        row = TestAttachment(id=attachment_id, ensaio_id=test_id,
                             nome_original=Path(file.filename or "anexo").name[:200],
                             arquivo=filename, tipo_mime=mime, tamanho=len(content),
                             criado_por=user.username)
        session.add(row)
        session.commit()
    except Exception:
        target.unlink(missing_ok=True)
        raise
    return attachment_dict(row)


@router.get("/api/ensaios/{test_id}/anexos/{attachment_id}")
def read_attachment(test_id: str, attachment_id: str,
                    user=Depends(current_user), session=Depends(db)):
    row = session.get(TestAttachment, attachment_id)
    if row is None or row.ensaio_id != test_id:
        raise HTTPException(404, "Anexo não encontrado.")
    target = photo_root() / "anexos" / row.arquivo
    if not target.is_file():
        raise HTTPException(404, "Arquivo do anexo não encontrado.")
    return FileResponse(target, media_type=row.tipo_mime, filename=row.nome_original,
                        headers={"Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff"})


def sheet_dict(row: AbsorptionSheet):
    return json_data({"id": row.id, "dados": row.dados, "resultados": row.resultados,
                      "criterio_versao": row.criterio_versao, "criado_em": row.criado_em,
                      "atualizado_em": row.atualizado_em, "criado_por": row.criado_por})


@router.post("/api/absorcao/calcular")
def preview_absorption_sheet(payload: AbsorptionSheetInput, user=Depends(current_user), session=Depends(db)):
    try:
        return calculate_sheet([body.model_dump() for body in payload.corpos], latest_criterion(session).valores)
    except ValueError as exc:
        raise HTTPException(422, str(exc)) from exc


@router.get("/api/absorcao")
def list_absorption_sheets(user=Depends(current_user), session=Depends(db)):
    return [sheet_dict(row) for row in session.scalars(select(AbsorptionSheet)
            .order_by(desc(AbsorptionSheet.atualizado_em)).limit(200)).all()]


@router.post("/api/absorcao", status_code=201)
def create_absorption_sheet(payload: AbsorptionSheetInput, user=Depends(current_user), session=Depends(db)):
    criterion = latest_criterion(session)
    try:
        result = calculate_sheet([body.model_dump() for body in payload.corpos], criterion.valores)
    except ValueError as exc:
        raise HTTPException(422, str(exc)) from exc
    row = AbsorptionSheet(id=str(uuid4()), dados=payload.model_dump(), resultados=result,
                          criterio_versao=criterion.versao, criterios_snapshot=criterion.valores,
                          criado_em=datetime.now(timezone.utc), atualizado_em=datetime.now(timezone.utc),
                          criado_por=user.username)
    session.add(row)
    session.commit()
    return sheet_dict(row)


@router.put("/api/absorcao/{sheet_id}")
def update_absorption_sheet(sheet_id: str, payload: AbsorptionSheetInput,
                            user=Depends(current_user), session=Depends(db)):
    row = session.get(AbsorptionSheet, sheet_id)
    if row is None:
        raise HTTPException(404, "Ensaio de absorção não encontrado.")
    try:
        result = calculate_sheet([body.model_dump() for body in payload.corpos], row.criterios_snapshot)
    except ValueError as exc:
        raise HTTPException(422, str(exc)) from exc
    row.dados = payload.model_dump()
    row.resultados = result
    row.atualizado_em = datetime.now(timezone.utc)
    session.commit()
    return sheet_dict(row)


@router.get("/api/ensaios/export.xlsx")
def export_excel(de: date | None = None, ate: date | None = None, user=Depends(current_user), session=Depends(db)):
    query = select(Test).where(Test.status == "finalizado").order_by(Test.data_ensaio, Test.numero_amostra)
    if de: query = query.where(Test.data_ensaio >= de)
    if ate: query = query.where(Test.data_ensaio <= ate)
    output = report_xlsx(session.scalars(query).all(), session)
    return StreamingResponse(io.BytesIO(output), media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                             headers={"Content-Disposition": 'attachment; filename="FL-PRO-22_ensaios.xlsx"'})


@router.get("/api/ensaios/{test_id}")
def read_test(test_id: str, user=Depends(current_user), session=Depends(db)):
    return record_dict(get_test(session, test_id))


@router.get("/api/ensaios/{test_id}/relatorio", response_class=HTMLResponse)
def printable(test_id: str, user=Depends(current_user), session=Depends(db)):
    return HTMLResponse(report_html(get_test(session, test_id), session),
                        headers={"Cache-Control": "no-store, max-age=0"})


@router.get("/api/ensaios/{test_id}/laudo.pdf")
def pdf(test_id: str, user=Depends(current_user), session=Depends(db)):
    content = report_pdf(get_test(session, test_id), session)
    return StreamingResponse(io.BytesIO(content), media_type="application/pdf",
                             headers={"Content-Disposition": f'attachment; filename="laudo_{test_id}.pdf"',
                                      "Cache-Control": "no-store, max-age=0"})

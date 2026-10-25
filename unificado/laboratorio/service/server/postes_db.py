"""PostgreSQL persistence for pole tests and browser users."""
from __future__ import annotations
import hashlib
import os
import secrets
from pathlib import Path
from datetime import date, datetime, timedelta, timezone
from uuid import uuid4

from sqlalchemy import Boolean, Date, DateTime, ForeignKey, Integer, JSON, Numeric, String, Text, create_engine, select, text
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, sessionmaker
from .postes_rules import CIRCULAR_MODELS, DEFAULT_CRITERIA, avaliar

SCHEMA = "ensaio_postes"
JSON_TYPE = JSON().with_variant(JSONB, "postgresql")


class Base(DeclarativeBase):
    pass


class User(Base):
    __tablename__ = "usuario"
    __table_args__ = {"schema": SCHEMA}
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid4()))
    username: Mapped[str] = mapped_column(String(80), unique=True, nullable=False)
    password_hash: Mapped[str] = mapped_column(String(200), nullable=False)
    role: Mapped[str] = mapped_column(String(20), nullable=False, default="tecnico")
    active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)


class Session(Base):
    __tablename__ = "sessao"
    __table_args__ = {"schema": SCHEMA}
    token_hash: Mapped[str] = mapped_column(String(64), primary_key=True)
    user_id: Mapped[str] = mapped_column(ForeignKey(f"{SCHEMA}.usuario.id"), nullable=False)
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)


class Pole(Base):
    __tablename__ = "poste_modelo"
    __table_args__ = {"schema": SCHEMA}
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid4()))
    tipo: Mapped[str] = mapped_column(String(20), nullable=False)
    face: Mapped[str] = mapped_column(String(1), nullable=False)
    conicidade: Mapped[str] = mapped_column(String(1), nullable=False, default="A")
    altura_m: Mapped[float] = mapped_column(Numeric(7, 2), nullable=False)
    resistencia_daN: Mapped[float] = mapped_column(Numeric(9, 2), nullable=False)
    ma_daNm: Mapped[float | None] = mapped_column(Numeric(10, 2))
    norma_parte: Mapped[str] = mapped_column(String(20), default="8451-2")
    descricao: Mapped[str] = mapped_column(String(200), default="")
    dimensoes_nominais: Mapped[dict] = mapped_column(JSON_TYPE, nullable=False, default=dict)
    ativo: Mapped[bool] = mapped_column(Boolean, default=True)


class Criterion(Base):
    __tablename__ = "criterio"
    __table_args__ = {"schema": SCHEMA}
    versao: Mapped[int] = mapped_column(Integer, primary_key=True)
    vigente_desde: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    valores: Mapped[dict] = mapped_column(JSON_TYPE, nullable=False)
    criado_por: Mapped[str] = mapped_column(String(80), nullable=False)
    motivo: Mapped[str] = mapped_column(Text, nullable=False)


class Equipment(Base):
    __tablename__ = "equipamento"
    __table_args__ = {"schema": SCHEMA}
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid4()))
    descricao: Mapped[str] = mapped_column(String(150), nullable=False)
    capacidade_kgf: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)
    numero_serie: Mapped[str] = mapped_column(String(80), nullable=False)
    certificado: Mapped[str] = mapped_column(String(100), nullable=False)
    data_calibracao: Mapped[date] = mapped_column(Date, nullable=False)
    validade_meses: Mapped[int] = mapped_column(Integer, default=12)
    ativo: Mapped[bool] = mapped_column(Boolean, default=True)


class Responsible(Base):
    __tablename__ = "responsavel"
    __table_args__ = {"schema": SCHEMA}
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid4()))
    nome: Mapped[str] = mapped_column(String(150), nullable=False)
    funcao: Mapped[str] = mapped_column(String(20), nullable=False)
    registro: Mapped[str | None] = mapped_column(String(100))
    ativo: Mapped[bool] = mapped_column(Boolean, default=True)


class Test(Base):
    __tablename__ = "ensaio"
    __table_args__ = {"schema": SCHEMA}
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid4()))
    numero_amostra: Mapped[str] = mapped_column(String(40), nullable=False)
    numero_serie_poste: Mapped[str | None] = mapped_column(String(80))
    poste_modelo_id: Mapped[str | None] = mapped_column(ForeignKey(f"{SCHEMA}.poste_modelo.id"))
    poste_snapshot: Mapped[dict] = mapped_column(JSON_TYPE, nullable=False)
    data_fabricacao: Mapped[date | None] = mapped_column(Date)
    data_ensaio: Mapped[date] = mapped_column(Date, nullable=False)
    fabrica: Mapped[str] = mapped_column(String(150), default="Concrefer Campinas")
    inspecao_geral_ok: Mapped[bool] = mapped_column(Boolean, default=True)
    inspecao_data: Mapped[dict] = mapped_column(JSON_TYPE, nullable=False, default=dict)
    equipamento_id: Mapped[str | None] = mapped_column(ForeignKey(f"{SCHEMA}.equipamento.id"))
    inspetor_id: Mapped[str | None] = mapped_column(ForeignKey(f"{SCHEMA}.responsavel.id"))
    engenheiro_id: Mapped[str | None] = mapped_column(ForeignKey(f"{SCHEMA}.responsavel.id"))
    criterio_versao: Mapped[int] = mapped_column(Integer, nullable=False)
    criterios_snapshot: Mapped[dict] = mapped_column(JSON_TYPE, nullable=False)
    parametros_calculados: Mapped[dict] = mapped_column(JSON_TYPE, nullable=False)
    leituras: Mapped[dict] = mapped_column(JSON_TYPE, nullable=False, default=dict)
    absorcao_data: Mapped[list] = mapped_column(JSON_TYPE, nullable=False, default=list)
    resultados: Mapped[dict] = mapped_column(JSON_TYPE, nullable=False, default=dict)
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="rascunho")
    veredito: Mapped[str] = mapped_column(String(20), default="EM ANDAMENTO")
    revisao: Mapped[int] = mapped_column(Integer, default=1)
    anterior_id: Mapped[str | None] = mapped_column(String(36))
    motivo_revisao: Mapped[str | None] = mapped_column(Text)
    observacoes: Mapped[str] = mapped_column(Text, nullable=False, default="")
    criado_em: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    criado_por: Mapped[str] = mapped_column(String(80), nullable=False)


class TestStep(Base):
    __tablename__ = "ensaio_etapa"
    __table_args__ = {"schema": SCHEMA}
    ensaio_id: Mapped[str] = mapped_column(ForeignKey(f"{SCHEMA}.ensaio.id"), primary_key=True)
    etapa: Mapped[int] = mapped_column(Integer, primary_key=True)
    aplicavel: Mapped[bool] = mapped_column(Boolean, default=True)
    leituras: Mapped[dict] = mapped_column(JSON_TYPE, nullable=False, default=dict)
    resultado: Mapped[dict] = mapped_column(JSON_TYPE, nullable=False, default=dict)


class Absorption(Base):
    __tablename__ = "ensaio_absorcao"
    __table_args__ = {"schema": SCHEMA}
    ensaio_id: Mapped[str] = mapped_column(ForeignKey(f"{SCHEMA}.ensaio.id"), primary_key=True)
    cp: Mapped[int] = mapped_column(Integer, primary_key=True)
    massa_seca_g: Mapped[float] = mapped_column(Numeric(12, 3), nullable=False)
    massa_saturada_g: Mapped[float] = mapped_column(Numeric(12, 3), nullable=False)
    absorcao_pct: Mapped[float] = mapped_column(Numeric(8, 4), nullable=False)


class InspectionPhoto(Base):
    __tablename__ = "foto_inspecao"
    __table_args__ = {"schema": SCHEMA}
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid4()))
    ensaio_id: Mapped[str] = mapped_column(ForeignKey(f"{SCHEMA}.ensaio.id"), nullable=False)
    item: Mapped[str] = mapped_column(String(50), nullable=False)
    arquivo: Mapped[str] = mapped_column(String(100), nullable=False)
    tipo_mime: Mapped[str] = mapped_column(String(30), nullable=False)
    criado_em: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    criado_por: Mapped[str] = mapped_column(String(80), nullable=False)


class TestAttachment(Base):
    __tablename__ = "ensaio_anexo"
    __table_args__ = {"schema": SCHEMA}
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid4()))
    ensaio_id: Mapped[str] = mapped_column(ForeignKey(f"{SCHEMA}.ensaio.id"), nullable=False)
    nome_original: Mapped[str] = mapped_column(String(200), nullable=False)
    arquivo: Mapped[str] = mapped_column(String(100), nullable=False)
    tipo_mime: Mapped[str] = mapped_column(String(80), nullable=False)
    tamanho: Mapped[int] = mapped_column(Integer, nullable=False)
    criado_em: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    criado_por: Mapped[str] = mapped_column(String(80), nullable=False)


class CertificateAccess(Base):
    __tablename__ = "certificado_acesso"
    __table_args__ = {"schema": SCHEMA}
    ensaio_id: Mapped[str] = mapped_column(ForeignKey(f"{SCHEMA}.ensaio.id"), primary_key=True)
    login: Mapped[str] = mapped_column(String(80), unique=True, nullable=False)
    senha_hash: Mapped[str] = mapped_column(String(200), nullable=False)
    tentativas: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    bloqueado_ate: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    criado_em: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    criado_por: Mapped[str] = mapped_column(String(80), nullable=False)


class CertificateSession(Base):
    __tablename__ = "certificado_sessao"
    __table_args__ = {"schema": SCHEMA}
    token_hash: Mapped[str] = mapped_column(String(64), primary_key=True)
    ensaio_id: Mapped[str] = mapped_column(ForeignKey(f"{SCHEMA}.ensaio.id"), nullable=False)
    expira_em: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)


class AbsorptionSheet(Base):
    __tablename__ = "planilha_absorcao"
    __table_args__ = {"schema": SCHEMA}
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid4()))
    dados: Mapped[dict] = mapped_column(JSON_TYPE, nullable=False)
    resultados: Mapped[dict] = mapped_column(JSON_TYPE, nullable=False)
    criterio_versao: Mapped[int] = mapped_column(Integer, nullable=False)
    criterios_snapshot: Mapped[dict] = mapped_column(JSON_TYPE, nullable=False)
    criado_em: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    atualizado_em: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    criado_por: Mapped[str] = mapped_column(String(80), nullable=False)


def password_hash(password: str, salt: bytes | None = None) -> str:
    salt = salt or os.urandom(16)
    digest = hashlib.pbkdf2_hmac("sha256", password.encode(), salt, 600_000)
    return f"pbkdf2_sha256$600000${salt.hex()}${digest.hex()}"


def verify_password(password: str, encoded: str) -> bool:
    try:
        algorithm, count, salt, expected = encoded.split("$")
        if algorithm != "pbkdf2_sha256":
            return False
        found = hashlib.pbkdf2_hmac("sha256", password.encode(), bytes.fromhex(salt), int(count))
        return secrets.compare_digest(found, bytes.fromhex(expected))
    except (ValueError, TypeError):
        return False


def connect(url: str):
    from alembic import command
    from alembic.config import Config
    engine = create_engine(url, pool_pre_ping=True)
    config = Config()
    config.set_main_option("script_location", str(Path(__file__).resolve().parents[1] / "migrations"))
    with engine.begin() as conn:
        config.attributes["connection"] = conn
        command.upgrade(config, "head")
    return sessionmaker(engine, expire_on_commit=False)


def seed(session):
    if session.get(Criterion, 1) is None:
        session.add(Criterion(versao=1, valores=DEFAULT_CRITERIA, criado_por="sistema", motivo="Valores iniciais FL-PRO-22; validar limites normativos antes do uso em produção."))
    current_criterion = session.scalar(select(Criterion).order_by(Criterion.versao.desc()).limit(1))
    current_models = (current_criterion.valores.get("dimensional") or {}).get("modelos", {}) if current_criterion else {}
    if current_criterion is not None and not set(DEFAULT_CRITERIA["dimensional"]["modelos"]).issubset(current_models):
        session.add(Criterion(versao=current_criterion.versao + 1,
                              valores={**current_criterion.valores, "dimensional": {**DEFAULT_CRITERIA["dimensional"],
                                  "modelos": {**DEFAULT_CRITERIA["dimensional"]["modelos"], **current_models}}},
                              criado_por="sistema", motivo="Completar dimensões padronizadas das tabelas A.1 e A.2 da ABNT NBR 8451-2:2020."))
    if not session.query(Pole.id).first():
        for tipo, face, altura, resistance, label in [
            ("PL", "B", 7.5, 300, "PL 7,5/300 B"), ("PL", "A", 7.5, 150, "PL 7,5/150 A"),
            ("DT", "B", 9, 300, "DT 9/300 B"), ("DT", "B", 10.5, 600, "DT 10,5/600 B"),
            ("DT", "B", 11, 600, "DT 11/600 B"), ("DT", "B", 12, 1000, "DT 12/1000 B"),
            ("C", "C", 9, 400, "C 9/400")]:
            session.add(Pole(tipo=tipo, face=face, altura_m=altura, resistencia_daN=resistance, descricao=label))
    session.flush()
    circular_rows = session.scalars(select(Pole).where(Pole.tipo == "C")).all()
    for row in circular_rows:
        if row.descricao == "C 9/400" and row.conicidade == "A":
            row.descricao = "C 9/400 · conicidade A"
    existing_circular = {(float(row.altura_m), float(row.resistencia_daN), row.conicidade)
                         for row in circular_rows}
    for height, resistance, _top, _base_a, _base_b in CIRCULAR_MODELS:
        for variant in ("A", "B"):
            if (float(height), float(resistance), variant) in existing_circular:
                continue
            label = f"C {str(height).replace('.', ',')}/{resistance} · conicidade {variant}"
            session.add(Pole(tipo="C", face="C", conicidade=variant, altura_m=height,
                             resistencia_daN=resistance, descricao=label))
    if not session.query(Equipment.id).first():
        session.add(Equipment(descricao="Kratos IK-14 A/P", capacidade_kgf=2000, numero_serie="2220879",
                              certificado="2354/26", data_calibracao=date(2026, 7, 14), validade_meses=12))
    if not session.query(Responsible.id).first():
        session.add_all([Responsible(nome="Ricardo do Amaral", funcao="inspetor"),
                         Responsible(nome="Marcelo Eduardo Ishizaki de Sousa", funcao="engenheiro", registro="506.339.2251")])
    session.flush()
    if not session.query(Test.id).first():
        from fastapi.encoders import jsonable_encoder
        equip = session.scalar(select(Equipment))
        insp = session.scalar(select(Responsible).where(Responsible.funcao == "inspetor"))
        eng = session.scalar(select(Responsible).where(Responsible.funcao == "engenheiro"))
        for number, face, resistance, flexion, residual, rupture, fissure in [
            ("001", "B", 300, 155, 12, 690, 6),
            ("002", "A", 150, 210, 20, 450, 10),
        ]:
            pole = {"tipo": "PL", "face": face, "altura_m": 7.5, "resistencia_daN": resistance}
            readings = {"e1": True, "e2": {"aplicavel": False},
                        "e3": {"flecha_mm": flexion, "fissura_mm": fissure},
                        "e4": {"flecha_mm": residual, "fissura_mm": 0},
                        "e5": {"carga_daN": rupture}}
            result = jsonable_encoder(avaliar(pole, readings, DEFAULT_CRITERIA))
            result["absorcao"] = {"valores_pct": [], "media_pct": None, "status": "PENDENTE"}
            record = Test(numero_amostra=number, poste_snapshot=pole, data_ensaio=date(2026, 7, 23),
                inspecao_geral_ok=True, equipamento_id=equip.id if equip else None,
                inspetor_id=insp.id if insp else None, engenheiro_id=eng.id if eng else None,
                criterio_versao=1, criterios_snapshot=DEFAULT_CRITERIA,
                parametros_calculados=result["parametros"], leituras=readings,
                resultados=result, status="rascunho", veredito=result["veredito"],
                criado_por="importacao", motivo_revisao="Importado da FL-PRO-22: planilha marcou S, mas fissura 6/10 excede 0,30 mm; unidade pendente de confirmação.")
            session.add(record)
            session.flush()
            for n in range(1, 6):
                key = f"e{n}"
                session.add(TestStep(ensaio_id=record.id, etapa=n, aplicavel=n != 2,
                                     leituras=readings[key], resultado=result["etapas"][key]))
    session.commit()

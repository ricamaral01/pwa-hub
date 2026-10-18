from datetime import datetime, timezone
from typing import Any

from sqlalchemy import BigInteger, Boolean, DateTime, ForeignKey, Index, Integer, String, Text, UniqueConstraint
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


class Base(DeclarativeBase):
    pass


class Usuario(Base):
    __tablename__ = "usuarios"
    email: Mapped[str] = mapped_column(String(320), primary_key=True)
    nome: Mapped[str] = mapped_column(String(320), default="")
    papel: Mapped[str] = mapped_column(String(24), nullable=False)
    unidades: Mapped[list[str]] = mapped_column(JSONB, default=list)
    ativo: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)


class Documento(Base):
    __tablename__ = "documentos"
    __table_args__ = (
        UniqueConstraint("tipo", "id", "versao", name="uq_documento_versao"),
        Index("ix_documentos_tipo_unidade_status", "tipo", "unidade", "status"),
        Index("ix_documentos_nome", "nome"),
        Index("ix_documentos_fck", "fck_mpa"),
        Index("ix_documentos_metodo", "metodo"),
    )
    chave: Mapped[str] = mapped_column(String(240), primary_key=True)
    tipo: Mapped[str] = mapped_column(String(32), nullable=False)
    id: Mapped[str] = mapped_column(String(120), nullable=False)
    versao: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
    revisao: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
    unidade: Mapped[str] = mapped_column(String(100), nullable=False)
    status: Mapped[str] = mapped_column(String(32), default="", nullable=False)
    nome: Mapped[str] = mapped_column(String(320), default="", nullable=False)
    fck_mpa: Mapped[float | None] = mapped_column(nullable=True)
    metodo: Mapped[str | None] = mapped_column(String(32), nullable=True)
    conteudo: Mapped[dict[str, Any]] = mapped_column(JSONB, nullable=False)
    alterado_em: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, nullable=False)


class Idempotencia(Base):
    __tablename__ = "idempotencia"
    request_id: Mapped[str] = mapped_column(String(80), primary_key=True)
    email: Mapped[str] = mapped_column(String(320), nullable=False)
    payload_hash: Mapped[str] = mapped_column(String(64), nullable=False)
    resposta: Mapped[dict[str, Any]] = mapped_column(JSONB, nullable=False)
    criado_em: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, nullable=False)


class Auditoria(Base):
    __tablename__ = "auditoria"
    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    email: Mapped[str] = mapped_column(String(320), nullable=False)
    acao: Mapped[str] = mapped_column(String(100), nullable=False)
    unidade: Mapped[str | None] = mapped_column(String(100))
    tipo: Mapped[str | None] = mapped_column(String(32))
    documento_id: Mapped[str | None] = mapped_column(String(120))
    antes: Mapped[dict[str, Any] | None] = mapped_column(JSONB)
    depois: Mapped[dict[str, Any] | None] = mapped_column(JSONB)
    em: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, nullable=False)


class LegadoId(Base):
    __tablename__ = "legado_ids"
    __table_args__ = (UniqueConstraint("origem", "id_antigo", name="uq_legado_origem_id"),)
    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    origem: Mapped[str] = mapped_column(String(200), nullable=False)
    id_antigo: Mapped[str] = mapped_column(String(200), nullable=False)
    tipo: Mapped[str] = mapped_column(String(32), nullable=False)
    documento_chave: Mapped[str] = mapped_column(String(240), ForeignKey("documentos.chave"), nullable=False)

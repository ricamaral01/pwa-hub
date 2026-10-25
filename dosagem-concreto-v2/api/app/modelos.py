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
    piloto: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
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
    piloto: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    em: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, nullable=False)


class LegadoId(Base):
    __tablename__ = "legado_ids"
    __table_args__ = (UniqueConstraint("origem", "id_antigo", name="uq_legado_origem_id"),)
    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    origem: Mapped[str] = mapped_column(String(200), nullable=False)
    id_antigo: Mapped[str] = mapped_column(String(200), nullable=False)
    tipo: Mapped[str] = mapped_column(String(32), nullable=False)
    documento_chave: Mapped[str] = mapped_column(String(240), ForeignKey("documentos.chave"), nullable=False)


class MaterialVersao(Base):
    __tablename__ = "material_versoes"
    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    material_id: Mapped[str] = mapped_column(String(120), nullable=False, index=True)
    versao: Mapped[int] = mapped_column(Integer, nullable=False)
    propriedades: Mapped[dict[str, Any]] = mapped_column(JSONB, nullable=False)
    piloto: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    criado_em: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, nullable=False)


class TracoVersao(Base):
    __tablename__ = "traco_versoes"
    chave: Mapped[str] = mapped_column(String(240), primary_key=True)
    traco_id: Mapped[str] = mapped_column(String(120), nullable=False, index=True)
    versao: Mapped[int] = mapped_column(Integer, nullable=False)
    unidade: Mapped[str] = mapped_column(String(100), nullable=False)
    estado: Mapped[str] = mapped_column(String(32), nullable=False)
    documento: Mapped[dict[str, Any]] = mapped_column(JSONB, nullable=False)
    snapshot: Mapped[dict[str, Any]] = mapped_column(JSONB, nullable=False)
    resultado: Mapped[dict[str, Any]] = mapped_column(JSONB, nullable=False)
    piloto: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    criado_em: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, nullable=False)


class AvaliacaoImpacto(Base):
    __tablename__ = "avaliacoes_impacto"
    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    traco_versao_chave: Mapped[str] = mapped_column(String(240), ForeignKey("traco_versoes.chave"), nullable=False, index=True)
    material_id: Mapped[str] = mapped_column(String(120), nullable=False)
    classificacao: Mapped[str] = mapped_column(String(40), nullable=False)
    estado: Mapped[str] = mapped_column(String(32), nullable=False, default="pendente")
    diferencas: Mapped[dict[str, Any]] = mapped_column(JSONB, nullable=False)
    piloto: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    criado_em: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, nullable=False)


class AuthFlow(Base):
    __tablename__ = "auth_flows"
    estado_hash: Mapped[str] = mapped_column(String(64), primary_key=True)
    challenge: Mapped[str] = mapped_column(String(64), nullable=False)
    expira_em: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    consumido: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)


class AuthTicket(Base):
    __tablename__ = "auth_tickets"
    ticket_hash: Mapped[str] = mapped_column(String(64), primary_key=True)
    estado_hash: Mapped[str] = mapped_column(String(64), nullable=False)
    email: Mapped[str] = mapped_column(String(320), nullable=False)
    expira_em: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    consumido: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)


class AuthSession(Base):
    __tablename__ = "auth_sessions"
    sessao_hash: Mapped[str] = mapped_column(String(64), primary_key=True)
    email: Mapped[str] = mapped_column(String(320), ForeignKey("usuarios.email"), nullable=False)
    expira_em: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    persistente: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)


class LocalCredencial(Base):
    __tablename__ = "local_credenciais"
    email: Mapped[str] = mapped_column(String(320), ForeignKey("usuarios.email"), primary_key=True)
    senha_hash: Mapped[str] = mapped_column(Text, nullable=False)
    falhas: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    bloqueado_ate: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    trocar_senha: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

import enum

from sqlalchemy import Column, Integer, String, Boolean, DateTime, Enum as SAEnum, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base


class NivelAcesso(str, enum.Enum):
    ADMIN = "ADMIN"
    PCP = "PCP"
    PRODUCAO = "PRODUCAO"
    CONSULTA = "CONSULTA"


class Usuario(Base):
    __tablename__ = "usuarios"

    id = Column(Integer, primary_key=True, index=True)
    nome = Column(String(120), nullable=False)
    username = Column(String(100), unique=True, nullable=False, index=True)
    email = Column(String(200), unique=True, nullable=True, index=True)
    senha_hash = Column(String(255), nullable=False)
    nivel_acesso = Column(SAEnum(NivelAcesso), nullable=False, default=NivelAcesso.CONSULTA)
    setor_id = Column(Integer, ForeignKey("setores.id"), nullable=True)
    ativo = Column(Boolean, default=True, nullable=False)
    trocar_senha_primeiro_acesso = Column(Boolean, default=True, nullable=False)
    deleted_at = Column(DateTime(timezone=True), nullable=True)
    token_revoked_at = Column(DateTime(timezone=True), nullable=True)

    setor = relationship("Setor")

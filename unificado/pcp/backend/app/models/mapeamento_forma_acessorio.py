from sqlalchemy import Column, Integer, String, ForeignKey, Boolean, UniqueConstraint
from sqlalchemy.orm import relationship

from app.core.database import Base


class MapeamentoFormaAcessorio(Base):
    __tablename__ = "mapeamento_forma_acessorios"
    __table_args__ = (
        UniqueConstraint("codigo_forma", "acessorio", "setor_id", name="uq_forma_acessorio_setor"),
    )

    id = Column(Integer, primary_key=True, index=True)
    codigo_forma = Column(String(80), nullable=False, index=True)
    acessorio = Column(String(180), nullable=False, index=True)
    setor_id = Column(Integer, ForeignKey("setores.id"), nullable=False, index=True)
    ativo = Column(Boolean, nullable=False, default=True)

    setor = relationship("Setor", back_populates="mapeamentos_forma_acessorio")

from sqlalchemy import Column, Integer, String, Numeric, ForeignKey, Boolean
from sqlalchemy.orm import relationship

from app.core.database import Base


class MapeamentoForma(Base):
    __tablename__ = "mapeamento_formas"

    id = Column(Integer, primary_key=True, index=True)
    codigo_forma = Column(String(80), nullable=False, unique=True, index=True)
    tipo_forma = Column(String(80), nullable=False, index=True)
    codigo_tipo_forma = Column(String, nullable=True)
    poste = Column(String(160), nullable=False)
    volume_m3 = Column(Numeric(10, 3), nullable=False, default=0)
    setor_id = Column(Integer, ForeignKey("setores.id"), nullable=False, index=True)
    ativo = Column(Boolean, nullable=False, default=True)

    setor = relationship("Setor", back_populates="mapeamentos_formas")

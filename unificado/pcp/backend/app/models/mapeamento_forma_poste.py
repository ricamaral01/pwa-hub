from sqlalchemy import Column, Integer, String, Numeric, ForeignKey, Boolean, UniqueConstraint
from sqlalchemy.orm import relationship

from app.core.database import Base


class MapeamentoFormaPoste(Base):
    __tablename__ = "mapeamento_forma_postes"
    __table_args__ = (
        UniqueConstraint("codigo_forma", "poste_circular", "setor_id", name="uq_forma_poste_setor"),
    )

    id = Column(Integer, primary_key=True, index=True)
    codigo_forma = Column(String(30), nullable=False, index=True)
    poste_circular = Column(String(80), nullable=False, index=True)
    volume_m3 = Column(Numeric(10, 3), nullable=True)
    setor_id = Column(Integer, ForeignKey("setores.id"), nullable=False, index=True)
    ativo = Column(Boolean, nullable=False, default=True)

    setor = relationship("Setor", back_populates="mapeamentos_forma_poste")

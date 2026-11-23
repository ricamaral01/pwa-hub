from sqlalchemy import Column, Integer, String, Numeric, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base


class Produto(Base):
    __tablename__ = "produtos"

    id = Column(Integer, primary_key=True, index=True)
    nome = Column(String(200), nullable=False)
    codigo = Column(String(20), nullable=True)
    peso = Column(Numeric(10, 2), nullable=True)    # kg
    volume = Column(Numeric(10, 4), nullable=True)  # m³
    setor_id = Column(Integer, ForeignKey("setores.id"), nullable=True)

    setor = relationship("Setor", back_populates="produtos")

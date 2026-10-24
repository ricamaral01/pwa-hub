from sqlalchemy import Column, Integer, String, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base


class Setor(Base):
    __tablename__ = "setores"

    id = Column(Integer, primary_key=True, index=True)
    nome = Column(String(100), nullable=False, unique=True)
    ativo = Column(Boolean, default=True, nullable=False)

    formas = relationship("Forma", back_populates="setor")
    programacoes = relationship("Programacao", back_populates="setor")
    producoes = relationship("Producao", back_populates="setor")
    maodeobras = relationship("MaoDeObra", back_populates="setor")
    atividades_mao_de_obra = relationship("AtividadeMaoDeObra", back_populates="setor")
    produtos = relationship("Produto", back_populates="setor")
    mapeamentos_formas = relationship("MapeamentoForma", back_populates="setor")
    mapeamentos_forma_poste = relationship("MapeamentoFormaPoste", back_populates="setor")
    mapeamentos_forma_acessorio = relationship("MapeamentoFormaAcessorio", back_populates="setor")


class Forma(Base):
    __tablename__ = "formas"

    id = Column(Integer, primary_key=True, index=True)
    setor_id = Column(Integer, ForeignKey("setores.id"), nullable=False)
    tipo_poste = Column(String(50), nullable=False)   # ex: "300 daN", "600 daN"
    quantidade_total = Column(Integer, nullable=False, default=1)

    setor = relationship("Setor", back_populates="formas")

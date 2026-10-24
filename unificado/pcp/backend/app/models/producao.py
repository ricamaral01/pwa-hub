from sqlalchemy import Column, Integer, Date, DateTime, ForeignKey, Numeric, String, Boolean, Index, UniqueConstraint, func
from sqlalchemy.orm import relationship
from app.core.database import Base


class AtividadeMaoDeObra(Base):
    __tablename__ = "atividades_mao_de_obra"

    id = Column(Integer, primary_key=True, index=True)
    unidade_id = Column(Integer, nullable=True, default=1)
    tipo = Column(String(10), nullable=False)  # 'MOI' ou 'MOD'
    descricao = Column(String(255), nullable=False, unique=True)
    setor_id = Column(Integer, ForeignKey("setores.id"), nullable=True)  # NULL para MOI
    grupo_setor = Column(String(10), nullable=True)  # '12' (S1+S2), '34' (S3+S4), None para comum
    ativo = Column(Boolean, default=True, nullable=False)

    setor = relationship("Setor", back_populates="atividades_mao_de_obra")


class Programacao(Base):
    __tablename__ = "programacoes"

    id = Column(Integer, primary_key=True, index=True)
    data = Column(Date, nullable=False, index=True)
    setor_id = Column(Integer, ForeignKey("setores.id"), nullable=False)
    produto_id = Column(Integer, ForeignKey("produtos.id"), nullable=True)
    codigo_forma = Column(String(80), nullable=True, index=True)
    quantidade_programada = Column(Integer, nullable=False, default=0)
    volume_m3_programado = Column(Numeric(10, 3), nullable=False, default=0)

    setor = relationship("Setor", back_populates="programacoes")
    produto = relationship("Produto", foreign_keys=[produto_id])


class ProgramacaoAlex(Base):
    __tablename__ = "programacoes_alex"

    id = Column(Integer, primary_key=True, index=True)
    data = Column(Date, nullable=False, index=True)
    setor_id = Column(Integer, ForeignKey("setores.id"), nullable=True)
    produto_id = Column(Integer, ForeignKey("produtos.id"), nullable=True)
    identificador = Column(String(100), nullable=True)
    codigo_item = Column(String(50), nullable=False, index=True)
    descricao = Column(String(255), nullable=False)
    unidade = Column(String(20), nullable=True)
    qtde_estoque = Column(Numeric(14, 3), nullable=False, default=0)
    qtde_carteira = Column(Numeric(14, 3), nullable=False, default=0)
    saldo = Column(Numeric(14, 3), nullable=False, default=0)
    producao_diaria = Column(Integer, nullable=False, default=0)
    dias_prev_prod = Column(Integer, nullable=False, default=0)
    volume_m3_programado = Column(Numeric(10, 3), nullable=False, default=0)

    setor = relationship("Setor")
    produto = relationship("Produto", foreign_keys=[produto_id])


class ApontamentoMega(Base):
    __tablename__ = "apontamentos_mega"
    __table_args__ = (
        UniqueConstraint("programacao_id", name="uq_apontamento_mega_programacao"),
    )

    id = Column(Integer, primary_key=True, index=True)
    programacao_id = Column(Integer, ForeignKey("programacoes.id"), nullable=False, index=True)
    data = Column(Date, nullable=False, index=True)
    setor_id = Column(Integer, ForeignKey("setores.id"), nullable=False, index=True)
    produto_id = Column(Integer, ForeignKey("produtos.id"), nullable=True, index=True)
    codigo_forma = Column(String(80), nullable=True, index=True)
    quantidade_apontada = Column(Integer, nullable=False, default=0)
    nome_apontador = Column(String(120), nullable=False)
    usuario_id = Column(Integer, ForeignKey("usuarios.id"), nullable=True)
    apontado_em = Column(DateTime(timezone=True), nullable=False, server_default=func.now())

    programacao = relationship("Programacao")
    setor = relationship("Setor")
    produto = relationship("Produto", foreign_keys=[produto_id])
    usuario = relationship("Usuario")


class Producao(Base):
    __tablename__ = "producoes"

    id = Column(Integer, primary_key=True, index=True)
    data = Column(Date, nullable=False, index=True)
    setor_id = Column(Integer, ForeignKey("setores.id"), nullable=False)
    produto_id = Column(Integer, ForeignKey("produtos.id"), nullable=True)
    quantidade_realizada = Column(Integer, nullable=False, default=0)
    volume_m3_realizado = Column(Numeric(10, 3), nullable=False, default=0)

    setor = relationship("Setor", back_populates="producoes")
    produto = relationship("Produto", foreign_keys=[produto_id])


class MaoDeObra(Base):
    __tablename__ = "maodeobra"

    id = Column(Integer, primary_key=True, index=True)
    unidade_id = Column(Integer, nullable=True, default=1)
    data = Column(Date, nullable=False, index=True)
    setor_id = Column(Integer, ForeignKey("setores.id"), nullable=True)  # NULL para MOI
    atividade_id = Column(Integer, ForeignKey("atividades_mao_de_obra.id"), nullable=False)
    quantidade_pessoas = Column(Integer, nullable=False, default=0)

    setor = relationship("Setor", back_populates="maodeobras")
    atividade = relationship("AtividadeMaoDeObra")
    rateios = relationship("MaoDeObraRateio", back_populates="registro_mdo")


class MaoDeObraRateio(Base):
    """
    Tabela para armazenar o rateio de MOI consolidado entre os setores do grupo.
    Exemplo: MOI consolidado S1/S2 (10 pessoas) rateado como:
      - Setor 1: 6 pessoas
      - Setor 2: 4 pessoas
    """
    __tablename__ = "maodeobra_rateio"

    id = Column(Integer, primary_key=True, index=True)
    maodeobra_id = Column(Integer, ForeignKey("maodeobra.id"), nullable=False)
    setor_id = Column(Integer, ForeignKey("setores.id"), nullable=False)
    quantidade_rateada = Column(Integer, nullable=False)

    registro_mdo = relationship("MaoDeObra", back_populates="rateios")
    setor = relationship("Setor")

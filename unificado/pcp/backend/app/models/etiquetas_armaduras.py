from sqlalchemy import Boolean, Column, Date, DateTime, Integer, LargeBinary, Numeric, String, Text, UniqueConstraint, func
from app.core.database import Base


class EtiquetaArmaduraModelo(Base):
    __tablename__ = 'etiquetas_armaduras_modelos'

    id = Column(Integer, primary_key=True)
    source_index = Column(Integer, nullable=False, unique=True)
    source_sha256 = Column(String(64), nullable=False)
    modelo = Column(String(80), nullable=False, index=True)
    variante = Column(String(80), nullable=True)
    titulo = Column(String(160), nullable=False)
    engastamento = Column(String(80), nullable=True)
    cg = Column(String(80), nullable=True)
    entrada_pino = Column(String(80), nullable=True)
    saida_pino = Column(String(80), nullable=True)
    peso_kg = Column(Numeric(10, 2), nullable=True)
    peso_texto = Column(String(80), nullable=True)
    source_raw = Column(Text, nullable=False)
    ativo = Column(Boolean, nullable=False, default=True)


class EtiquetaArmaduraFonte(Base):
    __tablename__ = 'etiquetas_armaduras_fontes'

    id = Column(Integer, primary_key=True)
    source_sha256 = Column(String(64), nullable=False, unique=True)
    nome_arquivo = Column(String(255), nullable=False)
    conteudo_docx = Column(LargeBinary, nullable=False)
    quantidade_modelos = Column(Integer, nullable=False)
    enviado_por = Column(Integer, nullable=True)
    enviado_em = Column(DateTime(timezone=True), nullable=False, server_default=func.now())


class SaqueMandril(Base):
    __tablename__ = 'saques_mandril'
    __table_args__ = (UniqueConstraint('data', 'codigo_forma', name='uq_saque_mandril_dia_forma'),)

    id = Column(Integer, primary_key=True)
    data = Column(Date, nullable=False, index=True)
    codigo_forma = Column(String(10), nullable=False, index=True)
    data_hora_saque = Column(DateTime(timezone=True), nullable=True)
    ativo = Column(Boolean, nullable=False, default=True)
    atualizado_em = Column(DateTime(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now())

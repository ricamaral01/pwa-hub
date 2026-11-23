from sqlalchemy import Column, Date, DateTime, ForeignKey, Integer, Numeric, String, UniqueConstraint, func
from app.core.database import Base


class ProgramacaoCircularS3(Base):
    __tablename__ = 'programacoes_circular_s3'
    __table_args__ = (UniqueConstraint('data', 'codigo_forma', name='uq_programacao_circular_s3_dia_forma'),)

    id = Column(Integer, primary_key=True)
    data = Column(Date, nullable=False, index=True)
    codigo_forma = Column(String(10), nullable=False, index=True)
    modelo = Column(String(80), nullable=False)
    produto_id = Column(Integer, ForeignKey('produtos.id'), nullable=True)
    codigo_produto = Column(String(30), nullable=True)
    peso_kg = Column(Numeric(10, 2), nullable=True)
    volume_m3_unitario = Column(Numeric(10, 4), nullable=True)
    origem = Column(String(12), nullable=False, default='periodo')
    criado_em = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    atualizado_em = Column(DateTime(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now())

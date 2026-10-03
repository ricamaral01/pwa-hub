from sqlalchemy import Column, Integer, String, Float, DateTime, Text, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from app.core.database import Base


class TesteProgramacao(Base):
    """
    Armazena histórico de testes de programação automática.
    Permite rastrear e revisar programações geradas pelo sistema.
    """
    __tablename__ = "teste_programacoes"

    id = Column(Integer, primary_key=True, index=True)
    data_criacao = Column(DateTime, default=datetime.utcnow, index=True)
    data_inicio = Column(String(10), nullable=False)  # "YYYY-MM-DD"
    num_formas = Column(Integer, nullable=False)  # Total de formas disponíveis
    capacidade_semanal = Column(Integer, nullable=False)  # formas * 5 dias
    demanda_total = Column(Integer, nullable=False)  # Sum of qty in demand
    alocado_total = Column(Integer, nullable=False)  # Total alocado no plano
    memo_calculo = Column(Text, nullable=True)  # Memória de cálculo em JSON
    relatorio = Column(Text, nullable=True)  # Relatório final em JSON
    
    def __repr__(self):
        return f"<TesteProgramacao(id={self.id}, data_criacao={self.data_criacao}, alocado={self.alocado_total})>"

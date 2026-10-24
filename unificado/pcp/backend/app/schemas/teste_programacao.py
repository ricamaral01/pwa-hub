from datetime import date
from typing import List, Optional, Dict, Any
from pydantic import BaseModel


class DemandaItem(BaseModel):
    """Item de demanda: poste e quantidade semanal."""
    poste: str  # Ex: "5X400", "10,5X200"
    quantidade: int
    urgente: bool = False  # Prioridade


class TesteProgramacaoRequest(BaseModel):
    """Request body para POST /api/teste-prog/programar"""
    data_inicio: str  # "YYYY-MM-DD" (segunda-feira)
    setor_id: int  # Setor principal para o qual programar
    demanda: List[DemandaItem]


class PlanoItem(BaseModel):
    """Item de alocação no plano semanal."""
    forma_id: str  # Ex: "SC01", "SC52"
    dia: str  # "Seg", "Ter", "Qua", "Qui", "Sex"
    poste: Optional[str] = None  # Poste alocado ou None se vago


class RelatorioDia(BaseModel):
    """Resumo de um dia no relatório."""
    dia: str
    data: str
    postes: Dict[str, int]  # {poste: quantidade_produzida}
    total: int


class TesteProgramacaoResponse(BaseModel):
    """Response body para POST /api/teste-prog/programar"""
    id: Optional[int] = None  # ID no banco (se salvo)
    data_inicio: str
    num_formas: int
    capacidade_semanal: int
    demanda_total: int
    alocado_total: int
    
    # Plano semanal: dict {dia: {forma_id: poste_alocado}}
    plano_semanal: Dict[str, Dict[str, Optional[str]]]
    
    # Resumo por dia
    resumo_diario: List[RelatorioDia]
    
    # Itens não alocados
    nao_alocados: List[Dict[str, Any]]  # [{poste, quantidade_demandada, quantidade_alocada, diferenca}]
    
    # KPIs
    taxa_utilizacao: float  # alocado_total / capacidade_semanal
    taxa_atendimento: float  # alocado_total / demanda_total
    
    # Memória de cálculo
    memo_calculo: Optional[str] = None

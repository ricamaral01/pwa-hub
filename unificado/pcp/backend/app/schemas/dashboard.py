from decimal import Decimal
from typing import List, Optional
from pydantic import BaseModel


class SetorKPI(BaseModel):
    setor_id: int
    setor_nome: str
    qtd_programada: int
    qtd_realizada: int
    vol_programado_m3: Decimal
    vol_realizado_m3: Decimal
    peso_programado_kg: Decimal = Decimal("0")
    peso_realizado_kg: Decimal = Decimal("0")
    eficiencia_pct: float


class GrupoKPI(BaseModel):
    grupo_id: str
    grupo_nome: str
    setores: List[int]
    qtd_programada: int
    qtd_realizada: int
    vol_programado_m3: Decimal
    vol_realizado_m3: Decimal
    peso_programado_kg: Decimal
    peso_realizado_kg: Decimal
    pessoas: int
    eficiencia_pct: float
    m3_por_homem: float
    peso_por_homem: float


class PosteKPI(BaseModel):
    tipo_poste: str
    qtd_programada: int
    qtd_realizada: int
    vol_programado_m3: Decimal
    vol_realizado_m3: Decimal
    peso_programado_kg: Decimal = Decimal("0")
    peso_realizado_kg: Decimal = Decimal("0")
    eficiencia_pct: float


class AndamentoItem(BaseModel):
    data: str
    setor_id: Optional[int] = None
    setor_nome: str
    produto_nome: str
    produto_codigo: Optional[str] = None
    qtd_programada: int
    qtd_realizada: int
    faltam: int
    vol_programado_m3: Decimal
    vol_realizado_m3: Decimal
    eficiencia_pct: float


class KgHomemDiario(BaseModel):
    data: str
    grupo_id: str
    grupo_nome: str
    peso_realizado_kg: Decimal
    mod: Decimal
    moi: Decimal
    pessoas: Decimal
    kg_por_homem: Optional[float] = None


class DashboardResponse(BaseModel):
    total_programado_m3: Decimal
    total_realizado_m3: Decimal
    total_programado_kg: Decimal = Decimal("0")
    total_realizado_kg: Decimal = Decimal("0")
    eficiencia_geral_pct: float
    total_pessoas_hoje: int
    total_pessoas: int = 0
    m3_por_homem: float = 0
    peso_por_homem: float = 0
    por_grupo: List[GrupoKPI] = []
    por_setor: List[SetorKPI]
    por_poste: List[PosteKPI]
    producao_andamento: List[AndamentoItem] = []
    kg_homem_diario: List[KgHomemDiario] = []


class VolumeTotalResponse(BaseModel):
    volume_programado_m3: Decimal
    volume_realizado_m3: Decimal
    data_inicio: str
    data_fim: str

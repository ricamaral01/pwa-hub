from datetime import date
from decimal import Decimal
from typing import Optional
from pydantic import BaseModel

from app.schemas.setor import SetorOut
from app.schemas.produto import ProdutoOut


class ArividadeMaoDeObraOut(BaseModel):
    id: int
    tipo: str  # 'MOI' ou 'MOD'
    descricao: str
    setor_id: Optional[int] = None
    grupo_setor: Optional[str] = None  # '12', '34', ou None
    ativo: bool

    model_config = {"from_attributes": True}


class ProgramacaoCreate(BaseModel):
    data: date
    setor_id: int
    produto_id: int
    codigo_forma: Optional[str] = None
    quantidade_programada: int
    volume_m3_programado: Decimal


class ProgramacaoOut(BaseModel):
    id: int
    data: date
    setor_id: int
    produto_id: Optional[int] = None
    codigo_forma: Optional[str] = None
    quantidade_programada: int
    volume_m3_programado: Decimal
    setor: Optional[SetorOut] = None
    produto: Optional[ProdutoOut] = None

    model_config = {"from_attributes": True}


class ProgramacaoLoteItem(BaseModel):
    produto_id: int
    quantidade_programada: int


class ProgramacaoLoteCreate(BaseModel):
    data: date
    setor_id: int
    itens: list[ProgramacaoLoteItem]


class ProducaoCreate(BaseModel):
    data: date
    setor_id: int
    produto_id: int
    quantidade_realizada: int
    volume_m3_realizado: Decimal


class ProducaoOut(BaseModel):
    id: int
    data: date
    setor_id: int
    produto_id: Optional[int] = None
    quantidade_realizada: int
    volume_m3_realizado: Decimal
    setor: Optional[SetorOut] = None
    produto: Optional[ProdutoOut] = None

    model_config = {"from_attributes": True}


class MaoDeObraCreate(BaseModel):
    data: date
    atividade_id: int
    setor_id: Optional[int] = None  # Pode ser None para MOI
    quantidade_pessoas: int


class MaoDeObraLoteItemCreate(BaseModel):
    atividade_id: int
    setor_id: Optional[int] = None
    quantidade_pessoas: int


class MaoDeObraLoteCreate(BaseModel):
    data: date
    itens: list[MaoDeObraLoteItemCreate]


class MaoDeObraOut(BaseModel):
    id: int
    data: date
    atividade_id: int
    setor_id: Optional[int] = None
    quantidade_pessoas: int
    setor: Optional[SetorOut] = None
    atividade: Optional[ArividadeMaoDeObraOut] = None

    model_config = {"from_attributes": True}


class MaoDeObraRateioItemCreate(BaseModel):
    setor_id: int
    quantidade_rateada: int


class MaoDeObraRateioCreate(BaseModel):
    """Criar MOI consolidado com rateio para os setores do grupo"""
    data: date
    atividade_id: int  # Deve ser MOI com grupo_setor
    quantidade_pessoas: int  # Total (será distribuído)
    rateio: list[MaoDeObraRateioItemCreate]  # Distribuição por setor


class MaoDeObraRateioOut(BaseModel):
    id: int
    maodeobra_id: int
    setor_id: int
    quantidade_rateada: int
    setor: Optional[SetorOut] = None

    model_config = {"from_attributes": True}


class MaoDeObraComRateioOut(BaseModel):
    """MOI com seus rateios"""
    id: int
    data: date
    atividade_id: int
    quantidade_pessoas: int
    setor: Optional[SetorOut] = None
    atividade: Optional[ArividadeMaoDeObraOut] = None
    rateios: list[MaoDeObraRateioOut] = []

    model_config = {"from_attributes": True}

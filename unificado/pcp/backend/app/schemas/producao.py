from datetime import date, datetime
from decimal import Decimal
from typing import Literal, Optional
from pydantic import BaseModel, Field, field_validator

from app.schemas.setor import SetorOut
from app.schemas.produto import ProdutoOut


class ArividadeMaoDeObraOut(BaseModel):
    id: int
    tipo: str  # 'MOI' ou 'MOD'
    descricao: str
    setor_id: Optional[int] = None
    grupo_setor: Optional[str] = None  # '12', '34', ou None
    ordem: int = 100
    responsavel: Optional[str] = None
    fator: Optional[Decimal] = None
    ativo: bool

    model_config = {"from_attributes": True}


class AtividadeMaoDeObraUpdate(BaseModel):
    descricao: Optional[str] = None
    tipo: Optional[Literal["MOD", "MOI"]] = None
    setor_id: Optional[int] = None
    grupo_setor: Optional[Literal["12", "34"]] = None
    ordem: Optional[int] = None
    ativo: Optional[bool] = None
    responsavel: Optional[str] = None
    fator: Optional[Decimal] = Field(default=None, ge=0, le=1, decimal_places=2)


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
    quantidade_pessoas: Decimal = Field(ge=0, max_digits=5, decimal_places=2)

    @field_validator("quantidade_pessoas")
    @classmethod
    def validar_meio_periodo(cls, value: Decimal) -> Decimal:
        if value % Decimal("0.5") != 0:
            raise ValueError("Use quantidades de 0,5 em 0,5")
        return value


class MaoDeObraLoteItemCreate(BaseModel):
    atividade_id: int
    setor_id: Optional[int] = None
    quantidade_pessoas: Decimal = Field(ge=0, max_digits=5, decimal_places=2)

    @field_validator("quantidade_pessoas")
    @classmethod
    def validar_meio_periodo(cls, value: Decimal) -> Decimal:
        if value % Decimal("0.5") != 0:
            raise ValueError("Use quantidades de 0,5 em 0,5")
        return value


class MaoDeObraLoteCreate(BaseModel):
    data: date
    itens: list[MaoDeObraLoteItemCreate]


class MaoDeObraGrupoLoteCreate(BaseModel):
    data: date
    grupo_setor: Literal["12", "34"]
    sem_producao: bool = False
    confirmar: bool = False
    motivo: Optional[str] = Field(default=None, max_length=255)
    itens: list[MaoDeObraLoteItemCreate]


class MaoDeObraGrupoConfirmar(BaseModel):
    data: date
    grupo_setor: Literal["12", "34"]
    salvo_em: datetime


class MaoDeObraOut(BaseModel):
    id: int
    data: date
    atividade_id: int
    setor_id: Optional[int] = None
    quantidade_pessoas: Decimal
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
    quantidade_pessoas: Decimal
    setor: Optional[SetorOut] = None
    atividade: Optional[ArividadeMaoDeObraOut] = None
    rateios: list[MaoDeObraRateioOut] = []

    model_config = {"from_attributes": True}

from typing import Optional
from pydantic import BaseModel


class SetorCreate(BaseModel):
    nome: str
    ativo: bool = True


class SetorOut(BaseModel):
    id: int
    nome: str
    ativo: bool

    model_config = {"from_attributes": True}


class FormaCreate(BaseModel):
    setor_id: int
    tipo_poste: str
    quantidade_total: int = 1


class FormaOut(BaseModel):
    id: int
    setor_id: int
    tipo_poste: str
    quantidade_total: int
    setor: Optional[SetorOut] = None

    model_config = {"from_attributes": True}

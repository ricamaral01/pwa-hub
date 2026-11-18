from typing import Optional
from pydantic import BaseModel


class ProdutoOut(BaseModel):
    id: int
    nome: str
    codigo: Optional[str] = None
    peso: Optional[float] = None
    volume: Optional[float] = None
    setor_id: Optional[int] = None

    model_config = {"from_attributes": True}

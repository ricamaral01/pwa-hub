from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.produto import Produto
from app.schemas.produto import ProdutoOut

router = APIRouter(prefix="/api/produtos", tags=["produtos"])


@router.get("", response_model=List[ProdutoOut])
def listar(
    setor_id: Optional[int] = Query(None),
    db: Session = Depends(get_db),
):
    q = db.query(Produto)
    if setor_id:
        q = q.filter(Produto.setor_id == setor_id)
    return q.order_by(Produto.nome).all()

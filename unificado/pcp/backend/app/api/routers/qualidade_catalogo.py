"""Read-only PCP catalog contract for the Quality service.

The caller signs method, path and a short timestamp with a dedicated secret. This
does not issue a PCP user session and exposes only stable catalog snapshots.
"""
import hashlib
import hmac
import os
import time

from fastapi import APIRouter, Depends, Header, HTTPException, Request
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.produto import Produto
from app.models.setor import Setor

router = APIRouter(prefix="/api/integracoes/qualidade", tags=["integracao-qualidade"])


def service_auth(request: Request, x_quality_timestamp: str = Header(default=""),
                 x_quality_signature: str = Header(default="")):
    key = os.getenv("PCP_QUALITY_CATALOG_KEY", "")
    try:
        when = int(x_quality_timestamp)
    except ValueError:
        raise HTTPException(401, "Assinatura inválida.") from None
    if len(key) < 32 or abs(int(time.time()) - when) > 20:
        raise HTTPException(401, "Assinatura inválida.")
    message = f"{request.method}\n{request.url.path}\n{when}".encode()
    expected = hmac.new(key.encode(), message, hashlib.sha256).hexdigest()
    if not hmac.compare_digest(expected, x_quality_signature):
        raise HTTPException(401, "Assinatura inválida.")


@router.get("/setores", dependencies=[Depends(service_auth)])
def setores(db: Session = Depends(get_db)):
    return [{"id": str(row.id), "codigo": str(row.id), "nome": row.nome}
            for row in db.query(Setor).filter(Setor.ativo.is_(True)).order_by(Setor.nome, Setor.id)]


@router.get("/produtos", dependencies=[Depends(service_auth)])
def produtos(db: Session = Depends(get_db)):
    return [{"id": str(row.id), "codigo": row.codigo or str(row.id), "nome": row.nome,
             "setor_id": str(row.setor_id) if row.setor_id is not None else None}
            for row in db.query(Produto).order_by(Produto.nome, Produto.id)]

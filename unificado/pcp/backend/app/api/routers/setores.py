from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import require_roles
from app.models.usuario import NivelAcesso
from app.models.setor import Setor, Forma
from app.schemas.setor import SetorCreate, SetorOut, FormaCreate, FormaOut

router = APIRouter(prefix="/api", tags=["setores"])


# ─── Setores ───────────────────────────────────────────────────────────────────

@router.get("/setores", response_model=List[SetorOut])
def listar_setores(db: Session = Depends(get_db), _=Depends(require_roles(
    NivelAcesso.ADMIN, NivelAcesso.PCP, NivelAcesso.PRODUCAO, NivelAcesso.CONSULTA
))):
    return db.query(Setor).filter(Setor.ativo == True).all()


@router.post("/setores", response_model=SetorOut, status_code=201)
def criar_setor(
    payload: SetorCreate,
    db: Session = Depends(get_db),
    _=Depends(require_roles(NivelAcesso.ADMIN, NivelAcesso.PCP)),
):
    setor = Setor(**payload.model_dump())
    db.add(setor)
    db.commit()
    db.refresh(setor)
    return setor


# ─── Formas ────────────────────────────────────────────────────────────────────

@router.get("/formas", response_model=List[FormaOut])
def listar_formas(
    setor_id: int = None,
    db: Session = Depends(get_db),
    _=Depends(require_roles(
        NivelAcesso.ADMIN, NivelAcesso.PCP, NivelAcesso.PRODUCAO, NivelAcesso.CONSULTA
    )),
):
    q = db.query(Forma)
    if setor_id:
        q = q.filter(Forma.setor_id == setor_id)
    return q.all()


@router.post("/formas", response_model=FormaOut, status_code=201)
def criar_forma(
    payload: FormaCreate,
    db: Session = Depends(get_db),
    _=Depends(require_roles(NivelAcesso.ADMIN, NivelAcesso.PCP)),
):
    setor = db.query(Setor).filter(Setor.id == payload.setor_id).first()
    if not setor:
        raise HTTPException(status_code=404, detail="Setor não encontrado")
    forma = Forma(**payload.model_dump())
    db.add(forma)
    db.commit()
    db.refresh(forma)
    return forma

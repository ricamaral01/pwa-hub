from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user, require_roles
from app.models.usuario import Usuario, NivelAcesso
from app.models.setor import Setor
from app.core.security import hash_password, verify_password
from app.schemas.usuario import (
    UsuarioCreate,
    UsuarioOut,
    UsuarioUpdate,
    RedefinirSenhaRequest,
    TrocarSenhaPrimeiroAcessoRequest,
)

router = APIRouter(prefix="/api/usuarios", tags=["usuarios"])


@router.get("", response_model=List[UsuarioOut])
def listar(
    db: Session = Depends(get_db),
    _=Depends(require_roles(NivelAcesso.ADMIN)),
):
    return db.query(Usuario).all()


@router.post("", response_model=UsuarioOut, status_code=201)
def criar(
    payload: UsuarioCreate,
    db: Session = Depends(get_db),
    _=Depends(require_roles(NivelAcesso.ADMIN)),
):
    email_final = payload.email or f"{payload.username}@local"

    if db.query(Usuario).filter(Usuario.username == payload.username).first():
        raise HTTPException(status_code=409, detail="Usuário já cadastrado")
    if db.query(Usuario).filter(Usuario.email == email_final).first():
        raise HTTPException(status_code=409, detail="E-mail já cadastrado")
    setor = db.query(Setor).filter(Setor.id == payload.setor_id).first()
    if not setor:
        raise HTTPException(status_code=400, detail="Setor inválido")

    user = Usuario(
        nome=payload.nome,
        username=payload.username,
        email=email_final,
        senha_hash=hash_password(payload.senha),
        setor_id=payload.setor_id,
        nivel_acesso=payload.nivel_acesso,
        trocar_senha_primeiro_acesso=True,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@router.post("/{user_id}/redefinir-senha", response_model=UsuarioOut)
def redefinir_senha(
    user_id: int,
    payload: RedefinirSenhaRequest,
    db: Session = Depends(get_db),
    _=Depends(require_roles(NivelAcesso.ADMIN)),
):
    user = db.query(Usuario).filter(Usuario.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")

    user.senha_hash = hash_password(payload.nova_senha)
    user.trocar_senha_primeiro_acesso = True
    db.commit()
    db.refresh(user)
    return user


@router.patch("/{user_id}", response_model=UsuarioOut)
def atualizar(
    user_id: int,
    payload: UsuarioUpdate,
    db: Session = Depends(get_db),
    _=Depends(require_roles(NivelAcesso.ADMIN)),
):
    user = db.query(Usuario).filter(Usuario.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")
    for field, value in payload.model_dump(exclude_none=True).items():
        if field == "setor_id":
            setor = db.query(Setor).filter(Setor.id == value).first()
            if not setor:
                raise HTTPException(status_code=400, detail="Setor inválido")
        setattr(user, field, value)
    db.commit()
    db.refresh(user)
    return user


@router.post("/trocar-senha-primeiro-acesso", response_model=UsuarioOut)
def trocar_senha_primeiro_acesso(
    payload: TrocarSenhaPrimeiroAcessoRequest,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    if not verify_password(payload.senha_atual, current_user.senha_hash):
        raise HTTPException(status_code=400, detail="Senha atual inválida")

    current_user.senha_hash = hash_password(payload.nova_senha)
    current_user.trocar_senha_primeiro_acesso = False
    db.commit()
    db.refresh(current_user)
    return current_user

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.core.security import verify_password, create_access_token
from app.models.usuario import Usuario
from app.schemas.usuario import LoginRequest, TokenResponse, UsuarioOut


def authenticate(db: Session, payload: LoginRequest) -> TokenResponse:
    user = db.query(Usuario).filter(
        Usuario.username == payload.username,
        Usuario.ativo == True,
    ).first()

    if not user or not verify_password(payload.senha, user.senha_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Credenciais inválidas",
        )

    token = create_access_token({"sub": str(user.id), "nivel": user.nivel_acesso})
    return TokenResponse(
        access_token=token,
        usuario=UsuarioOut.model_validate(user),
    )

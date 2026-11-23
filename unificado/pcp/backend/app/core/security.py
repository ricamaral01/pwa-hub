from datetime import datetime, timedelta, timezone
from typing import Optional

from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import get_db

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
bearer_scheme = HTTPBearer()


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (
        expires_delta or timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    to_encode.update({"exp": expire})
    to_encode["session_epoch_ms"] = int(datetime.now(timezone.utc).timestamp() * 1000)
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def decode_token(token: str) -> dict:
    try:
        return jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token inválido ou expirado",
            headers={"WWW-Authenticate": "Bearer"},
        )


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    db: Session = Depends(get_db),
):
    from app.models.usuario import Usuario

    payload = decode_token(credentials.credentials)
    user_id: int = payload.get("sub")
    if user_id is None:
        raise HTTPException(status_code=401, detail="Token inválido")

    user = db.query(Usuario).filter(Usuario.id == int(user_id), Usuario.ativo == True).first()
    if not user:
        raise HTTPException(status_code=401, detail="Usuário não encontrado ou inativo")
    if user.deleted_at is not None or (
        user.token_revoked_at is not None and
        int(payload.get("session_epoch_ms") or 0) <= int(user.token_revoked_at.timestamp() * 1000)
    ):
        raise HTTPException(status_code=401, detail="Sessão encerrada")
    return user


def require_roles(*roles):
    """Decorator para restringir acesso por nivel_acesso."""
    def dependency(current_user=Depends(get_current_user)):
        if current_user.nivel_acesso not in roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Acesso negado. Requer: {', '.join(roles)}",
            )
        return current_user
    return dependency

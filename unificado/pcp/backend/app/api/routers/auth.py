from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas.usuario import LoginRequest, TokenResponse
from app.services.auth_service import authenticate

router = APIRouter(prefix="/api", tags=["auth"])


@router.post("/login", response_model=TokenResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    return authenticate(db, payload)

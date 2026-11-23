from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr, field_validator
from app.models.usuario import NivelAcesso


class LoginRequest(BaseModel):
    username: str
    senha: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    usuario: "UsuarioOut"


class UsuarioCreate(BaseModel):
    nome: str
    username: str
    email: Optional[EmailStr] = None
    senha: str
    setor_id: int
    nivel_acesso: NivelAcesso = NivelAcesso.CONSULTA

    @field_validator("senha")
    @classmethod
    def senha_forte(cls, v):
        if len(v) < 6:
            raise ValueError("Senha deve ter ao menos 6 caracteres")
        return v


class UsuarioOut(BaseModel):
    id: int
    nome: str
    username: str
    email: Optional[str] = None
    nivel_acesso: NivelAcesso
    setor_id: Optional[int] = None
    ativo: bool
    trocar_senha_primeiro_acesso: bool

    model_config = {"from_attributes": True}


class UsuarioUpdate(BaseModel):
    nome: Optional[str] = None
    setor_id: Optional[int] = None
    nivel_acesso: Optional[NivelAcesso] = None
    ativo: Optional[bool] = None


class RedefinirSenhaRequest(BaseModel):
    nova_senha: str

    @field_validator("nova_senha")
    @classmethod
    def nova_senha_forte(cls, v):
        if len(v) < 6:
            raise ValueError("Senha deve ter ao menos 6 caracteres")
        return v


class TrocarSenhaPrimeiroAcessoRequest(BaseModel):
    senha_atual: str
    nova_senha: str

    @field_validator("nova_senha")
    @classmethod
    def nova_senha_forte(cls, v):
        if len(v) < 6:
            raise ValueError("Senha deve ter ao menos 6 caracteres")
        return v

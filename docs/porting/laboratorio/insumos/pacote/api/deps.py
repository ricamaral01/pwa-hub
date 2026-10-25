"""
Encaixe com o serviço do Laboratório (unificado/laboratorio/service/server).

Dentro do Laboratório, os routers usam as mesmas dependências do slump/postes:
    from .postes_api import current_user, db
Fora dele (testes deste pacote), usa DATABASE_URL e o cabeçalho X-Usuario / X-Papel.
"""
import os
from types import SimpleNamespace

from fastapi import Depends, Header, HTTPException

try:                                    # dentro de server/ do Laboratório
    from .postes_api import current_user, db  # type: ignore  # noqa: F401
except ImportError:                     # pacote isolado / testes
    from sqlalchemy import create_engine
    from sqlalchemy.orm import sessionmaker

    _factory = None

    def db():
        global _factory
        if _factory is None:
            _factory = sessionmaker(create_engine(os.environ["DATABASE_URL"], pool_pre_ping=True), expire_on_commit=False)
        with _factory() as s:
            yield s

    def current_user(x_usuario: str | None = Header(default=None), x_papel: str | None = Header(default="tecnico")):
        if not x_usuario:
            raise HTTPException(401, "Faça login para acessar a aplicação.")
        return SimpleNamespace(username=x_usuario, role=x_papel)


def fabrica_sessao(request):
    """sessionmaker para trabalho em segundo plano (leitura de NF)."""
    f = getattr(request.app.state, "postes_session", None)
    if f is not None:
        return f
    next(db(), None)          # garante a criação no modo isolado
    return globals().get("_factory")


def papel(*permitidos: str):
    """Exige um dos papéis do Laboratório (tecnico, engenheiro, admin)."""
    def _dep(user=Depends(current_user)):
        if user.role not in permitidos:
            raise HTTPException(403, "Seu perfil não pode fazer esta alteração.")
        return user
    return _dep

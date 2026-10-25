"""Validated identity passed by the Unificado's Nginx auth_request gateway."""

import base64
import binascii
import hashlib
import hmac
import json
import time

from fastapi import Request
from sqlalchemy.orm import Session

from .erros import ErroAPI
from .modelos import Usuario


def _decode(value: str) -> bytes:
    return base64.urlsafe_b64decode(value + "=" * (-len(value) % 4))


def unified_user(session: Session, request: Request, assertion: str, signing_key: str) -> Usuario:
    if not signing_key or len(signing_key) < 32:
        raise ErroAPI("INTERNO", "Gateway da Dosagem não configurado.")
    if request.client is None or request.client.host not in {"127.0.0.1", "::1"}:
        raise ErroAPI("NAO_AUTENTICADO", "Acesso ao gateway inválido.")
    try:
        payload, signature = assertion.split(".", 1)
        expected = hmac.new(signing_key.encode(), payload.encode(), hashlib.sha256).digest()
        if not hmac.compare_digest(expected, _decode(signature)):
            raise ValueError("signature")
        claims = json.loads(_decode(payload))
        if not claims.get("dosagem") or not isinstance(claims.get("id"), str):
            raise ValueError("scope")
        role = claims.get("dosagem_role")
        if role not in {"admin", "engenheiro", "laboratorista"}:
            raise ValueError("role")
        if not int(time.time()) <= int(claims["exp"]) <= int(time.time()) + 30:
            raise ValueError("expiry")
    except (ValueError, KeyError, TypeError, OverflowError, binascii.Error):
        raise ErroAPI("NAO_AUTENTICADO", "Sessão do Unificado inválida ou expirada.") from None
    email = f"unificado-{claims['id']}@concretrack.local"
    user = session.get(Usuario, email)
    if user is None:
        user = Usuario(email=email, nome=str(claims.get("name") or claims["id"]),
                       papel=role, unidades=["*"], ativo=True)
        session.add(user)
        session.flush()
    if not user.ativo:
        raise ErroAPI("SEM_PERMISSAO", "Usuário sem acesso à Dosagem.")
    if user.papel != role:
        user.papel = role
        session.flush()
    return user

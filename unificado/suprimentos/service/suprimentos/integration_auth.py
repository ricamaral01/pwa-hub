"""Assertion curta de serviço do Laboratório para a integração S4."""
from __future__ import annotations

import base64
import hashlib
import hmac
import json
import os
import time
from dataclasses import dataclass

from fastapi import Depends, HTTPException, Request


@dataclass(frozen=True)
class Laboratory:
    unit: str
    issuer: str = "laboratorio"


def _b64(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).rstrip(b"=").decode()


def sign_service_assertion(unit: str, secret: str, now: int | None = None) -> str:
    """Chamado pelo emissor interno; não inclui permissões de usuário."""
    if len(secret) < 32:
        raise ValueError("Chave de serviço com menos de 32 caracteres")
    current = int(time.time()) if now is None else now
    payload = _b64(json.dumps({"iss":"laboratorio","aud":"suprimentos-integracao",
        "unidade":unit,"iat":current,"exp":current+30},separators=(",",":")).encode())
    return payload+"."+_b64(hmac.new(secret.encode(),payload.encode(),hashlib.sha256).digest())


def decode_service_assertion(value: str, secret: str, now: int | None = None) -> Laboratory:
    if len(secret) < 32 or len(value) > 8192 or value.count(".") != 1:
        raise HTTPException(401,"Assertion de serviço indisponível ou inválida")
    encoded,signature=value.split(".",1)
    expected=_b64(hmac.new(secret.encode(),encoded.encode(),hashlib.sha256).digest())
    if not hmac.compare_digest(signature,expected):
        raise HTTPException(401,"Assertion de serviço inválida")
    try:
        claim=json.loads(base64.urlsafe_b64decode(encoded+"="*(-len(encoded)%4)))
        current=int(time.time()) if now is None else now
        if (claim.get("iss")!="laboratorio" or claim.get("aud")!="suprimentos-integracao"
            or not isinstance(claim.get("unidade"),str) or not claim["unidade"]
            or not isinstance(claim.get("iat"),int) or not isinstance(claim.get("exp"),int)
            or not 0 <= current-claim["iat"] <= 30 or not 0 <= claim["exp"]-current <= 30):
            raise ValueError()
        return Laboratory(claim["unidade"])
    except (ValueError,TypeError,UnicodeError):
        raise HTTPException(401,"Assertion de serviço inválida") from None


def laboratory(request: Request) -> Laboratory:
    if request.client is None or request.client.host not in {"127.0.0.1","::1"}:
        raise HTTPException(403,"Integração acessível somente da rede interna")
    return decode_service_assertion(request.headers.get("x-suprimentos-service-assertion",""),
        os.getenv("SUPRIMENTOS_LAB_SERVICE_KEY",""))

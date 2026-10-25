"""Loopback-only verification of the short lived Unificado assertion."""
from __future__ import annotations

import base64
import hashlib
import hmac
import json
import os
import time
from dataclasses import dataclass

from fastapi import Depends, HTTPException, Request

ACTIONS = frozenset({
    "qualidade.nc.abrir", "qualidade.nc.ver_todas", "qualidade.nc.ver_area",
    "qualidade.nc.triar", "qualidade.nc.tratar", "qualidade.nc.aprovar_concessao",
    "qualidade.nc.verificar_eficacia", "qualidade.nc.encerrar", "qualidade.nc.cadastros",
})


@dataclass(frozen=True)
class Actor:
    id: str
    name: str
    actions: frozenset[str]
    unit: str | None = None
    areas: frozenset[str] = frozenset()
    superuser: bool = False

    def has(self, action: str) -> bool:
        return self.superuser or action in self.actions


def decode_assertion(value: str, secret: str, now: int | None = None) -> Actor:
    if len(secret) < 32 or len(value) > 8192 or value.count(".") != 1:
        raise HTTPException(401, "Afirmação inválida.")
    encoded, signature = value.split(".", 1)
    expected = base64.urlsafe_b64encode(hmac.new(secret.encode(), encoded.encode(), hashlib.sha256).digest()).rstrip(b"=").decode()
    if not hmac.compare_digest(signature, expected):
        raise HTTPException(401, "Afirmação inválida.")
    try:
        data = json.loads(base64.urlsafe_b64decode(encoded + "=" * (-len(encoded) % 4)))
        expiry = data["exp"]
        current = int(time.time()) if now is None else now
        if not isinstance(expiry, int) or not 0 <= expiry - current <= 20:
            raise ValueError("expiry")
        if data.get("iss") != "unificado" or not isinstance(data.get("id"), str) or not data["id"]:
            raise ValueError("issuer or id")
        if not isinstance(data.get("name"), str) or not data["name"].strip():
            raise ValueError("name")
        actions = data.get("actions", [])
        if not isinstance(actions, list) or any(not isinstance(a, str) or a not in ACTIONS for a in actions):
            raise ValueError("actions")
        areas = data.get("areas", [])
        if not isinstance(areas, list) or any(not isinstance(a, str) for a in areas):
            raise ValueError("areas")
        if not isinstance(data.get("superuser", False), bool):
            raise ValueError("superuser")
        return Actor(data["id"], data["name"].strip(), frozenset(actions), data.get("unit"), frozenset(areas), data.get("superuser", False))
    except (ValueError, TypeError, KeyError, UnicodeError):
        raise HTTPException(401, "Afirmação inválida.") from None


def actor(request: Request) -> Actor:
    if request.client is None or request.client.host != "127.0.0.1":
        raise HTTPException(403, "Acesso somente pelo gateway local.")
    return decode_assertion(request.headers.get("x-qualidade-assertion", ""), os.getenv("QUALIDADE_GATEWAY_SIGNING_KEY", ""))


def require(action: str):
    def dependency(user: Actor = Depends(actor)) -> Actor:
        if not user.has(action):
            raise HTTPException(403, "Ação não concedida.")
        return user
    return dependency

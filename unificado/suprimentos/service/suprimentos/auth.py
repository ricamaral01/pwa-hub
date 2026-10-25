"""Assertion curta do gateway e matriz de papéis × ações.

Cada rota resolve papéis do banco por unidade. A assertion identifica o usuário;
ela nunca concede papéis por si só.
"""
from __future__ import annotations
import base64
import hashlib
import hmac
import json
import os
import time
from dataclasses import dataclass
from fastapi import Depends, HTTPException, Request
from sqlalchemy import and_, select
from sqlalchemy.orm import Session
from .db import session, table

ROLE_ACTIONS = {
    "SOLICITANTE": frozenset({"catalogo.ver", "solicitacao.criar", "solicitacao.ver_propria", "solicitacao.confirmar"}),
    "APROVADOR": frozenset({"catalogo.ver", "solicitacao.ver_alcada", "solicitacao.aprovar", "solicitacao.devolver", "solicitacao.reprovar"}),
    "ALMOXARIFE": frozenset({"catalogo.ver", "cadastro.local", "cadastro.material_unidade", "solicitacao.ver_unidade", "solicitacao.separar", "solicitacao.entregar", "solicitacao.vincular_material"}),
    "COMPRADOR": frozenset({"catalogo.ver", "cadastro.material", "cadastro.fornecedor", "solicitacao.ver_unidade", "solicitacao.precificar", "solicitacao.vincular_material"}),
    "QUALIDADE": frozenset({"catalogo.ver", "cadastro.fornecedor", "solicitacao.ver_unidade"}),
    "ADMIN": frozenset({"*"}),
}

@dataclass(frozen=True)
class Actor:
    id: str
    name: str

@dataclass(frozen=True)
class Context:
    actor: Actor
    unit_id: int
    unit_code: str
    roles: tuple[dict, ...]

    def has(self, action: str, cc_id: str | None = None, level: int | None = None) -> bool:
        for role in self.roles:
            if role["papel"] != "ADMIN" and action not in ROLE_ACTIONS[role["papel"]]:
                continue
            if role["cc_id"] is not None and str(role["cc_id"]) != str(cc_id):
                continue
            if level is not None and role["papel"] == "APROVADOR" and role["nivel"] != level:
                continue
            return True
        return False

def _b64(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).rstrip(b"=").decode()

def sign_assertion(actor_id: str, name: str, secret: str, now: int | None = None) -> str:
    """Usado somente pelo gateway; segredo não vai ao cliente."""
    current = int(time.time()) if now is None else now
    payload = _b64(json.dumps({"iss": "unificado", "aud": "suprimentos", "id": actor_id,
                               "name": name, "exp": current + 20}, separators=(",", ":")).encode())
    return payload + "." + _b64(hmac.new(secret.encode(), payload.encode(), hashlib.sha256).digest())

def decode_assertion(value: str, secret: str, now: int | None = None) -> Actor:
    if len(secret) < 32 or len(value) > 8192 or value.count(".") != 1:
        raise HTTPException(401, "Afirmação inválida")
    encoded, signature = value.split(".", 1)
    expected = _b64(hmac.new(secret.encode(), encoded.encode(), hashlib.sha256).digest())
    if not hmac.compare_digest(signature, expected):
        raise HTTPException(401, "Afirmação inválida")
    try:
        claim = json.loads(base64.urlsafe_b64decode(encoded + "=" * (-len(encoded) % 4)))
        current = int(time.time()) if now is None else now
        if (claim.get("iss") != "unificado" or claim.get("aud") != "suprimentos"
                or not isinstance(claim.get("exp"), int) or not 0 <= claim["exp"] - current <= 20
                or not isinstance(claim.get("id"), str) or not claim["id"]
                or not isinstance(claim.get("name"), str) or not claim["name"].strip()):
            raise ValueError()
        return Actor(claim["id"], claim["name"].strip())
    except (ValueError, TypeError, UnicodeError):
        raise HTTPException(401, "Afirmação inválida") from None

def actor(request: Request) -> Actor:
    if request.client is None or request.client.host not in {"127.0.0.1", "::1"}:
        raise HTTPException(403, "Acesso somente pelo gateway local")
    return decode_assertion(request.headers.get("x-suprimentos-assertion", ""),
                            os.getenv("SUPRIMENTOS_GATEWAY_SIGNING_KEY", ""))

def context(unit_code: str, user: Actor, db: Session) -> Context:
    u = table("sup_unidade")
    unit = db.execute(select(u).where(and_(u.c.codigo == unit_code, u.c.ativo.is_(True)))).mappings().one_or_none()
    if not unit:
        raise HTTPException(403, "Unidade indisponível")
    p = table("sup_usuario_papel")
    roles = db.execute(select(p).where(and_(p.c.iam_user_id == user.id, p.c.unidade_id == unit["id"],
                                             p.c.ativo.is_(True)))).mappings().all()
    if not roles:
        raise HTTPException(403, "Sem papel nesta unidade")
    return Context(user, unit["id"], unit_code, tuple(dict(r) for r in roles))

def check_action(ctx: Context, action: str, cc_id: str | None = None,
                 level: int | None = None, *, write: bool = False, phase: str = "S0", db: Session | None = None):
    if not ctx.has(action, cc_id, level):
        raise HTTPException(403, "Ação não concedida para esta unidade, centro de custo ou nível")
    if write:
        f = table("sup_flag")
        flag = db.execute(select(f.c.habilitado).where(and_(f.c.unidade_id == ctx.unit_id,
                                                              f.c.fase == phase))).scalar_one_or_none()
        if not flag:
            raise HTTPException(403, f"Fase {phase} desabilitada para {ctx.unit_code}")

def current_actor(user: Actor = Depends(actor)) -> Actor:
    return user

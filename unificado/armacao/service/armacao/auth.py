"""Validate the existing Mapa session and action grants; never trust unit headers alone."""
from __future__ import annotations

from dataclasses import dataclass
import os

from fastapi import Depends, Header, HTTPException, Request
from itsdangerous import BadSignature, SignatureExpired, URLSafeTimedSerializer
from sqlalchemy import create_engine, text
from sqlalchemy.orm import Session

from .db import session

MASTER_IDS = frozenset({"alex", "user-ricardo", "marcelo"})
ALL_ACTIONS = frozenset({"armacao.corte", "armacao.banca", "armacao.supervisor",
                         "armacao.consulta", "armacao.cadastros"})


@dataclass(frozen=True)
class Actor:
    id: str
    name: str
    actions: frozenset[str]
    units: frozenset[str]
    master: bool = False


@dataclass(frozen=True)
class Context:
    actor: Actor
    unit_id: int | None
    unit_code: str
    prefix: str | None
    tolerance: float | None


def get_actor(request: Request) -> Actor:
    token = request.cookies.get("mapa_unificado_session")
    secret = os.getenv("ARMACAO_MAPA_SIGNING_KEY", "")
    iam_url = os.getenv("ARMACAO_IAM_DATABASE_URL", "")
    if not token or not secret or not iam_url:
        raise HTTPException(401, "Sessão do Unificado necessária")
    try:
        claim = URLSafeTimedSerializer(secret, salt="mapa-login-v1").loads(token, max_age=36 * 3600)
    except (BadSignature, SignatureExpired):
        raise HTTPException(401, "Sessão expirada") from None
    if claim.get("scope") not in {"session", "legacy_session"}:
        raise HTTPException(401, "Sessão inválida")
    engine = create_engine(iam_url, pool_pre_ping=True)
    try:
        with engine.connect() as conn:
            row = conn.execute(text("""
              SELECT id,nome,ativo,deleted_at,updated_at FROM public.usuarios
              WHERE id=:id
            """), {"id": claim.get("id")}).mappings().first()
            if not row or not row["ativo"] or row["deleted_at"] is not None or \
               row["updated_at"].isoformat() != claim.get("updated_at"):
                raise HTTPException(401, "Conta inativa ou sessão encerrada")
            actions = frozenset(r[0] for r in conn.execute(text("""
              SELECT action_id FROM unificado_auth.user_action_permissions
              WHERE user_id=:id AND action_id LIKE 'armacao.%'
            """), {"id": row["id"]}))
            units = frozenset(r[0] for r in conn.execute(text("""
              SELECT unit_code FROM unificado_auth.user_units WHERE user_id=:id
            """), {"id": row["id"]}))
            master = row["id"] in MASTER_IDS
            return Actor(row["id"], row["nome"], actions | (ALL_ACTIONS if master else frozenset()),
                         units, master)
    finally:
        engine.dispose()


def context(unidade: str = Header(..., alias="X-Unidade"),
            actor: Actor = Depends(get_actor), db: Session = Depends(session)) -> Context:
    if unidade == "todas":
        if not (actor.master or "todos" in actor.units) or "armacao.consulta" not in actor.actions:
            raise HTTPException(403, "Consulta consolidada restrita")
        return Context(actor, None, "todas", None, None)
    row = db.execute(text("""
      SELECT u.id,u.codigo,c.prefixo,c.tolerancia_saldo,c.enabled
      FROM producao.unidade u JOIN armacao.configuracao_unidade c ON c.unidade_id=u.id
      WHERE u.codigo=:code AND u.ativo
    """), {"code": unidade}).mappings().first()
    if not row or not row["enabled"]:
        raise HTTPException(404, "Armação indisponível nesta unidade")
    if not actor.master and unidade not in actor.units and "todos" not in actor.units:
        raise HTTPException(403, "Sem acesso a esta unidade")
    return Context(actor, row["id"], row["codigo"], row["prefixo"], float(row["tolerancia_saldo"]))


def need(ctx: Context, action: str, *, write: bool = False):
    inherited = action in {"armacao.corte", "armacao.banca"} and "armacao.supervisor" in ctx.actor.actions
    if action not in ctx.actor.actions and not inherited:
        raise HTTPException(403, f"Permissão {action} necessária")
    if write and ctx.unit_id is None:
        raise HTTPException(422, "Selecione uma unidade para lançamento")


def same_origin(request: Request):
    if request.method not in {"GET", "HEAD", "OPTIONS"}:
        origin = request.headers.get("Origin", "")
        expected = os.getenv("ARMACAO_ORIGIN", "https://concrefer.concretrack.com.br")
        if origin not in {expected, "http://localhost:5173"}:
            raise HTTPException(403, "Origem de escrita inválida")


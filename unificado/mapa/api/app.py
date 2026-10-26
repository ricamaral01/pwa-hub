"""Autenticacao isolada do Mapa sobre a copia PostgreSQL de testes."""

from __future__ import annotations

from datetime import date, datetime, timezone
import base64
import hashlib
import hmac
import html
import json
import logging
import os
from pathlib import Path
import re
import secrets
import time
import urllib.error
import urllib.parse
import urllib.request
import uuid
from zoneinfo import ZoneInfo

from argon2 import PasswordHasher
from argon2.exceptions import InvalidHashError, VerifyMismatchError
from flask import Flask, Response, jsonify, make_response, request
from itsdangerous import BadSignature, SignatureExpired, URLSafeTimedSerializer
import psycopg
from psycopg import sql
from psycopg.rows import dict_row
from psycopg.types.json import Jsonb
from unified_auth import (adopt_mapa_password, adopt_pcp_password,
                          check_link_password, component_links,
                          link_for, linked_users,
                          mapa_user_by_login, mark_existing_shared_password,
                          mirror_mapa_password, mirror_pcp_password,
                          PCP_HASHER, pcp_connect, pcp_user_by_login,
                          set_unified_password, sync_component_password, verify_map,
                          verify_pcp)
from formas_por_setor import load_catalog as load_formas_por_setor
from dashboard_defects_indicators import load_indicators as load_dashboard_defects_indicators
from screen_access import (CATALOG as SCREEN_CATALOG, BY_ID as SCREENS_BY_ID,
                           MASTER_USER_ID, MASTER_USER_IDS, DEFAULT_LAB_USERS, GUEST_FORBIDDEN_SCREENS,
                           allowed_screens,
                           role_allows, screen_for_uri)
from ged_bridge import assertion as ged_assertion, admin_request as ged_admin_request


app = Flask(__name__)
validation_logger = logging.getLogger("unificado.validation")
hasher = PasswordHasher()
COOKIE_NAME = "mapa_unificado_session"
COOKIE_PATH = "/unificado/"
LEGACY_COOKIE_PATH = "/unificado/mapa/api"
TEST_PAGE_COOKIE_NAME = "unificado_test_session"
PCP_SCREEN_COOKIE_NAME = "unificado_pcp_screen"
PCP_REFRESH_COOKIE_NAME = "unificado_pcp_refresh"
PCP_REFRESH_SECONDS = 30 * 24 * 60 * 60
PCP_REFRESH_PATH = "/unificado/mapa/api/unified/pcp-session"
SESSION_SECONDS = 36 * 60 * 60
TV_SESSION_SECONDS = 30 * 24 * 60 * 60
TV_USER_IDS = frozenset({'tv-producao', 'tv'})


def session_scope_and_age(user):
    if user['id'] in TV_USER_IDS:
        return 'tv_session', TV_SESSION_SECONDS
    return 'session', SESSION_SECONDS
READ_TABLES = frozenset({
    "usuarios", "programacao_pcp", "liberacao_formas", "producao",
    "montagem_poste", "inspecao_defeitos", "formas_manutencao", "prog_s3_s4", "vw_formas_status",
})
WRITE_TABLES = frozenset({
    "programacao_pcp", "liberacao_formas", "producao",
    "montagem_poste", "inspecao_defeitos", "formas_manutencao", "prog_s3_s4",
})
OPERATION_TABLES = {
    "programada": "programacao_pcp",
    "liberada": "liberacao_formas",
    "concretada": "producao",
}
SECTORS = frozenset({"Setor 1", "Setor 2", "Setor 3", "Setor 4"})
GUEST_ACTIONS = frozenset({'view', 'create', 'edit', 'delete', 'export', 'approve'})
CHECKLISTS = json.loads((Path(__file__).parent / "checklists.json").read_text(encoding="utf-8"))
ACTION_CATALOG = json.loads((Path(__file__).parent / "action_catalog.json").read_text(encoding="utf-8"))
QUALITY_ACTION_CATALOG = [item for item in ACTION_CATALOG if item["module"] == "qualidade"]
QUALITY_ACTION_IDS = frozenset(item["id"] for item in QUALITY_ACTION_CATALOG)
CRONO_ACTION_CATALOG = [item for item in ACTION_CATALOG if item["id"].startswith("laboratorio.cronoanalise.")]
CRONO_ACTION_IDS = frozenset(item["id"] for item in CRONO_ACTION_CATALOG)
QUALITY_AREA_CATALOG = json.loads((Path(__file__).parent / "quality_area_catalog.json").read_text(encoding="utf-8"))
QUALITY_AREA_CODES = frozenset(item["code"] for item in QUALITY_AREA_CATALOG)


def signer():
    return URLSafeTimedSerializer(os.environ["MAPA_AUTH_SIGNING_KEY"], salt="mapa-login-v1")


def connect():
    dsn = os.environ["MAPA_AUTH_DATABASE_URL"]
    return psycopg.connect(dsn, row_factory=dict_row, connect_timeout=5)


def writer_connect():
    dsn = os.environ["MAPA_WRITER_DATABASE_URL"]
    return psycopg.connect(dsn, row_factory=dict_row, connect_timeout=5)


def public_user(row):
    return {
        "id": row["id"],
        "name": row["nome"],
        "role": row["perfil"],
        "active": row["ativo"],
        "setor": row["setor"] or "Todos",
        "primeiro_acesso": row["primeiro_acesso"],
    }


def record_mapa_login(row):
    """Record a successful login in the unified Mapa database only."""
    with connect() as conn, conn.cursor() as cur:
        cur.execute("""INSERT INTO unificado_auth.mapa_login_events
                       (user_id, role_at_login, sector_at_login)
                       VALUES (%s, %s, %s)""",
                    (row["id"], row["perfil"], row["setor"]))


def session_response(row):
    record_mapa_login(row)
    response = jsonify(ok=True, user=public_user(row))
    scope, age = session_scope_and_age(row)
    token = signer().dumps({
        "scope": scope, "id": row["id"],
        "updated_at": row["updated_at"].isoformat(),
    })
    response.set_cookie(
        COOKIE_NAME, token, max_age=age, httponly=True,
        secure=True, samesite="Lax", path=COOKIE_PATH,
    )
    response.delete_cookie(COOKIE_NAME, path=LEGACY_COOKIE_PATH)
    response.set_cookie(
        TEST_PAGE_COOKIE_NAME, token, max_age=age, httponly=True,
        secure=True, samesite="Lax", path="/unificado/testar/",
    )
    return response


@app.get("/health")
def health():
    try:
        with connect() as conn, conn.cursor() as cur:
            cur.execute("SELECT 1")
            cur.fetchone()
        return jsonify(ok=True)
    except psycopg.Error:
        return jsonify(ok=False), 503


@app.get("/testar/")
def test_landing():
    """Password-free status page, visible only with a Mapa test session."""
    authorized = bool(authenticated_user())
    if not authorized:
        token = request.cookies.get(TEST_PAGE_COOKIE_NAME)
        try:
            claim = signer().loads(token, max_age=SESSION_SECONDS) if token else None
            if claim and claim.get("scope") == "pcp_test_session":
                with pcp_connect() as conn, conn.cursor() as cur:
                    cur.execute("SELECT ativo FROM public.usuarios WHERE id=%s", (claim["id"],))
                    row = cur.fetchone()
                    authorized = bool(row and row["ativo"])
        except (BadSignature, SignatureExpired, KeyError, psycopg.Error):
            pass
    if not authorized:
        return Response(
            '<!doctype html><html lang="pt-BR"><meta charset="utf-8">'
            '<title>Entrar no sistema unificado</title><body>'
            '<p>Entre no sistema unificado de testes para abrir esta página.</p>'
            '<a href="/unificado/login.html?next=testar/">Entrar</a></body></html>',
            status=401, content_type="text/html; charset=utf-8",
        )
    template = (Path(__file__).parent / "testar-index.html").read_text(encoding="utf-8")
    info_path = Path(__file__).parent / "snapshot-info.json"
    info = json.loads(info_path.read_text()) if info_path.exists() else {}
    snapshot_at = html.escape(str(info.get("snapshot_at", "a confirmar")))
    version_path = Path(__file__).parent / "VERSION"
    version = html.escape(version_path.read_text(encoding="utf-8").strip()) if version_path.exists() else "a confirmar"
    return Response(template.replace("{{SNAPSHOT_AT}}", snapshot_at).replace("{{VERSION}}", version),
                    content_type="text/html; charset=utf-8",
                    headers={"Cache-Control": "no-store"})


def pcp_token_for(username, password):
    outbound = urllib.request.Request(
        "http://127.0.0.1:13054/api/login",
        data=json.dumps({"username": username, "senha": password}).encode(),
        headers={"Content-Type": "application/json"}, method="POST",
    )
    with urllib.request.urlopen(outbound, timeout=10) as upstream:
        return json.load(upstream)


def pcp_session_token(user):
    """Issue the PCP test API's existing HS256 token for an active linked account."""
    secret = os.environ["UNIFICADO_PCP_JWT_SECRET_KEY"]
    encode = lambda value: base64.urlsafe_b64encode(value).rstrip(b"=").decode("ascii")
    header = encode(b'{"alg":"HS256","typ":"JWT"}')
    claims = {"sub": str(user["id"]), "nivel": user["nivel_acesso"],
              "exp": int(time.time()) + 8 * 60 * 60,
              "session_epoch_ms": int(time.time() * 1000)}
    payload = encode(json.dumps(claims, separators=(",", ":")).encode())
    signed = f"{header}.{payload}"
    signature = encode(hmac.new(secret.encode(), signed.encode(), hashlib.sha256).digest())
    return signed + "." + signature


def pcp_refresh_claim(user):
    return {"scope": "pcp_refresh", "id": user["id"],
            "password": hashlib.sha256(user["senha_hash"].encode()).hexdigest(),
            "revoked": user["token_revoked_at"].isoformat()
            if user["token_revoked_at"] else None}


def pcp_refresh_user():
    token = request.cookies.get(PCP_REFRESH_COOKIE_NAME)
    if not token:
        return None
    try:
        claim = signer().loads(token, max_age=PCP_REFRESH_SECONDS)
        if claim.get("scope") != "pcp_refresh":
            return None
        with pcp_connect() as conn, conn.cursor() as cur:
            cur.execute("""SELECT id,nome,username,email,nivel_acesso,setor_id,ativo,
                          trocar_senha_primeiro_acesso,deleted_at,senha_hash,token_revoked_at
                          FROM public.usuarios WHERE id=%s""", (claim["id"],))
            user = cur.fetchone()
        if (not user or not user["ativo"] or user["deleted_at"] is not None
                or user["trocar_senha_primeiro_acesso"]
                or claim != pcp_refresh_claim(user)):
            return None
        return user
    except (BadSignature, SignatureExpired, KeyError, TypeError, psycopg.Error):
        return None


def set_pcp_refresh_cookie(response, user):
    response.set_cookie(PCP_REFRESH_COOKIE_NAME, signer().dumps(pcp_refresh_claim(user)),
                        max_age=PCP_REFRESH_SECONDS, httponly=True, secure=True,
                        samesite="Lax", path=PCP_REFRESH_PATH)


def set_pcp_screen_cookie(response, token):
    response.set_cookie(PCP_SCREEN_COOKIE_NAME, token, max_age=8 * 60 * 60,
                        httponly=True, secure=True, samesite="Lax",
                        path="/unificado/pcp/")


@app.get("/unified/pcp-session")
def unified_pcp_session():
    """Renew Planning access from Production, bearer, or a remembered PCP session."""
    mapa = authenticated_user()
    if not mapa:
        planning = authenticated_planning_bearer() or pcp_refresh_user()
        if not planning:
            return jsonify(ok=False, error="Sessão expirada. Entre novamente."), 401
        with pcp_connect() as conn, conn.cursor() as cur:
            cur.execute("""SELECT id,nome,username,email,nivel_acesso,setor_id,ativo,
                          trocar_senha_primeiro_acesso,deleted_at,senha_hash,token_revoked_at
                          FROM public.usuarios WHERE id=%s""", (planning["id"],))
            pcp = cur.fetchone()
        if (not pcp or not pcp["ativo"] or pcp["deleted_at"] is not None
                or pcp["trocar_senha_primeiro_acesso"]):
            return jsonify(ok=False, error="Planejamento indisponível para esta conta."), 403
        token = pcp_session_token(pcp)
        response = jsonify(ok=True, access_token=token,
                           usuario={key: pcp[key] for key in (
                               "id", "nome", "username", "email", "nivel_acesso",
                               "setor_id", "ativo", "trocar_senha_primeiro_acesso")})
        response.headers["Cache-Control"] = "no-store"
        set_pcp_refresh_cookie(response, pcp)
        set_pcp_screen_cookie(response, token)
        return response
    try:
        allowed, _ = screen_access_state(mapa)
        if not any(SCREENS_BY_ID[item]['module'] == 'planejamento' for item in allowed):
            return jsonify(ok=False, error='Esta conta não tem telas liberadas no Planejamento.'), 403
        link = link_for(mapa_login=mapa["id"])
        if not link:
            return jsonify(ok=False, error="Esta conta não tem acesso ao Planejamento."), 403
        with pcp_connect() as conn, conn.cursor() as cur:
            cur.execute("""SELECT id,nome,username,email,nivel_acesso,setor_id,ativo,
                          trocar_senha_primeiro_acesso FROM public.usuarios WHERE id=%s""",
                        (link["pcp_user_id"],))
            pcp = cur.fetchone()
        if not pcp or not pcp["ativo"] or pcp["trocar_senha_primeiro_acesso"]:
            return jsonify(ok=False, error="Planejamento indisponível para esta conta."), 403
        user = dict(pcp)
        token = pcp_session_token(user)
        response = jsonify(ok=True, access_token=token, usuario=user)
        response.headers["Cache-Control"] = "no-store"
        with pcp_connect() as conn, conn.cursor() as cur:
            cur.execute("""SELECT id,senha_hash,token_revoked_at FROM public.usuarios
                           WHERE id=%s""", (user["id"],))
            refresh_user = cur.fetchone()
        set_pcp_refresh_cookie(response, refresh_user)
        set_pcp_screen_cookie(response, token)
        return response
    except (KeyError, psycopg.Error):
        return jsonify(ok=False, error="Não foi possível renovar o acesso ao Planejamento."), 503


def unified_login_response(pcp, mapa, password):
    payload = {"ok": True, "modules": []}
    planning_allowed = not mapa or any(
        SCREENS_BY_ID[item]['module'] == 'planejamento'
        for item in screen_access_state(mapa)[0]
    )
    if pcp and pcp["ativo"] and planning_allowed:
        try:
            token_data = pcp_token_for(pcp["username"], password)
            payload["pcp"] = token_data
            payload["modules"].append("pcp")
        except (urllib.error.URLError, TimeoutError, ValueError):
            payload["pcp_unavailable"] = True
    if mapa and mapa["ativo"]:
        record_mapa_login(mapa)
        payload["mapa"] = public_user(mapa)
        payload["modules"].append("mapa")
    if not payload["modules"]:
        return jsonify(ok=False, error="Módulo temporariamente indisponível."), 503
    response = jsonify(payload)
    if mapa and mapa["ativo"]:
        scope, age = session_scope_and_age(mapa)
        token = signer().dumps({"scope": scope, "id": mapa["id"],
                                "updated_at": mapa["updated_at"].isoformat()})
        response.set_cookie(COOKIE_NAME, token, max_age=age,
                            httponly=True, secure=True, samesite="Lax",
                            path=COOKIE_PATH)
        response.delete_cookie(COOKIE_NAME, path=LEGACY_COOKIE_PATH)
        response.set_cookie(TEST_PAGE_COOKIE_NAME, token, max_age=age,
                            httponly=True, secure=True, samesite="Lax",
                            path="/unificado/testar/")
    elif pcp and pcp["ativo"]:
        response.delete_cookie(COOKIE_NAME, path=COOKIE_PATH)
        response.delete_cookie(COOKIE_NAME, path=LEGACY_COOKIE_PATH)
        token = signer().dumps({"scope": "pcp_test_session", "id": pcp["id"]})
        response.set_cookie(TEST_PAGE_COOKIE_NAME, token, max_age=SESSION_SECONDS,
                            httponly=True, secure=True, samesite="Lax",
                            path="/unificado/testar/")
    if payload.get("pcp", {}).get("access_token"):
        # The browser cannot attach the localStorage bearer to an iframe GET.
        # This cookie is accepted only by the static-screen auth_request.
        response.set_cookie(PCP_SCREEN_COOKIE_NAME, payload["pcp"]["access_token"],
                            max_age=8 * 60 * 60, httponly=True, secure=True,
                            samesite="Lax", path="/unificado/pcp/")
        with pcp_connect() as conn, conn.cursor() as cur:
            cur.execute("""SELECT id,senha_hash,token_revoked_at FROM public.usuarios
                           WHERE id=%s""", (pcp["id"],))
            refresh_user = cur.fetchone()
        set_pcp_refresh_cookie(response, refresh_user)
    return response


@app.post("/unified/login")
def unified_login():
    body = request.get_json(silent=True) or {}
    name = str(body.get("username") or "").strip()
    password = body.get("password")
    if not name or len(name) > 200 or not isinstance(password, str) or not password or len(password) > 1024:
        return jsonify(ok=False, error="Usuário ou senha incorretos."), 401
    try:
        pcp = pcp_user_by_login(name)
        mapa = mapa_user_by_login(name)
        link = link_for(pcp_id=pcp["id"] if pcp else None,
                        mapa_login=mapa["id"] if mapa else None)
        if link:
            linked_pcp, linked_mapa = linked_users(link)
            if not linked_pcp or not linked_mapa:
                return jsonify(ok=False, error="Conta temporariamente indisponível."), 503
            if mapa and mapa['id'] != linked_mapa['id']:
                mapa = None
            if mapa and not mapa["ativo"]:
                component = component_links(link["id"])
                other_ids = [item["mapa_login"] for item in component
                             if item["mapa_login"] != mapa["id"]]
                if other_ids:
                    with connect() as conn, conn.cursor() as cur:
                        cur.execute("SELECT 1 FROM public.usuarios WHERE id=ANY(%s) AND ativo LIMIT 1",
                                    (other_ids,))
                        if cur.fetchone():
                            raise ValueError("inactive Mapa alias")
            if not link["unified_password_set"] and not link["requires_reset"]:
                if linked_mapa['ativo'] and verify_map(password, linked_mapa['senha_hash']):
                    adopt_mapa_password(link['id'], password)
                elif linked_pcp['ativo'] and verify_pcp(password, linked_pcp['senha_hash']):
                    adopt_pcp_password(link['id'], password)
                else:
                    raise ValueError('invalid password')
                link = link_for(mapa_login=link["mapa_login"])
                linked_pcp, linked_mapa = linked_users(link)
            matches = check_link_password(link, password)
            if not any(matches):
                raise ValueError("invalid password")
            if ((not all(matches) and not link["unified_password_set"] and link["requires_reset"])
                    or (linked_pcp["ativo"] and linked_pcp["trocar_senha_primeiro_acesso"])
                    or (linked_mapa["ativo"] and linked_mapa["primeiro_acesso"])):
                reset_token = signer().dumps({"scope": "unified_reset", "link": link["id"],
                                               "updated_at": link["updated_at"].isoformat()})
                return jsonify(ok=True, reset_required=True, reset_token=reset_token)
            if not link["unified_password_set"]:
                mark_existing_shared_password(link["id"])
            return unified_login_response(linked_pcp, linked_mapa, password)
        if pcp and pcp["ativo"] and verify_pcp(password, pcp["senha_hash"]):
            if pcp["trocar_senha_primeiro_acesso"]:
                fingerprint = hashlib.sha256(pcp["senha_hash"].encode()).hexdigest()
                token = signer().dumps({"scope": "pcp_first_access", "id": pcp["id"],
                                        "fingerprint": fingerprint})
                return jsonify(ok=True, modules=["pcp"], first_access_token=token,
                               first_access_module="pcp")
            return unified_login_response(pcp, None, password)
        if mapa and mapa["ativo"] and verify_map(password, mapa["senha_hash"]):
            if mapa["primeiro_acesso"]:
                token = signer().dumps({"scope": "first_access", "id": mapa["id"],
                                        "updated_at": mapa["updated_at"].isoformat()})
                return jsonify(ok=True, modules=["mapa"], first_access_token=token)
            return unified_login_response(None, mapa, password)
    except psycopg.Error:
        app.logger.exception("Falha no banco durante o login unificado")
        return jsonify(ok=False, error="Não foi possível registrar o login no Mapa. Tente novamente."), 503
    except (ValueError, urllib.error.URLError, TimeoutError):
        pass
    time.sleep(0.25 + secrets.randbelow(100) / 1000)
    return jsonify(ok=False, error="Usuário ou senha incorretos."), 401


@app.post("/unified/pcp-first-access")
def unified_pcp_first_access():
    body = request.get_json(silent=True) or {}
    token, password = body.get("token"), body.get("password")
    if not isinstance(token, str) or not isinstance(password, str) or not 6 <= len(password) <= 128:
        return jsonify(ok=False, error="Use uma senha nova de 6 a 128 caracteres."), 400
    try:
        claim = signer().loads(token, max_age=15 * 60)
        if claim.get("scope") != "pcp_first_access":
            return jsonify(ok=False), 401
        with pcp_connect() as conn, conn.cursor() as cur:
            cur.execute("""SELECT id,username,senha_hash FROM public.usuarios
                           WHERE id=%s AND ativo AND trocar_senha_primeiro_acesso
                           FOR UPDATE""", (claim["id"],))
            user = cur.fetchone()
            if not user or hashlib.sha256(user["senha_hash"].encode()).hexdigest() != claim["fingerprint"]:
                return jsonify(ok=False), 401
            if verify_pcp(password, user["senha_hash"]):
                return jsonify(ok=False, error="Escolha uma senha diferente da atual."), 400
            cur.execute("""UPDATE public.usuarios SET senha_hash=%s,
                           trocar_senha_primeiro_acesso=false WHERE id=%s""",
                        (PCP_HASHER.hash(password), user["id"]))
        current = pcp_user_by_login(user["username"])
        return unified_login_response(current, None, password)
    except (BadSignature, SignatureExpired, KeyError, ValueError, psycopg.Error,
            urllib.error.URLError, TimeoutError):
        return jsonify(ok=False), 401


@app.post("/unified/reset")
def unified_reset():
    body = request.get_json(silent=True) or {}
    token = body.get("token")
    password = body.get("password")
    if not isinstance(token, str) or not isinstance(password, str) or not 6 <= len(password) <= 128:
        return jsonify(ok=False, error="Use uma senha nova de 6 a 128 caracteres."), 400
    try:
        claim = signer().loads(token, max_age=15 * 60)
        if claim.get("scope") != "unified_reset":
            return jsonify(ok=False), 401
        with connect() as conn, conn.cursor() as cur:
            cur.execute("SELECT * FROM unificado_auth.identity_links WHERE id=%s",
                        (claim["link"],))
            link = cur.fetchone()
        if not link or link["updated_at"].isoformat() != claim["updated_at"]:
            return jsonify(ok=False), 401
        set_unified_password(link["id"], password)
        pcp, mapa = linked_users(link)
        return unified_login_response(pcp, mapa, password)
    except (BadSignature, SignatureExpired, KeyError, ValueError, psycopg.Error,
            urllib.error.URLError, TimeoutError):
        return jsonify(ok=False), 401


@app.post("/login")
def login():
    body = request.get_json(silent=True) or {}
    name = str(body.get("name") or "").strip()
    password = str(body.get("password") or "")
    if not name or not password or len(name) > 200 or len(password) > 1024:
        return jsonify(ok=False, error="Usuário ou senha incorretos."), 401

    try:
        with connect() as conn, conn.cursor() as cur:
            cur.execute(
                """SELECT id, nome, perfil, ativo, setor, primeiro_acesso, senha_hash, updated_at
                   FROM public.usuarios
                   WHERE ativo AND (lower(id) = lower(%s) OR lower(nome) = lower(%s))
                   ORDER BY CASE WHEN lower(id) = lower(%s) THEN 0 ELSE 1 END
                   LIMIT 1""",
                (name, name, name),
            )
            row = cur.fetchone()
    except psycopg.Error:
        return jsonify(ok=False, error="Serviço temporariamente indisponível."), 503

    # Uma resposta uniforme evita revelar quais nomes existem no banco.
    try:
        valid = bool(row) and hasher.verify(row["senha_hash"], password)
    except (VerifyMismatchError, InvalidHashError):
        valid = False
    if not valid:
        time.sleep(0.25 + secrets.randbelow(100) / 1000)
        return jsonify(ok=False, error="Usuário ou senha incorretos."), 401
    if row["primeiro_acesso"]:
        token = signer().dumps({
            "scope": "first_access", "id": row["id"],
            "updated_at": row["updated_at"].isoformat(),
        })
        return jsonify(ok=True, user=public_user(row), first_access_token=token)
    try:
        return session_response(row)
    except psycopg.Error:
        app.logger.exception("Falha ao registrar login no Mapa")
        return jsonify(ok=False, error="Não foi possível registrar o login no Mapa. Tente novamente."), 503


@app.post("/first-access")
def first_access():
    body = request.get_json(silent=True) or {}
    token = body.get("token")
    password = body.get("password")
    if not isinstance(token, str) or not isinstance(password, str) or not 6 <= len(password) <= 128:
        return jsonify(ok=False, error="Use uma senha nova de 6 a 128 caracteres."), 400
    try:
        claim = signer().loads(token, max_age=15 * 60)
        if claim.get("scope") != "first_access":
            return jsonify(ok=False), 401
    except (BadSignature, SignatureExpired, AttributeError):
        return jsonify(ok=False), 401
    try:
        with connect() as conn, conn.cursor() as cur:
            cur.execute(
                """SELECT senha_hash FROM public.usuarios
                   WHERE id = %s AND ativo AND primeiro_acesso AND updated_at = %s::timestamptz""",
                (claim["id"], claim["updated_at"]),
            )
            old = cur.fetchone()
            if not old:
                return jsonify(ok=False), 401
            try:
                if hasher.verify(old["senha_hash"], password):
                    return jsonify(ok=False, error="Escolha uma senha diferente da atual."), 400
            except (VerifyMismatchError, InvalidHashError):
                pass
            cur.execute(
                """UPDATE public.usuarios
                   SET senha_hash = %s, primeiro_acesso = false, updated_at = now()
                   WHERE id = %s AND ativo AND primeiro_acesso AND updated_at = %s::timestamptz
                   RETURNING id, nome, perfil, ativo, setor, primeiro_acesso, updated_at""",
                (hasher.hash(password), claim["id"], claim["updated_at"]),
            )
            row = cur.fetchone()
            if not row:
                return jsonify(ok=False), 409
    except (KeyError, psycopg.Error):
        return jsonify(ok=False, error="Não foi possível atualizar a senha."), 503
    return session_response(row)


def authenticated_user():
    token = request.cookies.get(COOKIE_NAME) or request.cookies.get(TEST_PAGE_COOKIE_NAME)
    if not token:
        return None
    try:
        session = signer().loads(token, max_age=TV_SESSION_SECONDS)
        if (not isinstance(session, dict) or session.get("scope") not in {"session", "legacy_session", "tv_session"}
                or not isinstance(session.get("id"), str)):
            return None
        if session['scope'] == 'tv_session':
            if session['id'] not in TV_USER_IDS:
                return None
        else:
            signer().loads(token, max_age=SESSION_SECONDS)
        with connect() as conn, conn.cursor() as cur:
            cur.execute(
                """SELECT id, nome, perfil, ativo, setor, primeiro_acesso, updated_at
                   FROM public.usuarios WHERE id = %s AND ativo""",
                (session["id"],),
            )
            row = cur.fetchone()
    except (BadSignature, SignatureExpired, KeyError, psycopg.Error):
        return None
    if (not row or (row["primeiro_acesso"] and session.get("scope") != "legacy_session")
            or row["updated_at"].isoformat() != session.get("updated_at")):
        return None
    return row


@app.get("/dashboard/montagem-logins")
def dashboard_montagem_logins():
    if not authenticated_user():
        return jsonify(ok=False, error="Sessão expirada. Entre novamente."), 401
    try:
        start = date.fromisoformat(request.args.get("start", ""))
        end = date.fromisoformat(request.args.get("end", ""))
        if end < start or (end - start).days > 3650:
            raise ValueError()
        sector = request.args.get("sector", "").strip()
        if sector not in {"", "Setores 1 e 2", *SECTORS}:
            raise ValueError()
    except ValueError:
        return jsonify(ok=False, error="Período ou setor inválido."), 400
    try:
        with connect() as conn, conn.cursor() as cur:
            cur.execute("SELECT started_on FROM unificado_auth.mapa_login_tracking WHERE id=true")
            tracking = cur.fetchone()
            cur.execute("""SELECT login_day, count(DISTINCT user_id) AS montadores
                           FROM unificado_auth.mapa_login_events
                           WHERE login_day BETWEEN %s AND %s AND role_at_login='MONTADOR'
                             AND (%s = '' OR
                                  (%s = 'Setores 1 e 2' AND sector_at_login IN ('Setor 1','Setor 2')) OR
                                  sector_at_login = %s)
                           GROUP BY login_day ORDER BY login_day""",
                        (start, end, sector, sector, sector))
            days = {str(row["login_day"]): row["montadores"] for row in cur.fetchall()}
    except psycopg.Error:
        app.logger.exception("Falha ao consultar logins diários da Montagem")
        return jsonify(ok=False, error="Não foi possível consultar os logins dos montadores."), 503
    return jsonify(ok=True, started_on=str(tracking["started_on"]) if tracking else None,
                   days=days)


LAB_COOKIE_NAME = "unificado_laboratorio_session"
LAB_ALLOWED_USERS = DEFAULT_LAB_USERS
QUALITY_COOKIE_NAME = "unificado_qualidade_session"
GED_COOKIE_NAME = "unificado_ged_session"
GED_ROLES = frozenset({'LEITOR', 'OPERACIONAL', 'COLABORADOR', 'SUPERVISOR',
                       'QUALIDADE', 'GERENCIA', 'DIRETORIA', 'ADMIN', 'ADMIN_MASTER'})


@app.post('/unified/ged-bootstrap')
def ged_bootstrap():
    user = authenticated_user()
    if not user:
        return jsonify(ok=False), 403
    with connect() as conn, conn.cursor() as cur:
        cur.execute('''SELECT ged_user_id FROM unificado_auth.ged_identity_links
                       WHERE mapa_user_id=%s AND active''', (user['id'],))
        link = cur.fetchone()
    if not link:
        return jsonify(ok=False, error='Sem acesso ao GED.'), 403
    token = signer().dumps({'scope': 'session', 'id': user['id'],
                            'updated_at': user['updated_at'].isoformat()})
    response = jsonify(ok=True)
    response.set_cookie(GED_COOKIE_NAME, token, max_age=SESSION_SECONDS,
                        httponly=True, secure=True, samesite='Lax',
                        path='/unificado/ged/')
    response.headers['Cache-Control'] = 'no-store'
    return response


@app.get('/unified/ged-authorize')
def ged_authorize():
    token = request.cookies.get(GED_COOKIE_NAME)
    try:
        claim = signer().loads(token, max_age=SESSION_SECONDS) if token else None
        if not claim or claim.get('scope') != 'session':
            return Response(status=401)
        with connect() as conn, conn.cursor() as cur:
            cur.execute('''SELECT u.id,u.nome,u.ativo,u.primeiro_acesso,u.updated_at,
                                  g.ged_user_id
                           FROM public.usuarios u
                           JOIN unificado_auth.ged_identity_links g
                             ON g.mapa_user_id=u.id AND g.active
                           WHERE u.id=%s AND u.deleted_at IS NULL''', (claim['id'],))
            user = cur.fetchone()
        if (not user or not user['ativo'] or user['primeiro_acesso'] or
                user['updated_at'].isoformat() != claim.get('updated_at')):
            return Response(status=403)
        signed = ged_assertion(user['id'], str(user['ged_user_id']), scope='session')
        response = Response(status=204)
        response.headers['X-GED-Assertion'] = signed
        response.headers['Cache-Control'] = 'no-store'
        return response
    except (BadSignature, SignatureExpired, KeyError, psycopg.Error, RuntimeError):
        return Response(status=401)


@app.get('/unified/users/<user_id>/ged-access')
def user_ged_access(user_id):
    actor = unified_user_admin()
    if not actor or actor['id'] not in MASTER_USER_IDS:
        return jsonify(ok=False), 403
    with connect() as conn, conn.cursor() as cur:
        cur.execute('''SELECT id,nome,ativo FROM public.usuarios
                       WHERE id=%s AND deleted_at IS NULL''', (user_id,))
        target = cur.fetchone()
        if not target:
            return jsonify(ok=False), 404
        cur.execute('''SELECT ged_user_id,ged_role,active FROM unificado_auth.ged_identity_links
                       WHERE mapa_user_id=%s''', (user_id,))
        link = cur.fetchone()
    return jsonify(ok=True, roles=sorted(GED_ROLES),
                   access={'enabled': bool(link and link['active']),
                           'role': link['ged_role'] if link else 'LEITOR',
                           'ged_user_id': str(link['ged_user_id']) if link else None}), 200, {
                       'Cache-Control': 'no-store'}


@app.put('/unified/users/<user_id>/ged-access')
def update_user_ged_access(user_id):
    actor = unified_user_admin()
    if not actor or actor['id'] not in MASTER_USER_IDS or request.headers.get('Origin') != 'https://concrefer.concretrack.com.br':
        return jsonify(ok=False), 403
    data = request.get_json(silent=True)
    if (not isinstance(data, dict) or set(data) != {'enabled', 'role'} or
            not isinstance(data['enabled'], bool) or data['role'] not in GED_ROLES):
        return jsonify(ok=False, error='Dados GED inválidos.'), 400
    if user_id in MASTER_USER_IDS and not data['enabled']:
        return jsonify(ok=False, error='Acesso master não pode ser retirado.'), 409
    created_ged_id = None
    try:
        with connect() as conn, conn.cursor() as cur:
            cur.execute('''SELECT id,nome,ativo,primeiro_acesso FROM public.usuarios
                           WHERE id=%s AND deleted_at IS NULL FOR UPDATE''', (user_id,))
            target = cur.fetchone()
            if not target:
                return jsonify(ok=False), 404
            if data['enabled'] and (not target['ativo'] or target['primeiro_acesso']):
                return jsonify(ok=False, error='A conta Unificado precisa estar ativa.'), 409
            cur.execute('''SELECT ged_user_id,ged_role,active FROM unificado_auth.ged_identity_links
                           WHERE mapa_user_id=%s FOR UPDATE''', (user_id,))
            link = cur.fetchone()
            if data['enabled']:
                if link and link['active'] and link['ged_role'] == data['role']:
                    return jsonify(ok=True, unchanged=True)
                body = {'name': target['nome'], 'role': data['role'],
                        'ged_user_id': str(link['ged_user_id']) if link else None}
                remote = ged_admin_request(user_id, body['ged_user_id'] or '', 'grant', body)
                ged_id = remote['user']['id']
                if not link:
                    created_ged_id = ged_id
                cur.execute('''INSERT INTO unificado_auth.ged_identity_links
                               (mapa_user_id,ged_user_id,ged_role,active,approved_by)
                               VALUES (%s,%s,%s,TRUE,%s)
                               ON CONFLICT(mapa_user_id) DO UPDATE SET
                                 ged_role=EXCLUDED.ged_role,active=TRUE,
                                 approved_by=EXCLUDED.approved_by,updated_at=now()''',
                            (user_id, ged_id, data['role'], actor['id']))
            elif link and link['active']:
                ged_admin_request(user_id, str(link['ged_user_id']), 'revoke',
                                  {'ged_user_id': str(link['ged_user_id'])})
                cur.execute('''UPDATE unificado_auth.ged_identity_links
                               SET active=FALSE,updated_at=now() WHERE mapa_user_id=%s''',
                            (user_id,))
        return jsonify(ok=True), 200, {'Cache-Control': 'no-store'}
    except (psycopg.Error, urllib.error.URLError, KeyError, RuntimeError, ValueError):
        app.logger.exception('Falha ao alterar acesso GED de %s', user_id)
        if created_ged_id:
            try:
                ged_admin_request(user_id, created_ged_id, 'revoke',
                                  {'ged_user_id': created_ged_id})
            except (urllib.error.URLError, RuntimeError, KeyError):
                app.logger.error('Compensação GED necessária para %s', user_id)
        return jsonify(ok=False, error='Não foi possível alterar o acesso GED.'), 503


def quality_actions(user_id):
    if user_id in MASTER_USER_IDS:
        return sorted(QUALITY_ACTION_IDS)
    with connect() as conn, conn.cursor() as cur:
        cur.execute("""SELECT action_id FROM unificado_auth.user_action_permissions
                       WHERE user_id=%s AND action_id LIKE 'qualidade.%%'
                       ORDER BY action_id""", (user_id,))
        return [row["action_id"] for row in cur.fetchall()]


def crono_actions(user_id):
    if user_id in MASTER_USER_IDS:
        return sorted(CRONO_ACTION_IDS)
    with connect() as conn, conn.cursor() as cur:
        cur.execute("""SELECT action_id FROM unificado_auth.user_action_permissions
                       WHERE user_id=%s AND action_id LIKE 'laboratorio.cronoanalise.%%'
                       ORDER BY action_id""", (user_id,))
        return [row["action_id"] for row in cur.fetchall()]


def quality_areas(user_id):
    if user_id in MASTER_USER_IDS:
        return sorted(QUALITY_AREA_CODES)
    with connect() as conn, conn.cursor() as cur:
        cur.execute("""SELECT area_codigo FROM unificado_auth.user_quality_areas
                       WHERE user_id=%s ORDER BY area_codigo""", (user_id,))
        return [row["area_codigo"] for row in cur.fetchall()]


@app.post("/unified/qualidade-bootstrap")
def qualidade_bootstrap():
    user = authenticated_user()
    if not user:
        return jsonify(ok=False), 403
    screens, _ = screen_access_state(user)
    if not any(item.startswith("qualidade") for item in screens):
        return jsonify(ok=False), 403
    token = signer().dumps({"scope": "session", "id": user["id"],
                            "updated_at": user["updated_at"].isoformat()})
    response = jsonify(ok=True)
    response.set_cookie(QUALITY_COOKIE_NAME, token, max_age=SESSION_SECONDS,
                        httponly=True, secure=True, samesite="Lax",
                        path="/unificado/qualidade/")
    response.headers["Cache-Control"] = "no-store"
    return response


@app.get("/unified/qualidade-authorize")
def qualidade_authorize():
    token = request.cookies.get(QUALITY_COOKIE_NAME)
    try:
        claim = signer().loads(token, max_age=SESSION_SECONDS) if token else None
        if not claim or claim.get("scope") != "session":
            return Response(status=401)
        with connect() as conn, conn.cursor() as cur:
            cur.execute("""SELECT id,nome,perfil,ativo,primeiro_acesso,updated_at
                           FROM public.usuarios WHERE id=%s AND deleted_at IS NULL""",
                        (claim["id"],))
            user = cur.fetchone()
        if (not user or not user["ativo"] or user["primeiro_acesso"]
                or user["updated_at"].isoformat() != claim.get("updated_at")):
            return Response(status=401)
        screens, _ = screen_access_state(user)
        if not any(item.startswith("qualidade") for item in screens):
            return Response(status=403)
        secret = os.environ["QUALIDADE_GATEWAY_SIGNING_KEY"].encode()
        if len(secret) < 32:
            return Response(status=503)
        payload = base64.urlsafe_b64encode(json.dumps({
            "id": user["id"], "name": user["nome"], "iss": "unificado",
            "actions": quality_actions(user["id"]),
            "areas": quality_areas(user["id"]),
            "superuser": user["id"] in MASTER_USER_IDS,
            "exp": int(time.time()) + 20,
        }, separators=(",", ":")).encode()).rstrip(b"=").decode()
        signature = base64.urlsafe_b64encode(hmac.new(secret, payload.encode(), hashlib.sha256).digest()).rstrip(b"=").decode()
        response = Response(status=204)
        response.headers["X-Qualidade-Assertion"] = payload + "." + signature
        response.headers["Cache-Control"] = "no-store"
        return response
    except (BadSignature, SignatureExpired, KeyError, psycopg.Error):
        return Response(status=401)


def laboratory_role(user_id, screens, guest=False):
    if not any(item.startswith('lab') or item.startswith('cronoanalise.') for item in screens):
        return None
    if (user_id in LAB_ALLOWED_USERS or 'labUsuarios' in screens or
            guest and bool({'labMonitor', 'labHistory', 'labDevice'} & set(screens))):
        return 'admin'
    return 'engenheiro' if ('labCriteria' in screens or guest and
                           bool({'labRegisters', 'labPole', 'labTests'} & set(screens))) else 'tecnico'


@app.post("/unified/laboratorio-bootstrap")
def laboratorio_bootstrap():
    user = authenticated_user()
    if not user:
        return jsonify(ok=False), 403
    screens, _ = screen_access_state(user)
    role = laboratory_role(user['id'], screens, user['perfil'] == 'CONVIDADO')
    if not role:
        return jsonify(ok=False), 403
    token = signer().dumps({"scope": "session", "id": user["id"],
                            "updated_at": user["updated_at"].isoformat()})
    response = jsonify(ok=True, role=role)
    response.set_cookie(LAB_COOKIE_NAME, token, max_age=SESSION_SECONDS,
                        httponly=True, secure=True, samesite="Lax",
                        path="/unificado/laboratorio/")
    response.headers["Cache-Control"] = "no-store"
    return response


@app.get("/unified/laboratorio-authorize")
def laboratorio_authorize():
    token = request.cookies.get(LAB_COOKIE_NAME)
    try:
        direct_path = urllib.parse.urlsplit(request.headers.get("X-Original-URI", "")).path
        cec_path = direct_path.startswith(('/unificado/laboratorio/cec/',
                                           '/unificado/laboratorio/cec-api/'))
        unified_user = authenticated_user() if cec_path else None
        claim = ({'scope': 'session', 'id': unified_user['id'],
                  'updated_at': unified_user['updated_at'].isoformat()}
                 if unified_user else signer().loads(token, max_age=SESSION_SECONDS) if token else None)
        if not claim or claim.get("scope") != "session":
            return Response(status=401)
        with connect() as conn, conn.cursor() as cur:
            cur.execute("SELECT id,nome,perfil,ativo,primeiro_acesso,updated_at FROM public.usuarios WHERE id=%s", (claim["id"],))
            user = cur.fetchone()
        if (not user or not user["ativo"] or user["primeiro_acesso"]
                or user["updated_at"].isoformat() != claim.get("updated_at")):
            return Response(status=401)
        original_uri = request.headers.get("X-Original-URI", "")
        path = urllib.parse.urlsplit(original_uri).path
        asset = re.search(r"\.(?:js|css|png|jpg|jpeg|svg|woff2?|ico|webp)$", path, re.I)
        neutral_api = path.endswith(('/api/auth/me', '/api/auth/logout'))
        cec_manifest = path in {'/unificado/laboratorio/cec/leitura/manifest.json',
                                '/unificado/laboratorio/cec/analise/manifest.json'}
        screen = screen_for_uri(original_uri, request.headers.get("X-Unificado-Screen", ""))
        method = request.headers.get("X-Original-Method", "GET")
        accepted = None
        # The Postes SPA loads shared reference data while opening any tab.
        # Keep writes scoped to their screen; allow reads from its five tabs.
        postes_read_screens = {'labPole', 'labAbsorption', 'labTests',
                               'labRegisters', 'labCriteria'}
        if path.startswith('/unificado/laboratorio/cec-api/'):
            accepted = {'labCec'}
        elif path.startswith('/unificado/laboratorio/dosagem/api/'):
            accepted = {'labDosagem'}
        elif '/api/ensaios' in path:
            accepted = postes_read_screens if method == 'GET' else (
                {'labPole', 'labTests'} if path.endswith('/revisar') else {'labPole'})
        elif '/api/postes' in path:
            accepted = postes_read_screens if method == 'GET' else {'labPole'}
        elif '/api/criterios' in path:
            accepted = postes_read_screens if method == 'GET' else {'labCriteria'}
        elif '/api/equipamentos' in path or '/api/responsaveis' in path:
            accepted = postes_read_screens if method == 'GET' else {'labRegisters'}
        elif '/api/absorcao' in path:
            accepted = postes_read_screens if method == 'GET' else {'labAbsorption'}
        elif '/api/calculo/' in path:
            accepted = {'labPole', 'labCriteria'}
        elif '/api/auth/users' in path:
            accepted = {'labUsuarios'}
        elif '/api/v1/' in path:
            if user['perfil'] != 'CONVIDADO':
                accepted = {'labMonitor', 'labHistory', 'labDevice'}
            elif '/history' in path or '/export.csv' in path:
                accepted = {'labHistory'}
            elif '/config' in path or '/events' in path:
                accepted = {'labDevice'}
            else:
                accepted = {'labMonitor', 'labHistory', 'labDevice'}
        allowed, _ = screen_access_state(user)
        role = laboratory_role(user['id'], allowed, user['perfil'] == 'CONVIDADO')
        crono_prefix = '/unificado/laboratorio/api/laboratorio/cronoanalise/'
        crono_api = path.startswith(crono_prefix)
        crono_path = path[len(crono_prefix):] if crono_api else ''
        crono_views = (
            {'cronoanalise.inicio', 'cronoanalise.coletar', 'cronoanalise.medicoes',
             'cronoanalise.catalogo', 'cronoanalise.dimensionar', 'cronoanalise.simular'}
            if crono_path == 'status' else
            {'cronoanalise.coletar'} if crono_path == 'medicoes/lote' else
            {'cronoanalise.medicoes'} if crono_path.startswith('medicoes/') or crono_path == 'medicoes' else
            {'cronoanalise.inicio', 'cronoanalise.coletar', 'cronoanalise.medicoes',
             'cronoanalise.catalogo', 'cronoanalise.dimensionar', 'cronoanalise.simular'}
            if crono_path.startswith('atividades') else
            {'cronoanalise.inicio', 'cronoanalise.coletar', 'cronoanalise.medicoes',
             'cronoanalise.catalogo', 'cronoanalise.dimensionar', 'cronoanalise.simular'}
            if crono_path == 'estatisticas' else
            {'cronoanalise.dimensionar'} if crono_path.startswith('dimensionamento/') else
            {'cronoanalise.inicio', 'cronoanalise.simular'} if crono_path == 'simulacoes' and method == 'GET' else
            {'cronoanalise.simular'} if crono_path.startswith(('simulacao/', 'cenarios', 'simulacoes')) else
            set()
        )
        crono_allowed = crono_api and bool(crono_views & set(allowed))
        crono_document = (path == '/unificado/laboratorio/cronoanalise/metodologia-conteudo.html'
                          and 'cronoanalise.metodologia' in allowed)
        if not role or not (asset or cec_manifest or neutral_api or crono_allowed or crono_document or screen and
                               screen["module"] == "laboratorio" and
                               (accepted is None or screen["id"] in accepted) and
                               (user['perfil'] != 'CONVIDADO' or '/api/' not in path
                                or accepted is not None) and
                               screen["id"] in allowed and
                               guest_action_allowed(user, screen['id'], method, path)):
            return Response(status=403)
        secret = os.environ["LAB_GATEWAY_SIGNING_KEY"].encode()
        if len(secret) < 32:
            return Response(status=503)
        payload = base64.urlsafe_b64encode(json.dumps({
            "id": user["id"], "name": user["nome"], "role": role,
            "dosagem": "labDosagem" in allowed and screen is not None and screen["id"] == "labDosagem",
            "dosagem_role": "admin" if user["id"] in MASTER_USER_IDS else
                            "engenheiro" if role in {"admin", "engenheiro"} else "laboratorista",
            "crono_screens": [item for item in allowed if item.startswith('cronoanalise.')],
            "crono_actions": crono_actions(user['id']) if crono_allowed else [],
            "exp": int(time.time()) + 20,
        }, separators=(",", ":")).encode()).rstrip(b"=").decode()
        signature = base64.urlsafe_b64encode(hmac.new(secret, payload.encode(), hashlib.sha256).digest()).rstrip(b"=").decode()
        response = Response(status=204)
        response.headers["X-Lab-Assertion"] = payload + "." + signature
        response.headers["Cache-Control"] = "no-store"
        return response
    except (BadSignature, SignatureExpired, KeyError, psycopg.Error):
        return Response(status=401)


def test_actor():
    """Return a minimal active test identity without exposing password material."""
    mapa = authenticated_user()
    if mapa:
        return {"actor": "mapa:" + mapa["id"], "fingerprint": mapa["id"]}
    token = request.cookies.get(TEST_PAGE_COOKIE_NAME)
    try:
        claim = signer().loads(token, max_age=SESSION_SECONDS) if token else None
        if claim and claim.get("scope") == "pcp_test_session":
            with pcp_connect() as conn, conn.cursor() as cur:
                cur.execute("SELECT username,ativo FROM public.usuarios WHERE id=%s", (claim["id"],))
                row = cur.fetchone()
            if row and row["ativo"]:
                return {"actor": "pcp:" + row["username"], "fingerprint": "pcp:" + str(claim["id"])}
    except (BadSignature, SignatureExpired, KeyError, psycopg.Error):
        return None
    return None


def current_version():
    path = Path(__file__).parent / "VERSION"
    return path.read_text(encoding="utf-8").strip() if path.exists() else "unknown"


def validation_origin_ok():
    return request.headers.get("Origin") == "https://concrefer.concretrack.com.br"


@app.route("/testar/api/problems", methods=["GET", "POST"])
def test_problem_reports():
    actor = test_actor()
    if not actor:
        return jsonify(error="Sessão de teste expirada. Entre novamente."), 401
    if request.method == "POST":
        if not validation_origin_ok():
            return jsonify(error="Origem da requisição inválida."), 403
        payload = request.get_json(silent=True) or {}
        report_text = str(payload.get("text") or "").strip()
        screen = str(payload.get("screen") or "/unificado/testar/")[:500]
        if not report_text or len(report_text) > 4000:
            return jsonify(error="Descreva o problema em até 4.000 caracteres."), 400
        with connect() as conn, conn.cursor() as cur:
            cur.execute("""INSERT INTO unificado_auth.problem_reports
                           (actor,screen,version,report_text) VALUES (%s,%s,%s,%s) RETURNING id""",
                        (actor["actor"], screen, current_version(), report_text))
            report_id = cur.fetchone()["id"]
        return jsonify(ok=True, id=report_id), 201
    with connect() as conn, conn.cursor() as cur:
        cur.execute("""SELECT created_at,actor,screen,version,report_text
                       FROM unificado_auth.problem_reports ORDER BY created_at DESC LIMIT 100""")
        rows = cur.fetchall()
    return jsonify([{"created_at": row["created_at"].astimezone(ZoneInfo("America/Sao_Paulo")).isoformat(timespec="seconds"),
                     "actor": row["actor"], "screen": row["screen"], "version": row["version"],
                     "text": row["report_text"]} for row in rows])


@app.post("/testar/api/client-errors")
@app.post("/unified/client-errors")
def record_client_error():
    actor = test_actor()
    if not actor:
        return jsonify(ok=False), 401
    if not validation_origin_ok():
        return jsonify(ok=False), 403
    payload = request.get_json(silent=True) or {}
    route = str(payload.get("screen") or "unknown")[:500]
    code = str(payload.get("code") or "client.error")[:120]
    message = str(payload.get("message") or "")[:500]
    actor_hash = hashlib.sha256(actor["fingerprint"].encode()).hexdigest()[:16]
    with connect() as conn, conn.cursor() as cur:
        cur.execute("""INSERT INTO unificado_auth.client_errors
                       (actor_hash,route,error_code,version,message) VALUES (%s,%s,%s,%s,%s)""",
                    (actor_hash, route, code, current_version(), message))
    return jsonify(ok=True), 201


@app.after_request
def log_validation_http_error(response):
    if response.status_code >= 400:
        token = request.cookies.get(COOKIE_NAME) or request.cookies.get(TEST_PAGE_COOKIE_NAME) or "anonymous"
        validation_logger.warning(json.dumps({
            "event": "http_error", "at": datetime.now(timezone.utc).isoformat(),
            "route": request.path, "method": request.method, "status": response.status_code,
            "actor_hash": hashlib.sha256(token.encode()).hexdigest()[:16],
        }, separators=(",", ":")))
    content_type = response.headers.get("Content-Type", "")
    mime = content_type.split(";", 1)[0].strip().lower()
    if mime.startswith("text/") or mime in {
        "application/json", "application/javascript", "application/xml",
    }:
        response.headers["Content-Type"] = mime + "; charset=utf-8"
    return response


@app.get("/me")
def me():
    row = authenticated_user()
    if not row:
        return jsonify(ok=False), 401
    # Renew the tablet session while the app is being used. Keep the same
    # updated_at claim so a password change or deactivation still revokes it.
    return session_response(row)


@app.route("/rest/v1/<resource>", methods=["GET", "HEAD", "POST", "PATCH", "DELETE"])
def rest_read(resource):
    if resource == "usuarios" and request.method == "GET" and "senha" in request.args:
        return rest_legacy_login()
    user = authenticated_user()
    if not user:
        return jsonify(ok=False), 401
    if resource not in READ_TABLES:
        return jsonify(ok=False), 404
    if (resource == "inspecao_defeitos" and
            request.headers.get("X-Unificado-Screen", "") not in
            {"INSPECAO", "INSPECAO_DETALHE", "inspecao"}):
        return jsonify(error="Você não tem acesso a esta tela"), 403
    first_access_password_change = (
        resource == "usuarios" and request.method == "PATCH"
        and user["primeiro_acesso"] and request.args.get("id") == "eq." + user["id"]
        and isinstance(request.get_json(silent=True), dict)
        and set(request.get_json(silent=True)) <= {"senha", "primeiro_acesso", "updated_at"}
        and request.get_json(silent=True).get("primeiro_acesso") is False
    )
    database_probe = (
        resource == "usuarios" and request.method in {"GET", "HEAD"}
        and request.args.get("select") == "id"
        and request.args.get("limit") == "1"
        and set(request.args) <= {"select", "limit"}
    )
    if not first_access_password_change and not database_probe:
        mode = request.headers.get("X-Unificado-Screen", "")
        allowed, _ = screen_access_state(user)
        if mode == "HUB" and request.method in {"GET", "HEAD"}:
            if not any(SCREENS_BY_ID[item]["module"] == "producao" for item in allowed):
                return jsonify(error="Você não tem acesso a esta tela"), 403
        else:
            screen = screen_for_uri("/unificado/mapa/api/rest/v1/" + resource, mode)
            if not screen or screen["id"] not in allowed:
                return jsonify(error="Você não tem acesso a esta tela"), 403
            if not guest_action_allowed(user, screen['id'], request.method, request.path):
                return jsonify(error="Esta ação não foi liberada para o convidado"), 403
    # The original app grants the Users screen to management and to the
    # account whose displayed name is exactly Ricardo (case insensitive).
    users_screen_allowed = (user["perfil"] == "GERENCIA"
                            or str(user.get("nome") or "").strip().casefold() == "ricardo")
    if (resource == "usuarios" and not users_screen_allowed
            and not first_access_password_change and not database_probe):
        return jsonify(ok=False), 403
    if (resource == "usuarios" and not first_access_password_change and not database_probe
            and "prodUsuarios" not in screen_access_state(user)[0]):
        return jsonify(error="Você não tem acesso a esta tela"), 403
    if user["primeiro_acesso"] and not first_access_password_change:
        return jsonify(ok=False), 403
    writing = request.method not in {"GET", "HEAD"}
    if writing:
        if resource not in WRITE_TABLES and resource != "usuarios":
            return jsonify(ok=False), 405
        if request.headers.get("Origin") != "https://concrefer.concretrack.com.br":
            return jsonify(ok=False, error="Origem da requisição inválida."), 403
        if resource == "usuarios":
            return rest_users_write_with_unified_mirror(user)
    url = f"http://127.0.0.1:{13058 if writing else 13051}/{resource}"
    if request.query_string:
        url += "?" + request.query_string.decode("ascii", errors="strict")
    headers = {name: request.headers[name] for name in
               ("Accept", "Range", "Prefer", "Content-Type", "Content-Range")
               if name in request.headers}
    outbound = urllib.request.Request(
        url, headers=headers, method=request.method,
        data=request.get_data() if writing else None,
    )
    try:
        upstream = urllib.request.urlopen(outbound, timeout=15)
    except urllib.error.HTTPError as error:
        upstream = error
    except (urllib.error.URLError, TimeoutError):
        return jsonify(ok=False, error="Banco temporariamente indisponível."), 503
    response_headers = {}
    for name in ("Content-Type", "Content-Range", "Range-Unit", "Preference-Applied",
                 "Location", "Content-Location"):
        if name in upstream.headers:
            response_headers[name] = upstream.headers[name]
    body = upstream.read()
    status = upstream.status
    upstream.close()
    if (resource == "montagem_poste" and request.method == "GET" and status == 200
            and "order" not in request.args and "Range" not in request.headers
            and "offset" not in request.args and "limit" not in request.args):
        try:
            rows = json.loads(body)
            rank_path = Path("/opt/concrefer-unificado/mapa-api/montagem-order.json")
            if isinstance(rows, list) and rank_path.exists():
                order = json.loads(rank_path.read_text(encoding="utf-8"))["ids"]
                ranks = {row_id: rank for rank, row_id in enumerate(order)}
                rows.sort(key=lambda row: ranks.get(row.get("id"), len(ranks)))
                body = json.dumps(rows, ensure_ascii=False, separators=(",", ":")).encode()
        except (OSError, ValueError, TypeError, KeyError):
            pass
    if (resource == "producao" and request.method == "GET" and status in (200, 206)
            and request.args.get("order") == "data_hora.asc"):
        try:
            rows = json.loads(body)
            rank_name = ("producao-productivity-order.json"
                         if request.args.get("status") == "in.(LIBERADO,INSPECIONADO)"
                         else "producao-order.json")
            rank_path = Path("/opt/concrefer-unificado/mapa-api") / rank_name
            context_path = Path("/opt/concrefer-unificado/mapa-api/producao-order-contexts.json")
            context_key = json.dumps({
                "select": request.args.get("select", ""),
                "dates": request.args.getlist("data_fabricacao"),
                "status": request.args.get("status", ""),
            }, sort_keys=True, separators=(",", ":"))
            contexts = (json.loads(context_path.read_text(encoding="utf-8"))["contexts"]
                        if context_path.exists() else {})
            if (isinstance(rows, list) and rank_path.exists()
                    and all(isinstance(row, dict) and "id" in row for row in rows)):
                order = contexts.get(context_key)
                if order is None:
                    order = json.loads(rank_path.read_text(encoding="utf-8"))["ids"]
                ranks = {row_id: rank for rank, row_id in enumerate(order)}
                start = 0
                while start < len(rows):
                    end = start + 1
                    while (end < len(rows)
                           and rows[end].get("data_hora") == rows[start].get("data_hora")):
                        end += 1
                    if end - start > 1:
                        rows[start:end] = sorted(
                            rows[start:end],
                            key=lambda row: ranks.get(row["id"], len(ranks)),
                        )
                    start = end
                body = json.dumps(rows, ensure_ascii=False, separators=(",", ":")).encode()
        except (OSError, ValueError, TypeError, KeyError):
            pass
    return Response(body, status=status, headers=response_headers)


def rest_user_object(row):
    """The REST view never exposes the Argon2 password hash."""
    return {
        "id": row["id"], "nome": row["nome"], "perfil": row["perfil"],
        "ativo": row["ativo"], "setor": row["setor"],
        "primeiro_acesso": row["primeiro_acesso"],
        "created_at": row["created_at"].isoformat(),
        "updated_at": row["updated_at"].isoformat(),
    }


def unified_user_admin():
    actor = authenticated_user()
    if actor and actor['id'] in MASTER_USER_IDS:
        return actor
    if not actor or actor["perfil"] != "GERENCIA":
        return None
    allowed, _ = screen_access_state(actor)
    if not {'prodUsuarios', 'pcpUsuarios'} & set(allowed):
        return None
    return actor


def screen_access_state(user):
    with connect() as conn, conn.cursor() as cur:
        cur.execute("""SELECT screen_id,allowed FROM unificado_auth.user_screen_permissions
                       WHERE user_id=%s""", (user["id"],))
        overrides = {row["screen_id"]: row["allowed"] for row in cur.fetchall()}
        cur.execute("""SELECT pcp_user_id FROM unificado_auth.identity_links
                       WHERE mapa_login=%s""", (user["id"],))
        link = cur.fetchone()
    planning_role = None
    if link:
        with pcp_connect() as conn, conn.cursor() as cur:
            cur.execute("""SELECT nivel_acesso,ativo,deleted_at FROM public.usuarios
                           WHERE id=%s""", (link["pcp_user_id"],))
            pcp = cur.fetchone()
            if pcp and pcp["ativo"] and pcp["deleted_at"] is None:
                planning_role = str(pcp["nivel_acesso"])
    lab_users = LAB_ALLOWED_USERS | {user['id']} if any(
        key.startswith('lab') and value for key, value in overrides.items()
    ) else LAB_ALLOWED_USERS
    allowed = allowed_screens(user, planning_role, overrides, lab_users)
    if any(SCREENS_BY_ID[item]['module'] == 'suprimentos' for item in allowed) and not supply_flags().get('S1'):
        allowed = [item for item in allowed if SCREENS_BY_ID[item]['module'] != 'suprimentos']
    return allowed, planning_role


def guest_request_action(method, path):
    """Classify a request for the guest's per-screen action grant."""
    path = urllib.parse.urlsplit(path).path.lower()
    if '/rest/v1/rpc/' in path:
        return 'view'
    if '/laboratorio/api/calculo/' in path:
        return 'view'
    if path.endswith('/usina/leituras-qr.csv'):
        return 'view'
    if re.search(r'(?:/export(?:/|$)|/download(?:/|$)|\.(?:csv|xlsx?|pdf)$)', path):
        return 'export'
    if method in {'GET', 'HEAD'}:
        return 'view'
    if method == 'DELETE' or re.search(r'/(?:excluir(?:-lote)?|remover|limpar)(?:/|$)', path):
        return 'delete'
    if re.search(r'/(?:finalizar|revisar|aprovar|liberar)(?:/|$)', path):
        return 'approve'
    if method in {'PUT', 'PATCH'} or re.search(r'/(?:atualizar(?:-lote)?|editar)(?:/|$)', path):
        return 'edit'
    if method == 'POST':
        return 'create'
    return None


GUEST_MAPA_WRITE_SCREENS = {
    'programacao_pcp': {'liberacao', 'setor1', 'setor2', 'setor3', 'setor4'},
    'liberacao_formas': {'liberacao', 'setor1', 'setor2', 'setor3', 'setor4'},
    'producao': {'liberacao', 'setor1', 'setor2', 'setor3', 'setor4', 'inspecao'},
    'montagem_poste': {'inspecao', 'montagem', 'tratativa'},
    'inspecao_defeitos': {'inspecao'},
    'formas_manutencao': {'manutencao'},
    'prog_s3_s4': {'sequencia'},
}
GUEST_PCP_API_SCREENS = {
    'dashboard': {'dashboard', 'comparacao'},
    'volume-total': {'dashboard', 'comparacao'},
    'programacao': {'programacao12', 'programacao34', 'programacaoFinal',
                    'relatorio12', 'relatorio3', 'relatorio4'},
    'programacao-alex': {'programacao12', 'relatorio12'},
    'programacao-circular-s3': {'circular3'},
    'programacao-circular-s4': {'dt4'},
    'saques-mandril': {'circular3', 'dt4'},
    'producao': {'producaoPcp', 'relatorio12', 'relatorio3', 'relatorio4'},
    'maodeobra': {'maodeobra'},
    'maodeobra-com-rateio': {'maodeobraRateio'},
    'atividades-maodeobra': {'maodeobra', 'maodeobraRateio'},
    'apontamento-mega': {'apontamentoMega'},
    'acompanhamento-mensal': {'acompMensal', 'acompMensal34'},
    'pcp-diario': {'pcpDiario'},
    'alocacao-formas': {'formasPorSetor'},
    'etiquetas-armaduras': {'etiquetasArmaduras'},
    'teste-prog': {'testeProgramacao'},
    'usuarios': {'pcpUsuarios'},
}


def guest_endpoint_screen_allowed(screen_id, method, path):
    path = urllib.parse.urlsplit(path).path.lower()
    if '/rest/v1/' in path:
        resource = path.split('/rest/v1/', 1)[1].split('/', 1)[0]
        if resource == 'usuarios':
            return False
        if method not in {'GET', 'HEAD'}:
            return screen_id in GUEST_MAPA_WRITE_SCREENS.get(resource, set())
        return True
    if '/pcp/api/' in path:
        endpoint = path.split('/pcp/api/', 1)[1].split('/', 1)[0]
        accepted = GUEST_PCP_API_SCREENS.get(endpoint)
        if accepted is not None:
            return screen_id in accepted
        # Shared reference lists are read by several PCP pages.
        return method in {'GET', 'HEAD'} and endpoint in {
            'produtos', 'setores', 'formas', 'modelos', 'configuracoes'}
    return True


def guest_action_allowed(user, screen_id, method, path):
    if user['perfil'] != 'CONVIDADO':
        return True
    action = guest_request_action(method, path)
    if (not action or screen_id in GUEST_FORBIDDEN_SCREENS or
            not guest_endpoint_screen_allowed(screen_id, method, path)):
        return False
    with connect() as conn, conn.cursor() as cur:
        cur.execute('''SELECT 1 FROM unificado_auth.guest_action_permissions
                       WHERE user_id=%s AND screen_id=%s AND action=%s''',
                    (user['id'], screen_id, action))
        return bool(cur.fetchone())


def screen_data_allowed(user, screen_ids):
    allowed, _ = screen_access_state(user)
    screen = screen_for_uri('/unificado/mapa/api/rest/v1/producao',
                            request.headers.get('X-Unificado-Screen', ''))
    return bool(screen and screen['id'] in screen_ids and screen['id'] in allowed
                and guest_action_allowed(user, screen['id'], request.method, request.path))


def authenticated_planning_bearer(token_override=None):
    if token_override is None:
        value = request.headers.get("Authorization", "")
        if not value.startswith("Bearer "):
            return None
        token = value[7:]
    else:
        token = token_override
    try:
        header, payload, signature = token.split(".")
        expected = base64.urlsafe_b64encode(hmac.new(
            os.environ["UNIFICADO_PCP_JWT_SECRET_KEY"].encode(),
            f"{header}.{payload}".encode(), hashlib.sha256).digest()).rstrip(b"=").decode()
        if not hmac.compare_digest(signature, expected):
            return None
        claims = json.loads(base64.urlsafe_b64decode(payload + "=" * (-len(payload) % 4)))
        if int(claims.get("exp", 0)) <= time.time():
            return None
        user_id = int(claims["sub"])
        with pcp_connect() as conn, conn.cursor() as cur:
            cur.execute("""SELECT id,nivel_acesso,ativo,deleted_at,token_revoked_at
                           FROM public.usuarios WHERE id=%s""", (user_id,))
            user = cur.fetchone()
        if not user or not user["ativo"] or user["deleted_at"] is not None:
            return None
        revoked = user["token_revoked_at"]
        if revoked and int(claims.get("session_epoch_ms") or 0) <= int(revoked.timestamp() * 1000):
            return None
        return user
    except (ValueError, KeyError, TypeError, psycopg.Error):
        return None


@app.get("/unified/screen-authorize")
def unified_screen_authorize():
    original = request.headers.get("X-Original-URI", "")
    original_method = request.headers.get('X-Original-Method', 'GET')
    screen = screen_for_uri(original, request.headers.get("X-Unificado-Screen", ""))
    hub = (urllib.parse.urlsplit(original).path.rstrip('/') == '/unificado/mapa/operacao'
           and urllib.parse.parse_qs(urllib.parse.urlsplit(original).query).get('tela') == ['HUB'])
    if not screen:
        if not hub:
            return Response(status=403)
    user = authenticated_user()
    if user:
        allowed, _ = screen_access_state(user)
        if hub:
            return Response(status=204 if any(SCREENS_BY_ID[item]["module"] == "producao"
                                              for item in allowed) else 403)
        return Response(status=204 if screen["id"] in allowed and
                        guest_action_allowed(user, screen['id'], original_method, original)
                        else 403)
    if hub or screen["module"] != "planejamento":
        return Response(status=401)
    screen_cookie = (request.cookies.get(PCP_SCREEN_COOKIE_NAME)
                     if original_method == 'GET' and
                     urllib.parse.urlsplit(original).path.startswith('/unificado/pcp/') and
                     '/api/' not in urllib.parse.urlsplit(original).path else None)
    planning = authenticated_planning_bearer(screen_cookie)
    if not planning:
        return Response(status=401)
    link = link_for(pcp_id=planning["id"])
    if link:
        with connect() as conn, conn.cursor() as cur:
            cur.execute("""SELECT id,nome,perfil,ativo FROM public.usuarios
                           WHERE id=%s AND deleted_at IS NULL""", (link["mapa_login"],))
            linked = cur.fetchone()
        if not linked or not linked["ativo"]:
            return Response(status=403)
        allowed, _ = screen_access_state(linked)
        return Response(status=204 if screen["id"] in allowed and
                        guest_action_allowed(linked, screen['id'], original_method, original)
                        else 403)
    with connect() as conn, conn.cursor() as cur:
        cur.execute("""SELECT screen_id,allowed FROM unificado_auth.user_screen_permissions
                       WHERE user_id=%s""", (f'pcp:{planning["id"]}',))
        overrides = {row['screen_id']: row['allowed'] for row in cur.fetchall()}
    permitted = role_allows({"id":"", "nome":"", "perfil":""},
                            screen, str(planning["nivel_acesso"]), LAB_ALLOWED_USERS)
    return Response(status=204 if permitted and overrides.get(screen['id'], True) else 403)


def planning_admin():
    user = authenticated_planning_bearer()
    return user if user and str(user['nivel_acesso']) == 'ADMIN' else None


@app.get('/unified/planning-screen-access/me')
def planning_screen_access_me():
    planning = authenticated_planning_bearer()
    if not planning:
        return jsonify(ok=False), 401
    link = link_for(pcp_id=planning['id'])
    if link:
        with connect() as conn, conn.cursor() as cur:
            cur.execute('SELECT id,nome,perfil,ativo FROM public.usuarios WHERE id=%s AND deleted_at IS NULL',
                        (link['mapa_login'],))
            mapa = cur.fetchone()
        if not mapa or not mapa['ativo']:
            return jsonify(ok=False), 403
        allowed, _ = screen_access_state(mapa)
    else:
        with connect() as conn, conn.cursor() as cur:
            cur.execute('SELECT screen_id,allowed FROM unificado_auth.user_screen_permissions WHERE user_id=%s',
                        (f'pcp:{planning["id"]}',))
            overrides = {row['screen_id']: row['allowed'] for row in cur.fetchall()}
        allowed = allowed_screens({'id':'','nome':'','perfil':''}, str(planning['nivel_acesso']),
                                  overrides, LAB_ALLOWED_USERS)
    preview_modules = str(planning.get('username') or '').startswith('e2e-')
    return jsonify(ok=True, screens=allowed, preview_modules=preview_modules), 200, {'Cache-Control':'no-store'}


@app.get('/unified/planning-users')
def planning_users_list():
    if not planning_admin():
        return jsonify(ok=False), 403
    with pcp_connect() as conn, conn.cursor() as cur:
        cur.execute('SELECT id,username,nome,nivel_acesso,ativo,setor_id FROM public.usuarios WHERE deleted_at IS NULL ORDER BY nome,id')
        users = cur.fetchall()
    with connect() as conn, conn.cursor() as cur:
        cur.execute('SELECT pcp_user_id FROM unificado_auth.identity_links')
        linked = {row['pcp_user_id'] for row in cur.fetchall()}
    return jsonify(ok=True, users=[{'id':row['id'],'login':row['username'],'name':row['nome'],
                                    'role':str(row['nivel_acesso']),'active':row['ativo'],
                                    'setor_id':row['setor_id'],
                                    'linked':row['id'] in linked} for row in users]), 200, {'Cache-Control':'no-store'}


@app.get('/unified/planning-users/<int:user_id>/screens')
def planning_user_screens(user_id):
    if not planning_admin():
        return jsonify(ok=False), 403
    with pcp_connect() as conn, conn.cursor() as cur:
        cur.execute('SELECT id,nivel_acesso,deleted_at FROM public.usuarios WHERE id=%s',(user_id,))
        target = cur.fetchone()
    if not target or target['deleted_at'] is not None:
        return jsonify(ok=False), 404
    with connect() as conn, conn.cursor() as cur:
        cur.execute('SELECT screen_id,allowed FROM unificado_auth.user_screen_permissions WHERE user_id=%s',
                    (f'pcp:{user_id}',))
        overrides = {row['screen_id']:row['allowed'] for row in cur.fetchall()}
    screens = [{**row,'profile_allowed':role_allows({'id':'','nome':'','perfil':''}, row,
                                                     str(target['nivel_acesso']), LAB_ALLOWED_USERS),
                'checked':role_allows({'id':'','nome':'','perfil':''}, row,
                                      str(target['nivel_acesso']), LAB_ALLOWED_USERS)
                          and overrides.get(row['id'],True)} for row in SCREEN_CATALOG]
    return jsonify(ok=True,screens=screens), 200, {'Cache-Control':'no-store'}


@app.get('/unified/users/pcp/<int:user_id>/screens')
def master_planning_user_screens(user_id):
    actor = unified_user_admin()
    if not actor or actor['id'] not in MASTER_USER_IDS:
        return jsonify(ok=False), 403
    with pcp_connect() as conn, conn.cursor() as cur:
        cur.execute("""SELECT id,nivel_acesso,deleted_at FROM public.usuarios
                       WHERE id=%s""", (user_id,))
        target = cur.fetchone()
    if not target or target['deleted_at'] is not None or link_for(pcp_id=user_id):
        return jsonify(ok=False, error='Conta do PCP não encontrada ou já vinculada.'), 404
    with connect() as conn, conn.cursor() as cur:
        cur.execute("""SELECT screen_id,allowed FROM unificado_auth.user_screen_permissions
                       WHERE user_id=%s""", (f'pcp:{user_id}',))
        overrides = {row['screen_id']: row['allowed'] for row in cur.fetchall()}
    catalog = [{**screen, 'profile_allowed': True,
                'mapa_roles': [role for role in ('GERENCIA','GESTOR','MONTADOR','APONTADOR')
                               if role_allows({'id':'','nome':'','perfil':role}, screen,
                                              None, LAB_ALLOWED_USERS)]
                               if screen['module'] == 'producao' else [],
                'checked': (overrides.get(screen['id'], role_allows(
                    {'id':'','nome':'','perfil':''}, screen,
                    str(target['nivel_acesso']), LAB_ALLOWED_USERS))
                    if screen['module'] == 'planejamento' else False)}
               for screen in SCREEN_CATALOG]
    return jsonify(ok=True, screens=catalog), 200, {'Cache-Control':'no-store'}


@app.put('/unified/users/pcp/<int:user_id>/screens')
def master_planning_user_screens_update(user_id):
    actor = unified_user_admin()
    if not actor or actor['id'] not in MASTER_USER_IDS:
        return jsonify(ok=False), 403
    if request.headers.get('Origin') != 'https://concrefer.concretrack.com.br':
        return jsonify(ok=False), 403
    data = request.get_json(silent=True)
    if not isinstance(data, dict) or set(data) != {'screens','name','map_role','map_sector'}:
        return jsonify(ok=False, error='Dados inválidos.'), 400
    selected = data['screens']
    name = data['name']
    map_role = data['map_role']
    map_sector = data['map_sector']
    if (not isinstance(selected, list) or any(item not in SCREENS_BY_ID for item in selected)
            or not isinstance(name, str) or not name.strip() or len(name) > 120
            or map_role not in {'GERENCIA','GESTOR','MONTADOR','APONTADOR'}
            or map_sector not in {'Todos', *SECTORS}):
        return jsonify(ok=False, error='Dados inválidos.'), 400
    selected = set(selected)
    shadow_id = f'unif-pcp-{user_id}'
    shadow = {'id': shadow_id, 'nome': name.strip(), 'perfil': map_role}
    if any(SCREENS_BY_ID[item]['module'] == 'producao' and not role_allows(
            shadow, SCREENS_BY_ID[item], None, LAB_ALLOWED_USERS) for item in selected):
        return jsonify(ok=False, error='O perfil da Produção não permite uma das telas.'), 403
    non_planning = any(SCREENS_BY_ID[item]['module'] != 'planejamento' for item in selected)
    requested_role = required_planning_role(selected) or 'CONSULTA'
    mapa_conn = connect()
    pcp_conn = pcp_connect()
    old_pcp = None
    pcp_committed = False
    try:
        with pcp_conn.cursor() as planning, mapa_conn.cursor() as cur:
            planning.execute("""SELECT id,nome,username,nivel_acesso,ativo,deleted_at,
                              token_revoked_at FROM public.usuarios WHERE id=%s FOR UPDATE""",
                             (user_id,))
            old_pcp = planning.fetchone()
            if not old_pcp or old_pcp['deleted_at'] is not None:
                return jsonify(ok=False, error='Conta do PCP não encontrada.'), 404
            cur.execute('SELECT 1 FROM unificado_auth.identity_links WHERE pcp_user_id=%s',
                        (user_id,))
            if cur.fetchone():
                return jsonify(ok=False, error='Conta já vinculada. Atualize a lista.'), 409
            if non_planning:
                cur.execute('SELECT 1 FROM public.usuarios WHERE id=%s FOR UPDATE', (shadow_id,))
                if cur.fetchone():
                    return jsonify(ok=False, error='Identidade de acesso já existe. Atualize a lista.'), 409
                cur.execute("""INSERT INTO public.usuarios
                               (id,nome,perfil,senha_hash,ativo,setor,primeiro_acesso)
                               VALUES (%s,%s,%s,%s,%s,%s,false)""",
                            (shadow_id, name.strip(), map_role,
                             hasher.hash(secrets.token_urlsafe(32)), old_pcp['ativo'], map_sector))
                cur.execute("""INSERT INTO unificado_auth.identity_links
                               (pcp_user_id,mapa_login,requires_reset)
                               VALUES (%s,%s,false)""", (user_id, shadow_id))
            target_key = shadow_id if non_planning else f'pcp:{user_id}'
            for screen in SCREEN_CATALOG:
                if not non_planning and screen['module'] != 'planejamento':
                    continue
                cur.execute("""INSERT INTO unificado_auth.user_screen_permissions
                               (user_id,screen_id,allowed,updated_by) VALUES (%s,%s,%s,%s)
                               ON CONFLICT (user_id,screen_id) DO UPDATE SET
                               allowed=excluded.allowed,updated_by=excluded.updated_by,
                               updated_at=now()""",
                            (target_key, screen['id'], screen['id'] in selected, actor['id']))
            # Administrative linkage must not change PCP identity, password,
            # access level, grants or login tokens.
        pcp_conn.commit()
        pcp_committed = True
        try:
            mapa_conn.commit()
        except psycopg.Error:
            raise
        return jsonify(ok=True, linked=non_planning), 200, {'Cache-Control':'no-store'}
    except (psycopg.Error, KeyError, ValueError):
        app.logger.exception('Falha ao salvar alçadas de conta PCP %s', user_id)
        mapa_conn.rollback()
        if not pcp_committed:
            pcp_conn.rollback()
        return jsonify(ok=False, error='Não foi possível salvar as alçadas da conta PCP.'), 503
    finally:
        pcp_conn.close()
        mapa_conn.close()


@app.put('/unified/planning-users/<int:user_id>/screens')
def planning_user_screens_update(user_id):
    actor=planning_admin()
    if not actor or request.headers.get('Origin') != 'https://concrefer.concretrack.com.br':
        return jsonify(ok=False), 403
    data=request.get_json(silent=True)
    selected=data.get('screens') if isinstance(data,dict) else None
    if not isinstance(selected,list) or any(item not in SCREENS_BY_ID for item in selected):
        return jsonify(ok=False), 400
    with pcp_connect() as conn,conn.cursor() as cur:
        cur.execute('SELECT id,nivel_acesso,deleted_at FROM public.usuarios WHERE id=%s',(user_id,))
        target=cur.fetchone()
    if not target or target['deleted_at'] is not None or link_for(pcp_id=user_id):
        return jsonify(ok=False), 409
    if any(not role_allows({'id':'','nome':'','perfil':''}, SCREENS_BY_ID[item],
                           str(target['nivel_acesso']), LAB_ALLOWED_USERS) for item in selected):
        return jsonify(ok=False), 403
    selected=set(selected)
    with connect() as conn,conn.cursor() as cur:
        for screen in SCREEN_CATALOG:
            if screen['module'] != 'planejamento':
                continue
            cur.execute('''INSERT INTO unificado_auth.user_screen_permissions
                           (user_id,screen_id,allowed,updated_by) VALUES (%s,%s,%s,%s)
                           ON CONFLICT (user_id,screen_id) DO UPDATE SET
                           allowed=excluded.allowed,updated_by=excluded.updated_by,updated_at=now()''',
                        (f'pcp:{user_id}',screen['id'],screen['id'] in selected,f'pcp:{actor["id"]}'))
    return jsonify(ok=True), 200, {'Cache-Control':'no-store'}


@app.post('/unified/planning-users/<int:user_id>/action')
def planning_user_action(user_id):
    actor=planning_admin()
    if not actor or request.headers.get('Origin') != 'https://concrefer.concretrack.com.br':
        return jsonify(ok=False), 403
    data=request.get_json(silent=True) or {}
    action=data.get('action')
    if action not in {'deactivate','reactivate','delete'} or user_id == actor['id']:
        return jsonify(ok=False), 409
    if link_for(pcp_id=user_id):
        return jsonify(ok=False,error='Gerencie esta conta vinculada na Produção'), 409
    with pcp_connect() as conn,conn.cursor() as cur:
        cur.execute('''SELECT id,username,nome,nivel_acesso,ativo,deleted_at FROM public.usuarios
                       WHERE id=%s FOR UPDATE''',(user_id,))
        target=cur.fetchone()
        if not target or target['deleted_at'] is not None:
            return jsonify(ok=False), 404
        if action == 'delete' and data.get('confirm_login') != target['username']:
            return jsonify(ok=False,error='Digite o login para confirmar'), 400
        if action in {'delete','deactivate'} and target['nivel_acesso'] == 'ADMIN' and target['ativo']:
            cur.execute("SELECT count(*) AS total FROM public.usuarios WHERE nivel_acesso='ADMIN' AND ativo AND deleted_at IS NULL")
            if cur.fetchone()['total'] <= 1:
                return jsonify(ok=False,error='Não é possível remover o último admin'), 409
        if action == 'deactivate' and not target['ativo'] or action == 'reactivate' and target['ativo']:
            return jsonify(ok=False,error='Conta já está neste estado'), 409
        cur.execute('''UPDATE public.usuarios SET ativo=%s,
                       token_revoked_at=CASE WHEN %s THEN now() ELSE token_revoked_at END,
                       deleted_at=CASE WHEN %s THEN now() ELSE deleted_at END
                       WHERE id=%s''', (action=='reactivate',action!='reactivate',action=='delete',user_id))
    with connect() as conn,conn.cursor() as cur:
        cur.execute('''INSERT INTO unificado_auth.user_actions(actor_id,target_id,target_name,action)
                       VALUES (%s,%s,%s,%s)''',(f'pcp:{actor["id"]}',f'pcp:{user_id}',target['nome'],action))
    return jsonify(ok=True), 200, {'Cache-Control':'no-store'}


@app.get("/unified/screen-access/bootstrap.js")
def screen_access_bootstrap():
    user = authenticated_user()
    allowed, _ = screen_access_state(user) if user else (None, None)
    modes = [row["screen"] for row in SCREEN_CATALOG if allowed is not None
             and row["id"] in allowed and row["screen"]]
    path_screens = {row["path"]: row["id"] for row in SCREEN_CATALOG if row["module"] == "planejamento"}
    script = ("window.__unificadoAllowedScreens=" + json.dumps(allowed)
              + ";window.__unificadoAllowedModes=" + json.dumps(modes)
              + ";window.__unificadoPathScreens=" + json.dumps(path_screens) + ";")
    return Response(script, content_type="application/javascript; charset=utf-8",
                    headers={"Cache-Control":"no-store"})


@app.get("/unified/screen-access/me")
def my_screen_access():
    user = authenticated_user()
    if not user:
        return jsonify(ok=False), 401
    allowed, _ = screen_access_state(user)
    preview_modules = (user['id'] in MASTER_USER_IDS
                       or user['id'].startswith(('e2e-', 'unif-pcp-'))
                       or user['id'] == 'ricardo.teste')
    with connect() as conn, conn.cursor() as cur:
        cur.execute('''SELECT EXISTS(SELECT 1 FROM unificado_auth.ged_identity_links
                       WHERE mapa_user_id=%s AND active) AS ged_access''', (user['id'],))
        ged_access = cur.fetchone()['ged_access']
    suprimentos_enabled = any(SCREENS_BY_ID[item]['module'] == 'suprimentos' for item in allowed)
    response = jsonify(ok=True, screens=allowed, preview_modules=preview_modules,
                       ged_access=ged_access,
                       suprimentos_flags=supply_flags() if suprimentos_enabled else {},
                       suprimentos_enabled=suprimentos_enabled)
    scope, age = session_scope_and_age(user)
    token = signer().dumps({"scope": "legacy_session" if user["primeiro_acesso"] else scope, "id": user["id"],
                            "updated_at": user["updated_at"].isoformat()})
    response.set_cookie(COOKIE_NAME, token, max_age=age,
                        httponly=True, secure=True, samesite="Lax", path=COOKIE_PATH)
    response.delete_cookie(COOKIE_NAME, path=LEGACY_COOKIE_PATH)
    response.headers["Cache-Control"] = "no-store"
    return response


def required_planning_role(selected):
    planning = [SCREENS_BY_ID[item] for item in selected
                if SCREENS_BY_ID[item]['module'] == 'planejamento']
    if not planning:
        return None
    requirements = {row['require'] for row in planning}
    if 'ADMIN' in requirements:
        return 'ADMIN'
    if 'PCP' in requirements:
        return 'PCP'
    if 'PRODUCAO' in requirements:
        return 'PRODUCAO'
    return 'CONSULTA'


@app.post('/unified/guests')
def create_unified_guest():
    actor = unified_user_admin()
    if not actor or actor['id'] not in MASTER_USER_IDS:
        return jsonify(ok=False), 403
    if request.headers.get('Origin') != 'https://concrefer.concretrack.com.br':
        return jsonify(ok=False), 403
    data = request.get_json(silent=True)
    if not isinstance(data, dict) or set(data) != {'login', 'name', 'password', 'sector'}:
        return jsonify(ok=False, error='Dados inválidos.'), 400
    login, name, password, sector = (data['login'], data['name'],
                                     data['password'], data['sector'])
    if (not isinstance(login, str) or not re.fullmatch(r'[a-z][a-z0-9_-]{2,39}', login)
            or not isinstance(name, str) or not name.strip() or len(name) > 120
            or not isinstance(password, str) or not 6 <= len(password) <= 128
            or sector not in {'Todos', *SECTORS}):
        return jsonify(ok=False, error='Confira o login, o nome, o setor e a senha temporária.'), 400
    try:
        with connect() as conn, conn.cursor() as cur:
            cur.execute('SELECT 1 FROM public.usuarios WHERE lower(id)=lower(%s)', (login,))
            if cur.fetchone():
                return jsonify(ok=False, error='Este login já está cadastrado.'), 409
            cur.execute('''INSERT INTO public.usuarios
                           (id,nome,perfil,senha_hash,ativo,setor,primeiro_acesso)
                           VALUES (%s,%s,'CONVIDADO',%s,true,%s,true)''',
                        (login, name.strip(), hasher.hash(password), sector))
    except psycopg.errors.UniqueViolation:
        return jsonify(ok=False, error='Este login já está cadastrado.'), 409
    except psycopg.Error:
        app.logger.exception('Falha ao criar convidado')
        return jsonify(ok=False, error='Não foi possível criar o convidado.'), 503
    return jsonify(ok=True, user={'id': login, 'login': login, 'name': name.strip(),
                                  'role': 'CONVIDADO', 'source': 'mapa', 'setor': sector,
                                  'guest': True, 'active': True}), 201, {'Cache-Control': 'no-store'}


def save_unified_access(user_id, selected, actor, *, name=None, role=None, sector=None,
                        guest_actions=None):
    """Persist explicit grants; provision a personal PCP account on a master grant."""
    requested_role = required_planning_role(selected)
    mapa_conn = connect()
    pcp_conn = None
    created_pcp_id = None
    changed_pcp = None
    pcp_committed = False
    try:
        with mapa_conn.cursor() as cur:
            cur.execute("""SELECT id,nome,perfil,ativo FROM public.usuarios
                           WHERE id=%s AND deleted_at IS NULL FOR UPDATE""", (user_id,))
            target = cur.fetchone()
            if not target:
                return 404, 'Conta não encontrada.'
            if target['perfil'] == 'CONVIDADO' and (actor['id'] not in MASTER_USER_IDS
                                                   or guest_actions is None):
                return 403, 'Somente Ricardo pode definir as ações do convidado.'
            cur.execute("""SELECT pcp_user_id FROM unificado_auth.identity_links
                           WHERE mapa_login=%s ORDER BY id ASC LIMIT 1""", (user_id,))
            link = cur.fetchone()
            master_grant = actor['id'] in MASTER_USER_IDS
            if requested_role and not link and not master_grant:
                return 403, 'Somente Ricardo pode criar acesso ao Planejamento.'
            if master_grant and (requested_role or link):
                pcp_conn = pcp_connect()
                with pcp_conn.cursor() as planning:
                    if link:
                        planning.execute("""SELECT id,username,nivel_acesso,ativo,deleted_at,token_revoked_at
                                           FROM public.usuarios WHERE id=%s FOR UPDATE""",
                                         (link['pcp_user_id'],))
                        old = planning.fetchone()
                        if not old or old['deleted_at'] is not None:
                            if requested_role:
                                return 409, 'A conta vinculada no PCP novo não está disponível.'
                        else:
                            pcp_origin = user_id.startswith('unif-pcp-')
                            desired_active = bool((requested_role or pcp_origin and selected) and target['ativo'])
                            desired_role = requested_role or ('CONSULTA' if pcp_origin else str(old['nivel_acesso']))
                            if old['ativo'] != desired_active or str(old['nivel_acesso']) != desired_role:
                                changed_pcp = old
                                planning.execute("""UPDATE public.usuarios SET ativo=%s,
                                                nivel_acesso=%s::nivelacesso,token_revoked_at=now()
                                                WHERE id=%s""",
                                                 (desired_active, desired_role, old['id']))
                    elif requested_role:
                        shadow_login = 'unif-' + hashlib.sha256(user_id.encode()).hexdigest()[:24]
                        planning.execute("""INSERT INTO public.usuarios
                            (nome,username,email,senha_hash,nivel_acesso,ativo,trocar_senha_primeiro_acesso)
                            VALUES (%s,%s,%s,%s,%s::nivelacesso,%s,false) RETURNING id""",
                            ((name or target['nome'])[:120], shadow_login,
                             shadow_login + '@local.invalid',
                             PCP_HASHER.hash(secrets.token_urlsafe(32)),
                             requested_role, bool(target['ativo'])))
                        created_pcp_id = planning.fetchone()['id']
                        cur.execute("""INSERT INTO unificado_auth.identity_links
                                       (pcp_user_id,mapa_login,requires_reset)
                                       VALUES (%s,%s,false)""", (created_pcp_id, user_id))
            if name is not None:
                cur.execute("""UPDATE public.usuarios SET nome=%s,perfil=%s,setor=%s,
                               updated_at=now() WHERE id=%s""",
                            (name, role, sector, user_id))
            for screen in SCREEN_CATALOG:
                cur.execute("""INSERT INTO unificado_auth.user_screen_permissions
                               (user_id,screen_id,allowed,updated_by) VALUES (%s,%s,%s,%s)
                               ON CONFLICT (user_id,screen_id) DO UPDATE SET
                               allowed=excluded.allowed,updated_by=excluded.updated_by,
                               updated_at=now()""",
                            (user_id, screen['id'], screen['id'] in selected, actor['id']))
            if target['perfil'] == 'CONVIDADO':
                cur.execute('DELETE FROM unificado_auth.guest_action_permissions WHERE user_id=%s',
                            (user_id,))
                for screen_id, actions in guest_actions.items():
                    for action in actions:
                        cur.execute('''INSERT INTO unificado_auth.guest_action_permissions
                                       (user_id,screen_id,action,updated_by)
                                       VALUES (%s,%s,%s,%s)''',
                                    (user_id, screen_id, action, actor['id']))
        if pcp_conn:
            pcp_conn.commit()
            pcp_committed = True
        try:
            mapa_conn.commit()
        except psycopg.Error:
            if pcp_committed:
                with pcp_connect() as undo, undo.cursor() as cur:
                    if created_pcp_id:
                        cur.execute('DELETE FROM public.usuarios WHERE id=%s', (created_pcp_id,))
                    elif changed_pcp:
                        cur.execute("""UPDATE public.usuarios SET nivel_acesso=%s::nivelacesso,ativo=%s,
                                       token_revoked_at=%s WHERE id=%s""",
                                    (str(changed_pcp['nivel_acesso']), changed_pcp['ativo'],
                                     changed_pcp['token_revoked_at'], changed_pcp['id']))
            raise
        return 200, None
    except (psycopg.Error, KeyError, ValueError):
        app.logger.exception('Falha ao salvar alçadas unificadas de %s', user_id)
        mapa_conn.rollback()
        if pcp_conn and not pcp_committed:
            pcp_conn.rollback()
        return 503, 'Não foi possível salvar as alçadas. Nenhuma mudança foi confirmada.'
    finally:
        if pcp_conn:
            pcp_conn.close()
        mapa_conn.close()


@app.get("/unified/users/<user_id>/screens")
def user_screen_access(user_id):
    actor = unified_user_admin()
    if not actor:
        return jsonify(ok=False), 403
    with connect() as conn, conn.cursor() as cur:
        cur.execute("""SELECT id,nome,perfil,ativo FROM public.usuarios
                       WHERE id=%s AND deleted_at IS NULL""", (user_id,))
        user = cur.fetchone()
    if not user:
        return jsonify(ok=False), 404
    if user['perfil'] == 'CONVIDADO' and actor['id'] not in MASTER_USER_IDS:
        return jsonify(ok=False), 403
    guest_actions = {}
    if user['perfil'] == 'CONVIDADO':
        with connect() as conn, conn.cursor() as cur:
            cur.execute('''SELECT screen_id,action FROM unificado_auth.guest_action_permissions
                           WHERE user_id=%s''', (user_id,))
            for grant in cur.fetchall():
                guest_actions.setdefault(grant['screen_id'], []).append(grant['action'])
    allowed, planning_role = screen_access_state(user)
    editable_lab_users = LAB_ALLOWED_USERS | {user['id']}
    catalog = [{**screen, "profile_allowed": (
                    (user['perfil'] != 'CONVIDADO' or
                     screen['id'] not in GUEST_FORBIDDEN_SCREENS) and
                    (actor['id'] in MASTER_USER_IDS and
                     (screen['module'] == 'planejamento' or user['perfil'] == 'CONVIDADO')
                     or role_allows(user, screen, planning_role, editable_lab_users))),
                "mapa_roles": [role for role in ("GERENCIA", "GESTOR", "MONTADOR", "APONTADOR")
                               if role_allows({**user, "perfil": role}, screen, planning_role, LAB_ALLOWED_USERS)]
                               if screen["module"] == "producao" else [],
                "checked": screen["id"] in allowed,
                "actions": guest_actions.get(screen['id'], []) if user['perfil'] == 'CONVIDADO' else None
                } for screen in SCREEN_CATALOG]
    return jsonify(ok=True, screens=catalog), 200, {"Cache-Control": "no-store"}


@app.get("/unified/users/<user_id>/quality-actions")
def user_quality_actions(user_id):
    actor = unified_user_admin()
    if not actor:
        return jsonify(ok=False), 403
    with connect() as conn, conn.cursor() as cur:
        cur.execute("""SELECT id,perfil FROM public.usuarios
                       WHERE id=%s AND deleted_at IS NULL""", (user_id,))
        target = cur.fetchone()
    if not target:
        return jsonify(ok=False), 404
    if target["perfil"] == "CONVIDADO" and actor["id"] not in MASTER_USER_IDS:
        return jsonify(ok=False), 403
    return jsonify(ok=True, actions=QUALITY_ACTION_CATALOG,
                   granted=quality_actions(user_id), areas=QUALITY_AREA_CATALOG,
                   granted_areas=quality_areas(user_id)), 200, {"Cache-Control": "no-store"}


@app.get("/unified/users/<user_id>/crono-actions")
def user_crono_actions(user_id):
    actor = unified_user_admin()
    if not actor:
        return jsonify(ok=False), 403
    with connect() as conn, conn.cursor() as cur:
        cur.execute("""SELECT id,perfil FROM public.usuarios
                       WHERE id=%s AND deleted_at IS NULL""", (user_id,))
        target = cur.fetchone()
    if not target:
        return jsonify(ok=False), 404
    if target["perfil"] == "CONVIDADO" and actor["id"] not in MASTER_USER_IDS:
        return jsonify(ok=False), 403
    return jsonify(ok=True, actions=CRONO_ACTION_CATALOG,
                   granted=crono_actions(user_id)), 200, {"Cache-Control": "no-store"}


@app.put("/unified/users/<user_id>/crono-actions")
def update_user_crono_actions(user_id):
    actor = unified_user_admin()
    if not actor or request.headers.get("Origin") not in {
            "https://concrefer.concretrack.com.br",
            "https://concrefer.concretrack.com.br:18446"}:
        return jsonify(ok=False), 403
    if user_id == MASTER_USER_ID:
        return jsonify(ok=False, error="A conta master tem acesso implícito."), 409
    data = request.get_json(silent=True)
    selected = data.get("actions") if isinstance(data, dict) and set(data) == {"actions"} else None
    if (not isinstance(selected, list) or len(selected) != len(set(selected))
            or any(not isinstance(item, str) or item not in CRONO_ACTION_IDS for item in selected)):
        return jsonify(ok=False, error="Ações inválidas."), 400
    with connect() as conn, conn.cursor() as cur:
        cur.execute("""SELECT id,perfil FROM public.usuarios
                       WHERE id=%s AND deleted_at IS NULL FOR UPDATE""", (user_id,))
        target = cur.fetchone()
        if not target:
            return jsonify(ok=False), 404
        if target["perfil"] == "CONVIDADO" and actor["id"] not in MASTER_USER_IDS:
            return jsonify(ok=False), 403
        cur.execute("""DELETE FROM unificado_auth.user_action_permissions
                       WHERE user_id=%s AND action_id LIKE 'laboratorio.cronoanalise.%%'
                         AND action_id <> ALL(%s::text[])""", (user_id, selected))
        for action_id in selected:
            cur.execute("""INSERT INTO unificado_auth.user_action_permissions
                           (user_id,action_id,granted_by) VALUES (%s,%s,%s)
                           ON CONFLICT (user_id,action_id) DO NOTHING""",
                        (user_id, action_id, actor["id"]))
    return jsonify(ok=True), 200, {"Cache-Control": "no-store"}


@app.get("/unified/quality-actions")
def quality_action_catalog():
    if not unified_user_admin():
        return jsonify(ok=False), 403
    return jsonify(ok=True, actions=QUALITY_ACTION_CATALOG,
                   areas=QUALITY_AREA_CATALOG), 200, {"Cache-Control": "no-store"}


@app.get("/unified/quality-users")
def quality_user_directory():
    user = authenticated_user()
    if not user:
        return jsonify(ok=False), 401
    screens, _ = screen_access_state(user)
    if not any(item.startswith("qualidade") for item in screens):
        return jsonify(ok=False), 403
    with connect() as conn, conn.cursor() as cur:
        cur.execute("""SELECT id,nome FROM public.usuarios
                       WHERE ativo AND NOT primeiro_acesso AND deleted_at IS NULL
                       ORDER BY nome,id""")
        users = [{"id": row["id"], "name": row["nome"]} for row in cur.fetchall()]
    return jsonify(ok=True, users=users), 200, {"Cache-Control": "no-store"}


@app.put("/unified/users/<user_id>/quality-actions")
def update_user_quality_actions(user_id):
    actor = unified_user_admin()
    if not actor or request.headers.get("Origin") != "https://concrefer.concretrack.com.br":
        return jsonify(ok=False), 403
    if user_id in MASTER_USER_IDS:
        return jsonify(ok=False, error="A conta master tem acesso implícito."), 409
    data = request.get_json(silent=True)
    selected = data.get("actions") if isinstance(data, dict) and set(data) == {"actions", "areas"} else None
    areas = data.get("areas") if isinstance(data, dict) else None
    if (not isinstance(selected, list) or len(selected) != len(set(selected))
            or any(not isinstance(item, str) or item not in QUALITY_ACTION_IDS for item in selected)
            or not isinstance(areas, list) or len(areas) != len(set(areas))
            or any(not isinstance(item, str) or item not in QUALITY_AREA_CODES for item in areas)):
        return jsonify(ok=False, error="Ações inválidas."), 400
    with connect() as conn, conn.cursor() as cur:
        cur.execute("""SELECT id,perfil FROM public.usuarios
                       WHERE id=%s AND deleted_at IS NULL FOR UPDATE""", (user_id,))
        target = cur.fetchone()
        if not target:
            return jsonify(ok=False), 404
        if target["perfil"] == "CONVIDADO" and actor["id"] not in MASTER_USER_IDS:
            return jsonify(ok=False), 403
        cur.execute("""DELETE FROM unificado_auth.user_action_permissions
                       WHERE user_id=%s AND action_id LIKE 'qualidade.%%'
                         AND action_id <> ALL(%s::text[])""", (user_id, selected))
        for action_id in selected:
            cur.execute("""INSERT INTO unificado_auth.user_action_permissions
                           (user_id,action_id,granted_by) VALUES (%s,%s,%s)
                           ON CONFLICT (user_id,action_id) DO NOTHING""",
                        (user_id, action_id, actor["id"]))
        cur.execute("""DELETE FROM unificado_auth.user_quality_areas
                       WHERE user_id=%s AND area_codigo <> ALL(%s::text[])""", (user_id, areas))
        for area_code in areas:
            cur.execute("""INSERT INTO unificado_auth.user_quality_areas
                           (user_id,area_codigo,granted_by) VALUES (%s,%s,%s)
                           ON CONFLICT (user_id,area_codigo) DO NOTHING""",
                        (user_id, area_code, actor["id"]))
    return jsonify(ok=True), 200, {"Cache-Control": "no-store"}


@app.put("/unified/users/<user_id>/screens")
def update_user_screen_access(user_id):
    actor = unified_user_admin()
    if not actor:
        return jsonify(ok=False), 403
    if user_id in MASTER_USER_IDS:
        return jsonify(ok=False, error='A conta do administrador master não pode ser alterada.'), 409
    if request.headers.get("Origin") not in {
            "https://concrefer.concretrack.com.br",
            "https://concrefer.concretrack.com.br:18446"}:
        return jsonify(ok=False), 403
    data = request.get_json(silent=True)
    selected = data.get("screens") if isinstance(data, dict) else None
    if not isinstance(selected, list) or any(not isinstance(item, str) or item not in SCREENS_BY_ID for item in selected):
        return jsonify(ok=False, error="Telas inválidas"), 400
    with connect() as conn, conn.cursor() as cur:
        cur.execute("""SELECT id,nome,perfil,ativo FROM public.usuarios
                       WHERE id=%s AND deleted_at IS NULL""", (user_id,))
        user = cur.fetchone()
        if not user:
            return jsonify(ok=False), 404
    if user['perfil'] == 'CONVIDADO':
        return jsonify(ok=False, error='Use o editor de ações do convidado.'), 400
    _, planning_role = screen_access_state(user)
    if any(SCREENS_BY_ID[item]['module'] != 'planejamento'
           and not role_allows(user, SCREENS_BY_ID[item], planning_role, LAB_ALLOWED_USERS | {user_id})
           or SCREENS_BY_ID[item]['module'] == 'planejamento'
           and actor['id'] not in MASTER_USER_IDS
           and not role_allows(user, SCREENS_BY_ID[item], planning_role, LAB_ALLOWED_USERS)
           for item in selected):
        return jsonify(ok=False, error="O perfil não permite uma das telas"), 403
    status, error = save_unified_access(user_id, set(selected), actor)
    if error:
        return jsonify(ok=False, error=error), status
    return jsonify(ok=True), 200, {"Cache-Control": "no-store"}


@app.patch("/unified/users/<user_id>")
def update_unified_user(user_id):
    actor = unified_user_admin()
    if not actor or request.headers.get("Origin") not in {
            "https://concrefer.concretrack.com.br",
            "https://concrefer.concretrack.com.br:18446"}:
        return jsonify(ok=False), 403
    if user_id in MASTER_USER_IDS:
        return jsonify(ok=False, error='A conta do administrador master não pode ser alterada.'), 409
    data = request.get_json(silent=True)
    base_fields = {"name", "role", "sector", "screens"}
    if not isinstance(data, dict) or set(data) not in (base_fields, base_fields | {'actions'}):
        return jsonify(ok=False, error="Dados inválidos"), 400
    name, role, sector, selected = data["name"], data["role"], data["sector"], data["screens"]
    if (not isinstance(name, str) or not name.strip() or len(name) > 200
            or role not in {"GERENCIA", "GESTOR", "MONTADOR", "APONTADOR", "CONVIDADO"}
            or not isinstance(sector, str) or sector not in {"Todos", *SECTORS}
            or not isinstance(selected, list)
            or any(not isinstance(item, str) or item not in SCREENS_BY_ID for item in selected)):
        return jsonify(ok=False, error="Dados inválidos"), 400
    with connect() as conn, conn.cursor() as cur:
        cur.execute("""SELECT id,nome,perfil,ativo FROM public.usuarios
                       WHERE id=%s AND deleted_at IS NULL""", (user_id,))
        user = cur.fetchone()
    if not user:
        return jsonify(ok=False), 404
    if user['perfil'] == 'CONVIDADO' and actor['id'] not in MASTER_USER_IDS:
        return jsonify(ok=False), 403
    if (user['perfil'] == 'CONVIDADO') != (role == 'CONVIDADO'):
        return jsonify(ok=False, error='O tipo Convidado não pode ser alterado.'), 400
    if user['perfil'] == 'CONVIDADO':
        actions = data.get('actions')
        if (set(data) != base_fields | {'actions'} or not isinstance(actions, dict)
                or set(actions) != set(selected)
                or any(screen_id in GUEST_FORBIDDEN_SCREENS or
                       not isinstance(grants, list) or not grants or 'view' not in grants or
                       len(grants) != len(set(grants)) or
                       any(grant not in GUEST_ACTIONS for grant in grants)
                       for screen_id, grants in actions.items())):
            return jsonify(ok=False, error='Selecione as ações de cada tela liberada.'), 400
        status, error = save_unified_access(user_id, set(selected), actor,
                                            name=name.strip(), role=role, sector=sector,
                                            guest_actions=actions)
        if error:
            return jsonify(ok=False, error=error), status
        return jsonify(ok=True), 200, {"Cache-Control": "no-store"}
    if set(data) != base_fields:
        return jsonify(ok=False, error='Dados inválidos'), 400
    changed = {**user, "nome": name.strip(), "perfil": role}
    _, planning_role = screen_access_state(changed)
    if any(SCREENS_BY_ID[item]['module'] != 'planejamento'
           and not role_allows(changed, SCREENS_BY_ID[item], planning_role, LAB_ALLOWED_USERS | {user_id})
           or SCREENS_BY_ID[item]['module'] == 'planejamento'
           and actor['id'] not in MASTER_USER_IDS
           and not role_allows(changed, SCREENS_BY_ID[item], planning_role, LAB_ALLOWED_USERS)
           for item in selected):
        return jsonify(ok=False, error="O perfil não permite uma das telas"), 403
    status, error = save_unified_access(user_id, set(selected), actor,
                                        name=name.strip(), role=role, sector=sector)
    if error:
        return jsonify(ok=False, error=error), status
    return jsonify(ok=True), 200, {"Cache-Control": "no-store"}


@app.get("/unified/users")
def unified_users_list():
    actor = unified_user_admin()
    if not actor:
        return jsonify(ok=False), 403
    with connect() as conn, conn.cursor() as cur:
        cur.execute("""SELECT id,nome,perfil,ativo,setor,primeiro_acesso
                       FROM public.usuarios WHERE deleted_at IS NULL ORDER BY nome,id""")
        mapa_users = cur.fetchall()
        cur.execute("""SELECT mapa_login,pcp_user_id FROM unificado_auth.identity_links
                       ORDER BY id""")
        all_links = cur.fetchall()
        links = {}
        for row in all_links:
            links.setdefault(row["mapa_login"], row["pcp_user_id"])
        linked_ids = {row["pcp_user_id"] for row in all_links}
        cur.execute("""SELECT user_id,screen_id,allowed FROM unificado_auth.user_screen_permissions
                       WHERE screen_id LIKE 'lab%%'""")
        lab_permissions = {}
        for grant in cur.fetchall():
            lab_permissions.setdefault(grant['user_id'], {})[grant['screen_id']] = grant['allowed']
        cur.execute('''SELECT mapa_user_id,ged_role FROM unificado_auth.ged_identity_links
                       WHERE active''')
        ged_roles = {row['mapa_user_id']: row['ged_role'] for row in cur.fetchall()}
    with pcp_connect() as conn, conn.cursor() as cur:
        cur.execute("""SELECT u.id,u.username,u.nome,u.nivel_acesso,u.ativo,u.setor_id,
                              s.nome AS setor_nome
                       FROM public.usuarios u LEFT JOIN public.setores s ON s.id=u.setor_id
                       WHERE u.deleted_at IS NULL ORDER BY u.nome,u.id""")
        planning = {row["id"]: row for row in cur.fetchall()}
    users = []
    for row in mapa_users:
        counterpart = planning.get(links.get(row["id"]))
        item = public_user(row)
        display_login = (counterpart['username'] if counterpart and
                         row['id'].startswith('unif-pcp-') else row['id'])
        item.update(source="mapa", login=display_login,
                    guest=row['perfil'] == 'CONVIDADO',
                    can_manage=row['perfil'] != 'CONVIDADO' or actor['id'] in MASTER_USER_IDS,
                    pcp_id=counterpart["id"] if counterpart else None,
                    production_role=None if row['perfil'] == 'CONVIDADO' else row["perfil"],
                    planning_role=str(counterpart["nivel_acesso"]) if counterpart else None,
                    laboratory_role=laboratory_role(row['id'], {
                        screen['id'] for screen in SCREEN_CATALOG if screen['module'] == 'laboratorio'
                        and (row['id'] in MASTER_USER_IDS or lab_permissions.get(row['id'], {}).get(
                            screen['id'], row['id'] in LAB_ALLOWED_USERS))},
                        row['perfil'] == 'CONVIDADO'),
                    ged_role=ged_roles.get(row['id']),
                    planning_sector=counterpart["setor_nome"] if counterpart else None,
                    planning_active=counterpart["ativo"] if counterpart else None)
        users.append(item)
    for row in planning.values():
        if row["id"] in linked_ids:
            continue
        users.append(dict(id=f'pcp:{row["id"]}', pcp_id=row["id"], source="pcp",
                          can_manage=actor['id'] in MASTER_USER_IDS,
                          login=row["username"], name=row["nome"], role=str(row["nivel_acesso"]),
                          active=row["ativo"], setor=row["setor_nome"] or "Todos",
                          production_role=None, planning_role=str(row["nivel_acesso"]),
                          laboratory_role=None, planning_sector=row["setor_nome"],
                          planning_active=row["ativo"]))
    users.sort(key=lambda item: (item["name"].casefold(), item["login"].casefold()))
    return jsonify(ok=True, users=users), 200, {"Cache-Control": "no-store"}


@app.post("/unified/users/<user_id>/reset-password")
def unified_user_reset_password(user_id):
    actor = unified_user_admin()
    if not actor:
        return jsonify(ok=False), 403
    if request.headers.get("Origin") != "https://concrefer.concretrack.com.br":
        return jsonify(ok=False), 403
    data = request.get_json(silent=True)
    password = data.get('password') if isinstance(data, dict) else None
    if not isinstance(password, str) or not 6 <= len(password) <= 128:
        return jsonify(ok=False, error='A senha temporária deve ter de 6 a 128 caracteres.'), 400
    if (user_id == actor['id'] or user_id in MASTER_USER_IDS):
        return jsonify(ok=False, error='Não é possível redefinir esta conta nesta lista.'), 409

    try:
        if user_id.startswith('pcp:'):
            if actor['id'] not in MASTER_USER_IDS or not re.fullmatch(r'pcp:[1-9][0-9]*', user_id):
                return jsonify(ok=False), 403
            pcp_id = int(user_id[4:])
            if link_for(pcp_id=pcp_id):
                return jsonify(ok=False, error='Esta conta já está vinculada. Atualize a lista.'), 409
            with pcp_connect() as conn, conn.cursor() as cur:
                cur.execute('''UPDATE public.usuarios SET senha_hash=%s,
                               trocar_senha_primeiro_acesso=true,token_revoked_at=now()
                               WHERE id=%s AND deleted_at IS NULL RETURNING id''',
                            (PCP_HASHER.hash(password), pcp_id))
                if not cur.fetchone():
                    return jsonify(ok=False, error='Conta não encontrada.'), 404
        else:
            with connect() as conn, conn.cursor() as cur:
                cur.execute('''SELECT id,perfil FROM public.usuarios
                               WHERE id=%s AND deleted_at IS NULL''', (user_id,))
                target = cur.fetchone()
            if not target:
                return jsonify(ok=False, error='Conta não encontrada.'), 404
            if target['perfil'] == 'CONVIDADO' and actor['id'] not in MASTER_USER_IDS:
                return jsonify(ok=False), 403
            link = link_for(mapa_login=user_id)
            if link:
                links = component_links(link['id'])
                if any(item['mapa_login'] in MASTER_USER_IDS for item in links):
                    return jsonify(ok=False), 403
                sync_component_password(link['id'], password, first_access=True)
                with pcp_connect() as conn, conn.cursor() as cur:
                    cur.execute('''UPDATE public.usuarios SET token_revoked_at=now()
                                   WHERE id=ANY(%s)''',
                                (list({item['pcp_user_id'] for item in links}),))
            else:
                with connect() as conn, conn.cursor() as cur:
                    cur.execute('''UPDATE public.usuarios SET senha_hash=%s,
                                   primeiro_acesso=true,updated_at=now()
                                   WHERE id=%s AND deleted_at IS NULL RETURNING id''',
                                (hasher.hash(password), user_id))
                    if not cur.fetchone():
                        return jsonify(ok=False, error='Conta não encontrada.'), 404
    except (psycopg.Error, ValueError, KeyError):
        app.logger.exception('Falha ao redefinir senha da conta %s', user_id)
        return jsonify(ok=False, error='Não foi possível redefinir a senha.'), 503
    return jsonify(ok=True, requires_reset=True), 200, {'Cache-Control': 'no-store'}


@app.post("/unified/users/<user_id>/action")
def unified_user_action(user_id):
    actor = unified_user_admin()
    if not actor:
        return jsonify(ok=False), 403
    if user_id in MASTER_USER_IDS:
        return jsonify(ok=False, error='A conta do administrador master não pode ser desativada ou excluída.'), 409
    if request.headers.get("Origin") != "https://concrefer.concretrack.com.br":
        return jsonify(ok=False), 403
    data = request.get_json(silent=True) or {}
    action = data.get("action")
    if action not in {"deactivate", "reactivate", "delete"}:
        return jsonify(ok=False, error="Ação inválida"), 400
    if user_id == actor["id"]:
        return jsonify(ok=False, error="Não é possível alterar a própria conta"), 409
    if action == 'delete':
        confirmed = data.get('confirm_login') == user_id
        if not confirmed and user_id.startswith('unif-pcp-'):
            link = link_for(mapa_login=user_id)
            if link:
                with pcp_connect() as conn, conn.cursor() as cur:
                    cur.execute('SELECT username FROM public.usuarios WHERE id=%s',
                                (link['pcp_user_id'],))
                    counterpart = cur.fetchone()
                confirmed = bool(counterpart and
                                 data.get('confirm_login') == counterpart['username'])
        if not confirmed:
            return jsonify(ok=False, error='Digite o login para confirmar'), 400
    try:
        with connect() as map_conn, pcp_connect() as planning_conn:
            with map_conn.cursor() as cur, planning_conn.cursor() as planning:
                cur.execute("""SELECT id,nome,perfil,ativo,deleted_at FROM public.usuarios
                               WHERE id=%s FOR UPDATE""", (user_id,))
                target = cur.fetchone()
                if not target or target["deleted_at"] is not None:
                    return jsonify(ok=False, error="Conta não encontrada"), 404
                if target['perfil'] == 'CONVIDADO' and actor['id'] not in MASTER_USER_IDS:
                    return jsonify(ok=False), 403
                if action in {"deactivate", "delete"} and target["perfil"] == "GERENCIA" and target["ativo"]:
                    cur.execute("""SELECT count(*) AS total FROM public.usuarios
                                   WHERE perfil='GERENCIA' AND ativo AND deleted_at IS NULL""")
                    if cur.fetchone()["total"] <= 1:
                        return jsonify(ok=False, error="Não é possível remover o último admin"), 409
                if action == "deactivate" and not target["ativo"] or action == "reactivate" and target["ativo"]:
                    return jsonify(ok=False, error="Conta já está neste estado"), 409
                if action in {'deactivate', 'delete'}:
                    cur.execute('''SELECT 1 FROM unificado_auth.ged_identity_links
                                   WHERE mapa_user_id=%s AND active''', (user_id,))
                    if cur.fetchone():
                        return jsonify(ok=False, error='Retire o acesso GED antes de desativar esta conta.'), 409
                cur.execute("""SELECT pcp_user_id FROM unificado_auth.identity_links
                               WHERE mapa_login=%s""", (user_id,))
                link = cur.fetchone()
                if link:
                    planning.execute("""UPDATE public.usuarios SET ativo=%s,
                                    token_revoked_at=CASE WHEN %s THEN now() ELSE token_revoked_at END,
                                    deleted_at=CASE WHEN %s THEN now() ELSE deleted_at END
                                    WHERE id=%s""",
                                     (action == "reactivate", action != "reactivate",
                                      action == "delete", link["pcp_user_id"]))
                cur.execute("""UPDATE public.usuarios SET ativo=%s,updated_at=now(),
                               deleted_at=CASE WHEN %s THEN now() ELSE deleted_at END
                               WHERE id=%s""",
                            (action == "reactivate", action == "delete", user_id))
                cur.execute("""INSERT INTO unificado_auth.user_actions
                               (actor_id,target_id,target_name,action) VALUES (%s,%s,%s,%s)""",
                            (actor["id"], user_id, target["nome"], action))
            planning_conn.commit()
            map_conn.commit()
    except (psycopg.Error, KeyError):
        return jsonify(ok=False, error="Falha ao alterar a conta"), 503
    return jsonify(ok=True, action=action, target=user_id), 200, {"Cache-Control": "no-store"}


def rest_legacy_login():
    """Match the original table-filter login without exposing stored password hashes."""
    password_filter = request.args.get("senha", "")
    user_filter = request.args.get("or", "")
    match = re.fullmatch(r"\(id\.ilike\.([^,]*),nome\.ilike\.([^)]*)\)", user_filter)
    if (not password_filter.startswith("eq.") or not match
            or not password_filter[3:] or len(password_filter) > 1027
            or match.group(1).casefold() != match.group(2).casefold()
            or request.args.get("ativo") != "eq.true"):
        return jsonify(code="PGRST100", message="Invalid login filter"), 400
    name, password = match.group(1), password_filter[3:]
    try:
        with connect() as conn, conn.cursor() as cur:
            cur.execute("""SELECT id,nome,perfil,ativo,setor,primeiro_acesso,
                                 senha_hash,created_at,updated_at
                          FROM public.usuarios
                          WHERE ativo AND (lower(id)=lower(%s) OR lower(nome)=lower(%s))
                          ORDER BY CASE WHEN lower(id)=lower(%s) THEN 0 ELSE 1 END LIMIT 1""",
                        (name, name, name))
            row = cur.fetchone()
    except psycopg.Error:
        return jsonify(code="PGRST000", message="Database temporarily unavailable"), 503
    try:
        valid = bool(row) and hasher.verify(row["senha_hash"], password)
    except (VerifyMismatchError, InvalidHashError):
        valid = False
    if not valid:
        time.sleep(0.25 + secrets.randbelow(100) / 1000)
        return jsonify([])
    try:
        record_mapa_login(row)
    except psycopg.Error:
        app.logger.exception("Falha ao registrar login da operação Mapa")
        return jsonify(code="PGRST000", message="Não foi possível registrar o login no Mapa."), 503
    response = jsonify([rest_user_object(row)])
    token = signer().dumps({
        "scope": "legacy_session" if row["primeiro_acesso"] else "session",
        "id": row["id"], "updated_at": row["updated_at"].isoformat(),
    })
    response.set_cookie(COOKIE_NAME, token, max_age=SESSION_SECONDS, httponly=True,
                        secure=True, samesite="Lax", path=COOKIE_PATH)
    response.delete_cookie(COOKIE_NAME, path=LEGACY_COOKIE_PATH)
    response.set_cookie(TEST_PAGE_COOKIE_NAME, token, max_age=SESSION_SECONDS,
                        httponly=True, secure=True, samesite="Lax",
                        path="/unificado/testar/")
    return response


def rest_users_write_with_unified_mirror(user):
    """Keep a confirmed PCP counterpart in sync with Mapa Users screen writes."""
    body = request.get_json(silent=True)
    record = body[0] if isinstance(body, list) and len(body) == 1 else body
    if request.method == "POST" and isinstance(record, dict):
        target = str(record.get("id") or "")
    else:
        user_filter = request.args.get("id", "")
        target = user_filter[3:] if user_filter.startswith("eq.") else ""
    password = record.get("senha") if isinstance(record, dict) else None
    link = link_for(mapa_login=target) if target else None
    before = None
    if link and password is not None:
        with connect() as conn, conn.cursor() as cur:
            cur.execute("""SELECT senha_hash,primeiro_acesso FROM public.usuarios
                           WHERE id=%s""", (target,))
            before = cur.fetchone()
    response = make_response(rest_users_write(user))
    if response.status_code >= 300 or not link:
        return response
    if request.method == "DELETE":
        with connect() as conn, conn.cursor() as cur:
            cur.execute("DELETE FROM unificado_auth.identity_links WHERE id=%s", (link["id"],))
        return response
    if password is not None:
        try:
            mirror_mapa_password(target, password)
        except (ValueError, psycopg.Error):
            if before:
                with connect() as conn, conn.cursor() as cur:
                    cur.execute("""UPDATE public.usuarios SET senha_hash=%s,
                                   primeiro_acesso=%s,updated_at=now() WHERE id=%s""",
                                (before["senha_hash"], before["primeiro_acesso"], target))
            return jsonify(code="PGRST102", message="Password synchronization failed"), 503
    return response


def rest_users_write(user):
    """Preserve Mapa user CRUD shape while hashing passwords in the auth service."""
    body = request.get_json(silent=True)
    minimal = "return=minimal" in request.headers.get("Prefer", "")
    returning = """RETURNING id,nome,perfil,ativo,setor,primeiro_acesso,created_at,updated_at"""
    try:
        with connect() as conn, conn.cursor() as cur:
            if request.method == "POST":
                records = body if isinstance(body, list) else [body]
                if not records or any(not isinstance(record, dict) for record in records):
                    return jsonify(code="PGRST102", message="Invalid JSON body"), 400
                if len(records) != 1:
                    return jsonify(code="PGRST102", message="One user per request"), 400
                output = []
                for record in records:
                    user_id = str(record.get("id") or "").strip()
                    name = str(record.get("nome") or "").strip()
                    role = str(record.get("perfil") or "").strip().upper()
                    password = record.get("senha")
                    if (not re.fullmatch(r"[A-Za-z0-9_-]{1,100}", user_id)
                            or not name or len(name) > 200
                            or role not in {"GERENCIA", "GESTOR", "MONTADOR", "APONTADOR"}
                            or (password is not None and (not isinstance(password, str) or not 6 <= len(password) <= 128))):
                        return jsonify(code="PGRST102", message="Invalid user fields"), 400
                    active = record.get("ativo", True)
                    first = record.get("primeiro_acesso", True)
                    sector = record.get("setor") or "Todos"
                    if not isinstance(active, bool) or not isinstance(first, bool) or not isinstance(sector, str):
                        return jsonify(code="PGRST102", message="Invalid user fields"), 400
                    cur.execute("SELECT id FROM public.usuarios WHERE id=%s FOR UPDATE", (user_id,))
                    existing = cur.fetchone()
                    if existing:
                        return jsonify(code="PGRST409", message="Login já cadastrado"), 409
                    else:
                        if password is None:
                            return jsonify(code="PGRST102", message="Password required for new user"), 400
                        cur.execute("""INSERT INTO public.usuarios
                            (id,nome,perfil,senha_hash,ativo,setor,primeiro_acesso)
                            VALUES (%s,%s,%s,%s,%s,%s,%s) """ + returning,
                            (user_id, name, role, hasher.hash(password), active, sector, first))
                    output.append(rest_user_object(cur.fetchone()))
                return ("", 201) if minimal else (jsonify(output), 201)
            user_filter = request.args.get("id", "")
            if not user_filter.startswith("eq.") or not user_filter[3:]:
                return jsonify(code="PGRST100", message="id=eq.<user> required"), 400
            user_id = user_filter[3:]
            cur.execute('SELECT perfil FROM public.usuarios WHERE id=%s', (user_id,))
            target_profile = cur.fetchone()
            if target_profile and target_profile['perfil'] == 'CONVIDADO':
                if user['id'] not in MASTER_USER_IDS:
                    return jsonify(code='PGRST403', message='Conta Convidado protegida'), 403
                if isinstance(body, dict) and body.get('perfil', 'CONVIDADO') != 'CONVIDADO':
                    return jsonify(code='PGRST403', message='O tipo Convidado não pode ser alterado'), 403
            if user_id in MASTER_USER_IDS and user['id'] != user_id:
                return jsonify(code='PGRST403', message='A conta do administrador master é protegida'), 403
            if (user_id in MASTER_USER_IDS and isinstance(body, dict) and
                    (body.get('perfil', 'GERENCIA') != 'GERENCIA' or body.get('ativo') is False)):
                return jsonify(code='PGRST409', message='O administrador master deve permanecer ativo como GERENCIA'), 409
            if request.method == "DELETE":
                return jsonify(code="PGRST403", message="Use a ação Excluir com confirmação"), 403
            elif request.method == "PATCH":
                if not isinstance(body, dict):
                    return jsonify(code="PGRST102", message="Invalid JSON body"), 400
                if "ativo" in body:
                    return jsonify(code="PGRST403", message="Use a ação Desativar ou Reativar"), 403
                fields = {}
                for key in ("nome", "perfil", "ativo", "setor", "primeiro_acesso"):
                    if key in body:
                        fields[key] = body[key]
                if ("nome" in fields and (not isinstance(fields["nome"], str) or not fields["nome"].strip())):
                    return jsonify(code="PGRST102", message="Invalid name"), 400
                if ("perfil" in fields and fields["perfil"] not in
                        {"GERENCIA", "GESTOR", "MONTADOR", "APONTADOR"}):
                    return jsonify(code="PGRST102", message="Invalid profile"), 400
                if ("ativo" in fields and not isinstance(fields["ativo"], bool)) or (
                    "primeiro_acesso" in fields and not isinstance(fields["primeiro_acesso"], bool)
                ):
                    return jsonify(code="PGRST102", message="Invalid boolean"), 400
                if "senha" in body:
                    password = body["senha"]
                    if not isinstance(password, str) or not 6 <= len(password) <= 128:
                        return jsonify(code="PGRST102", message="Invalid password"), 400
                    fields["senha_hash"] = hasher.hash(password)
                if not fields:
                    return jsonify(code="PGRST102", message="No updatable fields"), 400
                assignments = sql.SQL(", ").join(
                    sql.SQL("{}=%s").format(sql.Identifier(key)) for key in fields)
                cur.execute(sql.SQL("UPDATE public.usuarios SET {},updated_at=now() WHERE id=%s " + returning)
                            .format(assignments), (*fields.values(), user_id))
            else:
                return jsonify(ok=False), 405
            rows = cur.fetchall()
            output = [rest_user_object(row) for row in rows]
            response = Response("", status=204) if minimal else jsonify(output)
            if (request.method == "PATCH" and user_id == user["id"] and rows
                    and isinstance(body, dict) and "senha" in body
                    and body.get("primeiro_acesso") is False):
                token = signer().dumps({
                    "scope": "session", "id": user_id,
                    "updated_at": rows[0]["updated_at"].isoformat(),
                })
                response.set_cookie(COOKIE_NAME, token, max_age=SESSION_SECONDS,
                                    httponly=True, secure=True, samesite="Lax",
                                    path=COOKIE_PATH)
                response.delete_cookie(COOKIE_NAME, path=LEGACY_COOKIE_PATH)
                response.set_cookie(TEST_PAGE_COOKIE_NAME, token, max_age=SESSION_SECONDS,
                                    httponly=True, secure=True, samesite="Lax",
                                    path="/unificado/testar/")
            return response
    except psycopg.Error:
        return jsonify(code="PGRST102", message="User operation failed"), 400


def photo_proxy(path):
    user = authenticated_user()
    if not user:
        return jsonify(ok=False), 401
    photo_screens = {'inspecao', 'montagem', 'tratativa', 'historico'}
    # Image elements cannot attach X-Unificado-Screen. The opaque photo URL is
    # readable with a valid session and permission for a photo-capable screen.
    image_read = request.method == "GET" and re.fullmatch(r"fotos/[^/]+/arquivo", path)
    if image_read:
        allowed, _ = screen_access_state(user)
        permitted = any(screen_id in allowed and guest_action_allowed(
            user, screen_id, request.method, request.path) for screen_id in photo_screens)
    else:
        permitted = screen_data_allowed(user, photo_screens)
    if not permitted:
        return jsonify(error='Você não tem acesso a esta tela'), 403
    writing = request.method in {"POST", "DELETE"}
    if writing and request.headers.get("Origin") != "https://concrefer.concretrack.com.br":
        return jsonify(ok=False, error="Origem da requisição inválida."), 403
    url = "http://127.0.0.1:13059/api/" + path
    if request.query_string:
        url += "?" + request.query_string.decode("ascii", errors="strict")
    headers = {name: request.headers[name] for name in ("Content-Type", "Accept")
               if name in request.headers}
    outbound = urllib.request.Request(
        url, data=request.get_data() if writing and request.method == "POST" else None,
        headers=headers, method=request.method,
    )
    try:
        upstream = urllib.request.urlopen(outbound, timeout=30)
    except urllib.error.HTTPError as error:
        upstream = error
    except (urllib.error.URLError, TimeoutError):
        return jsonify(error="Serviço de fotos temporariamente indisponível."), 503
    body = upstream.read()
    status = upstream.status
    response_headers = {name: upstream.headers[name] for name in
                        ("Content-Type", "Content-Disposition", "Cache-Control")
                        if name in upstream.headers}
    upstream.close()
    if response_headers.get("Content-Type", "").startswith("application/json") and body:
        try:
            payload = json.loads(body)
            if isinstance(payload, dict) and payload.get("success"):
                records = payload.get("data")
                if isinstance(records, dict):
                    records = [records]
                if isinstance(records, list):
                    for record in records:
                        if isinstance(record, dict) and str(record.get("url", "")).startswith("/api/fotos/"):
                            record["url"] = (
                                "https://concrefer.concretrack.com.br/unificado/mapa"
                                + record["url"]
                            )
                    body = json.dumps(payload, ensure_ascii=False, separators=(",", ":")).encode()
        except (ValueError, UnicodeDecodeError):
            pass
    return Response(body, status=status, headers=response_headers)


@app.route("/inspecoes/<path:poste_id>/fotos", methods=["GET", "POST"])
def inspection_photos(poste_id):
    return photo_proxy("inspecoes/" + urllib.parse.quote(poste_id, safe="") + "/fotos")


@app.route("/fotos/<photo_id>", methods=["DELETE"])
def delete_photo(photo_id):
    return photo_proxy("fotos/" + urllib.parse.quote(photo_id, safe=""))


@app.route("/fotos/<photo_id>/arquivo", methods=["GET"])
def download_photo(photo_id):
    return photo_proxy("fotos/" + urllib.parse.quote(photo_id, safe="") + "/arquivo")


def pcp_bearer_user_id() -> int | None:
    """Read an ID only for compensation; the PCP backend validates the JWT."""
    bearer = request.headers.get("Authorization", "")
    if not bearer.startswith("Bearer "):
        return None
    try:
        encoded = bearer[7:].split(".")[1]
        payload = json.loads(base64.urlsafe_b64decode(encoded + "=" * (-len(encoded) % 4)))
        return int(payload["sub"])
    except (IndexError, ValueError, KeyError, TypeError):
        return None


@app.route("/unified/pcp/usuarios", defaults={"tail": ""},
           methods=["GET", "POST", "PATCH", "DELETE"])
@app.route("/unified/pcp/usuarios/<path:tail>", methods=["GET", "POST", "PATCH", "DELETE"])
def unified_pcp_users(tail):
    """Only test-origin entrypoint for the unchanged PCP Users API."""
    body = request.get_json(silent=True) if request.method in {"POST", "PATCH"} else None
    if request.method == "DELETE" or (request.method == "PATCH" and isinstance(body, dict) and "ativo" in body):
        return jsonify(detail="Use as ações Desativar, Reativar ou Excluir do unificado"), 403
    password = None
    if isinstance(body, dict):
        password = body.get("nova_senha", body.get("senha"))
    if password is not None and (not isinstance(password, str) or not 6 <= len(password) <= 128):
        return jsonify(detail="Senha deve ter ao menos 6 caracteres"), 422
    match = re.fullmatch(r"(\d+)/redefinir-senha", tail)
    target_id = int(match.group(1)) if match else (
        pcp_bearer_user_id() if tail == "trocar-senha-primeiro-acesso" else None)
    old = None
    if target_id and password is not None:
        with pcp_connect() as conn, conn.cursor() as cur:
            cur.execute("""SELECT senha_hash,trocar_senha_primeiro_acesso
                           FROM public.usuarios WHERE id=%s""", (target_id,))
            old = cur.fetchone()
    url = "http://127.0.0.1:13054/api/usuarios" + ("/" + tail if tail else "")
    if request.query_string:
        url += "?" + request.query_string.decode("ascii", errors="strict")
    headers = {name: request.headers[name] for name in ("Authorization", "Content-Type", "Accept")
               if name in request.headers}
    outbound = urllib.request.Request(
        url, method=request.method, headers=headers,
        data=request.get_data() if request.method in {"POST", "PATCH"} else None,
    )
    try:
        upstream = urllib.request.urlopen(outbound, timeout=20)
    except urllib.error.HTTPError as error:
        upstream = error
    except (urllib.error.URLError, TimeoutError):
        return jsonify(detail="Serviço PCP de testes indisponível"), 503
    raw, status = upstream.read(), upstream.status
    content_type = upstream.headers.get("Content-Type", "application/json")
    upstream.close()
    if status < 300 and password is not None:
        if target_id is None:
            try:
                output = json.loads(raw)
                target_id = int(output["id"])
            except (ValueError, KeyError, TypeError):
                target_id = None
        if target_id and link_for(pcp_id=target_id):
            try:
                mirror_pcp_password(target_id, password)
            except (ValueError, psycopg.Error):
                if old:
                    with pcp_connect() as conn, conn.cursor() as cur:
                        cur.execute("""UPDATE public.usuarios SET senha_hash=%s,
                                       trocar_senha_primeiro_acesso=%s WHERE id=%s""",
                                    (old["senha_hash"], old["trocar_senha_primeiro_acesso"], target_id))
                return jsonify(detail="Sincronização de senha indisponível"), 503
    return Response(raw, status=status, content_type=content_type)


@app.get("/pcp/formas-por-setor")
def pcp_formas_por_setor():
    """Read-only current PCP catalog plus existing Mapa maintenance states."""
    bearer = request.headers.get("Authorization", "")
    user_id = pcp_bearer_user_id()
    if not bearer.startswith("Bearer ") or user_id is None:
        return jsonify(detail="Entre no Planejamento para consultar as formas."), 401
    validation = urllib.request.Request(
        "http://127.0.0.1:13054/api/setores",
        headers={"Authorization": bearer}, method="GET",
    )
    try:
        with urllib.request.urlopen(validation, timeout=10) as upstream:
            if upstream.status != 200:
                return jsonify(detail="Sessão do Planejamento inválida."), 401
    except urllib.error.HTTPError as error:
        return jsonify(detail="Sessão do Planejamento inválida."), 401 if error.code in {401, 403} else 503
    except (urllib.error.URLError, TimeoutError):
        return jsonify(detail="Não foi possível conferir a sessão do Planejamento."), 503
    try:
        with pcp_connect() as pcp_conn, pcp_conn.cursor() as cursor:
            cursor.execute("""SELECT ativo,nivel_acesso,trocar_senha_primeiro_acesso
                              FROM public.usuarios WHERE id=%s""", (user_id,))
            user = cursor.fetchone()
            if not user or not user["ativo"] or user["trocar_senha_primeiro_acesso"]:
                return jsonify(detail="Conta do Planejamento indisponível."), 403
            if user["nivel_acesso"] not in {"ADMIN", "PCP"}:
                return jsonify(detail="Seu perfil não permite consultar Formas por Setor."), 403
            with connect() as mapa_conn:
                formas = load_formas_por_setor(pcp_conn, mapa_conn)
    except psycopg.Error:
        app.logger.exception("formas_por_setor_catalog_error")
        return jsonify(detail="Catálogo de formas temporariamente indisponível."), 503
    response = jsonify(formas=formas)
    response.headers["Cache-Control"] = "no-store"
    return response


@app.get("/dashboard/defeitos/indicadores")
def dashboard_defeitos_indicadores():
    """Aggregate existing inspection rows without returning personal or photo data."""
    user = authenticated_user()
    if not user:
        return jsonify(detail="Entre na Produção para consultar os indicadores."), 401
    if not screen_data_allowed(user, {'dashDefeitos'}):
        return jsonify(error='Você não tem acesso a esta tela'), 403
    if user["perfil"] not in {"GERENCIA", "GESTOR", "CONVIDADO"}:
        return jsonify(detail="Seu perfil não permite consultar o Dashboard Defeitos."), 403
    try:
        start = date.fromisoformat(request.args.get("inicio", ""))
        end = date.fromisoformat(request.args.get("fim", ""))
    except ValueError:
        return jsonify(detail="Período inválido."), 400
    if start > end or (end - start).days > 370:
        return jsonify(detail="Período inválido."), 400
    sector = request.args.get("setor", "")
    status = request.args.get("status", "")
    search = request.args.get("busca", "").strip()[:100]
    if sector not in {"", "Setor 1", "Setor 2", "Setor 3", "Setor 4", "Setores 1 e 2"}:
        return jsonify(detail="Setor inválido."), 400
    if status not in {"", "A", "R", "RR"}:
        return jsonify(detail="Situação inválida."), 400
    try:
        with connect() as connection:
            result = load_dashboard_defects_indicators(connection, start, end, sector, status, search)
    except psycopg.Error:
        app.logger.exception("dashboard_defeitos_indicadores_error")
        return jsonify(detail="Indicadores temporariamente indisponíveis."), 503
    response = jsonify(result)
    response.headers["Cache-Control"] = "no-store"
    return response


@app.route("/pcp/<path:resource>", methods=["GET", "POST", "DELETE"])
def pcp_for_mapa(resource):
    """Use only the cloned PCP database for Mapa's existing cross-app calls."""
    user = authenticated_user()
    if not user:
        return jsonify(ok=False), 401
    permitted_screens = {'liberacao','setor1','setor2','setor3','setor4','mandril'}
    if resource == 'saques-mandril' and request.method == 'GET':
        permitted_screens.add('inspecao')
    if not screen_data_allowed(user, permitted_screens):
        return jsonify(error='Você não tem acesso a esta tela'), 403
    allowed = {
        ("GET", "programacao"), ("GET", "saques-mandril"),
        ("POST", "saques-mandril"), ("DELETE", "saques-mandril"),
        ("POST", "saques-mandril/importar"),
    }
    if (request.method, resource) not in allowed:
        return jsonify(ok=False), 405
    writing = request.method != "GET"
    if writing and request.headers.get("Origin") != "https://concrefer.concretrack.com.br":
        return jsonify(ok=False), 403
    url = "http://127.0.0.1:13054/api/" + resource
    if request.query_string:
        url += "?" + request.query_string.decode("ascii", errors="strict")
    headers = {"Accept": request.headers.get("Accept", "application/json")}
    if writing:
        headers["Origin"] = "https://usina.concretrack.com.br"
    if "Content-Type" in request.headers:
        headers["Content-Type"] = request.headers["Content-Type"]
    outbound = urllib.request.Request(
        url, headers=headers, method=request.method,
        data=request.get_data() if request.method == "POST" else None,
    )
    try:
        upstream = urllib.request.urlopen(outbound, timeout=20)
    except urllib.error.HTTPError as error:
        upstream = error
    except (urllib.error.URLError, TimeoutError):
        return jsonify(error="PCP de testes temporariamente indisponível."), 503
    body, status = upstream.read(), upstream.status
    content_type = upstream.headers.get("Content-Type", "application/json")
    upstream.close()
    return Response(body, status=status, content_type=content_type)


@app.get("/usina/massadas")
def usina_massadas_read():
    """Preserve the current read-only Usina source through the test origin."""
    user = authenticated_user()
    if not user:
        return jsonify(ok=False), 401
    if not screen_data_allowed(user, {'liberacao','setor1','setor2','setor3','setor4','mandril'}):
        return jsonify(error='Você não tem acesso a esta tela'), 403
    url = "https://dautomacao.com/api/usina/massadas"
    if request.query_string:
        url += "?" + request.query_string.decode("ascii", errors="strict")
    outbound = urllib.request.Request(url, headers={"Accept": "application/json"})
    try:
        upstream = urllib.request.urlopen(outbound, timeout=15)
    except urllib.error.HTTPError as error:
        upstream = error
    except (urllib.error.URLError, TimeoutError):
        return jsonify(error="Usina temporariamente indisponível."), 503
    body, status = upstream.read(), upstream.status
    content_type = upstream.headers.get("Content-Type", "application/json")
    upstream.close()
    return Response(body, status=status, content_type=content_type)


@app.get("/usina/leituras-qr.csv")
def leituras_qr_csv_read():
    """Read the exact public CSV selected by the original Mapa, without storing it."""
    user = authenticated_user()
    if not user:
        return jsonify(ok=False), 401
    if not screen_data_allowed(user, {'liberacao','setor1','setor2','setor3','setor4','mandril'}):
        return jsonify(error='Você não tem acesso a esta tela'), 403
    url = ("https://docs.google.com/spreadsheets/d/"
           "1CdQhQ0AJ4mWJqAgnP371ez4r-P7ESX5KuTHI96nI0g8/export?format=csv&gid=0")
    try:
        upstream = urllib.request.urlopen(urllib.request.Request(url), timeout=20)
    except urllib.error.HTTPError as error:
        upstream = error
    except (urllib.error.URLError, TimeoutError):
        return jsonify(error="Leituras QR temporariamente indisponíveis."), 503
    body, status = upstream.read(), upstream.status
    content_type = upstream.headers.get("Content-Type", "text/csv; charset=utf-8")
    upstream.close()
    return Response(body, status=status, content_type=content_type,
                    headers={"Cache-Control": "no-store"})


@app.route("/rest/v1/rpc/rpc_dashboard_produtividade_resumo_v1", methods=["GET", "POST"])
def produtividade_rpc_read():
    """Forward the original read-only dashboard RPC with the Mapa session."""
    user = authenticated_user()
    if not user:
        return jsonify(ok=False), 401
    if request.headers.get('X-Unificado-Screen'):
        if not screen_data_allowed(user, {'produtividade','dashMontagem','liberacao','setor1','setor2','setor3','setor4'}):
            return jsonify(error='Você não tem acesso a esta tela'), 403
    elif user['perfil'] == 'CONVIDADO' or not any(
            SCREENS_BY_ID[item]['module'] == 'producao' for item in screen_access_state(user)[0]):
        return jsonify(error='Você não tem acesso a esta tela'), 403
    url = "http://127.0.0.1:13051/rpc/rpc_dashboard_produtividade_resumo_v1"
    if request.query_string:
        url += "?" + request.query_string.decode("ascii", errors="strict")
    headers = {name: request.headers[name] for name in ("Accept", "Prefer", "Content-Type")
               if name in request.headers}
    outbound = urllib.request.Request(
        url, data=request.get_data() if request.method == "POST" else None,
        headers=headers, method=request.method,
    )
    try:
        upstream = urllib.request.urlopen(outbound, timeout=15)
    except urllib.error.HTTPError as error:
        upstream = error
    except (urllib.error.URLError, TimeoutError):
        return jsonify(ok=False, error="Banco temporariamente indisponível."), 503
    response_headers = {name: upstream.headers[name] for name in ("Content-Type", "Content-Range", "Range-Unit")
                        if name in upstream.headers}
    body = upstream.read()
    status = upstream.status
    upstream.close()
    return Response(body, status=status, headers=response_headers)


def clean_text(value, label, *, required=False, max_length=200):
    if value is None and not required:
        return None
    if not isinstance(value, str):
        raise ValueError(f"{label} inválido.")
    value = value.strip()
    if required and not value:
        raise ValueError(f"Informe {label}.")
    if len(value) > max_length:
        raise ValueError(f"{label} excede {max_length} caracteres.")
    return value or None


@app.post("/operations/forms")
def operate_form():
    user = authenticated_user()
    if not user:
        return jsonify(ok=False), 401
    return jsonify(ok=False, error="Fluxo em adaptação para preservar o apontamento por toque do Mapa atual."), 410
    if request.headers.get("Origin") != "https://concrefer.concretrack.com.br":
        return jsonify(ok=False, error="Origem da requisição inválida."), 403
    if not request.is_json or not isinstance(request.get_json(silent=True), dict):
        return jsonify(ok=False, error="Envie um objeto JSON."), 400
    if user["perfil"] not in {"GERENCIA", "GESTOR", "APONTADOR"}:
        return jsonify(ok=False), 403
    body = request.get_json()
    phase = body.get("phase")
    if phase not in OPERATION_TABLES:
        return jsonify(ok=False, error="Etapa inválida."), 400
    try:
        date_string = clean_text(body.get("data_fabricacao"), "a data", required=True, max_length=10)
        if not re.fullmatch(r"\d{4}-\d{2}-\d{2}", date_string):
            raise ValueError("Data inválida.")
        production_date = date.fromisoformat(date_string)
        sector = clean_text(body.get("setor"), "o setor", required=True, max_length=20)
        if sector not in SECTORS:
            raise ValueError("Setor inválido.")
        if user["perfil"] == "APONTADOR" and user["setor"] != sector:
            return jsonify(ok=False, error="Seu perfil não permite operar neste setor."), 403
        form = clean_text(body.get("forma"), "a forma", required=True, max_length=100).upper()
        model = clean_text(body.get("modelo"), "o modelo", max_length=200)
        code = clean_text(body.get("codigo_poste"), "o código do poste", max_length=100)
        description = clean_text(body.get("descricao_poste"), "a descrição", max_length=300)
        product_code = clean_text(body.get("codigo_produto"), "o código do produto", max_length=100)
        now = datetime.now(timezone.utc)
        values = {
            "modelo": model, "codigo_poste": code, "descricao_poste": description,
            "codigo_produto": product_code, "data_hora": now,
        }
        if phase == "programada":
            quantity = body.get("quantidade", 1)
            if isinstance(quantity, bool) or not isinstance(quantity, int) or not 1 <= quantity <= 100:
                raise ValueError("Quantidade deve ser de 1 a 100.")
            values["quantidade"] = quantity
        elif phase == "liberada":
            values = {"colaborador": user["nome"], "data_hora": now}
        else:
            concrete_type = clean_text(body.get("tipo_concreto"), "o tipo de concreto", required=True, max_length=100)
            vibrated = body.get("vibrado")
            if vibrated is not None and not isinstance(vibrated, bool):
                raise ValueError("Vibrado deve ser sim ou não.")
            values.update({
                "tipo_concreto": concrete_type, "vibrado": vibrated,
                "colaborador": user["nome"], "status": "LIBERADO",
            })
    except ValueError as error:
        return jsonify(ok=False, error=str(error)), 400

    table = OPERATION_TABLES[phase]
    identity = f"{table}|{production_date}|{sector}|{form}"
    try:
        with writer_connect() as conn, conn.cursor() as cur:
            cur.execute("SELECT pg_advisory_xact_lock(hashtextextended(%s, 0))", (identity,))
            where_status = sql.SQL(" AND status = 'LIBERADO'") if phase == "concretada" else sql.SQL("")
            cur.execute(
                sql.SQL("SELECT id FROM public.{} WHERE data_fabricacao = %s AND setor = %s AND forma = %s{} LIMIT 2 FOR UPDATE").format(
                    sql.Identifier(table), where_status,
                ),
                (production_date, sector, form),
            )
            existing = cur.fetchall()
            if len(existing) > 1:
                return jsonify(ok=False, error="Há registros duplicados para esta forma; solicite conferência."), 409
            if existing:
                assignments = sql.SQL(", ").join(
                    sql.SQL("{} = %s").format(sql.Identifier(key)) for key in values
                )
                cur.execute(
                    sql.SQL("UPDATE public.{} SET {} WHERE id = %s RETURNING id").format(
                        sql.Identifier(table), assignments,
                    ),
                    (*values.values(), existing[0]["id"]),
                )
                result = "updated"
            else:
                fields = {"data_fabricacao": production_date, "setor": sector, "forma": form, **values}
                cur.execute(
                    sql.SQL("INSERT INTO public.{} ({}) VALUES ({}) RETURNING id").format(
                        sql.Identifier(table),
                        sql.SQL(", ").join(map(sql.Identifier, fields)),
                        sql.SQL(", ").join(sql.Placeholder() for _ in fields),
                    ),
                    tuple(fields.values()),
                )
                result = "created"
            record_id = str(cur.fetchone()["id"])
            cur.execute(
                """INSERT INTO public.mapa_operation_audit
                   (actor_id, actor_role, phase, result, record_id, data_fabricacao, setor, forma)
                   VALUES (%s, %s, %s, %s, %s, %s, %s, %s)""",
                (user["id"], user["perfil"], phase, result, record_id, production_date, sector, form),
            )
    except psycopg.Error:
        return jsonify(ok=False, error="Não foi possível salvar no banco de testes."), 503
    return jsonify(ok=True, id=record_id, phase=phase, result=result, test_environment=True)


def validate_checklist(kind, answers, status):
    if not isinstance(answers, dict):
        raise ValueError("Checklist inválido.")
    sections = CHECKLISTS[kind]
    expected_sections = {section["id"] for section in sections}
    if set(answers) != expected_sections:
        raise ValueError("O checklist deve conter todas as seções.")
    has_failure = False
    critical_failure = False
    complete = True
    for section in sections:
        section_answers = answers.get(section["id"])
        if not isinstance(section_answers, dict):
            raise ValueError("Seção do checklist inválida.")
        expected_items = {item["id"] for item in section["items"]}
        if not set(section_answers).issubset(expected_items):
            raise ValueError("O checklist contém itens desconhecidos.")
        for item in section["items"]:
            value = section_answers.get(item["id"])
            if value is None:
                complete = False
                continue
            if not isinstance(value, str) or value not in {"sim", "nao"}:
                raise ValueError("Responda cada item com sim ou não.")
            if value == "nao":
                has_failure = True
                if item["critical"]:
                    critical_failure = True
    if status == "A" and (not complete or critical_failure):
        raise ValueError("Aprovação exige checklist completo e nenhum item crítico reprovado.")
    if status == "R" and (not has_failure or (not complete and not critical_failure)):
        raise ValueError("Reprovação exige falha registrada; finalize os demais itens se não houver falha crítica.")
    return answers


@app.post("/operations/montagem")
def operate_montagem():
    user = authenticated_user()
    if not user:
        return jsonify(ok=False), 401
    return jsonify(ok=False, error="Fluxo em adaptação para preservar o checklist e retrabalho do Mapa atual."), 410
    if request.headers.get("Origin") != "https://concrefer.concretrack.com.br":
        return jsonify(ok=False, error="Origem da requisição inválida."), 403
    body = request.get_json(silent=True) if request.is_json else None
    if not isinstance(body, dict):
        return jsonify(ok=False, error="Envie um objeto JSON."), 400
    kind = body.get("kind")
    action = body.get("action")
    if not isinstance(kind, str) or not isinstance(action, str) or kind not in {"INSPECAO", "MONTAGEM"} or action not in {"start", "finish"}:
        return jsonify(ok=False, error="Operação inválida."), 400
    allowed = {"GERENCIA", "MONTADOR"} if kind == "INSPECAO" else {"GERENCIA", "GESTOR", "MONTADOR"}
    if user["perfil"] not in allowed:
        return jsonify(ok=False), 403
    try:
        record_id = str(uuid.UUID(clean_text(body.get("record_id"), "o registro de produção", required=True, max_length=36)))
        status = None
        if action == "finish":
            status = body.get("status")
            if not isinstance(status, str) or status not in {"A", "R"}:
                raise ValueError("Selecione aprovado ou reprovado.")
            reason = clean_text(body.get("motivo_recusa"), "o motivo da reprovação", max_length=300)
            if status == "R" and not reason:
                raise ValueError("Informe o motivo da reprovação.")
            if status == "A" and reason:
                raise ValueError("Aprovação não deve ter motivo de reprovação.")
            notes = clean_text(body.get("observacoes_montagem"), "as observações", max_length=2000)
            answers = validate_checklist(kind, body.get("checklists"), status)
    except ValueError as error:
        return jsonify(ok=False, error=str(error)), 400

    try:
        with writer_connect() as conn, conn.cursor() as cur:
            cur.execute(
                """SELECT id, data_fabricacao, setor, forma, modelo, status
                   FROM public.producao WHERE id = %s FOR SHARE""",
                (record_id,),
            )
            production = cur.fetchone()
            if not production or production["status"] not in {"LIBERADO", "INSPECIONADO"}:
                return jsonify(ok=False, error="Registro de produção não encontrado ou indisponível."), 404
            sector = production["setor"]
            if user["perfil"] == "MONTADOR" and user["setor"] not in {None, "Todos", sector}:
                return jsonify(ok=False, error="Seu perfil não permite operar neste setor."), 403
            production_date = production["data_fabricacao"]
            form = production["forma"]
            if not production_date or not form:
                return jsonify(ok=False, error="Registro de produção incompleto."), 409
            key = f"{record_id}||{production_date}||{sector}||{form}"
            if kind == "INSPECAO":
                key += "||INSPECAO"
            cur.execute("SELECT id, finalizado_em, inicio_inspecao_montagem FROM public.montagem_poste WHERE id = %s FOR UPDATE", (key,))
            existing = cur.fetchone()
            if existing and existing["finalizado_em"]:
                return jsonify(ok=False, error="Este registro já foi finalizado na base de testes."), 409
            if action == "start":
                if existing:
                    return jsonify(ok=True, id=key, result="already_started", test_environment=True)
                cur.execute(
                    """INSERT INTO public.montagem_poste
                       (id, record_id, data_fabricacao, setor, forma_numero, modelo,
                        etapa, inicio_inspecao_montagem, checklists, banco, montador_nome)
                       VALUES (%s, %s, %s, %s, %s, %s, %s, now(), '{}'::jsonb, 'montagem_poste', %s)""",
                    (key, record_id, production_date, sector, form, production["modelo"],
                     "INSPECAO" if kind == "INSPECAO" else "INICIO", user["nome"]),
                )
                result = "started"
            else:
                if not existing:
                    return jsonify(ok=False, error="Inicie o checklist antes de finalizar."), 409
                local_time = datetime.now(ZoneInfo("America/Sao_Paulo"))
                answers = {**answers, "dia_inspecao": local_time.strftime("%d/%m/%Y"),
                           "horario_dispositivo": local_time.strftime("%H:%M:%S")}
                cur.execute(
                    """UPDATE public.montagem_poste
                       SET status_montagem = %s, motivo_recusa = %s, etapa = %s,
                           finalizado_em = now(), checklists = %s, observacoes_montagem = %s,
                           montador_nome = %s, updated_at = now()
                       WHERE id = %s""",
                    (status, reason, "INSPECAO" if kind == "INSPECAO" else "FINALIZACAO",
                     Jsonb(answers), notes, user["nome"], key),
                )
                result = "finished"
            cur.execute(
                """INSERT INTO public.mapa_operation_audit
                   (actor_id, actor_role, phase, result, record_id, data_fabricacao, setor, forma)
                   VALUES (%s, %s, %s, %s, %s, %s, %s, %s)""",
                (user["id"], user["perfil"], kind.lower(), result, key, production_date, sector, form),
            )
    except psycopg.Error:
        return jsonify(ok=False, error="Não foi possível salvar no banco de testes."), 503
    return jsonify(ok=True, id=key, result=result, test_environment=True)


@app.post("/logout")
def logout():
    response = jsonify(ok=True)
    response.delete_cookie(COOKIE_NAME, path=COOKIE_PATH)
    response.delete_cookie(COOKIE_NAME, path=LEGACY_COOKIE_PATH)
    response.delete_cookie(TEST_PAGE_COOKIE_NAME, path="/unificado/testar/")
    response.delete_cookie(PCP_SCREEN_COOKIE_NAME, path="/unificado/pcp/")
    response.delete_cookie(PCP_REFRESH_COOKIE_NAME, path=PCP_REFRESH_PATH)
    response.delete_cookie(LAB_COOKIE_NAME, path="/unificado/laboratorio/")
    response.delete_cookie(SUPRIMENTOS_COOKIE_NAME, path="/api/suprimentos/")
    response.delete_cookie(SUPRIMENTOS_COOKIE_NAME, path="/unificado/suprimentos/")
    response.delete_cookie(SUPRIMENTOS_REFRESH_COOKIE_NAME, path="/unificado/suprimentos/")
    return response


# Suprimentos: extensão isolada do gateway. O papel efetivo fica no banco do serviço.
SUPRIMENTOS_COOKIE_NAME = 'unificado_suprimentos_session'
SUPRIMENTOS_REFRESH_COOKIE_NAME = 'unificado_suprimentos_refresh'
SUPRIMENTOS_REFRESH_SECONDS = 30 * 24 * 60 * 60


def supply_flags():
    url = os.environ.get('SUPRIMENTOS_INTERNAL_URL', 'http://127.0.0.1:13067').rstrip('/')
    try:
        with urllib.request.urlopen(url + '/api/suprimentos/flags?unidade=campinas', timeout=0.25) as upstream:
            data = json.load(upstream)
        return {key: bool(value) for key, value in data.get('flags', {}).items()}
    except (OSError, ValueError, TypeError, urllib.error.URLError):
        return {}  # sem serviço/flag: menu oculto e autorização fechada


def supply_session_claim(user, scope='session'):
    return {'scope': scope, 'id': user['id'], 'updated_at': user['updated_at'].isoformat()}


def supply_set_cookies(response, user):
    token = signer().dumps(supply_session_claim(user))
    for path in ('/api/suprimentos/', '/unificado/suprimentos/'):
        response.set_cookie(SUPRIMENTOS_COOKIE_NAME, token, max_age=SESSION_SECONDS,
                            httponly=True, secure=True, samesite='Lax', path=path)
    refresh = signer().dumps(supply_session_claim(user, scope='suprimentos_refresh'))
    response.set_cookie(SUPRIMENTOS_REFRESH_COOKIE_NAME, refresh,
                        max_age=SUPRIMENTOS_REFRESH_SECONDS, httponly=True,
                        secure=True, samesite='Lax', path='/unificado/suprimentos/')
    response.headers['Cache-Control'] = 'no-store'
    return response


def supply_cookie_user(cookie_name, max_age, scope):
    token = request.cookies.get(cookie_name)
    if not token:
        return None
    try:
        claim = signer().loads(token, max_age=max_age)
        if claim.get('scope') != scope:
            return None
        with connect() as conn, conn.cursor() as cur:
            cur.execute('''SELECT id,nome,perfil,ativo,primeiro_acesso,updated_at
                           FROM public.usuarios WHERE id=%s AND deleted_at IS NULL''', (claim['id'],))
            user = cur.fetchone()
        if (not user or not user['ativo'] or user['primeiro_acesso']
                or user['updated_at'].isoformat() != claim.get('updated_at')):
            return None
        return user
    except (BadSignature, SignatureExpired, KeyError, TypeError, psycopg.Error):
        return None


def supply_allowed(user):
    screens, _ = screen_access_state(user)
    return any(SCREENS_BY_ID[item]['module'] == 'suprimentos' for item in screens)


@app.post('/unified/suprimentos-bootstrap')
def suprimentos_bootstrap():
    user = authenticated_user()
    if not user:
        return jsonify(ok=False, error='Sessão expirada.'), 401
    if not supply_allowed(user):
        return jsonify(ok=False, error='Suprimentos indisponível ou sem concessão.'), 403
    return supply_set_cookies(jsonify(ok=True, unidade='campinas'), user)


@app.get('/unified/suprimentos-renew')
def suprimentos_renew():
    """Nginx expõe esta rota apenas dentro do escopo do PWA de Suprimentos."""
    user = authenticated_user() or supply_cookie_user(
        SUPRIMENTOS_REFRESH_COOKIE_NAME, SUPRIMENTOS_REFRESH_SECONDS, 'suprimentos_refresh')
    if not user:
        return jsonify(ok=False, error='Sessão expirada. Entre novamente.'), 401
    if not supply_allowed(user):
        return jsonify(ok=False, error='Suprimentos indisponível ou sem concessão.'), 403
    response = supply_set_cookies(jsonify(ok=True, unidade='campinas'), user)
    scope, age = session_scope_and_age(user)
    response.set_cookie(COOKIE_NAME, signer().dumps(supply_session_claim(user, scope)),
                        max_age=age, httponly=True, secure=True, samesite='Lax', path=COOKIE_PATH)
    return response


@app.get('/unified/suprimentos-authorize')
def suprimentos_authorize():
    original = urllib.parse.urlsplit(request.headers.get('X-Original-URI', '')).path
    if not (original.startswith('/api/suprimentos/') or original.startswith('/unificado/suprimentos/')):
        return Response(status=403)
    user = supply_cookie_user(SUPRIMENTOS_COOKIE_NAME, SESSION_SECONDS, 'session')
    if not user and original.startswith('/unificado/suprimentos/'):
        # A primeira abertura ainda não tem cookie próprio; a shell recebe
        # somente os arquivos estáticos após conferir a sessão principal.
        user = authenticated_user() or supply_cookie_user(
            SUPRIMENTOS_REFRESH_COOKIE_NAME, SUPRIMENTOS_REFRESH_SECONDS, 'suprimentos_refresh')
    if not user:
        return Response(status=401)
    if not supply_allowed(user):
        return Response(status=403)
    secret = os.environ.get('SUPRIMENTOS_GATEWAY_SIGNING_KEY', '')
    if len(secret) < 32:
        return Response(status=503)
    payload = base64.urlsafe_b64encode(json.dumps({
        'iss':'unificado', 'aud':'suprimentos', 'id':user['id'], 'name':user['nome'],
        'exp':int(time.time()) + 20,
    }, separators=(',', ':')).encode()).rstrip(b'=').decode()
    signature = base64.urlsafe_b64encode(hmac.new(secret.encode(), payload.encode(), hashlib.sha256).digest()).rstrip(b'=').decode()
    response = Response(status=204)
    response.headers['X-Suprimentos-Assertion'] = payload + '.' + signature
    response.headers['Cache-Control'] = 'no-store'
    return response


from usina_integration import register as register_usina_integration
register_usina_integration(app)

from usinas_receitas import register as register_usinas_receitas
register_usinas_receitas(app, connect, authenticated_user, screen_access_state)
from usinas_legacy_read import register as register_usinas_legacy_read
register_usinas_legacy_read(app, authenticated_user, screen_access_state)
from usinas_reporting import register as register_usinas_reporting
register_usinas_reporting(app, connect, authenticated_user, screen_access_state)
from usinas_carta_traco import register as register_usinas_carta_traco
register_usinas_carta_traco(app, authenticated_user, screen_access_state)
from usinas_cec import register as register_usinas_cec
register_usinas_cec(app, authenticated_user, screen_access_state)


if __name__ == "__main__":
    app.run(host="127.0.0.1", port=13052)

"""Autenticacao isolada do Mapa sobre a copia PostgreSQL de testes."""

from __future__ import annotations

from datetime import date, datetime, timezone
import base64
import hashlib
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
from unified_auth import (adopt_mapa_password, check_link_password, component_links,
                          link_for, linked_users,
                          mapa_user_by_login, mark_existing_shared_password,
                          mirror_mapa_password, mirror_pcp_password,
                          PCP_HASHER, pcp_connect, pcp_user_by_login,
                          set_unified_password, verify_map,
                          verify_pcp)


app = Flask(__name__)
validation_logger = logging.getLogger("unificado.validation")
hasher = PasswordHasher()
COOKIE_NAME = "mapa_unificado_session"
TEST_PAGE_COOKIE_NAME = "unificado_test_session"
SESSION_SECONDS = 36 * 60 * 60
READ_TABLES = frozenset({
    "usuarios", "programacao_pcp", "liberacao_formas", "producao",
    "montagem_poste", "formas_manutencao", "prog_s3_s4", "vw_formas_status",
})
WRITE_TABLES = frozenset({
    "programacao_pcp", "liberacao_formas", "producao",
    "montagem_poste", "formas_manutencao", "prog_s3_s4",
})
OPERATION_TABLES = {
    "programada": "programacao_pcp",
    "liberada": "liberacao_formas",
    "concretada": "producao",
}
SECTORS = frozenset({"Setor 1", "Setor 2", "Setor 3", "Setor 4"})
CHECKLISTS = json.loads((Path(__file__).parent / "checklists.json").read_text(encoding="utf-8"))


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


def session_response(row):
    response = jsonify(ok=True, user=public_user(row))
    token = signer().dumps({
        "scope": "session", "id": row["id"],
        "updated_at": row["updated_at"].isoformat(),
    })
    response.set_cookie(
        COOKIE_NAME, token, max_age=SESSION_SECONDS, httponly=True,
        secure=True, samesite="Lax", path="/unificado/mapa/api",
    )
    response.set_cookie(
        TEST_PAGE_COOKIE_NAME, token, max_age=SESSION_SECONDS, httponly=True,
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
            '<title>Entrar no ambiente de testes</title><body>'
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


def unified_login_response(pcp, mapa, password):
    payload = {"ok": True, "modules": []}
    if pcp and pcp["ativo"]:
        try:
            token_data = pcp_token_for(pcp["username"], password)
            payload["pcp"] = token_data
            payload["modules"].append("pcp")
        except (urllib.error.URLError, TimeoutError, ValueError):
            payload["pcp_unavailable"] = True
    if mapa and mapa["ativo"]:
        payload["mapa"] = public_user(mapa)
        payload["modules"].append("mapa")
    if not payload["modules"]:
        return jsonify(ok=False, error="Módulo temporariamente indisponível."), 503
    response = jsonify(payload)
    if mapa and mapa["ativo"]:
        token = signer().dumps({"scope": "session", "id": mapa["id"],
                                "updated_at": mapa["updated_at"].isoformat()})
        response.set_cookie(COOKIE_NAME, token, max_age=SESSION_SECONDS,
                            httponly=True, secure=True, samesite="Lax",
                            path="/unificado/mapa/api")
        response.set_cookie(TEST_PAGE_COOKIE_NAME, token, max_age=SESSION_SECONDS,
                            httponly=True, secure=True, samesite="Lax",
                            path="/unificado/testar/")
    elif pcp and pcp["ativo"]:
        response.delete_cookie(COOKIE_NAME, path="/unificado/mapa/api")
        token = signer().dumps({"scope": "pcp_test_session", "id": pcp["id"]})
        response.set_cookie(TEST_PAGE_COOKIE_NAME, token, max_age=SESSION_SECONDS,
                            httponly=True, secure=True, samesite="Lax",
                            path="/unificado/testar/")
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
                adopt_mapa_password(link["id"], password)
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
    except (ValueError, psycopg.Error, urllib.error.URLError, TimeoutError):
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
    return session_response(row)


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
        session = signer().loads(token, max_age=SESSION_SECONDS)
        if (not isinstance(session, dict) or session.get("scope") not in {"session", "legacy_session"}
                or not isinstance(session.get("id"), str)):
            return None
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
    first_access_password_change = (
        resource == "usuarios" and request.method == "PATCH"
        and user["primeiro_acesso"] and request.args.get("id") == "eq." + user["id"]
        and isinstance(request.get_json(silent=True), dict)
        and set(request.get_json(silent=True)) <= {"senha", "primeiro_acesso", "updated_at"}
        and request.get_json(silent=True).get("primeiro_acesso") is False
    )
    if resource == "usuarios" and user["perfil"] != "GERENCIA" and not first_access_password_change:
        return jsonify(ok=False), 403
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
    response = jsonify([rest_user_object(row)])
    token = signer().dumps({
        "scope": "legacy_session" if row["primeiro_acesso"] else "session",
        "id": row["id"], "updated_at": row["updated_at"].isoformat(),
    })
    response.set_cookie(COOKIE_NAME, token, max_age=SESSION_SECONDS, httponly=True,
                        secure=True, samesite="Lax", path="/unificado/mapa/api")
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
                        fields = {"nome": name, "perfil": role, "ativo": active,
                                  "setor": sector, "primeiro_acesso": first}
                        if password is not None:
                            fields["senha_hash"] = hasher.hash(password)
                        assignments = sql.SQL(", ").join(
                            sql.SQL("{}=%s").format(sql.Identifier(key)) for key in fields)
                        cur.execute(sql.SQL("UPDATE public.usuarios SET {},updated_at=now() WHERE id=%s " + returning)
                                    .format(assignments), (*fields.values(), user_id))
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
            if request.method == "DELETE":
                cur.execute("DELETE FROM public.usuarios WHERE id=%s " + returning, (user_id,))
            elif request.method == "PATCH":
                if not isinstance(body, dict):
                    return jsonify(code="PGRST102", message="Invalid JSON body"), 400
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
                                    path="/unificado/mapa/api")
                response.set_cookie(TEST_PAGE_COOKIE_NAME, token, max_age=SESSION_SECONDS,
                                    httponly=True, secure=True, samesite="Lax",
                                    path="/unificado/testar/")
            return response
    except psycopg.Error:
        return jsonify(code="PGRST102", message="User operation failed"), 400


def photo_proxy(path):
    if not authenticated_user():
        return jsonify(ok=False), 401
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


@app.route("/pcp/<path:resource>", methods=["GET", "POST", "DELETE"])
def pcp_for_mapa(resource):
    """Use only the cloned PCP database for Mapa's existing cross-app calls."""
    if not authenticated_user():
        return jsonify(ok=False), 401
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
    if not authenticated_user():
        return jsonify(ok=False), 401
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
    if not authenticated_user():
        return jsonify(ok=False), 401
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
    if not authenticated_user():
        return jsonify(ok=False), 401
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
    response.delete_cookie(COOKIE_NAME, path="/unificado/mapa/api")
    response.delete_cookie(TEST_PAGE_COOKIE_NAME, path="/unificado/testar/")
    return response


if __name__ == "__main__":
    app.run(host="127.0.0.1", port=13052)

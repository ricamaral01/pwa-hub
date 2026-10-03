"""Autenticacao isolada do Mapa sobre a copia PostgreSQL de testes."""

from __future__ import annotations

from datetime import date, datetime, timezone
import json
import os
from pathlib import Path
import re
import secrets
import time
import urllib.error
import urllib.request
import uuid
from zoneinfo import ZoneInfo

from argon2 import PasswordHasher
from argon2.exceptions import InvalidHashError, VerifyMismatchError
from flask import Flask, Response, jsonify, request
from itsdangerous import BadSignature, SignatureExpired, URLSafeTimedSerializer
import psycopg
from psycopg import sql
from psycopg.rows import dict_row
from psycopg.types.json import Jsonb


app = Flask(__name__)
hasher = PasswordHasher()
COOKIE_NAME = "mapa_unificado_session"
SESSION_SECONDS = 12 * 60 * 60
READ_TABLES = frozenset({
    "usuarios", "programacao_pcp", "liberacao_formas", "producao",
    "montagem_poste", "formas_manutencao", "prog_s3_s4", "vw_formas_status",
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
        secure=True, samesite="Strict", path="/unificado/mapa/api",
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
    if not isinstance(token, str) or not isinstance(password, str) or not 10 <= len(password) <= 128:
        return jsonify(ok=False, error="Use uma senha nova de 10 a 128 caracteres."), 400
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
    token = request.cookies.get(COOKIE_NAME)
    if not token:
        return None
    try:
        session = signer().loads(token, max_age=SESSION_SECONDS)
        if not isinstance(session, dict) or session.get("scope") != "session" or not isinstance(session.get("id"), str):
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
    if not row or row["primeiro_acesso"] or row["updated_at"].isoformat() != session.get("updated_at"):
        return None
    return row


@app.get("/me")
def me():
    row = authenticated_user()
    if not row:
        return jsonify(ok=False), 401
    return jsonify(ok=True, user=public_user(row))


@app.route("/rest/v1/<resource>", methods=["GET", "HEAD"])
def rest_read(resource):
    user = authenticated_user()
    if not user:
        return jsonify(ok=False), 401
    if resource not in READ_TABLES:
        return jsonify(ok=False), 404
    if resource == "usuarios" and user["perfil"] != "GERENCIA":
        return jsonify(ok=False), 403
    url = f"http://127.0.0.1:13051/{resource}"
    if request.query_string:
        url += "?" + request.query_string.decode("ascii", errors="strict")
    headers = {name: request.headers[name] for name in ("Accept", "Range", "Prefer")
               if name in request.headers}
    outbound = urllib.request.Request(url, headers=headers, method=request.method)
    try:
        upstream = urllib.request.urlopen(outbound, timeout=15)
    except urllib.error.HTTPError as error:
        upstream = error
    except (urllib.error.URLError, TimeoutError):
        return jsonify(ok=False, error="Banco temporariamente indisponível."), 503
    response_headers = {}
    for name in ("Content-Type", "Content-Range", "Range-Unit"):
        if name in upstream.headers:
            response_headers[name] = upstream.headers[name]
    body = upstream.read()
    status = upstream.status
    upstream.close()
    return Response(body, status=status, headers=response_headers)


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
    return response


if __name__ == "__main__":
    app.run(host="127.0.0.1", port=13052)

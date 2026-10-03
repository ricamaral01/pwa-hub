"""Testa as três operações na VPS e remove todos os registros sintéticos."""

from __future__ import annotations

from datetime import date
import json
import os
import secrets
import urllib.error
import urllib.request

from argon2 import PasswordHasher
import psycopg


BASE = os.environ.get(
    "MAPA_TEST_BASE_URL",
    "https://concrefer.concretrack.com.br/unificado/mapa/api",
).rstrip("/")
ORIGIN = "https://concrefer.concretrack.com.br"
DB = "dbname=mapa_unificado_teste user=postgres"
TABLES = ("programacao_pcp", "liberacao_formas", "producao")


def post(path: str, payload: dict, cookie: str = "", *, origin: bool = True):
    headers = {"Content-Type": "application/json"}
    if cookie:
        headers["Cookie"] = cookie.split(";", 1)[0]
    if origin:
        headers["Origin"] = ORIGIN
    request = urllib.request.Request(
        BASE + path, data=json.dumps(payload).encode(), headers=headers,
    )
    try:
        with urllib.request.urlopen(request, timeout=10) as response:
            return response.status, json.load(response), response.headers.get("Set-Cookie", "")
    except urllib.error.HTTPError as error:
        return error.code, json.load(error), ""


def main() -> None:
    suffix = secrets.token_hex(8)
    user_id = f"__migration_write_test_{suffix}"
    form = f"TESTE-MIG-{suffix.upper()}"
    password = secrets.token_urlsafe(24)
    today = date.today().isoformat()
    with psycopg.connect(DB) as conn, conn.cursor() as cur:
        before = {}
        for table in (*TABLES, "mapa_operation_audit", "usuarios"):
            cur.execute(f"SELECT count(*) FROM public.{table}")
            before[table] = cur.fetchone()[0]
        cur.execute(
            """INSERT INTO public.usuarios
               (id, nome, perfil, senha_hash, ativo, setor, primeiro_acesso)
               VALUES (%s, %s, 'APONTADOR', %s, true, 'Setor 1', false)""",
            (user_id, user_id, PasswordHasher().hash(password)),
        )
    try:
        status, login, cookie = post("/login", {"name": user_id, "password": password})
        assert status == 200 and login["ok"] and cookie
        common = {"data_fabricacao": today, "setor": "Setor 1", "forma": form}
        forbidden, _, _ = post(
            "/operations/forms", {**common, "setor": "Setor 2", "phase": "programada"}, cookie,
        )
        wrong_origin, _, _ = post(
            "/operations/forms", {**common, "phase": "programada"}, cookie, origin=False,
        )
        assert forbidden == 403 and wrong_origin == 403
        for phase in ("programada", "liberada", "concretada"):
            payload = {**common, "phase": phase, "modelo": "TESTE OPERACIONAL"}
            if phase == "concretada":
                payload["tipo_concreto"] = "Concreto Padrão"
            status, result, _ = post("/operations/forms", payload, cookie)
            assert status == 200 and result["ok"] and result["result"] == "created", (phase, status, result)
        status, result, _ = post(
            "/operations/forms", {**common, "phase": "programada", "modelo": "TESTE ATUALIZADO"}, cookie,
        )
        assert status == 200 and result["result"] == "updated"
        with psycopg.connect(DB) as conn, conn.cursor() as cur:
            for table in TABLES:
                cur.execute(
                    f"SELECT count(*) FROM public.{table} WHERE data_fabricacao = %s AND setor = 'Setor 1' AND forma = %s",
                    (today, form),
                )
                assert cur.fetchone()[0] == 1
            cur.execute("SELECT count(*) FROM public.mapa_operation_audit WHERE forma = %s", (form,))
            assert cur.fetchone()[0] == 4
        print("CRIACAO=3 ATUALIZACAO=1 SETOR_NEGADO=403 ORIGEM_NEGADA=403 AUDITORIA=4")
    finally:
        with psycopg.connect(DB) as conn, conn.cursor() as cur:
            cur.execute("DELETE FROM public.mapa_operation_audit WHERE forma = %s", (form,))
            for table in TABLES:
                cur.execute(
                    f"DELETE FROM public.{table} WHERE data_fabricacao = %s AND setor = 'Setor 1' AND forma = %s",
                    (today, form),
                )
            cur.execute("DELETE FROM public.usuarios WHERE id = %s", (user_id,))
            for table, count in before.items():
                cur.execute(f"SELECT count(*) FROM public.{table}")
                assert cur.fetchone()[0] == count, table
        print("DADOS_SINTETICOS_REMOVIDOS=SIM")


if __name__ == "__main__":
    main()

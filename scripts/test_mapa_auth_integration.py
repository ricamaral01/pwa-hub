"""Teste transitorio de login contra mapa_unificado_teste; executar como postgres."""

from __future__ import annotations

import json
import os
import secrets
import urllib.error
import urllib.request

from argon2 import PasswordHasher
import psycopg


DB = "dbname=mapa_unificado_teste user=postgres"
BASE = os.environ.get("MAPA_TEST_BASE_URL", "http://127.0.0.1:13052").rstrip("/")
URL = BASE + "/login"


def request_login(name: str, password: str):
    body = json.dumps({"name": name, "password": password}).encode()
    req = urllib.request.Request(URL, data=body, headers={"Content-Type": "application/json"})
    try:
        with urllib.request.urlopen(req, timeout=5) as response:
            return response.status, json.load(response), response.headers.get("Set-Cookie", "")
    except urllib.error.HTTPError as error:
        return error.code, json.load(error), error.headers.get("Set-Cookie", "")


def request_me(cookie: str):
    req = urllib.request.Request(
        BASE + "/me", headers={"Cookie": cookie.split(";", 1)[0]},
    )
    try:
        with urllib.request.urlopen(req, timeout=5) as response:
            return response.status, json.load(response)
    except urllib.error.HTTPError as error:
        return error.code, json.load(error)


def request_read(cookie: str, path: str):
    req = urllib.request.Request(
        BASE + "/rest/v1/" + path,
        headers={"Cookie": cookie.split(";", 1)[0]},
    )
    try:
        with urllib.request.urlopen(req, timeout=5) as response:
            return response.status, json.load(response)
    except urllib.error.HTTPError as error:
        return error.code, json.load(error)


def change_first_access(token: str, password: str):
    body = json.dumps({"token": token, "password": password}).encode()
    req = urllib.request.Request(
        BASE + "/first-access", data=body,
        headers={"Content-Type": "application/json"},
    )
    with urllib.request.urlopen(req, timeout=5) as response:
        return response.status, json.load(response), response.headers.get("Set-Cookie", "")


def main() -> None:
    suffix = secrets.token_hex(8)
    user_id = f"__migration_login_test_{suffix}"
    password = secrets.token_urlsafe(24)
    new_password = secrets.token_urlsafe(24)
    with psycopg.connect(DB) as conn:
        with conn.cursor() as cur:
            cur.execute("SELECT count(*) FROM usuarios")
            before = cur.fetchone()[0]
            cur.execute(
                """INSERT INTO usuarios
                   (id, nome, perfil, senha_hash, ativo, setor, primeiro_acesso)
                   VALUES (%s, %s, %s, %s, true, %s, true)""",
                (user_id, user_id, "GERENCIA", PasswordHasher().hash(password), "Todos"),
            )
        conn.commit()
    try:
        first_status, first, first_cookie = request_login(user_id, password)
        assert first_status == 200 and first["user"]["primeiro_acesso"]
        assert first_cookie == "" and first["first_access_token"]
        changed_status, changed, changed_cookie = change_first_access(first["first_access_token"], new_password)
        assert changed_status == 200 and not changed["user"]["primeiro_acesso"] and changed_cookie
        good_status, good, cookie = request_login(user_id, new_password)
        bad_status, bad, _ = request_login(user_id, password)
        me_status, me = request_me(cookie)
        no_cookie_status, _ = request_me("")
        read_status, rows = request_read(cookie, "usuarios?select=id&limit=1")
        status_view, view_rows = request_read(cookie, "vw_formas_status?select=data_fabricacao,setor,forma,prog_id,lib_id,prod_id&data_fabricacao=eq.2026-10-02&limit=1")
        denied_status, _ = request_read("", "usuarios?select=id&limit=1")
        hash_status, _ = request_read(cookie, "usuarios?select=senha_hash&limit=1")
        assert good_status == 200 and good["ok"] and good["user"]["id"] == user_id
        assert "senha_hash" not in good["user"] and "password" not in good["user"]
        assert bad_status == 401 and not bad["ok"]
        assert me_status == 200 and me["user"]["id"] == user_id
        assert no_cookie_status == 401
        assert read_status == 200 and isinstance(rows, list)
        assert status_view == 200 and isinstance(view_rows, list) and view_rows
        assert view_rows[0]["data_fabricacao"] == "2026-10-02"
        assert denied_status == 401 and hash_status == 400
        assert "HttpOnly" in cookie and "Secure" in cookie and "SameSite=Strict" in cookie
        print("PRIMEIRO_ACESSO=200 TROCA_SENHA=200 LOGIN=200 SENHA_ANTIGA=401 SESSAO=200 SEM_COOKIE=401 LEITURA=200 FORMAS_STATUS=200 HASH_NEGADO=400")
    finally:
        with psycopg.connect(DB) as conn:
            with conn.cursor() as cur:
                cur.execute("DELETE FROM usuarios WHERE id = %s", (user_id,))
                assert cur.rowcount == 1
                cur.execute("SELECT count(*) FROM usuarios")
                assert cur.fetchone()[0] == before
            conn.commit()
        print(f"USUARIOS_APOS_TESTE={before}")


if __name__ == "__main__":
    main()

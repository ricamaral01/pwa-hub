"""Synthetic user CRUD and password hashing through the test Mapa auth proxy."""

from __future__ import annotations

import json
import os
from pathlib import Path
import secrets
import urllib.error
import urllib.parse
import urllib.request


def load_env(path: str) -> None:
    for line in Path(path).read_text(encoding="utf-8").splitlines():
        if line.strip() and not line.lstrip().startswith("#") and "=" in line:
            key, value = line.strip().split("=", 1)
            os.environ[key] = value.strip().strip('"').strip("'")


def main() -> None:
    load_env("/etc/mapa-unificado/auth.env")
    os.chdir("/opt/mapa-unificado-api")
    import sys
    sys.path.insert(0, os.getcwd())
    from app import COOKIE_NAME, connect, signer

    with connect() as conn, conn.cursor() as cursor:
        cursor.execute("""SELECT id,updated_at FROM public.usuarios WHERE perfil='GERENCIA'
                          AND ativo AND NOT primeiro_acesso ORDER BY id LIMIT 1""")
        admin = cursor.fetchone()
    assert admin
    cookie = COOKIE_NAME + "=" + signer().dumps({
        "scope": "session", "id": admin["id"], "updated_at": admin["updated_at"].isoformat(),
    })
    user_id = "captura-" + secrets.token_hex(5)
    initial_password = secrets.token_urlsafe(16)
    next_password = secrets.token_urlsafe(16)
    base = "http://127.0.0.1:13052/rest/v1/usuarios"
    results = []

    def call(method: str, query: str = "", body=None):
        headers = {"Cookie": cookie, "Origin": "https://concrefer.concretrack.com.br",
                   "Accept": "application/json", "Prefer": "return=representation"}
        raw = None
        if body is not None:
            headers["Content-Type"] = "application/json"
            raw = json.dumps(body).encode()
        request = urllib.request.Request(base + query, headers=headers, data=raw, method=method)
        try:
            with urllib.request.urlopen(request, timeout=20) as response:
                return response.status, json.loads(response.read() or b"null")
        except urllib.error.HTTPError as error:
            return error.code, json.loads(error.read() or b"null")

    try:
        status, body = call("POST", body=[{
            "id": user_id, "nome": "Captura Sintética", "perfil": "APONTADOR",
            "setor": "Setor 3", "senha": initial_password,
            "primeiro_acesso": True, "ativo": True,
        }])
        results.append(("create", status == 201 and isinstance(body, list) and len(body) == 1))
        with connect() as conn, conn.cursor() as cursor:
            cursor.execute("SELECT senha_hash FROM public.usuarios WHERE id=%s", (user_id,))
            row = cursor.fetchone()
            results.append(("argon2id", bool(row) and row["senha_hash"].startswith("$argon2id$")
                            and initial_password not in row["senha_hash"]))
        status, body = call("GET", "?id=eq." + user_id + "&select=*")
        results.append(("read_without_hash", status == 200 and isinstance(body, list)
                        and len(body) == 1 and "senha_hash" not in body[0] and "senha" not in body[0]))
        status, body = call("PATCH", "?id=eq." + user_id,
                            {"nome": "Captura Editada", "senha": next_password, "primeiro_acesso": False})
        results.append(("update", status == 200 and isinstance(body, list)
                        and len(body) == 1 and body[0]["nome"] == "Captura Editada"))
        request = urllib.request.Request("http://127.0.0.1:13052/login",
                                         data=json.dumps({"name": user_id, "password": next_password}).encode(),
                                         headers={"Content-Type": "application/json"}, method="POST")
        with urllib.request.urlopen(request, timeout=20) as response:
            login = json.loads(response.read())
            results.append(("new_password_login", response.status == 200 and login.get("ok") is True))
        status, body = call("DELETE", "?id=eq." + user_id)
        results.append(("delete", status == 200 and isinstance(body, list) and len(body) == 1))
    finally:
        with connect() as conn, conn.cursor() as cursor:
            cursor.execute("DELETE FROM public.usuarios WHERE id=%s", (user_id,))
            cursor.execute("SELECT count(*) AS n FROM public.usuarios WHERE id=%s", (user_id,))
            remaining = cursor.fetchone()["n"]
        print("users_rest_contract=" + ",".join(f"{name}:{'ok' if good else 'FAIL'}" for name, good in results))
        print(f"cleanup_remaining={remaining}")
        if remaining or not all(good for _, good in results):
            raise SystemExit(1)


if __name__ == "__main__":
    main()

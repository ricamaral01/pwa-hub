"""Synthetic insert/update/upsert/delete through authenticated test proxy only."""

from __future__ import annotations

import json
import os
from pathlib import Path
import urllib.error
import urllib.parse
import urllib.request
import uuid

import psycopg


def load_env(path: str) -> None:
    for line in Path(path).read_text(encoding="utf-8").splitlines():
        if line.strip() and not line.lstrip().startswith("#") and "=" in line:
            key, value = line.strip().split("=", 1)
            os.environ[key] = value.strip().strip('"').strip("'")


def main() -> None:
    load_env("/etc/mapa-unificado/auth.env")
    load_env("/etc/mapa-unificado/writer.env")
    parsed = urllib.parse.urlparse(os.environ["MAPA_WRITER_DATABASE_URL"])
    assert parsed.hostname == "127.0.0.1" and parsed.path == "/mapa_unificado_teste"
    os.chdir("/opt/concrefer-unificado/mapa-api")
    import sys
    sys.path.insert(0, os.getcwd())
    from app import COOKIE_NAME, connect, signer

    with connect() as conn, conn.cursor() as cursor:
        cursor.execute("""SELECT id,updated_at FROM public.usuarios WHERE perfil='GERENCIA'
                          AND ativo AND NOT primeiro_acesso ORDER BY id LIMIT 1""")
        user = cursor.fetchone()
    assert user
    cookie = COOKIE_NAME + "=" + signer().dumps({
        "scope": "session", "id": user["id"], "updated_at": user["updated_at"].isoformat(),
    })
    record_id = str(uuid.uuid4())
    form = "CODEX-CONTRACT-" + record_id[:8]
    endpoint = "http://127.0.0.1:13052/rest/v1/programacao_pcp"
    results = []

    def call(method: str, query: str, body: dict | None = None, prefer: str = "return=representation"):
        headers = {
            "Cookie": cookie, "Origin": "https://concrefer.concretrack.com.br",
            "Accept": "application/json", "Prefer": prefer,
        }
        data = None
        if body is not None:
            headers["Content-Type"] = "application/json"
            data = json.dumps(body).encode()
        request = urllib.request.Request(endpoint + query, data=data, headers=headers, method=method)
        try:
            with urllib.request.urlopen(request, timeout=20) as response:
                return response.status, response.read()
        except urllib.error.HTTPError as error:
            return error.code, error.read()

    payload = {"id": record_id, "data_fabricacao": "2099-01-17", "setor": "Setor 3",
               "forma": form, "modelo": "SC", "quantidade": 1}
    try:
        for name, method, query, body, prefer in (
            ("insert", "POST", "", payload, "return=representation"),
            ("update", "PATCH", "?id=eq." + record_id, {"modelo": "12X600"}, "return=representation"),
            ("upsert", "POST", "?on_conflict=data_fabricacao,setor,forma",
             {**payload, "modelo": "12X700"}, "resolution=merge-duplicates,return=representation"),
            ("delete", "DELETE", "?id=eq." + record_id, None, "return=representation"),
        ):
            status, body_bytes = call(method, query, body, prefer)
            try:
                response = json.loads(body_bytes) if body_bytes else None
            except ValueError:
                response = None
            results.append({"operation": name, "status": status,
                            "shape": type(response).__name__,
                            "code": response.get("code") if isinstance(response, dict) else None})
    finally:
        with psycopg.connect(os.environ["MAPA_WRITER_DATABASE_URL"]) as conn:
            with conn.cursor() as cursor:
                cursor.execute("DELETE FROM public.programacao_pcp WHERE id=%s OR forma=%s",
                               (record_id, form))
                cleaned = cursor.rowcount
        print("write_contract=" + json.dumps(results, ensure_ascii=False))
        print(f"cleanup_rows={cleaned}")


if __name__ == "__main__":
    main()

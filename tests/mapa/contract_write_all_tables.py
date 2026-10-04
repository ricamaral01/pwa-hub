"""Exercise PostgREST write protocol on six isolated Mapa test tables.

Only the test proxy and mapa_unificado_teste are used. Synthetic rows are
deleted by ID in a finally block, even when an assertion fails.
"""

from __future__ import annotations

import json
import os
from pathlib import Path
import urllib.error
import urllib.parse
import urllib.request
import uuid

import psycopg


def env(path: str) -> None:
    for line in Path(path).read_text(encoding="utf-8").splitlines():
        if line.strip() and not line.lstrip().startswith("#") and "=" in line:
            key, value = line.strip().split("=", 1)
            os.environ[key] = value.strip().strip('"').strip("'")


def main() -> None:
    env("/etc/mapa-unificado/auth.env")
    env("/etc/mapa-unificado/writer.env")
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
    marker = uuid.uuid4().hex[:10]
    day = "2099-01-17"
    cases = {
        "programacao_pcp": ({"id": str(uuid.uuid4()), "data_fabricacao": day,
                             "setor": "Setor 3", "forma": "C" + marker,
                             "modelo": "SC", "quantidade": 1},
                            {"modelo": "12X600"}, "data_fabricacao,setor,forma"),
        "liberacao_formas": ({"id": str(uuid.uuid4()), "data_fabricacao": day,
                             "setor": "Setor 3", "forma": "C" + marker,
                             "colaborador": "Captura"},
                            {"colaborador": "Captura Atualizada"}, "data_fabricacao,setor,forma"),
        "producao": ({"id": str(uuid.uuid4()), "data_fabricacao": day,
                      "setor": "Setor 3", "forma": "C" + marker,
                      "modelo": "SC", "status": "LIBERADO",
                      "tipo_concreto": "Concreto Padrão"},
                     {"tipo_concreto": "Concreto Seco - Vibrado"}, "id"),
        "montagem_poste": ({"id": "captura-" + marker, "record_id": "captura-" + marker,
                           "data_fabricacao": day, "setor": "Setor 1",
                           "forma_numero": "C" + marker, "status_montagem": "A",
                           "checklists": {}},
                          {"status_montagem": "R"}, "id"),
        "formas_manutencao": ({"id": "captura-" + marker, "setor": "Setor 3",
                            "forma_numero": "C" + marker, "status": "PARADA",
                            "motivo_parada": "Teste", "acao_necessaria": "Teste",
                            "parada_em": "17/01/2099 10:00", "parada_por": "Captura"},
                           {"status": "LIBERADA"}, "id"),
        "prog_s3_s4": ({"id": str(uuid.uuid4()), "data": day,
                        "forma": "C" + marker, "setor": "Setor 3", "modelo": "SC"},
                       {"modelo": "12X700"}, "data,forma,setor"),
    }
    results = []

    def call(table: str, method: str, query: str, body=None, prefer="return=representation"):
        headers = {"Cookie": cookie, "Origin": "https://concrefer.concretrack.com.br",
                   "Accept": "application/json", "Prefer": prefer}
        raw = None
        if body is not None:
            headers["Content-Type"] = "application/json"
            raw = json.dumps(body, ensure_ascii=False).encode()
        request = urllib.request.Request(
            "http://127.0.0.1:13052/rest/v1/" + table + query,
            data=raw, headers=headers, method=method,
        )
        try:
            with urllib.request.urlopen(request, timeout=20) as response:
                return response.status, response.read()
        except urllib.error.HTTPError as error:
            return error.code, error.read()

    try:
        for table, (payload, update, conflict) in cases.items():
            for action, method, query, body, prefer in (
                ("insert", "POST", "", payload, "return=representation"),
                ("update", "PATCH", "?id=eq." + payload["id"], update, "return=representation"),
                ("upsert", "POST", "?on_conflict=" + conflict,
                 {**payload, **update}, "resolution=merge-duplicates,return=representation"),
                ("delete", "DELETE", "?id=eq." + payload["id"], None, "return=representation"),
            ):
                status, raw = call(table, method, query, body, prefer)
                parsed_body = json.loads(raw) if raw else None
                expected = 201 if action == "insert" else 200
                passed = status == expected and isinstance(parsed_body, list)
                results.append({"table": table, "action": action, "status": status,
                                "shape": type(parsed_body).__name__, "passed": passed,
                                "error_code": parsed_body.get("code") if isinstance(parsed_body, dict) else None})
    finally:
        with psycopg.connect(os.environ["MAPA_WRITER_DATABASE_URL"]) as conn:
            with conn.cursor() as cursor:
                for table, (payload, _, _) in cases.items():
                    cursor.execute(f'DELETE FROM public."{table}" WHERE id=%s', (payload["id"],))
                cursor.execute("""SELECT count(*) FROM public.programacao_pcp WHERE forma=%s
                                  UNION ALL SELECT count(*) FROM public.liberacao_formas WHERE forma=%s
                                  UNION ALL SELECT count(*) FROM public.producao WHERE forma=%s
                                  UNION ALL SELECT count(*) FROM public.montagem_poste WHERE forma_numero=%s
                                  UNION ALL SELECT count(*) FROM public.formas_manutencao WHERE forma_numero=%s
                                  UNION ALL SELECT count(*) FROM public.prog_s3_s4 WHERE forma=%s""",
                               tuple("C" + marker for _ in range(6)))
                remaining = [row[0] for row in cursor.fetchall()]
        passed = sum(row["passed"] for row in results)
        print(f"write_table_contract={passed}/{len(results)} cleanup_counts={remaining}")
        for row in results:
            if not row["passed"]:
                print("FAIL " + json.dumps(row, ensure_ascii=False))
        if any(remaining) or passed != len(results):
            raise SystemExit(1)


if __name__ == "__main__":
    main()

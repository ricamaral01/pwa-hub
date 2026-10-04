"""Read-only source/proxy fixtures for Mapa defect dashboard pagination.

Runs on the test VPS. Full rows stay in a private migration file; stdout holds
only counts and hashes. The official Supabase receives GET requests only.
"""

from __future__ import annotations

import collections
from datetime import datetime, timezone
import hashlib
import json
import os
from pathlib import Path
from urllib.parse import urlencode

from contract_read_tables import AUTH_ENV, SOURCE_ENV, call, load_env


PERIODS = (("2026-10-01", "2026-10-04"),
           ("2026-09-01", "2026-10-04"),
           ("2026-01-01", "2026-10-04"))
TABLES = {
    "montagem_poste": "id,record_id,data_fabricacao,setor,forma_numero,modelo,status_montagem,motivo_recusa,etapa,inicio_inspecao_montagem,finalizado_em,checklists,montador_nome",
    "producao": "data_fabricacao,setor,forma,modelo,tipo_concreto,data_hora,status",
}
OUT = Path("/opt/concrefer-unificado/migration/defects-source-fixtures.json")


def utc_iso(day: str, end: bool) -> str:
    suffix = "T23:59:59.999-03:00" if end else "T00:00:00-03:00"
    return datetime.fromisoformat(day + suffix).astimezone(timezone.utc).isoformat(
        timespec="milliseconds").replace("+00:00", "Z")


def get_pages(base: str, path: str, headers: dict[str, str]) -> list[dict]:
    rows = []
    for page in range(50):
        extra = {**headers, "Range": f"{page * 1000}-{page * 1000 + 999}"}
        status, body = call(base + path, extra)
        if status not in (200, 206):
            raise RuntimeError(f"GET {path.split('?', 1)[0]} page={page} status={status}")
        current = json.loads(body)
        if not isinstance(current, list):
            raise RuntimeError("Expected list response")
        rows.extend(current)
        if len(current) < 1000:
            return rows
    raise RuntimeError("50-page limit reached")


def summarize(rows: list[dict], key: str) -> dict:
    serial = [json.dumps(row, ensure_ascii=False, sort_keys=True,
                         separators=(",", ":")) for row in rows]
    counts = collections.Counter(serial)
    ids = [row.get("id") for row in rows] if key == "montagem_poste" else []
    return {
        "rows": len(rows),
        "unique_ids": len(set(ids)) if ids else None,
        "duplicate_ids": len(ids) - len(set(ids)) if ids else None,
        "duplicate_complete_rows": sum(count - 1 for count in counts.values()),
        "ordered_sha256": hashlib.sha256("\n".join(serial).encode()).hexdigest(),
        "multiset_sha256": hashlib.sha256("\n".join(sorted(serial)).encode()).hexdigest(),
    }


def main() -> None:
    load_env(SOURCE_ENV)
    load_env(AUTH_ENV)
    os.chdir("/opt/concrefer-unificado/mapa-api")
    import sys
    sys.path.insert(0, os.getcwd())
    from app import COOKIE_NAME, connect, signer

    with connect() as conn, conn.cursor() as cursor:
        cursor.execute("""SELECT id,updated_at FROM public.usuarios
                          WHERE perfil='GERENCIA' AND ativo AND NOT primeiro_acesso
                          ORDER BY id LIMIT 1""")
        user = cursor.fetchone()
    if not user:
        raise RuntimeError("No active test GERENCIA user")
    cookie = COOKIE_NAME + "=" + signer().dumps({
        "scope": "session", "id": user["id"],
        "updated_at": user["updated_at"].isoformat(),
    })
    source_base = os.environ["SUPABASE_URL"].rstrip("/")
    source_key = os.environ["SUPABASE_SECRET_KEY"]
    source_headers = {"apikey": source_key, "Authorization": "Bearer " + source_key}
    test_headers = {"Cookie": cookie}
    fixtures = {}
    summaries = []
    for start, end in PERIODS:
        for table, fields in TABLES.items():
            params = [("select", fields)]
            if table == "montagem_poste":
                begin, finish = utc_iso(start, False), utc_iso(end, True)
                params.append(("or", f"(and(finalizado_em.gte.{begin},finalizado_em.lte.{finish}),"
                                      f"and(inicio_inspecao_montagem.gte.{begin},inicio_inspecao_montagem.lte.{finish}),"
                                      f"and(data_fabricacao.gte.{start},data_fabricacao.lte.{end}))"))
            else:
                params.extend((("data_fabricacao", f"gte.{start}"),
                               ("data_fabricacao", f"lte.{end}")))
            params.append(("order", "id.asc"))
            path = f"/rest/v1/{table}?{urlencode(params)}"
            source = get_pages(source_base, path, source_headers)
            test = get_pages("http://127.0.0.1:13052", path, test_headers)
            official_summary, test_summary = summarize(source, table), summarize(test, table)
            name = f"{table}:{start}:{end}"
            fixtures[name] = {"path": path, "official": source, "test": test}
            summaries.append({"fixture": name, "official": official_summary,
                              "test": test_summary,
                              "same_ordered_rows": official_summary["ordered_sha256"] == test_summary["ordered_sha256"],
                              "same_multiset": official_summary["multiset_sha256"] == test_summary["multiset_sha256"]})
    fd = os.open(OUT, os.O_WRONLY | os.O_CREAT | os.O_TRUNC, 0o600)
    with os.fdopen(fd, "w", encoding="utf-8") as stream:
        json.dump({"fixtures": fixtures, "summaries": summaries}, stream,
                  ensure_ascii=False, separators=(",", ":"))
    print(json.dumps({"summaries": summaries}, ensure_ascii=False))


if __name__ == "__main__":
    main()

"""Read official production tie order for the isolated test proxy."""

from __future__ import annotations

import json
import os
from pathlib import Path
import urllib.parse
import urllib.request
from datetime import datetime
from zoneinfo import ZoneInfo


SOURCE_ENV = Path("/opt/concrefer-unificado/migration/supabase-source.env")
TARGET = Path("/opt/concrefer-unificado/mapa-api/producao-order.json")
PRODUCTIVITY_TARGET = Path("/opt/concrefer-unificado/mapa-api/producao-productivity-order.json")
CONTEXT_TARGET = Path("/opt/concrefer-unificado/mapa-api/producao-order-contexts.json")
CAPTURED = Path("/opt/concrefer-unificado/migration/captured-offline.json")
SINCE_DATE = "2026-09-26"
PRODUCTIVITY_SINCE_DATE = "2026-09-01"
PRODUCTIVITY_SELECT = "id,data_hora,setor,forma,modelo,tipo_concreto,colaborador,data_fabricacao,status,codigo_poste,descricao_poste,codigo_produto,vibrado"


def main() -> None:
    values = dict(line.strip().split("=", 1) for line in SOURCE_ENV.read_text().splitlines()
                  if line.strip() and not line.lstrip().startswith("#") and "=" in line)
    base = values["SUPABASE_URL"].strip('"').rstrip("/")
    key = values["SUPABASE_SECRET_KEY"].strip('"')
    for since_date, target in ((SINCE_DATE, TARGET),
                               (PRODUCTIVITY_SINCE_DATE, PRODUCTIVITY_TARGET)):
        sync_order(base, key, since_date, target)
    sync_captured_contexts(base, key)


def read_source_ids(base: str, key: str, query: str) -> list[str]:
    ids: list[str] = []
    while True:
        start = len(ids)
        request = urllib.request.Request(
            base + "/rest/v1/producao?" + query,
            headers={"apikey": key, "Authorization": "Bearer " + key,
                     "Range": f"{start}-{start + 999}"},
        )
        with urllib.request.urlopen(request, timeout=60) as response:
            rows = json.load(response)
        ids.extend(row["id"] for row in rows)
        if len(rows) < 1000:
            break
        if len(ids) > 100000:
            raise RuntimeError("unexpected production source row count")
    if len(set(ids)) != len(ids):
        raise RuntimeError(f"duplicate production source order IDs: {len(ids)}")
    return ids


def write_private(target: Path, payload: dict) -> None:
    temporary = target.with_suffix(".tmp")
    fd = os.open(temporary, os.O_WRONLY | os.O_CREAT | os.O_TRUNC, 0o640)
    with os.fdopen(fd, "w", encoding="utf-8") as file:
        json.dump(payload, file, separators=(",", ":"))
    os.chown(temporary, 0, 33)
    os.chmod(temporary, 0o640)
    temporary.replace(target)


def sync_captured_contexts(base: str, key: str) -> None:
    captured = json.loads(CAPTURED.read_text(encoding="utf-8"))["requests"]
    contexts: dict[str, list[str]] = {}
    for item in captured:
        filters = item.get("query") or {}
        if (item.get("method") != "GET" or item.get("path") != "/rest/v1/producao"
                or filters.get("order") != ["data_hora.asc"]
                or filters.get("status") != ["in.(LIBERADO,INSPECIONADO)"]
                or not filters.get("select", [""])[0].startswith("id,")):
            continue
        dates = filters.get("data_fabricacao", [])
        signature = json.dumps({"select": filters["select"][0], "dates": dates,
                                "status": filters["status"][0]},
                               sort_keys=True, separators=(",", ":"))
        if signature in contexts:
            continue
        params = [(name, value) for name, values in filters.items()
                  if name not in ("offset", "limit") for value in values]
        contexts[signature] = read_source_ids(base, key, urllib.parse.urlencode(params))
    write_private(CONTEXT_TARGET, {"contexts": contexts})
    print(f"source_producao_order_contexts={len(contexts)} path=private")


def sync_order(base: str, key: str, since_date: str, target: Path) -> None:
    params = {
        "select": PRODUCTIVITY_SELECT if target != TARGET else "id,data_hora",
        "data_fabricacao": f"gte.{since_date}",
        "status": "in.(LIBERADO,INSPECIONADO)",
        "order": "data_hora.asc",
    }
    if target == PRODUCTIVITY_TARGET:
        params["data_fabricacao_lte"] = datetime.now(ZoneInfo("America/Sao_Paulo")).date().isoformat()
    query = urllib.parse.urlencode([(name if name != "data_fabricacao_lte" else "data_fabricacao",
                                     f"lte.{value}" if name == "data_fabricacao_lte" else value)
                                    for name, value in params.items()])
    ids = read_source_ids(base, key, query)
    if not ids:
        raise RuntimeError(f"unexpected production source order: {len(ids)}")
    payload = {"since": since_date, "ids": ids}
    write_private(target, payload)
    print(f"source_producao_order_ids={len(ids)} path=private")


if __name__ == "__main__":
    main()

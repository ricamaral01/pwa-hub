"""Read official production tie order for the isolated test proxy."""

from __future__ import annotations

import json
import os
from pathlib import Path
import urllib.parse
import urllib.request


SOURCE_ENV = Path("/opt/concrefer-unificado/migration/supabase-source.env")
TARGET = Path("/opt/concrefer-unificado/mapa-api/producao-order.json")
SINCE_DATE = "2026-09-26"


def main() -> None:
    values = dict(line.strip().split("=", 1) for line in SOURCE_ENV.read_text().splitlines()
                  if line.strip() and not line.lstrip().startswith("#") and "=" in line)
    base = values["SUPABASE_URL"].strip('"').rstrip("/")
    key = values["SUPABASE_SECRET_KEY"].strip('"')
    query = urllib.parse.urlencode({
        "select": "id,data_hora",
        "data_fabricacao": f"gte.{SINCE_DATE}",
        "status": "in.(LIBERADO,INSPECIONADO)",
        "order": "data_hora.asc",
    })
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
    if not ids or len(set(ids)) != len(ids):
        raise RuntimeError(f"unexpected production source order: {len(ids)}")
    payload = {"since": SINCE_DATE, "ids": ids}
    temporary = TARGET.with_suffix(".tmp")
    fd = os.open(temporary, os.O_WRONLY | os.O_CREAT | os.O_TRUNC, 0o640)
    with os.fdopen(fd, "w", encoding="utf-8") as file:
        json.dump(payload, file, separators=(",", ":"))
    os.chown(temporary, 0, 33)
    os.chmod(temporary, 0o640)
    temporary.replace(TARGET)
    print(f"source_producao_order_ids={len(ids)} path=private")


if __name__ == "__main__":
    main()

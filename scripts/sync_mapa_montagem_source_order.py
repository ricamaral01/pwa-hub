"""Capture source GET order for the dashboard's no-order montage query."""

from __future__ import annotations

import json
import os
from pathlib import Path
import urllib.parse
import urllib.request


SOURCE_ENV = Path("/opt/concrefer-unificado/migration/supabase-source.env")
TARGET = Path("/opt/concrefer-unificado/mapa-api/montagem-order.json")
SINCE_DATE = "2026-09-26"
SINCE_UTC = "2026-09-26T03:00:00.000Z"


def main() -> None:
    values = dict(line.strip().split("=", 1) for line in SOURCE_ENV.read_text().splitlines()
                  if line.strip() and not line.lstrip().startswith("#") and "=" in line)
    base = values["SUPABASE_URL"].strip('"').rstrip("/")
    key = values["SUPABASE_SECRET_KEY"].strip('"')
    query = urllib.parse.urlencode({
        "select": "id,record_id,data_fabricacao,setor,forma_numero,modelo,status_montagem,motivo_recusa,etapa,inicio_inspecao_montagem,finalizado_em,checklists,banco,observacoes_montagem,montador_nome,created_at,updated_at",
        "or": f"(data_fabricacao.gte.{SINCE_DATE},updated_at.gte.{SINCE_UTC})",
    })
    request = urllib.request.Request(base + "/rest/v1/montagem_poste?" + query,
                                     headers={"apikey": key, "Authorization": "Bearer " + key})
    with urllib.request.urlopen(request, timeout=30) as response:
        rows = json.load(response)
    ids = [row["id"] for row in rows]
    if not ids or len(set(ids)) != len(ids):
        raise RuntimeError(f"Unexpected montage source order length/uniqueness: {len(ids)}")
    payload = {"since": SINCE_DATE, "ids": ids}
    temporary = TARGET.with_suffix(".tmp")
    fd = os.open(temporary, os.O_WRONLY | os.O_CREAT | os.O_TRUNC, 0o640)
    with os.fdopen(fd, "w", encoding="utf-8") as file:
        json.dump(payload, file, separators=(",", ":"))
    os.chown(temporary, 0, 33)
    os.chmod(temporary, 0o640)
    temporary.replace(TARGET)
    print(f"source_montagem_order_ids={len(ids)} path=private")


if __name__ == "__main__":
    main()

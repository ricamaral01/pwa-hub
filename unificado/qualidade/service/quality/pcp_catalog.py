"""Authenticated read-only HTTP contract with PCP; no cross-database access."""
import hashlib
import hmac
import json
import os
import time
import urllib.error
import urllib.request

from fastapi import HTTPException

BASE = "http://127.0.0.1:13054"


def fetch_catalog(kind: str) -> list[dict]:
    if kind not in {"setores", "produtos"}:
        raise ValueError(kind)
    key = os.getenv("QUALIDADE_PCP_CATALOG_KEY", "")
    if len(key) < 32:
        raise HTTPException(503, "Contrato PCP não configurado.")
    path = f"/api/integracoes/qualidade/{kind}"
    now = str(int(time.time()))
    signature = hmac.new(key.encode(), f"GET\n{path}\n{now}".encode(), hashlib.sha256).hexdigest()
    req = urllib.request.Request(BASE + path, headers={"X-Quality-Timestamp": now,
                                                        "X-Quality-Signature": signature})
    try:
        with urllib.request.urlopen(req, timeout=5) as response:
            data = json.load(response)
        if not isinstance(data, list):
            raise ValueError("invalid PCP catalog")
        return data
    except (urllib.error.URLError, TimeoutError, ValueError):
        raise HTTPException(503, "Catálogo PCP indisponível.") from None


def snapshot(kind: str, identifier: str | None, *, sector: str | None = None) -> dict[str, str | None]:
    if not identifier:
        return {}
    entry = next((item for item in fetch_catalog(kind) if str(item.get("id")) == identifier), None)
    if entry is None or (kind == "produtos" and sector and str(entry.get("setor_id")) != sector):
        raise HTTPException(422, "Setor ou produto PCP inválido.")
    prefix = "setor" if kind == "setores" else "produto"
    return {f"{prefix}_pcp_id": str(entry["id"]), f"{prefix}_codigo_snapshot": str(entry["codigo"]),
            f"{prefix}_nome_snapshot": str(entry["nome"])}

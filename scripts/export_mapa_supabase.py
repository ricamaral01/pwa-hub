"""Exporta as tabelas operacionais do Mapa para CSV, sem salvar senhas legíveis.

Requer SUPABASE_URL e SUPABASE_SECRET_KEY no ambiente. O destino deve ficar fora do
Git. O resultado é um retrato somente leitura; repetir antes do corte final.
"""

from __future__ import annotations

import argparse
import csv
from datetime import datetime, timezone
import hashlib
import json
import os
from pathlib import Path
import re

from argon2 import PasswordHasher
import requests


TABLES = (
    "usuarios", "programacao_pcp", "liberacao_formas", "producao",
    "montagem_poste", "formas_manutencao", "prog_s3_s4",
)
PAGE_SIZE = 500
TIMEOUT = 30


def get_count(session: requests.Session, base: str, table: str) -> int:
    response = session.head(f"{base}/{table}", params={"select": "id", "limit": "0"},
                            headers={"Prefer": "count=exact"}, timeout=TIMEOUT)
    response.raise_for_status()
    match = re.fullmatch(r"\*/(\d+)", response.headers.get("Content-Range", ""))
    if not match:
        raise RuntimeError(f"Contagem ausente para {table}")
    return int(match.group(1))


def source_columns(session: requests.Session, base: str) -> dict[str, list[str]]:
    """Read the live REST schema; an empty table must retain its columns."""
    response = session.get(base + "/", headers={"Accept": "application/openapi+json"}, timeout=TIMEOUT)
    response.raise_for_status()
    definitions = response.json()["definitions"]
    return {table: list(definitions[table]["properties"]) for table in TABLES}


def rows_for(session: requests.Session, base: str, table: str):
    last_id = None
    while True:
        params = {"select": "*", "order": "id.asc", "limit": str(PAGE_SIZE)}
        if last_id is not None:
            params["id"] = f"gt.{last_id}"
        response = session.get(f"{base}/{table}", params=params, timeout=TIMEOUT)
        response.raise_for_status()
        rows = response.json()
        if not isinstance(rows, list):
            raise RuntimeError(f"Resposta inválida de {table}")
        for row in rows:
            yield row
        if len(rows) < PAGE_SIZE:
            return
        new_last_id = rows[-1]["id"]
        if new_last_id == last_id:
            raise RuntimeError(f"Paginação sem avanço em {table}")
        last_id = new_last_id


def csv_value(value):
    if value is None:
        return "\\N"
    if isinstance(value, bool):
        return "true" if value else "false"
    if isinstance(value, (dict, list)):
        return json.dumps(value, ensure_ascii=False, separators=(",", ":"))
    return value


def export_table(session: requests.Session, base: str, table: str, output: Path,
                 hasher: PasswordHasher, source_column_names: list[str]) -> dict:
    source_before = get_count(session, base, table)
    rows = rows_for(session, base, table)
    first = next(rows, None)
    columns = list(source_column_names)
    if first is not None and set(first) != set(columns):
        raise RuntimeError(f"{table}: primeira linha diverge do esquema da origem")
    if table == "usuarios":
        if "senha" not in columns:
            raise RuntimeError("Coluna de senha ausente em usuarios")
        columns[columns.index("senha")] = "senha_hash"
    target = output / f"{table}.csv"
    seen_ids = set()
    count = 0
    digest = hashlib.sha256()
    with target.open("w", encoding="utf-8", newline="") as file:
        writer = csv.DictWriter(file, fieldnames=columns, lineterminator="\n")
        writer.writeheader()
        for row in ([first] if first else []):
            count += write_row(writer, row, table, hasher, seen_ids, digest)
        for row in rows:
            count += write_row(writer, row, table, hasher, seen_ids, digest)
    source_after = get_count(session, base, table)
    if count != source_before or count != source_after:
        raise RuntimeError(f"{table}: contagens variaram durante exportação ({source_before}/{count}/{source_after})")
    return {
        "table": table,
        "source_count": source_before,
        "exported_count": count,
        "columns": columns,
        "id_sha256": digest.hexdigest(),
        "file": target.name,
        "file_sha256": hashlib.sha256(target.read_bytes()).hexdigest(),
    }


def write_row(writer: csv.DictWriter, row: dict, table: str,
              hasher: PasswordHasher, seen_ids: set, digest) -> int:
    expected = set(writer.fieldnames or [])
    received = set(row)
    if table == "usuarios":
        expected = (expected - {"senha_hash"}) | {"senha"}
    if received != expected:
        raise RuntimeError(f"{table}: colunas da linha divergentes da OpenAPI")
    row_id = str(row["id"])
    if row_id in seen_ids:
        raise RuntimeError(f"ID repetido em {table}")
    seen_ids.add(row_id)
    digest.update(row_id.encode("utf-8"))
    digest.update(b"\n")
    if table == "usuarios":
        row["senha_hash"] = hasher.hash(str(row.pop("senha") or ""))
    writer.writerow({key: csv_value(value) for key, value in row.items()})
    return 1


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("output", type=Path)
    args = parser.parse_args()
    url = os.environ.get("SUPABASE_URL", "").rstrip("/")
    key = os.environ.get("SUPABASE_SECRET_KEY", "")
    if not url.startswith("https://") or not key.startswith("sb_secret_"):
        parser.error("Defina SUPABASE_URL e SUPABASE_SECRET_KEY no ambiente")
    output = args.output.resolve()
    output.mkdir(parents=True, exist_ok=False)
    session = requests.Session()
    session.headers.update({"apikey": key, "Accept": "application/json"})
    hasher = PasswordHasher()
    live_columns = source_columns(session, f"{url}/rest/v1")
    started = datetime.now(timezone.utc).isoformat()
    results = []
    for table in TABLES:
        result = export_table(session, f"{url}/rest/v1", table, output, hasher,
                              live_columns[table])
        results.append(result)
        print(f"{table}: {result['exported_count']} registros")
    manifest = {"source_url": url, "exported_at": started, "tables": results}
    (output / "manifest.json").write_text(json.dumps(manifest, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(f"Manifesto: {output / 'manifest.json'}")


if __name__ == "__main__":
    main()

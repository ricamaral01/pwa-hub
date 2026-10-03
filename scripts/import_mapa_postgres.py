"""Importa CSV do Mapa no banco PostgreSQL isolado da VPS de testes.

Executar como root na VPS: python3 import_mapa_postgres.py /root/mapa-unificado-migration/export-20261002
Usa psql como usuário postgres. Recusa banco com tabelas já preenchidas.
"""

from __future__ import annotations

import argparse
import hashlib
import json
from pathlib import Path
import re
import subprocess


DATABASE = "mapa_unificado_teste"
TABLES = {
    "usuarios", "programacao_pcp", "liberacao_formas", "producao",
    "montagem_poste", "formas_manutencao", "prog_s3_s4",
}
IDENTIFIER = re.compile(r"[a-z][a-z0-9_]*\Z")
HASH = re.compile(r"[0-9a-f]{64}\Z")


def psql(sql: str, *, data_file: Path | None = None) -> str:
    command = ["sudo", "-u", "postgres", "psql", "-X", "-A", "-t",
               "-v", "ON_ERROR_STOP=1", "-d", DATABASE, "-c", sql]
    if data_file is None:
        result = subprocess.run(command, capture_output=True, text=True, check=True)
    else:
        with data_file.open("rb") as input_file:
            result = subprocess.run(command, stdin=input_file, capture_output=True,
                                    text=True, check=True)
    return result.stdout.strip()


def file_hash(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as file:
        for block in iter(lambda: file.read(1024 * 1024), b""):
            digest.update(block)
    return digest.hexdigest()


def id_hash(table: str) -> str:
    command = ["sudo", "-u", "postgres", "psql", "-X", "-v", "ON_ERROR_STOP=1",
               "-d", DATABASE, "-c", f"COPY (SELECT id::text FROM {table} ORDER BY id) TO STDOUT"]
    digest = hashlib.sha256()
    process = subprocess.Popen(command, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    assert process.stdout is not None
    for block in iter(lambda: process.stdout.read(1024 * 1024), b""):
        digest.update(block)
    stderr = process.stderr.read() if process.stderr else b""
    if process.wait() != 0:
        raise RuntimeError(f"Falha ao conferir IDs de {table}: {stderr.decode(errors='replace')}")
    return digest.hexdigest()


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("directory", type=Path)
    args = parser.parse_args()
    directory = args.directory.resolve(strict=True)
    manifest = json.loads((directory / "manifest.json").read_text(encoding="utf-8"))
    rows = manifest.get("tables", [])
    if {row.get("table") for row in rows} != TABLES:
        raise RuntimeError("Conjunto de tabelas não corresponde ao contrato do Mapa")
    for row in rows:
        table = row["table"]
        columns = row["columns"]
        if not all(IDENTIFIER.fullmatch(column) for column in columns):
            raise RuntimeError(f"Coluna inválida em {table}")
        if row["file"] != f"{table}.csv":
            raise RuntimeError(f"Arquivo inválido em {table}")
        if not HASH.fullmatch(row["file_sha256"]) or not HASH.fullmatch(row["id_sha256"]):
            raise RuntimeError(f"Hash inválido em {table}")
        if file_hash(directory / row["file"]) != row["file_sha256"]:
            raise RuntimeError(f"Arquivo alterado durante transferência: {table}")
        if row["source_count"] != row["exported_count"]:
            raise RuntimeError(f"Contagem de origem divergente: {table}")
        if int(psql(f"SELECT count(*) FROM {table}")) != 0:
            raise RuntimeError(f"Tabela de destino já contém dados: {table}")

    for row in rows:
        table = row["table"]
        if row["exported_count"]:
            column_list = ", ".join(row["columns"])
            sql = f"COPY {table} ({column_list}) FROM STDIN WITH (FORMAT csv, HEADER true, NULL '\\N')"
            psql(sql, data_file=directory / row["file"])
        imported = int(psql(f"SELECT count(*) FROM {table}"))
        if imported != row["exported_count"]:
            raise RuntimeError(f"Contagem importada divergente em {table}: {imported}")
        if id_hash(table) != row["id_sha256"]:
            raise RuntimeError(f"Hash dos IDs divergente em {table}")
        psql("INSERT INTO migration_audit "
             "(table_name, source_count, imported_count, exported_at, source_id_sha256) "
             f"VALUES ('{table}', {row['source_count']}, {imported}, "
             f"'{manifest['exported_at']}', '{row['id_sha256']}')")
        print(f"{table}: {imported} registros importados e conferidos", flush=True)


if __name__ == "__main__":
    main()

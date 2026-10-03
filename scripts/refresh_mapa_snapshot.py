"""Refaz a fotografia do Mapa no PostgreSQL isolado da VPS de testes.

Executar como root na VPS de testes, com SUPABASE_URL e SUPABASE_SECRET_KEY em
/root/mapa-unificado-migration/supabase-source.env (proprietário root, modo 600).
Requer requests e argon2-cffi no Python usado para executar este arquivo.

A origem recebe somente HEAD/GET. O destino é atualizado numa transação após
exportação, conferência das tabelas de estágio e backup privado. As senhas e o
estado de primeiro acesso já alterados no ambiente de testes são preservados.
"""

from __future__ import annotations

import argparse
from datetime import datetime, timezone
import json
import os
from pathlib import Path
import re
import subprocess
import sys


DATABASE = "mapa_unificado_teste"
BASE = Path("/root/mapa-unificado-migration")
ENV_FILE = BASE / "supabase-source.env"
TABLES = (
    "usuarios", "programacao_pcp", "liberacao_formas", "producao",
    "montagem_poste", "formas_manutencao", "prog_s3_s4",
)
SHA256 = re.compile(r"[0-9a-f]{64}\Z")
IDENTIFIER = re.compile(r"[a-z][a-z0-9_]*\Z")


def psql(sql: str, *, input_file: Path | None = None) -> str:
    command = ["sudo", "-u", "postgres", "psql", "-X", "-A", "-t",
               "-v", "ON_ERROR_STOP=1", "-d", DATABASE, "-c", sql]
    if input_file is None:
        result = subprocess.run(command, check=True, capture_output=True, text=True)
    else:
        with input_file.open("rb") as file:
            result = subprocess.run(command, check=True, stdin=file, capture_output=True)
    return result.stdout.strip().decode() if isinstance(result.stdout, bytes) else result.stdout.strip()


def source_environment() -> dict[str, str]:
    stat = ENV_FILE.stat()
    if stat.st_uid != 0 or stat.st_mode & 0o077:
        raise RuntimeError(f"Arquivo privado deve pertencer a root e ter modo 600: {ENV_FILE}")
    values: dict[str, str] = {}
    for line in ENV_FILE.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line or line.startswith("#"):
            continue
        name, separator, value = line.partition("=")
        if not separator or name not in {"SUPABASE_URL", "SUPABASE_SECRET_KEY"}:
            raise RuntimeError("Formato inválido no arquivo privado de origem")
        values[name] = value.strip().strip('"').strip("'")
    if not values.get("SUPABASE_URL", "").startswith("https://"):
        raise RuntimeError("SUPABASE_URL inválida")
    if not values.get("SUPABASE_SECRET_KEY", "").startswith("sb_secret_"):
        raise RuntimeError("SUPABASE_SECRET_KEY ausente ou inválida")
    return {**os.environ, **values}


def verified_manifest(directory: Path) -> dict:
    manifest = json.loads((directory / "manifest.json").read_text(encoding="utf-8"))
    rows = manifest["tables"]
    if tuple(row["table"] for row in rows) != TABLES:
        raise RuntimeError("Tabelas exportadas não correspondem ao contrato")
    datetime.fromisoformat(manifest["exported_at"])
    for row in rows:
        if not all(IDENTIFIER.fullmatch(column) for column in row["columns"]):
            raise RuntimeError(f"Coluna inválida em {row['table']}")
        if row["file"] != f"{row['table']}.csv" or not SHA256.fullmatch(row["id_sha256"]):
            raise RuntimeError(f"Manifesto inválido em {row['table']}")
        if row["source_count"] != row["exported_count"]:
            raise RuntimeError(f"Contagem divergente na origem em {row['table']}")
    return manifest


def dump_before_change(path: Path) -> None:
    descriptor = os.open(path, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
    with os.fdopen(descriptor, "wb") as output:
        subprocess.run(["sudo", "-u", "postgres", "pg_dump", "-Fc", "-d", DATABASE],
                       check=True, stdout=output, stderr=subprocess.PIPE)
    subprocess.run(["pg_restore", "--list", str(path)], check=True,
                   stdout=subprocess.DEVNULL, stderr=subprocess.PIPE)


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--dry-run", action="store_true", help="Confere requisitos sem exportar ou alterar o banco")
    args = parser.parse_args()
    if os.name != "posix" or os.geteuid() != 0:
        parser.error("Este script deve ser executado como root na VPS Linux de testes")
    if not BASE.is_dir() or not ENV_FILE.is_file():
        parser.error(f"Arquivo de credenciais privadas não encontrado: {ENV_FILE}")
    source_env = source_environment()
    if psql("SELECT current_database()") != DATABASE:
        raise RuntimeError("Banco de destino incorreto")
    if args.dry_run:
        print("Requisitos locais conferidos; nenhum dado exportado ou alterado.")
        return

    stamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
    work = BASE / "snapshots" / stamp
    work.mkdir(parents=True, mode=0o700, exist_ok=False)
    export = work / "export"
    exporter = Path(__file__).with_name("export_mapa_supabase.py")
    subprocess.run([sys.executable, str(exporter), str(export)], check=True,
                   env=source_env)
    manifest = verified_manifest(export)
    stage = f"snapshot_stage_{stamp.lower()}"
    psql(f"CREATE SCHEMA {stage}")
    try:
        for row in manifest["tables"]:
            table = row["table"]
            psql(f"CREATE TABLE {stage}.{table} (LIKE public.{table} INCLUDING DEFAULTS)")
            if row["exported_count"]:
                cols = ", ".join(row["columns"])
                psql(f"COPY {stage}.{table} ({cols}) FROM STDIN WITH (FORMAT csv, HEADER true, NULL '\\N')",
                     input_file=export / row["file"])
            count = int(psql(f"SELECT count(*) FROM {stage}.{table}"))
            if count != row["exported_count"]:
                raise RuntimeError(f"Contagem do estágio divergente em {table}")
            # COPY TO STDOUT preserva a mesma ordenação e quebra de linha do exportador.
            query = (f"COPY (SELECT id::text FROM {stage}.{table} ORDER BY id) TO STDOUT")
            command = ["sudo", "-u", "postgres", "psql", "-X", "-q", "-v", "ON_ERROR_STOP=1",
                       "-d", DATABASE, "-c", query]
            import hashlib
            digest = hashlib.sha256()
            with subprocess.Popen(command, stdout=subprocess.PIPE, stderr=subprocess.PIPE) as process:
                assert process.stdout is not None
                for block in iter(lambda: process.stdout.read(1024 * 1024), b""):
                    digest.update(block)
                error = process.stderr.read() if process.stderr else b""
                if process.wait() != 0:
                    raise RuntimeError(f"Falha ao conferir IDs do estágio {table}: {error.decode(errors='replace')}")
            if digest.hexdigest() != row["id_sha256"]:
                raise RuntimeError(f"IDs do estágio divergentes em {table}")
            print(f"Estágio conferido: {table} ({count})", flush=True)

        backup = work / "before-refresh.dump"
        dump_before_change(backup)
        psql(f"""UPDATE {stage}.usuarios AS incoming
                    SET senha_hash = current.senha_hash,
                        primeiro_acesso = current.primeiro_acesso
                    FROM public.usuarios AS current
                    WHERE incoming.id = current.id""")
        table_list = ", ".join(f"public.{table}" for table in TABLES)
        statements = ["BEGIN", f"TRUNCATE {table_list}"]
        statements += [f"INSERT INTO public.{table} SELECT * FROM {stage}.{table}" for table in TABLES]
        statements.append("DELETE FROM public.migration_audit")
        for row in manifest["tables"]:
            statements.append(
                "INSERT INTO public.migration_audit "
                "(table_name, source_count, imported_count, exported_at, source_id_sha256) "
                f"VALUES ('{row['table']}', {row['source_count']}, {row['exported_count']}, "
                f"'{manifest['exported_at']}', '{row['id_sha256']}')"
            )
        statements.append("COMMIT")
        psql(";\n".join(statements) + ";")
        for row in manifest["tables"]:
            table = row["table"]
            if int(psql(f"SELECT count(*) FROM public.{table}")) != row["exported_count"]:
                raise RuntimeError(f"Contagem final divergente em {table}; restaurar {backup}")
        print(f"Fotografia atualizada em {manifest['exported_at']}; manifesto e backup privados em {work}")
    finally:
        psql(f"DROP SCHEMA IF EXISTS {stage} CASCADE")


if __name__ == "__main__":
    main()

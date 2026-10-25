"""Copy the Dosagem dump into an empty dosagem schema, preserving pilot records."""

from pathlib import Path
import re
import subprocess


DATABASE = "mapa_unificado_teste"
SCHEMA = "dosagem"
DUMP = Path("/root/dosagem-native-source.dump")
TABLES = {
    "usuarios", "auditoria", "auth_flows", "auth_sessions", "auth_tickets",
    "avaliacoes_impacto", "documentos", "idempotencia", "legado_ids",
    "local_credenciais", "material_versoes", "traco_versoes",
}


def psql(sql: str) -> str:
    result = subprocess.run(["runuser", "-u", "postgres", "--", "psql", "-v", "ON_ERROR_STOP=1",
                             "-At", "-d", DATABASE], input=sql, text=True, capture_output=True, check=True)
    return result.stdout


def main() -> None:
    if not DUMP.is_file():
        raise RuntimeError("Source dump missing")
    rows = psql("SELECT tablename FROM pg_tables WHERE schemaname='dosagem';").splitlines()
    if not TABLES.issubset(rows):
        raise RuntimeError("Dosagem migrations are incomplete")
    counts = {table: int(psql(f"SELECT count(*) FROM {SCHEMA}.{table};")) for table in TABLES}
    if any(counts.values()):
        raise RuntimeError("Target has records; refusing to overwrite or duplicate them")
    dump = subprocess.run(["pg_restore", "--data-only", "--no-owner", "--no-acl", "-f", "-", str(DUMP)],
                          capture_output=True, text=True, check=True).stdout
    blocks = {}
    sequence_commands = []
    lines = iter(dump.splitlines(keepends=True))
    for line in lines:
        match = re.match(r"^COPY public\.([a-z_]+) \(", line)
        if match:
            name = match.group(1)
            block = [line.replace("COPY public.", "COPY dosagem.", 1)]
            for data in lines:
                block.append(data)
                if data.strip() == r"\.":
                    break
            blocks[name] = "".join(block)
        elif line.startswith("SELECT pg_catalog.setval('public."):
            sequence_commands.append(line.replace("'public.", "'dosagem.", 1))
    if set(blocks) != TABLES | {"alembic_version"}:
        raise RuntimeError("Dump table list differs from expected Dosagem schema")
    ordered = ["usuarios"] + sorted(TABLES - {"usuarios"})
    sql = "BEGIN;\n" + "\n".join(blocks[name] for name in ordered) + "\n" + "".join(sequence_commands) + "COMMIT;\n"
    psql(sql)
    result = {table: int(psql(f"SELECT count(*) FROM {SCHEMA}.{table};")) for table in sorted(TABLES)}
    print("Restored Dosagem records; table counts:")
    for table, count in result.items():
        print(f"{table}: {count}")


if __name__ == "__main__":
    main()

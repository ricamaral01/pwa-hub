"""Refresh both isolated snapshots from read-only official sources.

Run on the workstation with SSH aliases vps-rh and vps-staging. The Mapa
refresh is delegated to its existing checked export/staging transaction.
The PCP dump is restored into a temporary database, counted, then its data
is replaced in one transaction in pcp_unificado_teste. Never writes to the
official VPS or Supabase.
"""

from __future__ import annotations

import argparse
from datetime import datetime, timezone
import json
from pathlib import Path
import re
import subprocess
import tempfile


PCP = "pcp_unificado_teste"
MAPA_SCRIPT = "/root/mapa-unificado-migration/refresh_mapa_snapshot.py"
MAPA_PYTHON = "/root/mapa-unificado-migration/refresh-venv/bin/python"
BACKUP_SCRIPT = "/usr/local/libexec/backup_unificado_testes.py"


def run(args: list[str], *, input_bytes: bytes | None = None) -> bytes:
    result = subprocess.run(args, input=input_bytes, stdout=subprocess.PIPE,
                            stderr=subprocess.PIPE, check=True)
    return result.stdout


def remote_counts(alias: str, db: str) -> dict[str, int]:
    code = f'''
import json,re,subprocess
database={db!r}
def query(sql):
    return subprocess.run(['sudo','-u','postgres','psql','-X','-A','-t','-d',database,'-c',sql],capture_output=True,text=True,check=True).stdout.strip()
names=query("SELECT tablename FROM pg_tables WHERE schemaname='public' ORDER BY tablename").splitlines()
assert all(re.fullmatch(r'[a-z_][a-z_0-9]*',name) for name in names)
print(json.dumps({{name:int(query('SELECT count(*) FROM public.'+name)) for name in names}},sort_keys=True))
'''
    return json.loads(run(["ssh", alias, "python3", "-"], input_bytes=code.encode()).decode())


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--apply", action="store_true", help="Refresh test DBs; default is preflight only")
    args = parser.parse_args()
    official = remote_counts("vps-rh", "pcp_concrefer")
    current = remote_counts("vps-staging", PCP)
    if set(official) != set(current) or len(official) != 19:
        raise RuntimeError("PCP source and test schema table sets differ")
    run(["ssh", "vps-staging", MAPA_PYTHON, MAPA_SCRIPT, "--dry-run"])
    print(f"preflight=ok pcp_tables={len(official)} pcp_source_rows={sum(official.values())}")
    if not args.apply:
        return

    # This backup also proves that both existing test DBs can be restored.
    run(["ssh", "vps-staging", "sudo", "-u", "postgres", "python3", BACKUP_SCRIPT, "--restore-check"])
    stamp = datetime.now(timezone.utc).strftime("%Y%m%d%H%M%S")
    stage = "pcp_snapshot_stage_" + stamp
    with tempfile.TemporaryDirectory(prefix="unificado-refresh-") as temporary:
        local = Path(temporary)
        dump = local / "pcp-source.dump"
        dump.write_bytes(run(["ssh", "vps-rh", "sudo", "-u", "postgres", "pg_dump", "--format=custom", "pcp_concrefer"]))
        run(["pg_restore", "--list", str(dump)])
        remote_dump = "/var/lib/postgresql/" + stage + ".dump"
        run(["scp", str(dump), "vps-staging:" + remote_dump])
        run(["ssh", "vps-staging", "chown", "postgres:postgres", remote_dump])
        try:
            run(["ssh", "vps-staging", "sudo", "-u", "postgres", "createdb", "--template=template0", stage])
            try:
                run(["ssh", "vps-staging", "sudo", "-u", "postgres", "pg_restore", "--exit-on-error", "--no-owner", "--no-acl", "-d", stage, remote_dump])
                stage_counts = remote_counts("vps-staging", stage)
                if stage_counts != official:
                    raise RuntimeError("PCP source counts changed or stage restore differs; test DB unchanged")
                data_sql = run(["ssh", "vps-staging", "sudo", "-u", "postgres", "pg_dump", "--data-only", "--inserts", "--no-owner", "--no-acl", stage])
                names = sorted(stage_counts)
                if not all(re.fullmatch(r"[a-z_][a-z_0-9]*", name) for name in names):
                    raise RuntimeError("Unexpected PCP table name")
                script = ("TRUNCATE " + ", ".join("public." + name for name in names)
                          + " RESTART IDENTITY CASCADE;\n").encode() + data_sql
                local_sql = local / "pcp-refresh.sql"
                local_sql.write_bytes(script)
                remote_sql = "/var/lib/postgresql/" + stage + ".sql"
                run(["scp", str(local_sql), "vps-staging:" + remote_sql])
                run(["ssh", "vps-staging", "chown", "postgres:postgres", remote_sql])
                try:
                    run(["ssh", "vps-staging", "sudo", "-u", "postgres", "psql", "-X", "-v", "ON_ERROR_STOP=1", "--single-transaction", "-d", PCP, "-f", remote_sql])
                finally:
                    run(["ssh", "vps-staging", "rm", "-f", remote_sql])
                if remote_counts("vps-staging", PCP) != stage_counts:
                    raise RuntimeError("PCP post-refresh counts differ; restore validated backup")
                print(f"pcp_refresh=ok tables={len(names)} rows={sum(stage_counts.values())}")
            finally:
                run(["ssh", "vps-staging", "sudo", "-u", "postgres", "dropdb", "--if-exists", stage])
        finally:
            run(["ssh", "vps-staging", "rm", "-f", remote_dump])
    result = run(["ssh", "vps-staging", MAPA_PYTHON, MAPA_SCRIPT]).decode()
    print(result.strip().splitlines()[-1])
    print("both_snapshots=ok")


if __name__ == "__main__":
    main()

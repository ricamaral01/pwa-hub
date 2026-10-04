"""Read only: compare PCP simulator column types in official and test databases."""
from __future__ import annotations

import json
import subprocess

SOURCE = r'''
import os
import sys
os.chdir(sys.argv[1])
sys.path.insert(0, os.getcwd())
if len(sys.argv) > 2:
    for line in open(sys.argv[2], encoding="utf-8"):
        if line.strip() and not line.lstrip().startswith("#") and "=" in line:
            key, value = line.strip().split("=", 1)
            os.environ[key] = value
from sqlalchemy import text
from app.core.database import SessionLocal
with SessionLocal() as db:
    rows = db.execute(text("""SELECT table_name, column_name, data_type
        FROM information_schema.columns
        WHERE table_schema='public' AND
          (table_name='mapeamento_forma_postes' AND column_name='codigo_forma'
           OR table_name='formas' AND column_name='id')
        ORDER BY table_name, column_name""")).all()
    operators = db.execute(text("""SELECT count(*) FROM pg_operator
        WHERE oprname='=' AND
        ((oprleft='character varying'::regtype AND oprright='integer'::regtype)
         OR (oprleft='integer'::regtype AND oprright='character varying'::regtype))""")).scalar_one()
    print(__import__('json').dumps({'columns': [list(row) for row in rows],
                                   'varchar_integer_equal_operators': operators}))
'''


def main() -> None:
    systems = {
        "oficial": ("vps-rh", "/opt/pcp-concrefer/venv/bin/python",
                    "/opt/pcp-concrefer"),
        "teste": ("vps-staging",
                  "/opt/concrefer-unificado/pcp-api/.venv-py310/bin/python",
                  "/opt/concrefer-unificado/pcp-api",
                  "/etc/pcp-unificado/pcp.env"),
    }
    report = {}
    for name, args in systems.items():
        result = subprocess.run(["ssh", args[0], args[1], "-", *args[2:]],
                                input=SOURCE, text=True, capture_output=True, check=True)
        report[name] = json.loads(result.stdout)
    print(json.dumps(report, ensure_ascii=False))


if __name__ == "__main__":
    main()

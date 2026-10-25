"""Gera sessões IAM efêmeras de teste para smoke sem acionar limite de login.

Executar apenas na homologação, sob /tmp/suprimentos-env-run-homolog.sh.
Arquivo de saída protegido, fora do webroot; não imprimir tokens.
"""
from __future__ import annotations

import json
import os
import sys
from pathlib import Path

if os.getenv("SUPRIMENTOS_ENVIRONMENT") != "homolog":
    raise RuntimeError("Somente homologação")
sys.path.insert(0, "/opt/concrefer-unificado/homolog-next/mapa-api")
from app import connect, signer  # noqa: E402

USERS = ("e2e-suprimentos-sol", "e2e-suprimentos-aprov1", "e2e-suprimentos-aprov2",
         "e2e-suprimentos-almox", "e2e-suprimentos-compras", "e2e-suprimentos-qualidade")
output = Path(sys.argv[1]).resolve()
if Path("/opt/concrefer-unificado/homolog-next/backups") not in output.parents:
    raise RuntimeError("Saída fora de backup protegido")
with connect() as db, db.cursor() as cursor:
    cursor.execute("""SELECT id,updated_at FROM public.usuarios
                      WHERE id=ANY(%s) AND ativo AND NOT primeiro_acesso AND deleted_at IS NULL""", (list(USERS),))
    rows = {r["id"]: r for r in cursor.fetchall()}
if set(rows) != set(USERS):
    raise RuntimeError("Contas sintéticas indisponíveis")
tokens = {user: signer().dumps({"scope": "session", "id": user,
                               "updated_at": rows[user]["updated_at"].isoformat()}) for user in USERS}
output.write_text(json.dumps(tokens), encoding="utf-8")
output.chmod(0o600)
print("SMOKE_SESSIONS_OK usuarios=" + str(len(tokens)))

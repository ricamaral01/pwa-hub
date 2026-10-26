"""Concessões de telas S3-A apenas às contas de ensaio da homologação.

Executar pelo wrapper /tmp/suprimentos-env-run-homolog.sh na VPS nova.
Não imprime credenciais, hashes ou tokens.
"""
from __future__ import annotations
import json
import os
from pathlib import Path
import psycopg
from psycopg.rows import dict_row

DEST = Path(os.environ["SUPRIMENTOS_F1_GRANTS_BACKUP"])
assert "/homolog-next/backups/suprimentos-f1-" in str(DEST)
GRANTS = {
    "e2e-suprimentos-compras": ("suprimentosCotacoes", "suprimentosFornecedores"),
    "e2e-suprimentos-qualidade": ("suprimentosCotacoes", "suprimentosFornecedores"),
    "e2e-suprimentos-aprov1": ("suprimentosCotacoes",),
    "e2e-suprimentos-aprov2": ("suprimentosCotacoes",),
    "e2e-suprimentos-almox": ("suprimentosCotacoes",),
    "ricardo.teste": ("suprimentosCotacoes", "suprimentosFornecedores"),
}
with psycopg.connect(os.environ["MAPA_AUTH_DATABASE_URL"], row_factory=dict_row) as db:
    with db.cursor() as cur:
        cur.execute("""SELECT column_name, data_type FROM information_schema.columns
          WHERE table_schema='unificado_auth' AND table_name='user_screen_permissions'
          ORDER BY ordinal_position""")
        columns={row["column_name"]:row["data_type"] for row in cur.fetchall()}
        print("GRANT_COLUMNS", ",".join(columns))
        assert {"user_id","screen_id","allowed"} <= columns.keys()
        cur.execute("""SELECT user_id,screen_id,allowed FROM unificado_auth.user_screen_permissions
          WHERE user_id=ANY(%s) AND screen_id IN ('suprimentosCotacoes','suprimentosFornecedores')""",
          (list(GRANTS),))
        before=cur.fetchall()
        DEST.write_text(json.dumps(before,ensure_ascii=False,indent=2),encoding="utf-8")
        DEST.chmod(0o600)
        if set(columns)=={"user_id","screen_id","allowed","updated_by","updated_at"}:
            for user,screens in GRANTS.items():
                for screen in screens:
                    cur.execute("""INSERT INTO unificado_auth.user_screen_permissions
                      (user_id,screen_id,allowed,updated_by,updated_at)
                      VALUES (%s,%s,true,'deploy:suprimentos-F1',now())
                      ON CONFLICT (user_id,screen_id)
                      DO UPDATE SET allowed=excluded.allowed,
                        updated_by=excluded.updated_by,updated_at=excluded.updated_at""",(user,screen))
        else:
            raise RuntimeError("Esquema IAM inesperado; concessão manual segura necessária")
    db.commit()
print("GRANTS_OK",sum(map(len,GRANTS.values())))

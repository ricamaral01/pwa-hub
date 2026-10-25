"""Lista apenas IDs e perfis de contas de teste da IAM de homologação."""
from __future__ import annotations
import sys
from pathlib import Path
sys.path.insert(0,str(Path.cwd()))
from app import connect

with connect() as conn, conn.cursor() as cur:
    cur.execute("""SELECT id,perfil FROM public.usuarios
                   WHERE ativo AND NOT primeiro_acesso AND deleted_at IS NULL
                     AND (id LIKE 'e2e-%' OR id LIKE '%teste%' OR id LIKE 'test-%')
                   ORDER BY id LIMIT 40""")
    for row in cur.fetchall():
        print(f"{row['id']} | {row['perfil']}")

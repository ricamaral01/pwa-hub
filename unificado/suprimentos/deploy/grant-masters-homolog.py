"""Concede acesso de ensaio aos masters existentes, somente em Campinas/:18446.

Uso no host de homologação, com os envs do Mapa e do Suprimentos carregados:
  python grant-masters-homolog.py grant <diretorio-protegido-de-backup>
  python grant-masters-homolog.py rollback <diretorio-protegido-de-backup>

O rollback remove só os IDs inseridos por esta execução. Nenhuma credencial é
escrita ou impressa.
"""
from __future__ import annotations

import json
import os
import sys
from pathlib import Path

import psycopg
from psycopg.rows import dict_row

MAPA_DIR = Path("/opt/concrefer-unificado/homolog-next/mapa-api")
SERVICE_DIR = Path("/opt/concrefer-unificado/homolog-next/suprimentos/service")
sys.path.insert(0, str(MAPA_DIR))
sys.path.insert(1, str(SERVICE_DIR))

from app import connect  # noqa: E402
from screen_access import MASTER_USER_IDS  # noqa: E402
from suprimentos.ids import uuid7  # noqa: E402


def main() -> None:
    if len(sys.argv) != 3 or sys.argv[1] not in {"grant", "rollback"}:
        raise SystemExit("Uso: grant-masters-homolog.py grant|rollback <backup>")
    action, backup = sys.argv[1], Path(sys.argv[2]).resolve()
    if not str(backup).startswith("/opt/concrefer-unificado/homolog-next/backups/"):
        raise RuntimeError("Backup fora da homologação")
    if not backup.is_dir() or backup.stat().st_mode & 0o077:
        raise RuntimeError("Backup ausente ou sem modo 0700")
    if os.getenv("SUPRIMENTOS_ENVIRONMENT") != "homolog":
        raise RuntimeError("Ambiente não é homologação")
    dsn = os.environ["SUPRIMENTOS_DATABASE_URL"].replace(
        "postgresql+psycopg://", "postgresql://", 1
    )
    if "suprimentos_homolog_20261025" not in dsn:
        raise RuntimeError("Banco inesperado")
    manifest = backup / "masters-inserted-roles.json"

    if action == "rollback":
        ids = json.loads(manifest.read_text(encoding="utf-8"))
        with psycopg.connect(dsn) as database, database.cursor() as cursor:
            for role_id in ids:
                cursor.execute("DELETE FROM suprimentos.sup_usuario_papel WHERE id=%s", (role_id,))
            database.commit()
        print(f"MASTER_ROLLBACK_OK removidos={len(ids)}")
        return

    if manifest.exists():
        raise RuntimeError("Concessão já executada neste backup")
    masters = sorted(MASTER_USER_IDS)
    with connect() as iam, iam.cursor() as cursor:
        cursor.execute("""SELECT id,nome,perfil FROM public.usuarios
                          WHERE id=ANY(%s) AND ativo AND NOT primeiro_acesso
                            AND deleted_at IS NULL""", (masters,))
        active = {row["id"]: row for row in cursor.fetchall()}
    if set(active) != set(masters):
        raise RuntimeError("Alguma conta master não está ativa na IAM de homologação")

    inserted: list[str] = []
    with psycopg.connect(dsn, row_factory=dict_row) as database, database.cursor() as cursor:
        cursor.execute("SELECT id FROM suprimentos.sup_unidade WHERE codigo='campinas' AND ativo")
        unit = cursor.fetchone()
        if not unit:
            raise RuntimeError("Campinas indisponível")
        cursor.execute("SELECT habilitado FROM suprimentos.sup_flag WHERE unidade_id=%s AND fase='S1'", (unit["id"],))
        flag = cursor.fetchone()
        if not flag or not flag["habilitado"]:
            raise RuntimeError("S1 desabilitada em Campinas")
        for user in masters:
            for role, level in (("ADMIN", None), ("APROVADOR", 1), ("APROVADOR", 2)):
                cursor.execute("""SELECT id FROM suprimentos.sup_usuario_papel
                                  WHERE iam_user_id=%s AND unidade_id=%s AND papel=%s
                                    AND cc_id IS NULL AND nivel IS NOT DISTINCT FROM %s
                                    AND ativo""", (user, unit["id"], role, level))
                if cursor.fetchone():
                    continue
                role_id = str(uuid7())
                cursor.execute("""INSERT INTO suprimentos.sup_usuario_papel
                                  (id,iam_user_id,unidade_id,papel,cc_id,nivel,criado_por,atualizado_por)
                                  VALUES (%s,%s,%s,%s,NULL,%s,'user-ricardo','user-ricardo')""",
                               (role_id, user, unit["id"], role, level))
                inserted.append(role_id)
        database.commit()
    manifest.write_text(json.dumps(inserted, indent=2), encoding="utf-8")
    manifest.chmod(0o600)
    print("MASTER_GRANT_OK usuarios=" + ",".join(masters) + f" novas_concessoes={len(inserted)}")


if __name__ == "__main__":
    main()

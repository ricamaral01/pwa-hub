"""Planeja ou remove a massa DEMO S1/F1/F2/F3/F6 da homologação.

Padrão: somente plano. --execute exige os três manifestos, banco de homologação,
backup externo recente e validação dos prefixos. Não usar em produção.
"""
from __future__ import annotations

import json
import os
import sys
from collections import Counter
from pathlib import Path
from uuid import UUID

import psycopg
from psycopg import sql
from psycopg.rows import dict_row


def read(path, prefix):
    data = json.loads(Path(path).read_text(encoding="utf-8"))
    if data.get("prefix") != prefix:
        raise RuntimeError(f"Manifesto {prefix} divergente")
    return data


def _is_uuid(value):
    try:
        UUID(value)
        return True
    except (ValueError, TypeError):
        return False


def main(argv):
    if len(argv) != 5 or argv[1] not in ("--plan", "--execute"):
        raise SystemExit("Uso: cleanup-f6-demo-homolog.py --plan|--execute S1.json F1.json F6.json")
    if os.environ.get("SUPRIMENTOS_ENVIRONMENT") != "homolog":
        raise RuntimeError("Exclusivo de homologação")
    dsn = os.environ["SUPRIMENTOS_DATABASE_URL"].replace("postgresql+psycopg://", "postgresql://", 1)
    if "suprimentos_homolog_20261025" not in dsn:
        raise RuntimeError("Banco divergente")
    s1, f1, f6 = read(argv[2], "DEMO-MANUAL-20261025"), json.loads(Path(argv[3]).read_text()), read(argv[4], "DEMO-F6-20261026")
    roots = [
        ("sup_pedido", [*f6["orders"].values(), f1["pedido"]]),
        ("sup_cotacao", [*f6["quotes"].values(), f1["cotacao"]]),
        ("sup_solicitacao", [*f6["requests"].values(), f6["stock_request"], f1["solicitacao"],
                             *[x["id"] for x in s1["requests"].values()]]),
        ("sup_recebimento", [*f6["receipts"].values()]),
        ("sup_inventario", [f6["inventory"]]),
        ("sup_colaborador", [f6["employee"]]),
        ("sup_fornecedor_unidade", [*f1["fornecedores"], *f6["fornecedores"]]),
        ("sup_usuario_papel", s1["roles"]),
        ("sup_centro_custo", [s1["cc"]]),
    ]
    mode = argv[1]
    with psycopg.connect(dsn, row_factory=dict_row) as db:
        cur = db.cursor()
        if mode == "--execute":
            cur.execute("SELECT pg_advisory_xact_lock(hashtext('cleanup-suprimentos-demo'))")
        cur.execute("SELECT id, codigo FROM suprimentos.sup_material WHERE codigo LIKE 'DEMO-F2-%'")
        materials = cur.fetchall()
        if len(materials) != 3:
            raise RuntimeError("Materiais DEMO-F2 divergentes")
        roots.append(("sup_material", [x["id"] for x in materials]))
        cur.execute("SELECT id FROM suprimentos.sup_local WHERE nome='DEMO-F2 Almoxarifado'")
        locals_ = cur.fetchall()
        if len(locals_) != 1:
            raise RuntimeError("Local DEMO-F2 divergente")
        roots.append(("sup_local", [locals_[0]["id"]]))
        supplier_profiles = [*f1["fornecedores"], *f6["fornecedores"]]
        cur.execute("""SELECT DISTINCT f.id, f.razao FROM suprimentos.sup_fornecedor_unidade u
            JOIN suprimentos.sup_fornecedor f ON f.id=u.fornecedor_id
            WHERE u.id=ANY(%s::uuid[])""", (supplier_profiles,))
        supplier_rows = cur.fetchall()
        if len(supplier_rows) != 4 or any(not x["razao"].startswith("DEMO-") for x in supplier_rows):
            raise RuntimeError("Fornecedores não são o conjunto DEMO esperado")
        roots.append(("sup_fornecedor", [x["id"] for x in supplier_rows]))
        cur.execute("SELECT id FROM suprimentos.sup_fornecedor_avaliacao WHERE comentario LIKE 'DEMO-F6%'")
        roots.append(("sup_fornecedor_avaliacao", [x["id"] for x in cur.fetchall()]))
        if mode == "--execute":
            backup = Path(os.environ.get("SUPRIMENTOS_DEMO_CLEANUP_BACKUP", ""))
            if not backup.is_file() or backup.stat().st_size < 1000 or "homolog-next/backups" not in str(backup):
                raise RuntimeError("Informe backup de banco recente em SUPRIMENTOS_DEMO_CLEANUP_BACKUP")
        fk_cache, seen, counts, ids, files = {}, set(), Counter(), set(), set()

        def table_sql(table):
            if not table.startswith("sup_") or not table.replace("_", "").isalnum():
                raise RuntimeError("Tabela inesperada: " + table)
            return sql.Identifier("suprimentos", table)

        def foreign_keys(table):
            if table not in fk_cache:
                cur.execute("""SELECT c.conrelid::regclass::text AS child,
                  ARRAY(SELECT a.attname FROM unnest(c.conkey) WITH ORDINALITY AS k(n,ord)
                        JOIN pg_attribute a ON a.attrelid=c.conrelid AND a.attnum=k.n ORDER BY k.ord) AS child_cols,
                  ARRAY(SELECT a.attname FROM unnest(c.confkey) WITH ORDINALITY AS k(n,ord)
                        JOIN pg_attribute a ON a.attrelid=c.confrelid AND a.attnum=k.n ORDER BY k.ord) AS parent_cols
                  FROM pg_constraint c WHERE c.contype='f' AND c.confrelid=to_regclass(%s)""",
                            ("suprimentos." + table,))
                fk_cache[table] = cur.fetchall()
            return fk_cache[table]

        def walk(table, row):
            key = (table, row["_ctid"])
            if key in seen:
                return
            seen.add(key)
            if row.get("id") is not None:
                ids.add(str(row["id"]))
            for name in ("storage_path", "anexo_path"):
                if row.get(name):
                    files.add(str(row[name]))
            for fk in foreign_keys(table):
                child = fk["child"].split(".")[-1]
                if not child.startswith("sup_"):
                    continue
                predicates = sql.SQL(" AND ").join(sql.SQL("{} = %s").format(sql.Identifier(col)) for col in fk["child_cols"])
                values = [row[col] for col in fk["parent_cols"]]
                cur.execute(sql.SQL("SELECT ctid::text AS _ctid,* FROM {} WHERE ").format(table_sql(child)) + predicates, values)
                for dependent in cur.fetchall():
                    walk(child, dependent)
            counts[table] += 1
            if mode == "--execute":
                cur.execute(sql.SQL("DELETE FROM {} WHERE ctid=%s::tid").format(table_sql(table)), (row["_ctid"],))

        for table, row_ids in roots:
            for row_id in row_ids:
                cur.execute(sql.SQL("SELECT ctid::text AS _ctid,* FROM {} WHERE id=%s").format(table_sql(table)), (row_id,))
                row = cur.fetchone()
                if row:
                    if table == "sup_solicitacao" and "DEMO" not in str(row.get("justificativa", "")):
                        raise RuntimeError("Solicitação sem marca DEMO")
                    if table == "sup_centro_custo" and row["codigo"] != "DEMO-MANUAL-20261025":
                        raise RuntimeError("CC sem marca DEMO")
                    walk(table, row)
        event_ids = [value for value in ids if _is_uuid(value)]
        cur.execute("SELECT count(*) AS n FROM suprimentos.sup_evento WHERE alvo_id=ANY(%s::uuid[])", (event_ids,))
        counts["sup_evento"] = cur.fetchone()["n"]
        if mode == "--execute":
            cur.execute("DELETE FROM suprimentos.sup_evento WHERE alvo_id=ANY(%s::uuid[])", (event_ids,))
            if cur.rowcount != counts["sup_evento"]:
                raise RuntimeError("Eventos DEMO mudaram durante a limpeza")
            db.commit()
            for value in files:
                target = Path(value).resolve()
                if "/homolog-next/suprimentos/data/" in str(target):
                    target.unlink(missing_ok=True)
        else:
            db.rollback()
    print("DEMO_CLEANUP", mode, "tabelas=", dict(sorted(counts.items())), "arquivos_privados=", len(files))


if __name__ == "__main__":
    main(sys.argv)

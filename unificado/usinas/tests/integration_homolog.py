"""Integration gate for the isolated synthetic source and homolog mirror only."""

from __future__ import annotations

import sys
from pathlib import Path
from uuid import uuid4

import psycopg
from psycopg.rows import dict_row

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from sync_receitas import sync_once  # noqa: E402


SOURCE_DB = "usinas_source_homolog_20261022"
TARGET_DB = "mapa_unificado_homolog_20261016"
SOURCE_DSN = f"dbname={SOURCE_DB}"
TARGET_DSN = f"dbname={TARGET_DB}"


def connect_checked(dsn: str, expected: str):
    conn = psycopg.connect(dsn, row_factory=dict_row)
    actual = conn.execute("SELECT current_database() AS name").fetchone()["name"]
    if actual != expected:
        conn.close()
        raise RuntimeError("Banco de teste inesperado")
    conn.commit()
    return conn


def mirror_row(conn, row_id: int):
    return conn.execute(
        "SELECT origem_id, cimento1, revisao_numero, _source_hash, ingested_at "
        "FROM usinas.receitas WHERE unidade_id='campinas' AND origem_id=%s",
        (row_id,),
    ).fetchone()


def main():
    with connect_checked(SOURCE_DSN, SOURCE_DB) as source:
        source.execute("TRUNCATE public.tbl_receitas")
        source.execute("""
            INSERT INTO public.tbl_receitas
                (id, nome, nome_traco, ativa, alterado, revisao_grupo,
                 revisao_numero, cimento1, created_at)
            VALUES
                (1, 'Teste C30', 'Teste C30', true, 1,
                 '8bc60283-c753-4f3b-b388-f44fcd3f8412', 1, 350.00,
                 '2026-10-22 12:00:00'),
                (2, 'Teste C35', 'Teste C35', true, 1,
                 'a4888de4-f58e-4992-8c4e-aed5a9802bce', 1, 400.00,
                 '2026-10-22 12:00:00')
        """)
    assert sync_once(SOURCE_DSN, TARGET_DSN, expected_source_db=SOURCE_DB)["source_count"] == 2
    with connect_checked(TARGET_DSN, TARGET_DB) as target:
        first = mirror_row(target, 1)
        assert first and str(first["cimento1"]) == "350.00"
        first_time = first["ingested_at"]
        first_hash = first["_source_hash"]
        assert target.execute("SELECT count(*) AS n FROM usinas.receitas").fetchone()["n"] == 2

    sync_once(SOURCE_DSN, TARGET_DSN, expected_source_db=SOURCE_DB)
    with connect_checked(TARGET_DSN, TARGET_DB) as target:
        assert mirror_row(target, 1)["ingested_at"] == first_time
    print("E1 repeticao sem duplicata/reescrita: OK")

    with connect_checked(SOURCE_DSN, SOURCE_DB) as source:
        source.execute("UPDATE public.tbl_receitas SET cimento1=351 WHERE id=1")
        source.execute("DELETE FROM public.tbl_receitas WHERE id=2")
        source.execute("""
            INSERT INTO public.tbl_receitas
                (id, nome, nome_traco, ativa, alterado, revisao_grupo,
                 revisao_numero, revisao_origem_id, cimento1)
            VALUES (3, 'Teste C30 rev2', 'Teste C30', true, 1,
                    '8bc60283-c753-4f3b-b388-f44fcd3f8412', 2, 1, 355)
        """)
    sync_once(SOURCE_DSN, TARGET_DSN, expected_source_db=SOURCE_DB)
    with connect_checked(TARGET_DSN, TARGET_DB) as target:
        changed = mirror_row(target, 1)
        assert str(changed["cimento1"]) == "351" and changed["_source_hash"] != first_hash
        assert mirror_row(target, 2) is None
        assert mirror_row(target, 3)["revisao_numero"] == 2
        assert target.execute("SELECT source_count, mirror_count FROM usinas.sync_status").fetchone() == {
            "source_count": 2, "mirror_count": 2
        }
    print("E2 alteracao/exclusao/revisao e hash: OK")

    with connect_checked(SOURCE_DSN, SOURCE_DB) as source:
        source.execute("UPDATE public.tbl_receitas SET cimento1=352 WHERE id=1")
    assert sync_once(SOURCE_DSN, TARGET_DSN, [1], SOURCE_DB)["source_count"] == 1
    with connect_checked(TARGET_DSN, TARGET_DB) as target:
        assert str(mirror_row(target, 1)["cimento1"]) == "352"
        assert mirror_row(target, 3)["revisao_numero"] == 2
    print("E3 refresh imediato por ID: OK")

    try:
        sync_once(f"dbname={SOURCE_DB} host=127.0.0.1 port=1 connect_timeout=1",
                  TARGET_DSN, expected_source_db=SOURCE_DB)
    except psycopg.OperationalError:
        pass
    else:
        raise AssertionError("Origem indisponivel deveria falhar")
    with connect_checked(TARGET_DSN, TARGET_DB) as target:
        assert str(mirror_row(target, 1)["cimento1"]) == "352"
    print("E4 origem indisponivel preserva espelho: OK")

    with connect_checked(TARGET_DSN, TARGET_DB) as target:
        flags = target.execute(
            "SELECT bool_or(despacho_habilitado) AS enabled FROM usinas_write.permissions"
        ).fetchone()
        assert flags["enabled"] is False
        try:
            target.execute("""
                INSERT INTO usinas_write.outbox
                    (operation_id, idempotency_key, unidade_id, origem_tabela,
                     acao, ator_iam, payload)
                VALUES (%s,%s,'campinas','tbl_receitas','criar','teste','{}')
            """, (uuid4(), "guard-test"))
        except psycopg.errors.InsufficientPrivilege:
            target.rollback()
        else:
            raise AssertionError("Outbox deveria bloquear insercao")
    print("E5 despacho desabilitado bloqueia outbox: OK")

    target = connect_checked(TARGET_DSN, TARGET_DB)
    try:
        target.execute("""
            UPDATE usinas_write.permissions
            SET despacho_habilitado=true, aprovado_por='teste_transacao', aprovado_em=now()
            WHERE unidade_id='campinas' AND origem_tabela='tbl_receitas' AND acao='criar'
        """)
        first_id = uuid4()
        target.execute("""
            INSERT INTO usinas_write.outbox
                (operation_id, idempotency_key, unidade_id, origem_tabela,
                 acao, ator_iam, payload)
            VALUES (%s,'mesma-chave','campinas','tbl_receitas','criar','teste','{}')
        """, (first_id,))
        duplicate = target.execute("""
            INSERT INTO usinas_write.outbox
                (operation_id, idempotency_key, unidade_id, origem_tabela,
                 acao, ator_iam, payload)
            VALUES (%s,'mesma-chave','campinas','tbl_receitas','criar','teste','{}')
            ON CONFLICT (idempotency_key) DO NOTHING RETURNING operation_id
        """, (uuid4(),)).fetchone()
        assert duplicate is None
    finally:
        target.rollback()  # flag temporaria e eventos nunca sao confirmados
        target.close()
    with connect_checked(TARGET_DSN, TARGET_DB) as target:
        assert not target.execute("SELECT despacho_habilitado FROM usinas_write.permissions").fetchone()["despacho_habilitado"]
        assert target.execute("SELECT count(*) AS n FROM usinas_write.outbox").fetchone()["n"] == 0
    print("E6 chave unica e rollback da flag/eventos: OK")

    with connect_checked(SOURCE_DSN, SOURCE_DB) as source:
        source.execute("ALTER TABLE public.tbl_receitas ADD COLUMN coluna_inesperada text")
    try:
        try:
            sync_once(SOURCE_DSN, TARGET_DSN, expected_source_db=SOURCE_DB)
        except RuntimeError as exc:
            assert str(exc) == "Contrato de colunas da origem mudou"
        else:
            raise AssertionError("Mudanca de esquema deveria bloquear o ciclo")
    finally:
        with connect_checked(SOURCE_DSN, SOURCE_DB) as source:
            source.execute("ALTER TABLE public.tbl_receitas DROP COLUMN coluna_inesperada")
    with connect_checked(TARGET_DSN, TARGET_DB) as target:
        assert target.execute("SELECT count(*) AS n FROM usinas.receitas").fetchone()["n"] == 2
    print("E7 mudanca de esquema bloqueia sincronizacao: OK")


if __name__ == "__main__":
    main()

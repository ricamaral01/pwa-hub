import importlib.util
import os
import subprocess
from pathlib import Path

GUARD = Path(__file__).resolve().parents[2] / "deploy/scripts/verificar-migracoes.py"
SPEC = importlib.util.spec_from_file_location("migration_guard41", GUARD)
MODULE = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(MODULE)


def test_d1_drop_column_blocked():
    assert "DROP" in MODULE.violations("ALTER TABLE traco_versoes DROP COLUMN snapshot;")
    assert "UPDATE" in MODULE.violations("UPDATE traco_versoes SET estado = 'aprovado';")
    assert "SET NOT NULL" in MODULE.violations("ALTER TABLE traco_versoes ALTER COLUMN estado SET NOT NULL;")


def test_additive_sql_and_function_body_allowed():
    sql = """CREATE TABLE material_versoes (id bigint PRIMARY KEY);
    CREATE FUNCTION imutavel() RETURNS trigger LANGUAGE plpgsql AS $body$
    BEGIN IF OLD.estado = 'aprovado' THEN RAISE EXCEPTION 'UPDATE blocked'; END IF; RETURN NEW; END
    $body$;
    UPDATE alembic_version SET version_num='20261018_02' WHERE version_num='20261017_01';"""
    assert MODULE.violations(sql) == []


def test_actual_alembic_upgrade_is_additive():
    api = Path(__file__).resolve().parents[1]
    env = {**os.environ, "DATABASE_URL": "postgresql+psycopg://placeholder:placeholder@127.0.0.1:5432/placeholder"}
    result = subprocess.run([os.sys.executable, "-m", "alembic", "upgrade", "head", "--sql"],
                            cwd=api, env=env, capture_output=True)
    assert result.returncode == 0, result.stderr.decode("utf-8", "replace")
    assert MODULE.violations(result.stdout.decode("utf-8", "replace")) == []

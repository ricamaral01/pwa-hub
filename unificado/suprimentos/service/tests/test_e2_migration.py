"""Migração em banco descartável vazio, isolada dos testes de negócio."""
import os
import uuid
from pathlib import Path
import pytest
from alembic import command
from alembic.config import Config
from sqlalchemy import create_engine, text

ADMIN_URL = os.getenv("SUPRIMENTOS_TEST_ADMIN_URL")
pytestmark = pytest.mark.skipif(not ADMIN_URL, reason="SUPRIMENTOS_TEST_ADMIN_URL ausente")
ROOT = Path(__file__).resolve().parents[2]


def test_upgrade_downgrade_upgrade_empty():
    name = "sup_mig_" + uuid.uuid4().hex[:12]
    admin = create_engine(ADMIN_URL, isolation_level="AUTOCOMMIT")
    with admin.connect() as conn:
        conn.execute(text(f'CREATE DATABASE "{name}" ENCODING \'UTF8\' TEMPLATE template0 LC_COLLATE \'C\' LC_CTYPE \'C\''))
    url = ADMIN_URL.rsplit("/", 1)[0] + "/" + name
    prior = os.environ.get("SUPRIMENTOS_MIGRATION_DATABASE_URL")
    os.environ["SUPRIMENTOS_MIGRATION_DATABASE_URL"] = url
    os.environ["SUPRIMENTOS_ENVIRONMENT"] = "homolog"
    cfg = Config(str(ROOT / "migrations" / "alembic.ini"))
    cfg.set_main_option("script_location", str(ROOT / "migrations"))
    try:
        command.upgrade(cfg, "head")
        command.downgrade(cfg, "base")
        command.upgrade(cfg, "head")
        engine = create_engine(url)
        with engine.connect() as conn:
            assert conn.execute(text("SELECT to_regclass('suprimentos.sup_solicitacao') IS NOT NULL")).scalar_one()
        engine.dispose()
    finally:
        if prior is None:
            os.environ.pop("SUPRIMENTOS_MIGRATION_DATABASE_URL", None)
        else:
            os.environ["SUPRIMENTOS_MIGRATION_DATABASE_URL"] = prior
        with admin.connect() as conn:
            conn.execute(text(f'DROP DATABASE "{name}" WITH (FORCE)'))
        admin.dispose()

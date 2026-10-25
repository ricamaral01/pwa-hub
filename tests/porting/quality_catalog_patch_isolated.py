"""Exercise catalog edits only against the restored Quality rehearsal database."""
from __future__ import annotations

from uuid import UUID

from sqlalchemy import MetaData, create_engine, insert, select, delete
from sqlalchemy.orm import Session

from quality import db as quality_db
from quality.api import create_catalog, patch_catalog, patch_contact
from quality.auth import Actor
from quality.models import CatalogIn, CatalogPatch, ContactPatch


def main() -> None:
    engine = create_engine(
        "postgresql+psycopg:///qualidade_freeze_restore_20261015?host=/var/run/postgresql"
    )
    metadata = MetaData(schema="qualidade")
    metadata.reflect(bind=engine, schema="qualidade")
    quality_db.database = lambda: (engine, metadata)
    origin = metadata.tables["qualidade.origem"]
    gravity = metadata.tables["qualidade.gravidade"]
    contact = metadata.tables["qualidade.usuario_contato"]
    admin = Actor("layout-probe", "Layout probe", frozenset({"qualidade.nc.cadastros"}))
    with Session(engine) as session:
        original = session.execute(select(origin).order_by(origin.c.nome).limit(1)).mappings().one()
        item_id = UUID(str(original["id"]))
        session.rollback()
        changed = patch_catalog("origem", item_id, CatalogPatch(nome="TESTE Layout"), admin, session)
        assert changed["nome"] == "TESTE Layout"
        changed = patch_catalog("origem", item_id, CatalogPatch(ativo=False), admin, session)
        assert changed["ativo"] is False
        patch_catalog("origem", item_id, CatalogPatch(nome=original["nome"], ativo=original["ativo"]), admin, session)
        company_id = UUID(str(original["empresa_id"]))
        created = create_catalog("gravidade", CatalogIn(
            empresa_id=company_id, codigo="TESTE_LAYOUT", nome="Teste layout",
            prazo_causa_dias=3, prazo_final_dias=10,
            acao_corretiva_obrigatoria=True, corretiva_se_recorrente=False,
        ), admin, session)
        gravity_id = UUID(created["id"])
        patch_catalog("gravidade", gravity_id, CatalogPatch(prazo_final_dias=12, ativo=False), admin, session)
        gravity_row = session.execute(select(gravity).where(gravity.c.id == gravity_id)).mappings().one()
        assert gravity_row["prazo_final_dias"] == 12 and gravity_row["ativo"] is False
        session.rollback()
        with session.begin():
            session.execute(delete(gravity).where(gravity.c.id == gravity_id))
        with session.begin():
            session.execute(insert(contact).values(usuario_id="layout-probe", email="layout@example.invalid", ativo=True))
        patch_contact("layout-probe", ContactPatch(email="layout2@example.invalid", ativo=False), admin, session)
        row = session.execute(select(contact).where(contact.c.usuario_id == "layout-probe")).mappings().one()
        assert row["email"] == "layout2@example.invalid" and row["ativo"] is False
        session.rollback()
        with session.begin():
            session.execute(delete(contact).where(contact.c.usuario_id == "layout-probe"))
    engine.dispose()
    print("catalog patch isolated rehearsal passed")


if __name__ == "__main__":
    try:
        main()
    except Exception as error:
        print(f"catalog patch rehearsal failed: {type(error).__name__}")
        raise SystemExit(1) from None

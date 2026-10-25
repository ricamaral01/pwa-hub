"""Initial dedicated Quality schema from approved B1 model.

Revision ID: 20261015_01
Revises:
"""
from __future__ import annotations

from pathlib import Path
from uuid import NAMESPACE_URL, uuid5

from alembic import op
from sqlalchemy import text


revision = "20261015_01"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    sql = (Path(__file__).resolve().parent.parent / "schema.sql").read_text(encoding="utf-8")
    # No bind parameters; psycopg executes the complete DDL in Alembic's transaction.
    conn = op.get_bind()
    conn.connection.cursor().execute(sql)
    seed(conn)


def uid(kind: str, code: str):
    return uuid5(NAMESPACE_URL, f"concretrack/qualidade/{kind}/{code}")


def seed(conn) -> None:
    """Stable reference data; inserts only, never overwrites operator changes."""
    company = uid("empresa", "CONCRETRACK")
    conn.execute(text("""INSERT INTO qualidade.empresa(id,codigo,nome,criado_por)
        VALUES (:id,'CONCRETRACK','ConcreTrack','migration:B1') ON CONFLICT DO NOTHING"""), {"id": company})
    for code, name in (("pederneiras", "Pederneiras"), ("ribeirao", "Ribeirão"),
                       ("noroeste", "Noroeste")):
        conn.execute(text("""INSERT INTO qualidade.unidade(codigo,empresa_id,nome,criado_por)
            VALUES (:code,:company,:name,'migration:B1') ON CONFLICT DO NOTHING"""),
            {"code": code, "company": company, "name": name})

    origins = (
        ("CLIENTE", "Cliente"), ("PROCESSO_INTERNO", "Processo interno"),
        ("FORNECEDOR", "Fornecedor"), ("AUDITORIA_INTERNA", "Auditoria interna"),
        ("AUDITORIA_EXTERNA", "Auditoria externa"), ("INSPECAO", "Inspeção"),
        ("SEGURANCA", "Segurança"), ("AMBIENTAL", "Ambiental"),
        ("RECLAMACAO", "Reclamação"), ("OUTRO", "Outro"),
    )
    types = (
        ("PRODUTO", "Produto"), ("PROCESSO", "Processo"),
        ("SISTEMA_GESTAO", "Sistema de gestão"), ("FORNECEDOR", "Fornecedor"),
        ("CLIENTE", "Cliente"), ("SEGURANCA", "Segurança"),
        ("AMBIENTAL", "Ambiental"), ("DOCUMENTAL", "Documental"), ("OUTRO", "Outro"),
    )
    for table, rows in (("origem", origins), ("tipo", types)):
        query = text(f"""INSERT INTO qualidade.{table}
            (id,empresa_id,codigo,nome,codigo_legado,ativo,criado_por)
            VALUES (:id,:company,:code,:name,:code,:active,'migration:B1')
            ON CONFLICT DO NOTHING""")
        for code, name in rows:
            conn.execute(query, {"id": uid(table, code), "company": company,
                                 "code": code, "name": name,
                                 "active": code not in {"SEGURANCA", "AMBIENTAL"}})

    gravities = (
        ("MAIOR", "Maior", 5, None, True, False),
        ("MENOR", "Menor", None, 15, False, True),
        ("OBSERVACAO", "Observação", None, 30, False, False),
    )
    for code, name, cause_days, final_days, mandatory, recurrent in gravities:
        conn.execute(text("""INSERT INTO qualidade.gravidade
            (id,empresa_id,codigo,nome,prazo_causa_dias,prazo_final_dias,
             acao_corretiva_obrigatoria,corretiva_se_recorrente,criado_por)
            VALUES (:id,:company,:code,:name,:cause,:final,:mandatory,:recurrent,'migration:B1')
            ON CONFLICT DO NOTHING"""),
            {"id": uid("gravidade", code), "company": company, "code": code,
             "name": name, "cause": cause_days, "final": final_days,
             "mandatory": mandatory, "recurrent": recurrent})
    for old, new in (("CRITICA", "MAIOR"), ("ALTA", "MAIOR"),
                     ("MEDIA", "MENOR"), ("BAIXA", "OBSERVACAO")):
        conn.execute(text("""INSERT INTO qualidade.gravidade_legado_mapa
            (empresa_id,codigo_legado,gravidade_id) VALUES (:company,:old,:new)
            ON CONFLICT DO NOTHING"""),
            {"company": company, "old": old, "new": uid("gravidade", new)})

    areas = ("LABORATORIO", "QUALIDADE", "PRODUCAO", "ENGENHARIA", "ADMINISTRATIVO",
             "SEGURANCA", "AEE", "COM", "CQC", "INJ", "MAN", "PCP", "PJT", "PRO",
             "REC", "RHU", "SGA", "SGQ", "SST", "VEN")
    for code in areas:
        conn.execute(text("""INSERT INTO qualidade.area
            (id,empresa_id,codigo,nome,codigo_legado,criado_por)
            VALUES (:id,:company,:code,:name,:code,'migration:B1') ON CONFLICT DO NOTHING"""),
            {"id": uid("area", code), "company": company, "code": code,
             "name": code.replace("_", " ").title() if len(code) > 3 else code})

    dispositions = (
        ("SEGREGAR_BLOQUEAR", "Segregar / bloquear", True),
        ("RETRABALHAR", "Retrabalhar", True),
        ("RECLASSIFICAR", "Reclassificar", True),
        ("SUCATEAR", "Sucatear", True),
        ("CONCESSAO", "Liberar sob concessão", True),
        ("DEVOLVER_FORNECEDOR", "Devolver ao fornecedor", True),
        ("LEGADO_NAO_INFORMADA", "Não informada (legado)", False),
    )
    for code, name, active in dispositions:
        conn.execute(text("""INSERT INTO qualidade.disposicao
            (id,empresa_id,codigo,nome,ativo,criado_por)
            VALUES (:id,:company,:code,:name,:active,'migration:B1') ON CONFLICT DO NOTHING"""),
            {"id": uid("disposicao", code), "company": company,
             "code": code, "name": name, "active": active})


def downgrade() -> None:
    raise RuntimeError("Destructive downgrade requires explicit approval")

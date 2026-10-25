"""Campinas e parâmetros provisórios, sem materiais nem fornecedores.

Revision ID: sup_0002
Revises: sup_0001
"""
import os
from alembic import op
from sqlalchemy import text
from suprimentos.ids import uuid7

revision = "sup_0002"
down_revision = "sup_0001"
branch_labels = None
depends_on = None

UNITS = ("un", "par", "kg", "t", "g", "m", "m²", "m³", "L", "mL", "tb", "cx", "rl", "pc", "jg")
PARAMS = {
    "fechamento_auto_horas": 48,
    "ajuste_inventario_sem_aprovacao": 200,
    "cotacao_minima_3_acima": 1000,
    "tolerancia_preco_oc_perc": 10,
    "sla_aprovacao_urgente_horas": 4,
    "sla_aprovacao_normal_horas": 24,
}

def upgrade():
    conn = op.get_bind()
    conn.execute(text("""INSERT INTO suprimentos.sup_unidade(id,codigo,nome,criado_por,atualizado_por)
                         VALUES (1,'campinas','Campinas','migration:sup_0002','migration:sup_0002')"""))
    for sigla in UNITS:
        conn.execute(text("""INSERT INTO suprimentos.sup_unidade_medida
          (id,sigla,descricao,criado_por,atualizado_por) VALUES (:id,:sigla,:sigla,'migration:sup_0002','migration:sup_0002')"""),
          {"id": uuid7(), "sigla": sigla})
    for key, value in PARAMS.items():
        conn.execute(text("""INSERT INTO suprimentos.sup_parametro
          (id,unidade_id,chave,valor,a_confirmar,criado_por,atualizado_por)
          VALUES (:id,1,:key,:value,true,'migration:sup_0002','migration:sup_0002')"""),
          {"id": uuid7(), "key": key, "value": value})
    for level, limit in ((1, 2500), (2, None)):
        conn.execute(text("""INSERT INTO suprimentos.sup_alcada
          (id,unidade_id,valor_ate,nivel,papel_aprovador,a_confirmar,criado_por,atualizado_por)
          VALUES (:id,1,:limit,:level,'APROVADOR',true,'migration:sup_0002','migration:sup_0002')"""),
          {"id": uuid7(), "limit": limit, "level": level})
    enabled = os.getenv("SUPRIMENTOS_ENVIRONMENT") == "homolog"
    for phase in ("S0", "S1"):
        conn.execute(text("""INSERT INTO suprimentos.sup_flag
          (id,unidade_id,fase,habilitado,criado_por,atualizado_por)
          VALUES (:id,1,:phase,:enabled,'migration:sup_0002','migration:sup_0002')"""),
          {"id": uuid7(), "phase": phase, "enabled": enabled})

def downgrade():
    conn = op.get_bind()
    for table in ("sup_flag", "sup_alcada", "sup_parametro", "sup_unidade_medida"):
        conn.execute(text(f"DELETE FROM suprimentos.{table} WHERE criado_por='migration:sup_0002'"))
    conn.execute(text("DELETE FROM suprimentos.sup_unidade WHERE id=1 AND criado_por='migration:sup_0002'"))

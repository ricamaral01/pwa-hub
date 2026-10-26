"""Almoxarifado geral: livro imutável, saldos, EPI e inventário.

Revision ID: sup_0007
Revises: sup_0006
"""
from alembic import op

revision = "sup_0007"
down_revision = "sup_0006"
branch_labels = None
depends_on = None

AUDIT = "criado_em timestamptz NOT NULL DEFAULT now(), criado_por text NOT NULL, atualizado_em timestamptz NOT NULL DEFAULT now(), atualizado_por text NOT NULL"


def upgrade():
    op.execute("""CREATE TABLE suprimentos.sup_movimento (
      id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
      unidade_id smallint NOT NULL REFERENCES suprimentos.sup_unidade(id),
      material_id uuid NOT NULL REFERENCES suprimentos.sup_material(id),
      endereco_id uuid NOT NULL,
      tipo text NOT NULL CHECK (tipo IN ('ENTRADA','ENTREGA','AJUSTE','TRANSFERENCIA','ESTORNO')),
      quantidade numeric(18,4) NOT NULL CHECK (quantidade <> 0),
      custo_unitario numeric(18,6) NOT NULL DEFAULT 0 CHECK (custo_unitario >= 0),
      custo_total numeric(18,2) NOT NULL DEFAULT 0,
      referencia_tipo text NOT NULL, referencia_id uuid,
      chave_idempotencia text NOT NULL, estorna_movimento_id bigint REFERENCES suprimentos.sup_movimento(id),
      efetivado_em timestamptz NOT NULL DEFAULT now(),
      criado_em timestamptz NOT NULL DEFAULT now(), criado_por text NOT NULL,
      FOREIGN KEY(endereco_id,unidade_id) REFERENCES suprimentos.sup_endereco(id,unidade_id),
      UNIQUE(unidade_id,chave_idempotencia),
      CHECK (efetivado_em <= criado_em + interval '1 minute'))""")
    op.execute("CREATE INDEX ix_sup_movimento_saldo ON suprimentos.sup_movimento(unidade_id,material_id,endereco_id,efetivado_em,id)")
    op.execute("CREATE INDEX ix_sup_movimento_referencia ON suprimentos.sup_movimento(unidade_id,referencia_tipo,referencia_id)")
    op.execute("""CREATE FUNCTION suprimentos.sup_movimento_imutavel() RETURNS trigger LANGUAGE plpgsql AS $$
      BEGIN RAISE EXCEPTION 'Movimento imutável: registre estorno'; END $$""")
    op.execute("CREATE TRIGGER trg_sup_movimento_imutavel BEFORE UPDATE OR DELETE ON suprimentos.sup_movimento FOR EACH ROW EXECUTE FUNCTION suprimentos.sup_movimento_imutavel()")
    op.execute("""CREATE TABLE suprimentos.sup_saldo (
      unidade_id smallint NOT NULL, material_id uuid NOT NULL, endereco_id uuid NOT NULL,
      quantidade numeric(18,4) NOT NULL DEFAULT 0 CHECK (quantidade >= 0),
      reservado numeric(18,4) NOT NULL DEFAULT 0 CHECK (reservado >= 0 AND reservado <= quantidade),
      atualizado_em timestamptz NOT NULL DEFAULT now(),
      PRIMARY KEY(unidade_id,material_id,endereco_id),
      FOREIGN KEY(endereco_id,unidade_id) REFERENCES suprimentos.sup_endereco(id,unidade_id),
      FOREIGN KEY(material_id,unidade_id) REFERENCES suprimentos.sup_material_unidade(material_id,unidade_id))""")
    op.execute("""CREATE TABLE suprimentos.sup_custo_medio (
      unidade_id smallint NOT NULL, material_id uuid NOT NULL,
      quantidade numeric(18,4) NOT NULL DEFAULT 0 CHECK (quantidade >= 0),
      custo_total numeric(18,2) NOT NULL DEFAULT 0 CHECK (custo_total >= 0),
      custo_medio numeric(18,6) NOT NULL DEFAULT 0 CHECK (custo_medio >= 0),
      atualizado_em timestamptz NOT NULL DEFAULT now(),
      PRIMARY KEY(unidade_id,material_id),
      FOREIGN KEY(material_id,unidade_id) REFERENCES suprimentos.sup_material_unidade(material_id,unidade_id))""")
    op.execute(f"""CREATE TABLE suprimentos.sup_reserva_estoque (
      id uuid PRIMARY KEY, unidade_id smallint NOT NULL,
      solicitacao_item_id uuid NOT NULL, material_id uuid NOT NULL, endereco_id uuid NOT NULL,
      quantidade numeric(18,4) NOT NULL CHECK (quantidade > 0),
      entregue numeric(18,4) NOT NULL DEFAULT 0 CHECK (entregue >= 0 AND entregue <= quantidade),
      status text NOT NULL DEFAULT 'ATIVA' CHECK (status IN ('ATIVA','CONCLUIDA','CANCELADA')),
      FOREIGN KEY(solicitacao_item_id,unidade_id) REFERENCES suprimentos.sup_solicitacao_item(id,unidade_id),
      FOREIGN KEY(endereco_id,unidade_id) REFERENCES suprimentos.sup_endereco(id,unidade_id),
      UNIQUE(solicitacao_item_id,endereco_id), {AUDIT})""")
    op.execute(f"""CREATE TABLE suprimentos.sup_colaborador (
      id uuid PRIMARY KEY, unidade_id smallint NOT NULL REFERENCES suprimentos.sup_unidade(id),
      nome text NOT NULL, matricula text NOT NULL, setor text, ativo boolean NOT NULL DEFAULT true,
      UNIQUE(unidade_id,matricula), UNIQUE(id,unidade_id), {AUDIT})""")
    op.execute(f"""CREATE TABLE suprimentos.sup_ficha_epi (
      id uuid PRIMARY KEY, unidade_id smallint NOT NULL, colaborador_id uuid NOT NULL,
      material_id uuid NOT NULL REFERENCES suprimentos.sup_material(id),
      numero_ca text NOT NULL, quantidade numeric(18,4) NOT NULL CHECK (quantidade > 0),
      movimento_id bigint NOT NULL UNIQUE REFERENCES suprimentos.sup_movimento(id),
      confirmado_por text, confirmado_em timestamptz,
      FOREIGN KEY(colaborador_id,unidade_id) REFERENCES suprimentos.sup_colaborador(id,unidade_id), {AUDIT})""")
    op.execute(f"""CREATE TABLE suprimentos.sup_inventario (
      id uuid PRIMARY KEY, unidade_id smallint NOT NULL REFERENCES suprimentos.sup_unidade(id),
      tipo text NOT NULL CHECK (tipo IN ('ABERTURA','CICLICO')),
      status text NOT NULL DEFAULT 'ABERTO' CHECK (status IN ('ABERTO','EM_APROVACAO','CONCLUIDO','CANCELADO')),
      corte_em timestamptz NOT NULL DEFAULT now(),
      endereco_id uuid NOT NULL, contador_id text,
      FOREIGN KEY(endereco_id,unidade_id) REFERENCES suprimentos.sup_endereco(id,unidade_id),
      UNIQUE(id,unidade_id), {AUDIT})""")
    op.execute(f"""CREATE TABLE suprimentos.sup_contagem (
      id uuid PRIMARY KEY, unidade_id smallint NOT NULL, inventario_id uuid NOT NULL,
      material_id uuid NOT NULL REFERENCES suprimentos.sup_material(id),
      contado numeric(18,4) NOT NULL CHECK (contado >= 0),
      saldo_corte numeric(18,4), diferenca numeric(18,4),
      status text NOT NULL DEFAULT 'REGISTRADA' CHECK (status IN ('REGISTRADA','PENDENTE_APROVACAO','AJUSTADA')),
      aprovado_por text, aprovado_em timestamptz,
      FOREIGN KEY(inventario_id,unidade_id) REFERENCES suprimentos.sup_inventario(id,unidade_id),
      UNIQUE(inventario_id,material_id), {AUDIT})""")
    op.execute("INSERT INTO suprimentos.sup_flag(id,unidade_id,fase,habilitado,criado_por,atualizado_por) SELECT gen_random_uuid(),id,'S2',false,'migration','migration' FROM suprimentos.sup_unidade ON CONFLICT(unidade_id,fase) DO NOTHING")
    op.execute("INSERT INTO suprimentos.sup_parametro(id,unidade_id,chave,valor,a_confirmar,criado_por,atualizado_por) SELECT gen_random_uuid(),id,'inventario_aprovacao_valor',200,true,'migration','migration' FROM suprimentos.sup_unidade ON CONFLICT(unidade_id,chave) DO NOTHING")
    op.execute("INSERT INTO suprimentos.sup_parametro(id,unidade_id,chave,valor,a_confirmar,criado_por,atualizado_por) SELECT gen_random_uuid(),id,'inventario_tolerancia_pct',2,true,'migration','migration' FROM suprimentos.sup_unidade ON CONFLICT(unidade_id,chave) DO NOTHING")


def downgrade():
    op.execute("DELETE FROM suprimentos.sup_parametro WHERE chave='inventario_aprovacao_valor' AND criado_por='migration'")
    op.execute("DELETE FROM suprimentos.sup_parametro WHERE chave='inventario_tolerancia_pct' AND criado_por='migration'")
    op.execute("DELETE FROM suprimentos.sup_flag WHERE fase='S2' AND criado_por='migration'")
    for name in ('sup_contagem','sup_inventario','sup_ficha_epi','sup_colaborador','sup_reserva_estoque','sup_custo_medio','sup_saldo'):
        op.execute(f'DROP TABLE suprimentos.{name}')
    op.execute('DROP TABLE suprimentos.sup_movimento')
    op.execute('DROP FUNCTION suprimentos.sup_movimento_imutavel()')

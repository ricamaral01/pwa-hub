"""Cadastros globais e por unidade de Suprimentos.

Revision ID: sup_0001
Revises:
"""
from alembic import op

revision = "sup_0001"
down_revision = None
branch_labels = None
depends_on = None

AUDIT = """criado_em timestamptz NOT NULL DEFAULT now(), criado_por text NOT NULL DEFAULT 'system',
          atualizado_em timestamptz NOT NULL DEFAULT now(), atualizado_por text NOT NULL DEFAULT 'system'"""

def upgrade():
    op.execute("CREATE SCHEMA suprimentos")
    op.execute(f"""CREATE TABLE suprimentos.sup_unidade (
      id smallint PRIMARY KEY, codigo text NOT NULL UNIQUE, nome text NOT NULL,
      ativo boolean NOT NULL DEFAULT true, {AUDIT})""")
    op.execute(f"""CREATE TABLE suprimentos.sup_unidade_medida (
      id uuid PRIMARY KEY, sigla text NOT NULL UNIQUE, descricao text NOT NULL,
      ativo boolean NOT NULL DEFAULT true, {AUDIT})""")
    op.execute(f"""CREATE TABLE suprimentos.sup_material (
      id uuid PRIMARY KEY, codigo text NOT NULL UNIQUE, descricao text NOT NULL,
      categoria text NOT NULL CHECK (categoria IN ('EPI','ABRASIVO','FERRAMENTA','CONSUMIVEL_PRODUCAO','MANUTENCAO','LIMPEZA_ESCRITORIO','INSUMO_USINA','OUTROS')),
      un_estoque uuid NOT NULL REFERENCES suprimentos.sup_unidade_medida(id),
      controla_estoque boolean NOT NULL DEFAULT true,
      dominio text NOT NULL CHECK (dominio IN ('almoxarifado','insumo_usina')),
      exige_ca boolean NOT NULL DEFAULT false, patrimoniado boolean NOT NULL DEFAULT false,
      ativo boolean NOT NULL DEFAULT true, {AUDIT})""")
    op.execute(f"""CREATE TABLE suprimentos.sup_conversao (
      id uuid PRIMARY KEY, material_id uuid NOT NULL REFERENCES suprimentos.sup_material(id),
      de_un uuid NOT NULL REFERENCES suprimentos.sup_unidade_medida(id),
      para_un uuid NOT NULL REFERENCES suprimentos.sup_unidade_medida(id),
      fator numeric(18,8) NOT NULL CHECK (fator > 0), ativo boolean NOT NULL DEFAULT true,
      UNIQUE(material_id,de_un,para_un), {AUDIT})""")
    op.execute(f"""CREATE TABLE suprimentos.sup_epi_ca (
      id uuid PRIMARY KEY, material_id uuid NOT NULL REFERENCES suprimentos.sup_material(id),
      numero_ca text NOT NULL, validade date NOT NULL, ativo boolean NOT NULL DEFAULT true,
      UNIQUE(material_id,numero_ca), {AUDIT})""")
    op.execute(f"""CREATE TABLE suprimentos.sup_fornecedor (
      id uuid PRIMARY KEY, cnpj char(14) NOT NULL UNIQUE CHECK (cnpj ~ '^[0-9]{{14}}$'),
      razao text NOT NULL, categorias text[] NOT NULL DEFAULT '{{}}',
      situacao text NOT NULL DEFAULT 'em_qualificacao' CHECK (situacao IN ('em_qualificacao','qualificado','bloqueado')),
      ativo boolean NOT NULL DEFAULT true, {AUDIT})""")
    op.execute(f"""CREATE TABLE suprimentos.sup_material_unidade (
      material_id uuid NOT NULL REFERENCES suprimentos.sup_material(id),
      unidade_id smallint NOT NULL REFERENCES suprimentos.sup_unidade(id),
      ponto_pedido numeric(18,4) NOT NULL DEFAULT 0 CHECK (ponto_pedido >= 0),
      estoque_minimo numeric(18,4) NOT NULL DEFAULT 0 CHECK (estoque_minimo >= 0),
      lote_economico numeric(18,4) NOT NULL DEFAULT 0 CHECK (lote_economico >= 0),
      lead_time_dias integer NOT NULL DEFAULT 0 CHECK (lead_time_dias >= 0),
      seguranca_dias integer NOT NULL DEFAULT 0 CHECK (seguranca_dias >= 0),
      ativo boolean NOT NULL DEFAULT true, {AUDIT}, PRIMARY KEY(material_id,unidade_id))""")
    op.execute(f"""CREATE TABLE suprimentos.sup_local (
      id uuid PRIMARY KEY, unidade_id smallint NOT NULL REFERENCES suprimentos.sup_unidade(id),
      tipo text NOT NULL CHECK (tipo IN ('almoxarifado','deposito_inflamaveis','patio')),
      nome text NOT NULL, ativo boolean NOT NULL DEFAULT true,
      UNIQUE(unidade_id,nome), UNIQUE(id,unidade_id), {AUDIT})""")
    op.execute(f"""CREATE TABLE suprimentos.sup_endereco (
      id uuid PRIMARY KEY, unidade_id smallint NOT NULL REFERENCES suprimentos.sup_unidade(id),
      local_id uuid NOT NULL, codigo text NOT NULL, ativo boolean NOT NULL DEFAULT true,
      FOREIGN KEY(local_id,unidade_id) REFERENCES suprimentos.sup_local(id,unidade_id),
      UNIQUE(local_id,codigo), {AUDIT})""")
    op.execute(f"""CREATE TABLE suprimentos.sup_centro_custo (
      id uuid PRIMARY KEY, unidade_id smallint NOT NULL REFERENCES suprimentos.sup_unidade(id),
      codigo text NOT NULL, nome text NOT NULL, setor text,
      ativo boolean NOT NULL DEFAULT true, UNIQUE(unidade_id,codigo), UNIQUE(id,unidade_id), {AUDIT})""")
    op.execute(f"""CREATE TABLE suprimentos.sup_alcada (
      id uuid PRIMARY KEY, unidade_id smallint NOT NULL REFERENCES suprimentos.sup_unidade(id),
      cc_id uuid, categoria text, valor_ate numeric(18,2) CHECK (valor_ate > 0),
      nivel integer NOT NULL CHECK (nivel >= 1), papel_aprovador text NOT NULL DEFAULT 'APROVADOR',
      a_confirmar boolean NOT NULL DEFAULT true, ativo boolean NOT NULL DEFAULT true,
      FOREIGN KEY(cc_id,unidade_id) REFERENCES suprimentos.sup_centro_custo(id,unidade_id),
      UNIQUE(unidade_id,cc_id,categoria,nivel), {AUDIT})""")
    op.execute(f"""CREATE TABLE suprimentos.sup_parametro (
      id uuid PRIMARY KEY, unidade_id smallint NOT NULL REFERENCES suprimentos.sup_unidade(id),
      chave text NOT NULL, valor numeric(18,2) NOT NULL, a_confirmar boolean NOT NULL DEFAULT true,
      ativo boolean NOT NULL DEFAULT true, UNIQUE(unidade_id,chave), {AUDIT})""")
    op.execute(f"""CREATE TABLE suprimentos.sup_usuario_papel (
      id uuid PRIMARY KEY, iam_user_id text NOT NULL,
      unidade_id smallint NOT NULL REFERENCES suprimentos.sup_unidade(id),
      papel text NOT NULL CHECK (papel IN ('SOLICITANTE','APROVADOR','ALMOXARIFE','COMPRADOR','QUALIDADE','ADMIN')),
      cc_id uuid, nivel integer CHECK (nivel >= 1), ativo boolean NOT NULL DEFAULT true,
      FOREIGN KEY(cc_id,unidade_id) REFERENCES suprimentos.sup_centro_custo(id,unidade_id),
      {AUDIT})""")
    op.execute("""CREATE UNIQUE INDEX uq_sup_usuario_papel_ativo ON suprimentos.sup_usuario_papel
      (iam_user_id,unidade_id,papel,COALESCE(cc_id,'00000000-0000-0000-0000-000000000000'::uuid),COALESCE(nivel,0)) WHERE ativo""")
    op.execute(f"""CREATE TABLE suprimentos.sup_flag (
      id uuid PRIMARY KEY, unidade_id smallint NOT NULL REFERENCES suprimentos.sup_unidade(id),
      fase text NOT NULL, habilitado boolean NOT NULL DEFAULT false,
      UNIQUE(unidade_id,fase), {AUDIT})""")
    op.execute(f"""CREATE TABLE suprimentos.sup_evento (
      id uuid PRIMARY KEY, unidade_id smallint NOT NULL REFERENCES suprimentos.sup_unidade(id),
      alvo_tipo text NOT NULL, alvo_id uuid NOT NULL, de text, para text NOT NULL,
      por text NOT NULL, por_nome text NOT NULL, em timestamptz NOT NULL DEFAULT now(),
      comentario text, {AUDIT})""")
    op.execute("CREATE INDEX ix_sup_evento_alvo ON suprimentos.sup_evento(unidade_id,alvo_tipo,alvo_id,em)")

def downgrade():
    # Descartável somente: schema de testes sem dados de negócio.
    op.execute("DROP SCHEMA suprimentos CASCADE")

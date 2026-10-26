"""Fornecedores, homologação, cotação e pedido S3-A.

Revision ID: sup_0005
Revises: sup_0004
"""
from alembic import op
from sqlalchemy import text
from suprimentos.ids import uuid7

revision = "sup_0005"
down_revision = "sup_0004"
branch_labels = None
depends_on = None

AUDIT = "criado_em timestamptz NOT NULL DEFAULT now(), criado_por text NOT NULL, atualizado_em timestamptz NOT NULL DEFAULT now(), atualizado_por text NOT NULL"


def upgrade():
    op.execute("""ALTER TABLE suprimentos.sup_solicitacao_item ADD COLUMN destino text
      CHECK (destino IN ('ALMOXARIFADO','COMPRA'))""")
    op.execute(f"""CREATE TABLE suprimentos.sup_fornecedor_unidade (
      id uuid PRIMARY KEY, unidade_id smallint NOT NULL REFERENCES suprimentos.sup_unidade(id),
      fornecedor_id uuid NOT NULL REFERENCES suprimentos.sup_fornecedor(id),
      fantasia text, ie text, endereco jsonb NOT NULL DEFAULT '{{}}', contatos jsonb NOT NULL DEFAULT '{{}}',
      email_pedido text, condicao_pagamento text, prazo_padrao_dias integer CHECK (prazo_padrao_dias >= 0),
      frete_padrao text CHECK (frete_padrao IN ('CIF','FOB')),
      transportadora text, observacoes text,
      situacao text NOT NULL DEFAULT 'EM_QUALIFICACAO' CHECK (situacao IN
        ('EM_QUALIFICACAO','HOMOLOGADO','HOMOLOGADO_CONDICIONAL','REPROVADO','SUSPENSO','BLOQUEADO')),
      homologado_ate date, condicional_ate date, pendencias text,
      iqf numeric(5,2), tendencia text, ativo boolean NOT NULL DEFAULT true,
      UNIQUE(unidade_id,fornecedor_id), UNIQUE(id,unidade_id), {AUDIT})""")
    op.execute("CREATE INDEX ix_sup_fornecedor_u_filtro ON suprimentos.sup_fornecedor_unidade(unidade_id,situacao,homologado_ate)")
    op.execute(f"""CREATE TABLE suprimentos.sup_fornecedor_documento (
      id uuid PRIMARY KEY, unidade_id smallint NOT NULL, fornecedor_unidade_id uuid NOT NULL,
      tipo text NOT NULL, nome_original text NOT NULL, storage_path text NOT NULL UNIQUE,
      sha256 char(64) NOT NULL, tamanho integer NOT NULL CHECK (tamanho BETWEEN 1 AND 12582912),
      mime text NOT NULL, validade date, ativo boolean NOT NULL DEFAULT true,
      FOREIGN KEY(fornecedor_unidade_id,unidade_id) REFERENCES suprimentos.sup_fornecedor_unidade(id,unidade_id),
      {AUDIT})""")
    op.execute("CREATE INDEX ix_sup_fornecedor_doc_validade ON suprimentos.sup_fornecedor_documento(unidade_id,validade) WHERE ativo")
    op.execute(f"""CREATE TABLE suprimentos.sup_fornecedor_criterio (
      id uuid PRIMARY KEY, unidade_id smallint NOT NULL REFERENCES suprimentos.sup_unidade(id),
      categoria text NOT NULL, documentos text[] NOT NULL DEFAULT '{{}}',
      questionario jsonb NOT NULL DEFAULT '{{}}', exige_amostra boolean NOT NULL DEFAULT false,
      visita_opcional boolean NOT NULL DEFAULT true, ativo boolean NOT NULL DEFAULT true,
      UNIQUE(unidade_id,categoria), {AUDIT})""")
    op.execute(f"""CREATE TABLE suprimentos.sup_fornecedor_homologacao (
      id uuid PRIMARY KEY, unidade_id smallint NOT NULL, fornecedor_unidade_id uuid NOT NULL,
      de text, para text NOT NULL, checklist jsonb NOT NULL DEFAULT '{{}}',
      parecer text NOT NULL, pendencias text, validade_ate date, por text NOT NULL, por_nome text NOT NULL,
      FOREIGN KEY(fornecedor_unidade_id,unidade_id) REFERENCES suprimentos.sup_fornecedor_unidade(id,unidade_id),
      {AUDIT})""")
    op.execute(f"""CREATE TABLE suprimentos.sup_fornecedor_avaliacao (
      id uuid PRIMARY KEY, unidade_id smallint NOT NULL, fornecedor_unidade_id uuid NOT NULL,
      pedido_id uuid, nota_prazo numeric(3,1) NOT NULL CHECK (nota_prazo BETWEEN 1 AND 5),
      nota_quantidade numeric(3,1) NOT NULL CHECK (nota_quantidade BETWEEN 1 AND 5),
      nota_qualidade numeric(3,1) NOT NULL CHECK (nota_qualidade BETWEEN 1 AND 5),
      nota_documentacao numeric(3,1) NOT NULL CHECK (nota_documentacao BETWEEN 1 AND 5),
      nota_atendimento numeric(3,1) NOT NULL CHECK (nota_atendimento BETWEEN 1 AND 5),
      comentario text, iqf numeric(5,2) NOT NULL, avaliado_em timestamptz NOT NULL DEFAULT now(),
      FOREIGN KEY(fornecedor_unidade_id,unidade_id) REFERENCES suprimentos.sup_fornecedor_unidade(id,unidade_id),
      {AUDIT})""")
    op.execute("CREATE INDEX ix_sup_iqf_periodo ON suprimentos.sup_fornecedor_avaliacao(unidade_id,fornecedor_unidade_id,avaliado_em DESC)")
    op.execute("""CREATE TABLE suprimentos.sup_numero_cotacao (
      unidade_id smallint PRIMARY KEY REFERENCES suprimentos.sup_unidade(id),
      proximo integer NOT NULL DEFAULT 1 CHECK (proximo >= 1))""")
    op.execute(f"""CREATE TABLE suprimentos.sup_cotacao (
      id uuid PRIMARY KEY, unidade_id smallint NOT NULL REFERENCES suprimentos.sup_unidade(id),
      numero text NOT NULL, status text NOT NULL DEFAULT 'RASCUNHO'
        CHECK (status IN ('RASCUNHO','ABERTA','PENDENTE_APROVACAO','FECHADA','CANCELADA')),
      cc_id uuid, fechamento_justificativa text,
      FOREIGN KEY(cc_id,unidade_id) REFERENCES suprimentos.sup_centro_custo(id,unidade_id),
      UNIQUE(unidade_id,numero), UNIQUE(id,unidade_id), {AUDIT})""")
    op.execute(f"""CREATE TABLE suprimentos.sup_cotacao_item (
      id uuid PRIMARY KEY, unidade_id smallint NOT NULL, cotacao_id uuid NOT NULL,
      solicitacao_item_id uuid NOT NULL, qtd numeric(18,4) NOT NULL CHECK (qtd > 0),
      escolhido_preco_id uuid, UNIQUE(cotacao_id,solicitacao_item_id),
      FOREIGN KEY(cotacao_id,unidade_id) REFERENCES suprimentos.sup_cotacao(id,unidade_id),
      FOREIGN KEY(solicitacao_item_id,unidade_id) REFERENCES suprimentos.sup_solicitacao_item(id,unidade_id),
      UNIQUE(id,unidade_id), {AUDIT})""")
    op.execute(f"""CREATE TABLE suprimentos.sup_cotacao_convite (
      id uuid PRIMARY KEY, unidade_id smallint NOT NULL, cotacao_id uuid NOT NULL,
      fornecedor_unidade_id uuid NOT NULL, convidado_em timestamptz NOT NULL DEFAULT now(),
      UNIQUE(cotacao_id,fornecedor_unidade_id),
      FOREIGN KEY(cotacao_id,unidade_id) REFERENCES suprimentos.sup_cotacao(id,unidade_id),
      FOREIGN KEY(fornecedor_unidade_id,unidade_id) REFERENCES suprimentos.sup_fornecedor_unidade(id,unidade_id),
      {AUDIT})""")
    op.execute(f"""CREATE TABLE suprimentos.sup_cotacao_preco (
      id uuid PRIMARY KEY, unidade_id smallint NOT NULL, cotacao_item_id uuid NOT NULL,
      fornecedor_unidade_id uuid NOT NULL, preco_unit numeric(18,4) NOT NULL CHECK (preco_unit >= 0),
      ipi numeric(18,2) NOT NULL DEFAULT 0 CHECK (ipi >= 0),
      icms_st numeric(18,2) NOT NULL DEFAULT 0 CHECK (icms_st >= 0),
      desconto numeric(18,2) NOT NULL DEFAULT 0 CHECK (desconto >= 0),
      frete_tipo text NOT NULL CHECK (frete_tipo IN ('CIF','FOB')),
      frete_valor numeric(18,2) NOT NULL DEFAULT 0 CHECK (frete_valor >= 0),
      frete_rateio text NOT NULL DEFAULT 'TOTAL' CHECK (frete_rateio IN ('TOTAL','UNIDADE')),
      transportadora text, prazo_dias integer NOT NULL CHECK (prazo_dias >= 0),
      pagamento text, validade date NOT NULL, observacoes text,
      anexo_path text, anexo_sha256 char(64), anexo_mime text,
      custo_posto numeric(18,2) NOT NULL CHECK (custo_posto >= 0),
      justificativa_escolha text, escolhido boolean NOT NULL DEFAULT false,
      UNIQUE(cotacao_item_id,fornecedor_unidade_id),
      FOREIGN KEY(cotacao_item_id,unidade_id) REFERENCES suprimentos.sup_cotacao_item(id,unidade_id),
      FOREIGN KEY(fornecedor_unidade_id,unidade_id) REFERENCES suprimentos.sup_fornecedor_unidade(id,unidade_id),
      {AUDIT})""")
    op.execute("CREATE UNIQUE INDEX uq_sup_cotacao_escolhido ON suprimentos.sup_cotacao_preco(cotacao_item_id) WHERE escolhido")
    op.execute(f"""CREATE TABLE suprimentos.sup_compra_excecao (
      id uuid PRIMARY KEY, unidade_id smallint NOT NULL, cotacao_id uuid NOT NULL,
      fornecedor_unidade_id uuid NOT NULL, parecer text NOT NULL,
      aprovado_por text NOT NULL, aprovado_nome text NOT NULL,
      valido_ate date NOT NULL,
      FOREIGN KEY(cotacao_id,unidade_id) REFERENCES suprimentos.sup_cotacao(id,unidade_id),
      FOREIGN KEY(fornecedor_unidade_id,unidade_id) REFERENCES suprimentos.sup_fornecedor_unidade(id,unidade_id),
      UNIQUE(cotacao_id,fornecedor_unidade_id), {AUDIT})""")
    op.execute("""CREATE TABLE suprimentos.sup_numero_pedido (
      unidade_id smallint PRIMARY KEY REFERENCES suprimentos.sup_unidade(id),
      proximo integer NOT NULL DEFAULT 1 CHECK (proximo >= 1))""")
    op.execute(f"""CREATE TABLE suprimentos.sup_pedido (
      id uuid PRIMARY KEY, unidade_id smallint NOT NULL REFERENCES suprimentos.sup_unidade(id),
      numero text NOT NULL, cotacao_id uuid NOT NULL, fornecedor_unidade_id uuid NOT NULL,
      status text NOT NULL DEFAULT 'RASCUNHO' CHECK (status IN
        ('RASCUNHO','EMITIDO','ENVIADO','PARCIAL','RECEBIDO','ENCERRADO','CANCELADO','REAPROVACAO')),
      valor_total numeric(18,2) NOT NULL CHECK (valor_total >= 0),
      nivel_atual integer, niveis_total integer,
      entrega_prevista date, enviado_em timestamptz, nf_numero text,
      condicoes_gerais text, UNIQUE(unidade_id,numero), UNIQUE(id,unidade_id),
      FOREIGN KEY(cotacao_id,unidade_id) REFERENCES suprimentos.sup_cotacao(id,unidade_id),
      FOREIGN KEY(fornecedor_unidade_id,unidade_id) REFERENCES suprimentos.sup_fornecedor_unidade(id,unidade_id),
      {AUDIT})""")
    op.execute(f"""CREATE TABLE suprimentos.sup_pedido_item (
      id uuid PRIMARY KEY, unidade_id smallint NOT NULL, pedido_id uuid NOT NULL,
      cotacao_item_id uuid NOT NULL, solicitacao_item_id uuid NOT NULL,
      qtd numeric(18,4) NOT NULL CHECK (qtd > 0), preco_unit numeric(18,4) NOT NULL,
      custo_posto numeric(18,2) NOT NULL, qtd_recebida numeric(18,4) NOT NULL DEFAULT 0
        CHECK (qtd_recebida >= 0 AND qtd_recebida <= qtd),
      FOREIGN KEY(pedido_id,unidade_id) REFERENCES suprimentos.sup_pedido(id,unidade_id),
      FOREIGN KEY(cotacao_item_id,unidade_id) REFERENCES suprimentos.sup_cotacao_item(id,unidade_id),
      FOREIGN KEY(solicitacao_item_id,unidade_id) REFERENCES suprimentos.sup_solicitacao_item(id,unidade_id),
      {AUDIT})""")
    op.execute(f"""CREATE TABLE suprimentos.sup_pedido_entrega (
      id uuid PRIMARY KEY, unidade_id smallint NOT NULL, pedido_id uuid NOT NULL,
      pedido_item_id uuid NOT NULL, qtd numeric(18,4) NOT NULL CHECK (qtd > 0),
      numero_nf text NOT NULL, anexo_path text, anexo_sha256 char(64), anexo_mime text,
      recebido_em timestamptz NOT NULL DEFAULT now(),
      FOREIGN KEY(pedido_id,unidade_id) REFERENCES suprimentos.sup_pedido(id,unidade_id),
      FOREIGN KEY(pedido_item_id) REFERENCES suprimentos.sup_pedido_item(id),
      {AUDIT})""")
    op.execute("ALTER TABLE suprimentos.sup_fornecedor_avaliacao ADD CONSTRAINT fk_sup_avaliacao_pedido FOREIGN KEY(pedido_id,unidade_id) REFERENCES suprimentos.sup_pedido(id,unidade_id)")
    conn = op.get_bind()
    for phase in ("S3A",):
        conn.execute(text("""INSERT INTO suprimentos.sup_flag
          (id,unidade_id,fase,habilitado,criado_por,atualizado_por)
          VALUES (:id,1,:phase,false,'migration:sup_0005','migration:sup_0005')"""),
          {"id": uuid7(), "phase": phase})
    for key, value in {"homologacao_meses": 12, "cotacao_minima_3_acima": 1000,
                       "tolerancia_preco_oc_perc": 10, "iqf_prazo_peso": 30,
                       "iqf_quantidade_peso": 20, "iqf_qualidade_peso": 30,
                       "iqf_documentacao_peso": 10, "iqf_atendimento_peso": 10,
                       "iqf_faixa_a": 85, "iqf_faixa_b": 70, "iqf_faixa_c": 60}.items():
        conn.execute(text("""INSERT INTO suprimentos.sup_parametro
          (id,unidade_id,chave,valor,a_confirmar,criado_por,atualizado_por)
          VALUES (:id,1,:key,:value,true,'migration:sup_0005','migration:sup_0005')
          ON CONFLICT (unidade_id,chave) DO NOTHING"""), {"id": uuid7(), "key": key, "value": value})


def downgrade():
    op.execute("DELETE FROM suprimentos.sup_flag WHERE criado_por='migration:sup_0005'")
    op.execute("DELETE FROM suprimentos.sup_parametro WHERE criado_por='migration:sup_0005'")
    op.execute("ALTER TABLE suprimentos.sup_fornecedor_avaliacao DROP CONSTRAINT fk_sup_avaliacao_pedido")
    for name in ("sup_pedido_entrega","sup_pedido_item","sup_pedido","sup_numero_pedido",
                 "sup_compra_excecao","sup_cotacao_preco","sup_cotacao_convite","sup_cotacao_item","sup_cotacao","sup_numero_cotacao",
                 "sup_fornecedor_avaliacao","sup_fornecedor_homologacao","sup_fornecedor_criterio",
                 "sup_fornecedor_documento","sup_fornecedor_unidade"):
        op.execute(f"DROP TABLE suprimentos.{name}")
    op.execute("ALTER TABLE suprimentos.sup_solicitacao_item DROP COLUMN destino")

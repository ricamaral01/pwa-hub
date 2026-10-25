"""Solicitações S1, aprovações, fotos e estruturas futuras.

Revision ID: sup_0003
Revises: sup_0002
"""
from alembic import op

revision = "sup_0003"
down_revision = "sup_0002"
branch_labels = None
depends_on = None

AUDIT = """criado_em timestamptz NOT NULL DEFAULT now(), criado_por text NOT NULL,
          atualizado_em timestamptz NOT NULL DEFAULT now(), atualizado_por text NOT NULL"""

def upgrade():
    op.execute("ALTER TABLE suprimentos.sup_endereco ADD CONSTRAINT uq_sup_endereco_id_unidade UNIQUE(id,unidade_id)")
    op.execute("""CREATE TABLE suprimentos.sup_numero_solicitacao (
      unidade_id smallint PRIMARY KEY REFERENCES suprimentos.sup_unidade(id),
      proximo integer NOT NULL DEFAULT 1 CHECK (proximo >= 1))""")
    op.execute(f"""CREATE TABLE suprimentos.sup_solicitacao (
      id uuid PRIMARY KEY, unidade_id smallint NOT NULL REFERENCES suprimentos.sup_unidade(id),
      numero text NOT NULL, cc_id uuid NOT NULL,
      solicitante_id text NOT NULL, solicitante_nome text NOT NULL,
      origem text NOT NULL CHECK (origem IN ('pwa','web','ressuprimento')),
      urgencia text NOT NULL DEFAULT 'NORMAL' CHECK (urgencia IN ('NORMAL','URGENTE','PAROU_PRODUCAO')),
      precisa_em date, justificativa text, status text NOT NULL DEFAULT 'RASCUNHO'
        CHECK (status IN ('RASCUNHO','EM_APROVACAO','DEVOLVIDA','APROVADA','EM_ATENDIMENTO','ENTREGUE','CONCLUIDA','REPROVADA','CANCELADA')),
      valor_estimado numeric(18,2) NOT NULL DEFAULT 0 CHECK (valor_estimado >= 0),
      sem_preco boolean NOT NULL DEFAULT true, client_uuid uuid,
      nivel_atual integer, niveis_total integer, vence_em timestamptz,
      entregue_em timestamptz, confirmado_em timestamptz,
      FOREIGN KEY(cc_id,unidade_id) REFERENCES suprimentos.sup_centro_custo(id,unidade_id),
      UNIQUE(unidade_id,numero), UNIQUE(id,unidade_id), {AUDIT})""")
    op.execute("CREATE UNIQUE INDEX uq_sup_solicitacao_client_uuid ON suprimentos.sup_solicitacao(unidade_id,client_uuid) WHERE client_uuid IS NOT NULL")
    op.execute("CREATE INDEX ix_sup_solicitacao_fila ON suprimentos.sup_solicitacao(unidade_id,status,criado_em DESC)")
    op.execute(f"""CREATE TABLE suprimentos.sup_solicitacao_item (
      id uuid PRIMARY KEY, solicitacao_id uuid NOT NULL, unidade_id smallint NOT NULL,
      material_id uuid REFERENCES suprimentos.sup_material(id), descricao_livre text,
      qtd numeric(18,4) NOT NULL CHECK (qtd > 0), un uuid NOT NULL REFERENCES suprimentos.sup_unidade_medida(id),
      preco_informado numeric(18,2) CHECK (preco_informado >= 0),
      qtd_reservada numeric(18,4) NOT NULL DEFAULT 0 CHECK (qtd_reservada >= 0),
      qtd_comprar numeric(18,4) NOT NULL DEFAULT 0 CHECK (qtd_comprar >= 0),
      qtd_entregue numeric(18,4) NOT NULL DEFAULT 0 CHECK (qtd_entregue >= 0),
      status text NOT NULL DEFAULT 'PENDENTE' CHECK (status IN ('PENDENTE','SEPARADO','ENTREGUE','CANCELADO')),
      FOREIGN KEY(solicitacao_id,unidade_id) REFERENCES suprimentos.sup_solicitacao(id,unidade_id),
      CHECK ((material_id IS NOT NULL) <> (descricao_livre IS NOT NULL)),
      CHECK (qtd_entregue <= qtd), UNIQUE(id,unidade_id), {AUDIT})""")
    op.execute(f"""CREATE TABLE suprimentos.sup_solicitacao_foto (
      id uuid PRIMARY KEY, solicitacao_id uuid NOT NULL, unidade_id smallint NOT NULL,
      storage_path text NOT NULL UNIQUE, sha256 char(64) NOT NULL, mime text NOT NULL,
      tamanho integer NOT NULL CHECK (tamanho > 0 AND tamanho <= 2097152),
      nome_original text NOT NULL,
      FOREIGN KEY(solicitacao_id,unidade_id) REFERENCES suprimentos.sup_solicitacao(id,unidade_id),
      {AUDIT})""")
    op.execute(f"""CREATE TABLE suprimentos.sup_aprovacao (
      id uuid PRIMARY KEY, solicitacao_id uuid NOT NULL, unidade_id smallint NOT NULL,
      nivel integer NOT NULL CHECK (nivel >= 1),
      aprovador_id text NOT NULL, aprovador_nome text NOT NULL,
      decisao text NOT NULL CHECK (decisao IN ('APROVADA','DEVOLVIDA','REPROVADA')),
      comentario text, em timestamptz NOT NULL DEFAULT now(),
      FOREIGN KEY(solicitacao_id,unidade_id) REFERENCES suprimentos.sup_solicitacao(id,unidade_id),
      {AUDIT})""")
    op.execute(f"""CREATE TABLE suprimentos.sup_reserva (
      id uuid PRIMARY KEY, unidade_id smallint NOT NULL REFERENCES suprimentos.sup_unidade(id),
      solicitacao_item_id uuid NOT NULL, material_id uuid NOT NULL REFERENCES suprimentos.sup_material(id),
      endereco_id uuid NOT NULL, qtd numeric(18,4) NOT NULL CHECK (qtd > 0),
      status text NOT NULL DEFAULT 'PENDENTE',
      FOREIGN KEY(solicitacao_item_id,unidade_id) REFERENCES suprimentos.sup_solicitacao_item(id,unidade_id),
      FOREIGN KEY(endereco_id,unidade_id) REFERENCES suprimentos.sup_endereco(id,unidade_id),
      {AUDIT})""")
    op.execute(f"""CREATE TABLE suprimentos.sup_sugestao_ressuprimento (
      id uuid PRIMARY KEY, unidade_id smallint NOT NULL REFERENCES suprimentos.sup_unidade(id),
      origem text NOT NULL CHECK (origem IN ('almoxarifado','estoque_usina')),
      material_id uuid NOT NULL REFERENCES suprimentos.sup_material(id),
      qtd numeric(18,4) NOT NULL CHECK (qtd > 0), data_limite date,
      destino_ref text, status text NOT NULL DEFAULT 'SUGERIDA',
      solicitacao_id uuid,
      FOREIGN KEY(solicitacao_id,unidade_id) REFERENCES suprimentos.sup_solicitacao(id,unidade_id),
      {AUDIT})""")

def downgrade():
    for name in ("sup_sugestao_ressuprimento", "sup_reserva", "sup_aprovacao",
                 "sup_solicitacao_foto", "sup_solicitacao_item", "sup_solicitacao", "sup_numero_solicitacao"):
        op.execute(f"DROP TABLE suprimentos.{name}")
    op.execute("ALTER TABLE suprimentos.sup_endereco DROP CONSTRAINT uq_sup_endereco_id_unidade")

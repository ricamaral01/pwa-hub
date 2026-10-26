"""Documento de recebimento, NF assistida, inspeção e fila de NC.

Revision ID: sup_0009
Revises: sup_0008
"""
from alembic import op

revision='sup_0009'
down_revision='sup_0008'
branch_labels=None
depends_on=None
AUDIT='criado_em timestamptz NOT NULL DEFAULT now(), criado_por text NOT NULL, atualizado_em timestamptz NOT NULL DEFAULT now(), atualizado_por text NOT NULL'

def upgrade():
    op.execute('ALTER TABLE suprimentos.sup_fornecedor_avaliacao ADD COLUMN estornada_em timestamptz')
    op.execute('ALTER TABLE suprimentos.sup_pedido_item ADD CONSTRAINT uq_sup_pedido_item_unidade UNIQUE(id,unidade_id)')
    op.execute('ALTER TABLE suprimentos.sup_material DROP CONSTRAINT sup_material_categoria_check')
    op.execute("ALTER TABLE suprimentos.sup_material ADD CONSTRAINT sup_material_categoria_check CHECK (categoria IN ('EPI','ABRASIVO','FERRAMENTA','CONSUMIVEL_PRODUCAO','MANUTENCAO','LIMPEZA_ESCRITORIO','INSUMO_USINA','QUIMICO','OUTROS'))")
    op.execute(f"""CREATE TABLE suprimentos.sup_recebimento (
      id uuid PRIMARY KEY, unidade_id smallint NOT NULL REFERENCES suprimentos.sup_unidade(id),
      pedido_id uuid NOT NULL, numero_nf text, chave_nf text, cnpj_nf char(14),
      versao integer NOT NULL DEFAULT 1 CHECK (versao>=1), anterior_id uuid,
      status text NOT NULL DEFAULT 'RASCUNHO' CHECK (status IN
        ('RASCUNHO','PENDENTE_COMPRADOR','EM_INSPECAO','CONFIRMADO','ESTORNADO')),
      anexo_path text, anexo_sha256 char(64), anexo_mime text,
      extraido jsonb, conferido_por text, conferido_em timestamptz,
      inspecao_status text CHECK (inspecao_status IN ('LIBERADO','CONDICIONAL','REPROVADO')),
      inspecao_parecer text, nf_job_id uuid, avaliacao_id uuid,
      FOREIGN KEY(pedido_id,unidade_id) REFERENCES suprimentos.sup_pedido(id,unidade_id),
      FOREIGN KEY(anterior_id) REFERENCES suprimentos.sup_recebimento(id),
      UNIQUE(id,unidade_id), {AUDIT})""")
    op.execute('CREATE INDEX ix_sup_recebimento_fila ON suprimentos.sup_recebimento(unidade_id,status,criado_em DESC)')
    op.execute(f"""CREATE TABLE suprimentos.sup_recebimento_item (
      id uuid PRIMARY KEY, unidade_id smallint NOT NULL, recebimento_id uuid NOT NULL,
      pedido_item_id uuid NOT NULL, material_id uuid REFERENCES suprimentos.sup_material(id),
      qtd_nf numeric(18,4) NOT NULL CHECK (qtd_nf>=0),
      qtd_contada numeric(18,4) NOT NULL CHECK (qtd_contada>=0),
      preco_nf numeric(18,4) NOT NULL CHECK (preco_nf>=0),
      ipi_valor numeric(18,2) NOT NULL DEFAULT 0 CHECK (ipi_valor>=0),
      frete_rateado numeric(18,2) NOT NULL DEFAULT 0 CHECK (frete_rateado>=0),
      custo_unitario numeric(18,6), entrega_id uuid, lote text, validade date, numero_ca text,
      fds_presente boolean NOT NULL DEFAULT false, embalagem_ok boolean NOT NULL DEFAULT true,
      quantidade_ok boolean NOT NULL DEFAULT true,
      endereco_id uuid, destino text NOT NULL DEFAULT 'CROSS_DOCKING'
        CHECK (destino IN ('CROSS_DOCKING','ALMOXARIFADO','DEVOLUCAO')),
      divergencia jsonb NOT NULL DEFAULT '{{}}'::jsonb,
      inspecao_status text CHECK (inspecao_status IN ('LIBERADO','CONDICIONAL','REPROVADO')),
      inspecao_parecer text,
      FOREIGN KEY(recebimento_id,unidade_id) REFERENCES suprimentos.sup_recebimento(id,unidade_id),
      FOREIGN KEY(pedido_item_id,unidade_id) REFERENCES suprimentos.sup_pedido_item(id,unidade_id),
      FOREIGN KEY(endereco_id,unidade_id) REFERENCES suprimentos.sup_endereco(id,unidade_id),
      UNIQUE(recebimento_id,pedido_item_id), {AUDIT})""")
    op.execute(f"""CREATE TABLE suprimentos.sup_nf_job (
      id uuid PRIMARY KEY, unidade_id smallint NOT NULL,
      recebimento_id uuid NOT NULL, status text NOT NULL DEFAULT 'PENDENTE'
        CHECK (status IN ('PENDENTE','PROCESSANDO','CONCLUIDO','FALHOU','DESLIGADO')),
      tentativas integer NOT NULL DEFAULT 0 CHECK (tentativas>=0),
      proxima_tentativa_em timestamptz NOT NULL DEFAULT now(),
      resultado jsonb, erro_codigo text, iniciado_em timestamptz, terminado_em timestamptz,
      FOREIGN KEY(recebimento_id,unidade_id) REFERENCES suprimentos.sup_recebimento(id,unidade_id),
      UNIQUE(recebimento_id), {AUDIT})""")
    op.execute('CREATE INDEX ix_sup_nf_job_fila ON suprimentos.sup_nf_job(status,proxima_tentativa_em) WHERE status IN (\'PENDENTE\',\'FALHOU\')')
    op.execute('ALTER TABLE suprimentos.sup_recebimento ADD CONSTRAINT fk_sup_recebimento_job FOREIGN KEY(nf_job_id) REFERENCES suprimentos.sup_nf_job(id)')
    op.execute(f"""CREATE TABLE suprimentos.sup_inspecao_criterio (
      id uuid PRIMARY KEY, unidade_id smallint NOT NULL REFERENCES suprimentos.sup_unidade(id),
      categoria text NOT NULL, exige_ca boolean NOT NULL DEFAULT false,
      exige_fds boolean NOT NULL DEFAULT false, exige_lote boolean NOT NULL DEFAULT false,
      exige_validade boolean NOT NULL DEFAULT false, exige_embalagem boolean NOT NULL DEFAULT true,
      exige_quantidade boolean NOT NULL DEFAULT true,
      ativo boolean NOT NULL DEFAULT true, UNIQUE(unidade_id,categoria), {AUDIT})""")
    op.execute(f"""CREATE TABLE suprimentos.sup_nc_pendente (
      id uuid PRIMARY KEY, unidade_id smallint NOT NULL,
      recebimento_id uuid NOT NULL, recebimento_item_id uuid NOT NULL,
      status text NOT NULL DEFAULT 'PENDENTE' CHECK (status IN ('PENDENTE','ENVIADA','RESOLVIDA')),
      nc_id text, motivo text NOT NULL, chave_idempotencia text NOT NULL,
      FOREIGN KEY(recebimento_id,unidade_id) REFERENCES suprimentos.sup_recebimento(id,unidade_id),
      FOREIGN KEY(recebimento_item_id) REFERENCES suprimentos.sup_recebimento_item(id),
      UNIQUE(unidade_id,chave_idempotencia), {AUDIT})""")
    op.execute("INSERT INTO suprimentos.sup_flag(id,unidade_id,fase,habilitado,criado_por,atualizado_por) SELECT gen_random_uuid(),id,'S3B',false,'migration','migration' FROM suprimentos.sup_unidade ON CONFLICT(unidade_id,fase) DO NOTHING")
    op.execute("INSERT INTO suprimentos.sup_inspecao_criterio(id,unidade_id,categoria,exige_ca,exige_fds,exige_lote,exige_validade,exige_embalagem,exige_quantidade,criado_por,atualizado_por) SELECT gen_random_uuid(),u.id,categoria,ca,fds,lote,validade,true,true,'migration','migration' FROM suprimentos.sup_unidade u CROSS JOIN (VALUES ('EPI',true,false,false,false),('QUIMICO',false,true,true,true),('ABRASIVO',false,false,false,false),('FERRAMENTA',false,false,false,false),('CONSUMIVEL_PRODUCAO',false,false,false,false),('MANUTENCAO',false,false,false,false),('LIMPEZA_ESCRITORIO',false,false,false,false),('OUTROS',false,false,false,false)) AS seed(categoria,ca,fds,lote,validade) ON CONFLICT(unidade_id,categoria) DO NOTHING")

def downgrade():
    for name in ('sup_nc_pendente','sup_inspecao_criterio','sup_nf_job','sup_recebimento_item'):
        op.execute(f'DROP TABLE suprimentos.{name} CASCADE')
    op.execute('DROP TABLE suprimentos.sup_recebimento')
    op.execute("DELETE FROM suprimentos.sup_flag WHERE fase='S3B' AND criado_por='migration'")
    op.execute('ALTER TABLE suprimentos.sup_pedido_item DROP CONSTRAINT uq_sup_pedido_item_unidade')
    op.execute('ALTER TABLE suprimentos.sup_fornecedor_avaliacao DROP COLUMN estornada_em')
    op.execute('ALTER TABLE suprimentos.sup_material DROP CONSTRAINT sup_material_categoria_check')
    op.execute("ALTER TABLE suprimentos.sup_material ADD CONSTRAINT sup_material_categoria_check CHECK (categoria IN ('EPI','ABRASIVO','FERRAMENTA','CONSUMIVEL_PRODUCAO','MANUTENCAO','LIMPEZA_ESCRITORIO','INSUMO_USINA','OUTROS'))")

"""Add Noroeste production with Campinas as its product catalogue.

Revision ID: 20261029_01
Revises: 20261027_04
"""
from alembic import op

revision = "20261029_01"
down_revision = "20261027_04"
branch_labels = None
depends_on = None


def upgrade():
    op.execute("""
      INSERT INTO producao.unidade (id,codigo,nome,passo_homens)
      VALUES (4,'noroeste','Noroeste',0.01);
      ALTER TABLE producao.produto ADD COLUMN campinas_produto_id integer;
      CREATE UNIQUE INDEX uq_produto_unidade_campinas_id
        ON producao.produto (unidade_id,campinas_produto_id)
        WHERE campinas_produto_id IS NOT NULL;
      INSERT INTO producao.produto
        (unidade_id,familia,descricao,cod_pro,volume_m3,ativo,campinas_produto_id)
      SELECT 4,
        CASE WHEN s.nome ~* '^(Caixa passagem|Placa Estai|Chápeu|Chapeu|Pedestal Caixa)'
          THEN 'Acessórios' ELSE 'Postes' END,
        s.nome,NULL,s.volume,true,s.id
      FROM public.produtos s;
      INSERT INTO public.atividades_mao_de_obra
        (unidade_id,descricao,tipo,grupo_setor,ordem,ativo)
      VALUES (4,'Produção','MOD','04',1,true),
             (4,'Apoio','MOI','04',2,true);
    """)


def downgrade():
    op.execute("""
      DO $$ BEGIN
        IF EXISTS (SELECT 1 FROM producao.apontamento_dia WHERE unidade_id=4)
          OR EXISTS (SELECT 1 FROM public.maodeobra WHERE unidade_id=4)
          OR EXISTS (SELECT 1 FROM public.maodeobra_dias WHERE unidade_id=4)
          OR EXISTS (SELECT 1 FROM producao.usuario_unidade WHERE unidade_id=4) THEN
          RAISE EXCEPTION 'Noroeste has data; export before downgrade';
        END IF;
      END $$;
      DELETE FROM public.atividades_mao_de_obra WHERE unidade_id=4;
      DELETE FROM producao.produto WHERE unidade_id=4;
      DROP INDEX producao.uq_produto_unidade_campinas_id;
      ALTER TABLE producao.produto DROP COLUMN campinas_produto_id;
      DELETE FROM producao.unidade WHERE id=4 AND codigo='noroeste';
    """)

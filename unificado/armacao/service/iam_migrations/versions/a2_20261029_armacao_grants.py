"""A2: seed five Armação action grants for the three confirmed Mapa users.

Revision ID: a2_20261029_iam
Revises:
"""
from alembic import op

revision="a2_20261029_iam"
down_revision=None
branch_labels=None
depends_on=None


def upgrade():
    op.execute("""ALTER TABLE unificado_auth.user_action_permissions
      DROP CONSTRAINT user_action_permissions_action_id_check""")
    op.execute("""ALTER TABLE unificado_auth.user_action_permissions
      ADD CONSTRAINT user_action_permissions_action_id_check CHECK (
        action_id LIKE 'qualidade.%' OR
        action_id LIKE 'laboratorio.cronoanalise.%' OR
        action_id LIKE 'armacao.%')""")
    op.execute("""CREATE TABLE unificado_auth.armacao_seeded_grants (
      user_id text NOT NULL,action_id text NOT NULL,
      PRIMARY KEY(user_id,action_id))""")
    op.execute("""WITH wanted(user_id,action_id) AS (
      SELECT u.id,a.action_id
      FROM public.usuarios u CROSS JOIN
      (VALUES ('armacao.corte'),('armacao.banca'),('armacao.supervisor'),
              ('armacao.consulta'),('armacao.cadastros')) AS a(action_id)
      WHERE u.id IN ('alex','user-ricardo','marcelo') AND u.ativo AND u.deleted_at IS NULL
    ), inserted AS (
      INSERT INTO unificado_auth.user_action_permissions(user_id,action_id,granted_by)
      SELECT user_id,action_id,'alex' FROM wanted
      ON CONFLICT(user_id,action_id) DO NOTHING
      RETURNING user_id,action_id
    ) INSERT INTO unificado_auth.armacao_seeded_grants(user_id,action_id)
      SELECT user_id,action_id FROM inserted""")


def downgrade():
    op.execute("""DELETE FROM unificado_auth.user_action_permissions p
      USING unificado_auth.armacao_seeded_grants s
      WHERE p.user_id=s.user_id AND p.action_id=s.action_id""")
    op.execute("DROP TABLE unificado_auth.armacao_seeded_grants")
    op.execute("""DO $$ BEGIN
      IF EXISTS (SELECT 1 FROM unificado_auth.user_action_permissions
                 WHERE action_id LIKE 'armacao.%') THEN
        RAISE EXCEPTION 'Permissoes de Armacao adicionadas depois do seed; remova-as antes do downgrade';
      END IF;
    END $$""")
    op.execute("""ALTER TABLE unificado_auth.user_action_permissions
      DROP CONSTRAINT user_action_permissions_action_id_check""")
    op.execute("""ALTER TABLE unificado_auth.user_action_permissions
      ADD CONSTRAINT user_action_permissions_action_id_check CHECK (
        action_id LIKE 'qualidade.%' OR
        action_id LIKE 'laboratorio.cronoanalise.%')""")

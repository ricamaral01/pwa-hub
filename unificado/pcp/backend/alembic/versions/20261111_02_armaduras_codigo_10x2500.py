"""Complete the product code supplied by the user's production report reference.

The image supplied on 11/11/2026 explicitly maps Circular 10X2500 to 15298.
Only the missing code is completed. No weights or quantities are inferred.
"""
from alembic import op

revision = '20261111_02'
down_revision = '20261111_01'
branch_labels = None
depends_on = None


def upgrade():
    op.execute("""
      DO $$ BEGIN
        IF (SELECT count(*) FROM public.produtos
            WHERE setor_id=3 AND upper(replace(nome,' ',''))='10X2500') > 1 THEN
          RAISE EXCEPTION 'Ambiguous 10X2500 product';
        END IF;
        UPDATE public.produtos SET codigo='15298'
          WHERE setor_id=3 AND upper(replace(nome,' ',''))='10X2500' AND codigo IS NULL
            AND NOT EXISTS(SELECT 1 FROM public.produtos WHERE codigo='15298');
      END $$;
    """)


def downgrade():
    raise RuntimeError('Review catalogue and issued reports before undoing this source code')

"""Add an inactive database guard for NC numbering during the cutover.

Revision ID: 20261015_03
Revises: 20261015_02
"""
from alembic import op

revision = "20261015_03"
down_revision = "20261015_02"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("""
    CREATE TABLE qualidade.nc_numbering_control (
      id smallint PRIMARY KEY CHECK (id = 1),
      enabled boolean NOT NULL DEFAULT false,
      changed_at timestamptz NOT NULL DEFAULT now()
    );
    INSERT INTO qualidade.nc_numbering_control(id, enabled) VALUES (1, false);
    REVOKE ALL ON qualidade.nc_numbering_control FROM PUBLIC;

    CREATE FUNCTION qualidade.reject_numbering_while_frozen()
    RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER
    SET search_path = pg_catalog, qualidade AS $$
    DECLARE frozen boolean;
    BEGIN
      SELECT enabled INTO frozen FROM qualidade.nc_numbering_control WHERE id = 1;
      IF NOT frozen THEN
        RETURN NEW;
      END IF;
      -- Only the official C1 transaction run as postgres may allocate numbers.
      IF session_user = 'postgres'
         AND current_setting('qualidade.c1_import', true) = 'on' THEN
        RETURN NEW;
      END IF;
      IF TG_TABLE_NAME = 'nc_numero_contador'
         AND session_user = 'postgres'
         AND current_setting('qualidade.synthetic_cleanup', true) = 'on' THEN
        RETURN NEW;
      END IF;
      IF TG_TABLE_NAME = 'nc_numero_contador' THEN
        RAISE EXCEPTION 'Numeração de NC temporariamente suspensa' USING ERRCODE = '55000';
      END IF;
      IF TG_OP = 'INSERT' THEN
        IF NEW.numero IS NOT NULL THEN
          RAISE EXCEPTION 'Numeração de NC temporariamente suspensa' USING ERRCODE = '55000';
        END IF;
      ELSIF NEW.numero IS NOT NULL AND OLD.numero IS DISTINCT FROM NEW.numero THEN
        RAISE EXCEPTION 'Numeração de NC temporariamente suspensa' USING ERRCODE = '55000';
      END IF;
      RETURN NEW;
    END $$;

    CREATE TRIGGER nc_numbering_frozen
      BEFORE INSERT OR UPDATE OF numero ON qualidade.nc
      FOR EACH ROW EXECUTE FUNCTION qualidade.reject_numbering_while_frozen();
    CREATE TRIGGER nc_counter_frozen
      BEFORE INSERT OR UPDATE ON qualidade.nc_numero_contador
      FOR EACH ROW EXECUTE FUNCTION qualidade.reject_numbering_while_frozen();
    """)


def downgrade() -> None:
    raise RuntimeError("A proteção de numeração não deve ser removida automaticamente")

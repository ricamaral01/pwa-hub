\set ON_ERROR_STOP on
BEGIN;
DO $$ BEGIN
  IF (SELECT version_num FROM alembic_version) <> '20261024_01' THEN
    RAISE EXCEPTION 'Unexpected Alembic version; expected 20261024_01';
  END IF;
  IF EXISTS (SELECT 1 FROM producao.unidade WHERE id=3 OR codigo='ribeirao') THEN
    RAISE EXCEPTION 'Ribeirão unit already exists';
  END IF;
END $$;
ALTER TABLE producao.unidade
  ADD COLUMN passo_homens numeric(4,2) NOT NULL DEFAULT 0.25
  CHECK (passo_homens > 0 AND passo_homens <= 1);
INSERT INTO producao.unidade(id,codigo,nome,passo_homens)
VALUES (3,'ribeirao','Ribeirão',0.01);
UPDATE alembic_version SET version_num='20261027_04'
WHERE version_num='20261024_01';
COMMIT;

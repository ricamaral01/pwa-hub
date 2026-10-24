-- Test database only. Never run against homologation or production.
DO $$ BEGIN
  IF current_database() NOT LIKE 'cronoanalise_test_%' THEN
    RAISE EXCEPTION 'Rollback permitido apenas em banco cronoanalise_test_*';
  END IF;
END $$;
DROP SCHEMA cronoanalise CASCADE;

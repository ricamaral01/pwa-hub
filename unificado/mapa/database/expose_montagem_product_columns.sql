-- Apply only to mapa_unificado_teste after a verified backup.
-- PostgreSQL expands SELECT * when a view is created, so the original API
-- view did not acquire the three columns added later to the base table.
BEGIN;
CREATE OR REPLACE VIEW api.montagem_poste AS SELECT * FROM public.montagem_poste;
COMMIT;
NOTIFY pgrst, 'reload schema';

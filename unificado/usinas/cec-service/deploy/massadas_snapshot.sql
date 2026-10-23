-- Run in controle_est_concre_campinas after restoring tbl_massadas.
-- The CEC application role owns both the restored table and this metadata.
SET ROLE cec_campinas_app;
CREATE TABLE IF NOT EXISTS public.cec_massadas_snapshot (
    id integer PRIMARY KEY CHECK (id = 1),
    imported_at timestamptz NOT NULL,
    source_count integer NOT NULL,
    source_max_id integer,
    source_max_data date
);
INSERT INTO public.cec_massadas_snapshot
    (id, imported_at, source_count, source_max_id, source_max_data)
SELECT 1, now(), count(*)::integer, max(id), max(data)
FROM public.tbl_massadas
ON CONFLICT (id) DO UPDATE SET
    imported_at = EXCLUDED.imported_at,
    source_count = EXCLUDED.source_count,
    source_max_id = EXCLUDED.source_max_id,
    source_max_data = EXCLUDED.source_max_data;

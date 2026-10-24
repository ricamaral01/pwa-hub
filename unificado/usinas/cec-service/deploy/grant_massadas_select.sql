-- Only the existing mirror reader may read this one source table.
-- Run against supervisorio_db on the origin VPS.
BEGIN;
GRANT SELECT ON TABLE public.tbl_massadas TO usinas_mirror_ro;
COMMIT;

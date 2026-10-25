-- Only Ricardo's link is approved for the immediate 16/10/2026 release.
-- Apply only after checking the GED IDs and roles against the destination DB.
BEGIN;
INSERT INTO unificado_auth.ged_identity_links
  (mapa_user_id,ged_user_id,ged_role,active,approved_by)
SELECT id,'f4ad0ccf-888e-4d14-aa7a-8b595bf9f459','ADMIN_MASTER',TRUE,'user-ricardo'
FROM public.usuarios WHERE id='user-ricardo' AND nome='Ricardo'
  AND ativo AND NOT primeiro_acesso AND deleted_at IS NULL
ON CONFLICT (mapa_user_id) DO NOTHING;
DO $$ BEGIN
  IF (SELECT count(*) FROM unificado_auth.ged_identity_links
      WHERE (mapa_user_id='user-ricardo' AND
             ged_user_id='f4ad0ccf-888e-4d14-aa7a-8b595bf9f459' AND
             ged_role='ADMIN_MASTER' AND active)) <> 1 THEN
    RAISE EXCEPTION 'Approved GED links not exact';
  END IF;
END $$;
COMMIT;

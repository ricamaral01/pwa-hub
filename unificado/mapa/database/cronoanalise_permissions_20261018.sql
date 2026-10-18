-- T2: expand the existing action catalog constraint without changing grants.
-- Apply to the Mapa authentication database in homologation first.
BEGIN;
ALTER TABLE unificado_auth.user_action_permissions
  DROP CONSTRAINT IF EXISTS user_action_permissions_action_id_check;
ALTER TABLE unificado_auth.user_action_permissions
  ADD CONSTRAINT user_action_permissions_action_id_check CHECK (
    action_id LIKE 'qualidade.%' OR action_id LIKE 'laboratorio.cronoanalise.%'
  );
COMMIT;

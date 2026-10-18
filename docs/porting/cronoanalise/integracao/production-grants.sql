-- T6b. Aplicar somente em mapa_unificado_teste após cronoanalise_permissions_20261018.sql.
-- Não concede Cronoanálise a nenhum outro usuário.
BEGIN;
DO $$
BEGIN
  IF current_database() <> 'mapa_unificado_teste' THEN
    RAISE EXCEPTION 'Banco de autenticação inesperado: %', current_database();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.usuarios WHERE id='user-ricardo' AND ativo AND deleted_at IS NULL) THEN
    RAISE EXCEPTION 'Usuário user-ricardo não está ativo';
  END IF;
  IF EXISTS (SELECT 1 FROM unificado_auth.user_screen_permissions
             WHERE screen_id LIKE 'cronoanalise.%' AND user_id <> 'user-ricardo')
     OR EXISTS (SELECT 1 FROM unificado_auth.user_action_permissions
                WHERE action_id LIKE 'laboratorio.cronoanalise.%' AND user_id <> 'user-ricardo') THEN
    RAISE EXCEPTION 'Já existem permissões Cronoanálise para outro usuário';
  END IF;
END $$;
INSERT INTO unificado_auth.user_screen_permissions (user_id,screen_id,allowed,updated_by)
SELECT 'user-ricardo', screen_id, true, 'user-ricardo'
FROM unnest(ARRAY[
  'cronoanalise.inicio','cronoanalise.coletar','cronoanalise.medicoes',
  'cronoanalise.catalogo','cronoanalise.dimensionar','cronoanalise.simular',
  'cronoanalise.metodologia'
]) AS ids(screen_id)
ON CONFLICT (user_id,screen_id) DO UPDATE SET allowed=true,updated_by='user-ricardo',updated_at=now();
INSERT INTO unificado_auth.user_action_permissions (user_id,action_id,granted_by)
SELECT 'user-ricardo', action_id, 'user-ricardo'
FROM unnest(ARRAY[
  'laboratorio.cronoanalise.coletar',
  'laboratorio.cronoanalise.analisar',
  'laboratorio.cronoanalise.configurar'
]) AS ids(action_id)
ON CONFLICT (user_id,action_id) DO NOTHING;
COMMIT;

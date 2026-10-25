-- Additive migration for Quality grants in the isolated Mapa database.
-- Apply with psql -v ON_ERROR_STOP=1 after an immediate pg_dump and regression baseline.
BEGIN;
CREATE TABLE unificado_auth.user_action_permissions (
  user_id text NOT NULL REFERENCES public.usuarios(id) ON DELETE CASCADE,
  action_id text NOT NULL CHECK (action_id LIKE 'qualidade.%'),
  granted_by text NOT NULL,
  granted_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY(user_id,action_id)
);
CREATE INDEX user_action_permissions_action_idx
  ON unificado_auth.user_action_permissions(action_id);
CREATE TABLE unificado_auth.user_quality_areas (
  user_id text NOT NULL REFERENCES public.usuarios(id) ON DELETE CASCADE,
  area_codigo text NOT NULL,
  granted_by text NOT NULL,
  granted_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY(user_id,area_codigo)
);
GRANT USAGE ON SCHEMA unificado_auth TO mapa_api_login;
GRANT SELECT,INSERT,UPDATE,DELETE ON unificado_auth.user_action_permissions,
  unificado_auth.user_quality_areas TO mapa_api_login;
COMMIT;

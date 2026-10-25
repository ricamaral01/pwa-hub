BEGIN;
ALTER TABLE public.usuarios ADD COLUMN IF NOT EXISTS deleted_at timestamptz;
GRANT SELECT (deleted_at), UPDATE (deleted_at) ON public.usuarios TO mapa_api_login;
CREATE TABLE IF NOT EXISTS unificado_auth.user_actions (
  id bigserial PRIMARY KEY,
  actor_id text NOT NULL,
  target_id text NOT NULL,
  target_name text NOT NULL,
  action text NOT NULL CHECK (action IN ('deactivate','reactivate','delete')),
  acted_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS user_actions_target_time_idx
  ON unificado_auth.user_actions (target_id, acted_at DESC);
CREATE TABLE IF NOT EXISTS unificado_auth.user_screen_permissions (
  user_id text NOT NULL,
  screen_id text NOT NULL,
  allowed boolean NOT NULL,
  updated_by text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, screen_id)
);
CREATE TABLE IF NOT EXISTS unificado_auth.guest_action_permissions (
  user_id text NOT NULL REFERENCES public.usuarios(id),
  screen_id text NOT NULL,
  action text NOT NULL CHECK (action IN ('view','create','edit','delete','export','approve')),
  updated_by text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, screen_id, action)
);
CREATE INDEX IF NOT EXISTS guest_action_permissions_user_idx
  ON unificado_auth.guest_action_permissions (user_id);
GRANT USAGE ON SCHEMA unificado_auth TO mapa_api_login;
GRANT SELECT,INSERT,UPDATE,DELETE ON unificado_auth.user_actions,
  unificado_auth.user_screen_permissions,
  unificado_auth.guest_action_permissions TO mapa_api_login;
GRANT USAGE,SELECT ON SEQUENCE unificado_auth.user_actions_id_seq TO mapa_api_login;
COMMIT;

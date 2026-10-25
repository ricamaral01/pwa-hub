-- Explicit GED links approved by an administrator. No name/email matching.
BEGIN;
CREATE TABLE IF NOT EXISTS unificado_auth.ged_identity_links (
  mapa_user_id text PRIMARY KEY REFERENCES public.usuarios(id) ON DELETE RESTRICT,
  ged_user_id uuid NOT NULL UNIQUE,
  ged_role text NOT NULL CHECK (ged_role IN (
    'LEITOR','OPERACIONAL','COLABORADOR','SUPERVISOR','QUALIDADE',
    'GERENCIA','DIRETORIA','ADMIN','ADMIN_MASTER')),
  active boolean NOT NULL DEFAULT true,
  approved_by text NOT NULL,
  approved_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT,INSERT,UPDATE ON unificado_auth.ged_identity_links TO mapa_api_login;
COMMIT;

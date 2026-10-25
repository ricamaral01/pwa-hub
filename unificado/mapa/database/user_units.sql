-- Administrative unit for unified users. Legacy sector remains an internal
-- production constraint and is not reused as a unit identifier.
CREATE TABLE IF NOT EXISTS unificado_auth.user_units (
    user_id text PRIMARY KEY REFERENCES public.usuarios(id) ON DELETE CASCADE,
    unit_code text NOT NULL CHECK (unit_code IN ('campinas','pederneiras','ribeirao','noroeste')),
    updated_by text NOT NULL,
    updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON unificado_auth.user_units TO mapa_api_login;

-- Execute only in mapa_unificado_teste. No identity is inferred from matching names.
CREATE SCHEMA IF NOT EXISTS unificado_auth;

CREATE TABLE IF NOT EXISTS unificado_auth.identity_links (
    id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    pcp_user_id integer NOT NULL,
    mapa_login text NOT NULL,
    confirmed_at timestamptz NOT NULL DEFAULT now(),
    unified_password_set boolean NOT NULL DEFAULT false,
    requires_reset boolean NOT NULL DEFAULT true,
    pcp_hash text,
    mapa_hash text,
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT identity_links_pair_key UNIQUE (pcp_user_id, mapa_login),
    CONSTRAINT unified_hashes_together CHECK (
        (pcp_hash IS NULL AND mapa_hash IS NULL)
        OR (pcp_hash IS NOT NULL AND mapa_hash IS NOT NULL)
    ),
    CONSTRAINT unified_flag_has_hashes CHECK (
        NOT unified_password_set OR (pcp_hash IS NOT NULL AND mapa_hash IS NOT NULL)
    )
);

-- Existing test installations started with one-to-one constraints. Ricardo
-- confirmed overlapping pairs; keep every source account and its own profile.
ALTER TABLE unificado_auth.identity_links
    DROP CONSTRAINT IF EXISTS identity_links_pcp_user_id_key,
    DROP CONSTRAINT IF EXISTS identity_links_mapa_login_key;
CREATE UNIQUE INDEX IF NOT EXISTS identity_links_pair_idx
    ON unificado_auth.identity_links (pcp_user_id, mapa_login);

REVOKE ALL ON SCHEMA unificado_auth FROM PUBLIC;
REVOKE ALL ON unificado_auth.identity_links FROM PUBLIC;
GRANT USAGE ON SCHEMA unificado_auth TO mapa_api_login;
GRANT SELECT, INSERT, UPDATE, DELETE ON unificado_auth.identity_links TO mapa_api_login;
GRANT USAGE, SELECT ON SEQUENCE unificado_auth.identity_links_id_seq TO mapa_api_login;

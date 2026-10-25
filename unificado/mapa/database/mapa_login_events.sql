-- Applies only to the unified Mapa database. Never run against the old Mapa.
CREATE SCHEMA IF NOT EXISTS unificado_auth;
CREATE TABLE IF NOT EXISTS unificado_auth.mapa_login_events (
    id bigserial PRIMARY KEY,
    user_id text NOT NULL,
    role_at_login text NOT NULL,
    sector_at_login text,
    logged_at timestamptz NOT NULL DEFAULT now(),
    login_day date NOT NULL DEFAULT (timezone('America/Sao_Paulo', now())::date)
);
CREATE INDEX IF NOT EXISTS mapa_login_events_day_role_sector_idx
    ON unificado_auth.mapa_login_events (login_day, role_at_login, sector_at_login, user_id);
CREATE TABLE IF NOT EXISTS unificado_auth.mapa_login_tracking (
    id boolean PRIMARY KEY DEFAULT true CHECK (id),
    started_on date NOT NULL
);
INSERT INTO unificado_auth.mapa_login_tracking (id, started_on)
VALUES (true, timezone('America/Sao_Paulo', now())::date)
ON CONFLICT (id) DO NOTHING;
GRANT SELECT, INSERT ON unificado_auth.mapa_login_events TO mapa_api_login;
GRANT USAGE ON SEQUENCE unificado_auth.mapa_login_events_id_seq TO mapa_api_login;
GRANT SELECT ON unificado_auth.mapa_login_tracking TO mapa_api_login;

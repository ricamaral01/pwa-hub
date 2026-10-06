-- Defects supplied without a post or inspection identifier. They are kept apart
-- from montage_poste so per-post inspection rates cannot be inflated.
CREATE TABLE IF NOT EXISTS unificado_auth.reported_defects (
    source_key text NOT NULL,
    source_sha256 text NOT NULL,
    source_line integer NOT NULL CHECK (source_line > 0),
    event_date date NOT NULL,
    sector text NOT NULL,
    model text,
    defect_code text NOT NULL,
    defect_name text NOT NULL,
    created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
    PRIMARY KEY (source_key, source_line)
);

CREATE INDEX IF NOT EXISTS reported_defects_period_sector_idx
    ON unificado_auth.reported_defects (event_date, sector);

GRANT SELECT ON unificado_auth.reported_defects TO mapa_api_login;

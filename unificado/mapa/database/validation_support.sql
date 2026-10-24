CREATE SCHEMA IF NOT EXISTS unificado_auth;

CREATE TABLE IF NOT EXISTS unificado_auth.problem_reports (
  id bigserial PRIMARY KEY,
  created_at timestamptz NOT NULL DEFAULT now(),
  actor text NOT NULL,
  screen text NOT NULL,
  version text NOT NULL,
  report_text text NOT NULL CHECK (length(report_text) BETWEEN 1 AND 4000)
);

CREATE TABLE IF NOT EXISTS unificado_auth.client_errors (
  id bigserial PRIMARY KEY,
  created_at timestamptz NOT NULL DEFAULT now(),
  actor_hash text NOT NULL,
  route text NOT NULL,
  error_code text NOT NULL,
  version text NOT NULL,
  message text NOT NULL DEFAULT ''
);

REVOKE ALL ON unificado_auth.problem_reports, unificado_auth.client_errors FROM PUBLIC;

-- API histórica local, vinculada somente a 127.0.0.1 na VPS de testes.
-- Nenhum privilégio de escrita é concedido nesta etapa.

BEGIN;

CREATE SCHEMA IF NOT EXISTS api;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'mapa_api_reader') THEN
    CREATE ROLE mapa_api_reader NOLOGIN;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'mapa_api_authenticator') THEN
    CREATE ROLE mapa_api_authenticator LOGIN NOINHERIT;
  END IF;
END $$;

GRANT CONNECT ON DATABASE mapa_unificado_teste TO mapa_api_authenticator;
GRANT mapa_api_reader TO mapa_api_authenticator;
GRANT USAGE ON SCHEMA api TO mapa_api_reader;

CREATE OR REPLACE VIEW api.usuarios AS
  SELECT id, nome, perfil, ativo, created_at, updated_at, setor, primeiro_acesso
  FROM public.usuarios;
CREATE OR REPLACE VIEW api.programacao_pcp AS SELECT * FROM public.programacao_pcp;
CREATE OR REPLACE VIEW api.liberacao_formas AS SELECT * FROM public.liberacao_formas;
CREATE OR REPLACE VIEW api.producao AS SELECT * FROM public.producao;
CREATE OR REPLACE VIEW api.montagem_poste AS SELECT * FROM public.montagem_poste;
CREATE OR REPLACE VIEW api.formas_manutencao AS SELECT * FROM public.formas_manutencao;
CREATE OR REPLACE VIEW api.prog_s3_s4 AS SELECT * FROM public.prog_s3_s4;

GRANT SELECT ON ALL TABLES IN SCHEMA api TO mapa_api_reader;

COMMIT;

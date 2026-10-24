-- Escritas operacionais limitadas à base mapa_unificado_teste.
BEGIN;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'mapa_api_writer') THEN
    CREATE ROLE mapa_api_writer LOGIN;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.mapa_operation_audit (
  id bigserial PRIMARY KEY,
  actor_id text NOT NULL,
  actor_role text NOT NULL,
  phase text NOT NULL,
  result text NOT NULL,
  record_id text NOT NULL,
  data_fabricacao date NOT NULL,
  setor text NOT NULL,
  forma text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT CONNECT ON DATABASE mapa_unificado_teste TO mapa_api_writer;
GRANT USAGE ON SCHEMA public TO mapa_api_writer;
GRANT SELECT, INSERT, UPDATE ON public.programacao_pcp TO mapa_api_writer;
GRANT SELECT, INSERT, UPDATE ON public.liberacao_formas TO mapa_api_writer;
GRANT SELECT, INSERT, UPDATE ON public.producao TO mapa_api_writer;
GRANT SELECT, INSERT, UPDATE ON public.montagem_poste TO mapa_api_writer;
GRANT INSERT ON public.mapa_operation_audit TO mapa_api_writer;
GRANT USAGE ON SEQUENCE public.mapa_operation_audit_id_seq TO mapa_api_writer;

COMMIT;

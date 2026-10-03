-- Operações PostgREST no banco isolado mapa_unificado_teste.
-- A autenticação HTTP e a seleção de perfil continuam no proxy Flask.
BEGIN;

GRANT CONNECT ON DATABASE mapa_unificado_teste TO mapa_api_writer;
GRANT USAGE ON SCHEMA api TO mapa_api_writer;
GRANT SELECT ON api.vw_formas_status TO mapa_api_writer;

GRANT SELECT, INSERT, UPDATE, DELETE ON
  api.programacao_pcp, api.liberacao_formas, api.producao,
  api.montagem_poste, api.formas_manutencao, api.prog_s3_s4
TO mapa_api_writer;

GRANT SELECT, INSERT, UPDATE, DELETE ON
  public.programacao_pcp, public.liberacao_formas, public.producao,
  public.montagem_poste, public.formas_manutencao, public.prog_s3_s4
TO mapa_api_writer;

COMMIT;

NOTIFY pgrst, 'reload schema';

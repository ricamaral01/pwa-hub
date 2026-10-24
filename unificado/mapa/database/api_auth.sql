-- Executar apenas em mapa_unificado_teste. Acesso minimo para verificar logins.
BEGIN;
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'mapa_api_login') THEN
    CREATE ROLE mapa_api_login LOGIN;
  END IF;
END $$;
GRANT CONNECT ON DATABASE mapa_unificado_teste TO mapa_api_login;
GRANT USAGE ON SCHEMA public TO mapa_api_login;
GRANT SELECT (id, nome, perfil, ativo, setor, primeiro_acesso, senha_hash, updated_at)
  ON public.usuarios TO mapa_api_login;
GRANT UPDATE (senha_hash, primeiro_acesso, updated_at)
  ON public.usuarios TO mapa_api_login;
COMMIT;

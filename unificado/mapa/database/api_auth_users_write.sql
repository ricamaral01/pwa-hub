-- Somente o serviço de autenticação pode gravar cadastro e hash de usuários.
-- O papel PostgREST de escrita operacional permanece sem acesso a senhas.
BEGIN;

GRANT SELECT (created_at) ON public.usuarios TO mapa_api_login;
GRANT INSERT, DELETE ON public.usuarios TO mapa_api_login;
GRANT UPDATE (nome, perfil, ativo, setor, primeiro_acesso, senha_hash, updated_at)
  ON public.usuarios TO mapa_api_login;

COMMIT;

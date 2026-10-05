-- Read-only access for the unified PCP Formas por Setor catalog.
-- The login service reads Mapa maintenance state; it cannot change this table.
GRANT SELECT ON public.formas_manutencao TO mapa_api_login;

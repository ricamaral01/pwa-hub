-- The authenticated dashboard needs only these five production columns.
-- No INSERT, UPDATE, DELETE, or access to other columns is granted.
GRANT SELECT (id, data_fabricacao, setor, forma, modelo)
ON public.producao TO mapa_api_login;

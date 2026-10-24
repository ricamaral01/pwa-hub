-- RPC de leitura usada pelo Dashboard de Produtividade do app.js original.
-- Aplicar somente a mapa_unificado_teste. A função não grava dados.
CREATE OR REPLACE FUNCTION api.rpc_dashboard_produtividade_resumo_v1(
  p_data_inicio date,
  p_data_fim date,
  p_scope text
) RETURNS jsonb
LANGUAGE sql STABLE
AS $$
WITH parametros AS (
  SELECT CASE p_scope
    WHEN 'S1' THEN ARRAY['Setor 1']::text[]
    WHEN 'S2' THEN ARRAY['Setor 2']::text[]
    WHEN 'S3' THEN ARRAY['Setor 3']::text[]
    WHEN 'S4' THEN ARRAY['Setor 4']::text[]
    WHEN 'S1_S2' THEN ARRAY['Setor 1', 'Setor 2']::text[]
    ELSE ARRAY['Setor 1', 'Setor 2', 'Setor 3', 'Setor 4']::text[]
  END AS included_sectors
), linhas AS (
  SELECT p.data_fabricacao, p.setor, p.tipo_concreto
  FROM api.producao AS p, parametros AS params
  WHERE p.data_fabricacao BETWEEN p_data_inicio AND p_data_fim
    AND p.setor = ANY(params.included_sectors)
), totais AS (
  SELECT count(*)::integer AS total_formas,
         count(DISTINCT data_fabricacao)::integer AS dias,
         count(*) FILTER (WHERE tipo_concreto <> 'Concreto Padrão')::integer AS fora_padrao
  FROM linhas
), por_setor AS (
  SELECT coalesce(jsonb_object_agg('S' || right(setor, 1), total), '{}'::jsonb) AS dados
  FROM (SELECT setor, count(*)::integer AS total FROM linhas GROUP BY setor) AS agrupado
)
SELECT jsonb_build_object(
  'kpis', jsonb_build_object(
    'dias', totais.dias,
    'fora_padrao', totais.fora_padrao,
    'total_formas', totais.total_formas,
    'media_formas_dia', CASE WHEN totais.dias > 0
      THEN round(totais.total_formas::numeric / totais.dias, 2) ELSE 0 END
  ),
  'scope', p_scope,
  'by_sector', por_setor.dados,
  'generated_at', now(),
  'contract_version', 'dashboard-produtividade-v1',
  'included_sectors', to_jsonb(parametros.included_sectors)
)
FROM parametros, totais, por_setor;
$$;

REVOKE ALL ON FUNCTION api.rpc_dashboard_produtividade_resumo_v1(date, date, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION api.rpc_dashboard_produtividade_resumo_v1(date, date, text) TO mapa_api_reader;

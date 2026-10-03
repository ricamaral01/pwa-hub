-- Contrato de leitura usado pelos cartões de formas do Mapa atual.
-- Aplicar somente em mapa_unificado_teste.

BEGIN;

DROP VIEW IF EXISTS api.vw_formas_status;

CREATE VIEW api.vw_formas_status AS
WITH chaves AS (
  SELECT data_fabricacao, setor, upper(btrim(forma)) AS forma
  FROM public.programacao_pcp
  WHERE data_fabricacao IS NOT NULL AND forma IS NOT NULL
  UNION
  SELECT data_fabricacao, setor, upper(btrim(forma)) AS forma
  FROM public.liberacao_formas
  WHERE data_fabricacao IS NOT NULL AND forma IS NOT NULL
  UNION
  SELECT data_fabricacao, setor, upper(btrim(forma)) AS forma
  FROM public.producao
  WHERE data_fabricacao IS NOT NULL AND forma IS NOT NULL
    AND (status IN ('LIBERADO', 'CONCRETADO') OR tipo_concreto IS NOT NULL)
),
programacao AS (
  SELECT DISTINCT ON (data_fabricacao, setor, upper(btrim(forma)))
    id, data_fabricacao, setor, upper(btrim(forma)) AS forma, data_hora,
    modelo, codigo_poste, descricao_poste, codigo_produto, quantidade
  FROM public.programacao_pcp
  WHERE data_fabricacao IS NOT NULL AND forma IS NOT NULL
  ORDER BY data_fabricacao, setor, upper(btrim(forma)), data_hora DESC NULLS LAST, id DESC
),
liberacao AS (
  SELECT DISTINCT ON (data_fabricacao, setor, upper(btrim(forma)))
    id, data_fabricacao, setor, upper(btrim(forma)) AS forma, colaborador, data_hora
  FROM public.liberacao_formas
  WHERE data_fabricacao IS NOT NULL AND forma IS NOT NULL
  ORDER BY data_fabricacao, setor, upper(btrim(forma)), data_hora DESC NULLS LAST, id DESC
),
producao_atual AS (
  SELECT DISTINCT ON (data_fabricacao, setor, upper(btrim(forma)))
    id, data_fabricacao, setor, upper(btrim(forma)) AS forma,
    tipo_concreto, colaborador, data_hora,
    modelo, codigo_poste, descricao_poste, codigo_produto
  FROM public.producao
  WHERE data_fabricacao IS NOT NULL AND forma IS NOT NULL
    AND (status IN ('LIBERADO', 'CONCRETADO') OR tipo_concreto IS NOT NULL)
  ORDER BY data_fabricacao, setor, upper(btrim(forma)), data_hora DESC NULLS LAST, id DESC
)
SELECT
  chaves.data_fabricacao, chaves.setor, chaves.forma,
  programacao.id AS prog_id,
  liberacao.id AS lib_id, liberacao.colaborador AS lib_colaborador,
  liberacao.data_hora AS lib_data_hora,
  producao_atual.id AS prod_id,
  producao_atual.tipo_concreto AS prod_tipo_concreto,
  producao_atual.colaborador AS prod_colaborador,
  producao_atual.data_hora AS prod_data_hora,
  programacao.modelo AS prog_modelo,
  programacao.codigo_poste AS prog_codigo_poste,
  programacao.descricao_poste AS prog_descricao_poste,
  programacao.codigo_produto AS prog_codigo_produto,
  programacao.quantidade AS prog_quantidade,
  producao_atual.modelo AS prod_modelo,
  producao_atual.codigo_poste AS prod_codigo_poste,
  producao_atual.descricao_poste AS prod_descricao_poste,
  producao_atual.codigo_produto AS prod_codigo_produto
FROM chaves
LEFT JOIN programacao USING (data_fabricacao, setor, forma)
LEFT JOIN liberacao USING (data_fabricacao, setor, forma)
LEFT JOIN producao_atual USING (data_fabricacao, setor, forma);

GRANT SELECT ON api.vw_formas_status TO mapa_api_reader;

COMMIT;

NOTIFY pgrst, 'reload schema';

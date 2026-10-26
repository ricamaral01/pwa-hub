-- Apply only after the reference table, backend and new browser bundle are installed.
BEGIN;
WITH latest AS (
  SELECT versao, valores
  FROM ensaio_postes.criterio
  ORDER BY versao DESC
  LIMIT 1
)
INSERT INTO ensaio_postes.criterio
(versao, vigente_desde, valores, criado_por, motivo)
SELECT versao + 1, now(),
       jsonb_set(valores, '{dimensional}',
         coalesce(valores->'dimensional', '{}'::jsonb) ||
         jsonb_build_object(
           'usar_nominais_modelo', true,
           'fonte', 'Tabelas A.1/A.2 fornecidas; comprimento ±50 mm, seções ±5 mm e cota e ±15 mm; F/J sem critério ativo',
           'tolerancia_comprimento_mm', '50',
           'tolerancia_secao_mm', '5',
           'tolerancia_engastamento_mm', '15'), true),
       'sistema',
       'Ativar referências dimensionais importadas das tabelas A.1 e A.2 fornecidas pelo usuário.'
FROM latest
WHERE coalesce((valores->'dimensional'->>'usar_nominais_modelo')::boolean, false) = false;
COMMIT;

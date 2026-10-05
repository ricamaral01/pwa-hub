-- Destino: mapa_unificado_teste. Fonte: catalogo Supabase exportado em 05/10/2026.
-- Aplicar apos backup com restauracao testada. Nao altera linhas existentes.
BEGIN;

ALTER TABLE public.programacao_pcp
  ADD CONSTRAINT programacao_pcp_data_fabricacao_setor_forma_key
  UNIQUE USING INDEX programacao_pcp_data_setor_forma_unificado_uidx;
ALTER TABLE public.liberacao_formas
  ADD CONSTRAINT liberacao_formas_data_fabricacao_setor_forma_key
  UNIQUE USING INDEX liberacao_formas_data_setor_forma_unificado_uidx;
ALTER TABLE public.prog_s3_s4
  ADD CONSTRAINT prog_s3_s4_unique
  UNIQUE USING INDEX prog_s3_s4_data_forma_setor_unificado_uidx;

ALTER TABLE public.montagem_poste
  ALTER COLUMN checklists SET DEFAULT '{}'::jsonb;
ALTER TABLE public.prog_s3_s4
  ALTER COLUMN modelo SET DEFAULT ''::text;
ALTER INDEX public.prog_s3_s4_data_setor_idx RENAME TO idx_prog_s3_s4_data_setor;

CREATE VIEW public.vw_formas_status AS
WITH unique_keys AS (
  SELECT data_fabricacao, setor, forma FROM public.programacao_pcp
  UNION
  SELECT data_fabricacao, setor, forma FROM public.liberacao_formas
  UNION
  SELECT data_fabricacao, setor, forma FROM public.producao
)
SELECT uk.data_fabricacao, uk.setor, uk.forma,
       prog.id AS prog_id, prog.modelo AS prog_modelo,
       prog.codigo_poste AS prog_codigo_poste,
       prog.descricao_poste AS prog_descricao_poste,
       prog.codigo_produto AS prog_codigo_produto,
       prog.quantidade AS prog_quantidade,
       lib.id AS lib_id, lib.data_hora AS lib_data_hora,
       lib.colaborador AS lib_colaborador,
       prod.id AS prod_id, prod.data_hora AS prod_data_hora,
       prod.modelo AS prod_modelo,
       prod.codigo_poste AS prod_codigo_poste,
       prod.descricao_poste AS prod_descricao_poste,
       prod.codigo_produto AS prod_codigo_produto,
       prod.tipo_concreto AS prod_tipo_concreto,
       prod.colaborador AS prod_colaborador
FROM unique_keys uk
LEFT JOIN public.programacao_pcp prog
  ON prog.data_fabricacao=uk.data_fabricacao AND prog.setor=uk.setor AND prog.forma=uk.forma
LEFT JOIN public.liberacao_formas lib
  ON lib.data_fabricacao=uk.data_fabricacao AND lib.setor=uk.setor AND lib.forma=uk.forma
LEFT JOIN public.producao prod
  ON prod.data_fabricacao=uk.data_fabricacao AND prod.setor=uk.setor AND prod.forma=uk.forma;

COMMIT;
NOTIFY pgrst, 'reload schema';

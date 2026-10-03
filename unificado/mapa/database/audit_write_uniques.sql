-- Read-only audit for the natural keys used by the original Mapa upserts.
SELECT 'programacao_pcp' AS tabela, count(*) AS grupos_duplicados
FROM (SELECT data_fabricacao,setor,forma FROM public.programacao_pcp
      GROUP BY 1,2,3 HAVING count(*) > 1) AS duplicates
UNION ALL
SELECT 'liberacao_formas', count(*)
FROM (SELECT data_fabricacao,setor,forma FROM public.liberacao_formas
      GROUP BY 1,2,3 HAVING count(*) > 1) AS duplicates
UNION ALL
SELECT 'prog_s3_s4', count(*)
FROM (SELECT data,forma,setor FROM public.prog_s3_s4
      GROUP BY 1,2,3 HAVING count(*) > 1) AS duplicates;

SELECT schemaname,tablename,indexname,indexdef FROM pg_indexes
WHERE schemaname='public' AND tablename IN
('programacao_pcp','liberacao_formas','producao','montagem_poste','formas_manutencao','prog_s3_s4')
ORDER BY tablename,indexname;

-- Somente SELECT; executar em mapa_unificado_teste.
WITH expected(table_name, conflict_columns, call_sites) AS (
  VALUES
    ('formas_manutencao', ARRAY['id']::text[], 'app.js:761'),
    ('programacao_pcp', ARRAY['data_fabricacao','setor','forma']::text[], 'app.js:1687'),
    ('liberacao_formas', ARRAY['data_fabricacao','setor','forma']::text[], 'app.js:1696'),
    ('prog_s3_s4', ARRAY['data','forma','setor']::text[], 'app.js:10182,14626')
), available AS (
  SELECT tbl.relname::text AS table_name, idx.relname::text AS index_name,
         array_agg(att.attname::text ORDER BY position.ordinality) AS columns,
         pg_catalog.pg_get_indexdef(idx.oid) AS definition
  FROM pg_catalog.pg_index ix
  JOIN pg_catalog.pg_class tbl ON tbl.oid = ix.indrelid
  JOIN pg_catalog.pg_namespace n ON n.oid = tbl.relnamespace
  JOIN pg_catalog.pg_class idx ON idx.oid = ix.indexrelid
  JOIN LATERAL unnest(ix.indkey) WITH ORDINALITY AS position(attnum, ordinality)
    ON position.ordinality <= ix.indnkeyatts
  JOIN pg_catalog.pg_attribute att ON att.attrelid = tbl.oid AND att.attnum = position.attnum
  WHERE n.nspname = 'public' AND ix.indisunique AND ix.indisvalid
    AND ix.indisready AND ix.indpred IS NULL AND ix.indexprs IS NULL
  GROUP BY tbl.relname, idx.relname, idx.oid
)
SELECT e.call_sites, e.table_name, array_to_string(e.conflict_columns, ',') AS on_conflict,
       coalesce(a.index_name, 'AUSENTE') AS unique_index,
       a.definition
FROM expected e
LEFT JOIN available a ON a.table_name = e.table_name
 AND a.columns @> e.conflict_columns AND e.conflict_columns @> a.columns
ORDER BY e.table_name;

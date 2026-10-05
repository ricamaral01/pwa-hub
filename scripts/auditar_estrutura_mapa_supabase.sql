-- Auditoria somente leitura do esquema public no Supabase.
-- Uma linha por objeto, com details em JSON para exportação CSV ou JSON.
-- Não consulta linhas das tabelas da aplicação e não altera nenhum objeto.
WITH target_schema AS (
  SELECT oid, nspname FROM pg_catalog.pg_namespace WHERE nspname = 'public'
), objects AS (
  SELECT 'table'::text AS object_type, n.nspname::text AS object_schema,
         c.relname::text AS object_name,
         pg_catalog.jsonb_build_object(
           'kind', c.relkind, 'rls_enabled', c.relrowsecurity,
           'rls_forced', c.relforcerowsecurity,
           'partition_key', pg_catalog.pg_get_partkeydef(c.oid)
         ) AS details
  FROM pg_catalog.pg_class c JOIN target_schema n ON n.oid = c.relnamespace
  WHERE c.relkind IN ('r', 'p', 'f')

  UNION ALL
  SELECT 'column', n.nspname, c.relname || '.' || a.attname,
         pg_catalog.jsonb_build_object(
           'table', c.relname, 'column', a.attname, 'position', a.attnum,
           'type', pg_catalog.format_type(a.atttypid, a.atttypmod),
           'nullable', NOT (a.attnotnull OR typ.typnotnull),
           'default', pg_catalog.pg_get_expr(d.adbin, d.adrelid),
           'identity', a.attidentity, 'generated', a.attgenerated
         )
  FROM pg_catalog.pg_class c
  JOIN target_schema n ON n.oid = c.relnamespace
  JOIN pg_catalog.pg_attribute a ON a.attrelid = c.oid
  JOIN pg_catalog.pg_type typ ON typ.oid = a.atttypid
  LEFT JOIN pg_catalog.pg_attrdef d ON d.adrelid = c.oid AND d.adnum = a.attnum
  WHERE c.relkind IN ('r', 'p', 'f', 'v', 'm')
    AND a.attnum > 0 AND NOT a.attisdropped

  UNION ALL
  SELECT 'constraint', n.nspname, c.relname || '.' || con.conname,
         pg_catalog.jsonb_build_object(
           'table', c.relname, 'name', con.conname,
           'type', CASE con.contype WHEN 'p' THEN 'primary_key'
                                    WHEN 'u' THEN 'unique'
                                    WHEN 'f' THEN 'foreign_key'
                                    WHEN 'c' THEN 'check'
                                    WHEN 'x' THEN 'exclusion' END,
           'definition', pg_catalog.pg_get_constraintdef(con.oid, true),
           'validated', con.convalidated,
           'deferrable', con.condeferrable,
           'initially_deferred', con.condeferred,
           'referenced_table', CASE WHEN con.confrelid <> 0
                                    THEN con.confrelid::pg_catalog.regclass::text END
         )
  FROM pg_catalog.pg_constraint con
  JOIN pg_catalog.pg_class c ON c.oid = con.conrelid
  JOIN target_schema n ON n.oid = c.relnamespace
  WHERE con.contype IN ('p', 'u', 'f', 'c', 'x')

  UNION ALL
  SELECT 'index', n.nspname, idx.relname,
         pg_catalog.jsonb_build_object(
           'table', tbl.relname, 'definition', pg_catalog.pg_get_indexdef(idx.oid),
           'unique', i.indisunique, 'primary', i.indisprimary,
           'valid', i.indisvalid, 'ready', i.indisready,
           'predicate', pg_catalog.pg_get_expr(i.indpred, i.indrelid)
         )
  FROM pg_catalog.pg_index i
  JOIN pg_catalog.pg_class idx ON idx.oid = i.indexrelid
  JOIN pg_catalog.pg_class tbl ON tbl.oid = i.indrelid
  JOIN target_schema n ON n.oid = tbl.relnamespace

  UNION ALL
  SELECT 'sequence', s.schemaname, s.sequencename,
         pg_catalog.jsonb_build_object(
           'data_type', s.data_type, 'start_value', s.start_value,
           'min_value', s.min_value, 'max_value', s.max_value,
           'increment', s.increment_by, 'cycle', s.cycle,
           'cache_size', s.cache_size, 'last_value', s.last_value,
           'last_value_visible', s.last_value IS NOT NULL
         )
  FROM pg_catalog.pg_sequences s WHERE s.schemaname = 'public'

  UNION ALL
  SELECT 'trigger', n.nspname, c.relname || '.' || t.tgname,
         pg_catalog.jsonb_build_object(
           'table', c.relname, 'name', t.tgname,
           'events', pg_catalog.array_remove(ARRAY[
             CASE WHEN (t.tgtype & 4) <> 0 THEN 'INSERT' END,
             CASE WHEN (t.tgtype & 8) <> 0 THEN 'DELETE' END,
             CASE WHEN (t.tgtype & 16) <> 0 THEN 'UPDATE' END,
             CASE WHEN (t.tgtype & 32) <> 0 THEN 'TRUNCATE' END
           ], NULL),
           'definition', pg_catalog.pg_get_triggerdef(t.oid, true),
           'function', t.tgfoid::pg_catalog.regprocedure::text,
           'enabled', t.tgenabled
         )
  FROM pg_catalog.pg_trigger t
  JOIN pg_catalog.pg_class c ON c.oid = t.tgrelid
  JOIN target_schema n ON n.oid = c.relnamespace
  WHERE NOT t.tgisinternal

  UNION ALL
  SELECT 'function', n.nspname,
         p.proname || '(' || pg_catalog.pg_get_function_identity_arguments(p.oid) || ')',
         pg_catalog.jsonb_build_object(
           'name', p.proname,
           'arguments', pg_catalog.pg_get_function_arguments(p.oid),
           'identity_arguments', pg_catalog.pg_get_function_identity_arguments(p.oid),
           'returns', pg_catalog.pg_get_function_result(p.oid),
           'kind', p.prokind, 'language', l.lanname, 'security_definer', p.prosecdef,
           'volatility', p.provolatile, 'body', p.prosrc,
           'definition', CASE WHEN p.prokind = 'a' THEN NULL
                              ELSE pg_catalog.pg_get_functiondef(p.oid) END
         )
  FROM pg_catalog.pg_proc p
  JOIN target_schema n ON n.oid = p.pronamespace
  JOIN pg_catalog.pg_language l ON l.oid = p.prolang

  UNION ALL
  SELECT 'rls_policy', pol.schemaname, pol.tablename || '.' || pol.policyname,
         pg_catalog.jsonb_build_object(
           'table', pol.tablename, 'name', pol.policyname,
           'permissive', pol.permissive, 'roles', pol.roles,
           'command', pol.cmd, 'using', pol.qual,
           'with_check', pol.with_check
         )
  FROM pg_catalog.pg_policies pol WHERE pol.schemaname = 'public'

  UNION ALL
  SELECT 'view', n.nspname, c.relname,
         pg_catalog.jsonb_build_object(
           'definition', pg_catalog.pg_get_viewdef(c.oid, true),
           'materialized', c.relkind = 'm',
           'security_barrier', EXISTS (
             SELECT 1 FROM pg_catalog.pg_options_to_table(c.reloptions) opt
             WHERE opt.option_name = 'security_barrier' AND opt.option_value = 'true'
           )
         )
  FROM pg_catalog.pg_class c JOIN target_schema n ON n.oid = c.relnamespace
  WHERE c.relkind IN ('v', 'm')
), result AS (
  SELECT 'summary'::text AS object_type, 'public'::text AS object_schema,
         'catalog'::text AS object_name,
         pg_catalog.jsonb_build_object(
           'object_count', (SELECT count(*) FROM objects),
           'counts_by_type', (SELECT pg_catalog.jsonb_object_agg(object_type, amount)
                              FROM (SELECT object_type, count(*) AS amount
                                    FROM objects GROUP BY object_type) grouped)
         ) AS details
  UNION ALL
  SELECT object_type, object_schema, object_name, details FROM objects
)
SELECT object_type, object_schema, object_name, details FROM result
ORDER BY (object_type <> 'summary'), object_type, object_schema, object_name;

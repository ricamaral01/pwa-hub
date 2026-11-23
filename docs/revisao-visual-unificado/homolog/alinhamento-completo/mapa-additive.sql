BEGIN;
SET LOCAL statement_timeout='180s';
SET LOCAL lock_timeout='10s';
SET LOCAL check_function_bodies=false;
CREATE SCHEMA dosagem;
CREATE SCHEMA estoque;
CREATE SCHEMA lab;
CREATE SCHEMA noro_sup;
CREATE SCHEMA usina_manutencao;
CREATE SCHEMA usinas_reporting;
CREATE OR REPLACE FUNCTION api.rpc_dashboard_produtividade_resumo_v1(p_data_inicio date, p_data_fim date, p_scope text) RETURNS jsonb
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
CREATE OR REPLACE FUNCTION dosagem.ctdosagem_versao_imutavel() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
        BEGIN
          IF OLD.estado = 'aprovado' THEN
            RAISE EXCEPTION 'versão aprovada imutável';
          END IF;
          RETURN NEW;
        END
        $$;
CREATE OR REPLACE FUNCTION lab.delete_noro_local_cp(p_local_id text) RETURNS boolean
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'pg_catalog', 'lab'
    AS $$
DECLARE deleted_count integer;
BEGIN
  DELETE FROM lab.cp_leitura
   WHERE unidade_id='noroeste' AND fonte_tabela='unificado'
     AND local_id=p_local_id;
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count > 0;
END $$;
CREATE OR REPLACE FUNCTION public.dashboard_jsonb_count_value_v1(p_value jsonb, p_expected text) RETURNS integer
    LANGUAGE plpgsql IMMUTABLE
    AS $$
declare
  item jsonb;
  total integer := 0;
begin
  if p_value is null then
    return 0;
  end if;

  case jsonb_typeof(p_value)
    when 'object' then
      for item in select value from jsonb_each(p_value) loop
        total := total + public.dashboard_jsonb_count_value_v1(item, p_expected);
      end loop;
    when 'array' then
      for item in select value from jsonb_array_elements(p_value) loop
        total := total + public.dashboard_jsonb_count_value_v1(item, p_expected);
      end loop;
    when 'string' then
      if lower(trim(both '"' from p_value::text)) = lower(p_expected) then
        total := total + 1;
      end if;
    else
      total := total;
  end case;

  return total;
end;
$$;
CREATE OR REPLACE FUNCTION public.dashboard_jsonb_rejected_labels_v1(p_value jsonb) RETURNS TABLE(label text)
    LANGUAGE plpgsql IMMUTABLE
    AS $$
declare
  item record;
begin
  if p_value is null then
    return;
  end if;

  case jsonb_typeof(p_value)
    when 'object' then
      for item in select key, value from jsonb_each(p_value) loop
        if jsonb_typeof(item.value) = 'string' and lower(trim(item.value #>> '{}')) = 'nao' then
          label := item.key;
          return next;
        elsif jsonb_typeof(item.value) in ('object', 'array') then
          return query select child.label from public.dashboard_jsonb_rejected_labels_v1(item.value) child;
        end if;
      end loop;
    when 'array' then
      for item in select value from jsonb_array_elements(p_value) loop
        return query select child.label from public.dashboard_jsonb_rejected_labels_v1(item.value) child;
      end loop;
  end case;
end;
$$;
CREATE OR REPLACE FUNCTION public.dashboard_jsonb_string_leaf_count_v1(p_value jsonb) RETURNS integer
    LANGUAGE plpgsql IMMUTABLE
    AS $$
declare
  item jsonb;
  total integer := 0;
begin
  if p_value is null then
    return 0;
  end if;

  case jsonb_typeof(p_value)
    when 'object' then
      for item in select value from jsonb_each(p_value) loop
        total := total + public.dashboard_jsonb_string_leaf_count_v1(item);
      end loop;
    when 'array' then
      for item in select value from jsonb_array_elements(p_value) loop
        total := total + public.dashboard_jsonb_string_leaf_count_v1(item);
      end loop;
    when 'string' then
      total := 1;
    else
      total := 0;
  end case;

  return total;
end;
$$;
CREATE OR REPLACE FUNCTION public.dashboard_scope_sectors_v1(p_scope text) RETURNS text[]
    LANGUAGE sql IMMUTABLE
    AS $$
  select case upper(coalesce(p_scope, 'TOTAL'))
    when 'S1' then array['Setor 1']
    when 'S2' then array['Setor 2']
    when 'S3' then array['Setor 3']
    when 'S4' then array['Setor 4']
    when 'S1_S2' then array['Setor 1', 'Setor 2']
    else array['Setor 1', 'Setor 2', 'Setor 3', 'Setor 4']
  end;
$$;
CREATE OR REPLACE FUNCTION public.dashboard_sector_code_v1(p_setor text) RETURNS text
    LANGUAGE sql IMMUTABLE
    AS $$
  select case trim(coalesce(p_setor, ''))
    when 'Setor 1' then 'S1'
    when 'Setor 2' then 'S2'
    when 'Setor 3' then 'S3'
    when 'Setor 4' then 'S4'
    else 'UNCLASSIFIED'
  end;
$$;
CREATE OR REPLACE FUNCTION public.rpc_dashboard_defeitos_resumo_v1(p_data_inicio date, p_data_fim date, p_scope text DEFAULT 'TOTAL'::text) RETURNS jsonb
    LANGUAGE sql STABLE
    AS $$
  with montagem as (
    select *
    from public.vw_dashboard_montagem_base_v1
    where data_fabricacao between p_data_inicio and p_data_fim
      and setor = any(public.dashboard_scope_sectors_v1(p_scope))
  ),
  producao as (
    select *
    from public.vw_dashboard_producao_base_v1
    where data_fabricacao between p_data_inicio and p_data_fim
      and setor = any(public.dashboard_scope_sectors_v1(p_scope))
      and status in ('LIBERADO', 'INSPECIONADO', 'CONCRETADO')
  ),
  rejected as (
    select
      m.setor_code,
      coalesce(nullif(trim(replace(r.label, '_', ' ')), ''), 'Sem descricao') as label
    from montagem m
    cross join lateral public.dashboard_jsonb_rejected_labels_v1(m.checklists) r
  ),
  totals as (
    select
      (select count(*)::integer from producao) as producao,
      count(*)::integer as postes,
      coalesce(sum(defeitos_oportunidades), 0)::integer as total_possivel,
      coalesce(sum(defeitos_ocorrencias), 0)::integer as total_erros,
      count(*) filter (where defeitos_ocorrencias > 0)::integer as postes_com_defeito,
      count(*) filter (where status_montagem in ('R', 'REPROVADO'))::integer as postes_reprovados,
      count(*) filter (where status_montagem = 'RR')::integer as retrabalho
    from montagem
  ),
  by_sector as (
    select jsonb_object_agg(setor_code, data order by setor_code) as data
    from (
      select
        m.setor_code,
        jsonb_build_object(
          'postes', count(*)::integer,
          'producao', (select count(*)::integer from producao p where p.setor_code = m.setor_code),
          'erros', coalesce(sum(m.defeitos_ocorrencias), 0)::integer,
          'oportunidades', coalesce(sum(m.defeitos_oportunidades), 0)::integer
        ) as data
      from montagem m
      group by m.setor_code
    ) s
  ),
  by_defect as (
    select jsonb_object_agg(label, total order by total desc, label) as data
    from (
      select label, count(*)::integer as total
      from rejected
      group by label
      order by count(*) desc, label
    ) d
  ),
  defect_matrix as (
    select jsonb_object_agg(label, setores order by label) as data
    from (
      select
        label,
        jsonb_object_agg(setor_code, total order by setor_code) as setores
      from (
        select label, setor_code, count(*)::integer as total
        from rejected
        group by label, setor_code
      ) x
      group by label
    ) m
  ),
  fissuras as (
    select
      count(*) filter (where label ~* 'fissura')::integer as total,
      count(*) filter (where label ~* 'fissura.*circular|circular.*fissura')::integer as circulares
    from rejected
  )
  select jsonb_build_object(
    'contract_version', 'dashboard-defeitos-v1',
    'generated_at', now(),
    'scope', p_scope,
    'included_sectors', public.dashboard_scope_sectors_v1(p_scope),
    'kpis', jsonb_build_object(
      'producao', coalesce(t.producao, 0),
      'postes', coalesce(t.postes, 0),
      'total_possivel', coalesce(t.total_possivel, 0),
      'total_erros', coalesce(t.total_erros, 0),
      'postes_com_defeito', coalesce(t.postes_com_defeito, 0),
      'postes_reprovados', coalesce(t.postes_reprovados, 0),
      'retrabalho', coalesce(t.retrabalho, 0),
      'taxa_nc', case when coalesce(t.total_possivel, 0) > 0 then round(t.total_erros::numeric / t.total_possivel * 100, 2) else 0 end,
      'indice_reprovacao', case when coalesce(t.postes, 0) > 0 then round(t.postes_com_defeito::numeric / t.postes * 100, 2) else 0 end,
      'taxa_postes_reprovados', case when coalesce(t.producao, 0) > 0 then round(t.postes_reprovados::numeric / t.producao * 100, 2) else 0 end,
      'taxa_retrabalho', case when coalesce(t.postes, 0) > 0 then round(t.retrabalho::numeric / t.postes * 100, 2) else 0 end,
      'fissuras', coalesce(f.total, 0),
      'fissuras_circulares', coalesce(f.circulares, 0)
    ),
    'by_sector', coalesce(bs.data, '{}'::jsonb),
    'by_defect', coalesce(bd.data, '{}'::jsonb),
    'defect_matrix', coalesce(dm.data, '{}'::jsonb)
  )
  from totals t
  cross join fissuras f
  cross join by_sector bs
  cross join by_defect bd
  cross join defect_matrix dm;
$$;
CREATE OR REPLACE FUNCTION public.rpc_dashboard_montagem_lista_v1(p_data_inicio date, p_data_fim date, p_scope text DEFAULT 'TOTAL'::text, p_page integer DEFAULT 1, p_page_size integer DEFAULT 50, p_sort text DEFAULT 'finalizado_em'::text, p_dir text DEFAULT 'desc'::text) RETURNS jsonb
    LANGUAGE plpgsql STABLE
    AS $$
declare
  v_page integer := greatest(coalesce(p_page, 1), 1);
  v_page_size integer := least(greatest(coalesce(p_page_size, 50), 1), 200);
  v_offset integer := (greatest(coalesce(p_page, 1), 1) - 1) * least(greatest(coalesce(p_page_size, 50), 1), 200);
  v_total integer;
  v_rows jsonb;
begin
  select count(*)::integer
    into v_total
  from public.vw_dashboard_montagem_base_v1
  where data_fabricacao between p_data_inicio and p_data_fim
    and setor = any(public.dashboard_scope_sectors_v1(p_scope));

  with scoped as (
    select
      id,
      data_fabricacao,
      setor,
      setor_code,
      forma_numero,
      modelo,
      status_montagem,
      etapa,
      inicio_inspecao_montagem,
      finalizado_em,
      montador_nome,
      defeitos_ocorrencias,
      defeitos_oportunidades
    from public.vw_dashboard_montagem_base_v1
    where data_fabricacao between p_data_inicio and p_data_fim
      and setor = any(public.dashboard_scope_sectors_v1(p_scope))
  )
  select coalesce(jsonb_agg(to_jsonb(s)), '[]'::jsonb)
    into v_rows
  from (
    select *
    from scoped
    order by
      case when p_sort = 'data_fabricacao' and lower(p_dir) = 'asc' then data_fabricacao end asc,
      case when p_sort = 'data_fabricacao' and lower(p_dir) <> 'asc' then data_fabricacao end desc,
      case when p_sort = 'setor' and lower(p_dir) = 'asc' then setor end asc,
      case when p_sort = 'setor' and lower(p_dir) <> 'asc' then setor end desc,
      case when p_sort = 'forma_numero' and lower(p_dir) = 'asc' then forma_numero end asc,
      case when p_sort = 'forma_numero' and lower(p_dir) <> 'asc' then forma_numero end desc,
      case when p_sort = 'montador_nome' and lower(p_dir) = 'asc' then montador_nome end asc,
      case when p_sort = 'montador_nome' and lower(p_dir) <> 'asc' then montador_nome end desc,
      case when lower(p_dir) = 'asc' then finalizado_em end asc nulls last,
      case when lower(p_dir) <> 'asc' then finalizado_em end desc nulls last
    offset v_offset
    limit v_page_size
  ) s;

  return jsonb_build_object(
    'contract_version', 'dashboard-montagem-lista-v1',
    'generated_at', now(),
    'scope', p_scope,
    'page', v_page,
    'page_size', v_page_size,
    'total_rows', coalesce(v_total, 0),
    'rows', v_rows
  );
end;
$$;
CREATE OR REPLACE FUNCTION public.rpc_dashboard_montagem_ranking_v1(p_data_inicio date, p_data_fim date, p_scope text DEFAULT 'TOTAL'::text, p_dimensao text DEFAULT 'montador'::text, p_limit integer DEFAULT 20) RETURNS jsonb
    LANGUAGE sql STABLE
    AS $$
  with scoped as (
    select *
    from public.vw_dashboard_montagem_base_v1
    where data_fabricacao between p_data_inicio and p_data_fim
      and setor = any(public.dashboard_scope_sectors_v1(p_scope))
  ),
  ranked as (
    select
      case
        when p_dimensao = 'setor' then coalesce(setor, 'Sem setor')
        when p_dimensao = 'modelo' then coalesce(modelo, 'Sem modelo')
        else coalesce(montador_nome, 'Sem montador')
      end as label,
      count(*)::integer as total,
      count(*) filter (where status_montagem = 'A')::integer as aprovados,
      count(*) filter (where defeitos_ocorrencias > 0 or status_montagem in ('R', 'REPROVADO'))::integer as recusados,
      count(*) filter (where status_montagem = 'RR')::integer as retrabalho
    from scoped
    group by 1
    order by count(*) desc, 1
    limit least(greatest(coalesce(p_limit, 20), 1), 100)
  )
  select jsonb_build_object(
    'contract_version', 'dashboard-montagem-ranking-v1',
    'generated_at', now(),
    'scope', p_scope,
    'dimensao', p_dimensao,
    'rows', coalesce(jsonb_agg(to_jsonb(ranked)), '[]'::jsonb)
  )
  from ranked;
$$;
CREATE OR REPLACE FUNCTION public.rpc_dashboard_montagem_resumo_v1(p_data_inicio date, p_data_fim date, p_scope text DEFAULT 'TOTAL'::text) RETURNS jsonb
    LANGUAGE sql STABLE
    AS $$
  with montagem as (
    select *
    from public.vw_dashboard_montagem_base_v1
    where data_fabricacao between p_data_inicio and p_data_fim
      and setor = any(public.dashboard_scope_sectors_v1(p_scope))
  ),
  producao as (
    select *
    from public.vw_dashboard_producao_base_v1
    where data_fabricacao between p_data_inicio and p_data_fim
      and setor = any(public.dashboard_scope_sectors_v1(p_scope))
      and status in ('LIBERADO', 'INSPECIONADO', 'CONCRETADO')
  ),
  totals as (
    select
      (select count(*)::integer from producao) as produzidos,
      count(*)::integer as montados,
      count(*) filter (where status_montagem = 'A')::integer as aprovados,
      count(*) filter (where defeitos_ocorrencias > 0 or status_montagem in ('R', 'REPROVADO'))::integer as recusados,
      count(*) filter (where status_montagem = 'RR')::integer as retrabalho
    from montagem
  ),
  by_sector as (
    select jsonb_object_agg(setor_code, data order by setor_code) as data
    from (
      select
        setor_code,
        jsonb_build_object(
          'montados', count(*)::integer,
          'aprovados', count(*) filter (where status_montagem = 'A')::integer,
          'recusados', count(*) filter (where defeitos_ocorrencias > 0 or status_montagem in ('R', 'REPROVADO'))::integer
        ) as data
      from montagem
      group by setor_code
    ) s
  )
  select jsonb_build_object(
    'contract_version', 'dashboard-montagem-v1',
    'generated_at', now(),
    'scope', p_scope,
    'included_sectors', public.dashboard_scope_sectors_v1(p_scope),
    'kpis', jsonb_build_object(
      'produzidos', coalesce(t.produzidos, 0),
      'montados', coalesce(t.montados, 0),
      'aprovados', coalesce(t.aprovados, 0),
      'recusados', coalesce(t.recusados, 0),
      'retrabalho', coalesce(t.retrabalho, 0),
      'atingimento_pct', case when coalesce(t.produzidos, 0) > 0 then round(t.montados::numeric / t.produzidos * 100, 2) else 0 end
    ),
    'by_sector', coalesce(bs.data, '{}'::jsonb)
  )
  from totals t
  cross join by_sector bs;
$$;
CREATE OR REPLACE FUNCTION public.rpc_dashboard_produtividade_detalhe_v1(p_data_inicio date, p_data_fim date, p_scope text DEFAULT 'TOTAL'::text, p_page integer DEFAULT 1, p_page_size integer DEFAULT 100) RETURNS jsonb
    LANGUAGE plpgsql STABLE
    AS $$
declare
  v_page integer := greatest(coalesce(p_page, 1), 1);
  v_page_size integer := least(greatest(coalesce(p_page_size, 100), 1), 500);
  v_offset integer := (greatest(coalesce(p_page, 1), 1) - 1) * least(greatest(coalesce(p_page_size, 100), 1), 500);
  v_total integer;
  v_rows jsonb;
begin
  select count(*)::integer
    into v_total
  from public.vw_dashboard_producao_base_v1
  where data_fabricacao between p_data_inicio and p_data_fim
    and setor = any(public.dashboard_scope_sectors_v1(p_scope))
    and status in ('LIBERADO', 'INSPECIONADO', 'CONCRETADO');

  select coalesce(jsonb_agg(to_jsonb(s)), '[]'::jsonb)
    into v_rows
  from (
    select
      id,
      data_fabricacao,
      data_hora,
      setor,
      setor_code,
      forma,
      modelo,
      codigo_produto,
      tipo_concreto,
      colaborador,
      status
    from public.vw_dashboard_producao_base_v1
    where data_fabricacao between p_data_inicio and p_data_fim
      and setor = any(public.dashboard_scope_sectors_v1(p_scope))
      and status in ('LIBERADO', 'INSPECIONADO', 'CONCRETADO')
    order by data_hora asc nulls last, data_fabricacao asc
    offset v_offset
    limit v_page_size
  ) s;

  return jsonb_build_object(
    'contract_version', 'dashboard-produtividade-detalhe-v1',
    'generated_at', now(),
    'scope', p_scope,
    'page', v_page,
    'page_size', v_page_size,
    'total_rows', coalesce(v_total, 0),
    'rows', v_rows
  );
end;
$$;
CREATE OR REPLACE FUNCTION public.rpc_dashboard_produtividade_resumo_v1(p_data_inicio date, p_data_fim date, p_scope text DEFAULT 'TOTAL'::text) RETURNS jsonb
    LANGUAGE sql STABLE
    AS $_$
  with scoped as (
    select *
    from public.vw_dashboard_producao_base_v1
    where data_fabricacao between p_data_inicio and p_data_fim
      and setor = any(public.dashboard_scope_sectors_v1(p_scope))
      and status in ('LIBERADO', 'INSPECIONADO', 'CONCRETADO')
  ),
  totals as (
    select
      count(*)::integer as total_formas,
      count(distinct data_fabricacao)::integer as dias,
      count(*) filter (where coalesce(tipo_concreto, '') !~* '^(padrao|padrão|concreto padrao|concreto padrão)$')::integer as fora_padrao
    from scoped
  ),
  by_sector as (
    select jsonb_object_agg(setor_code, total order by setor_code) as data
    from (
      select setor_code, count(*)::integer as total
      from scoped
      group by setor_code
    ) s
  )
  select jsonb_build_object(
    'contract_version', 'dashboard-produtividade-v1',
    'generated_at', now(),
    'scope', p_scope,
    'included_sectors', public.dashboard_scope_sectors_v1(p_scope),
    'kpis', jsonb_build_object(
      'total_formas', coalesce(t.total_formas, 0),
      'dias', coalesce(t.dias, 0),
      'media_formas_dia', case when coalesce(t.dias, 0) > 0 then round(t.total_formas::numeric / t.dias, 2) else 0 end,
      'fora_padrao', coalesce(t.fora_padrao, 0)
    ),
    'by_sector', coalesce(bs.data, '{}'::jsonb)
  )
  from totals t
  cross join by_sector bs;
$_$;
CREATE OR REPLACE FUNCTION public.rpc_dashboard_produtividade_tendencia_v1(p_data_inicio date, p_data_fim date, p_scope text DEFAULT 'TOTAL'::text) RETURNS jsonb
    LANGUAGE sql STABLE
    AS $_$
  with scoped as (
    select *
    from public.vw_dashboard_producao_base_v1
    where data_fabricacao between p_data_inicio and p_data_fim
      and setor = any(public.dashboard_scope_sectors_v1(p_scope))
      and status in ('LIBERADO', 'INSPECIONADO', 'CONCRETADO')
  ),
  daily as (
    select
      data_fabricacao,
      count(*)::integer as total_formas,
      count(*) filter (where coalesce(tipo_concreto, '') !~* '^(padrao|padrão|concreto padrao|concreto padrão)$')::integer as fora_padrao
    from scoped
    group by data_fabricacao
    order by data_fabricacao
  )
  select jsonb_build_object(
    'contract_version', 'dashboard-produtividade-tendencia-v1',
    'generated_at', now(),
    'scope', p_scope,
    'rows', coalesce(jsonb_agg(to_jsonb(daily)), '[]'::jsonb)
  )
  from daily;
$_$;
CREATE OR REPLACE FUNCTION public.rpc_dashboard_retrabalho_resumo_v1(p_data_inicio date, p_data_fim date, p_scope text DEFAULT 'TOTAL'::text, p_incluir_custos boolean DEFAULT false) RETURNS jsonb
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  with scoped as (
    select *
    from public.dashboard_retrabalho_eventos_v1
    where data_fabricacao between p_data_inicio and p_data_fim
      and setor = any(public.dashboard_scope_sectors_v1(p_scope))
  ),
  totals as (
    select
      count(*)::integer as eventos,
      count(*) filter (where status_custo = 'ESTIMADO')::integer as estimados,
      count(*) filter (where status_custo = 'REAL_PARCIAL')::integer as reais_parciais,
      count(*) filter (where status_custo = 'REAL_FECHADO')::integer as reais_fechados,
      count(*) filter (where status_custo = 'OPORTUNIDADE')::integer as oportunidades,
      case when p_incluir_custos and false then coalesce(sum(custo_total), 0) else null end as custo_total
    from scoped
  ),
  by_sector as (
    select jsonb_object_agg(setor_code, data order by setor_code) as data
    from (
      select
        setor_code,
        jsonb_build_object(
          'eventos', count(*)::integer,
          'custo_total', case when p_incluir_custos and false then coalesce(sum(custo_total), 0) else null end
        ) as data
      from scoped
      group by setor_code
    ) s
  )
  select jsonb_build_object(
    'contract_version', 'dashboard-retrabalho-v1',
    'generated_at', now(),
    'scope', p_scope,
    'included_sectors', public.dashboard_scope_sectors_v1(p_scope),
    'costs_visible', p_incluir_custos and false,
    'kpis', jsonb_build_object(
      'eventos', coalesce(t.eventos, 0),
      'estimados', coalesce(t.estimados, 0),
      'reais_parciais', coalesce(t.reais_parciais, 0),
      'reais_fechados', coalesce(t.reais_fechados, 0),
      'oportunidades', coalesce(t.oportunidades, 0),
      'custo_total', t.custo_total
    ),
    'by_sector', coalesce(bs.data, '{}'::jsonb)
  )
  from totals t
  cross join by_sector bs;
$$;
CREATE OR REPLACE FUNCTION public.set_prog_s3_s4_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;
CREATE OR REPLACE FUNCTION public.unificado_notify_mapa_change() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
  payload jsonb;
BEGIN
  payload := jsonb_build_object(
    'schema', 'public',
    'table', TG_TABLE_NAME,
    'type', TG_OP,
    'commit_timestamp', to_char(clock_timestamp() AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),
    'record', CASE WHEN TG_OP = 'DELETE' THEN '{}'::jsonb ELSE to_jsonb(NEW) END,
    'old_record', CASE WHEN TG_OP = 'INSERT' THEN '{}'::jsonb ELSE to_jsonb(OLD) END
  );
  PERFORM pg_notify('unificado_mapa_changes', payload::text);
  RETURN CASE WHEN TG_OP = 'DELETE' THEN OLD ELSE NEW END;
END;
$$;
CREATE TABLE dosagem.alembic_version (
    version_num character varying(32) NOT NULL
);
CREATE TABLE dosagem.auditoria (
    id bigint NOT NULL,
    email character varying(320) NOT NULL,
    acao character varying(100) NOT NULL,
    unidade character varying(100),
    tipo character varying(32),
    documento_id character varying(120),
    antes jsonb,
    depois jsonb,
    piloto boolean NOT NULL,
    em timestamp with time zone NOT NULL
);
CREATE SEQUENCE dosagem.auditoria_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
CREATE TABLE dosagem.auth_flows (
    estado_hash character varying(64) NOT NULL,
    challenge character varying(64) NOT NULL,
    expira_em timestamp with time zone NOT NULL,
    consumido boolean DEFAULT false NOT NULL
);
CREATE TABLE dosagem.auth_sessions (
    sessao_hash character varying(64) NOT NULL,
    email character varying(320) NOT NULL,
    expira_em timestamp with time zone NOT NULL,
    persistente boolean DEFAULT false NOT NULL
);
CREATE TABLE dosagem.auth_tickets (
    ticket_hash character varying(64) NOT NULL,
    estado_hash character varying(64) NOT NULL,
    email character varying(320) NOT NULL,
    expira_em timestamp with time zone NOT NULL,
    consumido boolean DEFAULT false NOT NULL
);
CREATE TABLE dosagem.avaliacoes_impacto (
    id bigint NOT NULL,
    traco_versao_chave character varying(240) NOT NULL,
    material_id character varying(120) NOT NULL,
    classificacao character varying(40) NOT NULL,
    estado character varying(32) DEFAULT 'pendente'::character varying NOT NULL,
    diferencas jsonb NOT NULL,
    criado_em timestamp with time zone DEFAULT now() NOT NULL,
    piloto boolean DEFAULT false NOT NULL
);
CREATE SEQUENCE dosagem.avaliacoes_impacto_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
CREATE TABLE dosagem.documentos (
    chave character varying(240) NOT NULL,
    tipo character varying(32) NOT NULL,
    id character varying(120) NOT NULL,
    versao integer NOT NULL,
    revisao integer NOT NULL,
    unidade character varying(100) NOT NULL,
    status character varying(32) NOT NULL,
    nome character varying(320) NOT NULL,
    fck_mpa double precision,
    metodo character varying(32),
    conteudo jsonb NOT NULL,
    piloto boolean NOT NULL,
    alterado_em timestamp with time zone NOT NULL
);
CREATE TABLE dosagem.idempotencia (
    request_id character varying(80) NOT NULL,
    email character varying(320) NOT NULL,
    payload_hash character varying(64) NOT NULL,
    resposta jsonb NOT NULL,
    criado_em timestamp with time zone NOT NULL
);
CREATE TABLE dosagem.legado_ids (
    id bigint NOT NULL,
    origem character varying(200) NOT NULL,
    id_antigo character varying(200) NOT NULL,
    tipo character varying(32) NOT NULL,
    documento_chave character varying(240) NOT NULL
);
CREATE SEQUENCE dosagem.legado_ids_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
CREATE TABLE dosagem.local_credenciais (
    email character varying(320) NOT NULL,
    senha_hash text NOT NULL,
    falhas integer DEFAULT 0 NOT NULL,
    bloqueado_ate timestamp with time zone,
    trocar_senha boolean DEFAULT true NOT NULL
);
CREATE TABLE dosagem.material_versoes (
    id bigint NOT NULL,
    material_id character varying(120) NOT NULL,
    versao integer NOT NULL,
    propriedades jsonb NOT NULL,
    criado_em timestamp with time zone DEFAULT now() NOT NULL,
    piloto boolean DEFAULT false NOT NULL
);
CREATE SEQUENCE dosagem.material_versoes_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
CREATE SEQUENCE dosagem.traco_codigo_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
CREATE TABLE dosagem.traco_versoes (
    chave character varying(240) NOT NULL,
    traco_id character varying(120) NOT NULL,
    versao integer NOT NULL,
    unidade character varying(100) NOT NULL,
    estado character varying(32) NOT NULL,
    documento jsonb NOT NULL,
    snapshot jsonb NOT NULL,
    resultado jsonb NOT NULL,
    criado_em timestamp with time zone DEFAULT now() NOT NULL,
    piloto boolean DEFAULT false NOT NULL
);
CREATE TABLE dosagem.usuarios (
    email character varying(320) NOT NULL,
    nome character varying(320) NOT NULL,
    papel character varying(24) NOT NULL,
    unidades jsonb NOT NULL,
    ativo boolean NOT NULL
);
CREATE TABLE estoque.config_massada (
    legado_id integer NOT NULL,
    coluna text NOT NULL,
    label text NOT NULL,
    material_id integer,
    ativo boolean NOT NULL,
    ordem integer NOT NULL,
    fator_conversao numeric NOT NULL,
    unidade_id text DEFAULT 'noroeste'::text NOT NULL
);
CREATE TABLE estoque.custo_ajuste (
    legado_id bigint NOT NULL,
    material_id integer NOT NULL,
    valor_unitario numeric(14,6) NOT NULL,
    vigencia date NOT NULL,
    motivo text NOT NULL,
    responsavel character varying(100),
    created_at timestamp with time zone NOT NULL,
    unidade_id text DEFAULT 'noroeste'::text NOT NULL
);
CREATE TABLE estoque.material (
    legado_id integer NOT NULL,
    codigo character varying(50) NOT NULL,
    nome character varying(200) NOT NULL,
    categoria character varying(50) NOT NULL,
    unidade character varying(20) NOT NULL,
    saldo_inicial numeric(16,3) NOT NULL,
    ativo boolean NOT NULL,
    created_at timestamp with time zone NOT NULL,
    unidade_id text DEFAULT 'noroeste'::text NOT NULL
);
CREATE TABLE estoque.movimento (
    legado_id integer NOT NULL,
    material_id integer NOT NULL,
    tipo character varying(20) NOT NULL,
    data date NOT NULL,
    quantidade numeric(16,3) NOT NULL,
    nota_fiscal character varying(100),
    fornecedor character varying(200),
    observacao text,
    responsavel character varying(100),
    origem character varying(50) NOT NULL,
    referencia_id integer,
    created_at timestamp with time zone NOT NULL,
    unidade character varying(20),
    silo_id integer,
    valor_nota numeric(12,4),
    icms_perc numeric(5,2),
    valor_frete numeric(12,4),
    icms_frete numeric(12,4),
    valor_unitario_liquido numeric(12,4),
    unidade_id text DEFAULT 'noroeste'::text NOT NULL,
    CONSTRAINT noro_movimento_origem CHECK (((origem)::text = ANY (ARRAY[('manual'::character varying)::text, ('massada'::character varying)::text, ('acerto'::character varying)::text, ('producao_massadas'::character varying)::text, ('entrada'::character varying)::text]))),
    CONSTRAINT noro_movimento_tipo CHECK (((tipo)::text = ANY (ARRAY[('entrada'::character varying)::text, ('consumo'::character varying)::text, ('acerto'::character varying)::text])))
);
CREATE TABLE estoque.noro_movimento_local (
    unidade_id text DEFAULT 'noroeste'::text NOT NULL,
    local_id uuid NOT NULL,
    material_id integer NOT NULL,
    silo_id integer,
    tipo text NOT NULL,
    data date NOT NULL,
    quantidade numeric(18,6) NOT NULL,
    unidade text NOT NULL,
    nota_fiscal text,
    fornecedor text,
    observacao text,
    origem text NOT NULL,
    valor_nota numeric(18,2) DEFAULT 0 NOT NULL,
    icms_perc numeric(7,4) DEFAULT 0 NOT NULL,
    valor_frete numeric(18,4) DEFAULT 0 NOT NULL,
    icms_frete numeric(7,4) DEFAULT 0 NOT NULL,
    valor_unitario_liquido numeric(18,4) DEFAULT 0 NOT NULL,
    payload_hash character(64) NOT NULL,
    criado_por text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT noro_movimento_local_icms_frete_check CHECK (((icms_frete >= (0)::numeric) AND (icms_frete <= (100)::numeric))),
    CONSTRAINT noro_movimento_local_icms_perc_check CHECK (((icms_perc >= (0)::numeric) AND (icms_perc <= (100)::numeric))),
    CONSTRAINT noro_movimento_local_origem_check CHECK ((origem = ANY (ARRAY['manual'::text, 'massada'::text, 'producao_massadas'::text, 'acerto'::text]))),
    CONSTRAINT noro_movimento_local_quantidade_check CHECK ((quantidade <> (0)::numeric)),
    CONSTRAINT noro_movimento_local_tipo_check CHECK ((tipo = ANY (ARRAY['entrada'::text, 'consumo'::text, 'acerto'::text]))),
    CONSTRAINT noro_movimento_local_unidade_id_check CHECK ((unidade_id = 'noroeste'::text)),
    CONSTRAINT noro_movimento_local_valor_frete_check CHECK ((valor_frete >= (0)::numeric)),
    CONSTRAINT noro_movimento_local_valor_nota_check CHECK ((valor_nota >= (0)::numeric)),
    CONSTRAINT noro_movimento_local_valor_unitario_liquido_check CHECK ((valor_unitario_liquido >= (0)::numeric))
);
CREATE TABLE estoque.silo (
    legado_id integer NOT NULL,
    nome character varying(100) NOT NULL,
    capacidade_nominal numeric(10,2) NOT NULL,
    capacidade_operacional numeric(10,2) NOT NULL,
    unidade character varying(20) NOT NULL,
    ativo boolean NOT NULL,
    created_at timestamp with time zone NOT NULL,
    unidade_id text DEFAULT 'noroeste'::text NOT NULL
);
CREATE TABLE lab.cp_leitura (
    legado_id character varying(36) NOT NULL,
    unidade character varying(80) NOT NULL,
    operador character varying(120),
    resistencia_mpa numeric(10,2),
    traco character varying(200),
    numero_serie character varying(50),
    nome character varying(200),
    cp character varying(20),
    idade integer,
    data_moldagem date,
    hora_moldagem character varying(10),
    data_ruptura date,
    qr_raw text,
    created_at timestamp without time zone,
    local_id character varying(80),
    etiqueta_hash character(64),
    origem character varying(20) NOT NULL,
    unidade_id text DEFAULT 'noroeste'::text NOT NULL,
    fonte_tabela text NOT NULL,
    qrcp_legado_id character varying,
    payload_hash character(64),
    criado_por text,
    CONSTRAINT cp_leitura_fonte_tabela_check CHECK ((fonte_tabela = ANY (ARRAY['tbl_controle_estatistico'::text, 'tbl_qrcp'::text, 'unificado'::text])))
);
CREATE TABLE noro_sup.ct_usuarios_auditoria (
    id bigint NOT NULL,
    usuario_id bigint,
    ator character varying(80),
    acao character varying(80) NOT NULL,
    detalhes jsonb NOT NULL,
    criado_em timestamp with time zone NOT NULL
);
CREATE TABLE noro_sup.tbl_agregados (
    id integer NOT NULL,
    nome text NOT NULL,
    tipo text NOT NULL,
    unidade text NOT NULL,
    descricao text,
    ativo boolean NOT NULL,
    criado_em timestamp with time zone NOT NULL
);
CREATE TABLE noro_sup.tbl_config_traco_campo (
    id integer NOT NULL,
    coluna text NOT NULL,
    label text NOT NULL,
    material_id integer,
    ativo boolean NOT NULL,
    ordem integer NOT NULL
);
CREATE TABLE noro_sup.tbl_controle_estatistico (
    id character varying(36) NOT NULL,
    unidade character varying(80) NOT NULL,
    operador character varying(120) NOT NULL,
    resistencia_mpa numeric(10,2) NOT NULL,
    traco character varying(200),
    numero_serie character varying(50),
    nome character varying(200),
    cp character varying(20),
    idade integer,
    data_moldagem date,
    hora_moldagem character varying(10),
    data_ruptura date,
    qr_raw text NOT NULL,
    created_at timestamp without time zone NOT NULL,
    local_id character varying(80),
    etiqueta_hash character(64),
    origem character varying(20) NOT NULL
);
CREATE TABLE noro_sup.tbl_est_config_massada (
    id integer NOT NULL,
    coluna text NOT NULL,
    label text NOT NULL,
    material_id integer,
    ativo boolean NOT NULL,
    ordem integer NOT NULL,
    fator_conversao numeric NOT NULL
);
CREATE TABLE noro_sup.tbl_est_custos_ajustes (
    id bigint NOT NULL,
    material_id integer NOT NULL,
    valor_unitario numeric(14,6) NOT NULL,
    vigencia date NOT NULL,
    motivo text NOT NULL,
    responsavel character varying(100),
    created_at timestamp with time zone NOT NULL
);
CREATE TABLE noro_sup.tbl_est_materiais (
    id integer NOT NULL,
    codigo character varying(50) NOT NULL,
    nome character varying(200) NOT NULL,
    categoria character varying(50) NOT NULL,
    unidade character varying(20) NOT NULL,
    saldo_inicial numeric(16,3) NOT NULL,
    ativo boolean NOT NULL,
    created_at timestamp with time zone NOT NULL
);
CREATE TABLE noro_sup.tbl_est_movimentos (
    id integer NOT NULL,
    material_id integer NOT NULL,
    tipo character varying(20) NOT NULL,
    data date NOT NULL,
    quantidade numeric(16,3) NOT NULL,
    nota_fiscal character varying(100),
    fornecedor character varying(200),
    observacao text,
    responsavel character varying(100),
    origem character varying(50) NOT NULL,
    referencia_id integer,
    created_at timestamp with time zone NOT NULL,
    unidade character varying(20),
    silo_id integer,
    valor_nota numeric(12,4),
    icms_perc numeric(5,2),
    valor_frete numeric(12,4),
    icms_frete numeric(12,4),
    valor_unitario_liquido numeric(12,4)
);
CREATE TABLE noro_sup.tbl_est_silos (
    id integer NOT NULL,
    nome character varying(100) NOT NULL,
    capacidade_nominal numeric(10,2) NOT NULL,
    capacidade_operacional numeric(10,2) NOT NULL,
    unidade character varying(20) NOT NULL,
    ativo boolean NOT NULL,
    created_at timestamp with time zone NOT NULL
);
CREATE TABLE noro_sup.tbl_leiturasetor (
    id integer NOT NULL,
    datahora timestamp without time zone NOT NULL,
    id_leitura integer NOT NULL,
    qr_raw character varying(100),
    volume numeric(10,2),
    n_serie character varying(100),
    created_at timestamp without time zone,
    uid character varying(30) NOT NULL
);
CREATE TABLE noro_sup.tbl_massadas (
    id integer NOT NULL,
    produto text NOT NULL,
    formula text NOT NULL,
    qtd numeric NOT NULL,
    data date,
    hora time without time zone,
    data_hora timestamp without time zone,
    hora_inicio time without time zone,
    hora_final time without time zone,
    hora_descarga time without time zone,
    misturador text,
    numero_serie numeric,
    temperatura double precision,
    real_agregado1 numeric,
    real_agregado2 numeric,
    real_agregado3 numeric,
    real_agregado4 numeric,
    real_agregado5 numeric,
    real_agregado6 numeric,
    real_agregado7 numeric,
    prog_agregado1 numeric,
    prog_agregado2 numeric,
    prog_agregado3 numeric,
    prog_agregado4 numeric,
    prog_agregado5 numeric,
    prog_agregado6 numeric,
    prog_agregado7 numeric,
    ur1 numeric,
    ur2 numeric,
    ur3 numeric,
    ur4 numeric,
    ur5 numeric,
    ur6 numeric,
    ur7 numeric,
    real_silo1 numeric,
    real_silo2 numeric,
    real_silo3 numeric,
    real_silo4 numeric,
    prog_silo1 numeric,
    prog_silo2 numeric,
    prog_silo3 numeric,
    prog_silo4 numeric,
    real_agua1 numeric,
    prog_agua1 numeric,
    real_aditivo1 numeric,
    real_aditivo2 numeric,
    real_aditivo3 numeric,
    prog_aditivo1 numeric,
    prog_aditivo2 numeric,
    prog_aditivo3 numeric,
    corte numeric,
    ac double precision,
    carregado integer,
    alterado integer,
    setor text,
    setor_atualizado_em timestamp without time zone,
    ativa boolean NOT NULL,
    redosa integer NOT NULL
);
CREATE TABLE noro_sup.tbl_pcpsetor (
    id integer NOT NULL,
    data date NOT NULL,
    dia_semana character varying(20) NOT NULL,
    setor character varying(20) NOT NULL,
    volume numeric(10,2),
    status character(1),
    created_at timestamp without time zone,
    updated_at timestamp without time zone
);
CREATE TABLE noro_sup.tbl_produtos (
    id integer NOT NULL,
    nome text NOT NULL,
    codigo text,
    descricao text,
    ativo boolean NOT NULL,
    criado_em timestamp with time zone NOT NULL,
    alterado integer NOT NULL
);
CREATE TABLE noro_sup.tbl_qrcp (
    id character varying(36) NOT NULL,
    traco character varying(200),
    numero_serie character varying(50),
    nome character varying(200),
    cp character varying(10),
    idade integer,
    data_moldagem date,
    hora_moldagem character varying(10),
    data_ruptura date,
    qr_raw text,
    created_at timestamp without time zone,
    resistencia_mpa numeric(10,2)
);
CREATE TABLE noro_sup.tbl_receitas (
    id bigint NOT NULL,
    nome text NOT NULL,
    agregado1 numeric,
    agregado2 numeric,
    agregado3 numeric,
    agregado4 numeric,
    agregado5 numeric,
    agregado6 numeric,
    agregado7 numeric,
    cimento1 numeric,
    cimento2 numeric,
    cimento3 numeric,
    cimento4 numeric,
    agua numeric,
    aditivo1 numeric,
    aditivo2 numeric,
    aditivo3 numeric,
    ativa boolean NOT NULL,
    alterado integer NOT NULL,
    nome_traco character varying NOT NULL,
    cimento numeric,
    adicao_1 numeric,
    adicao_2 numeric,
    areia_1 numeric,
    areia_2 numeric,
    areia_3 numeric,
    brita_1 numeric,
    brita_2 numeric,
    aditivo_1 numeric,
    aditivo_2 numeric,
    ac numeric,
    r24h numeric,
    r3 numeric,
    r7 numeric,
    r28 numeric,
    created_at timestamp without time zone,
    revisao_grupo uuid NOT NULL,
    revisao_numero integer NOT NULL,
    revisao_origem_id bigint,
    observacao_revisao text,
    revisado_em timestamp without time zone,
    alterado_por text
);
CREATE TABLE noro_sup.tbl_tracos (
    id integer NOT NULL,
    nome_traco character varying(200) NOT NULL,
    cimento numeric(10,2),
    adicao_1 numeric(10,2),
    adicao_2 numeric(10,2),
    areia_1 numeric(10,2),
    areia_2 numeric(10,2),
    areia_3 numeric(10,2),
    brita_1 numeric(10,2),
    brita_2 numeric(10,2),
    aditivo_1 numeric(10,2),
    aditivo_2 numeric(10,2),
    agua numeric(10,2),
    ac numeric(10,4),
    r24h numeric(10,2),
    r3 numeric(10,2),
    r7 numeric(10,2),
    r28 numeric(10,2),
    created_at timestamp without time zone,
    ativa boolean,
    revisao_grupo uuid NOT NULL,
    revisao_numero integer NOT NULL,
    revisao_origem_id integer,
    observacao_revisao text,
    revisado_em timestamp without time zone,
    alterado_por text
);
CREATE TABLE public.fechamento_producao_confirmacoes (
    data_fabricacao date NOT NULL,
    setor text NOT NULL,
    forma text NOT NULL,
    forma_chave text NOT NULL,
    producao_id uuid NOT NULL,
    confirmado_por text NOT NULL,
    confirmado_em timestamp with time zone DEFAULT now() NOT NULL,
    confirmado_nome text,
    CONSTRAINT fechamento_producao_confirmacoes_confirmado_por_check CHECK ((btrim(confirmado_por) <> ''::text)),
    CONSTRAINT fechamento_producao_confirmacoes_setor_check CHECK ((setor = ANY (ARRAY['Setor 1'::text, 'Setor 2'::text, 'Setor 3'::text, 'Setor 4'::text])))
);
CREATE TABLE public.fechamento_producao_eventos (
    id uuid NOT NULL,
    data_fabricacao date NOT NULL,
    setor text NOT NULL,
    forma text NOT NULL,
    forma_chave text NOT NULL,
    producao_id uuid NOT NULL,
    acao text NOT NULL,
    ator_id text NOT NULL,
    ator_nome text NOT NULL,
    antes jsonb,
    depois jsonb,
    motivo text DEFAULT ''::text NOT NULL,
    criado_em timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT fechamento_producao_eventos_acao_check CHECK ((acao = ANY (ARRAY['registro_concretagem'::text, 'confirmacao'::text, 'reversao'::text])))
);
CREATE TABLE public.odin_reversoes (
    id bigint NOT NULL,
    revertido_em timestamp with time zone DEFAULT now() NOT NULL,
    data_fabricacao date NOT NULL,
    setor text NOT NULL,
    forma text NOT NULL,
    acao text NOT NULL,
    tabela text NOT NULL,
    registro_id text NOT NULL,
    registro_anterior jsonb NOT NULL,
    motivo text NOT NULL,
    usuario_id text NOT NULL,
    usuario_nome text NOT NULL
);
CREATE TABLE unificado_auth.alembic_version_armacao_iam (
    version_num character varying(32) NOT NULL
);
CREATE TABLE unificado_auth.alembic_version_logistica_iam (
    version_num character varying(32) NOT NULL
);
CREATE TABLE unificado_auth.armacao_seeded_grants (
    user_id text NOT NULL,
    action_id text NOT NULL
);
CREATE TABLE unificado_auth.logistica_grant_audit (
    id bigint NOT NULL,
    user_id text NOT NULL,
    actor text NOT NULL,
    antes jsonb,
    depois jsonb,
    criado_em timestamp with time zone DEFAULT now() NOT NULL
);
CREATE TABLE unificado_auth.logistica_iam_meta (
    id integer NOT NULL,
    old_constraint text NOT NULL
);
CREATE TABLE unificado_auth.logistica_seeded_grants (
    user_id text NOT NULL,
    action_id text NOT NULL
);
CREATE TABLE unificado_auth.noro_release_users (
    user_id text NOT NULL,
    created_by_release text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);
CREATE TABLE unificado_auth.quick_access_osmar_grants_before_20261111 (
    screen_id text,
    allowed boolean,
    updated_by text,
    updated_at timestamp with time zone
);
CREATE TABLE unificado_auth.user_unit_extras (
    user_id text NOT NULL,
    unit_code text NOT NULL,
    granted_by text NOT NULL,
    granted_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT user_unit_extras_unit_code_check CHECK ((unit_code = ANY (ARRAY['campinas'::text, 'pederneiras'::text, 'ribeirao'::text, 'noroeste'::text])))
);
CREATE TABLE usina_manutencao.atividade (
    id bigint NOT NULL,
    codigo text NOT NULL,
    ordem integer NOT NULL,
    grupo text NOT NULL,
    criticidade text NOT NULL,
    sistema text DEFAULT ''::text NOT NULL,
    atividade text NOT NULL,
    ref_slide text DEFAULT ''::text NOT NULL,
    observacao text DEFAULT ''::text NOT NULL,
    responsavel text DEFAULT ''::text NOT NULL,
    material_servico text DEFAULT ''::text NOT NULL,
    quantidade numeric(12,3),
    unidade text DEFAULT ''::text NOT NULL,
    inicio date,
    duracao_dias integer,
    prazo_limite date,
    status text DEFAULT 'Não iniciado'::text NOT NULL,
    percentual integer DEFAULT 0 NOT NULL,
    inicio_real date,
    fim_real date,
    aplicacao text DEFAULT 'Aplicável'::text NOT NULL,
    campos_adicionais jsonb DEFAULT '[]'::jsonb NOT NULL,
    origem_linha integer,
    origem_arquivo text,
    criado_por text NOT NULL,
    criado_por_nome text NOT NULL,
    atualizado_por text NOT NULL,
    atualizado_por_nome text NOT NULL,
    criado_em timestamp with time zone DEFAULT now() NOT NULL,
    atualizado_em timestamp with time zone DEFAULT now() NOT NULL,
    versao integer DEFAULT 1 NOT NULL,
    chave_criacao text,
    situacao_compra text DEFAULT 'Não informado'::text NOT NULL,
    CONSTRAINT atividade_aplicacao_check CHECK ((aplicacao = ANY (ARRAY['Pendente de confirmação'::text, 'Aplicável'::text, 'Não se aplica'::text]))),
    CONSTRAINT atividade_check CHECK (((fim_real IS NULL) OR (inicio_real IS NULL) OR (fim_real >= inicio_real))),
    CONSTRAINT atividade_check1 CHECK (((status <> 'Concluído'::text) OR (percentual = 100))),
    CONSTRAINT atividade_criticidade_check CHECK ((criticidade = ANY (ARRAY['Alta'::text, 'Média'::text, 'Baixa'::text]))),
    CONSTRAINT atividade_duracao_dias_check CHECK (((duracao_dias >= 1) AND (duracao_dias <= 3650))),
    CONSTRAINT atividade_grupo_check CHECK ((grupo = ANY (ARRAY['M1'::text, 'M2'::text, 'COMUM'::text]))),
    CONSTRAINT atividade_percentual_check CHECK (((percentual >= 0) AND (percentual <= 100))),
    CONSTRAINT atividade_quantidade_check CHECK ((quantidade >= (0)::numeric)),
    CONSTRAINT atividade_situacao_compra_check CHECK ((situacao_compra = ANY (ARRAY['Não informado'::text, 'Não necessita compra'::text, 'A comprar'::text, 'Em cotação'::text, 'Aguardando aprovação'::text, 'Pedido emitido'::text, 'Material recebido'::text]))),
    CONSTRAINT atividade_status_check CHECK ((status = ANY (ARRAY['Não iniciado'::text, 'Aguardando material'::text, 'Em andamento'::text, 'Concluído'::text, 'Cancelado'::text])))
);
CREATE TABLE usina_manutencao.atividade_foto (
    id bigint NOT NULL,
    atividade_id bigint NOT NULL,
    foto_id bigint NOT NULL,
    slide integer NOT NULL,
    numero_foto integer NOT NULL,
    legenda text NOT NULL,
    observacao text DEFAULT ''::text NOT NULL,
    tipo text NOT NULL,
    criado_em timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT atividade_foto_numero_foto_check CHECK ((numero_foto > 0)),
    CONSTRAINT atividade_foto_slide_check CHECK ((slide > 0)),
    CONSTRAINT atividade_foto_tipo_check CHECK ((tipo = ANY (ARRAY['foto_inspecao'::text, 'contexto'::text, 'quadro_video'::text])))
);
CREATE SEQUENCE usina_manutencao.atividade_foto_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
CREATE SEQUENCE usina_manutencao.atividade_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
CREATE TABLE usina_manutencao.configuracao (
    id integer NOT NULL,
    inicio_cronograma date,
    origem_arquivo text NOT NULL,
    origem_sha256 text NOT NULL,
    versao integer DEFAULT 1 NOT NULL,
    atualizado_em timestamp with time zone DEFAULT now() NOT NULL,
    atualizado_por text,
    CONSTRAINT configuracao_id_check CHECK ((id = 1))
);
CREATE TABLE usina_manutencao.documento_fotos (
    id bigint NOT NULL,
    nome text NOT NULL,
    data_inspecao date NOT NULL,
    sha256 character varying(64) NOT NULL,
    arquivo text NOT NULL,
    criado_em timestamp with time zone DEFAULT now() NOT NULL
);
CREATE SEQUENCE usina_manutencao.documento_fotos_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
CREATE TABLE usina_manutencao.foto (
    id bigint NOT NULL,
    documento_id bigint NOT NULL,
    sha256 character varying(64) NOT NULL,
    arquivo text NOT NULL,
    mime text NOT NULL,
    largura integer NOT NULL,
    altura integer NOT NULL,
    tamanho bigint NOT NULL,
    criado_em timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT foto_altura_check CHECK ((altura > 0)),
    CONSTRAINT foto_largura_check CHECK ((largura > 0)),
    CONSTRAINT foto_mime_check CHECK ((mime = ANY (ARRAY['image/jpeg'::text, 'image/png'::text]))),
    CONSTRAINT foto_tamanho_check CHECK ((tamanho > 0))
);
CREATE SEQUENCE usina_manutencao.foto_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
CREATE TABLE usina_manutencao.historico (
    id bigint NOT NULL,
    atividade_id bigint,
    autor_id text NOT NULL,
    autor_nome text NOT NULL,
    tipo text NOT NULL,
    antes jsonb,
    depois jsonb,
    texto text DEFAULT ''::text NOT NULL,
    criado_em timestamp with time zone DEFAULT now() NOT NULL
);
CREATE SEQUENCE usina_manutencao.historico_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
CREATE TABLE usinas.agregado (
    legado_id integer NOT NULL,
    nome text NOT NULL,
    tipo text NOT NULL,
    unidade text NOT NULL,
    descricao text,
    ativo boolean NOT NULL,
    criado_em timestamp with time zone NOT NULL,
    unidade_id text DEFAULT 'noroeste'::text NOT NULL
);
CREATE TABLE usinas.auditoria_legado_noro (
    legado_id bigint NOT NULL,
    usuario_id bigint,
    ator character varying(80),
    acao character varying(80) NOT NULL,
    detalhes jsonb NOT NULL,
    criado_em timestamp with time zone NOT NULL,
    unidade_id text DEFAULT 'noroeste'::text NOT NULL
);
CREATE TABLE usinas.carta_traco (
    legado_id integer NOT NULL,
    nome_traco character varying(200) NOT NULL,
    cimento numeric(10,2),
    adicao_1 numeric(10,2),
    adicao_2 numeric(10,2),
    areia_1 numeric(10,2),
    areia_2 numeric(10,2),
    areia_3 numeric(10,2),
    brita_1 numeric(10,2),
    brita_2 numeric(10,2),
    aditivo_1 numeric(10,2),
    aditivo_2 numeric(10,2),
    agua numeric(10,2),
    ac numeric(10,4),
    r24h numeric(10,2),
    r3 numeric(10,2),
    r7 numeric(10,2),
    r28 numeric(10,2),
    created_at timestamp without time zone,
    ativa boolean,
    revisao_grupo uuid NOT NULL,
    revisao_numero integer NOT NULL,
    revisao_origem_id integer,
    observacao_revisao text,
    revisado_em timestamp without time zone,
    alterado_por text,
    unidade_id text DEFAULT 'noroeste'::text NOT NULL
);
CREATE TABLE usinas.carta_traco_campo (
    legado_id integer NOT NULL,
    coluna text NOT NULL,
    label text NOT NULL,
    material_id integer,
    ativo boolean NOT NULL,
    ordem integer NOT NULL,
    unidade_id text DEFAULT 'noroeste'::text NOT NULL
);
CREATE TABLE usinas.leitura_setor (
    legado_id integer NOT NULL,
    datahora timestamp without time zone NOT NULL,
    id_leitura integer NOT NULL,
    qr_raw character varying(100),
    volume numeric(10,2),
    n_serie character varying(100),
    created_at timestamp without time zone,
    uid character varying(30) NOT NULL,
    unidade_id text DEFAULT 'noroeste'::text NOT NULL
);
CREATE TABLE usinas.massada_anotacao (
    unidade_id text DEFAULT 'noroeste'::text NOT NULL,
    massada_id integer NOT NULL,
    setor text,
    ativa boolean,
    redosa integer,
    atualizado_por text,
    atualizado_em timestamp with time zone DEFAULT now() NOT NULL
);
CREATE TABLE usinas.sync_estado (
    unidade_id text DEFAULT 'noroeste'::text NOT NULL,
    tabela text NOT NULL,
    direcao text DEFAULT 'antigo_para_novo'::text NOT NULL,
    ultima_execucao timestamp with time zone,
    linhas_lidas integer,
    linhas_upsert integer,
    erro text,
    CONSTRAINT sync_estado_direcao_check CHECK ((direcao = ANY (ARRAY['antigo_para_novo'::text, 'novo_para_antigo'::text, 'desligado'::text])))
);
CREATE TABLE usinas_reporting.tbl_config_traco_campo (
    id integer NOT NULL,
    coluna text NOT NULL,
    label text NOT NULL,
    material_id integer,
    ativo boolean NOT NULL,
    ordem integer NOT NULL
);
CREATE TABLE usinas_reporting.tbl_est_config_massada (
    id integer NOT NULL,
    coluna text NOT NULL,
    label text NOT NULL,
    material_id integer,
    ativo boolean NOT NULL,
    ordem integer NOT NULL,
    fator_conversao numeric NOT NULL
);
CREATE TABLE usinas_reporting.tbl_est_custos_ajustes (
    id bigint NOT NULL,
    material_id integer NOT NULL,
    valor_unitario numeric(14,6) NOT NULL,
    vigencia date NOT NULL,
    motivo text NOT NULL,
    responsavel character varying(100),
    created_at timestamp with time zone NOT NULL
);
CREATE TABLE usinas_reporting.tbl_est_materiais (
    id integer NOT NULL,
    codigo character varying(50) NOT NULL,
    nome character varying(200) NOT NULL,
    categoria character varying(50) NOT NULL,
    unidade character varying(20) NOT NULL,
    saldo_inicial numeric(16,3) NOT NULL,
    ativo boolean NOT NULL,
    created_at timestamp with time zone NOT NULL
);
CREATE TABLE usinas_reporting.tbl_est_movimentos (
    id integer NOT NULL,
    material_id integer NOT NULL,
    tipo character varying(20) NOT NULL,
    data date NOT NULL,
    quantidade numeric(16,3) NOT NULL,
    nota_fiscal character varying(100),
    fornecedor character varying(200),
    observacao text,
    responsavel character varying(100),
    origem character varying(50) NOT NULL,
    referencia_id integer,
    created_at timestamp with time zone NOT NULL,
    unidade character varying(20),
    silo_id integer,
    valor_nota numeric(12,4),
    icms_perc numeric(5,2),
    valor_frete numeric(12,4),
    icms_frete numeric(12,4),
    valor_unitario_liquido numeric(12,4)
);
CREATE TABLE usinas_reporting.tbl_massadas (
    id integer NOT NULL,
    produto text NOT NULL,
    formula text NOT NULL,
    qtd numeric NOT NULL,
    data date,
    hora time without time zone,
    data_hora timestamp without time zone,
    hora_inicio time without time zone,
    hora_final time without time zone,
    hora_descarga time without time zone,
    misturador text,
    numero_serie numeric,
    temperatura double precision,
    real_agregado1 numeric,
    real_agregado2 numeric,
    real_agregado3 numeric,
    real_agregado4 numeric,
    real_agregado5 numeric,
    real_agregado6 numeric,
    real_agregado7 numeric,
    prog_agregado1 numeric,
    prog_agregado2 numeric,
    prog_agregado3 numeric,
    prog_agregado4 numeric,
    prog_agregado5 numeric,
    prog_agregado6 numeric,
    prog_agregado7 numeric,
    ur1 numeric,
    ur2 numeric,
    ur3 numeric,
    ur4 numeric,
    ur5 numeric,
    ur6 numeric,
    ur7 numeric,
    real_silo1 numeric,
    real_silo2 numeric,
    real_silo3 numeric,
    real_silo4 numeric,
    prog_silo1 numeric,
    prog_silo2 numeric,
    prog_silo3 numeric,
    prog_silo4 numeric,
    real_agua1 numeric,
    prog_agua1 numeric,
    real_aditivo1 numeric,
    real_aditivo2 numeric,
    real_aditivo3 numeric,
    prog_aditivo1 numeric,
    prog_aditivo2 numeric,
    prog_aditivo3 numeric,
    corte numeric,
    ac double precision,
    carregado integer,
    alterado integer,
    setor text,
    setor_atualizado_em timestamp without time zone,
    ativa boolean NOT NULL,
    redosa integer NOT NULL
);
CREATE TABLE usinas_reporting.tbl_nao_conformidades_apontadas (
    id integer NOT NULL,
    data date NOT NULL,
    hora_apontamento time without time zone NOT NULL,
    turno text,
    tipo text NOT NULL,
    descricao text NOT NULL,
    acao_tomada text,
    criado_em timestamp without time zone NOT NULL
);
CREATE TABLE usinas_reporting.tbl_paradas_apontadas (
    id integer NOT NULL,
    data date NOT NULL,
    hora_apontamento time without time zone NOT NULL,
    turno text,
    hora_inicio time without time zone,
    hora_fim time without time zone,
    minutos numeric NOT NULL,
    motivo text NOT NULL,
    m3_perdido numeric NOT NULL,
    criado_em timestamp without time zone NOT NULL
);
CREATE TABLE usinas_reporting.tbl_qrcp (
    id character varying(36) NOT NULL,
    traco character varying(200),
    numero_serie character varying(50),
    nome character varying(200),
    cp character varying(10),
    idade integer,
    data_moldagem date,
    hora_moldagem character varying(10),
    data_ruptura date,
    qr_raw text,
    created_at timestamp without time zone,
    resistencia_mpa numeric(10,2)
);
CREATE TABLE usinas_reporting.tbl_receitas (
    id bigint NOT NULL,
    nome text NOT NULL,
    agregado1 numeric,
    agregado2 numeric,
    agregado3 numeric,
    agregado4 numeric,
    agregado5 numeric,
    agregado6 numeric,
    agregado7 numeric,
    cimento1 numeric,
    cimento2 numeric,
    cimento3 numeric,
    cimento4 numeric,
    agua numeric,
    aditivo1 numeric,
    aditivo2 numeric,
    aditivo3 numeric,
    ativa boolean NOT NULL,
    alterado integer NOT NULL,
    nome_traco character varying NOT NULL,
    cimento numeric,
    adicao_1 numeric,
    adicao_2 numeric,
    areia_1 numeric,
    areia_2 numeric,
    areia_3 numeric,
    brita_1 numeric,
    brita_2 numeric,
    aditivo_1 numeric,
    aditivo_2 numeric,
    ac numeric,
    r24h numeric,
    r3 numeric,
    r7 numeric,
    r28 numeric,
    created_at timestamp without time zone,
    revisao_grupo uuid NOT NULL,
    revisao_numero integer NOT NULL,
    revisao_origem_id bigint,
    observacao_revisao text,
    revisado_em timestamp without time zone,
    alterado_por text
);
ALTER TABLE "unificado_auth"."user_units" ADD COLUMN "alcada" text DEFAULT 'operacao'::text NOT NULL;
ALTER SEQUENCE dosagem.auditoria_id_seq OWNED BY dosagem.auditoria.id;
ALTER SEQUENCE dosagem.avaliacoes_impacto_id_seq OWNED BY dosagem.avaliacoes_impacto.id;
ALTER SEQUENCE dosagem.legado_ids_id_seq OWNED BY dosagem.legado_ids.id;
ALTER SEQUENCE dosagem.material_versoes_id_seq OWNED BY dosagem.material_versoes.id;
ALTER SEQUENCE public.mapa_operation_audit_id_seq OWNED BY public.mapa_operation_audit.id;
ALTER TABLE public.odin_reversoes ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.odin_reversoes_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);
ALTER SEQUENCE public.producao_diaria_id_seq OWNED BY public.producao_diaria.id;
ALTER SEQUENCE unificado_auth.client_errors_id_seq OWNED BY unificado_auth.client_errors.id;
ALTER TABLE unificado_auth.logistica_grant_audit ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME unificado_auth.logistica_grant_audit_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);
ALTER SEQUENCE unificado_auth.mapa_login_events_id_seq OWNED BY unificado_auth.mapa_login_events.id;
ALTER SEQUENCE unificado_auth.problem_reports_id_seq OWNED BY unificado_auth.problem_reports.id;
ALTER SEQUENCE unificado_auth.user_actions_id_seq OWNED BY unificado_auth.user_actions.id;
ALTER SEQUENCE usina_manutencao.atividade_foto_id_seq OWNED BY usina_manutencao.atividade_foto.id;
ALTER SEQUENCE usina_manutencao.atividade_id_seq OWNED BY usina_manutencao.atividade.id;
ALTER SEQUENCE usina_manutencao.documento_fotos_id_seq OWNED BY usina_manutencao.documento_fotos.id;
ALTER SEQUENCE usina_manutencao.foto_id_seq OWNED BY usina_manutencao.foto.id;
ALTER SEQUENCE usina_manutencao.historico_id_seq OWNED BY usina_manutencao.historico.id;
ALTER TABLE ONLY dosagem.auditoria ALTER COLUMN id SET DEFAULT nextval('dosagem.auditoria_id_seq'::regclass);
ALTER TABLE ONLY dosagem.avaliacoes_impacto ALTER COLUMN id SET DEFAULT nextval('dosagem.avaliacoes_impacto_id_seq'::regclass);
ALTER TABLE ONLY dosagem.legado_ids ALTER COLUMN id SET DEFAULT nextval('dosagem.legado_ids_id_seq'::regclass);
ALTER TABLE ONLY dosagem.material_versoes ALTER COLUMN id SET DEFAULT nextval('dosagem.material_versoes_id_seq'::regclass);
ALTER TABLE ONLY usina_manutencao.atividade ALTER COLUMN id SET DEFAULT nextval('usina_manutencao.atividade_id_seq'::regclass);
ALTER TABLE ONLY usina_manutencao.atividade_foto ALTER COLUMN id SET DEFAULT nextval('usina_manutencao.atividade_foto_id_seq'::regclass);
ALTER TABLE ONLY usina_manutencao.documento_fotos ALTER COLUMN id SET DEFAULT nextval('usina_manutencao.documento_fotos_id_seq'::regclass);
ALTER TABLE ONLY usina_manutencao.foto ALTER COLUMN id SET DEFAULT nextval('usina_manutencao.foto_id_seq'::regclass);
ALTER TABLE ONLY usina_manutencao.historico ALTER COLUMN id SET DEFAULT nextval('usina_manutencao.historico_id_seq'::regclass);
CREATE OR REPLACE VIEW api.formas_manutencao AS
 SELECT id,
    setor,
    forma_numero,
    status,
    motivo_parada,
    acao_necessaria,
    parada_em,
    parada_por,
    liberada_em,
    liberada_por,
    obs_liberacao,
    updated_at
   FROM public.formas_manutencao;
CREATE OR REPLACE VIEW api.inspecao_defeitos AS
 SELECT id,
    setor,
    serie,
    data_desforma,
    turno,
    tipo,
    forma_numero,
    classe,
    observacoes,
    defeitos,
    producao_record_id,
    criado_em,
    atualizado_em
   FROM public.inspecao_defeitos;
CREATE OR REPLACE VIEW api.liberacao_formas AS
 SELECT id,
    data_fabricacao,
    setor,
    forma,
    colaborador,
    data_hora
   FROM public.liberacao_formas;
CREATE OR REPLACE VIEW api.montagem_poste AS
 SELECT id,
    record_id,
    data_fabricacao,
    setor,
    forma_numero,
    modelo,
    status_montagem,
    motivo_recusa,
    etapa,
    inicio_inspecao_montagem,
    finalizado_em,
    checklists,
    banco,
    observacoes_montagem,
    montador_nome,
    created_at,
    updated_at,
    codigo_poste,
    descricao_poste,
    codigo_produto
   FROM public.montagem_poste;
CREATE OR REPLACE VIEW api.producao AS
 SELECT id,
    data_hora,
    setor,
    forma,
    modelo,
    tipo_concreto,
    colaborador,
    data_fabricacao,
    status,
    codigo_poste,
    descricao_poste,
    codigo_produto,
    vibrado
   FROM public.producao;
CREATE OR REPLACE VIEW api.producao_diaria AS
 SELECT id,
    data_producao,
    forma,
    tipo_poste,
    quantidade,
    setor,
    created_at
   FROM public.producao_diaria;
CREATE OR REPLACE VIEW api.prog_s3_s4 AS
 SELECT id,
    data,
    forma,
    setor,
    modelo,
    observacao,
    created_at,
    updated_at
   FROM public.prog_s3_s4;
CREATE OR REPLACE VIEW api.programacao_pcp AS
 SELECT id,
    data_fabricacao,
    setor,
    forma,
    modelo,
    codigo_poste,
    descricao_poste,
    codigo_produto,
    quantidade,
    data_hora
   FROM public.programacao_pcp;
CREATE OR REPLACE VIEW api.usuarios AS
 SELECT id,
    nome,
    perfil,
    ativo,
    created_at,
    updated_at,
    setor,
    primeiro_acesso
   FROM public.usuarios;
CREATE OR REPLACE VIEW api.vw_formas_status AS
 WITH chaves AS (
         SELECT programacao_pcp.data_fabricacao,
            programacao_pcp.setor,
            upper(btrim(programacao_pcp.forma)) AS forma
           FROM public.programacao_pcp
          WHERE ((programacao_pcp.data_fabricacao IS NOT NULL) AND (programacao_pcp.forma IS NOT NULL))
        UNION
         SELECT liberacao_formas.data_fabricacao,
            liberacao_formas.setor,
            upper(btrim(liberacao_formas.forma)) AS forma
           FROM public.liberacao_formas
          WHERE ((liberacao_formas.data_fabricacao IS NOT NULL) AND (liberacao_formas.forma IS NOT NULL))
        UNION
         SELECT producao.data_fabricacao,
            producao.setor,
            upper(btrim(producao.forma)) AS forma
           FROM public.producao
          WHERE ((producao.data_fabricacao IS NOT NULL) AND (producao.forma IS NOT NULL) AND ((producao.status = ANY (ARRAY['LIBERADO'::text, 'CONCRETADO'::text])) OR (producao.tipo_concreto IS NOT NULL)))
        ), programacao AS (
         SELECT DISTINCT ON (programacao_pcp.data_fabricacao, programacao_pcp.setor, (upper(btrim(programacao_pcp.forma)))) programacao_pcp.id,
            programacao_pcp.data_fabricacao,
            programacao_pcp.setor,
            upper(btrim(programacao_pcp.forma)) AS forma,
            programacao_pcp.data_hora,
            programacao_pcp.modelo,
            programacao_pcp.codigo_poste,
            programacao_pcp.descricao_poste,
            programacao_pcp.codigo_produto,
            programacao_pcp.quantidade
           FROM public.programacao_pcp
          WHERE ((programacao_pcp.data_fabricacao IS NOT NULL) AND (programacao_pcp.forma IS NOT NULL))
          ORDER BY programacao_pcp.data_fabricacao, programacao_pcp.setor, (upper(btrim(programacao_pcp.forma))), programacao_pcp.data_hora DESC NULLS LAST, programacao_pcp.id DESC
        ), liberacao AS (
         SELECT DISTINCT ON (liberacao_formas.data_fabricacao, liberacao_formas.setor, (upper(btrim(liberacao_formas.forma)))) liberacao_formas.id,
            liberacao_formas.data_fabricacao,
            liberacao_formas.setor,
            upper(btrim(liberacao_formas.forma)) AS forma,
            liberacao_formas.colaborador,
            liberacao_formas.data_hora
           FROM public.liberacao_formas
          WHERE ((liberacao_formas.data_fabricacao IS NOT NULL) AND (liberacao_formas.forma IS NOT NULL))
          ORDER BY liberacao_formas.data_fabricacao, liberacao_formas.setor, (upper(btrim(liberacao_formas.forma))), liberacao_formas.data_hora DESC NULLS LAST, liberacao_formas.id DESC
        ), producao_atual AS (
         SELECT DISTINCT ON (producao.data_fabricacao, producao.setor, (upper(btrim(producao.forma)))) producao.id,
            producao.data_fabricacao,
            producao.setor,
            upper(btrim(producao.forma)) AS forma,
            producao.tipo_concreto,
            producao.colaborador,
            producao.data_hora,
            producao.modelo,
            producao.codigo_poste,
            producao.descricao_poste,
            producao.codigo_produto
           FROM public.producao
          WHERE ((producao.data_fabricacao IS NOT NULL) AND (producao.forma IS NOT NULL) AND ((producao.status = ANY (ARRAY['LIBERADO'::text, 'CONCRETADO'::text])) OR (producao.tipo_concreto IS NOT NULL)))
          ORDER BY producao.data_fabricacao, producao.setor, (upper(btrim(producao.forma))), producao.data_hora DESC NULLS LAST, producao.id DESC
        )
 SELECT chaves.data_fabricacao,
    chaves.setor,
    chaves.forma,
    programacao.id AS prog_id,
    liberacao.id AS lib_id,
    liberacao.colaborador AS lib_colaborador,
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
   FROM (((chaves
     LEFT JOIN programacao USING (data_fabricacao, setor, forma))
     LEFT JOIN liberacao USING (data_fabricacao, setor, forma))
     LEFT JOIN producao_atual USING (data_fabricacao, setor, forma));
CREATE OR REPLACE VIEW public.vw_dashboard_montagem_base_v1 AS
 SELECT id,
    record_id,
    data_fabricacao,
    setor,
    public.dashboard_sector_code_v1(setor) AS setor_code,
    forma_numero,
    modelo,
    status_montagem,
    etapa,
    inicio_inspecao_montagem,
    finalizado_em,
    checklists,
    montador_nome,
    public.dashboard_jsonb_count_value_v1(checklists, 'nao'::text) AS defeitos_ocorrencias,
    public.dashboard_jsonb_string_leaf_count_v1(checklists) AS defeitos_oportunidades
   FROM public.montagem_poste;
CREATE OR REPLACE VIEW public.vw_dashboard_producao_base_v1 AS
 SELECT id,
    data_fabricacao,
    data_hora,
    setor,
    public.dashboard_sector_code_v1(setor) AS setor_code,
    forma,
    modelo,
    codigo_produto,
    tipo_concreto,
    colaborador,
    status
   FROM public.producao;
CREATE OR REPLACE VIEW public.vw_formas_status AS
 WITH unique_keys AS (
         SELECT programacao_pcp.data_fabricacao,
            programacao_pcp.setor,
            programacao_pcp.forma
           FROM public.programacao_pcp
        UNION
         SELECT liberacao_formas.data_fabricacao,
            liberacao_formas.setor,
            liberacao_formas.forma
           FROM public.liberacao_formas
        UNION
         SELECT producao.data_fabricacao,
            producao.setor,
            producao.forma
           FROM public.producao
        )
 SELECT uk.data_fabricacao,
    uk.setor,
    uk.forma,
    prog.id AS prog_id,
    prog.modelo AS prog_modelo,
    prog.codigo_poste AS prog_codigo_poste,
    prog.descricao_poste AS prog_descricao_poste,
    prog.codigo_produto AS prog_codigo_produto,
    prog.quantidade AS prog_quantidade,
    lib.id AS lib_id,
    lib.data_hora AS lib_data_hora,
    lib.colaborador AS lib_colaborador,
    prod.id AS prod_id,
    prod.data_hora AS prod_data_hora,
    prod.modelo AS prod_modelo,
    prod.codigo_poste AS prod_codigo_poste,
    prod.descricao_poste AS prod_descricao_poste,
    prod.codigo_produto AS prod_codigo_produto,
    prod.tipo_concreto AS prod_tipo_concreto,
    prod.colaborador AS prod_colaborador
   FROM (((unique_keys uk
     LEFT JOIN public.programacao_pcp prog ON (((prog.data_fabricacao = uk.data_fabricacao) AND (prog.setor = uk.setor) AND (prog.forma = uk.forma))))
     LEFT JOIN public.liberacao_formas lib ON (((lib.data_fabricacao = uk.data_fabricacao) AND (lib.setor = uk.setor) AND (lib.forma = uk.forma))))
     LEFT JOIN public.producao prod ON (((prod.data_fabricacao = uk.data_fabricacao) AND (prod.setor = uk.setor) AND (prod.forma = uk.forma))));
CREATE OR REPLACE VIEW usinas.v_massada_noro AS
 SELECT m.id,
    m.produto,
    m.formula,
    m.qtd,
    m.data,
    m.hora,
    m.data_hora,
    m.hora_inicio,
    m.hora_final,
    m.hora_descarga,
    m.misturador,
    m.numero_serie,
    m.temperatura,
    m.real_agregado1,
    m.real_agregado2,
    m.real_agregado3,
    m.real_agregado4,
    m.real_agregado5,
    m.real_agregado6,
    m.real_agregado7,
    m.prog_agregado1,
    m.prog_agregado2,
    m.prog_agregado3,
    m.prog_agregado4,
    m.prog_agregado5,
    m.prog_agregado6,
    m.prog_agregado7,
    m.ur1,
    m.ur2,
    m.ur3,
    m.ur4,
    m.ur5,
    m.ur6,
    m.ur7,
    m.real_silo1,
    m.real_silo2,
    m.real_silo3,
    m.real_silo4,
    m.prog_silo1,
    m.prog_silo2,
    m.prog_silo3,
    m.prog_silo4,
    m.real_agua1,
    m.prog_agua1,
    m.real_aditivo1,
    m.real_aditivo2,
    m.real_aditivo3,
    m.prog_aditivo1,
    m.prog_aditivo2,
    m.prog_aditivo3,
    m.corte,
    m.ac,
    m.carregado,
    m.alterado,
    m.setor,
    m.setor_atualizado_em,
    m.ativa,
    m.redosa,
    (m.data + m.hora) AS data_hora_operacional,
    COALESCE(a.setor, m.setor) AS setor_efetivo,
    COALESCE(a.ativa, m.ativa) AS ativa_efetiva,
    COALESCE(a.redosa, m.redosa) AS redosa_efetiva,
    a.atualizado_por,
    a.atualizado_em
   FROM (noro_sup.tbl_massadas m
     LEFT JOIN usinas.massada_anotacao a ON (((a.unidade_id = 'noroeste'::text) AND (a.massada_id = m.id))));
CREATE OR REPLACE VIEW usinas.v_noro_pcpsetor AS
 SELECT id,
    data,
    dia_semana,
    setor,
    volume,
    status,
    created_at,
    updated_at
   FROM noro_sup.tbl_pcpsetor;
CREATE OR REPLACE VIEW usinas.v_noro_produtos AS
 SELECT id,
    nome,
    codigo,
    descricao,
    ativo,
    criado_em,
    alterado
   FROM noro_sup.tbl_produtos;
CREATE OR REPLACE VIEW usinas.v_noro_receitas AS
 SELECT id,
    nome,
    agregado1,
    agregado2,
    agregado3,
    agregado4,
    agregado5,
    agregado6,
    agregado7,
    cimento1,
    cimento2,
    cimento3,
    cimento4,
    agua,
    aditivo1,
    aditivo2,
    aditivo3,
    ativa,
    alterado,
    nome_traco,
    cimento,
    adicao_1,
    adicao_2,
    areia_1,
    areia_2,
    areia_3,
    brita_1,
    brita_2,
    aditivo_1,
    aditivo_2,
    ac,
    r24h,
    r3,
    r7,
    r28,
    created_at,
    revisao_grupo,
    revisao_numero,
    revisao_origem_id,
    observacao_revisao,
    revisado_em,
    alterado_por
   FROM noro_sup.tbl_receitas;
ALTER TABLE ONLY dosagem.alembic_version
    ADD CONSTRAINT alembic_version_pkc PRIMARY KEY (version_num);
ALTER TABLE ONLY dosagem.auditoria
    ADD CONSTRAINT auditoria_pkey PRIMARY KEY (id);
ALTER TABLE ONLY dosagem.auth_flows
    ADD CONSTRAINT auth_flows_pkey PRIMARY KEY (estado_hash);
ALTER TABLE ONLY dosagem.auth_sessions
    ADD CONSTRAINT auth_sessions_pkey PRIMARY KEY (sessao_hash);
ALTER TABLE ONLY dosagem.auth_tickets
    ADD CONSTRAINT auth_tickets_pkey PRIMARY KEY (ticket_hash);
ALTER TABLE ONLY dosagem.avaliacoes_impacto
    ADD CONSTRAINT avaliacoes_impacto_pkey PRIMARY KEY (id);
ALTER TABLE ONLY dosagem.documentos
    ADD CONSTRAINT documentos_pkey PRIMARY KEY (chave);
ALTER TABLE ONLY dosagem.idempotencia
    ADD CONSTRAINT idempotencia_pkey PRIMARY KEY (request_id);
ALTER TABLE ONLY dosagem.legado_ids
    ADD CONSTRAINT legado_ids_pkey PRIMARY KEY (id);
ALTER TABLE ONLY dosagem.local_credenciais
    ADD CONSTRAINT local_credenciais_pkey PRIMARY KEY (email);
ALTER TABLE ONLY dosagem.material_versoes
    ADD CONSTRAINT material_versoes_pkey PRIMARY KEY (id);
ALTER TABLE ONLY dosagem.traco_versoes
    ADD CONSTRAINT traco_versoes_pkey PRIMARY KEY (chave);
ALTER TABLE ONLY dosagem.documentos
    ADD CONSTRAINT uq_documento_versao UNIQUE (tipo, id, versao);
ALTER TABLE ONLY dosagem.legado_ids
    ADD CONSTRAINT uq_legado_origem_id UNIQUE (origem, id_antigo);
ALTER TABLE ONLY dosagem.usuarios
    ADD CONSTRAINT usuarios_pkey PRIMARY KEY (email);
ALTER TABLE ONLY estoque.config_massada
    ADD CONSTRAINT config_massada_pkey PRIMARY KEY (unidade_id, legado_id);
ALTER TABLE ONLY estoque.config_massada
    ADD CONSTRAINT config_massada_unidade_id_coluna_key UNIQUE (unidade_id, coluna);
ALTER TABLE ONLY estoque.custo_ajuste
    ADD CONSTRAINT custo_ajuste_pkey PRIMARY KEY (unidade_id, legado_id);
ALTER TABLE ONLY estoque.material
    ADD CONSTRAINT material_pkey PRIMARY KEY (unidade_id, legado_id);
ALTER TABLE ONLY estoque.material
    ADD CONSTRAINT material_unidade_id_codigo_key UNIQUE (unidade_id, codigo);
ALTER TABLE ONLY estoque.movimento
    ADD CONSTRAINT movimento_pkey PRIMARY KEY (unidade_id, legado_id);
ALTER TABLE ONLY estoque.noro_movimento_local
    ADD CONSTRAINT noro_movimento_local_pkey PRIMARY KEY (unidade_id, local_id);
ALTER TABLE ONLY estoque.silo
    ADD CONSTRAINT silo_pkey PRIMARY KEY (unidade_id, legado_id);
ALTER TABLE ONLY lab.cp_leitura
    ADD CONSTRAINT cp_leitura_pkey PRIMARY KEY (unidade_id, fonte_tabela, legado_id);
ALTER TABLE ONLY public.fechamento_producao_confirmacoes
    ADD CONSTRAINT fechamento_producao_confirmacoes_pkey PRIMARY KEY (data_fabricacao, setor, forma_chave, producao_id);
ALTER TABLE ONLY public.fechamento_producao_eventos
    ADD CONSTRAINT fechamento_producao_eventos_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.odin_reversoes
    ADD CONSTRAINT odin_reversoes_pkey PRIMARY KEY (id);
ALTER TABLE ONLY unificado_auth.alembic_version_armacao_iam
    ADD CONSTRAINT alembic_version_armacao_iam_pkc PRIMARY KEY (version_num);
ALTER TABLE ONLY unificado_auth.alembic_version_logistica_iam
    ADD CONSTRAINT alembic_version_logistica_iam_pkc PRIMARY KEY (version_num);
ALTER TABLE ONLY unificado_auth.armacao_seeded_grants
    ADD CONSTRAINT armacao_seeded_grants_pkey PRIMARY KEY (user_id, action_id);
ALTER TABLE ONLY unificado_auth.logistica_grant_audit
    ADD CONSTRAINT logistica_grant_audit_pkey PRIMARY KEY (id);
ALTER TABLE ONLY unificado_auth.logistica_iam_meta
    ADD CONSTRAINT logistica_iam_meta_pkey PRIMARY KEY (id);
ALTER TABLE ONLY unificado_auth.logistica_seeded_grants
    ADD CONSTRAINT logistica_seeded_grants_pkey PRIMARY KEY (user_id, action_id);
ALTER TABLE ONLY unificado_auth.noro_release_users
    ADD CONSTRAINT noro_release_users_pkey PRIMARY KEY (user_id);
ALTER TABLE ONLY unificado_auth.user_unit_extras
    ADD CONSTRAINT user_unit_extras_pkey PRIMARY KEY (user_id, unit_code);
ALTER TABLE ONLY usina_manutencao.atividade
    ADD CONSTRAINT atividade_codigo_key UNIQUE (codigo);
ALTER TABLE ONLY usina_manutencao.atividade
    ADD CONSTRAINT atividade_criado_por_chave_criacao_key UNIQUE (criado_por, chave_criacao);
ALTER TABLE ONLY usina_manutencao.atividade_foto
    ADD CONSTRAINT atividade_foto_atividade_id_foto_id_slide_key UNIQUE (atividade_id, foto_id, slide);
ALTER TABLE ONLY usina_manutencao.atividade_foto
    ADD CONSTRAINT atividade_foto_pkey PRIMARY KEY (id);
ALTER TABLE ONLY usina_manutencao.atividade
    ADD CONSTRAINT atividade_pkey PRIMARY KEY (id);
ALTER TABLE ONLY usina_manutencao.configuracao
    ADD CONSTRAINT configuracao_pkey PRIMARY KEY (id);
ALTER TABLE ONLY usina_manutencao.documento_fotos
    ADD CONSTRAINT documento_fotos_pkey PRIMARY KEY (id);
ALTER TABLE ONLY usina_manutencao.documento_fotos
    ADD CONSTRAINT documento_fotos_sha256_key UNIQUE (sha256);
ALTER TABLE ONLY usina_manutencao.foto
    ADD CONSTRAINT foto_documento_id_sha256_key UNIQUE (documento_id, sha256);
ALTER TABLE ONLY usina_manutencao.foto
    ADD CONSTRAINT foto_pkey PRIMARY KEY (id);
ALTER TABLE ONLY usina_manutencao.historico
    ADD CONSTRAINT historico_pkey PRIMARY KEY (id);
ALTER TABLE ONLY usinas.agregado
    ADD CONSTRAINT agregado_pkey PRIMARY KEY (unidade_id, legado_id);
ALTER TABLE ONLY usinas.auditoria_legado_noro
    ADD CONSTRAINT auditoria_legado_noro_pkey PRIMARY KEY (unidade_id, legado_id);
ALTER TABLE ONLY usinas.carta_traco_campo
    ADD CONSTRAINT carta_traco_campo_pkey PRIMARY KEY (unidade_id, legado_id);
ALTER TABLE ONLY usinas.carta_traco_campo
    ADD CONSTRAINT carta_traco_campo_unidade_id_coluna_key UNIQUE (unidade_id, coluna);
ALTER TABLE ONLY usinas.carta_traco
    ADD CONSTRAINT carta_traco_pkey PRIMARY KEY (unidade_id, legado_id);
ALTER TABLE ONLY usinas.leitura_setor
    ADD CONSTRAINT leitura_setor_pkey PRIMARY KEY (unidade_id, legado_id);
ALTER TABLE ONLY usinas.massada_anotacao
    ADD CONSTRAINT massada_anotacao_pkey PRIMARY KEY (unidade_id, massada_id);
ALTER TABLE ONLY usinas.sync_estado
    ADD CONSTRAINT sync_estado_pkey PRIMARY KEY (unidade_id, tabela);
ALTER TABLE ONLY usinas_reporting.tbl_config_traco_campo
    ADD CONSTRAINT tbl_config_traco_campo_pkey PRIMARY KEY (id);
ALTER TABLE ONLY usinas_reporting.tbl_est_config_massada
    ADD CONSTRAINT tbl_est_config_massada_pkey PRIMARY KEY (id);
ALTER TABLE ONLY usinas_reporting.tbl_est_custos_ajustes
    ADD CONSTRAINT tbl_est_custos_ajustes_pkey PRIMARY KEY (id);
ALTER TABLE ONLY usinas_reporting.tbl_est_materiais
    ADD CONSTRAINT tbl_est_materiais_pkey PRIMARY KEY (id);
ALTER TABLE ONLY usinas_reporting.tbl_est_movimentos
    ADD CONSTRAINT tbl_est_movimentos_pkey PRIMARY KEY (id);
ALTER TABLE ONLY usinas_reporting.tbl_massadas
    ADD CONSTRAINT tbl_massadas_pkey PRIMARY KEY (id);
ALTER TABLE ONLY usinas_reporting.tbl_nao_conformidades_apontadas
    ADD CONSTRAINT tbl_nao_conformidades_apontadas_pkey PRIMARY KEY (id);
ALTER TABLE ONLY usinas_reporting.tbl_paradas_apontadas
    ADD CONSTRAINT tbl_paradas_apontadas_pkey PRIMARY KEY (id);
ALTER TABLE ONLY usinas_reporting.tbl_qrcp
    ADD CONSTRAINT tbl_qrcp_pkey PRIMARY KEY (id);
ALTER TABLE ONLY usinas_reporting.tbl_receitas
    ADD CONSTRAINT tbl_receitas_pkey PRIMARY KEY (id);
CREATE INDEX ix_auth_sessions_email ON dosagem.auth_sessions USING btree (email);
CREATE INDEX ix_avaliacoes_impacto_traco_versao_chave ON dosagem.avaliacoes_impacto USING btree (traco_versao_chave);
CREATE INDEX ix_documentos_fck ON dosagem.documentos USING btree (fck_mpa);
CREATE INDEX ix_documentos_metodo ON dosagem.documentos USING btree (metodo);
CREATE INDEX ix_documentos_nome ON dosagem.documentos USING btree (nome);
CREATE INDEX ix_documentos_tipo_unidade_status ON dosagem.documentos USING btree (tipo, unidade, status);
CREATE INDEX ix_material_versoes_material_id ON dosagem.material_versoes USING btree (material_id);
CREATE INDEX ix_traco_versoes_traco_id ON dosagem.traco_versoes USING btree (traco_id);
CREATE UNIQUE INDEX noro_cp_etiqueta_hash ON lab.cp_leitura USING btree (unidade_id, etiqueta_hash) WHERE (etiqueta_hash IS NOT NULL);
CREATE UNIQUE INDEX noro_cp_local_id ON lab.cp_leitura USING btree (unidade_id, local_id) WHERE (local_id IS NOT NULL);
CREATE UNIQUE INDEX noro_cp_qrcp_legado_id ON lab.cp_leitura USING btree (unidade_id, qrcp_legado_id) WHERE (qrcp_legado_id IS NOT NULL);
CREATE INDEX fechamento_producao_confirmacoes_dia_setor_idx ON public.fechamento_producao_confirmacoes USING btree (data_fabricacao, setor, confirmado_em);
CREATE INDEX fechamento_producao_eventos_forma_idx ON public.fechamento_producao_eventos USING btree (data_fabricacao, setor, forma_chave, criado_em DESC);
CREATE INDEX odin_reversoes_forma_idx ON public.odin_reversoes USING btree (data_fabricacao, setor, forma, revertido_em DESC);
CREATE INDEX atividade_foto_atividade_id_slide_numero_foto_idx ON usina_manutencao.atividade_foto USING btree (atividade_id, slide, numero_foto);
CREATE INDEX historico_atividade_id_id_idx ON usina_manutencao.historico USING btree (atividade_id, id DESC);
CREATE UNIQUE INDEX noro_carta_revisao_ativa ON usinas.carta_traco USING btree (unidade_id, revisao_grupo) WHERE (ativa AND (revisao_grupo IS NOT NULL));
CREATE TRIGGER ctdosagem_versao_imutavel_trg BEFORE DELETE OR UPDATE ON dosagem.traco_versoes FOR EACH ROW EXECUTE FUNCTION dosagem.ctdosagem_versao_imutavel();
ALTER TABLE ONLY dosagem.auth_sessions
    ADD CONSTRAINT auth_sessions_email_fkey FOREIGN KEY (email) REFERENCES dosagem.usuarios(email);
ALTER TABLE ONLY dosagem.avaliacoes_impacto
    ADD CONSTRAINT avaliacoes_impacto_traco_versao_chave_fkey FOREIGN KEY (traco_versao_chave) REFERENCES dosagem.traco_versoes(chave);
ALTER TABLE ONLY dosagem.legado_ids
    ADD CONSTRAINT legado_ids_documento_chave_fkey FOREIGN KEY (documento_chave) REFERENCES dosagem.documentos(chave);
ALTER TABLE ONLY dosagem.local_credenciais
    ADD CONSTRAINT local_credenciais_email_fkey FOREIGN KEY (email) REFERENCES dosagem.usuarios(email);
ALTER TABLE ONLY estoque.config_massada
    ADD CONSTRAINT config_massada_unidade_id_material_id_fkey FOREIGN KEY (unidade_id, material_id) REFERENCES estoque.material(unidade_id, legado_id);
ALTER TABLE ONLY estoque.movimento
    ADD CONSTRAINT movimento_unidade_id_material_id_fkey FOREIGN KEY (unidade_id, material_id) REFERENCES estoque.material(unidade_id, legado_id);
ALTER TABLE ONLY estoque.movimento
    ADD CONSTRAINT movimento_unidade_id_silo_id_fkey FOREIGN KEY (unidade_id, silo_id) REFERENCES estoque.silo(unidade_id, legado_id);
ALTER TABLE ONLY estoque.noro_movimento_local
    ADD CONSTRAINT noro_movimento_local_unidade_id_material_id_fkey FOREIGN KEY (unidade_id, material_id) REFERENCES estoque.material(unidade_id, legado_id);
ALTER TABLE ONLY estoque.noro_movimento_local
    ADD CONSTRAINT noro_movimento_local_unidade_id_silo_id_fkey FOREIGN KEY (unidade_id, silo_id) REFERENCES estoque.silo(unidade_id, legado_id);
ALTER TABLE ONLY unificado_auth.noro_release_users
    ADD CONSTRAINT noro_release_users_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.usuarios(id) ON DELETE CASCADE;
ALTER TABLE ONLY unificado_auth.user_unit_extras
    ADD CONSTRAINT user_unit_extras_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.usuarios(id) ON DELETE CASCADE;
ALTER TABLE ONLY usina_manutencao.atividade_foto
    ADD CONSTRAINT atividade_foto_atividade_id_fkey FOREIGN KEY (atividade_id) REFERENCES usina_manutencao.atividade(id);
ALTER TABLE ONLY usina_manutencao.atividade_foto
    ADD CONSTRAINT atividade_foto_foto_id_fkey FOREIGN KEY (foto_id) REFERENCES usina_manutencao.foto(id);
ALTER TABLE ONLY usina_manutencao.foto
    ADD CONSTRAINT foto_documento_id_fkey FOREIGN KEY (documento_id) REFERENCES usina_manutencao.documento_fotos(id);
ALTER TABLE ONLY usina_manutencao.historico
    ADD CONSTRAINT historico_atividade_id_fkey FOREIGN KEY (atividade_id) REFERENCES usina_manutencao.atividade(id);
ALTER TABLE ONLY usinas.carta_traco_campo
    ADD CONSTRAINT carta_traco_campo_unidade_id_material_id_fkey FOREIGN KEY (unidade_id, material_id) REFERENCES estoque.material(unidade_id, legado_id);
ALTER TABLE "unificado_auth"."user_action_permissions" DROP CONSTRAINT "user_action_permissions_action_id_check";
ALTER TABLE "unificado_auth"."user_action_permissions" ADD CONSTRAINT "user_action_permissions_action_id_check" CHECK (((action_id ~~ 'qualidade.%'::text) OR (action_id ~~ 'tarefas.%'::text) OR (action_id ~~ 'laboratorio.cronoanalise.%'::text) OR (action_id ~~ 'armacao.%'::text) OR (action_id ~~ 'logistica.%'::text)));
ALTER TABLE "unificado_auth"."user_units" DROP CONSTRAINT "user_units_unit_code_check";
ALTER TABLE "unificado_auth"."user_units" ADD CONSTRAINT "user_units_unit_code_check" CHECK ((unit_code = ANY (ARRAY['campinas'::text, 'pederneiras'::text, 'ribeirao'::text, 'noroeste'::text, 'todos'::text])));
COMMIT;
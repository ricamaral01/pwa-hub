create or replace function public.dashboard_sector_code_v1(p_setor text)
returns text
language sql
immutable
as $$
  select case trim(coalesce(p_setor, ''))
    when 'Setor 1' then 'S1'
    when 'Setor 2' then 'S2'
    when 'Setor 3' then 'S3'
    when 'Setor 4' then 'S4'
    else 'UNCLASSIFIED'
  end;
$$;

create or replace function public.dashboard_scope_sectors_v1(p_scope text)
returns text[]
language sql
immutable
as $$
  select case upper(coalesce(p_scope, 'TOTAL'))
    when 'S1' then array['Setor 1']
    when 'S2' then array['Setor 2']
    when 'S3' then array['Setor 3']
    when 'S4' then array['Setor 4']
    when 'S1_S2' then array['Setor 1', 'Setor 2']
    else array['Setor 1', 'Setor 2', 'Setor 3', 'Setor 4']
  end;
$$;

create or replace function public.dashboard_jsonb_count_value_v1(p_value jsonb, p_expected text)
returns integer
language plpgsql
immutable
as $$
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

create or replace function public.dashboard_jsonb_string_leaf_count_v1(p_value jsonb)
returns integer
language plpgsql
immutable
as $$
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

create or replace view public.vw_dashboard_producao_base_v1 as
select
  id,
  data_fabricacao,
  data_hora,
  setor,
  public.dashboard_sector_code_v1(setor) as setor_code,
  forma,
  modelo,
  codigo_produto,
  tipo_concreto,
  colaborador,
  status
from public.producao;

create or replace view public.vw_dashboard_montagem_base_v1 as
select
  id,
  record_id,
  data_fabricacao,
  setor,
  public.dashboard_sector_code_v1(setor) as setor_code,
  forma_numero,
  modelo,
  status_montagem,
  etapa,
  inicio_inspecao_montagem,
  finalizado_em,
  checklists,
  montador_nome,
  public.dashboard_jsonb_count_value_v1(checklists, 'nao') as defeitos_ocorrencias,
  public.dashboard_jsonb_string_leaf_count_v1(checklists) as defeitos_oportunidades
from public.montagem_poste;

create or replace function public.rpc_dashboard_produtividade_resumo_v1(
  p_data_inicio date,
  p_data_fim date,
  p_scope text default 'TOTAL'
)
returns jsonb
language sql
stable
as $$
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
$$;

create or replace function public.rpc_dashboard_montagem_resumo_v1(
  p_data_inicio date,
  p_data_fim date,
  p_scope text default 'TOTAL'
)
returns jsonb
language sql
stable
as $$
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

create or replace function public.rpc_dashboard_defeitos_resumo_v1(
  p_data_inicio date,
  p_data_fim date,
  p_scope text default 'TOTAL'
)
returns jsonb
language sql
stable
as $$
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
      count(*)::integer as postes,
      (select count(*)::integer from producao) as producao,
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
          'producao', (select count(*) from producao p where p.setor_code = m.setor_code),
          'postes', count(*)::integer,
          'erros', coalesce(sum(m.defeitos_ocorrencias), 0)::integer,
          'oportunidades', coalesce(sum(m.defeitos_oportunidades), 0)::integer
        ) as data
      from montagem m
      group by m.setor_code
    ) s
  )
  select jsonb_build_object(
    'contract_version', 'dashboard-defeitos-v1',
    'generated_at', now(),
    'scope', p_scope,
    'included_sectors', public.dashboard_scope_sectors_v1(p_scope),
    'kpis', jsonb_build_object(
      'postes', coalesce(t.postes, 0),
      'producao', coalesce(t.producao, 0),
      'total_possivel', coalesce(t.total_possivel, 0),
      'total_erros', coalesce(t.total_erros, 0),
      'postes_com_defeito', coalesce(t.postes_com_defeito, 0),
      'postes_reprovados', coalesce(t.postes_reprovados, 0),
      'retrabalho', coalesce(t.retrabalho, 0),
      'taxa_nc', case when coalesce(t.total_possivel, 0) > 0 then round(t.total_erros::numeric / t.total_possivel * 100, 2) else 0 end,
      'indice_reprovacao', case when coalesce(t.postes, 0) > 0 then round(t.postes_com_defeito::numeric / t.postes * 100, 2) else 0 end,
      'taxa_postes_reprovados', case when coalesce(t.producao, 0) > 0 then round(t.postes_reprovados::numeric / t.producao * 100, 2) else 0 end,
      'taxa_retrabalho', case when coalesce(t.postes, 0) > 0 then round(t.retrabalho::numeric / t.postes * 100, 2) else 0 end
    ),
    'by_sector', coalesce(bs.data, '{}'::jsonb)
  )
  from totals t
  cross join by_sector bs;
$$;

create index if not exists idx_dashboard_producao_data_setor_status_v1
  on public.producao(data_fabricacao, setor, status);

create index if not exists idx_dashboard_producao_datahora_setor_v1
  on public.producao(data_hora, setor);

create index if not exists idx_dashboard_montagem_data_setor_v1
  on public.montagem_poste(data_fabricacao, setor);

create index if not exists idx_dashboard_montagem_status_data_v1
  on public.montagem_poste(status_montagem, data_fabricacao);

create index if not exists idx_dashboard_montagem_checklists_gin_v1
  on public.montagem_poste using gin(checklists);

create table if not exists public.dashboard_retrabalho_eventos_v1 (
  id uuid primary key default gen_random_uuid(),
  montagem_id text,
  data_fabricacao date not null,
  setor text not null,
  setor_code text generated always as (public.dashboard_sector_code_v1(setor)) stored,
  forma text,
  modelo text,
  tipo_evento text not null,
  origem text,
  executor text,
  custo_mao_obra numeric(14, 2),
  custo_material numeric(14, 2),
  custo_equipamento numeric(14, 2),
  custo_outros numeric(14, 2),
  custo_total numeric(14, 2) generated always as (
    coalesce(custo_mao_obra, 0)
    + coalesce(custo_material, 0)
    + coalesce(custo_equipamento, 0)
    + coalesce(custo_outros, 0)
  ) stored,
  moeda text not null default 'BRL',
  status_custo text not null default 'ESTIMADO',
  observacao text,
  evidencias jsonb not null default '[]'::jsonb,
  aprovado_por uuid,
  aprovado_em timestamptz,
  created_by uuid default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint dashboard_retrabalho_status_custo_v1 check (
    status_custo in ('ESTIMADO', 'REAL_PARCIAL', 'REAL_FECHADO', 'OPORTUNIDADE')
  )
);

alter table public.dashboard_retrabalho_eventos_v1 enable row level security;

drop policy if exists dashboard_retrabalho_read_authenticated_v1
  on public.dashboard_retrabalho_eventos_v1;
drop policy if exists dashboard_retrabalho_insert_authenticated_v1
  on public.dashboard_retrabalho_eventos_v1;
drop policy if exists dashboard_retrabalho_update_owner_or_master_v1
  on public.dashboard_retrabalho_eventos_v1;

create policy dashboard_retrabalho_read_authenticated_v1
  on public.dashboard_retrabalho_eventos_v1
  for select
  to authenticated
  using (true);

create policy dashboard_retrabalho_insert_authenticated_v1
  on public.dashboard_retrabalho_eventos_v1
  for insert
  to authenticated
  with check (auth.uid() is not null);

create policy dashboard_retrabalho_update_owner_or_master_v1
  on public.dashboard_retrabalho_eventos_v1
  for update
  to authenticated
  using (created_by = auth.uid() or public.is_master())
  with check (created_by = auth.uid() or public.is_master());

create index if not exists idx_dashboard_retrabalho_data_setor_v1
  on public.dashboard_retrabalho_eventos_v1(data_fabricacao, setor);

create index if not exists idx_dashboard_retrabalho_montagem_v1
  on public.dashboard_retrabalho_eventos_v1(montagem_id);

create index if not exists idx_dashboard_retrabalho_status_v1
  on public.dashboard_retrabalho_eventos_v1(status_custo, data_fabricacao);

create or replace function public.rpc_dashboard_retrabalho_resumo_v1(
  p_data_inicio date,
  p_data_fim date,
  p_scope text default 'TOTAL',
  p_incluir_custos boolean default false
)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
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
      case when p_incluir_custos and auth.uid() is not null then coalesce(sum(custo_total), 0) else null end as custo_total
    from scoped
  ),
  by_sector as (
    select jsonb_object_agg(setor_code, data order by setor_code) as data
    from (
      select
        setor_code,
        jsonb_build_object(
          'eventos', count(*)::integer,
          'custo_total', case when p_incluir_custos and auth.uid() is not null then coalesce(sum(custo_total), 0) else null end
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
    'costs_visible', p_incluir_custos and auth.uid() is not null,
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

create or replace function public.rpc_dashboard_montagem_lista_v1(
  p_data_inicio date,
  p_data_fim date,
  p_scope text default 'TOTAL',
  p_page integer default 1,
  p_page_size integer default 50,
  p_sort text default 'finalizado_em',
  p_dir text default 'desc'
)
returns jsonb
language plpgsql
stable
as $$
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

create or replace function public.rpc_dashboard_montagem_ranking_v1(
  p_data_inicio date,
  p_data_fim date,
  p_scope text default 'TOTAL',
  p_dimensao text default 'montador',
  p_limit integer default 20
)
returns jsonb
language sql
stable
as $$
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

create or replace function public.rpc_dashboard_produtividade_tendencia_v1(
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
$$;

create or replace function public.rpc_dashboard_produtividade_detalhe_v1(
  p_data_inicio date,
  p_data_fim date,
  p_scope text default 'TOTAL',
  p_page integer default 1,
  p_page_size integer default 100
)
returns jsonb
language plpgsql
stable
as $$
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

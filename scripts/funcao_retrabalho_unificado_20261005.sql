-- Mapa original usa chave anon; auth.uid() e NULL nesse caminho.
-- No unificado, sessao customizada nao envia identidade Supabase.
CREATE OR REPLACE FUNCTION public.rpc_dashboard_retrabalho_resumo_v1(p_data_inicio date, p_data_fim date, p_scope text DEFAULT 'TOTAL'::text, p_incluir_custos boolean DEFAULT false)
 RETURNS jsonb
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
$function$
;

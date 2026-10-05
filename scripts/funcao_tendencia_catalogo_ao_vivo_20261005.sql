-- Definicao extraida do catalogo ao vivo; corrigir so depois de comparar resultado.
CREATE OR REPLACE FUNCTION public.rpc_dashboard_produtividade_tendencia_v1(p_data_inicio date, p_data_fim date, p_scope text DEFAULT 'TOTAL'::text)
 RETURNS jsonb
 LANGUAGE sql
 STABLE
AS $function$
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
$function$
;

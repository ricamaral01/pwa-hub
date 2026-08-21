create or replace function public.dashboard_jsonb_rejected_labels_v1(p_value jsonb)
returns table(label text)
language plpgsql
immutable
as $$
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

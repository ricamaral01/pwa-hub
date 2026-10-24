"""Read-only, per-post inspection indicators for the unified Defeitos header."""

from datetime import date


QUERY = """
WITH params AS (
  SELECT %s::date AS start_day, %s::date AS end_day,
         %s::text AS sector_filter, %s::text AS status_filter,
         %s::text AS search_filter
), base AS (
  SELECT m.*,
    COALESCE(NULLIF(m.record_id,''),split_part(m.id,'||HISTORICO_REPROVACAO||',1)) AS poste_key,
    COALESCE(m.finalizado_em::date,m.inicio_inspecao_montagem::date,m.data_fabricacao) AS event_day,
    (SELECT count(*) FROM jsonb_each(COALESCE(m.checklists,'{}'::jsonb)) section
       CROSS JOIN LATERAL jsonb_each_text(
         CASE WHEN jsonb_typeof(section.value)='object' THEN section.value ELSE '{}'::jsonb END
       ) answer
       WHERE section.key IN ('checagem_inicial','checagem_materiais','final','inspecao_visual')
         AND answer.value='nao') AS no_count,
    CASE WHEN m.setor IN ('Setor 1','Setor 2') THEN 26 ELSE 17 END AS checklist_items,
    m.checklists #>> '{__segunda_inspecao,resultado}' AS second_result
  FROM public.montagem_poste m
  WHERE m.etapa IN ('FINALIZACAO','HISTORICO_REPROVACAO','INSPECAO','REINSPECAO')
    AND (m.status_montagem IS NOT NULL OR m.finalizado_em IS NOT NULL)
), events AS (
  SELECT * FROM (
    SELECT base.*,row_number() OVER (
      PARTITION BY poste_key,finalizado_em
      ORDER BY CASE WHEN etapa='HISTORICO_REPROVACAO' THEN 0 ELSE 1 END,id
    ) AS event_rank FROM base
  ) ranked WHERE event_rank=1
), firsts AS (
  SELECT * FROM (
    SELECT events.*,row_number() OVER (
      PARTITION BY poste_key ORDER BY event_day,finalizado_em,id
    ) AS first_rank FROM events
  ) ranked WHERE first_rank=1
), inspected AS (
  SELECT f.setor,date_trunc('month',f.event_day)::date AS month,
    count(*)::integer AS inspected,
    count(*) FILTER (WHERE f.no_count>0)::integer AS nonconforming
  FROM firsts f CROSS JOIN params p
  WHERE f.event_day BETWEEN p.start_day AND p.end_day
    AND (p.sector_filter='' OR f.setor=p.sector_filter OR
         (p.sector_filter='Setores 1 e 2' AND f.setor IN ('Setor 1','Setor 2')))
    AND (p.search_filter='' OR f.forma_numero ILIKE '%%'||p.search_filter||'%%'
         OR f.modelo ILIKE '%%'||p.search_filter||'%%'
         OR f.montador_nome ILIKE '%%'||p.search_filter||'%%')
    AND (p.status_filter='' OR
         (p.status_filter='A' AND f.status_montagem='A' AND f.no_count=0) OR
         (p.status_filter='R' AND f.no_count>0) OR
         (p.status_filter NOT IN ('A','R') AND f.status_montagem=p.status_filter))
  GROUP BY 1,2
), defects AS (
  SELECT e.setor,sum(e.no_count)::integer AS defects,
         sum(e.checklist_items)::integer AS opportunities
  FROM events e CROSS JOIN params p
  WHERE e.event_day BETWEEN p.start_day AND p.end_day
    AND (p.sector_filter='' OR e.setor=p.sector_filter OR
         (p.sector_filter='Setores 1 e 2' AND e.setor IN ('Setor 1','Setor 2')))
    AND (p.search_filter='' OR e.forma_numero ILIKE '%%'||p.search_filter||'%%'
         OR e.modelo ILIKE '%%'||p.search_filter||'%%'
         OR e.montador_nome ILIKE '%%'||p.search_filter||'%%')
    AND (p.status_filter='' OR
         (p.status_filter='A' AND e.status_montagem='A' AND e.no_count=0) OR
         (p.status_filter='R' AND e.no_count>0) OR
         (p.status_filter NOT IN ('A','R') AND e.status_montagem=p.status_filter))
  GROUP BY 1
), outcomes AS (
  SELECT b.setor,
    count(DISTINCT b.poste_key) FILTER (
      WHERE b.status_montagem='RR' OR b.second_result='APROVADO_RETRABALHADO')::integer AS reworked,
    count(DISTINCT b.poste_key) FILTER (WHERE b.second_result='SEGREGADO')::integer AS lost
  FROM base b CROSS JOIN params p
  WHERE b.etapa<>'HISTORICO_REPROVACAO' AND b.event_day BETWEEN p.start_day AND p.end_day
    AND (p.sector_filter='' OR b.setor=p.sector_filter OR
         (p.sector_filter='Setores 1 e 2' AND b.setor IN ('Setor 1','Setor 2')))
    AND (p.search_filter='' OR b.forma_numero ILIKE '%%'||p.search_filter||'%%'
         OR b.modelo ILIKE '%%'||p.search_filter||'%%'
         OR b.montador_nome ILIKE '%%'||p.search_filter||'%%')
    AND (p.status_filter='' OR
         (p.status_filter='A' AND b.status_montagem='A' AND b.no_count=0) OR
         (p.status_filter='R' AND b.no_count>0) OR
         (p.status_filter NOT IN ('A','R') AND b.status_montagem=p.status_filter))
  GROUP BY 1
)
SELECT 'sector' AS row_type,setor AS sector,NULL::date AS month,
       sum(inspected)::integer AS inspected,sum(nonconforming)::integer AS nonconforming,
       sum(defects)::integer AS defects,sum(opportunities)::integer AS opportunities,
       sum(reworked)::integer AS reworked,sum(lost)::integer AS lost
FROM (
  SELECT setor,inspected,nonconforming,0 AS defects,0 AS opportunities,0 AS reworked,0 AS lost FROM inspected
  UNION ALL SELECT setor,0,0,defects,opportunities,0,0 FROM defects
  UNION ALL SELECT setor,0,0,0,0,reworked,lost FROM outcomes
) combined GROUP BY sector
UNION ALL
SELECT 'month',NULL,month,sum(inspected)::integer,sum(nonconforming)::integer,0,0,0,0
FROM inspected GROUP BY month
ORDER BY row_type,sector,month
"""


def load_indicators(connection, start: date, end: date, sector: str, status: str, search: str):
    with connection.cursor() as cursor:
        cursor.execute(QUERY, (start, end, sector, status, search))
        rows = cursor.fetchall()
    sectors = {f"Setor {number}": {
        "inspected": 0, "nonconforming": 0, "defects": 0,
        "opportunities": 0, "reworked": 0, "lost": 0,
    } for number in range(1, 5)}
    months = []
    for row in rows:
        if row["row_type"] == "sector" and row["sector"] in sectors:
            sectors[row["sector"]] = {key: row[key] for key in sectors[row["sector"]]}
        elif row["row_type"] == "month":
            months.append({"month": row["month"].strftime("%Y-%m"),
                           "inspected": row["inspected"],
                           "nonconforming": row["nonconforming"]})
    reported = {"total": 0, "by_model": [], "by_day": [], "by_type": []}
    if not status and sector in {"", "Setor 3"}:
        with connection.cursor() as cursor:
            cursor.execute("""SELECT event_date,model,defect_code,defect_name,count(*)::integer AS total
                              FROM unificado_auth.reported_defects
                              WHERE event_date BETWEEN %s AND %s AND sector='Setor 3'
                                AND (%s='' OR coalesce(model,'') ILIKE '%%'||%s||'%%'
                                     OR defect_name ILIKE '%%'||%s||'%%')
                              GROUP BY event_date,model,defect_code,defect_name
                              ORDER BY event_date,model NULLS LAST""",
                           (start, end, search, search, search))
            entries = cursor.fetchall()
        models, days, types = {}, {}, {}
        for row in entries:
            amount = row["total"]
            model = row["model"] or "Modelo não informado"
            day = row["event_date"].isoformat()
            defect = f'{row["defect_code"]} - {row["defect_name"]}'
            reported["total"] += amount
            models[model] = models.get(model, 0) + amount
            days[day] = days.get(day, 0) + amount
            types[defect] = types.get(defect, 0) + amount
        reported["by_model"] = [{"model": key, "count": value} for key, value in
                                sorted(models.items(), key=lambda item: (-item[1], item[0]))]
        reported["by_day"] = [{"day": key, "count": value} for key, value in sorted(days.items())]
        reported["by_type"] = [{"type": key, "count": value} for key, value in sorted(types.items())]
    return {"sectors": sectors, "months": months, "reported": reported}

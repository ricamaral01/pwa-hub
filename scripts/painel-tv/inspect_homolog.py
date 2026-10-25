"""Read-only, aggregate verification against the isolated test copies."""
import json
import psycopg

MAPA = 'dbname=mapa_unificado_homolog_20261016 user=tv_homolog_reader host=/var/run/postgresql'
PCP = 'dbname=pcp_unificado_homolog_20261016 user=tv_homolog_reader host=/var/run/postgresql'

with psycopg.connect(MAPA) as conn:
    with conn.cursor() as cur:
        for day in ('2026-10-14', '2026-10-15'):
            cur.execute('''WITH p AS (SELECT DISTINCT setor, upper(regexp_replace(btrim(forma),'\\s+','','g')) AS forma FROM programacao_pcp WHERE data_fabricacao=%s),
              r AS (SELECT DISTINCT setor, upper(regexp_replace(btrim(forma),'\\s+','','g')) AS forma FROM producao WHERE data_fabricacao=%s),
              l AS (SELECT DISTINCT setor, upper(regexp_replace(btrim(forma),'\\s+','','g')) AS forma FROM liberacao_formas WHERE data_fabricacao=%s)
              SELECT p.setor,count(*) AS mapa_programadas,count(r.forma) AS realizadas_programadas,
                     count(l.forma) AS liberadas_programadas
              FROM p LEFT JOIN r USING(setor,forma) LEFT JOIN l USING(setor,forma)
              GROUP BY p.setor ORDER BY p.setor''', (day, day, day))
            print('mapa', day, json.dumps(cur.fetchall(), ensure_ascii=False))
        cur.execute('''SELECT setor, codigo_produto, descricao_poste, modelo, count(*)
                       FROM producao WHERE data_fabricacao='2026-10-15' AND setor='Setor 1'
                       GROUP BY setor,codigo_produto,descricao_poste,modelo ORDER BY count(*) DESC LIMIT 12''')
        print('producao_tipos', json.dumps(cur.fetchall(), ensure_ascii=False))
with psycopg.connect(PCP) as conn:
    with conn.cursor() as cur:
        for day in ('2026-10-14', '2026-10-15'):
            cur.execute('''SELECT setor_id,sum(quantidade_programada),count(*) FROM programacoes
                           WHERE data=%s GROUP BY setor_id ORDER BY setor_id''', (day,))
            print('pcp', day, json.dumps(cur.fetchall(), ensure_ascii=False))
        cur.execute('''SELECT p.codigo,p.nome,p.volume FROM produtos p WHERE p.setor_id=1 ORDER BY p.codigo LIMIT 30''')
        print('produtos', json.dumps(cur.fetchall(), ensure_ascii=False, default=str))

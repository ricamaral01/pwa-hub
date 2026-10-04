"""Read-only source/test row parity for Montage, Productivity and History."""
from __future__ import annotations

from datetime import datetime, timezone
import json
import os
from pathlib import Path
from urllib.parse import urlencode

from contract_defects_source_data import get_pages, summarize
from contract_read_tables import AUTH_ENV, SOURCE_ENV, load_env

PRODUCTION = "id,data_hora,setor,forma,modelo,tipo_concreto,colaborador,data_fabricacao,status,codigo_poste,descricao_poste,codigo_produto,vibrado"
MONTAGE = "id,record_id,data_fabricacao,setor,forma_numero,modelo,status_montagem,etapa,inicio_inspecao_montagem,finalizado_em,montador_nome"


def main() -> None:
    load_env(SOURCE_ENV)
    load_env(AUTH_ENV)
    os.chdir('/opt/concrefer-unificado/mapa-api')
    import sys
    sys.path.insert(0, os.getcwd())
    from app import COOKIE_NAME, connect, signer
    with connect() as conn, conn.cursor() as cursor:
        cursor.execute("SELECT id,updated_at FROM public.usuarios WHERE perfil='GERENCIA' AND ativo AND NOT primeiro_acesso ORDER BY id LIMIT 1")
        user = cursor.fetchone()
    cookie = COOKIE_NAME + '=' + signer().dumps({"scope": "session", "id": user['id'], "updated_at": user['updated_at'].isoformat()})
    source_base = os.environ['SUPABASE_URL'].rstrip('/')
    key = os.environ['SUPABASE_SECRET_KEY']
    source_headers = {'apikey': key, 'Authorization': 'Bearer ' + key}
    test_headers = {'Cookie': cookie}
    results = []
    fixtures = {}
    for start, end in (('2026-10-01', '2026-10-04'), ('2026-09-01', '2026-10-04'),
                       ('2026-09-24', '2026-10-03')):
        begin = datetime.fromisoformat(start + 'T00:00:00-03:00').astimezone(timezone.utc).isoformat().replace('+00:00', 'Z')
        finish = datetime.fromisoformat(end + 'T23:59:59.999-03:00').astimezone(timezone.utc).isoformat(timespec='milliseconds').replace('+00:00', 'Z')
        cases = [
            ('montagem', 'montagem_poste', [('select', MONTAGE), ('or', f'(and(finalizado_em.gte.{begin},finalizado_em.lte.{finish}),and(inicio_inspecao_montagem.gte.{begin},inicio_inspecao_montagem.lte.{finish}),and(data_fabricacao.gte.{start},data_fabricacao.lte.{end}))'), ('order', 'id.asc')]),
            ('montagem-producao', 'producao', [('select', PRODUCTION), ('data_fabricacao', f'gte.{start}'), ('data_fabricacao', f'lte.{end}'), ('order', 'id.asc')]),
            ('produtividade', 'producao', [('select', PRODUCTION), ('data_fabricacao', f'gte.{start}'), ('data_fabricacao', f'lte.{end}'), ('status', 'in.(LIBERADO,INSPECIONADO)'), ('order', 'data_hora.asc')]),
        ]
        if start == '2026-10-01':
            cases.append(('produtividade-ultimos7', 'producao', [('select', PRODUCTION), ('data_fabricacao', 'gte.2026-09-24'), ('data_fabricacao', 'lte.2026-10-04'), ('status', 'in.(LIBERADO,INSPECIONADO)'), ('order', 'data_hora.asc')]))
        for name, table, params in cases:
            path = f'/rest/v1/{table}?{urlencode(params)}'
            source = get_pages(source_base, path, source_headers)
            test = get_pages('http://127.0.0.1:13052', path, test_headers)
            fixtures[f'{name}:{start}:{end}'] = {'path': path, 'official': source, 'test': test}
            official, copy = summarize(source, table), summarize(test, table)
            results.append({'case': name, 'period': [start, end], 'official': official, 'test': copy,
                            'ordered_equal': official['ordered_sha256'] == copy['ordered_sha256'],
                            'multiset_equal': official['multiset_sha256'] == copy['multiset_sha256']})
    for day in ('2026-10-01', '2026-10-03'):
        for sector in ('Setor 1', 'Setor 2', 'Setor 3', 'Setor 4'):
            params = [('select', PRODUCTION), ('setor', f'eq.{sector}'), ('data_fabricacao', f'eq.{day}')]
            path = f'/rest/v1/producao?{urlencode(params)}'
            source = get_pages(source_base, path, source_headers)
            test = get_pages('http://127.0.0.1:13052', path, test_headers)
            name = f'historico:{day}:{sector}'
            fixtures[name] = {'path': path, 'official': source, 'test': test}
            official, copy = summarize(source, 'producao'), summarize(test, 'producao')
            results.append({'case': name, 'official': official, 'test': copy,
                            'ordered_equal': official['ordered_sha256'] == copy['ordered_sha256'],
                            'multiset_equal': official['multiset_sha256'] == copy['multiset_sha256']})
    out = Path('/opt/concrefer-unificado/migration/other-dashboards-source-fixtures.json')
    fd = os.open(out, os.O_WRONLY | os.O_CREAT | os.O_TRUNC, 0o600)
    with os.fdopen(fd, 'w') as file:
        json.dump({'summaries': results, 'fixtures': fixtures}, file, ensure_ascii=False, separators=(',', ':'))
    ordered = fixtures['produtividade:2026-09-01:2026-10-04']['official']
    rank_path = Path('/opt/concrefer-unificado/migration/producao-productivity-order.json')
    rank_path.write_text(json.dumps({'period': ['2026-09-01', '2026-10-04'],
                                     'ids': [row['id'] for row in ordered]}, separators=(',', ':')))
    print(json.dumps(results, ensure_ascii=False))
    assert all(row['multiset_equal'] for row in results)


if __name__ == '__main__':
    main()

"""Render original Mapa with source snapshot and compare final dashboard output."""
from __future__ import annotations

import hashlib
import json
from pathlib import Path
from urllib.parse import parse_qs, urlsplit

from playwright.sync_api import sync_playwright
from operacao_smoke import CHROME, URL, credentials, login_operacao

ROOT = Path(__file__).resolve().parents[3]
BEFORE = ROOT / '.work-mapa-unificado/operacao/index-before-desktop.html'
ORIGINAL_APP = ROOT / 'mapa-concretagem/app.js'
FIXTURE = ROOT / '.work-mapa-unificado/other-dashboards-source-fixtures.json'
OUT = ROOT / '.work-mapa-unificado/e2e/dashboard-other-source-parity.json'
CASES = [('2026-10-01', '2026-10-04', ''), ('2026-10-01', '2026-10-04', 'Setor 1'),
         ('2026-10-01', '2026-10-04', 'Setor 2'), ('2026-10-01', '2026-10-04', 'Setor 3'),
         ('2026-10-01', '2026-10-04', 'Setor 4'), ('2026-09-01', '2026-10-04', ''),
         ('2026-09-24', '2026-10-03', '')]
MODES = [('MONTAGEM_INDICADORES', 'mi', 'carregarMontagemIndicadores'),
         ('PROD_ANALISE', 'pa', 'carregarProdutividadeConcretagem')]


def digest(value):
    return hashlib.sha256(json.dumps(value, ensure_ascii=False, sort_keys=True).encode()).hexdigest()


def main():
    fixtures = json.loads(FIXTURE.read_text(encoding='utf-8'))['fixtures']
    account = credentials()
    output = {}
    with sync_playwright() as pw:
        browser = pw.chromium.launch(headless=True, executable_path=CHROME)
        for variant in ('original-source', 'unificado-test'):
            context = browser.new_context(viewport={'width': 1024, 'height': 768}, service_workers='block')
            page = context.new_page()
            fulfilled = []
            login_operacao(page, account['MAPA_TEST_USER'], account['MAPA_TEST_PASSWORD'])
            if variant == 'original-source':
                page.route('**/unificado/mapa/operacao/app.js*', lambda route: route.fulfill(
                    status=200, content_type='application/javascript; charset=utf-8',
                    body=ORIGINAL_APP.read_text(encoding='utf-8')))
                page.route(URL, lambda route: route.fulfill(status=200, content_type='text/html; charset=utf-8', body=BEFORE.read_text(encoding='utf-8')))

                def serve_source(route):
                    request = route.request
                    url = urlsplit(request.url)
                    if request.method != 'GET' or '/rest/v1/' not in url.path:
                        route.continue_(); return
                    params = parse_qs(url.query)
                    table = url.path.rsplit('/', 1)[-1]
                    if table not in ('montagem_poste', 'producao'):
                        route.continue_(); return
                    start = next((x[4:] for x in params.get('data_fabricacao', []) if x.startswith('gte.')), None)
                    end = next((x[4:] for x in params.get('data_fabricacao', []) if x.startswith('lte.')), None)
                    if table == 'montagem_poste':
                        clause = params.get('or', [''])[0]
                        start, end = next(((a, b) for a, b, _ in CASES if a in clause and b in clause), (None, None))
                        name = 'montagem'
                    elif params.get('order', [''])[0].startswith('data_hora'):
                        name = 'produtividade-ultimos7' if start == '2026-09-24' and end == '2026-10-04' else 'produtividade'
                        if name == 'produtividade-ultimos7': start = '2026-10-01'
                    else:
                        name = 'montagem-producao'
                    item = fixtures.get(f'{name}:{start}:{end}')
                    if not item:
                        route.continue_(); return
                    rows = item['official']
                    offset = int(params.get('offset', ['0'])[0])
                    limit = int(params.get('limit', ['1000'])[0])
                    if request.headers.get('range'):
                        low, high = request.headers['range'].split('-')
                        offset, limit = int(low), int(high) - int(low) + 1
                    batch = rows[offset:offset + limit]
                    fulfilled.append({'name': name, 'period': [start, end], 'offset': offset, 'rows': len(batch)})
                    route.fulfill(status=206, content_type='application/json',
                                  headers={'content-range': f'{offset}-{offset+len(batch)-1}/{len(rows)}', 'access-control-expose-headers': 'content-range'},
                                  body=json.dumps(batch, ensure_ascii=False))

                page.route('**/unificado/mapa/api/rest/v1/**', serve_source)
                page.goto(URL, wait_until='domcontentloaded')
                page.wait_for_function("state.authUser?.role === 'GERENCIA'")
            cases = []
            for mode, prefix, function in MODES:
                page.evaluate('mode => setMode(mode)', mode)
                page.wait_for_timeout(700)
                for start, end, sector in CASES:
                    result = page.evaluate("""async ({prefix,fun,start,end,sector}) => {
                      document.getElementById(prefix+'DataInicio').value=start;
                      document.getElementById(prefix+'DataFim').value=end;
                      document.getElementById(prefix+'FiltroSetor').value=sector;
                      await window[fun]();
                      const root=document.getElementById(prefix==='mi'?'viewMontagemIndicadores':'viewProdAnalise');
                      const ids=prefix==='mi'?
                        ['miTotalProduzido','miTotalInspecionado','miAtingimentoPct','miProducaoDia','miTotalAprovados','miProdGeral','miMontGeral','miPctGeral','miTabelaTotal','miDefTotalErros']:
                        ['paKpiFormas','paKpiVolume','paKpiVolBomDia','paKpiVolForaDia','paKpiCicloMedio','paKpiEficiencia','paKpiParadas','paKpiDesvioPadrao','paKpiFormasHora','paKpiM3Hora','paKpiJornada'];
                      const rows=[...root.querySelectorAll(prefix==='mi'?'#miTabelaBody tr':'#paDadosTbody tr')].map(e=>e.innerText);
                      return {kpis:Object.fromEntries(ids.map(id=>[id,document.getElementById(id)?.innerText||''])),rows,visibleText:root.innerText};
                    }""", {'prefix': prefix, 'fun': function, 'start': start, 'end': end, 'sector': sector})
                    cases.append({'mode': mode, 'period': [start, end], 'sector': sector,
                                  'kpis': result['kpis'], 'row_count': len(result['rows']),
                                  'rows_hash': digest(result['rows']), 'rows': result['rows'],
                                  'text_hash': digest(result['visibleText'])})
            output[variant] = {'cases': cases, 'source_pages': fulfilled}
            context.close()
        browser.close()
    diffs = [{'case': a['mode'], 'period': a['period'], 'sector': a['sector'],
              'kpis_equal': a['kpis'] == b['kpis'], 'rows_equal': a['rows_hash'] == b['rows_hash'],
              'text_equal': a['text_hash'] == b['text_hash']}
             for a, b in zip(output['original-source']['cases'], output['unificado-test']['cases'])
             if (a['kpis'], a['rows_hash'], a['text_hash']) != (b['kpis'], b['rows_hash'], b['text_hash'])]
    output['differences'] = diffs
    OUT.write_text(json.dumps(output, ensure_ascii=False, indent=2), encoding='utf-8')
    print(json.dumps({'cases': len(output['original-source']['cases']), 'source_pages': len(output['original-source']['source_pages']), 'differences': diffs, 'output': str(OUT)}, ensure_ascii=False))
    assert not diffs


if __name__ == '__main__':
    main()

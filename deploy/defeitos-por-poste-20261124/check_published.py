"""Read-only browser acceptance; session stays in memory and is never logged."""
import json
from pathlib import Path
import subprocess
import re
from urllib.parse import quote

from playwright.sync_api import sync_playwright, expect

HERE = Path(__file__).resolve().parent
BASE = 'https://concrefer.concretrack.com.br'
code = """from app import connect,signer,COOKIE_NAME
import json
with connect() as c:
 u=c.execute("SELECT id,nome,perfil,updated_at FROM public.usuarios WHERE perfil='GERENCIA' AND ativo AND NOT primeiro_acesso AND deleted_at IS NULL ORDER BY id LIMIT 1").fetchone()
print(json.dumps({'cookie_name':COOKIE_NAME,'cookie':signer().dumps({'scope':'session','id':u['id'],'updated_at':u['updated_at'].isoformat()}),'id':u['id'],'name':u['nome'],'role':u['perfil']}))
"""
session = json.loads(subprocess.check_output(['ssh', 'vps-concrefer',
    "bash -lc 'set -a; . /etc/mapa-unificado/auth.env; cd /opt/concrefer-unificado/mapa-api; .venv/bin/python -'"],
    input=code, text=True, timeout=25))

with sync_playwright() as p:
    browser = p.chromium.launch()
    # A fresh worker can reload its iframe during installation and reset filters.
    # Exercise the live UI independently; deployed worker bytes are hash-checked.
    context = browser.new_context(viewport={'width': 1440, 'height': 1000}, service_workers='block')
    context.add_cookies([{'name': session['cookie_name'], 'value': session['cookie'],
        'domain': 'concrefer.concretrack.com.br', 'path': '/unificado/',
        'secure': True, 'httpOnly': True, 'sameSite': 'Lax'}])
    page = context.new_page()
    errors = []
    page.on('pageerror', lambda error: errors.append(str(error)))
    page.goto(BASE + '/unificado/login.html', wait_until='domcontentloaded')
    page.evaluate('(s)=>localStorage.setItem("pwa_mapa_auth_session_v1",JSON.stringify(s))',
        {'id': session['id'], 'name': session['name'], 'role': session['role']})
    page.evaluate("""()=>localStorage.setItem('mapa_dashboard_filtros_df_v1',JSON.stringify({
      DataInicio:'2026-11-01',DataFim:'2026-11-24',FiltroSetor:'',FiltroStatus:'',FiltroPesquisa:''
    }))""")
    page.goto(BASE + '/unificado/?view=' + quote('mapa/operacao/?tela=DASHBOARD_DEFEITOS', safe=''),
        wait_until='domcontentloaded')
    frame = page.frame_locator('#module-host iframe.is-active')
    frame.locator('#dfPieceAffected').wait_for(timeout=60000)
    expect(frame.locator('#dfPieceAffected')).to_contain_text('%', timeout=60000)
    frame.locator('[data-dashboard-presets="df"] [data-date-preset="month"]').click()
    expect(frame.locator('#dfDataInicio')).to_have_value('2026-11-01')
    # API and UI must agree on numerator and denominator.
    data = page.evaluate("""async()=>{
      const r=await fetch('/unificado/mapa/api/dashboard/defeitos/indicadores?inicio=2026-11-01&fim=2026-11-24',
        {headers:{'X-Unificado-Screen':'DASHBOARD_DEFEITOS'},cache:'no-store'});
      if(!r.ok)throw Error('API '+r.status);return r.json();
    }""")
    totals = {key: sum(row[key] for row in data['production_cohort'].values())
        for key in ['produced', 'inspected', 'affected', 'critical', 'noncritical_only']}
    expect(frame.locator('#dfPieceAffectedMeta')).to_have_text(re.compile('^' + str(totals['affected']) + ' de '), timeout=60000)
    expect(frame.locator('#dfPieceCriticalMeta')).to_have_text(re.compile('^' + str(totals['critical']) + ' de '), timeout=60000)
    values = {key: frame.locator('#' + key).inner_text() for key in
        ['dfPieceAffected', 'dfPieceCritical', 'dfPieceAffectedMeta', 'dfPieceCriticalMeta',
         'dfPieceCoverage', 'dfPieceBreakdown']}
    assert 'aguardando' in values['dfPieceCoverage'] and 'indispon' not in values['dfPieceCoverage']
    frame.locator('#dfPieceAffected').scroll_into_view_if_needed()
    page.screenshot(path=str(HERE / 'published-desktop.png'))
    frame.get_by_role('tab', name='Detalhes e indicadores adicionais', exact=True).click()
    with page.expect_download() as download:
        frame.locator('#dfBtnExportarCsv').click()
    download.value.save_as(str(HERE / 'published-export.csv'))
    csv = (HERE / 'published-export.csv').read_text(encoding='utf-8-sig')
    assert 'Postes com algum defeito / produzidos' in csv
    assert 'Postes com defeito crítico / produzidos' in csv
    frame.locator('#msgbox-overlay').get_by_role('button', name='OK', exact=True).click()
    frame.get_by_role('tab', name='Visão geral', exact=True).click()
    page.set_viewport_size({'width': 390, 'height': 844})
    frame.locator('#dfPieceAffected').scroll_into_view_if_needed()
    assert frame.locator('body').evaluate('(e)=>e.scrollWidth<=innerWidth')
    page.screenshot(path=str(HERE / 'published-mobile.png'))
    assert not errors, errors
    result = {'status': 'ok', 'viewports': [1440, 390], 'api_status': 200,
        'values': values, 'totals': totals, 'csv': True, 'javascript_errors': errors}
    (HERE / 'published-results.json').write_text(json.dumps(result, ensure_ascii=False, indent=2), encoding='utf-8')
    print(json.dumps(result, ensure_ascii=True))
    browser.close()

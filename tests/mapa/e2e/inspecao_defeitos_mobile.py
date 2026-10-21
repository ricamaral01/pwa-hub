"""Exercise defect entry, persistence, analysis, editing and mobile/tablet layout."""
from pathlib import Path
import os
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[3]
HTML_PATH = Path(os.environ.get("INSPECAO_HTML_PATH", ROOT / "mapa-concretagem/index.html"))
HTML = HTML_PATH.read_text(encoding="utf-8")
SECTION = HTML.split('<section id="viewInspecao"', 1)[1].split('<section id="viewInspecaoDetalhe"', 1)[0]
SECTION = '<section id="viewInspecao"' + SECTION.replace('class="card hidden"', 'class="card"', 1)
CHROME = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
STUB = """
const DEFEITO_ICONES = {A:'🕳️',C:'🫧',I:'⚡',O:'🪨',J:'💥',Q:'✂️',S:'📐',R:'🧱',E:'🔩',F:'🏷️',P:'🚨'};
window.__insDefTest = true;
const todayYmd = () => '2026-10-21';
window.fetch = async url => {
  const path = String(url);
  const rows = [
    {id:42,data_fabricacao:'2026-10-20',setor:'Setor 3',forma:'SC05',modelo:'9x200',status:'LIBERADO'},
    {id:43,data_fabricacao:'2026-10-20',setor:'Setor 4',forma:'F12',modelo:'11/300',status:'LIBERADO'}
  ];
  if (path.includes('/rest/v1/producao')) return {ok:true,json:async()=>rows.filter(r=>path.includes(encodeURIComponent(r.setor)) || path.includes(r.setor.replace(' ','+')))};
  if (path.includes('/pcp/saques-mandril')) return {ok:true,json:async()=>path.includes('2026-10-20')?[{data:'2026-10-20',codigo_forma:'SC05'}]:[]};
  throw Error(path);
};
let saved = [];
const supabaseClient = {from(table) {
  if(table !== 'inspecao_defeitos') throw Error(table);
  return {
    select() { return {order() { return {range() { return Promise.resolve({data:saved,error:null}); }}; }}; },
    insert(value) { saved.push({...value,id:'test-'+saved.length}); return Promise.resolve({error:null}); },
    update(value) { return {eq(_,id) { saved=saved.map(r=>r.id===id?{...r,...value}:r); return Promise.resolve({error:null}); }}; },
    delete() { return {eq(_,id) { saved=saved.filter(r=>r.id!==id); return Promise.resolve({error:null}); }}; }
  };
}};
"""

with sync_playwright() as pw:
    browser = pw.chromium.launch(headless=True, executable_path=CHROME)
    for width, height in [(320, 720), (390, 844), (768, 1024), (1024, 768)]:
        page = browser.new_page(viewport={"width": width, "height": height})
        errors = []
        page.on("pageerror", lambda error: errors.append(str(error)))
        page.set_content(f'<html><head><meta name="viewport" content="width=device-width,initial-scale=1"></head><body><main class="container">{SECTION}</main></body></html>')
        page.add_style_tag(path=str(ROOT / "mapa-concretagem/styles.css"))
        page.add_style_tag(path=str(ROOT / "mapa-concretagem/inspecao-defeitos.css"))
        page.add_script_tag(content=STUB)
        page.add_script_tag(path=str(ROOT / "mapa-concretagem/inspecao-defeitos.js"))
        if width in (390, 768):
            out = ROOT / ".work-mapa-unificado" / "e2e" / f"inspecao-defeitos-{width}.png"
            out.parent.mkdir(parents=True, exist_ok=True)
            page.screenshot(path=str(out), full_page=True)
        assert page.locator('.ins-def-row .ins-def-icon').count() == 17
        assert page.locator('[name="turno"]').count() == 0
        assert page.evaluate('document.documentElement.scrollWidth <= innerWidth'), f'overflow at {width}px'
        page.locator('[name="serie"]').fill(f'S3-{width}')
        page.locator('[name="forma_numero"]').select_option('SC05')
        assert page.locator('[name="tipo"]').input_value() == '9x200'
        page.locator('[data-code="D01"][data-region="Base"][data-step="1"]').click()
        assert page.locator('[name="classe"]:checked').input_value() == 'B'
        page.locator('#insDefSalvar').click()
        assert 'salva no banco' in page.locator('#insDefMessage').inner_text()
        page.locator('[data-ins-tab="analise"]').click()
        assert page.locator('#insDefKpis').inner_text().find('1') >= 0
        assert page.locator('#insDefParetoChart svg rect').count() == 1
        assert 'D01' in page.locator('#insDefHeat').inner_text()
        page.locator('[data-ins-tab="postes"]').click()
        assert page.locator('.ins-def-list-item').count() == 1
        page.locator('[data-edit]').click()
        assert page.locator('[name="serie"]').input_value() == f'S3-{width}'
        assert page.locator('[data-code="D01"][data-region="Base"][data-step="1"]').locator('..').locator('output').inner_text() == '1'
        page.locator('[name="observacoes"]').fill('Reparo registrado')
        page.locator('#insDefSalvar').click()
        page.locator('[data-ins-tab="postes"]').click()
        assert page.evaluate('saved.length') == 1
        assert page.evaluate('saved[0].observacoes') == 'Reparo registrado'
        assert page.evaluate('saved[0].producao_record_id') == '42'
        assert page.evaluate('saved[0].turno === undefined')
        page.locator('[data-delete]').click()
        page.locator('[data-delete]').click()
        assert page.evaluate('saved.length') == 0
        assert not errors, errors
        page.close()
    browser.close()

"""Prove the new audit detects regressions and mobile filter controls still work."""
import json
from pathlib import Path
from playwright.sync_api import sync_playwright
R=Path(__file__).resolve().parents[2]
O=R/'docs/revisao-visual-unificado/homolog/revisao-final'
with sync_playwright() as pw:
    browser=pw.chromium.launch(channel='msedge',headless=True)
    page=browser.new_page(viewport={'width':390,'height':844})
    page.set_content('''<style>*{font-family:Geist}table{table-layout:fixed;width:20px}th{width:10px;overflow:hidden;white-space:nowrap}.card{border:1px solid black}</style>
    <strong class="nav-mobile-title">Fornecedores</strong><h1>Fornecedores</h1>
    <h2>Mapeamento cobli</h2><p>2 dia(s) -- m3</p><button style="background:rgb(249,115,22)">Buscar</button>
    <div class="nav-tree"><nav><a class="nav-item" style="display:flex;gap:8px"><span style="width:16px;display:inline-block">☆</span><span class="nav-item-label">Com ícone</span></a><a class="nav-item" style="display:flex"><span class="nav-item-label">Sem ícone</span></a></nav></div>
    <div style="background:orange;width:32px;height:32px"><svg width="20" height="20"><path d="M0 0h20v20H0z"/></svg></div><h2>Resumo</h2>
    <section class="card"><div class="native-cards"><article class="card">Dados</article></div></section>
    <table style="margin-top:900px"><thead><tr><th>Volume de produção</th></tr></thead><tbody><tr><td>12</td></tr></tbody></table>''')
    result=page.evaluate((R/'tests/unificado/review_dom_audit.js').read_text(encoding='utf-8'))
    types={issue['type'] for issue in result['issues']}
    expected={'interface_text','button_palette','clipped_table_heading','proper_name_case','duplicate_title','nested_surface','mobile_data_below_fold','menu_alignment','decorative_title_icon'}
    assert expected<=types,(expected-types,result)
    page.set_content('<strong class="nav-mobile-title">Materiais</strong><div id="native-host"></div>')
    page.evaluate("()=>{const root=document.querySelector('#native-host').attachShadow({mode:'open'});root.innerHTML='<h1>Materiais</h1><button style=\"background:rgb(249,115,22)\">Buscar</button>'}")
    shadow_result=page.evaluate((R/'tests/unificado/review_dom_audit.js').read_text(encoding='utf-8'))
    assert shadow_result['shadow_roots']==1
    assert {'duplicate_title','button_palette'}<={issue['type'] for issue in shadow_result['issues']}
    page.set_content('<style>*{font-family:Geist}table{margin-top:900px}</style><input type="date" value="2026-11-19"><table><tbody><tr><td>Real record</td></tr></tbody></table>')
    assert any(i['type']=='mobile_data_below_fold' for i in page.evaluate((R/'tests/unificado/review_dom_audit.js').read_text(encoding='utf-8'))['issues'])
    page.evaluate("()=>{const value=document.createElement('strong');value.className='noro-card-value';value.textContent='57';document.body.prepend(value)}")
    assert not any(i['type']=='mobile_data_below_fold' for i in page.evaluate((R/'tests/unificado/review_dom_audit.js').read_text(encoding='utf-8'))['issues'])
    page.set_content('<style>*{font-family:Geist}.card,.field-wrapper{border:1px solid black}</style><section class="card"><div class="field-wrapper"><input aria-label="Search"></div></section>')
    assert not any(i['type']=='nested_surface' for i in page.evaluate((R/'tests/unificado/review_dom_audit.js').read_text(encoding='utf-8'))['issues'])
    page.evaluate("document.querySelector('.field-wrapper').append(document.createElement('input'))")
    assert any(i['type']=='nested_surface' for i in page.evaluate((R/'tests/unificado/review_dom_audit.js').read_text(encoding='utf-8'))['issues'])
    context=browser.new_context(viewport={'width':390,'height':844})
    html='''<body><style>.review-duplicate-title{display:none}@media(min-width:601px){.nav-mobile-title{display:none}}</style><strong class="nav-mobile-title">Tela aberta</strong><h1 id="page-title">Tela aberta</h1><div class="content-area"><div class="section-card"><label>Início<input id="f-inicio" value="2026-11-19"></label><button id="search">Buscar</button></div><table><tbody><tr><td>Primeiro dado</td></tr></tbody></table></div><script>window.searchCount=0;document.getElementById('search').onclick=()=>window.searchCount++;</script></body>'''
    context.route('**/*',lambda route:route.fulfill(body=html,content_type='text/html'))
    page=context.new_page();page.goto('http://127.0.0.1:8999/unificado/pcp/programacao-final/')
    page.add_script_tag(content=(R/'unificado/shell/components.js').read_text(encoding='utf-8'))
    page.wait_for_timeout(150)
    assert not page.locator('#page-title').is_visible()
    details=page.locator('.review-filter-details');assert details.count()==1
    assert not details.evaluate('el=>el.open')
    assert details.locator('summary').inner_text()=='Filtrar (1)'
    details.locator('summary').click();page.locator('#search').click()
    assert page.evaluate('window.searchCount')==1
    page.set_viewport_size({'width':390,'height':600});page.wait_for_timeout(100)
    assert details.evaluate('el=>el.open'),'Keyboard-height changes must preserve the expanded filters'
    page.locator('#f-inicio').fill('');assert details.locator('summary').inner_text()=='Filtrar'
    page.set_viewport_size({'width':1440,'height':900});page.wait_for_timeout(100)
    assert details.evaluate('el=>el.open')
    assert page.locator('#page-title').is_visible()
    page.evaluate("()=>{const data=document.createElement('p');data.dataset.reviewData='';data.id='saved-data';data.textContent='1 postes -- m3 · Solicitação(s)';document.querySelector('h1').after(data)}")
    page.wait_for_timeout(100)
    assert page.locator('#saved-data').is_visible()
    assert page.locator('#saved-data').inner_text()=='1 postes -- m3 · Solicitação(s)'
    page.evaluate("()=>{const label=document.createElement('span');label.id='live-plural';label.textContent='1 pessoa(s)';document.body.append(label)}")
    page.wait_for_timeout(100);assert page.locator('#live-plural').inner_text()=='1 pessoa'
    page.evaluate("document.getElementById('live-plural').firstChild.data='2 pessoa(s)'")
    page.wait_for_timeout(100);assert page.locator('#live-plural').inner_text()=='2 pessoas'
    page.evaluate("dispatchEvent(new Event('beforeprint'))")
    assert page.locator('#live-plural').inner_text()=='2 pessoa(s)'
    page.evaluate("dispatchEvent(new Event('afterprint'))")
    page.wait_for_timeout(100);assert page.locator('#live-plural').inner_text()=='2 pessoas'
    context.close()
    print_page=browser.new_page()
    print_page.set_content('<h1 class="print-source-title" data-review-data>Original subject</h1><h1 class="screen-page-title">RNC</h1><p class="record-title" data-review-data>Original subject</p>')
    print_page.add_style_tag(content=(R/'unificado/shell/review-complete.css').read_text(encoding='utf-8'))
    assert not print_page.locator('.print-source-title').is_visible()
    assert print_page.locator('.screen-page-title').is_visible()
    assert print_page.locator('.record-title').is_visible()
    print_page.emulate_media(media='print')
    assert print_page.locator('.print-source-title').is_visible()
    assert not print_page.locator('.screen-page-title').is_visible()
    assert not print_page.locator('.record-title').is_visible()
    print_page.close()
    for path,markup in [
        ('usinas/relatorios/iqt/', '<form class="filters"><input id="native-filter" value="Campinas"><button type="submit">Buscar</button></form>'),
        ('usinas/?area=cec&app=relatorio', '<form class="cec-filters"><input id="native-filter" value="Campinas"><button type="submit">Buscar</button></form>'),
        ('suprimentos/fornecedores/', '<div class="sup-buy-filters"><input id="native-filter" value="Campinas"><button>Filtrar</button></div>'),
        ('mapa/operacao/', '<section id="viewMontagemPostes"><div class="grid"><input id="mpFiltroData" value="2026-11-19"><input id="native-filter" value="Campinas"></div></section>')
    ]:
        native=browser.new_context(viewport={'width':390,'height':844})
        native.route('**/*',lambda route:route.fulfill(body=markup,content_type='text/html'))
        test_page=native.new_page();test_page.goto('http://127.0.0.1:8999/unificado/'+path)
        test_page.evaluate("window.originalFilter=document.getElementById('native-filter')")
        test_page.add_script_tag(content=(R/'unificado/shell/components.js').read_text(encoding='utf-8'))
        test_page.wait_for_timeout(100)
        assert test_page.locator('.review-filter-details').count()==1
        assert not test_page.locator('.review-filter-details').evaluate('e=>e.open')
        assert test_page.evaluate("window.originalFilter===document.getElementById('native-filter')")
        test_page.locator('summary').click();test_page.locator('#native-filter').fill('')
        assert test_page.locator('summary').inner_text()==('Filtrar (1)' if 'mapa/operacao/' in path else 'Filtrar')
        native.close()
    shadow_context=browser.new_context(viewport={'width':390,'height':844})
    shadow_context.route('**/*',lambda route:route.fulfill(body='<strong class="nav-mobile-title">Materiais</strong><div id="shadow-host"></div>',content_type='text/html'))
    shadow_context.route('**/review-complete.css*',lambda route:route.fulfill(path=str(R/'unificado/shell/review-complete.css')))
    shadow_page=shadow_context.new_page();shadow_page.goto('http://127.0.0.1:8999/unificado/?view=laboratorio%2Fdosagem%2F')
    shadow_page.evaluate("()=>{const root=document.querySelector('#shadow-host').attachShadow({mode:'open'});root.innerHTML='<h1>Materiais</h1><div class=\"ct-card\"><label>Buscar<input id=\"shadow-input\"></label><button id=\"shadow-search\">Buscar</button></div>';window.savedShadowInput=root.querySelector('input');window.savedShadowParent=savedShadowInput.parentElement;window.shadowSearches=0;root.querySelector('#shadow-search').onclick=()=>window.shadowSearches++}")
    shadow_page.add_script_tag(content=(R/'unificado/shell/components.js').read_text(encoding='utf-8'))
    shadow_page.locator('.review-shadow-filter-toggle').wait_for()
    assert not shadow_page.locator('#shadow-host h1').is_visible()
    assert not shadow_page.locator('#shadow-input').is_visible()
    shadow_page.locator('.review-shadow-filter-toggle').click()
    shadow_page.locator('#shadow-input').fill('Material')
    assert shadow_page.locator('.review-shadow-filter-toggle').inner_text()=='Filtrar (1)'
    shadow_page.locator('#shadow-search').click();assert shadow_page.evaluate('window.shadowSearches')==1
    assert shadow_page.evaluate("window.savedShadowInput===document.querySelector('#shadow-host').shadowRoot.querySelector('input')&&window.savedShadowParent===window.savedShadowInput.parentElement")
    shadow_page.emulate_media(media='print')
    assert not shadow_page.locator('.review-shadow-filter-toggle').is_visible()
    assert shadow_page.locator('#shadow-host h1').is_visible()
    shadow_context.close()
    browser.close()
out={'audit_regressions_detected':sorted(expected),'shadow_dom_audit_and_presentation':True,'shadow_filter_input_parent_and_handler_preserved':True,'filter_input_nodes_preserved':True,'filter_button_handler_preserved':True,'active_count_updates':True,'desktop_filters_open':True,'dynamic_text_prints_latest_original_value':True,'first_data_separates_filter_defaults_from_actual_values':True}
(O/'dom-tests.json').write_text(json.dumps(out,indent=2))
print(json.dumps(out))

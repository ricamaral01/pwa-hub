"""Verify and capture the published Mapa-based production TV."""
import json
from pathlib import Path

from playwright.sync_api import sync_playwright

base = 'https://concrefer.concretrack.com.br'
out = Path(__file__).resolve().parents[2] / 'docs/painel-tv/evidencias'
out.mkdir(parents=True, exist_ok=True)
with sync_playwright() as playwright:
    browser = playwright.chromium.launch(headless=True)
    context = browser.new_context(ignore_https_errors=True,
                                  viewport={'width': 1920, 'height': 1080})
    login = context.request.post(base + '/unificado/mapa/api/unified/login',
                                 data={'username': 'tv', 'password': 'tv'})
    assert login.status == 200, login.status
    page = context.new_page()
    errors = []
    page.on('pageerror', lambda error: errors.append(str(error)))
    response = page.goto(base + '/unificado/tv/formas/?unidade=campinas&data=2026-10-16',
                         wait_until='domcontentloaded', timeout=30000)
    page.wait_for_function("document.querySelectorAll('.setor').length === 4", timeout=30000)
    assert response.status == 200
    assert page.locator('.setor').nth(3).locator('.f.real').count() == 52
    assert '234' in page.locator('#kpis').inner_text()
    page.screenshot(path=str(out / 'campinas-16-10-visao-geral-producao.png'))
    page.get_by_role('button', name='Setor 4').click()
    page.wait_for_function("document.querySelector('.det') !== null")
    page.wait_for_timeout(450)
    detail = page.locator('.det').inner_text()
    for text in ('Realizado Mapa 52', 'Planilha 42', 'diferença +10',
                 'Conciliadas 9', '43 fora da programação'):
        assert text in detail, text
    page.screenshot(path=str(out / 'campinas-16-10-setor4-producao.png'))
    assert not errors, errors
    print(json.dumps({'page': response.status, 'mapa_s4': 52, 'planilha_s4': 42,
                      'conciliadas_s4': 9, 'page_errors': errors}, ensure_ascii=False))
    browser.close()

"""Capture the isolated Campinas TV diagnostic without touching production."""
from pathlib import Path
import sys

from playwright.sync_api import sync_playwright

sys.path.insert(0, str(Path(__file__).resolve().parent))
from homolog_session import test_cookies

base = 'https://concrefer.concretrack.com.br:18446'
out = Path(__file__).resolve().parents[2] / 'docs/painel-tv/evidencias'
out.mkdir(parents=True, exist_ok=True)
cookies = test_cookies()
with sync_playwright() as playwright:
    browser = playwright.chromium.launch(headless=True)
    context = browser.new_context(viewport={'width': 1920, 'height': 1080},
                                  device_scale_factor=1, ignore_https_errors=True)
    context.add_cookies([{'name': 'mapa_unificado_homolog_session', 'value': cookies['ricardo'],
                          'domain': 'concrefer.concretrack.com.br', 'path': '/unificado/',
                          'httpOnly': True, 'secure': True, 'sameSite': 'Lax'}])
    page = context.new_page()
    response = page.goto(base + '/unificado/tv/formas/?unidade=campinas&data=2026-10-16',
                         wait_until='domcontentloaded', timeout=30000)
    page.wait_for_function("document.querySelectorAll('.setor').length === 4", timeout=30000)
    assert response.status == 200
    assert page.locator('.setor').nth(3).locator('.f.real').count() == 52
    page.screenshot(path=str(out / 'campinas-16-10-visao-geral-teste.png'))
    page.get_by_role('button', name='Setor 4').click()
    page.wait_for_function("document.querySelector('.det') !== null")
    page.wait_for_timeout(450)
    page.screenshot(path=str(out / 'campinas-16-10-setor4-teste.png'))
    detail = page.locator('.det').inner_text()
    assert 'Realizado Mapa 52' in detail
    assert '43 fora da programação' in detail
    assert 'Planilha 42' in detail
    assert 'diferença +10' in detail
    assert 'Conciliadas 9' in detail
    print('test TV 200; S4 shows Mapa 52, planilha 42, 9 reconciled; screenshots saved')
    browser.close()

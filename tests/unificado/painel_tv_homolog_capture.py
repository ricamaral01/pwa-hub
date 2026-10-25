"""Capture the isolated TV prototype with short-lived in-memory test credentials."""

from pathlib import Path
import json
import sys

from playwright.sync_api import sync_playwright

sys.path.insert(0, str(Path(__file__).resolve().parent))
from homolog_session import test_cookies


BASE = "https://concrefer.concretrack.com.br:18446"
OUT = Path(__file__).resolve().parents[2] / "docs/painel-tv/evidencias"
OUT.mkdir(parents=True, exist_ok=True)
cookies = test_cookies()

with sync_playwright() as playwright:
    browser = playwright.chromium.launch(headless=True)
    context = browser.new_context(viewport={"width": 1920, "height": 1080},
                                  device_scale_factor=1, ignore_https_errors=True)
    context.add_cookies([{"name": "mapa_unificado_homolog_session", "value": cookies["ricardo"],
                          "domain": "concrefer.concretrack.com.br", "path": "/unificado/",
                          "httpOnly": True, "secure": True, "sameSite": "Lax"}])
    page = context.new_page()
    errors = []
    page.on("pageerror", lambda error: errors.append(str(error)))
    response = page.goto(BASE + "/unificado/tv/formas/?unidade=pederneiras&data=2026-10-15",
                         wait_until="domcontentloaded", timeout=30000)
    page.wait_for_function("document.querySelectorAll('.setor').length === 4", timeout=30000)
    page.screenshot(path=str(OUT / "visao-geral-1920x1080.png"), full_page=False)
    overview = page.locator("#kpis").inner_text()
    page.get_by_role("button", name="Setor 1").click()
    page.wait_for_function("document.querySelector('.det') !== null")
    page.wait_for_timeout(450)
    page.screenshot(path=str(OUT / "setor-1-1920x1080.png"), full_page=False)
    detail_rows = page.locator('.tipo').count()
    page.route('**/painel-tv/api/resumo?*', lambda route: route.fulfill(status=503, body='{}'))
    page.reload(wait_until='domcontentloaded')
    page.locator('#tv-alert').wait_for(state='visible')
    offline_kpis = page.locator('#kpis').inner_text()
    assert '123' in offline_kpis and '86' in offline_kpis
    print(json.dumps({"page_status": response.status, "overview": overview,
                      "detail_rows": detail_rows,
                      "offline_banner": page.locator('#tv-alert').inner_text(),
                      "offline_kept_data": '123' in offline_kpis,
                      "page_errors": errors}, ensure_ascii=False))
    browser.close()

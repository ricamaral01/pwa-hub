"""Capture public ERP stock layouts with only auth/me simulated; no stock data."""

import json
from pathlib import Path
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / 'docs' / 'porting' / 'usinas' / 'estoque' / 'capturas'
BASE = 'https://dautomacao.com/concretrack/estoque/'
PAGES = {
    'inicio': '',
    'entrada': 'entrada/',
    'saldo': 'saldo/',
    'relatorio': 'relatorio/',
    'consumo-agregados': 'consumo/',
    'consumo-cimento': 'consumo-cimento/',
    'mapeamento-caixas': 'mapeamento-agregados/',
    'acerto': 'acerto/',
}
MOCK_USER = {
    'id': 'documentacao', 'name': 'Documentação', 'username': 'documentacao',
    'role': 'admin', 'role_label': 'Administrador', 'permissions': [
        'estoque', 'estoque.read', 'estoque.write', 'admin', 'gerente', 'pcp'
    ],
    'must_change_password': False,
}


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(headless=True)
        context = browser.new_context(viewport={'width': 1440, 'height': 900},
                                      device_scale_factor=1, locale='pt-BR')
        context.route('**/concretrack/api/auth/me', lambda route: route.fulfill(
            status=200, content_type='application/json', body=json.dumps(MOCK_USER)))
        for name, path in PAGES.items():
            page = context.new_page()
            response = page.goto(BASE + path, wait_until='domcontentloaded', timeout=30000)
            page.wait_for_timeout(1200)
            if not response or response.status != 200:
                raise RuntimeError(f'{name}: HTTP {response.status if response else "none"}')
            if '/login.html' in page.url:
                raise RuntimeError(f'{name}: unexpected login redirect')
            page.screenshot(path=str(OUT / f'{name}.png'), full_page=True)
            print(f'{name}: {page.title()}')
            page.close()
        browser.close()


if __name__ == '__main__':
    main()

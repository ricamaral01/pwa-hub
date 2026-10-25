"""Regression for the sample-only prototype shown in the Android recording."""
from pathlib import Path
import os
from playwright.sync_api import expect, sync_playwright


PAGE = os.environ.get('MAODEOBRA_PROTOTYPE_URL') or (Path(__file__).resolve().parents[2] /
    'unificado/m/maodeobra/prototipo/index.html').as_uri()


with sync_playwright() as pw:
    browser = pw.chromium.launch(headless=True)
    context = browser.new_context(viewport={'width': 392, 'height': 850},
        is_mobile=True, has_touch=True, device_scale_factor=3)
    page = context.new_page()
    page.goto(PAGE)
    expect(page.locator('.prototype-note')).to_contain_text('sem envio')
    assert page.locator('.prototype-note a').get_attribute('href') == '/unificado/?view=pcp%2Fmaodeobra%2F'
    for group in ('12', '34'):
        page.locator(f'[data-group="{group}"]').tap()
        cards = page.locator('.activity-card')
        card = cards.last
        field = card.locator('input')
        plus = card.locator('[data-step="0.5"]')
        field.evaluate("el => el.dataset.sameNode = 'yes'")
        scroll = page.locator('.scroll')
        plus.tap()
        before_scroll = scroll.evaluate('el => el.scrollTop')
        before_total = page.locator('[data-proto-total="all"]').inner_text()
        plus.tap()
        expect(field).to_have_attribute('data-same-node', 'yes')
        assert scroll.evaluate('el => el.scrollTop') == before_scroll, group
        assert page.locator('[data-proto-total="all"]').inner_text() != before_total, group
        assert page.url == PAGE
        field.fill('2,5')
        expect(field).to_have_attribute('data-same-node', 'yes')
    print('Protótipo: S1/S2 e S3/S4 sem recriar campos, perder rolagem ou navegar.')
    context.close()
    browser.close()

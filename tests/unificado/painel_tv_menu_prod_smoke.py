"""Check the production shell opens the permitted TV screen in a new tab."""
from playwright.sync_api import sync_playwright
from ged_sso_published_smoke import BASE, CHROME, context_for

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True, executable_path=CHROME)
    context, page = context_for(browser, 'user-ricardo')
    page.goto(BASE + '/unificado/', wait_until='domcontentloaded', timeout=20000)
    page.locator('#sidebar-model-a .sb').wait_for(state='visible', timeout=20000)
    page.locator('#sidebar-model-a .sb-switcher-btn').click()
    page.get_by_role('menuitemradio', name='Produção').click()
    link = page.locator('#sidebar-model-a a[href*="tv%2Fformas%2F"]')
    link.wait_for(state='visible', timeout=12000)
    with page.expect_popup(timeout=12000) as popup:
        link.click()
    opened = popup.value
    opened.wait_for_url('**/unificado/tv/formas/', timeout=12000)
    opened.locator('.setor').first.wait_for(timeout=12000)
    print('TV menu visible; new full-screen tab:', opened.url)
    context.close()
    context, page = context_for(browser, 'e2e-gerencia-probe')
    page.goto(BASE + '/unificado/', wait_until='domcontentloaded', timeout=20000)
    page.locator('#sidebar-model-a .sb').wait_for(state='visible', timeout=20000)
    page.wait_for_function("!document.body.classList.contains('unificado-permissions-loading')",
                           timeout=20000)
    assert page.locator('#sidebar-model-a a[href*="tv%2Fformas%2F"]').count() == 0
    print('TV menu hidden without explicit grant')
    context.close()
    browser.close()

"""Read-only homologation viewport matrix for the final acceptance report."""
from __future__ import annotations

from cronoanalise_homolog_functional import BASE, ROOT, context, open_route
from playwright.sync_api import sync_playwright

OUT = ROOT / 'docs/porting/cronoanalise/capturas-T7'
ROUTES = ('inicio', 'coletar', 'medicoes', 'dimensionar', 'simular', 'metodologia')
SIZES = (('pc', 1440, 900), ('tablet', 1194, 834), ('celular', 390, 844))


def main() -> None:
    OUT.mkdir(exist_ok=True)
    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(headless=True)
        for name, width, height in SIZES:
            ctx = context(browser, 'user-ricardo', width, height)
            for route in ROUTES:
                if route == 'inicio':
                    page = ctx.new_page()
                    page.goto(BASE + '/unificado/login.html', wait_until='domcontentloaded')
                    page.evaluate("localStorage.setItem('pwa_mapa_auth_session_v1', JSON.stringify({id:'user-ricardo',role:'GERENCIA',name:'Ricardo'}))")
                    page.goto(BASE + '/unificado/?view=laboratorio%2Fcronoanalise', wait_until='domcontentloaded')
                    page.wait_for_function("document.querySelector('#module-host iframe.is-active') !== null", timeout=30000)
                    frame = page.frame_locator('#module-host iframe.is-active')
                    frame.locator('.cr-app').wait_for(timeout=30000)
                else:
                    page, frame = open_route(ctx, route, 'user-ricardo')
                if route == 'coletar':
                    frame.locator('.cr-activity').first.wait_for(timeout=30000)
                elif route == 'medicoes':
                    frame.locator('.cr-table-scroll').wait_for(timeout=30000)
                elif route == 'metodologia':
                    frame.frame_locator('iframe.cr-method').get_by_text('Regras do estudo').first.wait_for(timeout=30000)
                else:
                    frame.locator('.cr-page').first.wait_for(timeout=30000)
                outer = page.evaluate('document.documentElement.scrollWidth - document.documentElement.clientWidth')
                inner = frame.locator('html').evaluate('el => el.scrollWidth - el.clientWidth')
                assert outer <= 1 and inner <= 1, (name, route, outer, inner)
                page.screenshot(path=str(OUT / f'{name}-{route}.png'))
                print('WIDTH_OK', name, width, height, route, 'outer=', outer, 'inner=', inner)
                page.close()
            ctx.close()
        browser.close()


if __name__ == '__main__':
    main()

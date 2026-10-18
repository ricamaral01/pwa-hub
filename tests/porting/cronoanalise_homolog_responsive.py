"""Tablet/mobile screenshots, dimension result and six-policy worker timing."""
from __future__ import annotations

import time

from cronoanalise_homolog_functional import OUT, context, open_route
from playwright.sync_api import sync_playwright


def no_page_overflow(page):
    return page.evaluate('document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1')


def no_app_overflow(frame):
    return frame.locator('html').evaluate('el => el.scrollWidth <= el.clientWidth + 1')


def main():
    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(headless=True)
        for name, width, height in [('tablet', 1194, 834), ('celular', 390, 844)]:
            ctx = context(browser, 'user-ricardo', width, height)
            for route in ('coletar', 'medicoes', 'simular'):
                page, frame = open_route(ctx, route, 'user-ricardo')
                frame.get_by_role('heading', name={'coletar': 'Contexto da medição',
                    'medicoes': 'Medições', 'simular': 'Simular'}[route]).wait_for(timeout=30000)
                assert no_page_overflow(page) and no_app_overflow(frame), (name, route)
                page.screenshot(path=str(OUT / f'{name}-{route}.png'))
                print('RESPONSIVE_OK', name, width, height, route, 'overflow=0')
                page.close()
            ctx.close()

        ctx = context(browser, 'user-ricardo')
        page, frame = open_route(ctx, 'dimensionar', 'user-ricardo')
        frame.get_by_role('button', name='Calcular dimensionamento').click()
        frame.locator('.cr-highlight').wait_for(timeout=30000)
        warning = frame.get_by_text('Estimativa: há atividades sem amostra suficiente.')
        warning.wait_for(timeout=30000)
        team = frame.locator('.cr-highlight strong').inner_text()
        frame.locator('html').evaluate('el => el.ownerDocument.defaultView.scrollTo(0, 0)')
        page.evaluate('window.scrollTo(0, 0)')
        page.screenshot(path=str(OUT / 'funcional-dimensionar-estimativa.png'))
        print('DIMENSION_OK equipe=' + team + ' warning=estimativa')
        page.close()

        page, frame = open_route(ctx, 'simular', 'user-ricardo')
        frame.get_by_role('button', name='Sequências', exact=True).click()
        frame.get_by_label('Replicações').fill('10')
        start = time.perf_counter()
        frame.get_by_role('button', name='Comparar 6 sequências').click()
        for _ in range(30):
            if frame.locator('.cr-card').count() > 1:
                break
            time.sleep(1)
        result = frame.locator('.cr-card').last
        rows = result.locator('tbody tr').count()
        if rows != 6:
            page.screenshot(path=str(OUT / 'debug-sim-responsive.png'))
            print('SIMULATION_DIAGNOSTIC', frame.locator('.cr-progress').all_inner_texts(),
                  frame.locator('.cr-notice').all_inner_texts(), frame.locator('.cr-error').all_inner_texts(),
                  frame.locator('.cr-card').count())
        assert rows == 6, rows
        elapsed = time.perf_counter() - start
        page.screenshot(path=str(OUT / 'funcional-simular-6-sequencias.png'))
        print(f'SIMULATION_OK sequences={rows} replications=10 elapsed_s={elapsed:.3f}')
        ctx.close(); browser.close()


if __name__ == '__main__':
    main()

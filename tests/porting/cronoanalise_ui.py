"""Browser smoke for the isolated Cronoanálise Vite app using only versioned seeds."""
from __future__ import annotations

import json
from pathlib import Path
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[2]
CRONO = ROOT / 'docs/porting/cronoanalise'
SEEDS = CRONO / 'especificacao/seeds'
OUTPUT = CRONO / 'capturas-T5'
URL = 'http://127.0.0.1:5175/unificado/laboratorio/cronoanalise/'


def seed(name):
    return json.loads((SEEDS / name).read_text(encoding='utf-8'))


def main():
    OUTPUT.mkdir(exist_ok=True)
    activities = [{**item, 'ativo': True} for item in seed('catalogo.json')['atividades']]
    params = seed('parametros.json')
    layout = seed('layout_setores.json')
    stats = {item['codigo']: {'n': 0, 'n_necessario': 10} for item in activities}
    times = {item['codigo']: {'media': item['estimativa_min'], 'cv': 0.3,
                              'fonte': 'estimativa', 'n': 0, 'por_setor': {}}
             for item in activities}
    responses = {
        'atividades': activities,
        'estatisticas': stats,
        'medicoes': {'medicoes': [], 'proximo_cursor': None},
        'dimensionamento/parametros': params['dimensionamento'],
        'simulacao/config': params['simulacao_base'],
        'simulacao/layout': layout,
        'simulacao/tempos': times,
        'simulacoes': [],
    }
    errors = []
    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(headless=True)
        for width, height, label in [(1440, 900, 'desktop'), (1194, 834, 'tablet'),
                                     (390, 844, 'celular')]:
            context = browser.new_context(viewport={'width': width, 'height': height})
            page = context.new_page()
            page.on('pageerror', lambda error: errors.append(str(error)))

            def respond(route):
                path = route.request.url.split('/api/laboratorio/cronoanalise/', 1)[-1].split('?', 1)[0]
                if path in responses:
                    route.fulfill(json=responses[path], headers={'Cache-Control': 'no-store'})
                elif path == 'medicoes/lote':
                    body = route.request.post_data_json or {}
                    route.fulfill(json={'gravadas': [item['id'] for item in body.get('medicoes', [])],
                                        'ja_existiam': [], 'rejeitadas': []})
                else:
                    route.fulfill(status=404, json={'mensagem': f'Rota mock não definida: {path}'})

            page.route('**/api/laboratorio/cronoanalise/**', respond)
            page.goto(URL + 'cronoanalise.html')
            page.get_by_role('heading', name='Cronoanálise').wait_for()
            page.screenshot(path=str(OUTPUT / f'inicio-{label}.png'), full_page=True)
            page.get_by_role('button', name='Coletar', exact=False).first.click()
            page.get_by_role('heading', name='Contexto da medição').wait_for()
            page.screenshot(path=str(OUTPUT / f'coletar-{label}.png'), full_page=True)
            assert page.locator('body').evaluate('(el) => el.scrollWidth <= innerWidth + 1'), label
            if label in {'desktop', 'celular'}:
                page.goto(URL + 'cronoanalise.html')
                page.get_by_role('button', name='Simular', exact=False).first.click()
                page.get_by_role('heading', name='Simular').wait_for()
                page.screenshot(path=str(OUTPUT / f'simular-{label}.png'), full_page=True)
                assert page.locator('body').evaluate('(el) => el.scrollWidth <= innerWidth + 1'), label
                if label == 'desktop':
                    page.locator('.cr-small-input').fill('2')
                    page.get_by_role('button', name='Rodar cenário').click()
                    page.get_by_role('heading', name='Resumo de produção').wait_for(timeout=30000)
                    page.screenshot(path=str(OUTPUT / 'simular-resultado-desktop.png'), full_page=True)
                    print('SIMULATION_WORKER_OK')
                page.goto(URL + 'cronoanalise.html')
                page.get_by_role('button', name='Dimensionar', exact=False).first.click()
                page.get_by_role('heading', name='Parâmetros').wait_for()
                page.screenshot(path=str(OUTPUT / f'dimensionar-{label}.png'), full_page=True)
                assert page.locator('body').evaluate('(el) => el.scrollWidth <= innerWidth + 1'), label
                page.goto(URL + 'cronoanalise.html')
                page.get_by_role('button', name='Coletar', exact=False).first.click()
            if label == 'desktop':
                for path, heading in [('medicoes', 'Medições'), ('catalogo', 'Catálogo de atividades'),
                                      ('metodologia', 'Regras do estudo')]:
                    page.evaluate("path => { history.pushState({}, '', '/unificado/laboratorio/cronoanalise/' + path); dispatchEvent(new PopStateEvent('popstate')); }", path)
                    if path == 'metodologia':
                        page.frame_locator('.cr-method').get_by_role('heading', name=heading).wait_for()
                    else:
                        page.get_by_role('heading', name=heading).wait_for()
                print('SEVEN_SCREENS_OK')
            if label == 'celular':
                page.locator('.cr-fields select').first.select_option('1')
                page.locator('.cr-fields input').nth(0).fill('F01')
                page.locator('.cr-fields input').nth(1).fill('Duplo T')
                page.locator('.cr-fields input').nth(4).fill('Teste offline')
                context.set_offline(True)
                page.get_by_role('button', name='Iniciar').first.click()
                page.get_by_role('heading', name='Em andamento').wait_for()
                page.get_by_role('button', name='Finalizar').first.click()
                page.get_by_role('button', name='Salvar medição').click()
                page.get_by_role('button', name='Sem conexão · 1 no aparelho').wait_for()
                context.set_offline(False)
                page.get_by_role('button', name='Sincronizado · 0').wait_for(timeout=15000)
                print('OFFLINE_QUEUE_OK')
            context.close()
        browser.close()
    assert not errors, errors
    print('UI_WIDTHS_OK desktop=1440 tablet=1194 celular=390')


if __name__ == '__main__':
    main()

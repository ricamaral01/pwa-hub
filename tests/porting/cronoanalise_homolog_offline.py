"""Real offline queue and collector-only permissions in homologation."""
from __future__ import annotations

import json
import time
from urllib.parse import quote

from cronoanalise_homolog_functional import API, BASE, OUT, TEST_USER, context, list_data, open_route, set_context, start_finish
from playwright.sync_api import sync_playwright


def main():
    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(headless=True)
        collector = context(browser, TEST_USER)
        page, frame = open_route(collector, 'coletar', TEST_USER)
        frame.locator('.cr-activity').first.wait_for(timeout=30000)
        labels = [label.strip() for label in page.locator('#sidebar-model-a .sb-section .sb-link').all_text_contents()]
        assert labels == ['Coletar'], labels
        page.screenshot(path=str(OUT / 'funcional-coletor-restrito.png'))
        print('COLLECTOR_MENU_OK', labels)
        catalog = collector.request.get(API + '/atividades').json()[0]
        denied = collector.request.put(API + '/atividades/' + catalog['codigo'], data=json.dumps({
            key: catalog[key] for key in ('codigo','processo','nome','tipo','pessoas_padrao',
                'estimativa_min','por_cacamba','ponto_inicio','ponto_fim','ordem','ativo')
        }), headers={'Content-Type': 'application/json', 'Origin': BASE}, max_redirects=0)
        assert denied.status == 403, (denied.status, denied.text()[:300])
        print('CATALOG_EDIT_DENIED', denied.status)

        set_context(frame, 'TESTE Coletor Offline T6a')
        posts = []
        page.on('request', lambda request: posts.append(request.post_data_json)
                if request.method == 'POST' and '/medicoes/lote' in request.url else None)
        collector.set_offline(True)
        frame.get_by_role('button', name='Sem conexão').wait_for(timeout=15000)
        start_finish(frame, 'P01', 'TESTE T6A offline 1')
        start_finish(frame, 'P02', 'TESTE T6A offline 2')
        offline_button = frame.get_by_role('button', name='Sem conexão')
        assert '2 no aparelho' in offline_button.inner_text(), offline_button.inner_text()
        page.screenshot(path=str(OUT / 'funcional-offline-fila-2.png'))
        print('OFFLINE_QUEUE_OK count=2 posts_while_offline=' + str(len(posts)))
        collector.set_offline(False)
        frame.get_by_role('button', name='Sincronizado · 0').wait_for(timeout=30000)
        assert posts and len(posts[-1]['medicoes']) == 2, posts
        retry = collector.request.post(API + '/medicoes/lote', data=posts[-1],
                                       headers={'Origin': BASE}, max_redirects=0)
        assert retry.status == 200, (retry.status, retry.text()[:300])
        outcome = retry.json()
        assert len(outcome['ja_existiam']) == 2 and not outcome['gravadas'], outcome
        print('OFFLINE_IDEMPOTENT_OK', json.dumps(outcome, ensure_ascii=False))
        page.screenshot(path=str(OUT / 'funcional-offline-sincronizado.png'))

        admin = context(browser, 'user-ricardo')
        bootstrap = admin.request.post(BASE + '/unificado/mapa/api/unified/laboratorio-bootstrap')
        assert bootstrap.status == 200
        records = [item for item in list_data(admin) if str(item.get('observacao', '')).startswith('TESTE T6A offline')]
        assert len(records) == 2 and all(item['autor_id'] == TEST_USER for item in records), records
        assert {item['id'] for item in records} == set(outcome['ja_existiam'])
        print('OFFLINE_ARRIVAL_OK count=2 author=' + TEST_USER)
        admin.close(); collector.close(); browser.close()


if __name__ == '__main__':
    main()

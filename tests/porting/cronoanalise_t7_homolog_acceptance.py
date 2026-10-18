"""Additional T7 acceptance in isolated homologation; removes its own test rows."""
from __future__ import annotations

import csv
import io
import json
import subprocess
import time
from pathlib import Path

from openpyxl import load_workbook
from playwright.sync_api import sync_playwright

from cronoanalise_homolog_functional import API, BASE, ROOT, context, list_data, open_route, set_context, start_finish

OUT = ROOT / 'docs/porting/cronoanalise/capturas-T7'
TAG = 'TESTE T7 cronoaceite 20261018'


def cleanup() -> None:
    sql = f"""BEGIN;
DELETE FROM cronoanalise.auditoria WHERE tabela='medicoes' AND registro_id IN
  (SELECT id::text FROM cronoanalise.medicoes WHERE observacao LIKE '{TAG}%');
DELETE FROM cronoanalise.medicoes WHERE observacao LIKE '{TAG}%';
DELETE FROM cronoanalise.auditoria WHERE tabela='simulacoes' AND registro_id IN
  (SELECT id::text FROM cronoanalise.simulacoes WHERE nota LIKE '{TAG}%');
DELETE FROM cronoanalise.simulacoes WHERE nota LIKE '{TAG}%';
COMMIT;
SELECT 'medicoes',count(*) FROM cronoanalise.medicoes
UNION ALL SELECT 'simulacoes',count(*) FROM cronoanalise.simulacoes
UNION ALL SELECT 'auditoria',count(*) FROM cronoanalise.auditoria;"""
    remote = "sudo -u postgres psql -v ON_ERROR_STOP=1 -d concretrack_postes_homolog -At"
    result = subprocess.run(['ssh', 'vps-concrefer', remote], input=sql, text=True,
                            capture_output=True, check=True)
    print('CLEANUP', result.stdout.strip().replace('\n', '; '))


def finish_running(frame, code: str, observation: str) -> None:
    timer = frame.locator('.cr-timer').filter(has=frame.locator(f'.cr-code:text-is("{code}")'))
    timer.wait_for(timeout=30000)
    time.sleep(1.1)
    timer.get_by_role('button', name='Finalizar', exact=True).click()
    timer.get_by_label('Observação').fill(observation)
    timer.get_by_role('button', name='Salvar medição').click()
    timer.wait_for(state='detached')


def main() -> None:
    OUT.mkdir(exist_ok=True)
    cleanup()
    try:
        with sync_playwright() as playwright:
            browser = playwright.chromium.launch(headless=True)
            phone = context(browser, 'user-ricardo', 390, 844)
            tablet = context(browser, 'user-ricardo', 1194, 834)
            page_a, frame_a = open_route(phone, 'coletar', 'user-ricardo')
            frame_a.locator('.cr-activity').first.wait_for(timeout=30000)
            set_context(frame_a, 'Ricardo T7 aparelho A')
            activity = frame_a.locator('.cr-activity').filter(has=frame_a.locator('.cr-code:text-is("P01")'))
            activity.get_by_role('button', name='Iniciar').click()
            frame_a.locator('.cr-timer').filter(has=frame_a.locator('.cr-code:text-is("P01")')).wait_for()
            page_a.close()
            page_a, frame_a = open_route(phone, 'coletar', 'user-ricardo')
            frame_a.locator('.cr-timer').filter(has=frame_a.locator('.cr-code:text-is("P01")')).wait_for(timeout=30000)
            print('TIMER_REOPEN_OK active=P01')

            page_b, frame_b = open_route(tablet, 'coletar', 'user-ricardo')
            frame_b.locator('.cr-activity').first.wait_for(timeout=30000)
            set_context(frame_b, 'Ricardo T7 aparelho B')
            activity_b = frame_b.locator('.cr-activity').filter(has=frame_b.locator('.cr-code:text-is("R01")'))
            activity_b.get_by_role('button', name='Iniciar').click()
            frame_b.locator('.cr-timer').filter(has=frame_b.locator('.cr-code:text-is("R01")')).wait_for()

            posts = []
            page_a.on('request', lambda request: posts.append(request.post_data_json)
                      if request.method == 'POST' and '/medicoes/lote' in request.url else None)
            phone.set_offline(True)
            frame_a.get_by_role('button', name='Sem conexão').wait_for(timeout=15000)
            finish_running(frame_a, 'P01', TAG + ' offline P01')
            start_finish(frame_a, 'P02', TAG + ' offline P02')
            start_finish(frame_a, 'R04', TAG + ' offline R04', distance=18.5)
            assert '3 no aparelho' in frame_a.get_by_role('button', name='Sem conexão').inner_text()
            assert not posts, posts
            page_a.screenshot(path=str(OUT / 'dois-aparelhos-offline-3.png'))
            print('OFFLINE_THREE_OK queue=3 posts=0')

            finish_running(frame_b, 'R01', TAG + ' online R01')
            frame_b.get_by_role('button', name='Sincronizado').wait_for(timeout=30000)
            before = [r for r in list_data(tablet) if str(r.get('observacao', '')).startswith(TAG)]
            assert len(before) == 1, before
            print('SECOND_DEVICE_ONLINE_OK measurements=1')

            phone.set_offline(False)
            frame_a.get_by_role('button', name='Sincronizado · 0').wait_for(timeout=30000)
            assert posts and len(posts[-1]['medicoes']) == 3, posts
            retry = phone.request.post(API + '/medicoes/lote', data=posts[-1],
                                       headers={'Origin': BASE}, max_redirects=0)
            assert retry.status == 200 and len(retry.json()['ja_existiam']) == 3
            assert not retry.json()['gravadas']
            records = [r for r in list_data(tablet) if str(r.get('observacao', '')).startswith(TAG)]
            assert len(records) == 4 and all(r['autor_id'] == 'user-ricardo' for r in records), records
            page_b, frame_b = open_route(tablet, 'medicoes', 'user-ricardo')
            frame_b.locator('.cr-table-scroll tbody tr').first.wait_for(timeout=30000)
            assert frame_b.locator('.cr-table-scroll tbody tr').count() == 4
            page_b.screenshot(path=str(OUT / 'dois-aparelhos-medicoes-4.png'))
            print('TWO_DEVICES_SYNC_OK measurements=4 offline=3 duplicate=0 authors=Ricardo')

            export = tablet.request.get(API + '/medicoes/exportar.csv')
            assert export.status == 200 and export.body().startswith(b'\xef\xbb\xbf')
            parsed = list(csv.DictReader(io.StringIO(export.body().decode('utf-8-sig')), delimiter=';'))
            assert len(parsed) == 4 and all(row['observacao'].startswith(TAG) for row in parsed)
            assert any(',' in row['duracao_s'] for row in parsed)
            xlsx = tablet.request.get(API + '/medicoes/exportar.xlsx')
            assert xlsx.status == 200
            book = load_workbook(io.BytesIO(xlsx.body()), read_only=True)
            assert len(list(book.active.values)) == 5
            print('EXPORT_OK csv_bom=1 delimiter=semicolon decimal=comma xlsx_rows=4')

            page_s, frame_s = open_route(tablet, 'simular', 'user-ricardo')
            frame_s.get_by_label('Replicações').fill('8')
            frame_s.get_by_label('Nome do cenário').fill(TAG + ' cenário')
            frame_s.locator('.cr-compare-grid > div').nth(1).get_by_label('Equipe montagem').fill('30')
            start = time.perf_counter()
            button = frame_s.get_by_role('button', name='Rodar cenário')
            assert button.is_enabled()
            button.click()
            frame_s.get_by_text('Diferença para a base no fim da concretagem').wait_for(timeout=90000)
            elapsed = time.perf_counter() - start
            page_s.screenshot(path=str(OUT / 'cenario-diferenca.png'))
            frame_s.get_by_role('button', name='Salvar rodada').click()
            frame_s.get_by_text('Rodada salva no Laboratório.').wait_for(timeout=30000)
            frame_s.get_by_role('button', name='Histórico', exact=True).click()
            assert frame_s.locator('.cr-table-scroll tbody tr').filter(has_text=TAG).count() == 1
            page_s.screenshot(path=str(OUT / 'cenario-historico.png'))
            print(f'SCENARIO_HISTORY_OK replications=8 elapsed_s={elapsed:.3f}')
            phone.close(); tablet.close(); browser.close()
    finally:
        cleanup()


if __name__ == '__main__':
    main()

"""Functional Cronoanálise evidence in isolated homologation; no production access."""
from __future__ import annotations

import json
import sys
import time
from pathlib import Path
from urllib.parse import quote

from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / 'tests/unificado'))
from homolog_session import test_cookie_for  # noqa: E402

BASE = 'https://concrefer.concretrack.com.br:18446'
API = BASE + '/unificado/laboratorio/api/laboratorio/cronoanalise'
OUT = ROOT / 'docs/porting/cronoanalise/capturas-T6a'
TEST_USER = 'crono_teste_t6a_20261018'


def context(browser, user: str, width=1440, height=900):
    ctx = browser.new_context(viewport={'width': width, 'height': height},
                              ignore_https_errors=True, service_workers='block')
    ctx.add_cookies([{'name': 'mapa_unificado_homolog_session',
                      'value': test_cookie_for(user), 'domain': 'concrefer.concretrack.com.br',
                      'path': '/unificado/', 'secure': True, 'httpOnly': True, 'sameSite': 'Lax'}])
    return ctx


def open_route(ctx, route: str, user: str):
    page = ctx.new_page()
    page.goto(BASE + '/unificado/login.html', wait_until='domcontentloaded')
    page.evaluate('(id) => localStorage.setItem("pwa_mapa_auth_session_v1", JSON.stringify({id,role:"MONTADOR",name:id}))', user)
    page.goto(BASE + '/unificado/?view=' + quote('laboratorio/cronoanalise/' + route, safe=''),
              wait_until='domcontentloaded')
    page.wait_for_function("document.querySelector('#module-host iframe.is-active') !== null", timeout=30000)
    frame = page.frame_locator('#module-host iframe.is-active')
    frame.locator('.cr-app').wait_for(timeout=30000)
    return page, frame


def set_context(frame, author: str):
    area = frame.locator('.cr-context')
    area.get_by_label('Setor').select_option('1')
    area.get_by_label('Forma').fill('TESTE-T6A-F01')
    area.get_by_label('Tipo de poste').fill('Duplo T')
    area.get_by_label('Cronometrista').fill(author)


def start_finish(frame, code: str, observation: str, *, pause=False, distance=None):
    activity = frame.locator('.cr-activity').filter(has=frame.locator(f'.cr-code:text-is("{code}")'))
    activity.get_by_role('button', name='Iniciar').click()
    timer = frame.locator('.cr-timer').filter(has=frame.locator(f'.cr-code:text-is("{code}")'))
    timer.wait_for()
    time.sleep(1.1)
    if pause:
        timer.get_by_label('Motivo da pausa').select_option('Aguardando ponte')
        timer.get_by_role('button', name='Pausar').click()
        time.sleep(1.1)
        timer.get_by_role('button', name='Retomar').click()
        time.sleep(1.1)
    timer.get_by_role('button', name='Finalizar', exact=True).click()
    if distance is not None:
        timer.get_by_label('Distância percorrida (m)').fill(str(distance))
    timer.get_by_label('Observação').fill(observation)
    timer.get_by_role('button', name='Salvar medição').click()
    timer.wait_for(state='detached')
    return code


def list_data(ctx):
    result = ctx.request.get(API + '/medicoes?limite=100')
    assert result.status == 200, (result.status, result.text()[:300])
    return result.json()['medicoes']


def main():
    OUT.mkdir(exist_ok=True)
    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(headless=True)
        ctx = context(browser, 'user-ricardo')
        page, frame = open_route(ctx, 'coletar', 'user-ricardo')
        frame.locator('.cr-activity').first.wait_for(timeout=30000)
        set_context(frame, 'Ricardo TESTE T6a')
        start_finish(frame, 'P01', 'TESTE T6A coleta com pausa', pause=True)
        start_finish(frame, 'P02', 'TESTE T6A coleta simples')
        start_finish(frame, 'R04', 'TESTE T6A deslocamento', distance=18.5)
        frame.get_by_role('button', name='Sincronizado').wait_for(timeout=30000)
        records = [r for r in list_data(ctx) if str(r.get('observacao', '')).startswith('TESTE T6A')]
        assert len(records) == 3, records
        assert {r['atividade_codigo'] for r in records} == {'P01', 'P02', 'R04'}
        assert all(r['autor_id'] == 'user-ricardo' and r['cronometrista_nome'] == 'Ricardo TESTE T6a' for r in records)
        assert all(float(r['duracao_s']) > 0 for r in records)
        paused = next(r for r in records if r['atividade_codigo'] == 'P01')
        moved = next(r for r in records if r['atividade_codigo'] == 'R04')
        assert float(paused['duracao_s']) < float(paused['bruta_s'])
        assert float(moved['distancia_m']) == 18.5
        print('COLLECTION_OK', json.dumps([{k: r[k] for k in ('id','atividade_codigo','autor_id','cronometrista_nome','bruta_s','duracao_s','distancia_m')} for r in records], ensure_ascii=False))
        page.goto(BASE + '/unificado/?view=' + quote('laboratorio/cronoanalise/medicoes', safe=''),
                  wait_until='domcontentloaded')
        table = page.frame_locator('#module-host iframe.is-active').locator('.cr-table-scroll table')
        table.wait_for(timeout=30000)
        assert table.locator('tbody tr').count() == 3
        page.screenshot(path=str(OUT / 'funcional-medicoes-3.png'))
        print('MEASUREMENTS_UI_OK rows=3')
        ctx.close()
        browser.close()


if __name__ == '__main__':
    main()

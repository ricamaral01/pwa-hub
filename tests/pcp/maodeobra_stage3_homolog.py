"""Mobile browser regression against the isolated :18446 copy (no production writes)."""
from __future__ import annotations

import json
from pathlib import Path
import subprocess
from playwright.sync_api import expect, sync_playwright
from maodeobra_stage2_homolog import credentials, BASE

DATE = '2099-10-18'
OFFLINE_DATE = '2099-10-19'
DB = 'pcp_unificado_homolog_20261016'
CAPTURES = Path('docs/maodeobra-mobile/capturas-etapa3-teste')


def sql(command: str) -> str:
    result = subprocess.run(['ssh','vps-staging',f'sudo -u postgres psql -X -v ON_ERROR_STOP=1 -d {DB} -At'],
        input=command, text=True, capture_output=True, check=True)
    return result.stdout.strip()


def cleanup() -> None:
    sql(f"""BEGIN;
DELETE FROM maodeobra_rateio WHERE maodeobra_id IN (SELECT id FROM maodeobra WHERE data IN ('{DATE}','{OFFLINE_DATE}'));
DELETE FROM maodeobra WHERE data IN ('{DATE}','{OFFLINE_DATE}');
DELETE FROM maodeobra_dias WHERE data IN ('{DATE}','{OFFLINE_DATE}');
COMMIT;""")


def check_db(group: str, date: str, expected: float, sem_producao: bool, motivo: str | None = None):
    query = f"""SELECT d.grupo_setor, d.sem_producao, coalesce(d.motivo_sem_producao,''),
      d.salvo_em IS NOT NULL, d.salvo_por_usuario_id IS NOT NULL,
      coalesce((SELECT SUM(m.quantidade_pessoas) FROM maodeobra m
        JOIN atividades_mao_de_obra a ON a.id=m.atividade_id
        WHERE m.data=d.data AND a.grupo_setor=d.grupo_setor),0)
      FROM maodeobra_dias d WHERE d.data='{date}' AND d.grupo_setor='{group}';"""
    parts = sql(query).split('|')
    assert parts[0] == group and parts[1] == ('t' if sem_producao else 'f'), parts
    assert parts[2] == (motivo or '') and parts[3:5] == ['t','t'], parts
    assert float(parts[5]) == expected, parts


def run():
    cleanup()
    CAPTURES.mkdir(parents=True, exist_ok=True)
    account = credentials()
    results = {}
    with sync_playwright() as pw:
        browser = pw.chromium.launch(headless=True)
        context = browser.new_context(viewport={'width':390,'height':844}, is_mobile=True, has_touch=True,
          device_scale_factor=3, ignore_https_errors=True,
          user_agent='Mozilla/5.0 (Linux; Android 15; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Mobile Safari/537.36')
        page = context.new_page()
        errors = []
        page.on('pageerror', lambda error: errors.append(str(error)[:220]))
        page.goto(BASE+'/unificado/login.html?next=pcp/maodeobra/',wait_until='domcontentloaded')
        page.locator('#unificado-login-form [name="username"]').fill(account['PCP_TEST_USER'])
        page.locator('#unificado-login-form [name="password"]').fill(account['PCP_TEST_PASSWORD'])
        page.locator('#unificado-login-form button[type="submit"]').click()
        page.wait_for_url('**/unificado/?view=pcp%2Fmaodeobra%2F',timeout=20000)
        frame = page.frame_locator('#module-host iframe.is-active')
        expect(frame.locator('#mdo-mobile .activity-card')).to_have_count(7,timeout=15000)
        page.evaluate('window.scrollTo(0, document.documentElement.scrollHeight)')
        frame.locator('#mdo-m-date').fill(DATE)
        expect(frame.locator('#mdo-mobile .activity-card')).to_have_count(7,timeout=15000)
        root = frame.locator('#mdo-mobile')
        root.screenshot(path=str(CAPTURES/'01-lancamento-android-emulado.png'))
        for width in (360, 390, 430):
            page.set_viewport_size({'width':width,'height':844})
            expect(root.locator('.activity-card')).to_have_count(7)
            dimensions = frame.locator('body').evaluate('''() => ({width:document.documentElement.clientWidth,
              scroll:document.documentElement.scrollWidth})''')
            assert dimensions['scroll'] <= dimensions['width'], dimensions
            if width != 390:
                root.screenshot(path=str(CAPTURES/f'01-lancamento-android-{width}-emulado.png'))
        page.set_viewport_size({'width':390,'height':844})
        first_mod = root.locator('.activity-card input').first
        first_mod.fill('1,25')
        expect(root.locator('[data-screen="review"]')).to_be_disabled()
        first_mod.fill('12,5')
        expect(root.locator('[data-total="all"]')).to_have_text('12,5')
        expect(root.locator('[data-screen="review"]')).to_be_enabled()
        results['comma_invalid'] = True
        root.locator('[data-screen="review"]').click()
        expect(root.locator('h1')).to_have_text('Conferir lançamento')
        root.screenshot(path=str(CAPTURES/'02-conferencia-android-emulado.png'))
        root.locator('[data-send="production"]').click()
        expect(root.locator('h1')).to_have_text('Lançamento enviado',timeout=15000)
        assert 'Salvo às' in root.locator('.byline').inner_text()
        root.screenshot(path=str(CAPTURES/'03-enviado-android-emulado.png'))
        assert frame.locator('body').evaluate("""() => !localStorage.getItem(
          `maodeobra-draft-v1:${API.getUser().id}:2099-10-18:12`)""")
        check_db('12',DATE,12.5,False)
        results['s12_send_db'] = True

        root.locator('[data-screen="launch"]').click()
        expect(root.locator('.status')).to_contain_text('Lançado')
        assert 'indisponíveis' not in root.locator('.status').inner_text()
        root.locator('.activity-card input').first.fill('10,5')
        root.locator('[data-screen="review"]').click()
        expect(root.locator('.warning')).to_contain_text('substitui')
        root.locator('[data-send="production"]').click()
        expect(root.locator('h1')).to_have_text('Lançamento enviado',timeout=15000)
        check_db('12',DATE,10.5,False)
        results['resend_db'] = True

        root.locator('[data-other-group]').click()
        expect(root.locator('.activity-card')).to_have_count(9,timeout=15000)
        root.locator('.activity-card input').first.fill('2,5')
        root.locator('[data-screen="review"]').click()
        root.locator('[data-send="production"]').click()
        expect(root.locator('h1')).to_have_text('Lançamento enviado',timeout=15000)
        check_db('34',DATE,2.5,False)
        results['s34_send_db'] = True

        root.locator('[data-screen="launch"]').click()
        root.locator('[data-screen="no-production"]').click()
        root.locator('#mdo-m-reason').fill('Chuva')
        root.screenshot(path=str(CAPTURES/'05-sem-producao-android-emulado.png'))
        root.locator('[data-send="no-production"]').click()
        expect(root.locator('h1')).to_have_text('Lançamento enviado',timeout=15000)
        check_db('34',DATE,0,True,'Chuva')
        results['no_production_reason_db'] = True

        root.locator('[data-other-group]').click()
        root.locator('[data-screen="no-production"]').click()
        root.locator('#mdo-m-reason').fill('')
        root.locator('[data-send="no-production"]').click()
        expect(root.locator('h1')).to_have_text('Lançamento enviado',timeout=15000)
        check_db('12',DATE,0,True)
        results['no_production_without_reason_db'] = True

        root.locator('[data-screen="history"]').click()
        root.locator('#mdo-m-history-end').fill(DATE)
        root.locator('#mdo-m-history-end').press('Tab')
        expect(root.locator('.history-line[data-open-date="'+DATE+'"]').first).to_be_visible(timeout=15000)
        root.screenshot(path=str(CAPTURES/'06-historico-android-emulado.png'))
        root.locator('.history-line[data-open-date="'+DATE+'"][data-open-group="34"]').click()
        expect(root.locator('.status')).to_contain_text('Sem produção')
        results['history_navigation'] = True

        frame.locator('#mdo-m-date').fill(OFFLINE_DATE)
        expect(root.locator('.activity-card')).to_have_count(9,timeout=15000)
        root.locator('.activity-card input').first.fill('2,5')
        root.locator('[data-screen="review"]').click()
        page.route('**/unificado/pcp/api/**',lambda route: route.abort())
        root.locator('[data-send="production"]').click()
        expect(root.locator('.error-banner')).to_be_visible(timeout=15000)
        root.screenshot(path=str(CAPTURES/'04-erro-android-emulado.png'))
        assert root.locator('.review-list').inner_text().find('2,5') >= 0
        assert frame.locator('body').evaluate("""() => Boolean(localStorage.getItem(
          `maodeobra-draft-v1:${API.getUser().id}:2099-10-19:34`))""")
        root.locator('[data-retry]').click()
        expect(root.locator('.error-banner')).to_contain_text('Não foi possível confirmar',timeout=15000)
        assert sql(f"SELECT count(*) FROM maodeobra_dias WHERE data='{OFFLINE_DATE}' AND grupo_setor='34';") == '0'
        page.unroute('**/unificado/pcp/api/**')
        root.locator('[data-retry]').click()
        expect(root.locator('h1')).to_have_text('Lançamento enviado',timeout=15000)
        assert frame.locator('body').evaluate("""() => !localStorage.getItem(
          `maodeobra-draft-v1:${API.getUser().id}:2099-10-19:34`)""")
        check_db('34',OFFLINE_DATE,2.5,False)
        results['network_error_retry_db'] = True
        root.locator('[data-screen="launch"]').click()
        root.locator('[data-exit]').click()
        page.wait_for_url(BASE+'/unificado/',timeout=15000)
        results['return_to_unificado'] = True
        assert not errors, errors
        browser.close()
    cleanup()
    print(json.dumps(results))


if __name__ == '__main__': run()

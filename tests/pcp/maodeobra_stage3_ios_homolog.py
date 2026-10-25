"""WebKit iPhone emulation; real-device recording is supplied separately."""
from pathlib import Path
from playwright.sync_api import expect, sync_playwright
from maodeobra_stage2_homolog import credentials, BASE
from maodeobra_stage3_homolog import sql, DB, CAPTURES

DATE = '2099-10-20'


def cleanup():
    sql(f"""BEGIN;
DELETE FROM maodeobra WHERE data='{DATE}';
DELETE FROM maodeobra_dias WHERE data='{DATE}';
COMMIT;""")


def run():
    cleanup()
    account = credentials()
    CAPTURES.mkdir(parents=True, exist_ok=True)
    with sync_playwright() as pw:
        browser = pw.webkit.launch(headless=True)
        device = pw.devices['iPhone 13']
        context = browser.new_context(**device, ignore_https_errors=True,
            record_video_dir=str(CAPTURES), record_video_size={'width':390,'height':844})
        page = context.new_page()
        errors = []
        page.on('pageerror',lambda error: errors.append(str(error)[:200]))
        page.goto(BASE+'/unificado/login.html?next=pcp/maodeobra/',wait_until='domcontentloaded')
        page.locator('#unificado-login-form [name="username"]').fill(account['PCP_TEST_USER'])
        page.locator('#unificado-login-form [name="password"]').fill(account['PCP_TEST_PASSWORD'])
        page.locator('#unificado-login-form button[type="submit"]').click()
        page.wait_for_url('**/unificado/?view=pcp%2Fmaodeobra%2F',timeout=20000)
        frame = page.frame_locator('#module-host iframe.is-active')
        root = frame.locator('#mdo-mobile')
        expect(root.locator('.activity-card')).to_have_count(7,timeout=15000)
        frame.locator('#mdo-m-date').fill(DATE)
        frame.locator('#mdo-m-date').press('Tab')
        expect(root.locator('.date-box')).to_contain_text('2099',timeout=15000)
        expect(root.locator('.activity-card')).to_have_count(7,timeout=15000)
        root.screenshot(path=str(CAPTURES/'01-lancamento-iphone-emulado.png'))
        root.locator('.activity-card input').first.fill('12,5')
        root.locator('[data-screen="review"]').click()
        root.screenshot(path=str(CAPTURES/'02-conferencia-iphone-emulado.png'))
        root.locator('[data-send="production"]').click()
        expect(root.locator('h1')).to_have_text('Lançamento enviado',timeout=15000)
        root.screenshot(path=str(CAPTURES/'03-enviado-iphone-emulado.png'))
        root.locator('[data-screen="history"]').click()
        root.locator('#mdo-m-history-end').fill(DATE)
        root.locator('#mdo-m-history-end').press('Tab')
        expect(root.locator('.history-line[data-open-date="'+DATE+'"]').first).to_be_visible(timeout=15000)
        root.screenshot(path=str(CAPTURES/'06-historico-iphone-emulado.png'))
        assert not errors, errors
        video_path = page.video.path()
        context.close()
        Path(video_path).replace(CAPTURES/'fluxo-iphone-emulado.webm')
        browser.close()
    total = sql(f"""SELECT COALESCE(SUM(m.quantidade_pessoas),0) FROM maodeobra m
      JOIN atividades_mao_de_obra a ON a.id=m.atividade_id WHERE m.data='{DATE}' AND a.grupo_setor='12';""")
    assert float(total) == 12.5
    cleanup()
    print('iPhone WebKit emulado: lançamento, conferência, POST, histórico e banco de teste passaram')


if __name__ == '__main__': run()

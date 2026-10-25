"""WebKit iPhone emulation of the new confirmation flow on isolated test data."""
import subprocess
from playwright.sync_api import expect, sync_playwright
from maodeobra_stage2_homolog import BASE, DATABASE, credentials
from maodeobra_confirm_homolog import CAPTURES

DATE = '2099-10-25'


def cleanup():
    sql = f"""BEGIN;
DELETE FROM maodeobra_rateio WHERE maodeobra_id IN (SELECT id FROM maodeobra WHERE data='{DATE}');
DELETE FROM maodeobra WHERE data='{DATE}';
DELETE FROM maodeobra_dias WHERE data='{DATE}';
COMMIT;"""
    subprocess.run(['ssh','vps-staging',f'sudo -u postgres psql -X -v ON_ERROR_STOP=1 -d {DATABASE} -q'],
        input=sql,text=True,capture_output=True,check=True)


def run():
    cleanup()
    account = credentials()
    try:
        with sync_playwright() as pw:
            browser = pw.webkit.launch(headless=True)
            context = browser.new_context(**pw.devices['iPhone 13'], ignore_https_errors=True)
            page = context.new_page()
            page.goto(BASE+'/unificado/login.html?next=pcp/maodeobra/', wait_until='domcontentloaded')
            page.locator('#unificado-login-form [name="username"]').fill(account['PCP_TEST_USER'])
            page.locator('#unificado-login-form [name="password"]').fill(account['PCP_TEST_PASSWORD'])
            page.locator('#unificado-login-form button[type="submit"]').click()
            page.wait_for_url('**/unificado/?view=pcp%2Fmaodeobra%2F', timeout=20000)
            frame = page.frame_locator('#module-host iframe.is-active')
            root = frame.locator('#mdo-mobile')
            expect(root.locator('.activity-card')).to_have_count(7, timeout=15000)
            frame.locator('#mdo-m-date').fill(DATE)
            frame.locator('#mdo-m-date').press('Tab')
            expect(root.locator('.date-box')).to_contain_text('2099', timeout=15000)
            root.locator('.activity-card input').first.fill('12,5')
            root.locator('[data-primary-action]').click()
            root.locator('[data-send="production"]').click()
            expect(root.locator('h1')).to_contain_text('Lançamento enviado', timeout=15000)
            root.locator('[data-screen="launch"]').first.click()
            expect(root.locator('[data-primary-action]')).to_contain_text('Confirmar mão de obra')
            root.locator('[data-primary-action]').click()
            expect(root.locator('h1')).to_contain_text('Confirmar mão de obra')
            root.screenshot(path=str(CAPTURES/'iphone-confirmar.png'))
            root.locator('[data-confirm-only]').click()
            expect(root.locator('.status-detail')).to_contain_text('Confirmado às', timeout=15000)
            root.locator('[data-screen="history"]').click()
            frame.locator('#mdo-m-history-end').fill(DATE)
            frame.locator('#mdo-m-history-end').press('Tab')
            expect(root.locator('.history-card')).to_contain_text('Confirmado', timeout=15000)
            root.screenshot(path=str(CAPTURES/'iphone-historico-confirmado.png'))
            context.close()
            browser.close()
    finally:
        cleanup()
    print('iPhone WebKit: lançamento, confirmação e histórico passaram.')


if __name__ == '__main__':
    run()

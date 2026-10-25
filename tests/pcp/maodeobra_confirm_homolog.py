"""Confirmation flow on isolated :18446 data; preserves the user's 17/10 launch."""
from pathlib import Path
import subprocess
from playwright.sync_api import expect, sync_playwright
from maodeobra_stage2_homolog import BASE, DATABASE, credentials

DATES = ('2099-10-22', '2099-10-23', '2099-10-24')
CAPTURES = Path('docs/maodeobra-mobile/capturas-confirmacao-teste')


def cleanup():
    dates = ','.join(f"'{day}'" for day in DATES)
    sql = f"""BEGIN;
DELETE FROM maodeobra_rateio WHERE maodeobra_id IN (SELECT id FROM maodeobra WHERE data IN ({dates}));
DELETE FROM maodeobra WHERE data IN ({dates});
DELETE FROM maodeobra_dias WHERE data IN ({dates});
COMMIT;"""
    subprocess.run(['ssh', 'vps-staging', f'sudo -u postgres psql -X -v ON_ERROR_STOP=1 -d {DATABASE} -q'],
        input=sql, text=True, capture_output=True, check=True)


def login(browser, account, mobile=False):
    options = {'viewport': {'width':390,'height':844}, 'is_mobile':True,
        'has_touch':True, 'device_scale_factor':3} if mobile else {'viewport':{'width':1440,'height':900}}
    context = browser.new_context(**options, ignore_https_errors=True)
    page = context.new_page()
    page.goto(BASE + '/unificado/login.html?next=pcp/maodeobra/', wait_until='domcontentloaded')
    page.locator('#unificado-login-form [name="username"]').fill(account['PCP_TEST_USER'])
    page.locator('#unificado-login-form [name="password"]').fill(account['PCP_TEST_PASSWORD'])
    page.locator('#unificado-login-form button[type="submit"]').click()
    page.wait_for_url('**/unificado/?view=pcp%2Fmaodeobra%2F', timeout=20000)
    frame = page.frame_locator('#module-host iframe.is-active')
    return context, page, frame


def run():
    cleanup()
    CAPTURES.mkdir(parents=True, exist_ok=True)
    account = credentials()
    try:
        with sync_playwright() as pw:
            browser = pw.chromium.launch(headless=True)
            desktop, desktop_page, frame = login(browser, account)
            expect(frame.locator('#tbody-mdo-grid .mdo-qtd')).to_have_count(7, timeout=15000)
            api = frame.locator('body').evaluate("""async (_, date) => {
              const group='12';
              const activities=await API.get('/api/atividades-maodeobra?grupo_setor=12&ativo=true');
              const items=value=>activities.map((activity,index)=>({
                atividade_id:activity.id,quantidade_pessoas:index===0?value:0}));
              const save=async(value,confirmar=false)=>API.post('/api/maodeobra/grupo',
                {data:date,grupo_setor:group,sem_producao:false,confirmar,itens:items(value)});
              const get=()=>API.get(`/api/maodeobra/dia?data=${date}&grupo_setor=${group}`);
              await save(12.5);
              const pending=await get();
              await API.post('/api/maodeobra/grupo/confirmar',
                {data:date,grupo_setor:group,salvo_em:pending.salvo_em});
              const confirmed=await get();
              await save(13);
              const edited=await get();
              let staleStatus=null;
              try {await API.post('/api/maodeobra/grupo/confirmar',
                {data:date,grupo_setor:group,salvo_em:pending.salvo_em});}
              catch(error){staleStatus=error.status;}
              const afterConflict=await get();
              await save(13.5,true);
              const savedAndConfirmed=await get();
              const summary=await API.get(`/api/maodeobra/resumo?data_inicio=${date}&data_fim=${date}`);
              return {pending,confirmed,edited,staleStatus,afterConflict,savedAndConfirmed,
                summary:summary.dias[0].grupos[0]};
            }""", DATES[0])
            assert api['pending']['lancado'] and not api['pending']['confirmado']
            assert api['confirmed']['confirmado'] and api['confirmed']['salvo_em'] == api['pending']['salvo_em']
            assert api['confirmed']['confirmado_por']['nome']
            assert not api['edited']['confirmado'] and api['edited']['confirmado_em'] is None
            assert api['staleStatus'] == 409 and not api['afterConflict']['confirmado']
            assert api['savedAndConfirmed']['confirmado'] and api['summary']['confirmado']
            assert api['summary']['confirmado_em'] and api['summary']['confirmado_por']['nome']

            frame.locator('#mdo-data').fill(DATES[1])
            expect(frame.locator('#tbody-mdo-grid .mdo-qtd')).to_have_count(7)
            frame.locator('#tbody-mdo-grid .mdo-qtd').first.fill('12,5')
            frame.locator('#btn-salvar-lote').click()
            expect(frame.locator('#mdo-dia-estado')).to_contain_text('aguardando confirmação', timeout=15000)
            expect(frame.locator('#btn-confirmar-lote')).to_be_enabled()
            frame.locator('#btn-confirmar-lote').click()
            expect(frame.locator('#mdo-dia-estado')).to_contain_text('Confirmado', timeout=15000)
            frame.locator('#tbody-mdo-grid .mdo-qtd').first.fill('13')
            expect(frame.locator('#btn-confirmar-lote')).to_be_disabled()
            frame.locator('#btn-salvar-lote').click()
            expect(frame.locator('#mdo-dia-estado')).to_contain_text('aguardando confirmação', timeout=15000)
            desktop_page.wait_for_timeout(4000)
            frame.locator('.section-card').first.screenshot(path=str(CAPTURES/'desktop-aguardando.png'))

            mobile, mobile_page, mobile_frame = login(browser, account, mobile=True)
            root = mobile_frame.locator('#mdo-mobile')
            expect(root.locator('.activity-card')).to_have_count(7, timeout=15000)
            mobile_frame.locator('#mdo-m-date').fill(DATES[2])
            mobile_frame.locator('#mdo-m-date').press('Tab')
            expect(root.locator('.date-box')).to_contain_text('2099', timeout=15000)
            first = root.locator('.activity-card input').first
            first.fill('12,5')
            root.locator('[data-primary-action]').click()
            expect(root.locator('h1')).to_contain_text('Conferir')
            root.locator('[data-send="production"]').click()
            expect(root.locator('h1')).to_contain_text('Lançamento enviado', timeout=15000)
            root.locator('[data-screen="launch"]').first.click()
            expect(root.locator('.status-detail')).to_contain_text('aguardando confirmação')
            root.screenshot(path=str(CAPTURES/'mobile-aguardando.png'))
            root.locator('[data-primary-action]').click()
            expect(root.locator('h1')).to_have_text('Confirmar mão de obra')
            root.screenshot(path=str(CAPTURES/'mobile-confirmar.png'))

            frame.locator('#mdo-data').fill(DATES[2])
            expect(frame.locator('#tbody-mdo-grid .mdo-qtd')).to_have_count(7, timeout=15000)
            frame.locator('#tbody-mdo-grid .mdo-qtd').first.fill('13')
            frame.locator('#btn-salvar-lote').click()
            expect(frame.locator('#mdo-dia-estado')).to_contain_text('aguardando confirmação', timeout=15000)
            root.locator('[data-confirm-only]').click()
            expect(root.locator('.status-detail')).to_contain_text('mudou', timeout=15000)
            expect(first).to_have_value('13')
            root.screenshot(path=str(CAPTURES/'mobile-conflito.png'))
            first.fill('13,5')
            expect(root.locator('[data-primary-action]')).to_contain_text('Salvar e confirmar')
            root.locator('[data-primary-action]').click()
            expect(root.locator('.review-list')).to_contain_text('13 → 13,5')
            root.screenshot(path=str(CAPTURES/'mobile-diferencas.png'))
            root.locator('[data-send="production"]').click()
            expect(root.locator('h1')).to_contain_text('confirmada', timeout=15000)
            root.locator('[data-screen="launch"]').first.click()
            expect(root.locator('.status-detail')).to_contain_text('Confirmado às')
            root.screenshot(path=str(CAPTURES/'mobile-confirmado.png'))
            mobile.close()
            desktop.close()
            browser.close()
    finally:
        cleanup()
    print('API, desktop, mobile, 409, reenvio e confirmação passaram; datas fictícias removidas.')


if __name__ == '__main__':
    run()

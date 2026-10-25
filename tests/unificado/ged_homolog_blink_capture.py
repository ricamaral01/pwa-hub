"""Record GED openings and reloads in the isolated test shell.

No credentials, cookies or assertion values are written to the artifacts.
"""

import json
import os
import sys
import time
from pathlib import Path

from playwright.sync_api import sync_playwright

from homolog_session import test_cookies
from marcelo_ged_browser_smoke import short_session


BASE = os.environ.get('UNIFICADO_BASE_URL', 'https://concrefer.concretrack.com.br:18446')
CHROME = r'C:\Program Files\Google\Chrome\Application\chrome.exe'
ROUTES = ('dashboard', 'documents', 'approvals', 'tasks', 'calibrations')
HEADINGS = {
    'dashboard': 'Dashboard',
    'documents': 'Documentos',
    'approvals': 'Aprovações',
    'tasks': 'Tarefas',
    'calibrations': 'Certificados de calibração',
}
OUTPUT = Path(sys.argv[1] if len(sys.argv) > 1 else 'docs/capturas-ged-pisca-teste-20261016')


def snapshot(page):
    return page.evaluate('''() => {
      const frame = document.querySelector('#module-host iframe.is-active');
      let inner = null;
      try { inner = frame?.contentDocument; } catch {}
      const visible = !!frame && getComputedStyle(frame).visibility === 'visible';
      const heading = inner?.querySelector('main h1')?.textContent?.trim() || '';
      const login = !!inner?.querySelector('input[type="password"]');
      const sidebar = !!inner?.querySelector('aside.bg-brand-600');
      const header = !!inner?.querySelector('header');
      return {
        frameVisible: visible, heading, login, sidebar, header,
        accessDenied: document.querySelector('.unificado-access-denied')?.hidden === false,
        loading: document.querySelector('#module-host')?.classList.contains('is-loading'),
        readyPaths: (window.__gedReady || []).map(item => item.path),
      };
    }''')


def capture_until_ready(page, route, phase):
    samples = []
    started = time.monotonic()
    deadline = started + 10
    next_sample = started
    while time.monotonic() < deadline:
        now = time.monotonic()
        if now < next_sample:
            page.wait_for_timeout(max(1, int((next_sample - now) * 1000)))
        state = snapshot(page)
        state['ms'] = round((time.monotonic() - started) * 1000)
        samples.append(state)
        if any(path.endswith('/' + route) for path in state['readyPaths']) and \
                state['heading'] == HEADINGS[route]:
            page.wait_for_timeout(250)
            break
        next_sample += 0.1
    if not samples or samples[-1]['heading'] != HEADINGS[route]:
        raise AssertionError(f'{phase} {route} did not become ready: {samples[-1] if samples else None}')
    return samples


def make_context(browser, mode, token):
    mobile = mode == 'celular'
    viewport = {'width': 390, 'height': 844} if mobile else {'width': 1440, 'height': 900}
    context = browser.new_context(
        viewport=viewport, is_mobile=mobile, has_touch=mobile,
        service_workers='block', record_video_dir=str(OUTPUT / mode),
        record_video_size=viewport,
    )
    context.add_cookies([{
        'name': 'mapa_unificado_homolog_session' if ':18446' in BASE else 'mapa_unificado_session',
        'value': token,
        'domain': 'concrefer.concretrack.com.br', 'path': '/unificado/',
        'secure': True, 'httpOnly': True, 'sameSite': 'Lax',
    }])
    return context


def run_mode(browser, mode, token):
    context = make_context(browser, mode, token)
    page = context.new_page()
    page.add_init_script('''(() => {
      window.__gedReady = [];
      window.addEventListener('message', e => {
        if (e.origin === location.origin && e.data?.type === 'unificado-ged-ready')
          window.__gedReady.push({path:e.data.path, status:e.data.status || 'ok'});
      });
    })();''')
    page.goto(BASE + '/unificado/login.html', wait_until='domcontentloaded')
    page.evaluate("localStorage.setItem('pwa_mapa_auth_session_v1', JSON.stringify({id:'user-ricardo',role:'GERENCIA',name:'Ricardo'}))")
    page.goto(BASE + '/unificado/', wait_until='domcontentloaded')
    if mode == 'desktop':
        page.locator('#sidebar-model-a .sb').wait_for(state='visible', timeout=20000)
        page.locator('#sidebar-model-a .sb-switcher-btn').click()
        page.get_by_role('menuitemradio', name='GED').click()
    report = {}
    for route in ROUTES:
        page.evaluate('window.__gedReady = []')
        selector = (f'#sidebar-model-a a[href$="ged%2F{route}"]' if mode == 'desktop'
                    else f'#sidebar [data-ged-route="{route}"]')
        page.locator(selector).click(timeout=15000)
        opened = capture_until_ready(page, route, 'open')
        page.screenshot(path=str(OUTPUT / mode / f'{route}-open.png'))
        page.reload(wait_until='commit')
        reloaded = capture_until_ready(page, route, 'reload')
        page.screenshot(path=str(OUTPUT / mode / f'{route}-reload.png'))
        report[route] = {'open': opened, 'reload': reloaded}
        print(mode, route, 'open', opened[-1]['ms'], 'ms',
              'reload', reloaded[-1]['ms'], 'ms', flush=True)
    video = page.video
    context.close()
    if video:
        video.save_as(str(OUTPUT / mode / 'ged-abertura-e-reload.webm'))
    return report


def main():
    OUTPUT.mkdir(parents=True, exist_ok=True)
    token = test_cookies()['ricardo'] if ':18446' in BASE else short_session('user-ricardo')
    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(headless=True, executable_path=CHROME)
        report = {}
        for mode in ('desktop', 'celular'):
            (OUTPUT / mode).mkdir(parents=True, exist_ok=True)
            report[mode] = run_mode(browser, mode, token)
        browser.close()
    (OUTPUT / 'amostras-100ms.json').write_text(
        json.dumps(report, ensure_ascii=False, indent=2), encoding='utf-8')
    for mode, routes in report.items():
        frames = [frame for route in routes.values() for phase in route.values() for frame in phase]
        print(mode, 'samples', len(frames), 'login', sum(f['login'] for f in frames),
              'sidebar', sum(f['sidebar'] for f in frames),
              'header', sum(f['header'] for f in frames),
              'blank-visible', sum(f['frameVisible'] and not f['heading'] for f in frames))


if __name__ == '__main__':
    main()

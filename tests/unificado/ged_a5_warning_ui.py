"""Read-only GED destination check of the fallback warning in version history."""
from pathlib import Path
from urllib.parse import urlparse
import json
import requests
import sys
from playwright.sync_api import sync_playwright, TimeoutError as PlaywrightTimeoutError
from ged_a5_live import API, BASE, CHROME, credentials
from ged_a5_remaining_live import browser_login

DOCUMENT_ID = '13c37107-bff7-456f-8eb3-baf0276eec57'
VERSION_ID = '2b37351f-e559-4f6f-b23f-ef6d339ee455'
SHOT = Path('docs/porting/ged/a5-warning-timeout-redacted.png')
STAGE = 'start'


def redact_screenshot(page) -> None:
    page.evaluate("""() => {
      document.querySelectorAll('input, textarea').forEach(el => { el.value = ''; });
      const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
      while (walker.nextNode()) {
        const node = walker.currentNode;
        if (node.textContent.trim()) node.textContent = '[redigido]';
      }
      document.querySelectorAll('img, iframe').forEach(el => el.style.visibility = 'hidden');
    }""")
    SHOT.parent.mkdir(parents=True, exist_ok=True)
    page.screenshot(path=str(SHOT), full_page=False)


def main() -> None:
    global STAGE
    creds = credentials()
    STAGE = 'api_login'
    login = requests.post(API + '/auth/login', json={
        'username': creds['ADMIN_MASTER_USER'], 'password': creds['ADMIN_MASTER_PASSWORD']}, timeout=15)
    assert login.status_code == 200
    STAGE = 'api_versions'
    versions = requests.get(API + f'/documents/{DOCUMENT_ID}/versions', headers={
        'Authorization': 'Bearer ' + login.json()['token']}, timeout=15)
    assert versions.status_code == 200
    matching = [v for v in versions.json() if v.get('id') == VERSION_ID]
    api_warning = len(matching) == 1 and bool(matching[0].get('processing_warning'))
    with sync_playwright() as pw:
        STAGE = 'browser_launch'
        browser = pw.chromium.launch(headless=True, executable_path=CHROME)
        STAGE = 'browser_login'
        context = browser_login(browser, creds, 'ADMIN_MASTER')
        page = context.pages[0]
        page_errors = []
        asset_failures = []
        page.on('pageerror', lambda error: page_errors.append(type(error).__name__))
        page.on('response', lambda response: asset_failures.append(response.status)
                if '/_next/static/' in response.url and response.status >= 400 else None)
        STAGE = 'document_navigation'
        response = page.goto(BASE + '/documents/' + DOCUMENT_ID, wait_until='domcontentloaded', timeout=30000)
        STAGE = 'warning_wait'
        try:
            page.get_by_role('alert').filter(has_text='Carimbo').first.wait_for(
                timeout=3000 if '--preflight' in sys.argv else 20000)
            visible = True
        except PlaywrightTimeoutError:
            visible = False
            redact_screenshot(page)
        report = {'document_route': urlparse(page.url).path,
                  'status': response.status if response else None,
                  'api_warning': api_warning, 'warning_visible': visible,
                  'pageerror_types': page_errors, 'asset_failures': asset_failures,
                  'redacted_screenshot': str(SHOT) if not visible else None}
        print(json.dumps(report, ensure_ascii=False))
        context.close()
        browser.close()
        if '--preflight' in sys.argv:
            assert api_warning and response is not None and response.status == 200
        else:
            assert api_warning and visible
        STAGE = 'complete'


if __name__ == '__main__':
    try:
        main()
    except Exception as error:
        print(f'GED warning UI failed: stage={STAGE} error={type(error).__name__}')
        raise SystemExit(1) from None



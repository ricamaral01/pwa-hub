"""Read-only, redacted GED warning diagnosis after rollback."""
from pathlib import Path
from time import monotonic
from urllib.parse import urlparse
import json
import requests
from playwright.sync_api import sync_playwright
from ged_a5_live import API, BASE, CHROME, credentials
from ged_a5_remaining_live import browser_login

DOCUMENT_ID = '13c37107-bff7-456f-8eb3-baf0276eec57'
VERSION_ID = '2b37351f-e559-4f6f-b23f-ef6d339ee455'
SHOT = Path('docs/porting/ged/a5-warning-diagnostic-redacted.png')


def main() -> None:
    creds = credentials()
    login = requests.post(API + '/auth/login', json={
        'username': creds['ADMIN_MASTER_USER'], 'password': creds['ADMIN_MASTER_PASSWORD']}, timeout=15)
    assert login.status_code == 200
    versions = requests.get(API + f'/documents/{DOCUMENT_ID}/versions', headers={
        'Authorization': 'Bearer ' + login.json()['token']}, timeout=15)
    assert versions.status_code == 200
    matching = [v for v in versions.json() if v.get('id') == VERSION_ID]
    assert len(matching) == 1
    api_warning = bool(matching[0].get('processing_warning'))

    with sync_playwright() as pw:
        browser = pw.chromium.launch(headless=True, executable_path=CHROME)
        context = browser_login(browser, creds, 'ADMIN_MASTER')
        page = context.pages[0]
        asset_failures = []
        downloads = []
        page.on('response', lambda r: asset_failures.append(r.status)
                if '/_next/static/' in r.url and r.status >= 400 else None)
        page.on('request', lambda r: downloads.append(urlparse(r.url).path)
                if '/uploads/' in r.url else None)
        started = monotonic()
        response = page.goto(BASE + '/documents/' + DOCUMENT_ID, wait_until='domcontentloaded', timeout=30000)
        try:
            page.get_by_text('Histórico de Versões').wait_for(timeout=20000)
            history_ready = True
        except Exception:
            history_ready = False
        elapsed = round(monotonic() - started, 2)
        warning_count = page.get_by_text('Carimbo não aplicado', exact=False).count()
        # Redact the visible page before creating a local diagnostic screenshot.
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
        print(json.dumps({
            'api_warning': api_warning, 'document_route': urlparse(page.url).path,
            'http_status': response.status if response else None,
            'history_ready': history_ready, 'seconds': elapsed,
            'ui_warning_count_after_rollback': warning_count,
            'asset_failures': asset_failures, 'pdf_preview_requests': len(downloads),
            'redacted_screenshot': str(SHOT),
        }, ensure_ascii=False))
        context.close()
        browser.close()


if __name__ == '__main__':
    try:
        main()
    except Exception as error:
        print(f'GED warning diagnostic failed: {type(error).__name__}')
        raise SystemExit(1) from None

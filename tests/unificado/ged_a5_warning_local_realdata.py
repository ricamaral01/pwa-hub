"""Render real read-only GED API data in local Next with mocked network responses."""
import json
import requests
from urllib.parse import urlparse
from playwright.sync_api import sync_playwright
from ged_a5_live import API, CHROME, credentials

LOCAL = 'http://127.0.0.1:13072/unificado/ged'
DOC_ID = '13c37107-bff7-456f-8eb3-baf0276eec57'
VERSION_ID = '2b37351f-e559-4f6f-b23f-ef6d339ee455'
STAGE = 'start'


def main() -> None:
    global STAGE
    creds = credentials()
    STAGE = 'api_login'
    login = requests.post(API + '/auth/login', json={
        'username': creds['ADMIN_MASTER_USER'], 'password': creds['ADMIN_MASTER_PASSWORD']}, timeout=15)
    assert login.status_code == 200
    headers = {'Authorization': 'Bearer ' + login.json()['token']}
    STAGE = 'api_data'
    user = requests.get(API + '/auth/me', headers=headers, timeout=15).json()
    document = requests.get(API + '/documents/' + DOC_ID, headers=headers, timeout=15).json()
    versions = requests.get(API + f'/documents/{DOC_ID}/versions', headers=headers, timeout=15).json()
    assert any(v.get('id') == VERSION_ID and v.get('processing_warning') for v in versions)
    with sync_playwright() as pw:
        STAGE = 'browser_launch'
        browser = pw.chromium.launch(headless=True, executable_path=CHROME)
        context = browser.new_context(service_workers='block')
        context.add_init_script(f"localStorage.setItem('ged_token', 'synthetic-local-token'); localStorage.setItem('ged_user', {json.dumps(json.dumps(user))});")

        def respond(route):
            path = route.request.url.split('/api/', 1)[-1]
            if path == 'auth/me': body = user
            elif path == f'documents/{DOC_ID}': body = document
            elif path == f'documents/{DOC_ID}/versions': body = versions
            elif path.startswith('read-logs') or path.startswith('tasks'): body = []
            else: body = {}
            route.fulfill(status=200, content_type='application/json', body=json.dumps(body))

        context.route('**/unificado/ged/api/**', respond)
        page = context.new_page()
        page_errors = []
        page.on('pageerror', lambda error: page_errors.append(type(error).__name__))
        preview_requests = []
        page.on('request', lambda request: preview_requests.append(request.url)
                if '/uploads/' in request.url else None)
        STAGE = 'document_navigation'
        response = page.goto(LOCAL + '/documents/' + DOC_ID, wait_until='domcontentloaded', timeout=30000)
        STAGE = 'warning_wait'
        try:
            page.get_by_role('alert').filter(has_text='Carimbo').first.wait_for(timeout=15000)
        except Exception:
            print(json.dumps({'stage': STAGE, 'route': urlparse(page.url).path,
                              'alert_count': page.get_by_role('alert').count(),
                              'alert_has_carimbo': page.get_by_role('alert').evaluate_all(
                                  "els => els.map(el => el.textContent.includes('Carimbo'))"),
                              'heading_count': page.get_by_role('heading').count(),
                              'pageerror_types': page_errors}, ensure_ascii=False))
            raise
        assert not preview_requests, 'malformed PDF preview was requested'
        STAGE = 'complete'
        print(json.dumps({'http_status': response.status, 'real_api_data_rendered_warning': True,
                          'version_id': VERSION_ID, 'malformed_preview_requests': 0}))
        context.close()
        browser.close()


if __name__ == '__main__':
    try:
        main()
    except Exception as error:
        print(f'local real-data render failed: stage={STAGE} error={type(error).__name__}')
        raise SystemExit(1) from None



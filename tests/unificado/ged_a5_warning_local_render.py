"""Read-only local rendering of the GED warning against mocked API data."""
from datetime import datetime, timezone
import json
from playwright.sync_api import sync_playwright

CHROME = r'C:\Program Files\Google\Chrome\Application\chrome.exe'
BASE = 'http://127.0.0.1:13072/unificado/ged'
DOC_ID = 'synthetic-document'
USER = {'id': 'synthetic-user', 'name': 'Teste', 'email': 'test@local.invalid',
        'role': 'ADMIN_MASTER', 'company_id': 'synthetic-company', 'company_slug': 'synthetic'}
STAMP = 'Carimbo não aplicado: processamento excedeu 30 segundos.'
NOW = datetime.now(timezone.utc).isoformat()
DOC = {'id': DOC_ID, 'code': 'E2E', 'name': 'Documento sintético', 'area': 'SGQ',
       'doc_type': 'IT', 'status': 'EM_REVISAO', 'current_revision': 1,
       'current_version_id': 'synthetic-version', 'created_at': NOW,
       'current_file_url': None, 'description': None, 'valid_until': None}
VERSION = {'id': 'synthetic-version', 'revision_number': 1, 'file_name': 'e2e.pdf',
           'uploaded_by_name': 'Teste', 'created_at': NOW, 'processing_warning': STAMP,
           'approval_status': 'PENDENTE'}


def main() -> None:
    with sync_playwright() as pw:
        browser = pw.chromium.launch(headless=True, executable_path=CHROME)
        context = browser.new_context(service_workers='block')
        context.add_init_script(f"localStorage.setItem('ged_token', 'synthetic-token'); localStorage.setItem('ged_user', {json.dumps(json.dumps(USER))});")

        def respond(route):
            path = route.request.url.split('/api/', 1)[-1]
            if path == 'auth/me': body = USER
            elif path == f'documents/{DOC_ID}': body = DOC
            elif path == f'documents/{DOC_ID}/versions': body = [VERSION]
            elif path.startswith('read-logs') or path.startswith('tasks'): body = []
            else: body = {}
            route.fulfill(status=200, content_type='application/json', body=json.dumps(body))

        context.route('**/unificado/ged/api/**', respond)
        page = context.new_page()
        response = page.goto(BASE + '/documents/' + DOC_ID, wait_until='domcontentloaded', timeout=30000)
        page.get_by_role('alert').filter(has_text='Carimbo não aplicado').wait_for(timeout=15000)
        print(json.dumps({'http_status': response.status, 'warning_rendered': True,
                          'route': '/unificado/ged/documents/synthetic-document'}))
        context.close()
        browser.close()


if __name__ == '__main__':
    try:
        main()
    except Exception as error:
        print(f'local warning render failed: {type(error).__name__}')
        raise SystemExit(1) from None

import base64
import hashlib
import hmac
import json
import shlex
import time
import urllib.request
from pathlib import Path

env = {}
for line in Path('/etc/concrefer-unificado/laboratorio.env').read_text().splitlines():
    if '=' in line and not line.startswith('#'):
        key, value = line.split('=', 1)
        parts = shlex.split(value)
        env[key] = parts[0] if parts else ''

payload = {'id': 'smoke-qr-footer', 'name': 'Smoke QR Footer', 'role': 'admin', 'exp': int(time.time()) + 25}
encoded = base64.urlsafe_b64encode(json.dumps(payload, separators=(',', ':')).encode()).rstrip(b'=').decode()
signature = base64.urlsafe_b64encode(hmac.new(env['LAB_GATEWAY_SIGNING_KEY'].encode(), encoded.encode(), hashlib.sha256).digest()).rstrip(b'=').decode()
headers = {'X-Lab-Assertion': encoded + '.' + signature}
base = 'http://127.0.0.1:13064'


def fetch(path):
    with urllib.request.urlopen(urllib.request.Request(base + path, headers=headers), timeout=30) as response:
        assert response.status == 200
        return response.read()


records = json.loads(fetch('/api/ensaios'))
record = next(item for item in records if item.get('status') == 'finalizado')
html = fetch(f"/api/ensaios/{record['id']}/relatorio")
assert html.count(b'class="certificate-qr"') == 1
assert html.index(b'<footer>') < html.index(b'class="certificate-qr"') < html.index(b'Gerente de Qualidade')
assert b'</header><div class="certificate-qr"' not in html
pdf = fetch(f"/api/ensaios/{record['id']}/laudo.pdf")
assert pdf.startswith(b'%PDF-')
out = Path('/tmp/postes-qr-footer-smoke-20261026')
out.mkdir(exist_ok=True)
(out / 'report.html').write_bytes(html)
(out / 'report.pdf').write_bytes(pdf)
print(f'SMOKE_OK=finalized report, HTML footer, PDF {len(pdf)} bytes')

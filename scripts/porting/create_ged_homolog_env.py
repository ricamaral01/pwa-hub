"""Create isolated GED test credentials. Run on the destination VPS as root.

This intentionally does not read or copy any production .env file.
"""

from pathlib import Path
import os
import secrets


target = Path('/opt/concrefer-unificado/homolog-next/ged/.env')
if target.exists():
    raise SystemExit('GED test .env already exists; left unchanged')

target.parent.mkdir(parents=True, exist_ok=True)
values = {
    'PORT': '4000',
    'NODE_ENV': 'production',
    'POSTGRES_DB': 'ged_concrefer_homolog',
    'POSTGRES_USER': 'ged_homolog',
    'POSTGRES_PASSWORD': secrets.token_urlsafe(48),
    'JWT_SECRET': secrets.token_urlsafe(64),
    'GED_GATEWAY_SIGNING_KEY': secrets.token_urlsafe(64),
    'GED_GATEWAY_HOST': '127.0.0.1:13171',
    'GED_UNIFIED_MAP_COOKIE': 'mapa_unificado_homolog_session',
    'GED_UNIFIED_MAP_CHECK_URL': 'https://concrefer.concretrack.com.br:18446/unificado/mapa/api/unified/screen-access/me',
    'GED_DOWNLOAD_COOKIE': 'ged_homolog_download_session',
    'FILE_BASE_URL': 'https://concrefer.concretrack.com.br:18446/unificado/ged',
    'FRONTEND_URL': 'https://concrefer.concretrack.com.br:18446/unificado/ged',
    'CORS_ORIGIN': 'https://concrefer.concretrack.com.br:18446',
    'GED_DISABLE_EMAIL_ALERTS': '1',
    'GED_RNC_READONLY': '1',
    'SMTP_HOST': '127.0.0.1',
    'SMTP_PORT': '9',
    'SMTP_USER': '',
    'SMTP_PASS': '',
    'EMAIL_FROM': 'homolog@invalid.local',
}
fd = os.open(target, os.O_CREAT | os.O_EXCL | os.O_WRONLY, 0o600)
with os.fdopen(fd, 'w', encoding='utf-8') as output:
    for key, value in values.items():
        output.write(f'{key}={value}\n')
print('Created isolated GED test credentials')

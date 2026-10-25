"""Runs on the destination VPS; does not print or persist the JWT."""
import subprocess

token = subprocess.run(
    ['docker', 'exec', 'ged_backend', 'node', '/tmp/a3-token-for-smoke.js'],
    check=True, text=True, capture_output=True,
).stdout.strip()
if not token:
    raise SystemExit('JWT de teste ausente')
url = 'https://concrefer.concretrack.com.br/unificado/ged/uploads/obsoletos/IT-CQC-03_Rev01.doc'
config = f'cookie = "ged_download_session={token}"\n'
result = subprocess.run(
    ['curl', '--silent', '--show-error', '--output', '/dev/null', '--write-out', '%{http_code} %{size_download}',
     '--resolve', 'concrefer.concretrack.com.br:443:127.0.0.1', '--config', '-', url],
    input=config, text=True, capture_output=True, check=True,
)
status, size = result.stdout.strip().split()
if status != '200' or size != '408064':
    raise SystemExit(f'Download HTTPS inesperado: status={status}, bytes={size}')
print('Download HTTPS com cookie válido: 200, 408064 bytes')

auth_config = f'header = "Authorization: Bearer {token}"\n'
me = subprocess.run(
    ['curl', '--silent', '--show-error', '--output', '/dev/null', '--write-out', '%{http_code}',
     '--resolve', 'concrefer.concretrack.com.br:443:127.0.0.1', '--config', '-',
     'https://concrefer.concretrack.com.br/unificado/ged/api/auth/me'],
    input=auth_config, text=True, capture_output=True, check=True,
)
if me.stdout.strip() != '200':
    raise SystemExit(f'API me com Bearer inesperada: {me.stdout.strip()}')
cookie_only = subprocess.run(
    ['curl', '--silent', '--show-error', '--output', '/dev/null', '--write-out', '%{http_code}',
     '--resolve', 'concrefer.concretrack.com.br:443:127.0.0.1', '--config', '-',
     'https://concrefer.concretrack.com.br/unificado/ged/api/auth/me'],
    input=config, text=True, capture_output=True, check=True,
)
if cookie_only.stdout.strip() != '401':
    raise SystemExit(f'API me aceitou cookie de download: {cookie_only.stdout.strip()}')
print('API HTTPS: Bearer 200, cookie de download isolado 401')

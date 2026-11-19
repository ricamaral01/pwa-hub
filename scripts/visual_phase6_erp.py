"""Run the published closing report against an offline, isolated test database."""
import gzip, hashlib, json, os, secrets, shlex, shutil, subprocess
from pathlib import Path

H = Path('/opt/concrefer-unificado/homolog-next')
S = H / 'staging/visual-completo'
G = H / 'visual-full/erp'
E = Path('/etc/concrefer-unificado/homolog')
DB = 'erp_visual_homolog_20261118'
B = Path(json.loads((S / 'backup-ready.json').read_text())['backup'])

def run(args, **kwargs):
    return subprocess.run(args, check=True, **kwargs)

def sql(db, body):
    assert db in ('postgres', DB)
    return subprocess.check_output(['sudo', '-u', 'postgres', 'psql', '-XAt', '-v', 'ON_ERROR_STOP=1', '-d', db], input=body, text=True)

def env(name):
    values = {}
    for line in (E / name).read_text().splitlines():
        parts = shlex.split(line)
        if len(parts) == 1 and '=' in parts[0]:
            k, v = parts[0].split('=', 1)
            values[k] = v
    return values

G.mkdir(exist_ok=True)
if sql('postgres', f"SELECT count(*) FROM pg_database WHERE datname='{DB}';").strip() == '0':
    run(['sudo', '-u', 'postgres', 'createdb', DB])
    # The database is new and empty; retain a dump before applying offline schema.
    with (B / (DB + '-before-restore.dump')).open('wb') as output:
        run(['sudo', '-u', 'postgres', 'pg_dump', '-Fc', DB], stdout=output)
    source = gzip.decompress((S / 'erp-offline.sql.gz').read_bytes()).decode()
    source = '\n'.join(line for line in source.splitlines() if not line.startswith(('\\restrict', '\\unrestrict', 'SET transaction_timeout')))
    sql(DB, source)

role = 'visual_erp_homolog_reader'
if not (E / 'visual-erp.env').exists():
    password = secrets.token_urlsafe(36)
    sql('postgres', f"CREATE ROLE {role} LOGIN PASSWORD '{password}';")
    sql(DB, f'GRANT CONNECT ON DATABASE {DB} TO {role}; GRANT USAGE ON SCHEMA public TO {role}; GRANT SELECT ON ALL TABLES IN SCHEMA public TO {role};')
    values = {'POSTGRES_URL': f'postgresql://{role}:{password}@127.0.0.1:5432/{DB}',
              'SECRET_KEY': secrets.token_urlsafe(48), 'ADMIN_USER': 'disabled-homolog',
              'ADMIN_PASSWORD': secrets.token_urlsafe(48),
              'MAPA_USINA_INTEGRATION_KEY': env('visual-reporting.env')['MAPA_USINA_INTEGRATION_KEY']}
    p = E / 'visual-erp.env'
    p.write_text(''.join(k + '=' + shlex.quote(v) + '\n' for k, v in values.items()))
    p.chmod(0o600)

# Source was downloaded by SFTP, without reading any production database/env file.
for name in ('api/settings.py', 'api/routers/relatorios.py'):
    target = G / name
    target.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(S / 'erp-source' / name, target)
    if name.endswith('relatorios.py'):
        # Keep the published unavailable-source fallback without outbound calls.
        target.write_text(target.read_text().replace('https://docs.google.com', 'http://127.0.0.1:14153'))
(G / 'api/__init__.py').touch()
(G / 'api/routers/__init__.py').touch()
(G / 'entry.py').write_text('from fastapi import FastAPI\nfrom api.routers.relatorios import router\napp=FastAPI()\napp.include_router(router,prefix="/api")\n')
venv = H / 'visual-full/reporting/.venv'
run([str(venv / 'bin/python'), '-c', 'import fastapi,psycopg2,dotenv'])
unit = Path('/etc/systemd/system/unificado-visual-homolog-erp.service')
unit.write_text('[Unit]\nDescription=Published closing report on offline homolog data\nAfter=postgresql.service\n[Service]\n'
                'WorkingDirectory=' + str(G) + '\nEnvironmentFile=' + str(E / 'visual-erp.env') + '\n'
                'ExecStart=' + str(venv / 'bin/python') + ' -m uvicorn entry:app --host 127.0.0.1 --port 14189\n'
                'Restart=on-failure\nNoNewPrivileges=true\nPrivateTmp=true\nProtectHome=true\nProtectSystem=strict\n'
                'IPAddressDeny=any\nIPAddressAllow=localhost\n')
run(['systemctl', 'daemon-reload'])
run(['systemctl', 'restart', unit.name])

snippet = Path('/etc/nginx/snippets/visual-full-unificado-screen-access-homolog.conf')
old = snippet.read_text()
if 'location = /unificado/relatorios/api/fechamento-diario' not in old:
    shutil.copy2(snippet, B / 'screen-access-before-erp.conf')
    snippet.write_text(old + '''
    location = /unificado/relatorios/api/fechamento-diario {
        auth_request /unificado/screen-authorize;
        error_page 401 403 = @unificado_api_denied;
        limit_except GET HEAD { deny all; }
        proxy_pass http://127.0.0.1:14189/api/relatorios/fechamento-diario;
        proxy_set_header Host $host;
        proxy_set_header Cookie "";
        add_header Cache-Control "no-store" always;
    }
''')
    try:
        run(['nginx', '-t'], capture_output=True)
        run(['systemctl', 'reload', 'nginx'])
    except Exception:
        snippet.write_text(old)
        raise
result = {'database': DB, 'port': 14189, 'source': 'published ERP source via SFTP',
          'offline_snapshot': '2026-08-29', 'database_access': 'dedicated SELECT-only role',
          'network_access': 'localhost only; Mapa/PCP homolog integration and local REST',
          'external_credentials_copied': False, 'production_database_connections': 0,
          'production_services_modified': False}
(S / 'phase6-erp.json').write_text(json.dumps(result, indent=2))
print(json.dumps(result))

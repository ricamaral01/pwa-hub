"""Build short-lived browser cookies from the isolated Mapa test database.

The tokens stay in process memory and are never printed or written to disk.
"""

import json
import subprocess


REMOTE_SCRIPT = r'''
import json
from pathlib import Path
import psycopg
from itsdangerous import URLSafeTimedSerializer

values = {}
for line in Path('/etc/concrefer-unificado/homolog/mapa-auth.env').read_text().splitlines():
    if '=' in line and not line.startswith('#'):
        key, value = line.split('=', 1)
        values[key] = value.strip().strip('"').strip("'")

with psycopg.connect(values['MAPA_AUTH_DATABASE_URL']) as conn:
    with conn.cursor() as cur:
        cur.execute("SELECT id, updated_at FROM public.usuarios WHERE id = 'user-ricardo' AND ativo")
        ricardo = cur.fetchone()
        cur.execute("SELECT id, updated_at FROM public.usuarios WHERE id <> 'user-ricardo' AND ativo ORDER BY id LIMIT 1")
        unlinked = cur.fetchone()

signer = URLSafeTimedSerializer(values['MAPA_AUTH_SIGNING_KEY'], salt='mapa-login-v1')
def signed(row):
    return signer.dumps({'scope': 'session', 'id': row[0], 'updated_at': row[1].isoformat()})

print(json.dumps({'ricardo': signed(ricardo), 'unlinked': signed(unlinked)}))
'''


def test_cookies():
    result = subprocess.run(
        ['ssh', 'vps-staging',
         '/opt/concrefer-unificado/homolog-next/mapa-api/.venv/bin/python', '-'],
        input=REMOTE_SCRIPT, text=True, capture_output=True, check=True,
    )
    return json.loads(result.stdout)


def test_cookie_for(user_id: str) -> str:
    """Sign a session for a test-database account; keep the value in memory."""
    if not user_id or len(user_id) > 80 or any(ch not in 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789_-' for ch in user_id):
        raise ValueError('invalid test user id')
    script = REMOTE_SCRIPT.replace(
        "cur.execute(\"SELECT id, updated_at FROM public.usuarios WHERE id = 'user-ricardo' AND ativo\")",
        "cur.execute(\"SELECT id, updated_at FROM public.usuarios WHERE id = %s AND ativo\", (" + json.dumps(user_id) + ",))"
    )
    script = script.replace(
        "print(json.dumps({'ricardo': signed(ricardo), 'unlinked': signed(unlinked)}))",
        "print(signed(ricardo))"
    )
    result = subprocess.run(
        ['ssh', 'vps-staging',
         '/opt/concrefer-unificado/homolog-next/mapa-api/.venv/bin/python', '-'],
        input=script, text=True, capture_output=True, check=True,
    )
    return result.stdout.strip()

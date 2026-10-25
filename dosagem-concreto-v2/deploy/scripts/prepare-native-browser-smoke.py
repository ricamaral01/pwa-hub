"""Prepare a short-lived read-only browser session for the native UI smoke.

The session is written to a protected local file and never printed.
"""

import json
from pathlib import Path

import psycopg
from psycopg.rows import dict_row
from itsdangerous import URLSafeTimedSerializer


def env_value(key):
    for line in Path('/etc/mapa-unificado/auth.env').read_text().splitlines():
        if line.startswith(key + '='):
            return line.split('=', 1)[1].strip().strip('"\'')
    raise RuntimeError(f'Missing {key}')


def main():
    with psycopg.connect(env_value('MAPA_AUTH_DATABASE_URL'), row_factory=dict_row) as conn:
        user = conn.execute('SELECT id,nome,perfil,setor,ativo,primeiro_acesso,updated_at '
                            'FROM public.usuarios WHERE id=%s', ('user-ricardo',)).fetchone()
    if not user or not user['ativo'] or user['primeiro_acesso']:
        raise RuntimeError('Test identity unavailable')
    token = URLSafeTimedSerializer(env_value('MAPA_AUTH_SIGNING_KEY'), salt='mapa-login-v1').dumps({
        'scope': 'session', 'id': user['id'], 'updated_at': user['updated_at'].isoformat()})
    result = {'cookie': token, 'user': {'id': user['id'], 'name': user['nome'],
                                       'role': user['perfil'], 'setor': user['setor'] or 'Todos'}}
    target = Path('/root/dosagem-native-browser-session.json')
    target.write_text(json.dumps(result))
    target.chmod(0o600)
    print('Protected browser test session prepared')


if __name__ == '__main__':
    main()

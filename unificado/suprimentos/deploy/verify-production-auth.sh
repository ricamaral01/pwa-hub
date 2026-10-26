#!/usr/bin/env bash
set -euo pipefail
set -a
. /etc/concrefer-unificado/prod/suprimentos.env
set +a
/opt/concrefer-unificado/suprimentos/venv/bin/python - <<'PY'
import json
import os
import sys
from urllib.error import HTTPError
from urllib.request import Request, urlopen

sys.path.insert(0, '/opt/concrefer-unificado/suprimentos/service')
from suprimentos.auth import sign_assertion

endpoint = 'http://127.0.0.1:13267/api/suprimentos/me?unidade=campinas'
secret = os.environ['SUPRIMENTOS_GATEWAY_SIGNING_KEY']
for user in ('user-ricardo', 'marcelo', 'alex'):
    req = Request(endpoint, headers={
        'X-Suprimentos-Assertion': sign_assertion(user, user, secret)})
    with urlopen(req, timeout=5) as response:
        data = json.load(response)
    assert {('ADMIN', None), ('APROVADOR', 1), ('APROVADOR', 2)} <= {
        (role['papel'], role['nivel']) for role in data['papeis']}, user
    assert data['flags']['S1'] is True, user
    print('AUTH_MASTER_OK', user)

req = Request(endpoint, headers={
    'X-Suprimentos-Assertion': sign_assertion('sem-papel-teste', 'Teste', secret)})
try:
    urlopen(req, timeout=5)
    raise AssertionError('Unauthorized role accepted')
except HTTPError as error:
    assert error.code == 403, error.code
print('AUTH_NO_ROLE_403_OK')

sys.path.insert(0, '/opt/concrefer-unificado/mapa-api')
from screen_access import allowed_screens
for user in ('user-ricardo', 'marcelo', 'alex'):
    screens = allowed_screens({'id': user, 'perfil': 'ADMIN', 'nome': user}, None, {}, frozenset())
    assert len([s for s in screens if s.startswith('suprimentos')]) == 10
print('IAM_MASTER_SCREENS_10_OK')
PY

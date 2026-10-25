"""Exercise the isolated GED SSO backend against a restored test database only."""
from __future__ import annotations

import base64
import hashlib
import hmac
import json
import subprocess
import time
import urllib.error
import urllib.request


KEY = b'synthetic-ged-gateway-key-for-isolated-contract-test'
USER_ID = 'sso-contract-fixture'


def remote() -> None:
    # This code executes on the VPS. Port 13074 and database ged_sso_20261016
    # belong to the isolated candidate, never to the published GED.
    def call(path, scope, ged_id, body=None, action=''):
        raw = json.dumps(body or {}, ensure_ascii=False, separators=(',', ':')).encode()
        claim = {'iss': 'unificado', 'aud': 'ged', 'scope': scope,
                 'mapa_user_id': USER_ID, 'ged_user_id': ged_id,
                 'exp': int(time.time()) + 20}
        if scope == 'admin':
            claim.update(actor='user-ricardo', action=action,
                         body_sha256=hashlib.sha256(raw).hexdigest())
        payload = base64.urlsafe_b64encode(json.dumps(
            claim, ensure_ascii=False, separators=(',', ':')).encode()).rstrip(b'=')
        signature = base64.urlsafe_b64encode(
            hmac.new(KEY, payload, hashlib.sha256).digest()).rstrip(b'=')
        headers = {'Host': '127.0.0.1:13071', 'X-GED-Assertion':
                   (payload + b'.' + signature).decode(),
                   'Content-Type': 'application/json'}
        request = urllib.request.Request(
            'http://127.0.0.1:13074/api/unified/' + path, headers=headers,
            data=raw if scope == 'admin' else None,
            method='POST' if scope == 'admin' else 'GET')
        try:
            with urllib.request.urlopen(request, timeout=8) as response:
                return response.status, json.load(response)
        except urllib.error.HTTPError as error:
            return error.code, {}

    grant = {'name': 'Teste isolado SSO', 'role': 'LEITOR', 'ged_user_id': None}
    status, result = call(f'users/{USER_ID}/grant', 'admin', '', grant, 'grant')
    assert status == 201, status
    ged_id = result['user']['id']
    status, _ = call('session', 'session', ged_id)
    assert status == 200, status
    status, _ = call(f'users/{USER_ID}/revoke', 'admin', ged_id,
                     {'ged_user_id': ged_id}, 'revoke')
    assert status == 200, status
    status, _ = call('session', 'session', ged_id)
    assert status == 403, status
    status, result = call(f'users/{USER_ID}/grant', 'admin', ged_id,
                          {'name': 'Teste isolado SSO', 'role': 'LEITOR',
                           'ged_user_id': ged_id}, 'grant')
    assert status == 200 and result['user']['id'] == ged_id, status
    print(json.dumps({'grant': 201, 'session': 200, 'revoke': 200,
                      'revoked_session': 403, 'regrant_same_user': 200}))


if __name__ == '__main__':
    source = open(__file__, encoding='utf-8').read()
    marker = 'if __name__ == '\
             "'__main__':"
    source = source.split(marker)[0] + '\nremote()\n'
    result = subprocess.run(['ssh', '-o', 'BatchMode=yes', 'vps-staging',
                             'python3 -'], input=source, text=True,
                            capture_output=True, check=True)
    print(result.stdout.strip())

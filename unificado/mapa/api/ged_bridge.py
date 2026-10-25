"""Short-lived assertions between Unificado and the GED loopback gateway."""
from __future__ import annotations

import base64
import hashlib
import hmac
import json
import os
import time
import urllib.error
import urllib.request


def _key() -> bytes:
    key = os.environ.get('GED_GATEWAY_SIGNING_KEY', '').encode()
    if len(key) < 32:
        raise RuntimeError('GED gateway key unavailable')
    return key


def assertion(mapa_user_id: str, ged_user_id: str, *, scope: str,
              actor: str = '', action: str = '', body: dict | None = None) -> str:
    claim = {'iss': 'unificado', 'aud': 'ged', 'scope': scope,
             'mapa_user_id': mapa_user_id, 'ged_user_id': ged_user_id,
             'exp': int(time.time()) + 20}
    if scope == 'admin':
        raw = json.dumps(body or {}, ensure_ascii=False, separators=(',', ':')).encode()
        claim.update(actor=actor, action=action,
                     body_sha256=hashlib.sha256(raw).hexdigest())
    payload = base64.urlsafe_b64encode(json.dumps(
        claim, ensure_ascii=False, separators=(',', ':')).encode()).rstrip(b'=')
    signature = base64.urlsafe_b64encode(
        hmac.new(_key(), payload, hashlib.sha256).digest()).rstrip(b'=')
    return (payload + b'.' + signature).decode()


def admin_request(mapa_user_id: str, ged_user_id: str, action: str,
                  body: dict) -> dict:
    if action not in {'grant', 'revoke'}:
        raise ValueError('Invalid GED action')
    raw = json.dumps(body, ensure_ascii=False, separators=(',', ':')).encode()
    token = assertion(mapa_user_id, ged_user_id, scope='admin',
                      actor='user-ricardo', action=action, body=body)
    gateway = os.environ.get('GED_GATEWAY_INTERNAL_URL', 'http://127.0.0.1:13071')
    if not gateway.startswith('http://127.0.0.1:'):
        raise RuntimeError('GED gateway must be loopback')
    request = urllib.request.Request(
        f'{gateway}/api/unified/users/{mapa_user_id}/{action}',
        data=raw, method='POST', headers={
            'Host': '127.0.0.1:13071', 'Content-Type': 'application/json',
            'X-GED-Assertion': token,
        })
    with urllib.request.urlopen(request, timeout=8) as response:
        return json.load(response)

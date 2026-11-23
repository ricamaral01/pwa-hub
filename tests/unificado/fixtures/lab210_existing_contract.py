"""Frozen existing H contracts, used only by isolated tests; no app imports."""
import base64,hashlib,hmac,json,os
from datetime import datetime,timezone
from types import SimpleNamespace
from fastapi import Request

def parse_qr(raw: str):
    parsed = {}
    for part in raw.split('|'):
        if '=' in part:
            key, value = part.split('=', 1)
            parsed[key.strip().lower()] = value.strip()
    return parsed

def parse_date(value):
    if not value or str(value).strip() in {'—', 'â€”'}:
        return None
    for fmt in ('%Y-%m-%d', '%d-%m-%y', '%d-%m-%Y', '%d/%m/%Y'):
        try:
            return datetime.strptime(str(value).strip(), fmt).date().isoformat()
        except ValueError:
            pass
    return None

def canonical_cp(value):
    value = str(value or '').strip().lstrip("'")
    return {'1/2': '1', '2/2': '2'}.get(value, value or None)

def gateway_user(request: Request):
    """Accept only a short-lived assertion from the local unified proxy."""
    if os.getenv('LAB_UNIFIED_COPY') != '1' or request.client is None or request.client.host != '127.0.0.1':
        return None
    secret = os.getenv('LAB_GATEWAY_SIGNING_KEY', '')
    value = request.headers.get('x-lab-assertion', '')
    if len(secret) < 32 or len(value) > 2048 or value.count('.') != 1:
        return None
    try:
        encoded, signature = value.split('.', 1)
        expected = base64.urlsafe_b64encode(hmac.new(secret.encode(), encoded.encode(), hashlib.sha256).digest()).rstrip(b'=').decode()
        if not hmac.compare_digest(signature, expected):
            return None
        payload = json.loads(base64.urlsafe_b64decode(encoded + '=' * (-len(encoded) % 4)))
        name = payload.get('name')
        role = payload.get('role')
        if not isinstance(payload.get('id'), str) or not isinstance(name, str) or (not name.strip()) or (len(name) > 200) or (role not in {'tecnico', 'engenheiro', 'admin'}):
            return None
        if not isinstance(payload.get('exp'), int) or not 0 <= payload['exp'] - int(datetime.now(timezone.utc).timestamp()) <= 30:
            return None
        crono_screens = payload.get('crono_screens', [])
        crono_actions = payload.get('crono_actions', [])
        if not isinstance(crono_screens, list) or not isinstance(crono_actions, list) or any((not isinstance(item, str) or not item.startswith('cronoanalise.') for item in crono_screens)) or any((not isinstance(item, str) or not item.startswith('laboratorio.cronoanalise.') for item in crono_actions)):
            return None
        return SimpleNamespace(id=payload['id'], username=name.strip(), role=role, active=True, crono_screens=frozenset(crono_screens), crono_actions=frozenset(crono_actions))
    except (ValueError, TypeError, KeyError):
        return None

import base64
import hashlib
import hmac
import json
import time
from types import SimpleNamespace

import pytest

from app.erros import ErroAPI
from app.unified_gateway import unified_user


KEY = "u" * 48


def assertion(**overrides):
    claims = {"id": "ricardo", "name": "Ricardo", "dosagem": True,
              "dosagem_role": "laboratorista", "exp": int(time.time()) + 20}
    claims.update(overrides)
    payload = base64.urlsafe_b64encode(json.dumps(claims).encode()).rstrip(b"=").decode()
    signature = base64.urlsafe_b64encode(hmac.new(KEY.encode(), payload.encode(), hashlib.sha256).digest()).rstrip(b"=").decode()
    return payload + "." + signature


class Session:
    def __init__(self):
        self.user = None

    def get(self, _type, _email):
        return self.user

    def add(self, user):
        self.user = user

    def flush(self):
        pass


def test_gateway_creates_lab_identity_and_reuses_it():
    session = Session()
    request = SimpleNamespace(client=SimpleNamespace(host="127.0.0.1"))
    user = unified_user(session, request, assertion(), KEY)
    assert user.email == "unificado-ricardo@concretrack.local"
    assert user.papel == "laboratorista"
    assert unified_user(session, request, assertion(), KEY) is user


@pytest.mark.parametrize("claim", [{"dosagem": False}, {"exp": 1}])
def test_gateway_rejects_wrong_scope_or_expiry(claim):
    with pytest.raises(ErroAPI) as error:
        unified_user(Session(), SimpleNamespace(client=SimpleNamespace(host="127.0.0.1")), assertion(**claim), KEY)
    assert error.value.codigo == "NAO_AUTENTICADO"


def test_gateway_rejects_direct_client_and_tampering():
    with pytest.raises(ErroAPI):
        unified_user(Session(), SimpleNamespace(client=SimpleNamespace(host="198.51.100.2")), assertion(), KEY)
    with pytest.raises(ErroAPI):
        unified_user(Session(), SimpleNamespace(client=SimpleNamespace(host="127.0.0.1")), assertion()[:-1] + "x", KEY)


def test_gateway_updates_role_from_signed_unificado_permission():
    session = Session()
    request = SimpleNamespace(client=SimpleNamespace(host="127.0.0.1"))
    user = unified_user(session, request, assertion(), KEY)
    assert user.papel == "laboratorista"
    assert unified_user(session, request, assertion(dosagem_role="admin"), KEY).papel == "admin"

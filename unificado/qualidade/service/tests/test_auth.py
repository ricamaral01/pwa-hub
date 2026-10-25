import base64
import hashlib
import hmac
import json

import pytest
from fastapi import HTTPException

from quality.auth import decode_assertion

SECRET = "s" * 40


def token(payload):
    encoded = base64.urlsafe_b64encode(json.dumps(payload).encode()).rstrip(b"=").decode()
    signature = base64.urlsafe_b64encode(hmac.new(SECRET.encode(), encoded.encode(), hashlib.sha256).digest()).rstrip(b"=").decode()
    return f"{encoded}.{signature}"


def test_all_grants_are_preserved():
    value = token({"id": "42", "name": "Pessoa", "iss": "unificado", "exp": 120,
                   "actions": ["qualidade.nc.abrir", "qualidade.nc.triar"]})
    user = decode_assertion(value, SECRET, now=100)
    assert user.has("qualidade.nc.abrir") and user.has("qualidade.nc.triar")
    assert not user.has("qualidade.nc.encerrar")


def test_expiry_and_signature_are_rejected():
    value = token({"id": "42", "name": "Pessoa", "iss": "unificado", "exp": 120, "actions": []})
    with pytest.raises(HTTPException):
        decode_assertion(value, SECRET, now=121)
    with pytest.raises(HTTPException):
        decode_assertion(value[:-1] + ("A" if value[-1] != "A" else "B"), SECRET, now=100)

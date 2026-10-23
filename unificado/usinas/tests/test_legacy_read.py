"""Contract checks for the Campinas read-only ERP bridge."""

import io
from pathlib import Path
import sys
from unittest import TestCase
from unittest.mock import patch

from flask import Flask

sys.path.insert(0, str(Path(__file__).resolve().parents[2] / "mapa" / "api"))
from usinas_legacy_read import register  # noqa: E402


class Upstream(io.BytesIO):
    status = 200

    def __init__(self, body=b'{"ok":true}', cookie=False):
        super().__init__(body)
        class Headers(dict):
            def get_all(self, key, default=None):
                return (["ct_session=abc.def; HttpOnly; Path=/concretrack/"]
                        if cookie and key == "Set-Cookie" else default or [])
        self.headers = Headers({"Content-Type": "application/json"})


class BridgeTest(TestCase):
    def setUp(self):
        self.app = Flask(__name__)
        register(self.app, lambda: {"id": "user-ricardo"}, lambda _: ({"usinasInicio"}, None))
        self.client = self.app.test_client()

    def test_login_cookie_and_allowed_get(self):
        with patch("usinas_legacy_read.urllib.request.urlopen", return_value=Upstream(cookie=True)):
            response = self.client.post("/usina/legacy/login", base_url="https://localhost", json={"username": "u", "password": "p"})
        self.assertEqual(response.status_code, 200)
        self.assertIn("HttpOnly", response.headers["Set-Cookie"])
        self.assertIn("Secure", response.headers["Set-Cookie"])
        self.client.set_cookie("usinas_legacy_session", "abc.def", path="/", secure=True)
        with patch("usinas_legacy_read.urllib.request.urlopen", return_value=Upstream()) as call:
            response = self.client.get("/usina/legacy/estoque/saldo", base_url="https://localhost")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(call.call_args.args[0].get_method(), "GET")

    def test_only_explicit_get_routes(self):
        self.client.set_cookie("usinas_legacy_session", "abc.def")
        self.assertEqual(self.client.get("/usina/legacy/auth/users").status_code, 404)
        self.assertEqual(self.client.post("/usina/legacy/estoque/saldo").status_code, 405)

    def test_unificado_permission_is_required(self):
        app = Flask("forbidden")
        register(app, lambda: {"id": "other"}, lambda _: (set(), None))
        client = app.test_client()
        self.assertEqual(client.get("/usina/legacy/estoque/saldo").status_code, 403)

"""Campinas CEC access and reading contract."""

import io
import json
from pathlib import Path
import sys
from unittest import TestCase
from unittest.mock import patch

from flask import Flask

sys.path.insert(0, str(Path(__file__).resolve().parents[2] / "mapa" / "api"))
from usinas_cec import register  # noqa: E402


class Upstream(io.BytesIO):
    status = 200

    def __init__(self, payload=None):
        super().__init__(json.dumps(payload or {"ok": True, "rows": []}).encode())


class CecApiTest(TestCase):
    def setUp(self):
        app = Flask(__name__)
        register(app, lambda: {"id": "user-ricardo", "nome": "Ricardo"},
                 lambda _: ({"usinasInicio"}, None))
        self.client = app.test_client()

    def test_read_uses_new_local_service(self):
        with patch("usinas_cec.urllib.request.urlopen", return_value=Upstream()) as call:
            response = self.client.get("/usina/cec/resultados?mes=10&ano=2026")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(call.call_args.args[0].full_url,
                         "http://127.0.0.1:3086/api/controle-estatistico/v2/rompimentos-grupos?mes=10&ano=2026")

    def test_reading_parses_qr_and_preserves_id(self):
        reading_id = "db0977b0-5a84-449f-8bc0-73a505205622"
        payload = {"id": reading_id,
                   "qr_raw": "TRACO=29689|CP=1/2|IDADE=7|MOLD=01-10-26|NS=123",
                   "resistencia_mpa": 32.5, "timestamp": "2026-10-23T12:00:00Z"}
        with patch("usinas_cec.urllib.request.urlopen", return_value=Upstream()) as call:
            response = self.client.post("/usina/cec/leituras", json=payload)
        self.assertEqual(response.status_code, 200)
        body = json.loads(call.call_args.args[0].data)
        self.assertEqual((body["id"], body["traco_id"], body["cp"], body["idade_dias"]),
                         (reading_id, "29689", "1", 7))
        self.assertEqual(body["data_moldagem"], "2026-10-01")
        self.assertEqual(body["responsavel"], "Ricardo")

    def test_invalid_reading_never_reaches_service(self):
        with patch("usinas_cec.urllib.request.urlopen") as call:
            response = self.client.post("/usina/cec/leituras", json={"qr_raw": "bad", "resistencia_mpa": 0})
        self.assertEqual(response.status_code, 400)
        call.assert_not_called()

    def test_unified_permission_is_required(self):
        app = Flask("forbidden-cec")
        register(app, lambda: {"id": "other"}, lambda _: (set(), None))
        self.assertEqual(app.test_client().get("/usina/cec/resultados").status_code, 403)

"""Access and method gates for the private financial reporting proxy."""

import io
from pathlib import Path
import sys
from unittest import TestCase
from unittest.mock import patch

from flask import Flask

sys.path.insert(0, str(Path(__file__).resolve().parents[2] / "mapa" / "api"))
from usinas_reporting import register  # noqa: E402


class Upstream(io.BytesIO):
    status = 200

    def __init__(self):
        super().__init__(b'{"materiais":[]}')


class FakeCursor:
    def __enter__(self):
        return self

    def __exit__(self, *_):
        return None

    def execute(self, _query):
        pass

    def fetchall(self):
        return [{"origem_tabela": "reporting.tbl_massadas", "source_count": 1,
                 "mirror_count": 1, "age_seconds": 20}]


class FakeConnection:
    def __enter__(self):
        return self

    def __exit__(self, *_):
        return None

    def cursor(self):
        return FakeCursor()


class ReportingApiTest(TestCase):
    def make_client(self, user, screens):
        app = Flask(__name__)
        register(app, FakeConnection, lambda: user, lambda _: (screens, None))
        return app.test_client()

    def test_requires_session_and_usinas_access(self):
        self.assertEqual(self.make_client(None, set()).get(
            "/usina/reporting/relatorios/custos").status_code, 401)
        self.assertEqual(self.make_client({"id": "x"}, set()).get(
            "/usina/reporting/relatorios/custos").status_code, 403)
        self.assertEqual(self.make_client({"id": "guest", "perfil": "CONVIDADO"},
                                          {"usinasInicio"}).get(
            "/usina/reporting/relatorios/custos").status_code, 403)

    def test_explicit_get_only_and_status(self):
        client = self.make_client({"id": "user-ricardo", "perfil": "GERENCIA"},
                                  {"usinasInicio"})
        self.assertEqual(client.get("/usina/reporting/relatorios/custos/ajustes").status_code, 404)
        self.assertEqual(client.post("/usina/reporting/relatorios/custos").status_code, 405)
        with patch("usinas_reporting.urllib.request.urlopen", return_value=Upstream()) as call:
            response = client.get("/usina/reporting/relatorios/custos?meses=12")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json, {"materiais": []})
        self.assertEqual(call.call_args.args[0].get_method(), "GET")
        self.assertEqual(client.get("/usina/reporting/status").json["fonte"], "espelho")

    def test_laboratorio_permission_reads_reports(self):
        client = self.make_client({"id": "laboratorio", "perfil": "LABORATORIO"},
                                  {"labUsinasRelatorios"})
        with patch("usinas_reporting.urllib.request.urlopen", return_value=Upstream()):
            self.assertEqual(client.get("/usina/reporting/relatorios/custos").status_code, 200)
        self.assertEqual(client.get("/usina/reporting/status").status_code, 200)

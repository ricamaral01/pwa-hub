from __future__ import annotations

import sys
import unittest
from pathlib import Path

from flask import Flask

sys.path.insert(0, str(Path(__file__).resolve().parents[2] / "mapa" / "api"))
from usinas_receitas import register  # noqa: E402


class FakeCursor:
    def __init__(self):
        self.query = ""

    def __enter__(self):
        return self

    def __exit__(self, *_):
        return None

    def execute(self, query):
        self.query = query

    def fetchall(self):
        return [{"id": 12, "nome_traco": "C30", "_source_hash": "a" * 64}]

    def fetchone(self):
        return {"source_count": 1, "mirror_count": 1, "last_error": None,
                "age_seconds": 10}


class FakeConnection:
    def __enter__(self):
        return self

    def __exit__(self, *_):
        return None

    def cursor(self):
        return FakeCursor()


class ReadApiTest(unittest.TestCase):
    def build(self, user, allowed):
        app = Flask(__name__)
        opened = []

        def connect():
            opened.append(True)
            return FakeConnection()

        register(app, connect, lambda: user, lambda _user: (allowed, None))
        return app.test_client(), opened

    def test_anonymous_is_rejected_before_database(self):
        client, opened = self.build(None, [])
        self.assertEqual(client.get("/usina/receitas").status_code, 401)
        self.assertEqual(opened, [])

    def test_user_without_usinas_is_rejected_before_database(self):
        client, opened = self.build({"id": "guest"}, [])
        self.assertEqual(client.get("/usina/receitas").status_code, 403)
        self.assertEqual(opened, [])

    def test_authorized_user_reads_mirror_and_sees_editing_disabled(self):
        client, opened = self.build({"id": "master"}, ["usinasInicio"])
        response = client.get("/usina/receitas")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json["rows"][0]["id"], 12)
        self.assertEqual(response.json["fonte"], "espelho")
        self.assertFalse(response.json["edicao_habilitada"])
        self.assertEqual(len(opened), 1)
        self.assertEqual(response.headers["Cache-Control"], "no-store")


if __name__ == "__main__":
    unittest.main()

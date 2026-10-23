"""Exercise the deployed read route using the production Mapa DB role.

Uses a local Flask test client and an injected permitted test identity. It
does not mint a user session, issue a public authenticated request or print
recipe contents.
"""

import os
import sys

import psycopg
from psycopg.rows import dict_row
from flask import Flask

sys.path.insert(0, "/opt/concrefer-unificado/mapa-api")
from usinas_receitas import register  # noqa: E402


def connect():
    return psycopg.connect(os.environ["MAPA_AUTH_DATABASE_URL"], row_factory=dict_row)


app = Flask(__name__)
register(app, connect, lambda: {"id": "probe-local"},
         lambda _user: (["usinasInicio"], None))
response = app.test_client().get("/usina/receitas")
assert response.status_code == 200, response.status_code
body = response.get_json()
assert body["edicao_habilitada"] is False
assert body["fonte"] == "espelho"
assert body["sync"]["last_error"] is None
assert len(body["rows"]) == body["sync"]["mirror_count"]
print("api_read_ok", len(body["rows"]), "edicao_habilitada", body["edicao_habilitada"])

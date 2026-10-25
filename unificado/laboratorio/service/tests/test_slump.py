from datetime import datetime, timezone
from pathlib import Path
from types import SimpleNamespace
import sys

from fastapi import FastAPI
from fastapi.testclient import TestClient

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from server.postes_api import current_user, db
from server.slump_api import router


class Result:
    def __init__(self, row):
        self.row = row

    def mappings(self):
        return self

    def one(self):
        return self.row

    def all(self):
        return []


class Session:
    def __init__(self):
        self.saved = None
        self.committed = False

    def execute(self, query, values=None):
        if values is None:
            return Result(None)
        self.saved = values
        return Result(SimpleNamespace(**values))

    def commit(self):
        self.committed = True


def client_with_session():
    session = Session()
    app = FastAPI()
    app.include_router(router)
    app.dependency_overrides[db] = lambda: session
    app.dependency_overrides[current_user] = lambda: SimpleNamespace(username='Operador')
    return TestClient(app), session


def test_automatic_time_and_leading_zeroes():
    client, session = client_with_session()
    before = datetime.now(timezone.utc)
    response = client.post('/api/slump', json={
        'massada': '000123', 'tipo': 'slump', 'valor': '10,5',
        'origem_horario': 'automatico',
    })
    assert response.status_code == 201
    assert response.json()['massada'] == '000123'
    assert response.json()['unidade'] == 'cm'
    assert before <= session.saved['medido_em'] <= datetime.now(timezone.utc)
    assert session.committed


def test_manual_time_uses_sao_paulo_timezone():
    client, session = client_with_session()
    response = client.post('/api/slump', json={
        'massada': '654321', 'tipo': 'flow', 'valor': '540',
        'origem_horario': 'manual', 'medido_em_local': '2026-10-21T14:30',
    })
    assert response.status_code == 201
    assert response.json()['unidade'] == 'mm'
    assert session.saved['medido_em'] == datetime(2026, 10, 21, 17, 30, tzinfo=timezone.utc)


def test_rejects_invalid_massada_and_missing_manual_time():
    client, session = client_with_session()
    for payload in (
        {'massada': '12345', 'tipo': 'slump', 'valor': '12'},
        {'massada': '123456', 'tipo': 'slump', 'valor': '12', 'origem_horario': 'manual'},
    ):
        assert client.post('/api/slump', json=payload).status_code == 422
    assert session.saved is None

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


def test_flow_report_keeps_simulated_results_identifiable():
    class ReportSession(Session):
        def __init__(self):
            super().__init__()
            self.ranges = []

        def execute(self, query, values=None):
            self.ranges.append(values)
            if 'flow_simulado' in str(query):
                rows = [SimpleNamespace(
                    id='sim-1', massada='034852', valor=540,
                    medido_em=datetime(2026, 10, 26, 12, 10, tzinfo=timezone.utc),
                    serie_data_origem=datetime(2026, 10, 26).date(), serie_id_origem=34852,
                    colaborador='Philippe Augusto',
                )]
            else:
                rows = []
            return SimpleNamespace(mappings=lambda: SimpleNamespace(all=lambda: rows))

    session = ReportSession()
    app = FastAPI()
    app.include_router(router)
    app.dependency_overrides[db] = lambda: session
    app.dependency_overrides[current_user] = lambda: SimpleNamespace(username='Operador')
    client = TestClient(app)
    response = client.get('/api/slump/flow?inicio=2026-10-26&fim=2026-10-26')
    assert response.status_code == 200
    assert response.json()['simulados'] == 1
    assert response.json()['records'][0]['natureza'] == 'simulado'
    assert response.json()['records'][0]['colaborador'] == 'Philippe Augusto'
    assert response.json()['records'][0]['serie_data_origem'] == '2026-10-26'
    assert session.ranges[0]['inicio'] == datetime(2026, 10, 26, 3, tzinfo=timezone.utc)
    assert session.ranges[0]['fim'] == datetime(2026, 10, 27, 3, tzinfo=timezone.utc)
    assert client.get('/api/slump/flow?inicio=2026-01-01&fim=2026-12-31').status_code == 422

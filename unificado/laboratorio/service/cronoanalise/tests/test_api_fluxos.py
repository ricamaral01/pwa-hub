"""Request-level checks for invalidation and the prototype CSV parser."""
from __future__ import annotations

import sys
from contextlib import nullcontext
from datetime import datetime, timezone
from pathlib import Path
from types import SimpleNamespace
from uuid import uuid4

from fastapi import FastAPI
from fastapi.testclient import TestClient

SERVICE = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(SERVICE))
from cronoanalise import api  # noqa: E402


class FakeDB:
    def __init__(self):
        self.commands = []
        self.commits = 0

    def begin_nested(self):
        return nullcontext()

    def execute(self, statement, values=None):
        self.commands.append((str(statement), values))

    def commit(self):
        self.commits += 1


def client(monkeypatch, db, *, user_id='collector', actions=('coletar',)):
    user = SimpleNamespace(id=user_id, crono_screens=frozenset({'cronoanalise.coletar'}),
        crono_actions=frozenset('laboratorio.cronoanalise.' + action for action in actions))
    monkeypatch.setattr(api, 'gateway_user', lambda request: user)
    app = FastAPI()
    app.include_router(api.router)
    app.add_exception_handler(api.CronoError, api.crono_error_handler)
    app.dependency_overrides[api.session] = lambda: db
    return TestClient(app)


def test_autor_invalida_medicao_recente_com_motivo(monkeypatch):
    db = FakeDB()
    identifier = uuid4()
    before = {'id': identifier, 'autor_id': 'collector', 'criado_em': datetime.now(timezone.utc),
              'valido': True}
    monkeypatch.setattr(api, 'one', lambda db, sql, values: before)
    audited = []
    monkeypatch.setattr(api, 'audit', lambda *args, **kwargs: audited.append((args, kwargs)))
    response = client(monkeypatch, db).post(f'/api/laboratorio/cronoanalise/medicoes/{identifier}/invalidar',
                                            json={'motivo': 'TESTE T6A: medição incorreta'})
    assert response.status_code == 200 and response.json() == {'valido': False}
    assert db.commits == 1
    assert db.commands[0][1]['reason'] == 'TESTE T6A: medição incorreta'
    assert audited[0][0][4] == 'invalidar'


def test_outro_coletor_nao_invalida_medicao(monkeypatch):
    db = FakeDB()
    identifier = uuid4()
    monkeypatch.setattr(api, 'one', lambda db, sql, values: {
        'id': identifier, 'autor_id': 'outro', 'criado_em': datetime.now(timezone.utc),
        'valido': True})
    response = client(monkeypatch, db).post(f'/api/laboratorio/cronoanalise/medicoes/{identifier}/invalidar',
                                            json={'motivo': 'Não fui o autor'})
    assert response.status_code == 403 and response.json()['erro'] == 'sem_permissao'
    assert not db.commands and db.commits == 0


def test_importacao_csv_prototipo_decimais_duplicata_e_linha_ruim(monkeypatch):
    db = FakeDB()
    identifier = uuid4()
    imported = []
    def save(_db, item, user_id):
        imported.append((item, user_id))
        return 'gravada' if len(imported) == 1 else 'ja_existia'
    monkeypatch.setattr(api, 'save_measurement', save)
    monkeypatch.setattr(api, 'audit', lambda *args, **kwargs: None)
    header = 'id;inicio;fim;atividade_id;pessoas;duracao_s;bruta_s;valido;invalid_motivo\n'
    valid = f'{identifier};2026-10-18T12:00:00Z;2026-10-18T12:01:00Z;P01;2;45,5;60;false;Amostra de teste\n'
    duplicate = valid.replace('false;Amostra de teste', 'true;')
    malformed = f'{uuid4()};2026-10-18T12:00:00Z;2026-10-18T12:01:00Z;P01;xx;45,5;60;true;\n'
    response = client(monkeypatch, db, actions=('analisar',)).post(
        '/api/laboratorio/cronoanalise/medicoes/importar-prototipo',
        content=header + valid + duplicate + malformed, headers={'Content-Type': 'text/csv'})
    assert response.status_code == 200
    result = response.json()
    assert result['gravadas'] == [str(identifier)] and result['ja_existiam'] == [str(identifier)]
    assert len(result['rejeitadas']) == 1 and result['rejeitadas'][0]['linha'] == 4
    assert str(imported[0][0].duracao_s) == '45.5' and imported[0][1] == 'collector'
    assert any('SET valido=false' in sql and values['reason'] == 'Amostra de teste'
               for sql, values in db.commands)
    assert db.commits == 1

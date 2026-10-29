import importlib.util
from pathlib import Path

from flask import Flask


MODULE = Path(__file__).parents[2] / 'unificado' / 'mapa' / 'api' / 'fechamento_producao.py'
spec = importlib.util.spec_from_file_location('fechamento_producao_test', MODULE)
fechamento = importlib.util.module_from_spec(spec)
spec.loader.exec_module(fechamento)


def status_for(user_id, role):
    app = Flask(__name__)
    fechamento.register(
        app,
        lambda: {'id': user_id, 'perfil': 'GESTOR'},
        lambda _user: (['acmpConcretagem'], role),
        lambda: None,
        lambda: None,
    )
    response = app.test_client().post('/fechamento-producao/confirmar',
        json={}, headers={'Origin': 'https://concrefer.concretrack.com.br'})
    return response.status_code


def test_admin_can_reach_confirmation_validation():
    assert status_for('user-ricardo', 'ADMIN') == 400


def test_jose_can_reach_confirmation_validation():
    assert status_for('jcarlos', None) == 400


def test_other_user_cannot_confirm():
    assert status_for('outro-usuario', None) == 403

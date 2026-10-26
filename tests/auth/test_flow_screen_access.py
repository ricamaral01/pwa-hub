"""Flow report routes use the Slump permission; masters inherit new screens."""
from pathlib import Path
import sys

sys.path.insert(0, str(Path(__file__).resolve().parents[2] / 'unificado' / 'mapa' / 'api'))
from screen_access import CATALOG, DEFAULT_LAB_USERS, MASTER_USER_IDS, allowed_screens, screen_for_uri  # noqa: E402


def test_flow_page_and_api_use_slump_permission():
    for uri in (
        '/unificado/laboratorio/slump',
        '/unificado/laboratorio/slump/flow.html',
        '/unificado/laboratorio/slump/flow.js',
        '/unificado/laboratorio/api/slump',
        '/unificado/laboratorio/api/slump/flow?inicio=2026-10-26&fim=2026-10-26',
    ):
        assert screen_for_uri(uri)['id'] == 'labSlump'


def test_four_master_accounts_get_every_registered_screen():
    expected = {row['id'] for row in CATALOG}
    assert MASTER_USER_IDS == {'user-ricardo', 'philippe', 'alex', 'marcelo'}
    for user_id in MASTER_USER_IDS:
        user = {'id': user_id, 'nome': user_id, 'perfil': 'GERENCIA'}
        assert set(allowed_screens(user, None, {}, DEFAULT_LAB_USERS)) == expected


def test_other_laboratory_user_still_needs_slump_grant():
    user = {'id': 'lab-user', 'nome': 'Laboratório', 'perfil': 'LABORATORIO'}
    assert 'labSlump' not in allowed_screens(user, None, {}, {'lab-user'})
    assert 'labSlump' in allowed_screens(user, None, {'labSlump': True}, {'lab-user'})

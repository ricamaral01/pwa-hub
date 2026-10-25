"""Quality access must be explicitly granted without changing other modules."""
import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[2] / 'unificado' / 'mapa' / 'api'))
from screen_access import CATALOG, DEFAULT_LAB_USERS, allowed_screens, screen_for_uri  # noqa: E402


class QualityScreenAccessTests(unittest.TestCase):
    def test_existing_module_defaults_do_not_grant_quality(self):
        user = {'id': 'operator', 'nome': 'Operator', 'perfil': 'GESTOR'}
        baseline = allowed_screens(user, None, {}, DEFAULT_LAB_USERS)
        self.assertTrue(any(item.startswith('setor') for item in baseline))
        self.assertFalse(any(item.startswith('qualidade') for item in baseline))
        with_grant = allowed_screens(user, None, {'qualidadePainel': True}, DEFAULT_LAB_USERS)
        self.assertEqual(set(with_grant) - set(baseline), {'qualidadePainel'})

    def test_master_has_all_quality_screens(self):
        user = {'id': 'user-ricardo', 'nome': 'Ricardo', 'perfil': 'GERENCIA'}
        allowed = set(allowed_screens(user, None, {}, DEFAULT_LAB_USERS))
        self.assertEqual({row['id'] for row in CATALOG if row['module'] == 'qualidade'} & allowed,
                         {'qualidadePainel', 'qualidadeAbertura',
                          'qualidadeTratativa', 'qualidadeCadastros'})

    def test_nc_route_maps_to_treatment_without_api_screen_guessing(self):
        self.assertEqual(screen_for_uri('/unificado/qualidade/nc/123')['id'],
                         'qualidadeTratativa')
        self.assertIsNone(screen_for_uri('/unificado/qualidade/api/nc/123'))


if __name__ == '__main__':
    unittest.main()

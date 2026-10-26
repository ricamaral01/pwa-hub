"""Pederneiras pages must resolve to their own screen permissions."""
from pathlib import Path
import sys


sys.path.insert(0, str(Path(__file__).resolve().parents[2] / 'unificado/mapa/api'))
from screen_access import screen_for_uri  # noqa: E402


def test_pederneiras_tabs_and_apps():
    for tab, screen in {
        'apontamento': 'pdrApontamento',
        'mao-de-obra': 'pdrMaoDeObra',
        'mensal': 'pdrMensal',
        'indicadores': 'pdrIndicadores',
        'produtos': 'pdrProdutos',
    }.items():
        assert screen_for_uri(
            f'/unificado/producao/pederneiras/?tab={tab}'
        )['id'] == screen

    assert screen_for_uri('/unificado/producao/pederneiras/app/')['id'] == 'pdrApontamento'
    assert screen_for_uri('/unificado/producao/pederneiras/mao-de-obra/app/')['id'] == 'pdrMaoDeObra'
    assert screen_for_uri('/unificado/producao/pederneiras/?tab=unknown') is None

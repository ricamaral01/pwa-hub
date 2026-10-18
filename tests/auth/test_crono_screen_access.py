from __future__ import annotations

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[2] / "unificado/mapa/api"))
from screen_access import allowed_screens, screen_for_uri, DEFAULT_LAB_USERS  # noqa: E402


def test_cronometrista_nao_herda_outras_telas_laboratorio():
    user = {"id": "cronometrista", "nome": "Cronometrista", "perfil": "APONTADOR"}
    allowed = allowed_screens(user, None, {"cronoanalise.coletar": True}, DEFAULT_LAB_USERS)
    assert "cronoanalise.coletar" in allowed
    assert not any(item.startswith("lab") for item in allowed)
    assert "cronoanalise.inicio" not in allowed


def test_usuario_laboratorio_atual_nao_ganha_cronoanalise():
    user = {"id": "ricardo.teste", "nome": "Ricardo teste", "perfil": "GERENCIA"}
    allowed = allowed_screens(user, None, {}, DEFAULT_LAB_USERS)
    assert "labMonitor" in allowed
    assert not any(item.startswith("cronoanalise.") for item in allowed)


def test_rota_da_coleta_identificada_sem_reaproveitar_tela_antiga():
    page = screen_for_uri("/unificado/laboratorio/cronoanalise/coletar")
    api = screen_for_uri("/unificado/laboratorio/api/laboratorio/cronoanalise/medicoes/lote")
    assert page["id"] == "cronoanalise.coletar"
    assert api is None

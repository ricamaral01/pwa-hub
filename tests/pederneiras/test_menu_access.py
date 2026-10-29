"""Pederneiras links are opt-in while Campinas links keep their IDs."""
import importlib.util
from pathlib import Path


SOURCE = Path(__file__).resolve().parents[2] / "unificado/mapa/api/screen_access.py"
spec = importlib.util.spec_from_file_location("pdr_screen_access", SOURCE)
access = importlib.util.module_from_spec(spec)
spec.loader.exec_module(access)


def test_existing_campinas_and_new_pederneiras_routes():
    old = access.screen_for_uri("/unificado/mapa/operacao/?tela=PROD_ANALISE")
    new = access.screen_for_uri("/unificado/producao/pederneiras/?tab=apontamento")
    assert old["id"] == "produtividade"
    assert new["id"] == "pdrApontamento"
    assert access.screen_for_uri("/unificado/producao/pederneiras/app/")["id"] == "pdrApontamento"
    assert access.screen_for_uri("/unificado/producao/pederneiras/mao-de-obra/app/")["id"] == "pdrMaoDeObra"


def test_pederneiras_requires_explicit_grant_and_pcp_identity():
    user = {"id": "gestor-teste", "perfil": "GESTOR", "nome": "Gestor Teste"}
    screens = access.allowed_screens(user, "PRODUCAO", {}, frozenset())
    assert "liberacao" in screens
    assert "pdrApontamento" not in screens
    screens = access.allowed_screens(user, "PRODUCAO", {"pdrApontamento": True}, frozenset())
    assert "pdrApontamento" in screens
    screens = access.allowed_screens(user, None, {"pdrApontamento": True}, frozenset())
    assert "pdrApontamento" not in screens


def test_master_screen_visibility():
    for user_id in ("user-ricardo", "marcelo", "alex", "alex51", "philippe"):
        user = {"id": user_id, "perfil": "GERENCIA", "nome": user_id}
        assert "pdrProdutos" in access.allowed_screens(user, None, {}, frozenset())
        assert "rbrProdutos" in access.allowed_screens(user, None, {}, frozenset())
        assert "norProdutos" in access.allowed_screens(user, None, {}, frozenset())


def test_ribeirao_routes_and_opt_in():
    for suffix, expected in (("?tab=apontamento", "rbrApontamento"),
                             ("?tab=mao-de-obra", "rbrMaoDeObra"),
                             ("?tab=mensal", "rbrMensal"),
                             ("?tab=indicadores", "rbrIndicadores"),
                             ("?tab=produtos", "rbrProdutos"),
                             ("app/", "rbrApontamento"),
                             ("mao-de-obra/app/", "rbrMaoDeObra")):
        assert access.screen_for_uri("/unificado/producao/ribeirao/" + suffix)["id"] == expected
    user = {"id": "ribeirao-operador", "perfil": "GESTOR", "nome": "Operador"}
    assert "rbrApontamento" not in access.allowed_screens(user, "PRODUCAO", {}, frozenset())
    assert "rbrApontamento" in access.allowed_screens(user, "PRODUCAO", {"rbrApontamento": True}, frozenset())


def test_noroeste_routes_and_explicit_grant():
    for suffix, expected in (("?tab=apontamento", "norApontamento"),
                             ("?tab=mao-de-obra", "norMaoDeObra"),
                             ("?tab=mensal", "norMensal"),
                             ("?tab=indicadores", "norIndicadores"),
                             ("?tab=produtos", "norProdutos"),
                             ("app/", "norApontamento"),
                             ("mao-de-obra/app/", "norMaoDeObra")):
        assert access.screen_for_uri("/unificado/producao/noroeste/" + suffix)["id"] == expected
    user = {"id": "noroeste-operador", "perfil": "GESTOR", "nome": "Operador"}
    assert "norApontamento" not in access.allowed_screens(user, "PRODUCAO", {}, frozenset())
    assert "norApontamento" in access.allowed_screens(user, "PRODUCAO", {"norApontamento": True}, frozenset())
    assert "norApontamento" not in access.allowed_screens(user, None, {"norApontamento": True}, frozenset())

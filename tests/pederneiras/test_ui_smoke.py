"""Static UI contract with mocked API; no production data or credentials."""
from __future__ import annotations

from datetime import date
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from threading import Thread
import json

from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[2]
PRINTS = ROOT / "docs/porting/producao-pederneiras/prints"
PRINTS.mkdir(parents=True, exist_ok=True)
TODAY = date.today().isoformat()
PRODUCTS = [
    dict(id=1, familia="Padrão", letra="A", descricao="Poste padrão 9m", cod_pro="PRO-001", cod_sma="SMA-001", volume_m3=.35, ativo=True, pendencia=None),
    dict(id=2, familia="Circular", letra="B", descricao="Poste circular 11m", cod_pro="PRO-002", cod_sma="SMA-002", volume_m3=.48, ativo=True, pendencia=None),
    dict(id=3, familia="Duplo T", letra="C", descricao="Poste duplo T", cod_pro="PRO-003", cod_sma=None, volume_m3=None, ativo=True, pendencia="Volume pendente"),
]
AREAS = [
    dict(atividade_id=10, descricao="Produção", tipo="MOD", ordem=1, ativo=True, homens=8, observacao=None, registro_id=1),
    dict(atividade_id=11, descricao="Usina de Concreto", tipo="MOI", ordem=2, ativo=True, homens=2, observacao=None, registro_id=2),
]
DAY = dict(data=TODAY, status="enviado", enviado_em=None, confirmado_em=None, liberacao_prevista=TODAY, itens=[dict(id=1, produto_id=1, quantidade=20, descricao=PRODUCTS[0]["descricao"], familia="Padrão", volume_m3=.35)], postes=20, volume_m3=7, produtos_sem_volume=0)
LABOR = dict(data=TODAY, areas=AREAS, homens=10, mod=8, moi=2, salvo_em=TODAY, confirmado_em=None)
MONTH = dict(mes=TODAY[:7], meta=dict(dias_uteis=23,pcs_dia=64,meta_postes_homem=5.9), meta_total=1472,
             dias=[dict(**DAY, homens=10, mod=8, moi=2, postes_homem=2, areas=AREAS)],
             dias_producao=1, postes=20, media_postes_dia=20, homens=10, postes_homem=2,
             volume_m3=7, produtos_sem_volume=0, pendencias=[])


def reply(route):
    url = route.request.url
    if route.request.method != "GET":
        data = LABOR if "/mao-de-obra/" in url else DAY
    elif "/referencia" in url:
        data = {"dias": 0, "medias": {}}
    elif "/produtos" in url:
        data = {"produtos": PRODUCTS}
    elif "/mao-de-obra/" in url:
        data = LABOR
    elif "/mensal" in url:
        data = MONTH
    else:
        data = DAY
    route.fulfill(status=200, content_type="application/json", body=json.dumps(data))


def test_desktop_and_installed_app_views():
    server = ThreadingHTTPServer(("127.0.0.1", 0), partial(SimpleHTTPRequestHandler, directory=str(ROOT)))
    Thread(target=server.serve_forever, daemon=True).start()
    origin = f"http://127.0.0.1:{server.server_port}"
    try:
        with sync_playwright() as p:
            browser = p.chromium.launch(headless=True)
            for width, height, page_path, name, expected in [
                (1440, 900, "/unificado/producao/pederneiras/?tab=apontamento", "06-apontamento-desktop.png", "Produtos produzidos"),
                (1440, 900, "/unificado/producao/pederneiras/?tab=produtos", "05-cadastro-desktop.png", "Produtos e códigos"),
                (1440, 900, "/unificado/producao/pederneiras/?tab=mao-de-obra", "07-mao-de-obra-desktop.png", "Mão de obra por área"),
                (1440, 900, "/unificado/producao/pederneiras/?tab=mensal", "08-mensal-desktop.png", "Produção por produto e dia"),
                (375, 812, "/unificado/producao/pederneiras/app/", "09-pwa-producao-mobile.png", "Postes produzidos"),
                (375, 812, "/unificado/producao/pederneiras/mao-de-obra/app/", "10-pwa-mao-de-obra-mobile.png", "Postes / homem"),
            ]:
                context = browser.new_context(viewport={"width": width, "height": height}, service_workers="block")
                context.add_init_script("localStorage.setItem('pcp_token','synthetic-test-token')")
                context.route("**/unificado/pcp/api/producao/pederneiras/**", reply)
                page = context.new_page()
                page.goto(origin + page_path, wait_until="networkidle")
                page.get_by_text(expected, exact=False).first.wait_for()
                assert page.evaluate("document.documentElement.scrollWidth <= innerWidth + 2"), name
                page.screenshot(path=str(PRINTS / name), full_page=True)
                context.close()
            context = browser.new_context(viewport={"width": 375, "height": 812}, service_workers="block")
            context.add_init_script("localStorage.setItem('pcp_token','synthetic-test-token')")
            context.route("**/unificado/pcp/api/producao/pederneiras/**", reply)
            page = context.new_page()
            page.goto(origin + "/unificado/producao/pederneiras/app/", wait_until="networkidle")
            page.get_by_role("button", name="Lançar", exact=True).click()
            page.get_by_role("button", name="Aumentar Poste padrão 9m").click()
            context.set_offline(True)
            page.get_by_role("button", name="Revisar →").click()
            page.get_by_role("button", name="Enviar apontamento").click()
            page.get_by_text("guardado neste aparelho", exact=False).wait_for()
            assert page.evaluate("JSON.parse(localStorage.getItem('pederneiras-pwa-queue-v1')).length") == 1
            context.set_offline(False)
            page.wait_for_function("JSON.parse(localStorage.getItem('pederneiras-pwa-queue-v1')).length === 0")
            context.close()
            browser.close()
    finally:
        server.shutdown()

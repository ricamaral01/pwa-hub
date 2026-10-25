"""PWA mobile: instalação, fila offline, reabertura e papéis sem acesso a preço/saldo."""
from __future__ import annotations
import json
import threading
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
import pytest
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[2]
CAPTURES = ROOT / "docs/porting/suprimentos/capturas/e5"
CC = "019a173e-1111-7000-8000-000000000001"
UN = "019a173e-1111-7000-8000-000000000002"
MATERIAL = "019a173e-1111-7000-8000-000000000003"
RID = "019a173e-1111-7000-8000-000000000004"


@pytest.fixture(scope="module")
def site():
    class Handler(SimpleHTTPRequestHandler):
        def __init__(self, *args, **kwargs): super().__init__(*args, directory=str(ROOT), **kwargs)
        def log_message(self, *_): pass
    server = ThreadingHTTPServer(("127.0.0.1", 0), Handler)
    thread = threading.Thread(target=server.serve_forever, daemon=True)
    thread.start()
    yield f"http://127.0.0.1:{server.server_port}"
    server.shutdown(); server.server_close(); thread.join(timeout=5)


class Backend:
    def __init__(self, actor="sol"):
        self.actor = actor
        self.records = {}
        self.posts = 0
        self.failures = 0
        self.expired = False

    def route(self, route):
        req = route.request
        path = req.url.split("?", 1)[0]
        if path.endswith("/unified/suprimentos-bootstrap") or path.endswith("/session-renew"):
            return route.fulfill(status=401 if self.expired else 200, content_type="application/json", body=json.dumps({"ok":not self.expired}))
        suffix = path.removeprefix(req.url.split("/", 3)[0] + "//" + req.url.split("/", 3)[2] + "/api/suprimentos")
        if self.expired:
            return route.fulfill(status=401, content_type="application/json", body='{"detail":"Sessão expirada"}')
        payload = json.loads(req.post_data or '{}') if req.headers.get("content-type", "").startswith("application/json") else {}
        data, status = {}, 200
        if suffix == "/me":
            role = "APROVADOR" if self.actor == "apr1" else "SOLICITANTE"
            data = {"id":self.actor,"nome":"Teste Solicitante" if self.actor=="sol" else "Teste Aprovador","unidade":"campinas","papeis":[{"papel":role,"cc_id":None,"nivel":1 if role=="APROVADOR" else None}]}
        elif suffix == "/pwa/inicio":
            rows = list(self.records.values())
            data = {"minhas":rows if self.actor=="sol" else [],"aprovar":[{"id":RID,"numero":"SUP-00001","urgencia":"NORMAL","solicitante_nome":"Teste Solicitante","cc_id":CC,"status":"EM_APROVACAO","valor_estimado":"50","precisa_em":None}] if self.actor=="apr1" else []}
        elif suffix == "/pwa/catalogo":
            data = {"items":[{"id":MATERIAL,"codigo":"MAT-01","descricao":"Luva de proteção","un_id":UN,"unidade":"un"}],"atualizado_em":"2026-10-25T12:00:00Z"}
        elif suffix.startswith("/pwa/mais-pedidos"):
            data = {"items":[]}
        elif suffix.startswith("/cadastros/centros-custo"):
            data = {"items":[{"id":CC,"nome":"Produção Campinas","ativo":True}]}
        elif suffix.startswith("/cadastros/unidades-medida"):
            data = {"items":[{"id":UN,"sigla":"un","ativo":True}]}
        elif suffix == "/pwa/solicitacoes" and req.method == "POST":
            self.posts += 1
            key = payload["client_uuid"]
            self.records.setdefault(key,{"id":RID,"numero":"SUP-00001","client_uuid":key,"status":"RASCUNHO","urgencia":payload["urgencia"],"criado_em":"2026-10-25T12:00:00Z","justificativa":payload.get("justificativa")})
            if self.failures:
                self.failures -= 1
                return route.fulfill(status=503, content_type="application/json", body='{"detail":"Falha temporária"}')
            data = self.records[key]
        elif suffix == f"/solicitacoes/{RID}/enviar":
            data = next(iter(self.records.values()))
            data["status"] = "EM_APROVACAO"
        elif suffix == f"/solicitacoes/{RID}":
            data = next(iter(self.records.values()))
        elif suffix == f"/solicitacoes/{RID}/aprovar":
            data = {"status":"APROVADA"}
        else:
            status,data = 404,{"detail":"Rota indisponível"}
        route.fulfill(status=status, content_type="application/json", body=json.dumps(data, ensure_ascii=False))


def setup(page, backend):
    page.route("**/unificado/mapa/api/unified/suprimentos-bootstrap", backend.route)
    page.route("**/unificado/suprimentos/session-renew", backend.route)
    page.route("**/api/suprimentos/**", backend.route)


@pytest.mark.parametrize("device,width,height", [("Pixel",390,844),("iPhone",390,844)])
def test_offline_queue_replay_and_mobile(site, device, width, height):
    CAPTURES.mkdir(parents=True, exist_ok=True)
    backend=Backend()
    with sync_playwright() as pw:
        browser=pw.chromium.launch(headless=True)
        context=browser.new_context(viewport={"width":width,"height":height},device_scale_factor=1,
                                    is_mobile=True,has_touch=True,service_workers="allow")
        page=context.new_page();setup(page,backend)
        page.goto(site+"/unificado/suprimentos/pwa/",wait_until="networkidle")
        page.get_by_role("heading",name="Olá, Teste").wait_for()
        page.screenshot(path=str(CAPTURES/f"{device.lower()}-inicio.png"),full_page=True)
        assert page.get_by_role("button",name="Aprovar",exact=True).count()==0
        assert page.evaluate("document.documentElement.scrollWidth <= innerWidth")
        assert page.evaluate("navigator.serviceWorker.ready.then(r=>r.scope)").endswith("/unificado/suprimentos/pwa/")
        context.set_offline(True)
        page.get_by_role("button",name="＋ Nova solicitação").click()
        page.screenshot(path=str(CAPTURES/f"{device.lower()}-itens.png"),full_page=True)
        page.locator('[data-material="'+MATERIAL+'"]').last.click()
        page.get_by_role("button",name="Continuar · 1 item").click()
        page.locator("#why").fill("Luvas necessárias para operação de teste")
        page.screenshot(path=str(CAPTURES/f"{device.lower()}-detalhes.png"),full_page=True)
        page.get_by_role("button",name="Enviar solicitação").click()
        page.get_by_text("Envio pendente").wait_for()
        assert backend.posts==0
        assert page.evaluate("document.documentElement.scrollWidth <= innerWidth")
        page.close()
        page=context.new_page();setup(page,backend)
        page.goto(site+"/unificado/suprimentos/pwa/",wait_until="domcontentloaded")
        page.get_by_role("button",name="Minhas",exact=True).click()
        page.get_by_text("Envio pendente").wait_for()
        backend.expired=True
        context.set_offline(False)
        page.evaluate("window.dispatchEvent(new Event('online'))")
        page.get_by_text("Sua sessão terminou").wait_for()
        assert page.get_by_text("Envio pendente").count()==1
        backend.expired=False
        backend.failures=5
        page.reload(wait_until="networkidle")
        page.get_by_role("button",name="Minhas",exact=True).click()
        page.get_by_text("Envio pendente").wait_for()
        for _ in range(5):
            page.evaluate("window.dispatchEvent(new Event('online'))")
            page.wait_for_timeout(300)
        page.evaluate("window.dispatchEvent(new Event('online'))")
        page.get_by_text("Envio pendente").wait_for(state="detached")
        assert len(backend.records)==1
        assert backend.posts>=6
        page.screenshot(path=str(CAPTURES/f"{device.lower()}-minhas.png"),full_page=True)
        page.locator('[data-detail="'+RID+'"]').click()
        page.screenshot(path=str(CAPTURES/f"{device.lower()}-acompanhar.png"),full_page=True)
        context.close();browser.close()


def test_approver_tab_and_manifest(site):
    backend=Backend("apr1")
    with sync_playwright() as pw:
        browser=pw.chromium.launch(headless=True)
        page=browser.new_page(viewport={"width":390,"height":844},is_mobile=True,has_touch=True)
        setup(page,backend)
        page.goto(site+"/unificado/suprimentos/pwa/",wait_until="networkidle")
        page.get_by_role("button",name="Aprovar",exact=True).click()
        assert page.get_by_text("Aprovar solicitações").is_visible()
        page.screenshot(path=str(CAPTURES/"aprovador.png"),full_page=True)
        manifest=json.loads(page.request.get(site+"/unificado/suprimentos/pwa/manifest.webmanifest").text())
        assert manifest["scope"]=="/unificado/suprimentos/pwa/"
        assert {"any","maskable"}.issubset({x["purpose"] for x in manifest["icons"]})
        browser.close()

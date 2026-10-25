"""Fluxo visual S1 com API controlada; regras reais são cobertas pelo pytest E2."""
from __future__ import annotations
import json
import threading
from copy import deepcopy
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import parse_qs, urlsplit
import pytest
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[2]
CAPTURES = ROOT / "docs/porting/suprimentos/capturas/e4"
CC = "019a173e-1111-7000-8000-000000000001"
UNIT = "019a173e-1111-7000-8000-000000000002"
RID = "019a173e-1111-7000-8000-000000000003"
ITEM = "019a173e-1111-7000-8000-000000000004"


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


class MockApi:
    def __init__(self):
        self.actor = "sol"
        self.record = None
        self.events = []

    def respond(self, route):
        request = route.request
        parsed = urlsplit(request.url)
        suffix = parsed.path.removeprefix("/api/suprimentos")
        query = parse_qs(parsed.query)
        method = request.method
        payload = request.post_data_json if request.post_data and request.headers.get("content-type", "").startswith("application/json") else {}
        role = {"sol":("SOLICITANTE",None), "apr1":("APROVADOR",1), "apr2":("APROVADOR",2), "alm":("ALMOXARIFE",None), "admin":("ADMIN",None)}[self.actor]
        result = {}
        status = 200
        if suffix == "/me":
            result = {"id":self.actor,"nome":self.actor,"unidade":"campinas","papeis":[{"papel":role[0],"cc_id":None,"nivel":role[1]}],"flags":{"S0":True,"S1":True}}
        elif suffix.startswith("/cadastros/centros-custo"):
            result = {"items":[{"id":CC,"codigo":"PROD","nome":"Produção Campinas","ativo":True}],"total":1}
        elif suffix.startswith("/cadastros/unidades-medida"):
            result = {"items":[{"id":UNIT,"sigla":"un","descricao":"Unidade","ativo":True}],"total":1}
        elif suffix.startswith("/cadastros/materiais"):
            result = {"items":[{"id":"019a173e-1111-7000-8000-000000000005","codigo":"MAT-01","descricao":"Luva de proteção","categoria":"EPI","un_estoque":UNIT,"dominio":"almoxarifado","ativo":True}],"total":1}
        elif suffix.startswith("/cadastros/fornecedores"):
            result = {"items":[{"id":"019a173e-1111-7000-8000-000000000006","cnpj":"11222333000181","razao":"Fornecedor Exemplo","categorias":["EPI"],"situacao":"qualificado","ativo":True}],"total":1}
        elif suffix.startswith("/cadastros/"):
            result = {"items":[],"total":0}
        elif suffix == "/pwa/inicio":
            approvals = [self.record] if self.record and self.record["status"] == "EM_APROVACAO" and self.actor.startswith("apr") else []
            result = {"nome":self.actor,"unidade":"campinas","minhas":[self.record] if self.record and self.actor=="sol" else [],"aprovar":approvals,"entregas_confirmar":int(bool(self.record and self.record["status"]=="ENTREGUE"))}
        elif suffix == "/solicitacoes" and method == "POST":
            self.record = {"id":RID,"numero":"SOL-00001","unidade_id":1,"cc_id":payload["cc_id"],"solicitante_id":"sol","solicitante_nome":"Solicitante de teste","origem":"web","urgencia":payload["urgencia"],"precisa_em":payload.get("precisa_em"),"justificativa":payload.get("justificativa"),"status":"RASCUNHO","valor_estimado":"3000.00","sem_preco":False,"nivel_atual":None,"niveis_total":None,"criado_em":"2026-10-25T10:00:00-03:00","itens":[{"id":ITEM,"solicitacao_id":RID,"material_id":None,"descricao_livre":payload["itens"][0]["descricao_livre"],"qtd":"1","qtd_entregue":"0","status":"PENDENTE","un":UNIT}],"fotos":[],"eventos":[]}
            self._event(None,"RASCUNHO")
            result=self.record;status=201
        elif suffix == "/solicitacoes" and method == "GET":
            rows=[self.record] if self.record else []
            wanted=query.get("status",[None])[0]
            if wanted:rows=[x for x in rows if x["status"]==wanted]
            if query.get("minha_alcada")==["true"]:rows=[x for x in rows if x["status"]=="EM_APROVACAO" and self.actor==f"apr{x['nivel_atual']}"]
            result={"items":rows,"total":len(rows),"page":1,"size":100}
        elif suffix == f"/solicitacoes/{RID}" and method == "GET":
            result=self.record or {}
        elif suffix == f"/solicitacoes/{RID}/enviar":
            self._change("EM_APROVACAO");self.record["nivel_atual"]=1;self.record["niveis_total"]=2;result=self.record
        elif suffix == f"/solicitacoes/{RID}/aprovar":
            if self.record["nivel_atual"]==1:self.record["nivel_atual"]=2;self._event("EM_APROVACAO:1","EM_APROVACAO:2")
            else:self._change("APROVADA");self.record["nivel_atual"]=None
            result={"status":self.record["status"]}
        elif suffix == f"/itens/{ITEM}/separar":
            self.record["itens"][0]["status"]="SEPARADO";self._change("EM_ATENDIMENTO");result={"status":"SEPARADO"}
        elif suffix == f"/itens/{ITEM}/entregar":
            self.record["itens"][0].update(status="ENTREGUE",qtd_entregue="1");self._change("ENTREGUE");result={"status":"ENTREGUE"}
        elif suffix == f"/solicitacoes/{RID}/confirmar-recebimento":
            self._change("CONCLUIDA");result={"status":"CONCLUIDA"}
        else:
            status=404;result={"detail":"Rota simulada indisponível"}
        route.fulfill(status=status,content_type="application/json; charset=utf-8",body=json.dumps(deepcopy(result),ensure_ascii=False))

    def _event(self, old, new):
        self.events.append({"id":str(len(self.events)+1),"de":old,"para":new,"por_nome":self.actor,"em":"2026-10-25T10:00:00-03:00","comentario":None})
        if self.record:self.record["eventos"]=deepcopy(self.events)
    def _change(self, new):
        old=self.record["status"];self.record["status"]=new;self._event(old,new)


def test_full_flow_and_responsive_captures(site):
    CAPTURES.mkdir(parents=True,exist_ok=True)
    mock=MockApi()
    with sync_playwright() as playwright:
        browser=playwright.chromium.launch(headless=True)
        page=browser.new_page(viewport={"width":1440,"height":900},device_scale_factor=1)
        page.route("**/api/suprimentos/**",mock.respond)
        page.goto(site+"/unificado/suprimentos/nova/",wait_until="domcontentloaded")
        free_dialog=lambda dialog:dialog.accept("Abrasivo especial")
        page.on("dialog",free_dialog)
        page.get_by_role("button",name="+ Item que não acho na lista — descrever e fotografar").click()
        page.get_by_role("button",name="Continuar · 1 itens").click()
        page.locator("#request-cc").select_option(CC)
        page.locator("#reason").fill("Reposição necessária na linha de produção")
        page.get_by_role("button",name="Enviar solicitação").click()
        page.get_by_role("heading",name="Solicitação SOL-00001").wait_for()
        assert mock.record["status"]=="EM_APROVACAO"
        mock.actor="apr1";page.reload();page.get_by_role("button",name="Aprovar",exact=True).click()
        page.get_by_text("Nível 2 de 2").wait_for()
        mock.actor="apr2";page.reload();page.get_by_role("button",name="Aprovar",exact=True).click()
        page.get_by_text("Aprovada",exact=True).first.wait_for()
        mock.actor="alm";page.reload();page.get_by_role("button",name="Separar").click()
        page.remove_listener("dialog",free_dialog)
        page.on("dialog",lambda dialog:dialog.accept("1"))
        page.get_by_role("button",name="Entregar qtd").click()
        page.get_by_text("Entregue",exact=True).first.wait_for()
        mock.actor="sol";page.reload();page.get_by_role("button",name="Recebi tudo").click()
        page.get_by_text("Concluída",exact=True).first.wait_for()
        assert mock.record["status"]=="CONCLUIDA"
        for width,height,label in ((1440,900,"desktop"),(820,1180,"tablet")):
            page.set_viewport_size({"width":width,"height":height})
            for screen in ("painel","solicitacoes","solicitacao","nova","fornecedores","cadastros"):
                suffix="?id="+RID if screen=="solicitacao" else ""
                page.goto(site+f"/unificado/suprimentos/{screen}/"+suffix,wait_until="domcontentloaded")
                page.locator(".loading-state").wait_for(state="hidden")
                assert page.locator(".error-state").count()==0,(screen,label)
                assert page.evaluate("document.documentElement.scrollWidth <= innerWidth + 1"),(screen,label)
                page.screenshot(path=str(CAPTURES/f"{screen}-{label}.png"),full_page=True)
        browser.close()

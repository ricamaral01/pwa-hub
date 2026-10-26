"""Capturas autenticadas do manual S1 em :18446, via casca e PWA real.

As sessões são assinadas pelo IAM de homologação e ficam apenas na memória.
As marcas numeradas são compostas sobre a cópia da captura, via canvas.
"""
from __future__ import annotations

import base64
import json
import sys
from pathlib import Path
from urllib.parse import quote

from playwright.sync_api import sync_playwright
from PIL import Image

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "unificado"))
from homolog_session import test_cookie_for  # noqa: E402

ROOT = "https://concrefer.concretrack.com.br:18446"
DIR = Path("docs/porting/suprimentos/manual/img")
DEMO = json.loads(Path("docs/porting/suprimentos/manual/dados-demo.json").read_text(encoding="utf-8"))["requests"]
F1 = {"cotacao": "01a1758f-770b-7d13-91a2-b9a228e3fd67",
      "pedido": "01a1758f-7906-7e45-9eba-991dd64bad66",
      "fornecedor": "01a1758f-75bd-7939-aa2c-d82bcbaf167c"}
F3 = json.loads(Path("docs/porting/suprimentos/capturas/f3/demo-id.json").read_text(encoding="utf-8"))["id"]
SIZES = {"pc": (1440, 900), "tablet": (820, 1180), "celular": (390, 844)}
NAMES = {
    "e2e-suprimentos-sol": "Solicitante Demo",
    "e2e-suprimentos-aprov1": "Aprovador N1 Demo",
    "e2e-suprimentos-almox": "Almoxarife Demo",
    "e2e-suprimentos-compras": "Comprador Demo",
    "user-ricardo": "Ricardo",
}
CASES = [
    ("painel", "e2e-suprimentos-sol", "painel/", None,
     [(".page-head h1", "Painel"), (".kpi-grid", "Indicadores"), (".table-scroll", "Fila de trabalho")]),
    ("solicitacoes-lista", "e2e-suprimentos-aprov1", "solicitacoes/", None,
     [(".tabs", "Situações"), (".filters", "Filtros"), (".requests-table", "Pedidos")]),
    ("solicitacoes-lote", "e2e-suprimentos-aprov1", "solicitacoes/", "batch",
     [(".tabs", "Situações"), (".select-row:checked", "Seleção"), ("#batch", "Ação em lote")]),
    ("detalhe-solicitante", "e2e-suprimentos-sol", "solicitacao/?id=" + DEMO["entregue"]["id"], None,
     [(".page-head h1", "Número e ações"), (".detail-grid", "Dados"), ("#app [data-action=confirmar]", "Recebi tudo")]),
    ("detalhe-aprovador", "e2e-suprimentos-aprov1", "solicitacao/?id=" + DEMO["aprovacao-n1"]["id"], None,
     [(".page-head h1", "Decisão"), (".detail-grid", "Dados e alçada"), (".timeline", "Histórico")]),
    ("detalhe-almoxarife", "e2e-suprimentos-almox", "solicitacao/?id=" + DEMO["aprovada"]["id"], None,
     [(".page-head h1", "Pedido aprovado"), (".table-scroll", "Itens"), ("[data-item-action=separar]", "Separar")]),
    ("detalhe-entrega-parcial", "e2e-suprimentos-almox", "solicitacao/?id=" + DEMO["parcial"]["id"], None,
     [(".page-head h1", "Em atendimento"), (".table-scroll", "Quantidade entregue"), ("[data-item-action=entregar]", "Entregar restante")]),
    ("nova-itens", "e2e-suprimentos-sol", "nova/", None,
     [("#material-search", "Buscar material"), ("#free-item", "Item fora do catálogo"), ("#continue", "Continuar")]),
    ("nova-detalhes", "e2e-suprimentos-sol", "nova/", "details",
     [("#request-cc", "Centro de custo"), ("#urgency", "Urgência"), ("#photos", "Fotos")]),
    ("fornecedores", "e2e-suprimentos-compras", "fornecedores/", None,
     [(".page-head h1", "Fornecedores"), ("#sup-q", "Buscar"), ('[data-do="new-supplier"]', "Novo cadastro")]),
]
for resource, title in (("materiais", "Materiais"), ("centros-custo", "Centros de custo"),
                        ("alcadas", "Alçadas"), ("parametros", "Parâmetros"),
                        ("usuarios-papeis", "Usuários e papéis")):
    CASES.append(("cadastros-" + resource, "user-ricardo", "cadastros/", resource,
                  [(".tabs", "Abas de cadastro"), (".table-scroll, .empty-state", title), ("#create", "Novo cadastro")]))
CASES.extend([
    ("fornecedor-ficha", "e2e-suprimentos-compras", "fornecedores/?id=" + F1["fornecedor"], None,
     [(".page-head h1", "Fornecedor"), (".tabs", "Abas"), (".card", "Cadastro e IQF")]),
    ("cotacoes-lista", "e2e-suprimentos-compras", "cotacoes/?tab=cotacoes", None,
     [(".page-head h1", "Cotações"), (".tabs", "Abas"), (".table-scroll", "Cotações abertas")]),
    ("cotacao-mapa", "e2e-suprimentos-compras", "cotacoes/?id=" + F1["cotacao"], None,
     [(".page-head h1", "Cotação"), (".sup-matrix", "Mapa comparativo"), (".card", "Propostas")]),
    ("pedidos-lista", "e2e-suprimentos-compras", "cotacoes/?tab=pedidos", None,
     [(".page-head h1", "Pedidos"), (".tabs", "Abas"), (".table-scroll", "Situações")]),
    ("pedido-detalhe", "e2e-suprimentos-compras", "cotacoes/?id=" + F1["pedido"] + "&tab=pedido", None,
     [(".page-head h1", "Pedido de compra"), (".card", "Dados e itens"), (".actions", "Ações")]),
    ("almoxarifado-saldos", "e2e-suprimentos-almox", "almoxarifado/", None,
     [(".page-head h1", "Almoxarifado"), (".sup-stock-grid", "Indicadores"), (".table-scroll", "Saldos")]),
    ("almoxarifado-reservas", "e2e-suprimentos-almox", "almoxarifado/", "stock:separacao",
     [(".sup-stock-tabs", "Abas"), ("#stock-panel", "Reservas e entregas"), (".table-scroll", "Itens")]),
    ("almoxarifado-epi", "e2e-suprimentos-almox", "almoxarifado/", "stock:epi",
     [(".sup-stock-tabs", "Abas"), ("#stock-panel", "Fichas de EPI"), (".table-scroll", "Entregas")]),
    ("inventario", "e2e-suprimentos-almox", "inventario/", None,
     [(".page-head h1", "Inventários"), (".sup-stock-card", "Contagens"), (".table-scroll", "Divergências")]),
    ("recebimentos", "e2e-suprimentos-almox", "recebimento/", None,
     [(".page-head h1", "Recebimentos"), (".sup-rec-table", "Documentos"), ("[data-action=new]", "Novo recebimento")]),
    ("recebimento-detalhe", "e2e-suprimentos-almox", "recebimento/?id=" + F3, None,
     [(".page-head h1", "Nota fiscal"), (".sup-rec-steps", "Etapas"), (".sup-rec-item", "Itens e inspeção")]),
    ("indicadores", "e2e-suprimentos-compras", "analises/", None,
     [(".page-head h1", "Indicadores"), ("#sup-ana-form", "Filtros"), (".sup-ana-grid", "KPIs")]),
])
PWA_CASES = [
    ("pwa-inicio", "e2e-suprimentos-sol", "inicio", [(".hello", "Início"), ("[data-view=nova]", "Novo pedido"), ("#install", "Instalar")]),
    ("pwa-nova-itens", "e2e-suprimentos-sol", "nova", [("#search", "Buscar"), ("#free", "Item livre"), ("#continue", "Continuar")]),
    ("pwa-nova-detalhes-offline", "e2e-suprimentos-sol", "offline", [("#cc", "Centro de custo"), ("[data-urgency=PAROU_PRODUCAO]", "Urgência"), (".banner.warn", "Sem conexão")]),
    ("pwa-minhas", "e2e-suprimentos-sol", "minhas", [("h1", "Meus pedidos"), (".request-card", "Pedido"), (".app-nav", "Navegação")]),
    ("pwa-acompanhar", "e2e-suprimentos-sol", "acompanhar", [(".request-top", "Situação"), (".timeline", "Histórico"), ("#received", "Recebi tudo")]),
    ("pwa-aprovar", "e2e-suprimentos-aprov1", "aprovar", [("h1", "Minha alçada"), (".approve-card", "Pedido"), ("[data-decision=aprovar]", "Aprovar")]),
]


def context(browser, actor, size, tokens):
    width, height = size
    ctx = browser.new_context(viewport={"width": width, "height": height},
                              is_mobile=width < 768, has_touch=width < 768)
    ctx.add_cookies([{"name": "mapa_unificado_homolog_session", "value": tokens[actor],
                      "domain": "concrefer.concretrack.com.br", "path": "/unificado/",
                      "httpOnly": True, "secure": True, "sameSite": "Lax"}])
    bootstrap = ctx.request.post(ROOT + "/unificado/mapa/api/unified/suprimentos-bootstrap")
    if bootstrap.status != 200:
        raise RuntimeError(f"Bootstrap {actor}: {bootstrap.status}")
    user = {"id": actor, "name": NAMES[actor], "role": "GERENCIA" if actor == "user-ricardo" else "OPERACAO", "setor": "Campinas"}
    ctx.add_init_script("localStorage.setItem('pwa_mapa_auth_session_v1', JSON.stringify(" + json.dumps(user) + "));" )
    return ctx


def marks(locator, labels, width, height):
    out = []
    for index, (selector, name) in enumerate(labels, 1):
        found = locator.locator(selector).first
        box = found.bounding_box(timeout=4000) if found.count() else None
        if box:
            x = max(26, min(width - 26, box["x"] + min(24, box["width"] / 3)))
            y = max(26, min(height - 26, box["y"] + min(20, box["height"] / 2)))
        else:
            x, y = max(26, width - 46), 125 + index * 52
        out.append({"numero": index, "nome": name, "x": round(x), "y": round(y), "selector": selector,
                    "encontrado": bool(box)})
    return out


def annotate(ctx, source: Path, dest: Path, dots: list[dict], width: int, height: int):
    image_data = "data:image/png;base64," + base64.b64encode(source.read_bytes()).decode()
    page = ctx.new_page()
    page.goto("about:blank")
    result = page.evaluate("""async ({imageData,dots,width,height}) => {
      const image = new Image(); image.src=imageData; await image.decode();
      const canvas=document.createElement('canvas'); canvas.width=width; canvas.height=height;
      const c=canvas.getContext('2d'); c.drawImage(image,0,0,width,height);
      for(const dot of dots){
        c.beginPath(); c.arc(dot.x,dot.y,18,0,Math.PI*2); c.fillStyle='#F28C38'; c.fill();
        c.lineWidth=3; c.strokeStyle='#fff'; c.stroke();
        c.font='bold 18px Arial'; c.fillStyle='#102541'; c.textAlign='center'; c.textBaseline='middle';
        c.fillText(String(dot.numero),dot.x,dot.y+1);
      }
      return canvas.toDataURL('image/png').split(',')[1];
    }""", {"imageData": image_data, "dots": dots, "width": width, "height": height})
    dest.write_bytes(base64.b64decode(result))
    page.close()


def capture_shell(browser, case, size_name, tokens):
    stem, actor, route, mode, labels = case
    width, height = SIZES[size_name]
    ctx = context(browser, actor, (width, height), tokens)
    page = ctx.new_page()
    errors = []
    page.on("pageerror", lambda err: errors.append(str(err)))
    page.goto(ROOT + "/unificado/?view=" + quote("suprimentos/" + route, safe=""), wait_until="domcontentloaded")
    frame = page.frame_locator("#module-host iframe.is-active")
    frame.locator("main#app h1").first.wait_for(timeout=15000)
    page.locator("body.nav-modern-ready").wait_for(timeout=15000)
    if size_name == "pc" and page.locator(".nav-modern.is-collapsed").count():
        page.locator(".nav-rail-menu").click()
    if mode == "batch":
        enabled = frame.locator(".select-row:not([disabled])").first
        enabled.wait_for(timeout=10000)
        enabled.check()
    elif mode == "details":
        page.once("dialog", lambda dialog: dialog.accept("DEMO — luva de raspa G"))
        frame.locator("#free-item").click()
        frame.locator("#continue").click()
        frame.locator("#request-cc").wait_for(timeout=8000)
    elif mode and mode.startswith("stock:"):
        frame.locator('[data-tab="' + mode.split(':', 1)[1] + '"]').click()
        frame.locator('#stock-panel').wait_for(timeout=8000)
    elif mode and mode not in ("batch", "details"):
        frame.locator('[data-resource="' + mode + '"]').click()
        frame.locator('[data-resource="' + mode + '"].active').wait_for(timeout=8000)
    page.wait_for_timeout(500)
    base = DIR / f"{stem}-{size_name}"
    source = base.with_suffix(".png")
    page.screenshot(path=str(source), full_page=False)
    dots = marks(frame, labels, width, height)
    annotate(ctx, source, DIR / f"{stem}-{size_name}-anotada.png", dots, width, height)
    info = {"tela": stem, "tamanho": size_name, "papel": actor, "rota": route,
            "arquivo": source.name, "marcadores": dots, "erros": errors}
    ctx.close()
    print(stem, size_name, "OK", flush=True)
    return info


def capture_pwa(browser, case, size_name, tokens):
    stem, actor, mode, labels = case
    width, height = SIZES[size_name]
    ctx = context(browser, actor, (width, height), tokens)
    page = ctx.new_page()
    errors = []
    page.on("pageerror", lambda err: errors.append(str(err)))
    page.goto(ROOT + "/unificado/suprimentos/pwa/", wait_until="domcontentloaded")
    page.locator(".hello").wait_for(timeout=15000)
    if mode in ("nova", "offline"):
        page.locator('[data-view="nova"]').first.click()
        page.locator("#search").wait_for(timeout=8000)
        if mode == "offline":
            page.once("dialog", lambda dialog: dialog.accept("DEMO — luva de raspa G"))
            page.locator("#free").click()
            ctx.set_offline(True)
            page.locator("#continue").click()
            page.locator(".banner.warn").wait_for(timeout=8000)
    elif mode == "minhas":
        page.locator('[data-view="minhas"]').first.click()
    elif mode == "acompanhar":
        page.locator('[data-view="minhas"]').first.click()
        page.locator('[data-detail="' + DEMO["entregue"]["id"] + '"]').click()
        page.locator("#received").wait_for(timeout=8000)
    elif mode == "aprovar":
        page.locator('[data-view="aprovar"]').first.click()
        page.locator(".approve-card").first.wait_for(timeout=8000)
    page.wait_for_timeout(450)
    base = DIR / f"{stem}-{size_name}"
    source = base.with_suffix(".png")
    page.screenshot(path=str(source), full_page=(mode == "acompanhar"))
    image_width, image_height = Image.open(source).size
    dots = marks(page, labels, image_width, image_height)
    annotate(ctx, source, DIR / f"{stem}-{size_name}-anotada.png", dots, image_width, image_height)
    info = {"tela": stem, "tamanho": size_name, "papel": actor, "rota": "pwa/",
            "arquivo": source.name, "marcadores": dots, "erros": errors}
    ctx.close()
    print(stem, size_name, "OK", flush=True)
    return info


def main():
    DIR.mkdir(parents=True, exist_ok=True)
    only = set(sys.argv[1:])
    tokens = {actor: test_cookie_for(actor) for actor in NAMES}
    inventory_path = DIR.parent / "capturas.json"
    inventory = json.loads(inventory_path.read_text(encoding="utf-8")) if only and inventory_path.exists() else []
    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(headless=True)
        for case in CASES:
            if only and case[0] not in only:
                continue
            for size_name in SIZES:
                new = capture_shell(browser, case, size_name, tokens)
                inventory = [r for r in inventory if (r["tela"],r["tamanho"]) != (new["tela"],new["tamanho"])] + [new]
                inventory_path.write_text(json.dumps(inventory, ensure_ascii=False, indent=2), encoding="utf-8")
        for case in PWA_CASES:
            if only and case[0] not in only:
                continue
            for size_name in ("celular", "tablet"):
                new = capture_pwa(browser, case, size_name, tokens)
                inventory = [r for r in inventory if (r["tela"],r["tamanho"]) != (new["tela"],new["tamanho"])] + [new]
                inventory_path.write_text(json.dumps(inventory, ensure_ascii=False, indent=2), encoding="utf-8")
        browser.close()
    print("CAPTURAS_OK", len(inventory), flush=True)


if __name__ == "__main__":
    main()

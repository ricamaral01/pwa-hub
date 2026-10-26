"""Detalhes F1 autenticados na casca: fornecedor, mapa e pedido DEMO."""
from __future__ import annotations
import json
import mimetypes
import os
import time
from pathlib import Path
from urllib.parse import quote
from playwright.sync_api import sync_playwright
from check_layout_shell import ROOT,SIZES,AUDIT_JS,context_for,active_frame,menu_state

OUT=Path("docs/porting/suprimentos/capturas/f1-detalhes")
STATIC=Path(os.environ['TEMP'])/'sup-f1-static-167'/'unificado'
STATE=json.loads(Path(os.environ["TEMP"],"sup-f1-demo-ids.json").read_text(encoding="utf-8"))
ROUTES={
    "e2e-suprimentos-compras":[("fornecedor",STATE["fornecedores"][0]),("cotacao",STATE["cotacao"]),("pedido",STATE["pedido"])],
    "e2e-suprimentos-qualidade":[("fornecedor",STATE["fornecedores"][0]),("cotacao",STATE["cotacao"])],
    "e2e-suprimentos-almox":[("pedido",STATE["pedido"])],
    "e2e-suprimentos-aprov1":[("cotacao",STATE["cotacao"])],
}

def destination(kind,ident):
    tail=("fornecedores/" if kind=="fornecedor" else "cotacoes/")+"?id="+ident
    if kind=="pedido":tail+="&tab=pedido"
    return ROOT+"/unificado/?view="+quote("suprimentos/"+tail,safe="")

def static_snapshot(route):
    from urllib.parse import urlsplit, unquote
    url=urlsplit(route.request.url)
    prefix='/unificado/'
    if not url.path.startswith(prefix):
        return route.continue_()
    path=unquote(url.path[len(prefix):]) or 'index.html'
    if path.startswith(('mapa/api/','suprimentos/api/')) or '..' in Path(path).parts:
        return route.continue_()
    file=STATIC/path
    if not file.is_file(): file=Path('unificado')/path
    if file.is_file():
        mime=mimetypes.guess_type(file.name)[0] or 'application/octet-stream'
        return route.fulfill(status=200,path=str(file),content_type=mime)
    return route.continue_()

def main():
    OUT.mkdir(parents=True,exist_ok=True)
    passwords=json.loads(Path("C:/Users/Admin/Downloads/suprimentos-homolog-logins-20261025.json").read_text(encoding="utf-8"))
    results=[]
    with sync_playwright() as p:
        browser=p.chromium.launch(headless=True)
        selected_actors=set(os.getenv('SUP_F1_DETAIL_ACTORS',','.join(ROUTES)).split(','))
        selected_sizes=set(os.getenv('SUP_F1_DETAIL_SIZES',','.join(f'{w}x{h}' for w,h in SIZES)).split(','))
        for actor,routes in ROUTES.items():
            if actor not in selected_actors: continue
            for width,height in SIZES:
                if f'{width}x{height}' not in selected_sizes: continue
                for zoom in (100,125):
                    for attempt in range(5):
                        try:
                            ctx=context_for(browser,actor,width,height,zoom,passwords,"")
                            break
                        except RuntimeError as exc:
                            if "HTTP 503" not in str(exc) or attempt==4:raise
                            time.sleep(2*(attempt+1))
                    # O @import remoto da casca pode ficar pendente no CI; a fonte
                    # local/fallback continua verificável sem depender do Google.
                    ctx.route('https://fonts.googleapis.com/**', lambda route: route.fulfill(status=200,content_type='text/css',body=''))
                    ctx.route('https://fonts.gstatic.com/**', lambda route: route.fulfill(status=200,content_type='font/woff2',body=''))
                    ctx.route('**/unificado/**', static_snapshot)
                    page=ctx.new_page()
                    errors=[];missing=[]
                    page.on("pageerror",lambda e:errors.append(str(e)))
                    page.on("console",lambda m:errors.append(m.text) if m.type=="error" else None)
                    page.on("response",lambda r:missing.append(r.url) if r.status==404 and any(ext in r.url for ext in (".js",".css",".woff",".png")) else None)
                    for kind,ident in routes:
                        errors.clear();missing.clear()
                        page.goto(destination(kind,ident),wait_until="commit",timeout=60000)
                        page.locator('#module-host iframe.is-active').wait_for(timeout=120000)
                        frame=active_frame(page)
                        if frame.locator(".loading-state").count():
                            frame.locator(".loading-state").wait_for(state="detached",timeout=120000)
                        for menu in ("aberto","recolhido"):
                            menu_state(page,menu)
                            shell=page.evaluate(AUDIT_JS)
                            inner=next(f for f in page.frames if "/unificado/suprimentos/" in f.url).evaluate(AUDIT_JS)
                            intentional=lambda x:x["scroll"] and not x["outside"] and x["element"].startswith(("div.table-scroll","div.tabs","nav.tabs"))
                            bad=[x for x in shell["entries"]+inner["entries"] if not x["contained"] and not intentional(x)]
                            name=f"{actor}-{kind}-{width}x{height}-z{zoom}-{menu}"
                            page.screenshot(path=str(OUT/(name+".png")),timeout=10000)
                            results.append({"actor":actor,"kind":kind,"size":f"{width}x{height}","zoom":zoom,
                                            "menu":menu,"shellHorizontal":shell["horizontal"],
                                            "iframeHorizontal":inner["horizontal"],"uncontained":bad,
                                            "errors":list(errors),"missing":list(missing),
                                            "text":frame.locator("main#app").inner_text()[:150],
                                            "screenshot":name+".png"})
                        print(actor,kind,f"{width}x{height}",zoom,flush=True)
                        (OUT/"diagnostico-partial.json").write_text(json.dumps(results,ensure_ascii=False),encoding="utf-8")
                    ctx.close()
        browser.close()
    (OUT/"diagnostico.json").write_text(json.dumps(results,ensure_ascii=False,indent=2),encoding="utf-8")
    bad=[r for r in results if r["shellHorizontal"] or r["iframeHorizontal"] or r["uncontained"] or
         r["errors"] or r["missing"] or "Não foi possível carregar" in r["text"]]
    print("F1_DETAIL_LAYOUT",len(results),"FALHAS",len(bad))
    for r in bad[:8]:
        print(r["actor"],r["kind"],r["size"],r["zoom"],r["menu"],r["uncontained"][:2],r["errors"][:1],r["missing"][:1],r["text"][:60])
    if bad:raise SystemExit(1)

if __name__=="__main__":main()

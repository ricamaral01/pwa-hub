"""Audita as telas F1 pela casca autenticada de :18446 e salva PNG/JSON.

As credenciais são lidas do arquivo protegido de homologação, fora do Git.
"""
from __future__ import annotations
import json
import time
from pathlib import Path
from urllib.parse import quote
from playwright.sync_api import sync_playwright
from check_layout_shell import ROOT, SIZES, AUDIT_JS, context_for, active_frame, menu_state
from check_layout_f1_detail import static_snapshot

OUT=Path("docs/porting/suprimentos/capturas/f1")
ACTORS={
    "e2e-suprimentos-compras": ["fornecedores/","cotacoes/"],
    "e2e-suprimentos-qualidade": ["fornecedores/","cotacoes/"],
    "e2e-suprimentos-almox": ["cotacoes/","solicitacao/"],
    "e2e-suprimentos-aprov1": ["cotacoes/"],
}

def main():
    OUT.mkdir(parents=True,exist_ok=True)
    credentials=json.loads(Path("C:/Users/Admin/Downloads/suprimentos-homolog-logins-20261025.json").read_text(encoding="utf-8"))
    results=[]
    with sync_playwright() as playwright:
        browser=playwright.chromium.launch(headless=True)
        for actor,routes in ACTORS.items():
            for width,height in SIZES:
                for zoom in (100,125):
                    for attempt in range(5):
                        try:
                            ctx=context_for(browser,actor,width,height,zoom,credentials,"")
                            break
                        except RuntimeError as exc:
                            if "HTTP 503" not in str(exc) or attempt==4:raise
                            time.sleep(2*(attempt+1))
                    ctx.route('https://fonts.googleapis.com/**', lambda route: route.fulfill(status=200,content_type='text/css',body=''))
                    ctx.route('https://fonts.gstatic.com/**', lambda route: route.fulfill(status=200,content_type='font/woff2',body=''))
                    ctx.route('**/unificado/**', static_snapshot)
                    page=ctx.new_page()
                    failures=[];missing=[]
                    page.on("pageerror",lambda e:failures.append(str(e)))
                    page.on("console",lambda m:failures.append(m.text) if m.type=="error" else None)
                    page.on("response",lambda r:missing.append(r.url) if r.status==404 and any(ext in r.url for ext in (".js",".css",".woff",".png")) else None)
                    detail_id=None
                    if "solicitacao/" in routes:
                        r=ctx.request.get(ROOT+"/api/suprimentos/solicitacoes?size=1")
                        if r.ok:
                            rows=r.json().get("items",[])
                            if rows:detail_id=rows[0]["id"]
                    for route in routes:
                        if route=="solicitacao/" and not detail_id:continue
                        suffix=route+("?id="+detail_id if route=="solicitacao/" else "")
                        target=ROOT+"/unificado/?view="+quote("suprimentos/"+suffix,safe="")
                        failures.clear();missing.clear()
                        page.goto(target,wait_until="commit",timeout=60000)
                        page.locator('#module-host iframe.is-active').wait_for(timeout=120000)
                        frame=active_frame(page)
                        frame.locator(".loading-state").wait_for(state="detached",timeout=120000) if frame.locator(".loading-state").count() else None
                        if route in ('fornecedores/','cotacoes/'):
                            frame.locator('.sup-buy-card').first.wait_for(timeout=120000)
                        page.wait_for_function("!document.querySelector('#module-host')?.classList.contains('is-loading')",timeout=30000)
                        for menu in ("aberto","recolhido"):
                            menu_state(page,menu)
                            shell=page.evaluate(AUDIT_JS)
                            actual=next(f for f in page.frames if "/unificado/suprimentos/" in f.url)
                            inside=actual.evaluate(AUDIT_JS)
                            text=frame.locator("main#app").inner_text()[:180]
                            name=f"{actor}-{route.strip('/')}-{width}x{height}-z{zoom}-{menu}"
                            page.screenshot(path=str(OUT/(name+".png")),timeout=10000)
                            intentional=lambda x: x["scroll"] and not x["outside"] and x["element"].startswith(("div.table-scroll","nav.tabs"))
                            bad=[x for x in shell["entries"]+inside["entries"] if not x["contained"] and not intentional(x)]
                            result={"actor":actor,"route":route,"size":f"{width}x{height}","zoom":zoom,"menu":menu,
                                    "shellHorizontal":shell["horizontal"],"iframeHorizontal":inside["horizontal"],
                                    "uncontained":bad,"errors":list(failures),"missing":list(missing),
                                    "content":text,"screenshot":name+".png"}
                            results.append(result)
                        print(actor,route,f"{width}x{height}",zoom,flush=True)
                        (OUT/"diagnostico-partial.json").write_text(json.dumps(results,ensure_ascii=False),encoding="utf-8")
                    ctx.close()
        browser.close()
    (OUT/"diagnostico.json").write_text(json.dumps(results,ensure_ascii=False,indent=2),encoding="utf-8")
    bad=[r for r in results if r["shellHorizontal"] or r["iframeHorizontal"] or r["uncontained"] or r["errors"] or r["missing"] or
         "Não foi possível carregar" in r["content"]]
    print("F1_LAYOUT",len(results),"FALHAS",len(bad),flush=True)
    if bad:
        for item in bad[:8]:
            print(item["actor"],item["route"],item["size"],item["zoom"],item["menu"],
                  item["content"][:70],"overflow",len(item["uncontained"]),"errors",item["errors"][:2],"missing",item["missing"][:2])
        raise SystemExit(1)

if __name__=="__main__":main()

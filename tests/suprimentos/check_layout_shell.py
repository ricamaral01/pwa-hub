"""Auditoria visual real em :18446, sempre pela casca autenticada.

Credenciais e assertion efêmera são lidas fora do Git. Exemplo:
python tests/suprimentos/check_layout_shell.py antes --sizes 1366x768,820x1180
"""
from __future__ import annotations

import argparse
import json
import os
import sys
from pathlib import Path
from urllib.parse import quote

from playwright.sync_api import sync_playwright

ROOT = "https://concrefer.concretrack.com.br:18446"
SIZES = [(1366, 768), (1440, 900), (1920, 1080), (820, 1180),
         (1180, 820), (390, 844), (360, 780)]
ROUTES = ["painel/", "solicitacoes/", "solicitacao/", "nova/", "fornecedores/", "cadastros/"]
ACTORS = ["e2e-suprimentos-sol", "e2e-suprimentos-aprov1",
          "e2e-suprimentos-almox", "ricardo.teste"]

AUDIT_JS = """() => {
  const doc=document.documentElement;
  const box=(el)=>el.getBoundingClientRect();
  const visible=(el)=>{const s=getComputedStyle(el),r=box(el);return s.display!=='none' && s.visibility!=='hidden' && r.width>1 && r.height>1};
  const name=(el)=>el.tagName.toLowerCase()+(el.id?'#'+el.id:'')+(typeof el.className==='string'&&el.className.trim()?'.'+el.className.trim().split(/\\s+/).slice(0,3).join('.'): '');
  const entries=[];
  for(const el of document.querySelectorAll('*')){
    if(!visible(el)||!el.parentElement)continue;
    const r=box(el), p=box(el.parentElement);
    const scroll=el.scrollWidth>el.clientWidth+1;
    const outside=r.right>p.right+1 || r.left<p.left-1;
    if(!scroll&&!outside)continue;
    let contained=false, container='';
    for(let q=el.parentElement;q;q=q.parentElement){
      const st=getComputedStyle(q), qr=box(q);
      if(['auto','scroll','hidden','clip'].includes(st.overflowX) && qr.width>0){contained=true;container=name(q);break;}
    }
    entries.push({element:name(el),width:Math.round(r.width),scrollWidth:el.scrollWidth,clientWidth:el.clientWidth,
      parent:name(el.parentElement),parentWidth:Math.round(p.width),scroll,outside,contained,container});
  }
  return {viewport:innerWidth,docScroll:doc.scrollWidth,bodyScroll:document.body.scrollWidth,
    horizontal:doc.scrollWidth>innerWidth+1,entries};
}"""

def context_for(browser, actor, width, height, zoom, passwords, token):
    factor=zoom/100
    css_width=round(width/factor); css_height=round(height/factor)
    mobile=width<768
    ctx=browser.new_context(viewport={"width":css_width,"height":css_height},
                            device_scale_factor=factor,is_mobile=mobile,has_touch=mobile)
    if token:
        ctx.add_cookies([{"name":"mapa_unificado_homolog_session","value":token,
                          "domain":"concrefer.concretrack.com.br","path":"/unificado/",
                          "httpOnly":True,"secure":True,"sameSite":"Lax"}])
        user={"id":actor,"name":"Ricardo" if actor=="ricardo.teste" else actor,
              "role":"GERENCIA" if actor=="ricardo.teste" else "USUARIO","setor":"Todos"}
    else:
        response=ctx.request.post(ROOT+"/unificado/mapa/api/login",
                                  data={"name":actor,"password":passwords[actor]})
        if response.status!=200: raise RuntimeError(f"{actor} login HTTP {response.status}")
        user=response.json()["user"]
    bootstrap=ctx.request.post(ROOT+"/unificado/mapa/api/unified/suprimentos-bootstrap")
    if bootstrap.status!=200: raise RuntimeError(f"{actor} bootstrap HTTP {bootstrap.status}")
    ctx.add_init_script("localStorage.setItem('pwa_mapa_auth_session_v1', JSON.stringify("+json.dumps(user)+"));")
    return ctx

def active_frame(page):
    page.locator("#module-host iframe.is-active").wait_for(timeout=12000)
    frame=page.frame_locator("#module-host iframe.is-active")
    frame.locator("main#app").wait_for(timeout=12000)
    page.wait_for_timeout(250)
    return frame

def menu_state(page, target):
    mobile=page.evaluate("matchMedia('(max-width: 767px)').matches")
    if mobile:
        is_open=page.evaluate("document.body.classList.contains('nav-mobile-open')")
        if target=="aberto" and not is_open:
            page.locator("button.nav-mobile-icon:visible").first.click(timeout=2500)
        elif target=="recolhido" and is_open:
            for selector in ("button.nav-panel-close:visible","button.nav-mobile-icon:visible"):
                el=page.locator(selector)
                if el.count():
                    el.first.click(timeout=2500)
                    break
        page.wait_for_timeout(180)
        return
    if target=="recolhido":
        for selector in ("button.nav-panel-close:visible","button.sb-collapse:visible",
                         "button.shared-menu-toggle:visible"):
            el=page.locator(selector)
            if el.count():
                el.first.click(timeout=2500)
                break
    else:
        if not page.locator("button.nav-panel-close:visible").count():
            for selector in ("button.nav-collapse:visible","button.nav-rail-menu:visible",
                             "button.sb-collapse:visible","button.shared-menu-toggle:visible"):
                el=page.locator(selector)
                if el.count():
                    el.first.click(timeout=2500)
                    break
    page.wait_for_timeout(180)

def append_result(path, item):
    with path.open("a",encoding="utf-8") as handle:
        handle.write(json.dumps(item,ensure_ascii=False,separators=(",",":"))+"\n")

def main():
    ap=argparse.ArgumentParser()
    ap.add_argument("phase",choices=["antes","depois"])
    ap.add_argument("--sizes",default=",".join(f"{w}x{h}" for w,h in SIZES))
    ap.add_argument("--actors",default=",".join(ACTORS))
    ap.add_argument("--tag",default="")
    args=ap.parse_args()
    sizes=[tuple(map(int,item.split("x"))) for item in args.sizes.split(",")]
    actors=args.actors.split(",")
    root=Path("docs/porting/suprimentos/capturas/layout-fix")/args.phase
    root.mkdir(parents=True,exist_ok=True)
    result_path=root/("diagnostico"+("-"+args.tag if args.tag else "")+".jsonl")
    passwords=json.loads(Path("C:/Users/Admin/Downloads/suprimentos-homolog-logins-20261025.json").read_text(encoding="utf-8"))
    token=(Path(os.environ["TEMP"],"suprimentos-layout-ricardo-token").read_text(encoding="utf-8").strip()
           if "ricardo.teste" in actors else "")
    with sync_playwright() as pw:
        browser=pw.chromium.launch(headless=True)
        for actor in actors:
            for width,height in sizes:
                for zoom in (100,125):
                    ctx=context_for(browser,actor,width,height,zoom,passwords,token)
                    page=ctx.new_page()
                    errors=[]; missing=[]
                    page.on("console",lambda msg: errors.append({"text":msg.text,"url":msg.location.get("url","")}) if msg.type=="error" else None)
                    page.on("pageerror",lambda err: errors.append({"text":str(err),"url":"pageerror"}))
                    page.on("response",lambda response: missing.append({"status":response.status,"url":response.url}) if response.status==404 and any(x in response.url for x in ('.css','.js','.woff','.png','.webmanifest')) else None)
                    reqs=ctx.request.get(ROOT+"/api/suprimentos/solicitacoes?size=1&page=1")
                    request_id=None
                    if reqs.status==200:
                        data=reqs.json()
                        rows=data.get("items",data.get("solicitacoes",[]))
                        if rows: request_id=rows[0].get("id")
                    for route in ROUTES:
                        tail=route+("?id="+str(request_id) if route=="solicitacao/" and request_id else "")
                        target=ROOT+"/unificado/?view="+quote("suprimentos/"+tail,safe="")
                        errors.clear();missing.clear()
                        page.goto(target,wait_until="domcontentloaded",timeout=20000)
                        try:
                            frame=active_frame(page)
                            loaded=True
                        except Exception:
                            frame=None;loaded=False
                        for state in ("aberto","recolhido"):
                            menu_state(page,state)
                            stem=f"{actor}-{route.strip('/')}-{width}x{height}-z{zoom}-{state}"
                            try:
                                shell=page.evaluate(AUDIT_JS)
                                inner=frame.locator("main#app").evaluate("el => ({text:el.innerText.slice(0,180)})") if frame else None
                                live_frame=next((f for f in page.frames if "/unificado/suprimentos/" in f.url),None)
                                iframe=live_frame.evaluate(AUDIT_JS) if live_frame else None
                                css=live_frame.evaluate("[...document.styleSheets].map(s=>s.href).filter(Boolean)") if live_frame else []
                                page.screenshot(path=str(root/(stem+".png")),full_page=False,timeout=10000)
                                item={"actor":actor,"route":route,"size":f"{width}x{height}","zoom":zoom,"menu":state,
                                      "url":page.url,"loaded":loaded,"inner":inner,"shell":shell,"iframe":iframe,"css":css,
                                      "errors":list(errors),"missing":list(missing),"screenshot":stem+".png"}
                                append_result(result_path,item)
                            except Exception as exc:
                                append_result(result_path,{"actor":actor,"route":route,"size":f"{width}x{height}",
                                                           "zoom":zoom,"menu":state,"failure":str(exc)[:500]})
                        print(f"{args.phase} {actor} {width}x{height} z{zoom} {route}",flush=True)
                    ctx.close()
        # PWA direto, com sessão real, nos dois tamanhos móveis.
        for width,height in ((390,844),(360,780)):
            if "e2e-suprimentos-sol" not in actors or (width,height) not in sizes:
                continue
            for zoom in (100,125):
                ctx=context_for(browser,"e2e-suprimentos-sol",width,height,zoom,passwords,token)
                page=ctx.new_page();errors=[];missing=[]
                page.on("console",lambda msg: errors.append(msg.text) if msg.type=="error" else None)
                page.on("response",lambda r: missing.append(r.url) if r.status==404 else None)
                page.goto(ROOT+"/unificado/suprimentos/pwa/",wait_until="domcontentloaded")
                page.wait_for_timeout(350)
                stem=f"pwa-{width}x{height}-z{zoom}"
                page.screenshot(path=str(root/(stem+".png")),full_page=False)
                append_result(result_path,{"actor":"e2e-suprimentos-sol","route":"pwa/","size":f"{width}x{height}",
                                           "zoom":zoom,"menu":"sem casca","shell":page.evaluate(AUDIT_JS),
                                           "errors":errors,"missing":missing,"screenshot":stem+".png"})
                ctx.close()
        browser.close()
    print("MATRIX_DONE",result_path,flush=True)

if __name__=="__main__": main()

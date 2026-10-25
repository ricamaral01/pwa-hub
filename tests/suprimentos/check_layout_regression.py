"""Capturas de PCP/Mão de Obra e Laboratório pela casca em homologação."""
from __future__ import annotations
import json,os,sys
from pathlib import Path
from urllib.parse import quote
from playwright.sync_api import sync_playwright

ROOT="https://concrefer.concretrack.com.br:18446"
phase=sys.argv[1]
out=Path("docs/porting/suprimentos/capturas/layout-fix")/phase
out.mkdir(parents=True,exist_ok=True)
token=Path(os.environ["TEMP"],"suprimentos-layout-ricardo-token").read_text(encoding="utf-8").strip()
pcp=json.loads(Path(os.environ["TEMP"],"suprimentos-layout-pcp-session.json").read_text(encoding="utf-8"))
with sync_playwright() as pw:
    browser=pw.chromium.launch(headless=True)
    for module,view in (("pcp-maodeobra","pcp/maodeobra/"),("laboratorio","laboratorio/")):
        for width,height in ((1440,900),(820,1180)):
            ctx=browser.new_context(viewport={"width":width,"height":height})
            ctx.add_cookies([{"name":"mapa_unificado_homolog_session","value":token,
                "domain":"concrefer.concretrack.com.br","path":"/unificado/",
                "httpOnly":True,"secure":True,"sameSite":"Lax"}])
            user={"id":"ricardo.teste","name":"Ricardo","role":"GERENCIA","setor":"Todos"}
            script=("localStorage.setItem('pwa_mapa_auth_session_v1', JSON.stringify("+json.dumps(user)+"));"
                +"localStorage.setItem('pcp_token',"+json.dumps(pcp['token'])+");"
                +"localStorage.setItem('pcp_user',JSON.stringify("+json.dumps(pcp['user'])+"));")
            ctx.add_init_script(script)
            page=ctx.new_page()
            errors=[]
            page.on("pageerror",lambda e:errors.append(str(e)))
            page.goto(ROOT+"/unificado/?view="+quote(view,safe=""),wait_until="domcontentloaded")
            expected="Temperatura de cura" if module=="laboratorio" else "REGISTRO EM TABELA"
            page.wait_for_function("text => {const f=document.querySelector('#module-host iframe.is-active'); return f?.contentDocument?.body?.innerText?.includes(text)}",arg=expected,timeout=20000)
            page.wait_for_timeout(300)
            frame=next((f for f in page.frames if f is not page.main_frame),None)
            item={"module":module,"size":f"{width}x{height}","url":page.url,
                  "frame":frame.url if frame else None,"errors":errors,
                  "shell_scroll":page.evaluate("document.documentElement.scrollWidth>innerWidth+1")}
            page.screenshot(path=str(out/f"regressao-{module}-{width}x{height}.png"),full_page=False)
            (out/f"regressao-{module}-{width}x{height}.json").write_text(json.dumps(item,ensure_ascii=False,indent=2),encoding="utf-8")
            print(phase,module,width,height,frame.url if frame else "NO_FRAME",flush=True)
            ctx.close()
    browser.close()

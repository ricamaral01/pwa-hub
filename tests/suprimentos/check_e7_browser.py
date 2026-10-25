"""Capturas autenticadas da homologação em PC, tablet e celular."""
from __future__ import annotations
import json
import sys
from pathlib import Path
from playwright.sync_api import sync_playwright

ROOT="https://concrefer.concretrack.com.br:18446"
password=json.loads(Path(sys.argv[1]).read_text(encoding="utf-8"))["e2e-suprimentos-sol"]
captures=Path(sys.argv[2]);captures.mkdir(parents=True,exist_ok=True)
with sync_playwright() as pw:
    browser=pw.chromium.launch(headless=True)
    for name,width,height,mobile in [("pc",1440,900,False),("tablet",820,1180,False),("celular",390,844,True)]:
        context=browser.new_context(viewport={"width":width,"height":height},is_mobile=mobile,
                                    has_touch=mobile,device_scale_factor=1)
        login=context.request.post(ROOT+"/unificado/mapa/api/login",
                                   data={"name":"e2e-suprimentos-sol","password":password})
        assert login.status==200,(name,login.status)
        bootstrap=context.request.post(ROOT+"/unificado/mapa/api/unified/suprimentos-bootstrap")
        assert bootstrap.status==200,(name,bootstrap.status)
        page=context.new_page()
        page.goto(ROOT+("/unificado/suprimentos/pwa/" if mobile else "/unificado/suprimentos/painel/"),wait_until="domcontentloaded")
        if mobile:
            page.get_by_role("heading",name="Olá, Teste").wait_for(timeout=20000)
        else:
            page.get_by_text("Painel de suprimentos").first.wait_for(timeout=20000)
        page.screenshot(path=str(captures/f"{name}-painel.png"),full_page=True)
        assert page.evaluate("document.documentElement.scrollWidth <= innerWidth"),name
        if mobile:
            assert page.get_by_role("heading",name="Olá, Teste").is_visible()
            scope=page.evaluate("navigator.serviceWorker.ready.then(r=>r.scope)")
            assert scope==ROOT+"/unificado/suprimentos/pwa/",scope
            page.reload(wait_until="domcontentloaded")
            assert page.evaluate("navigator.serviceWorker.controller?.scriptURL.endsWith('/unificado/suprimentos/pwa/sw.js')"),"SW não controla a página"
            context.set_offline(True)
            page.reload(wait_until="domcontentloaded")
            assert page.get_by_role("heading",name="Olá, Teste").is_visible(),"PWA não abre offline"
            context.set_offline(False)
            page.get_by_role("button",name="＋ Nova solicitação").click()
            page.screenshot(path=str(captures/"celular-nova.png"),full_page=True)
            assert page.evaluate("document.documentElement.scrollWidth <= innerWidth")
        else:
            assert page.get_by_text("Painel de suprimentos").first.is_visible()
        context.close()
    browser.close()
print("BROWSER_OK PC=1440 tablet=820 celular=390 SW=scope-próprio")

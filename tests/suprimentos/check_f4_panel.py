"""Audita o Painel alterado pela F4 pela casca autenticada da homologação."""
from __future__ import annotations

import json
import argparse
from pathlib import Path
from urllib.parse import quote
import requests

from playwright.sync_api import sync_playwright

from check_layout_shell import AUDIT_JS, ROOT, SIZES, menu_state, active_frame

ACTOR = "e2e-suprimentos-compras"
OUT = Path("docs/porting/suprimentos/capturas/f4")


def authenticated_session(passwords):
    session = requests.Session()
    response = session.post(ROOT + "/unificado/mapa/api/login",
        json={"name": ACTOR, "password": passwords[ACTOR]}, timeout=15)
    if response.status_code != 200:
        raise RuntimeError(f"{ACTOR} login HTTP {response.status_code}")
    user = response.json()["user"]
    bootstrap = session.post(ROOT + "/unificado/mapa/api/unified/suprimentos-bootstrap", timeout=15)
    if bootstrap.status_code != 200:
        raise RuntimeError(f"{ACTOR} bootstrap HTTP {bootstrap.status_code}")
    return user, [{"name": cookie.name, "value": cookie.value,
        "domain": "concrefer.concretrack.com.br", "path": cookie.path,
        "httpOnly": True, "secure": True, "sameSite": "Lax"} for cookie in session.cookies]


def context_for(browser, width, height, zoom, user, cookies):
    factor = zoom / 100
    mobile = width < 768
    ctx = browser.new_context(viewport={"width": round(width / factor), "height": round(height / factor)},
        device_scale_factor=factor, is_mobile=mobile, has_touch=mobile)
    ctx.add_cookies(cookies)
    ctx.add_init_script("localStorage.setItem('pwa_mapa_auth_session_v1', JSON.stringify(" + json.dumps(user) + "));")
    return ctx


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--sizes', default=','.join(f'{w}x{h}' for w,h in SIZES))
    parser.add_argument('--simulate-s4', action='store_true', help='Mostra o cartão com dados simulados sem ligar a flag no servidor')
    args = parser.parse_args()
    OUT.mkdir(parents=True, exist_ok=True)
    passwords = json.loads(Path("C:/Users/Admin/Downloads/suprimentos-homolog-logins-20261025.json").read_text(encoding="utf-8"))
    user, cookies = authenticated_session(passwords)
    results = []
    with sync_playwright() as pw:
        browser = pw.chromium.launch(headless=True)
        sizes = [tuple(map(int, part.split('x'))) for part in args.sizes.split(',')]
        for width, height in sizes:
            for zoom in (100, 125):
                ctx = context_for(browser, width, height, zoom, user, cookies)
                if args.simulate_s4:
                    def fake_me(route):
                        response = route.fetch()
                        data = response.json()
                        data.setdefault('flags', {})['S4'] = True
                        route.fulfill(response=response, json=data)
                    ctx.route('**/api/suprimentos/me', fake_me)
                    ctx.route('**/api/suprimentos/integracao/sugestoes?*', lambda route: route.fulfill(
                        status=200, content_type='application/json',
                        body=json.dumps({'total': 1, 'items': [{'material_descricao': 'Cimento para silo',
                            'destino_ref': 'Silo Campinas', 'qtd': '15.25', 'data_limite': '2026-11-04'}]})))
                page = ctx.new_page()
                errors, missing, forbidden = [], [], []
                page.on("console", lambda msg: errors.append(msg.text) if msg.type == "error" else None)
                page.on("pageerror", lambda err: errors.append(str(err)))
                page.on("response", lambda response: missing.append(response.url) if response.status == 404 and any(x in response.url for x in ('.css', '.js', '.woff', '.png', '.webmanifest')) else None)
                page.on("response", lambda response: forbidden.append(response.url) if response.status == 403 else None)
                page.goto(ROOT + "/unificado/?view=" + quote("suprimentos/painel/", safe=""), wait_until="domcontentloaded")
                active_frame(page)
                if args.simulate_s4:
                    page.frame_locator('#module-host iframe.is-active').get_by_text('Silos da usina', exact=False).wait_for(timeout=10000)
                for menu in ("aberto", "recolhido"):
                    menu_state(page, menu)
                    frame = next((f for f in page.frames if "/unificado/suprimentos/" in f.url), None)
                    shell = page.evaluate(AUDIT_JS)
                    inner = frame.evaluate(AUDIT_JS) if frame else None
                    stem = f"compras-painel-{width}x{height}-z{zoom}-{menu}" + ('-s4-simulado' if args.simulate_s4 else '')
                    page.screenshot(path=str(OUT / (stem + ".png")))
                    results.append({"size": f"{width}x{height}", "zoom": zoom, "menu": menu,
                        "shellHorizontal": shell["horizontal"], "frameHorizontal": inner["horizontal"] if inner else None,
                        "shellIssues": [e for e in shell["entries"] if not e["contained"]],
                        "frameIssues": [e for e in inner["entries"] if not e["contained"] and not (e["element"] == "div.table-scroll" and e["scroll"] and not e["outside"])] if inner else [],
                        "errors": list(errors), "missing": list(missing), "forbidden": list(forbidden), "s4Card": "Silos da usina" in frame.locator("body").inner_text() if frame else None})
                ctx.close()
        browser.close()
    (OUT / ("diagnostico-s4-simulado.json" if args.simulate_s4 else "diagnostico.json")).write_text(json.dumps(results, ensure_ascii=False, indent=2), encoding="utf-8")
    failures = [r for r in results if r["shellHorizontal"] or r["frameHorizontal"] or r["shellIssues"] or r["frameIssues"] or r["errors"] or r["missing"] or r["s4Card"] != args.simulate_s4]
    print(f"F4_LAYOUT {len(results)-len(failures)}/{len(results)}")
    if failures:
        print(json.dumps(failures[:3], ensure_ascii=False)[:3000])
        raise SystemExit(1)


if __name__ == "__main__":
    main()

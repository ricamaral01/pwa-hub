"""Audita todas as telas do manual pela casca, sem modificar dados nem capturas."""
from __future__ import annotations

import json
import sys
from pathlib import Path
from urllib.parse import quote

from playwright.sync_api import sync_playwright

from capture_manual import CASES, PWA_CASES, NAMES, ROOT, context
from homolog_session import test_cookie_for
from check_layout_shell import AUDIT_JS, menu_state

# O auditor original procura o contêiner de rolagem apenas nos ancestrais.
# Abas com overflow-x:auto e rótulos com ellipsis fazem a contenção no próprio elemento.
F7_AUDIT_JS = AUDIT_JS.replace("for(let q=el.parentElement;q;q=q.parentElement)",
                               "for(let q=el;q;q=q.parentElement)")

SIZES = {"pc": (1440, 900), "tablet": (820, 1180), "celular": (390, 844)}
OUT = Path("docs/porting/suprimentos/capturas/f7")


def inspect(page, name, size, zoom, menu, frame=None):
    shell = page.evaluate(F7_AUDIT_JS)
    inner = frame.evaluate(F7_AUDIT_JS) if frame else None
    issues = []
    for area, data in (("casca", shell), ("iframe", inner)):
        if not data:
            continue
        if data["horizontal"]:
            issues.append(area + ": rolagem horizontal")
        for entry in data["entries"]:
            if not entry["contained"] and not (entry["element"].startswith("div.table-scroll") and entry["scroll"] and not entry["outside"]):
                issues.append(area + ": " + entry["element"])
    return {"tela": name, "tamanho": size, "zoom": zoom, "menu": menu,
            "shellHorizontal": shell["horizontal"], "frameHorizontal": inner["horizontal"] if inner else None,
            "problemas": issues[:20]}


def main(round_number: int):
    OUT.mkdir(parents=True, exist_ok=True)
    tokens = {actor: test_cookie_for(actor) for actor in NAMES}
    results = []
    errors = []
    with sync_playwright() as pw:
        browser = pw.chromium.launch(headless=True)
        for name, actor, route, mode, _ in CASES:
            for size_name, (width, height) in SIZES.items():
                for zoom in (100, 125):
                    factor = zoom / 100
                    ctx = context(browser, actor, (round(width/factor), round(height/factor)), tokens)
                    page = ctx.new_page()
                    page.on("pageerror", lambda error: errors.append(str(error)))
                    page.on("response", lambda response: errors.append("404 " + response.url)
                            if response.status == 404 and any(response.url.endswith(x) for x in (".css", ".js", ".woff", ".png")) else None)
                    page.goto(ROOT + "/unificado/?view=" + quote("suprimentos/" + route, safe=""), wait_until="domcontentloaded")
                    frame = page.frame_locator("#module-host iframe.is-active")
                    frame.locator("main#app h1").first.wait_for(timeout=15000)
                    if mode == "batch":
                        frame.locator(".select-row:not([disabled])").first.check()
                    elif mode == "details":
                        page.once("dialog", lambda dialog: dialog.accept("DEMO item livre"))
                        frame.locator("#free-item").click()
                        frame.locator("#continue").click()
                        frame.locator("#request-cc").wait_for()
                    elif mode and mode.startswith("stock:"):
                        frame.locator('[data-tab="' + mode.split(':', 1)[1] + '"]').click()
                    elif mode:
                        frame.locator('[data-resource="' + mode + '"]').click()
                    live = next((f for f in page.frames if "/unificado/suprimentos/" in f.url and f is not page.main_frame), None)
                    for menu in ("aberto", "recolhido"):
                        menu_state(page, menu)
                        results.append(inspect(page, name, size_name, zoom, menu, live))
                    ctx.close()
            print("F7_LAYOUT", round_number, name, flush=True)
        for name, actor, mode, _ in PWA_CASES:
            for size_name in ("tablet", "celular"):
                width, height = SIZES[size_name]
                for zoom in (100, 125):
                    ctx = context(browser, actor, (round(width/(zoom/100)), round(height/(zoom/100))), tokens)
                    page = ctx.new_page()
                    page.on("pageerror", lambda error: errors.append(str(error)))
                    page.goto(ROOT + "/unificado/suprimentos/pwa/", wait_until="domcontentloaded")
                    page.locator(".hello").wait_for(timeout=15000)
                    if mode in ("nova", "offline"):
                        page.locator('[data-view="nova"]').first.click()
                        if mode == "offline":
                            page.once("dialog", lambda dialog: dialog.accept("DEMO item livre"))
                            page.locator("#free").click()
                            ctx.set_offline(True)
                            page.locator("#continue").click()
                    elif mode == "minhas":
                        page.locator('[data-view="minhas"]').first.click()
                    elif mode == "acompanhar":
                        page.locator('[data-view="minhas"]').first.click()
                        from capture_manual import DEMO
                        page.locator('[data-detail="' + DEMO["entregue"]["id"] + '"]').click()
                    elif mode == "aprovar":
                        page.locator('[data-view="aprovar"]').first.click()
                    results.append(inspect(page, name, size_name, zoom, "pwa"))
                    ctx.close()
            print("F7_LAYOUT", round_number, name, flush=True)
        browser.close()
    output = {"rodada": round_number, "estados": len(results), "falhas": [row for row in results if row["problemas"]],
              "erros_console_ou_recurso": errors, "resultados": results}
    (OUT / f"rodada-{round_number}.json").write_text(json.dumps(output, ensure_ascii=False, indent=2), encoding="utf-8")
    print("F7_LAYOUT_RESULT", round_number, len(results) - len(output["falhas"]), "/", len(results),
          "erros", len(errors), flush=True)
    if output["falhas"] or errors:
        print(json.dumps({"falhas": output["falhas"][:3], "erros": errors[:3]}, ensure_ascii=False)[:2500])
        raise SystemExit(1)


if __name__ == "__main__":
    if len(sys.argv) != 2 or sys.argv[1] not in ("1", "2", "3"):
        raise SystemExit("Uso: check_f7_integrated_layout.py 1|2|3")
    main(int(sys.argv[1]))

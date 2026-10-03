"""Replay captured original function flows against the published isolated copy."""

from __future__ import annotations

import ast
import base64
import collections
import json
from pathlib import Path
from urllib.parse import urlsplit
import sys

from playwright.sync_api import sync_playwright

from operacao_smoke import CHROME, OUT, URL, credentials


ROOT = Path(__file__).resolve().parents[3]
sys.path.insert(0, str(ROOT / "tests" / "mapa"))
from contract_photos import PHOTO
INVALID_PIXEL = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Y9Dr9sAAAAASUVORK5CYII="
CAPTURE = ROOT / "scripts" / "capture_mapa_requests_offline.py"
FIXTURE = ROOT / "tests" / "mapa" / "fixtures" / "captured-offline.json"
SKIP = {"relatório WhatsApp: gerar PDF"}


def expressions() -> list[tuple[str, str]]:
    tree = ast.parse(CAPTURE.read_text(encoding="utf-8"))
    calls = [node for node in ast.walk(tree) if isinstance(node, ast.Call)
             and isinstance(node.func, ast.Name) and node.func.id == "exercise"
             and len(node.args) >= 2 and all(isinstance(arg, ast.Constant)
                                             and isinstance(arg.value, str) for arg in node.args[:2])]
    return [(node.args[0].value, node.args[1].value) for node in sorted(calls, key=lambda node: node.lineno)]


def main() -> None:
    account = credentials()
    original = json.loads(FIXTURE.read_text(encoding="utf-8"))["requests"]
    expected = collections.defaultdict(list)
    for item in original:
        expected[item.get("flow")].append((item.get("method"), item.get("path")))
    current = ["setup"]
    calls = collections.defaultdict(list)
    blocked = []
    results = []
    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(headless=True, executable_path=CHROME)
        context = browser.new_context(viewport={"width": 1024, "height": 768},
                                      service_workers="block")
        def intercept(route):
            url = urlsplit(route.request.url)
            if url.hostname != "concrefer.concretrack.com.br":
                blocked.append({"flow": current[0], "host": url.hostname,
                                "method": route.request.method, "path": url.path})
                route.abort()
            else:
                route.continue_()
        context.route("**/*", intercept)
        page = context.new_page()
        def capture(request):
            url = urlsplit(request.url)
            if "/unificado/mapa/api/" in url.path:
                calls[current[0]].append((request.method,
                    url.path.replace("/unificado/mapa/api", "", 1)))
        page.on("request", capture)
        page.goto(URL, wait_until="domcontentloaded", timeout=30000)
        page.wait_for_function("typeof loginWithRole === 'function'", timeout=15000)
        page.wait_for_timeout(900)
        page.locator("#loginNome").fill(account["MAPA_TEST_USER"])
        page.locator("#loginSenha").fill(account["MAPA_TEST_PASSWORD"])
        page.locator("#loginEntrar").click()
        page.wait_for_function("state.authUser?.role === 'GERENCIA'", timeout=15000)
        page.on("dialog", lambda dialog: dialog.accept())
        for name, expression in expressions():
            current[0] = name
            expression = expression.replace(INVALID_PIXEL, base64.b64encode(PHOTO).decode("ascii"))
            expression = expression.replace("id:'captura-inspecao'", "id:'38d897c2-1530-4ae6-8de0-eb6e2b7317c4'")
            if name in SKIP:
                results.append({"flow": name, "status": "not_executed", "reason": "PDF library mock required"})
                continue
            try:
                result = page.evaluate(expression)
                page.wait_for_timeout(120)
                exp = collections.Counter(expected.get(name, []))
                actual = collections.Counter(calls[name])
                results.append({"flow": name, "status": "ran",
                                "result_type": type(result).__name__,
                                "result_summary": str(result)[:160],
                                "expected_request_count": sum(exp.values()),
                                "actual_request_count": sum(actual.values()),
                                "missing_request_shapes": list((exp - actual).elements()),
                                "extra_request_shapes": list((actual - exp).elements())})
            except Exception as error:
                results.append({"flow": name, "status": "error",
                                "error": str(error)[:250],
                                "actual_request_count": len(calls[name])})
        context.close()
        browser.close()
    OUT.mkdir(parents=True, exist_ok=True)
    report = {"results": results, "blocked_external": blocked}
    (OUT / "live-captured-flows.json").write_text(
        json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps({"ran": sum(item["status"] == "ran" for item in results),
                      "errors": [(item["flow"], item.get("error")) for item in results
                                 if item["status"] == "error"],
                      "not_executed": [item["flow"] for item in results
                                       if item["status"] == "not_executed"],
                      "blocked_external": len(blocked)}, ensure_ascii=False))


if __name__ == "__main__":
    main()

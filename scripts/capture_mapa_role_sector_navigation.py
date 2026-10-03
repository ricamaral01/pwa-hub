"""Offline role/sector navigation matrix for the original Mapa interface.

This checks mode visibility and navigation only. It does not claim to execute
the operational actions inside each mode.
"""

import json
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from threading import Thread
import urllib.error
import urllib.request
from urllib.parse import urlsplit

from playwright.sync_api import sync_playwright

from capture_mapa_requests_offline import CHROME, MODES
from mapa_snapshot_server import serve as serve_snapshot


ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "tests" / "mapa" / "fixtures" / "role-sector-navigation.json"
ROLES = ("GERENCIA", "GESTOR", "MONTADOR", "APONTADOR")


def main():
    class Handler(SimpleHTTPRequestHandler):
        def log_message(self, *_args):
            pass

    static = ThreadingHTTPServer(("127.0.0.1", 0),
                                 lambda *args, **kwargs: Handler(*args, directory=str(ROOT), **kwargs))
    snapshot = serve_snapshot()
    Thread(target=static.serve_forever, daemon=True).start()
    Thread(target=snapshot.serve_forever, daemon=True).start()
    origin = f"http://127.0.0.1:{static.server_port}"
    data_origin = f"http://127.0.0.1:{snapshot.server_port}"
    results = []
    external = [0]
    try:
        with sync_playwright() as playwright:
            browser = playwright.chromium.launch(headless=True, executable_path=CHROME)
            for role in ROLES:
                for sector in range(1, 5):
                    context = browser.new_context(service_workers="block", viewport={"width": 1024, "height": 768})
                    context.add_init_script(f"""
                        localStorage.setItem('pwa_mapa_auth_session_v1', JSON.stringify({{
                          id:'offline-navigation',name:'Offline',role:{json.dumps(role)},setor:'Setor {sector}'
                        }}));
                        window.WebSocket=class {{ constructor() {{ this.readyState=0; }} send() {{}} close() {{}} addEventListener() {{}} }};
                    """)

                    def intercept(route):
                        request = route.request
                        parsed = urlsplit(request.url)
                        if f"{parsed.scheme}://{parsed.netloc}" == origin:
                            if parsed.path.startswith("/auth/"):
                                route.fulfill(status=200, content_type="application/javascript", body="")
                            else:
                                route.continue_()
                            return
                        external[0] += 1
                        if parsed.path.startswith("/rest/v1/") and "/rpc/" not in parsed.path:
                            target = data_origin + parsed.path + ("?" + parsed.query if parsed.query else "")
                            headers = {key: request.headers[key] for key in ("prefer", "range", "content-type")
                                       if key in request.headers}
                            outbound = urllib.request.Request(target, data=request.post_data_buffer
                                                              if request.method not in {"GET", "HEAD"} else None,
                                                              headers=headers, method=request.method)
                            try:
                                response = urllib.request.urlopen(outbound, timeout=10)
                            except urllib.error.HTTPError as error:
                                response = error
                            route.fulfill(status=response.status,
                                          headers={key: response.headers[key] for key in ("Content-Type", "Content-Range", "Range-Unit")
                                                   if key in response.headers}, body=response.read())
                            response.close()
                        else:
                            route.fulfill(status=200, content_type="application/json", body="[]")

                    context.route("**/*", intercept)
                    page = context.new_page()
                    page.goto(origin + "/mapa-concretagem/index.html", wait_until="domcontentloaded")
                    page.wait_for_function("typeof setMode === 'function' && !!state.authUser", timeout=20000)
                    for mode in MODES:
                        result = page.evaluate("""mode => {
                          const allowed = isModeAllowed(mode);
                          setMode(mode);
                          return {allowed, actual: state.mode};
                        }""", mode)
                        results.append({"role": role, "sector": sector, "mode": mode, **result})
                    context.close()
            browser.close()
    finally:
        static.shutdown()
        snapshot.shutdown()
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps({"scope": "navigation only; synthetic sessions; snapshot-backed reads",
                               "browser_external_requests_intercepted": external[0],
                               "cases": results}, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"navigation_cases={len(results)} allowed={sum(x['allowed'] for x in results)} intercepted={external[0]} output={OUT.relative_to(ROOT)}")


if __name__ == "__main__":
    main()

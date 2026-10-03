"""Executa o app.js original com toda a rede externa interceptada.

Registra somente método, caminho e corpo sintético da captura; nunca cabeçalhos,
cookies ou chaves. Nenhuma requisição é enviada ao Supabase ou à API oficial.
"""

from __future__ import annotations

from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
import json
from pathlib import Path
from threading import Thread
from urllib.parse import urlsplit

from playwright.sync_api import sync_playwright


ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / ".work-mapa-unificado" / "requests-original.json"
CHROME = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
MODES = (
    "LIBERACAO", "LIBERACAO_S1", "LIBERACAO_S2", "LIBERACAO_S3", "LIBERACAO_S4",
    "MANDRIL_CIRCULAR", "INSPECAO", "MONTAGEM_POSTES", "SEQUENCIA_S3",
    "RELATORIO", "HISTORICO", "ACMP_CONCRETAGEM", "TRATATIVA_DEFEITOS",
    "MONTAGEM_INDICADORES", "DASHBOARD_DEFEITOS", "PROD_ANALISE", "USUARIOS",
    "RELATORIO_MANUTENCAO",
)


def main() -> None:
    class QuietHandler(SimpleHTTPRequestHandler):
        def log_message(self, *_args):
            pass

    server = ThreadingHTTPServer(
        ("127.0.0.1", 0), lambda *args, **kwargs: QuietHandler(*args, directory=str(ROOT), **kwargs)
    )
    Thread(target=server.serve_forever, daemon=True).start()
    local_origin = f"http://127.0.0.1:{server.server_port}"
    captured: list[dict] = []
    current_flow = ["inicialização"]
    blocked_external = [0]
    try:
        with sync_playwright() as playwright:
            browser = playwright.chromium.launch(headless=True, executable_path=CHROME)
            context = browser.new_context(service_workers="block", viewport={"width": 1024, "height": 768})
            context.add_init_script("""
                localStorage.setItem('pwa_mapa_auth_session_v1', JSON.stringify({
                    id: 'captura-sintetica', name: 'Captura', role: 'GERENCIA', setor: 'Todos'
                }));
                window.WebSocket = class BlockedWebSocket {
                    constructor() { this.readyState = 0; }
                    send() {}
                    close() { this.readyState = 3; }
                    addEventListener() {}
                    removeEventListener() {}
                };
                window.WebSocket.CONNECTING = 0;
                window.WebSocket.OPEN = 1;
                window.WebSocket.CLOSED = 3;
            """)

            def intercept(route):
                request = route.request
                parsed = urlsplit(request.url)
                if f"{parsed.scheme}://{parsed.netloc}" == local_origin:
                    if parsed.path.startswith("/auth/"):
                        route.fulfill(status=200, content_type="application/javascript", body="")
                    else:
                        route.continue_()
                    return
                blocked_external[0] += 1
                body = request.post_data or ""
                if len(body) > 10000:
                    body = body[:10000] + "…"
                captured.append({
                    "flow": current_flow[0], "method": request.method,
                    "host": parsed.hostname, "path_query": parsed.path + ("?" + parsed.query if parsed.query else ""),
                    "body": body,
                })
                if parsed.path.endswith("/rpc/rpc_dashboard_produtividade_resumo_v1"):
                    route.fulfill(status=200, content_type="application/json", body="{}")
                elif parsed.path.endswith(".csv"):
                    route.fulfill(status=200, content_type="text/csv", body="")
                else:
                    route.fulfill(status=200, content_type="application/json", body="[]")

            context.route("**/*", intercept)
            page = context.new_page()
            errors = []
            page.on("pageerror", lambda error: errors.append(str(error)[:220]))
            page.goto(f"{local_origin}/mapa-concretagem/index.html", wait_until="domcontentloaded")
            page.wait_for_function("typeof setMode === 'function' && !!document.getElementById('viewHub')")
            page.wait_for_timeout(500)
            if errors:
                raise RuntimeError(f"Falha ao iniciar o Mapa isolado: {errors[:3]}")
            if not page.evaluate("() => state.authUser?.id === 'captura-sintetica'"):
                raise RuntimeError("Sessão sintética não carregada no Mapa isolado")
            mode_results = []
            for mode in MODES:
                current_flow[0] = mode
                try:
                    actual = page.evaluate("mode => { setMode(mode); return state.mode; }", mode)
                    page.wait_for_timeout(150)
                    mode_results.append({"requested": mode, "actual": actual})
                except Exception as error:
                    mode_results.append({"requested": mode, "error": str(error)[:180]})
            current_flow[0] = "programar/desprogramar cartão Setor 3"
            page.evaluate("""async () => {
                setMode('LIBERACAO_S3');
                const checkbox = document.getElementById('kioskProgCheckbox');
                checkbox.click();
                await new Promise(resolve => setTimeout(resolve, 150));
                const card = document.querySelector('#libSetor3Cols .forma-card');
                if (!card) throw new Error('Cartões do Setor 3 ausentes');
                card.click();
                await new Promise(resolve => setTimeout(resolve, 150));
                document.querySelector('#libSetor3Cols .forma-card').click();
                await new Promise(resolve => setTimeout(resolve, 150));
            }""")
            current_flow[0] = "liberar cartão Setor 3"
            page.evaluate("""async () => {
                document.getElementById('kioskProgCheckbox').click();
                document.getElementById('kioskLibCheckbox').click();
                document.getElementById('libColaborador').value = 'Jeferson';
                const kiosk = document.getElementById('kioskLibColaborador');
                if (kiosk) kiosk.value = 'Jeferson';
                await new Promise(resolve => setTimeout(resolve, 120));
                document.querySelector('#libSetor3Cols .forma-card').click();
                await new Promise(resolve => setTimeout(resolve, 250));
            }""")
            current_flow[0] = "concretar cartão Setor 3 com tipo"
            page.evaluate("""async () => {
                document.getElementById('kioskLibCheckbox').click();
                await new Promise(resolve => setTimeout(resolve, 120));
                document.querySelector('#libSetor3Cols .forma-card').click();
                await new Promise(resolve => setTimeout(resolve, 80));
                const select = document.getElementById('concretoModeloSelect');
                const modelo = [...select.options].find(option => option.value)?.value;
                if (modelo) select.value = modelo;
                const tipo = document.querySelector('.btn-concreto-rich[data-tipo="Concreto Seco - Vibrado"]');
                if (tipo) tipo.click();
                await new Promise(resolve => setTimeout(resolve, 250));
            }""")
            OUTPUT.parent.mkdir(parents=True, exist_ok=True)
            OUTPUT.write_text(json.dumps({
                "source": "mapa-concretagem/app.js", "external_requests_blocked": blocked_external[0],
                "modes": mode_results, "requests": captured,
            }, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
            print(f"CAPTURA_SEM_REDE_OK modos={len(mode_results)} pedidos_externos_bloqueados={blocked_external[0]}")
            for item in mode_results:
                if item.get("actual") != item["requested"]:
                    print(f"MODO_NAO_COBERTO {item}")
            browser.close()
    finally:
        server.shutdown()


if __name__ == "__main__":
    main()

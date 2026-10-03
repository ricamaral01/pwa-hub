"""Executa o app.js original com toda a rede externa interceptada.

Registra somente método, caminho e corpo sintético da captura; nunca cabeçalhos,
cookies ou chaves. Nenhuma requisição é enviada ao Supabase ou à API oficial.
"""

from __future__ import annotations

from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
import json
from pathlib import Path
from threading import Thread
from urllib.parse import urljoin, urlsplit
import urllib.error
import urllib.request

from playwright.sync_api import sync_playwright
from mapa_snapshot_server import TABLES, serve as serve_snapshot


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
    snapshot_server = serve_snapshot()
    Thread(target=snapshot_server.serve_forever, daemon=True).start()
    snapshot_origin = f"http://127.0.0.1:{snapshot_server.server_port}"
    captured: list[dict] = []
    local_invocations: list[dict] = []
    current_flow = ["inicialização"]
    blocked_external = [0]
    forced_legacy_errors: set[str] = set()
    try:
        with sync_playwright() as playwright:
            browser = playwright.chromium.launch(headless=True, executable_path=CHROME)
            context = browser.new_context(service_workers="block", viewport={"width": 1024, "height": 768})
            context.add_init_script("""
                window.__codexFetch = [];
                const nativeFetch = window.fetch.bind(window);
                window.fetch = (...args) => {
                    window.__codexFetch.push({
                        url: String(args[0]?.url || args[0]),
                        stack: String(new Error().stack || '')
                    });
                    return nativeFetch(...args);
                };
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
                        if request.resource_type == "fetch":
                            captured.append({
                                "flow": current_flow[0], "method": request.method,
                                "host": parsed.hostname,
                                "path_query": parsed.path + ("?" + parsed.query if parsed.query else ""),
                                "headers": {"Prefer": None, "Range": None, "apikey_present": False},
                                "body": "", "local_asset": True,
                            })
                        route.continue_()
                    return
                blocked_external[0] += 1
                raw_body = request.post_data_buffer or b""
                try:
                    body = raw_body.decode("utf-8")
                except UnicodeDecodeError:
                    body = f"<binary body: {len(raw_body)} bytes>"
                if len(body) > 10000:
                    body = body[:10000] + "…"
                captured.append({
                    "flow": current_flow[0], "method": request.method,
                    "host": parsed.hostname, "path_query": parsed.path + ("?" + parsed.query if parsed.query else ""),
                    "headers": {
                        "Prefer": request.headers.get("prefer"),
                        "Range": request.headers.get("range"),
                        "apikey_present": "apikey" in request.headers,
                    },
                    "body": body,
                })
                if current_flow[0] == "modelos S3: fallback PCP e Usina" and parsed.path == "/api/programacao":
                    captured[-1]["response_status"] = 503
                    captured[-1]["response_shape"] = "dict"
                    route.fulfill(status=503, content_type="application/json", body='{"error":"simulated offline"}')
                    return
                if (current_flow[0].startswith("compatibilidade legado:")
                    and request.method in {"POST", "PATCH"}
                    and current_flow[0] not in forced_legacy_errors):
                    forced_legacy_errors.add(current_flow[0])
                    captured[-1]["response_status"] = 400
                    captured[-1]["response_shape"] = "dict"
                    route.fulfill(status=400, content_type="application/json", body=json.dumps({
                        "code": "PGRST204",
                        "message": "Could not find the 'codigo_poste' column in the schema cache",
                    }))
                    return
                if parsed.path.startswith("/rest/v1/") and "/rpc/" not in parsed.path:
                    target = snapshot_origin + parsed.path + ("?" + parsed.query if parsed.query else "")
                    forwarded_headers = {name: request.headers[name] for name in ("prefer", "range", "content-type")
                                         if name in request.headers}
                    forwarded = urllib.request.Request(
                        target,
                        data=request.post_data_buffer if request.method not in {"GET", "HEAD"} else None,
                        headers=forwarded_headers, method=request.method,
                    )
                    try:
                        upstream = urllib.request.urlopen(forwarded, timeout=10)
                    except urllib.error.HTTPError as error:
                        upstream = error
                    response_body = upstream.read()
                    headers = {name: upstream.headers[name] for name in ("Content-Type", "Content-Range", "Range-Unit")
                               if name in upstream.headers}
                    captured[-1]["response_status"] = upstream.status
                    try:
                        parsed_body = json.loads(response_body) if response_body else None
                        captured[-1]["response_shape"] = type(parsed_body).__name__
                    except (json.JSONDecodeError, UnicodeDecodeError):
                        captured[-1]["response_shape"] = "binary"
                    route.fulfill(status=upstream.status, headers=headers, body=response_body)
                    upstream.close()
                elif parsed.path.endswith("/rpc/rpc_dashboard_produtividade_resumo_v1"):
                    captured[-1]["response_status"] = 200
                    captured[-1]["response_shape"] = "dict"
                    route.fulfill(status=200, content_type="application/json", body="{}")
                elif "/inspecoes/" in parsed.path and parsed.path.endswith("/fotos"):
                    captured[-1]["response_status"] = 200
                    captured[-1]["response_shape"] = "dict"
                    payload = ({"success": True, "data": {"url": "/captura-local/foto-sintetica.png"}}
                               if request.method == "POST" else {"success": True, "data": []})
                    route.fulfill(status=200, content_type="application/json", body=json.dumps(payload))
                elif parsed.path.endswith(".csv"):
                    captured[-1]["response_status"] = 200
                    captured[-1]["response_shape"] = "csv"
                    route.fulfill(status=200, content_type="text/csv", body="")
                else:
                    captured[-1]["response_status"] = 200
                    captured[-1]["response_shape"] = "list"
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
            for sector in (1, 2, 4):
                current_flow[0] = f"programar/desprogramar cartão Setor {sector}"
                page.evaluate("""async sector => {
                    setMode(`LIBERACAO_S${sector}`);
                    const program = document.getElementById('kioskProgCheckbox');
                    if (!program.checked) program.click();
                    await new Promise(resolve => setTimeout(resolve, 100));
                    const selector = sector === 4 ? '#libSetor4Cols .s4-forma-cell' : `#libSetor${sector}Cols .forma-card`;
                    if (!document.querySelector(selector)) throw new Error(`Cartões do Setor ${sector} ausentes`);
                    document.querySelector(selector).click();
                    await new Promise(resolve => setTimeout(resolve, 120));
                    document.querySelector(selector).click();
                    await new Promise(resolve => setTimeout(resolve, 120));
                }""", sector)
                current_flow[0] = f"liberar cartão Setor {sector}"
                page.evaluate("""async sector => {
                    const program = document.getElementById('kioskProgCheckbox');
                    if (program.checked) program.click();
                    const release = document.getElementById('kioskLibCheckbox');
                    if (!release.checked) release.click();
                    const person = document.getElementById('kioskLibColaborador');
                    if (person) person.value = 'Jeferson';
                    const regular = document.getElementById('libColaborador');
                    if (regular) regular.value = 'Jeferson';
                    await new Promise(resolve => setTimeout(resolve, 100));
                    const selector = sector === 4 ? '#libSetor4Cols .s4-forma-cell' : `#libSetor${sector}Cols .forma-card`;
                    document.querySelector(selector).click();
                    await new Promise(resolve => setTimeout(resolve, 160));
                }""", sector)
                current_flow[0] = f"concretar cartão Setor {sector} com tipo"
                page.evaluate("""async sector => {
                    const release = document.getElementById('kioskLibCheckbox');
                    if (release.checked) release.click();
                    await new Promise(resolve => setTimeout(resolve, 100));
                    const selector = sector === 4 ? '#libSetor4Cols .s4-forma-cell' : `#libSetor${sector}Cols .forma-card`;
                    document.querySelector(selector).click();
                    await new Promise(resolve => setTimeout(resolve, 100));
                    const select = document.getElementById('concretoModeloSelect');
                    const model = select && [...select.options].find(option => option.value)?.value;
                    if (model) select.value = model;
                    const type = document.querySelector('.btn-concreto-rich[data-tipo="Concreto Seco - Vibrado"]');
                    if (type) type.click();
                    await new Promise(resolve => setTimeout(resolve, 180));
                }""", sector)
            extra_results = []

            def exercise(flow: str, expression: str):
                current_flow[0] = flow
                try:
                    result = page.evaluate(expression)
                    extra_results.append({"flow": flow, "result": result})
                    return result
                except Exception as error:
                    extra_results.append({"flow": flow, "error": str(error)[:300]})
                    return None

            exercise("manutenção: inativar e liberar forma", """async () => {
                salvarFormaParadaManutencao('Setor 3', 'SC29', 'Captura sintética', 'Verificar');
                await new Promise(resolve => setTimeout(resolve, 120));
                liberarFormaManutencao('Setor 3', 'SC29', 'Captura sintética');
                await new Promise(resolve => setTimeout(resolve, 120));
                return isFormaEmManutencao('Setor 3', 'SC29') === null;
            }""")
            page.on("dialog", lambda dialog: dialog.accept())
            exercise("ODIN: corrigir concretagem", """async () => {
                setMode('LIBERACAO_S3');
                el.libData.value = '2026-10-02';
                await cancelarConcretagemOdin('SC29', 'Setor 3');
                return document.getElementById('correcaoConcretagemModal')?.classList.contains('modal-visible');
            }""")
            exercise("ODIN: alterar tipo e cancelar concretagem", """async () => {
                const modal = document.getElementById('correcaoConcretagemModal');
                if (!modal?.classList.contains('modal-visible')) return 'sem modal';
                const select = document.getElementById('correcaoConcretagemTipo');
                const next = [...select.options].find(o => o.value !== select.value);
                if (!next) return 'sem outro tipo';
                select.value = next.value;
                await document.getElementById('correcaoConcretagemSalvar').onclick();
                await cancelarConcretagemOdin('SC29', 'Setor 3');
                if (!modal.classList.contains('modal-visible')) return 'sem segundo modal';
                await document.getElementById('correcaoConcretagemCancelar').onclick();
                return 'alterado e cancelado';
            }""")
            exercise("inspeção: abrir checklist", """async () => {
                setMode('INSPECAO');
                el.insFiltroData.value = '2026-10-02';
                await renderInspecaoLiberados();
                const rows = await fetchPolesForDate('2026-10-02', 'Setor 3');
                if (!rows.length) return 'sem postes';
                await openInspecaoPosteDetalhe(rows[0]);
                return rows.length;
            }""")
            exercise("montagem: abrir poste", """async () => {
                setMode('MONTAGEM_POSTES');
                el.mpFiltroData.value = '2026-10-02';
                await renderMontagemPostesLiberados();
                const rows = await fetchPolesForDate('2026-10-02', 'Setor 1');
                if (!rows.length) return 'sem postes';
                await openMontagemPosteDetalhe(rows[0]);
                return rows.length;
            }""")
            exercise("inspeção: checklist, foto e retrabalho", """async () => {
                if (!state.inspecaoPostesAtual) return 'sem poste';
                const sections = getInspecaoChecklistSections(state.inspecaoPostesAtual.modelo || '');
                if (!sections.length || !sections[0].itens.length) return 'sem checklist';
                const first = sections[0].itens[0];
                setInspecaoChecklistAnswer(sections[0].id, first.id, 'nao');
                await setInspecaoChecklistPhoto(sections[0].id, first.id,
                  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Y9Dr9sAAAAASUVORK5CYII=');
                for (const section of sections) for (const item of section.itens) {
                  if (section.id !== sections[0].id || item.id !== first.id)
                    setInspecaoChecklistAnswer(section.id, item.id, 'sim');
                }
                await finalizarInspecaoPosteAtual();
                return state.inspecaoPostesAtual?.statusMontagem;
            }""")
            exercise("montagem: checklist e conclusão", """async () => {
                if (!state.montagemPostesAtual) return 'sem poste';
                const sections = getMontagemChecklistSections(state.montagemPostesAtual.modelo || '');
                for (const section of sections) for (const item of section.itens)
                  setMontagemChecklistAnswer(section.id, item.id, 'sim');
                setMontagemStatus('A');
                await finalizarMontagemPosteAtual();
                return state.montagemPostesAtual?.statusMontagem;
            }""")
            exercise("dashboard produtividade global", """async () => {
                setMode('PROD_ANALISE');
                await carregarDadosGlobaisDashboard('2026-10-02');
                return 'carregado';
            }""")
            exercise("acompanhamento concretagem", """async () => {
                setMode('ACMP_CONCRETAGEM');
                el.acmpData.value = '2026-10-02';
                await renderAcmpConcretagem();
                return 'carregado';
            }""")
            exercise("relatório por setor", """async () => {
                setMode('RELATORIO');
                el.relData.value = '2026-10-02';
                el.relSetor.value = 'Setor 3';
                await gerarRelatorioSetor();
                return 'gerado';
            }""")
            exercise("programação: consultar fonte oficial e local", """async () => {
                setMode('LIBERACAO_S3');
                el.libData.value = '2026-10-02';
                await loadProgrammedFormas();
                return state.programmedFormas.size;
            }""")
            exercise("liberação: linhas por setor e data", """async () => {
                return (await getSetorRowsByDate('Setor 3', '2026-10-02')).length;
            }""")
            exercise("modelos S3: fallback PCP e Usina", """async () => {
                return Object.keys(await fetchSetor3Models('2026-10-02')).length;
            }""")
            exercise("montagem: sincronizar tabela", """async () => {
                return await syncMontagemPostesFromApi('2026-10-02', 'data', 'Setor 1');
            }""")
            exercise("acompanhamento: índice de volumes", """async () => {
                const index = await loadAcmpVolumeIndex();
                return !!index;
            }""")
            exercise("dashboard: linhas do setor", """async () => {
                const result = await getRowsForDashboard('2026-10-02', 'Setor 3');
                return result.source;
            }""")
            exercise("exportação XLSX: base e lookup", """async () => {
                const result = await carregarBaseExportacaoPorPeriodo({
                  table: 'montagem_poste', select: 'id,record_id,data_fabricacao,setor,forma_numero',
                  inicio: '2026-10-02', fim: '2026-10-02'
                });
                const row = result?.rows?.[0] || result?.[0] || {record_id: '03340639-ce03-40b1-8fbb-767bb940030a'};
                await carregarLookupProducaoPorRecordIds([row]);
                return Array.isArray(result) ? result.length : Object.keys(result || {});
            }""")
            exercise("inspeção: visualizar checklist e fotos", """async () => {
                const id = state.inspecaoPostesAtual?.key;
                if (!id) return 'sem inspeção';
                await window.abrirVisualizacaoChecklist({id});
                await window.abrirVisualizacaoChecklist({
                  id, status_montagem: 'R', etapa: 'INSPECAO',
                  finalizado_em: new Date().toISOString(),
                  checklists: state.inspecaoPostesAtual?.checklists || {}
                });
                await new Promise(resolve => setTimeout(resolve, 150));
                const button = document.querySelector('.vc-second-inspection-actions button');
                if (button) { button.click(); await new Promise(resolve => setTimeout(resolve, 120)); }
                await window.excluirFotoVps('foto-sintetica');
                return !!button;
            }""")
            exercise("usuários e inspeção: ações de API", """async () => {
                const reports = [];
                reports.push(await postToApi('listar_inspecao_pendentes', {data:'2026-10-02',setor:'Setor 3'}));
                reports.push(await postToApi('relatorio_setor', {data:'2026-10-02',setor:'Setor 3'}));
                reports.push(await postToApi('listar_usuarios', {}));
                reports.push(await postToApi('autenticar_usuario', {name:'captura-inexistente',password:'inválida'}));
                reports.push(await postToApi('criar_usuario', {login:'captura-sintetica',name:'Captura',role:'APONTADOR',password:'sintetica'}));
                reports.push(await postToApi('alterar_senha_primeiro_acesso', {id:'captura-sintetica',senha:'alterada'}));
                reports.push(await postToApi('excluir_usuario', {id:'captura-sintetica'}));
                return reports.map(r => r.ok);
            }""")
            exercise("mandril: modelo produzido", """async () => {
                try { await persistirMandrilModeloNaConcretagem('2026-10-02','SC23','12X600'); }
                catch (error) { return error.message; }
                return 'persistido';
            }""")
            exercise("mandril: saque e remoção", """async () => {
                setMode('MANDRIL_CIRCULAR');
                el.mcFiltroData.value = '2026-10-02';
                await window.registrarSaque('SC23');
                await window.limparSaque('SC23');
                return 'concluído';
            }""")
            exercise("sequência S3: salvar e reenviar", """async () => {
                setMode('SEQUENCIA_S3');
                el.seqS3Data.value = '2026-10-02';
                if (!document.querySelector('.seq-s3-select')) {
                  const select = document.createElement('select');
                  select.className = 'seq-s3-select';
                  select.dataset.forma = 'SC23';
                  select.innerHTML = '<option value="12X600">12X600</option>';
                  document.body.appendChild(select);
                }
                await window.saveSequenciaS3();
                const db = readProgS3S4Db();
                db.programacoes['2026-10-02||SC23||Setor 3'] = {
                  data:'2026-10-02',forma:'SC23',setor:'Setor 3',modelo:'12X600',pendingSync:true
                };
                writeProgS3S4Db(db);
                await syncOfflineData();
                return 'reenviado';
            }""")
            exercise("mandril: reenviar saques locais", """async () => {
                localStorage.setItem('pwa_saque_mandril_v1', JSON.stringify({
                  '2026-10-02||SC23': new Date().toISOString()
                }));
                localStorage.removeItem(SAQUE_MANDRIL_MIGRATED_KEY);
                return await sincronizarSaquesMandrilLocais('2026-10-02', {});
            }""")
            channel_called = exercise("tempo real: subscrever canal", """async () => {
                if (!supabaseClient) return false;
                const native = supabaseClient.channel;
                let called = false;
                supabaseClient.channel = function(...args) {
                  called = true;
                  return native.apply(this, args);
                };
                try { subscribeToRealtimeUpdates(); }
                finally { supabaseClient.channel = native; }
                return called;
            }""")
            if channel_called:
                local_invocations.append({"flow": "tempo real: subscrever canal", "app_line": 10240,
                                          "kind": "supabase.channel; no HTTP request"})
            source = next(row for row in TABLES["producao"] if row.get("data_fabricacao") == "2026-10-02"
                          and row.get("setor") == "Setor 3" and row.get("forma") == "SC23")
            TABLES["producao"].append({**source, "id": "captura-duplicidade-local"})
            exercise("concretagem: atualizar e remover duplicidade", """async () => {
                await saveProducaoByNaturalKey({data_fabricacao:'2026-10-02',setor:'Setor 3',
                  forma:'SC23',modelo:'SC',tipo_concreto:'Concreto Padrão',status:'LIBERADO'});
                return 'atualizada';
            }""")
            exercise("compatibilidade legado: atualização produção", """async () => {
                await saveProducaoByNaturalKey({data_fabricacao:'2026-10-02',setor:'Setor 3',
                  forma:'SC23',modelo:'SC',tipo_concreto:'Concreto Padrão',status:'LIBERADO',vibrado:null});
                return 'fallback aplicado';
            }""")
            exercise("compatibilidade legado: inserção produção", """async () => {
                await saveProducaoByNaturalKey({data_fabricacao:'2099-01-17',setor:'Setor 3',
                  forma:'SC99',modelo:'SC',tipo_concreto:'Concreto Padrão',status:'LIBERADO',vibrado:null});
                return 'fallback aplicado';
            }""")
            exercise("compatibilidade legado: inserção inspeção", """async () => {
                await insertWithLegacyFallback('producao', [{id:'captura-inspecao',data_fabricacao:'2099-01-17',
                  setor:'Setor 3',forma:'SC98',status:'INSPECIONADO',codigo_poste:'X'}],
                  ({codigo_poste,...row}) => row);
                return 'fallback aplicado';
            }""")
            exercise("compatibilidade legado: upsert montagem", """async () => {
                await upsertWithLegacyFallback('montagem_poste', {id:'captura-montagem',
                  data_fabricacao:'2099-01-17',setor:'Setor 1',forma_numero:'AE-06',codigo_poste:'X'},
                  ({codigo_poste,...row}) => row);
                return 'fallback aplicado';
            }""")
            exercise("versão: buscar service worker local", """async () => {
                await updateSwVersionBadge();
                return document.getElementById('swVersionBadge')?.textContent;
            }""")
            pdf_calls = exercise("relatório WhatsApp: gerar PDF", """async () => {
                if (!document.getElementById('relPrintDoc')) return 0;
                window.__codexPdfFrom = 0;
                window.html2pdf = () => ({
                  set() { return this; },
                  from() { window.__codexPdfFrom++; return this; },
                  async output() { return new Blob(['captura sintética'], {type:'application/pdf'}); },
                  save() { return Promise.resolve(); }
                });
                Object.defineProperty(navigator, 'canShare', {configurable:true, value:() => false});
                window.open = () => null;
                await enviarRelatorioWhatsapp();
                return window.__codexPdfFrom;
            }""")
            if isinstance(pdf_calls, int) and pdf_calls >= 1:
                local_invocations.append(
                    {"flow": "relatório WhatsApp: gerar PDF", "app_line": 7485,
                     "kind": "html2pdf.from; library mocked, PDF content not validated"})
            if isinstance(pdf_calls, int) and pdf_calls >= 2:
                local_invocations.append(
                    {"flow": "relatório WhatsApp: gerar PDF", "app_line": 7498,
                     "kind": "html2pdf.from; library mocked, PDF content not validated"})
            fetches = page.evaluate("window.__codexFetch")
            for candidate in fetches:
                if candidate["url"].startswith("data:") and __import__("re").search(
                    r"app\.js(?:\?[^:]+)?:4719:\d+", candidate["stack"]
                ):
                    local_invocations.append({"flow": "inspeção: checklist, foto e retrabalho",
                                              "app_line": 4719, "kind": "fetch of inline data URL"})
            for item in captured:
                for candidate in fetches:
                    source = next((int(match) for match in __import__("re").findall(
                        r"app\.js(?:\?[^:]+)?:(\d+):\d+", candidate["stack"])), None)
                    full_url = urljoin(f"{local_origin}/mapa-concretagem/index.html", candidate["url"])
                    if source and item["path_query"].split("?", 1)[0] in full_url:
                        item["app_line"] = source
                        fetches.remove(candidate)
                        break
            OUTPUT.parent.mkdir(parents=True, exist_ok=True)
            OUTPUT.write_text(json.dumps({
                "source": "mapa-concretagem/app.js", "external_requests_blocked": blocked_external[0],
                "modes": mode_results, "extra_flows": extra_results,
                "local_invocations": local_invocations, "requests": captured,
            }, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
            print(f"CAPTURA_SEM_REDE_OK modos={len(mode_results)} pedidos_externos_bloqueados={blocked_external[0]} linhas_mapeadas={sum('app_line' in item for item in captured)}")
            for item in mode_results:
                if item.get("actual") != item["requested"]:
                    print(f"MODO_NAO_COBERTO {item}")
            for item in extra_results:
                print("FLUXO " + json.dumps(item, ensure_ascii=False))
            browser.close()
    finally:
        server.shutdown()
        snapshot_server.shutdown()


if __name__ == "__main__":
    main()

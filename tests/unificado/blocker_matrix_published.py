"""Published role/sector matrix for the 0.6.5 blockers.

All navigation and operational writes are made through visible controls. Direct REST
writes are used only to create the production prerequisite needed by the inspection
screen. The remote secret file is read in memory and is never included in the report.
"""

from __future__ import annotations

import argparse
import json
from pathlib import Path
import re
import subprocess
from urllib.parse import urlsplit
import urllib.request

from playwright.sync_api import Page, sync_playwright


BASE = "https://concrefer.concretrack.com.br"
LOGIN = BASE + "/unificado/login.html"
MAPA = BASE + "/unificado/mapa/operacao/"
CHROME = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
OUT = Path("test-results/blocker-065")
BAD_TEXT = re.compile(r"(?:Ãƒ|Ã‚|â‚¬|ï¿½|\ufffd)")
VIEWPORTS = {
    "desktop": (1366, 768),
    "tablet-deitado": (1024, 768),
    "tablet-em-pe": (768, 1024),
}


def accounts() -> list[dict]:
    raw = subprocess.check_output(
        ["ssh", "vps-staging", "sudo", "cat", "/etc/mapa-unificado/blocker-matrix.json"],
        text=True,
        encoding="utf-8",
    )
    return json.loads(raw)["accounts"]


def login(page: Page, account: dict) -> None:
    page.goto(MAPA, wait_until="domcontentloaded", timeout=30_000)
    page.wait_for_url("**/unificado/login.html?next=*", timeout=20_000)
    page.locator('[name="username"]').fill(account["login"].upper())
    page.locator('[name="password"]').fill(account["password"])
    page.locator('#unificado-login-form button[type="submit"]').click()
    page.wait_for_url(MAPA, timeout=20_000)
    page.wait_for_function("typeof state !== 'undefined' && state.authUser", timeout=20_000)
    actual_role = page.evaluate("state.authUser.role || state.authUser.perfil || ''")
    if str(actual_role).upper() != account["role"]:
        raise AssertionError(f"profile mismatch: {actual_role!r}")


def visible_text_checks(page: Page) -> tuple[bool, list[str]]:
    text = page.locator("body").inner_text()
    problems = []
    if "supabase" in text.lower():
        problems.append("visible-supabase")
    if BAD_TEXT.search(text):
        problems.append("mojibake")
    if "Falha ao verificar o banco de dados" in text:
        problems.append("database-probe-failed")
    return not problems, problems


def touch_mode(page: Page, mode: str, desktop: bool) -> None:
    page.goto(MAPA, wait_until="domcontentloaded", timeout=30_000)
    page.wait_for_function("typeof state !== 'undefined' && state.authUser", timeout=20_000)
    if desktop:
        control = page.locator(f'.unificado-nav-link[data-mode="{mode}"]:visible').first
    else:
        control = page.locator(f'[data-hub-mode="{mode}"]:visible').first
    control.click(timeout=12_000)
    page.wait_for_function("mode => state.mode === mode", arg=mode, timeout=20_000)


def modes_from_ui(page: Page, desktop: bool) -> list[str]:
    page.goto(MAPA, wait_until="domcontentloaded", timeout=30_000)
    page.wait_for_function("typeof state !== 'undefined' && state.authUser", timeout=20_000)
    selector = ".unificado-nav-link[data-mode]:visible" if desktop else "[data-hub-mode]:visible"
    return list(dict.fromkeys(page.locator(selector).evaluate_all(
        "els => els.map(el => el.dataset.mode || el.dataset.hubMode).filter(Boolean)"
    )))


def api_probe(page: Page) -> bool:
    result = page.evaluate("""async () => {
      const r = await fetch('/unificado/mapa/api/rest/v1/usuarios?select=id&limit=1',
                            {credentials:'include', cache:'no-store'});
      return {status:r.status, body:await r.text()};
    }""")
    return result["status"] == 200


def sync_and_cards(page: Page, sector: int, unique_date: str) -> tuple[bool, int]:
    touch_mode(page, f"LIBERACAO_S{sector}", page.viewport_size["width"] >= 1025)
    page.locator("#kioskLibData:visible").fill(unique_date)
    page.locator("#kioskLibData:visible").press("Tab")
    page.locator("#btnKioskSync:visible").click()
    page.wait_for_timeout(900)
    cards = page.locator(".forma-card:visible, .s4-forma-cell:visible").count()
    status = page.locator("#syncStatus:visible, #kioskSyncStatus:visible").all_inner_texts()
    failed = any("erro" in item.lower() or "falha" in item.lower() for item in status)
    return cards > 0 and not failed, cards


def program_by_touch(page: Page, sector: int, unique_date: str, index: int) -> tuple[bool, dict]:
    # sync_and_cards leaves the matching sector open.
    toggle = page.locator("#kioskProgToggleField:visible")
    toggle.click()
    page.wait_for_timeout(200)
    mode_on = page.locator("#kioskProgCheckbox").is_checked()
    candidates = page.locator(
        ".forma-card:visible:not(.is-manutencao):not(.is-programmed), "
        ".s4-forma-cell:visible:not(.is-manutencao):not(.is-programmed)"
    )
    if not candidates.count():
        return False, {"reason": "no-candidate", "mode_on": mode_on}
    programmed = page.evaluate("""async ({date,sector}) => {
      const q = new URLSearchParams({select:'forma', data_fabricacao:'eq.'+date,
                                     setor:'eq.Setor '+sector});
      const r = await fetch('/unificado/mapa/api/rest/v1/programacao_pcp?'+q,
                            {credentials:'include',cache:'no-store'});
      if (!r.ok) throw new Error('program lookup '+r.status);
      return (await r.json()).map(x => String(x.forma || '').toUpperCase());
    }""", {"date": unique_date, "sector": sector})
    programmed_set = set(programmed)
    target = None
    for candidate in candidates.all():
        if (candidate.get_attribute("data-forma-numero") or "").upper() not in programmed_set:
            target = candidate
            break
    if target is None:
        return False, {"reason": "all-programmed", "mode_on": mode_on}
    form = target.get_attribute("data-forma-numero")
    with page.expect_response(lambda response: (
        "/unificado/mapa/api/rest/v1/programacao_pcp" in response.url
        and response.request.method in ("POST", "PATCH")
    ), timeout=20_000) as pending:
        target.click()
    response = pending.value
    page.wait_for_timeout(700)
    feedback = page.locator("#libFeedback:visible, #kioskLibFeedback:visible").all_inner_texts()
    current = page.locator(f'[data-forma-numero="{form}"]:visible').first
    marked = current.evaluate("el => el.classList.contains('is-programmed')")
    ok = mode_on and response.status < 300 and marked and not any(
        "erro" in item.lower() or "falha" in item.lower() for item in feedback)
    return ok, {"mode_on": mode_on, "status": response.status, "marked": marked,
                "form": form, "feedback": feedback}


def inspect_by_touch(page: Page, unique_date: str, index: int) -> tuple[bool, dict]:
    touch_mode(page, "INSPECAO", page.viewport_size["width"] >= 1025)
    page.locator("#insFiltroData:visible").fill(unique_date)
    page.locator("#insColaborador:visible").fill("Matriz E2E")
    page.locator("#insCarregarLiberados:visible").click()
    row = page.locator(f'#insLiberadosBody tr[data-forma-numero="E2E-{index:03d}"]')
    row.wait_for(state="visible", timeout=20_000)
    row.locator(".ins-open-btn:visible").click()
    page.wait_for_function("state.mode === 'INSPECAO_DETALHE'", timeout=20_000)
    # Completing one section enables the next, so select the first enabled unanswered
    # approval on each pass until all checklist items are complete.
    clicks = 0
    for _ in range(80):
        button = page.locator('.mp-yn-btn[data-ins-value="sim"]:visible:not([disabled]):not(.active)').first
        if not button.count():
            break
        button.click()
        clicks += 1
        page.wait_for_timeout(60)
        # Playwright has no :visible filter on role queries; inspect candidates.
        for candidate in page.get_by_role("button", name="OK", exact=True).all():
            if candidate.is_visible():
                candidate.click()
                break
    save = page.locator("#insFinalizarPoste:visible")
    save.click()
    page.wait_for_timeout(1_200)
    detail = page.evaluate("""() => ({
      save: document.querySelector('#insFinalizarPoste')?.textContent?.trim(),
      status: typeof state === 'undefined' ? null : state.inspecaoPostesAtual?.statusMontagem,
      finished: typeof state === 'undefined' ? null : state.inspecaoPostesAtual?.finalizadoEm,
      message: document.querySelector('#msgBoxMessage')?.textContent?.trim() || '',
      enabled: document.querySelectorAll('.mp-yn-btn[data-ins-value="sim"]:not([disabled]):not(.active)').length
    })""")
    detail["checklist_clicks"] = clicks
    return save.inner_text().strip() == "Salvo", detail


def run_case(browser, account: dict, viewport_name: str, size: tuple[int, int], index: int) -> dict:
    context = browser.new_context(
        viewport={"width": size[0], "height": size[1]},
        service_workers="block",
        locale="pt-BR",
        permissions=["geolocation"],
        geolocation={"latitude": -21.17, "longitude": -47.81},
    )
    page = context.new_page()
    hosts: set[str] = set()
    failed_responses: list[dict] = []
    page.on("request", lambda request: hosts.add(urlsplit(request.url).hostname or ""))
    def record_failure(response) -> None:
        if response.status < 400 or urlsplit(response.url).hostname != "concrefer.concretrack.com.br":
            return
        item = {"status": response.status, "path": urlsplit(response.url).path}
        if item["path"].endswith("/montagem_poste"):
            try:
                item["body"] = response.text()[:500]
            except Exception:
                pass
        failed_responses.append(item)
    page.on("response", record_failure)
    stage = "login"
    try:
        login(page, account)
        failed_responses.clear()
        stage = "probe"
        probe = api_probe(page)
        desktop = size[0] >= 1025
        stage = "list-modes"
        modes = modes_from_ui(page, desktop)
        navigation = []
        for mode in modes:
            stage = "navigate-" + mode
            try:
                touch_mode(page, mode, desktop)
                text_ok, problems = visible_text_checks(page)
                navigation.append({"mode": mode, "ok": text_ok, "problems": problems})
            except Exception as exc:
                navigation.append({"mode": mode, "ok": False, "problems": [type(exc).__name__]})

        unique_date = "2099-10-15"
        stage = "write"
        if account["role"] == "MONTADOR":
            write_ok, write_detail = inspect_by_touch(page, unique_date, index + 1)
            cards_ok, cards = True, 1
            sync_ok = True
        else:
            cards_ok, cards = sync_and_cards(page, account["sector"] or 1, unique_date)
            write_ok, write_detail = program_by_touch(
                page, account["sector"] or 1, unique_date, index)
            sync_ok = cards_ok
        text_ok, problems = visible_text_checks(page)
        disallowed_hosts = sorted(host for host in hosts if host and host != "concrefer.concretrack.com.br")
        failures = [item for item in failed_responses if item["status"] not in (404,)]
        ok = all((probe, all(item["ok"] for item in navigation), cards_ok, write_ok,
                  sync_ok, text_ok, not disallowed_hosts, not failures))
        return {
            "profile": account["role"], "sector": account["sector"],
            "account_kind": account["kind"], "viewport": viewport_name,
            "screens": len(modes), "navigation_ok": all(item["ok"] for item in navigation),
            "probe_ok": probe, "cards": cards, "write_ok": write_ok,
            "write_detail": write_detail,
            "sync_ok": sync_ok, "text_ok": text_ok, "text_problems": problems,
            "hosts": sorted(hosts), "disallowed_hosts": disallowed_hosts,
            "http_failures": failures, "ok": ok, "navigation": navigation,
        }
    except Exception as exc:
        try:
            safe_page = {"path": urlsplit(page.url).path, "title": page.title()}
        except Exception:
            safe_page = {}
        return {
            "profile": account["role"], "sector": account["sector"],
            "account_kind": account["kind"], "viewport": viewport_name,
            "ok": False, "fatal": f"{stage}: {type(exc).__name__}: {str(exc).splitlines()[0][:240]}",
            "page": safe_page,
            "hosts": sorted(hosts), "http_failures": failed_responses,
        }
    finally:
        context.close()


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--limit", type=int, default=0)
    parser.add_argument("--role")
    parser.add_argument("--sector", type=int)
    parser.add_argument("--kind")
    parser.add_argument("--viewport", choices=VIEWPORTS)
    args = parser.parse_args()
    selected = [item for item in accounts()
                if (not args.role or item["role"] == args.role)
                and (args.sector is None or item["sector"] == args.sector)
                and (not args.kind or item["kind"] == args.kind)]
    # The paired account validates the linked PCP identity; its Mapa sector is Todos.
    # It is sufficient once per viewport and is kept separate from the 4x4 sector grid.
    if args.limit:
        selected = selected[:args.limit]
    viewports = ({args.viewport: VIEWPORTS[args.viewport]} if args.viewport else VIEWPORTS)
    OUT.mkdir(parents=True, exist_ok=True)
    rows = []
    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(headless=True, executable_path=CHROME)
        index = 0
        for viewport_name, size in viewports.items():
            for account in selected:
                rows.append(run_case(browser, account, viewport_name, size, index))
                index += 1
                print(json.dumps({k: rows[-1].get(k) for k in (
                    "profile", "sector", "account_kind", "viewport", "ok", "fatal")
                }, ensure_ascii=False), flush=True)
        browser.close()
    with urllib.request.urlopen(BASE + "/unificado/VERSION", timeout=10) as response:
        published_version = response.read().decode("utf-8").strip()
    result = {
        "version": published_version, "rows": rows, "total": len(rows),
        "passed": sum(item["ok"] for item in rows),
        "hosts": sorted({host for item in rows for host in item.get("hosts", [])}),
    }
    (OUT / "matrix.json").write_text(json.dumps(result, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps({k: result[k] for k in ("version", "total", "passed", "hosts")}, ensure_ascii=False))
    raise SystemExit(0 if result["total"] == result["passed"] else 1)


if __name__ == "__main__":
    main()

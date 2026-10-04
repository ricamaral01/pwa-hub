"""Create and reset a synthetic user via the published PCP Users screen."""

from __future__ import annotations

import json
import secrets
import subprocess

from playwright.sync_api import sync_playwright


BASE = "https://concrefer.concretrack.com.br"
CHROME = r"C:\Program Files\Google\Chrome\Application\chrome.exe"


def main() -> None:
    raw = subprocess.check_output(
        ["ssh", "vps-staging", "cat", "/etc/mapa-unificado/pcp-auth-probe.env"],
        text=True, encoding="utf-8")
    account = dict(line.split("=", 1) for line in raw.splitlines() if "=" in line)
    username = "pcp-ui-probe-" + secrets.token_hex(6)
    initial = secrets.token_urlsafe(12)
    replacement = secrets.token_urlsafe(12)
    writes = []
    responses = []
    page_errors = []
    try:
        with sync_playwright() as playwright:
            browser = playwright.chromium.launch(headless=True, executable_path=CHROME)
            context = browser.new_context(viewport={"width": 1366, "height": 768},
                                          service_workers="block")
            page = context.new_page()
            page.on("pageerror", lambda error: page_errors.append(str(error)))
            def capture(request):
                if "/unificado/pcp/api/usuarios" not in request.url or request.method != "POST":
                    return
                data = request.post_data_json or {}
                writes.append({"path": request.url.split("/unificado/pcp/api", 1)[1],
                               "fields": sorted(key for key in data if key not in {"senha", "nova_senha"}),
                               "has_password_field": "senha" in data or "nova_senha" in data})
            page.on("request", capture)
            page.on("response", lambda response: responses.append({"status": response.status,
                    "path": response.url.split("/unificado/pcp/api", 1)[1].split("?", 1)[0]})
                    if "/unificado/pcp/api/usuarios" in response.url else None)
            page.goto(BASE + "/unificado/login.html?next=pcp/usuarios/", wait_until="domcontentloaded")
            page.locator('#unificado-login-form [name="username"]').fill(account["PCP_TEST_USER"])
            page.locator('#unificado-login-form [name="password"]').fill(account["PCP_TEST_PASSWORD"])
            page.locator('#unificado-login-form button[type="submit"]').click()
            page.wait_for_url("**/unificado/pcp/usuarios/", timeout=20000)
            page.locator("#u-setor option[value]:not([value=''])").first.wait_for(
                state="attached", timeout=15000)
            sector = page.locator("#u-setor option[value]:not([value=''])").first.get_attribute("value")
            page.locator("#u-nome").fill("Conta Sintética Interface")
            page.locator("#u-username").fill(username)
            page.locator("#u-senha").fill(initial)
            page.locator("#u-setor").select_option(sector)
            page.locator("#u-nivel").select_option("CONSULTA")
            page.locator("#form-user button[type=submit]").click()
            row = page.locator("#tbody-users tr", has_text=username)
            row.wait_for(timeout=15000)
            assert "CONSULTA" in row.inner_text() and "Pendente" in row.inner_text()
            user_id = page.evaluate("""async username => {
              const rows=await API.get('/api/usuarios');
              return rows.find(row=>row.username===username)?.id;
            }""", username)
            assert isinstance(user_id, int)
            page.on("dialog", lambda dialog: dialog.accept(replacement)
                    if dialog.type == "prompt" else dialog.accept())
            row.locator("button").click()
            page.wait_for_timeout(650)
            button_emitted_request = len(writes) > 1
            assert not button_emitted_request and page_errors, (writes, page_errors)
            page.evaluate("async ({id,name}) => { await redefinirSenha(id,name); }",
                          {"id": user_id, "name": "Conta Sintética Interface"})
            page.wait_for_function("() => document.querySelector('#toast-container')?.textContent.includes('Senha redefinida')",
                                   timeout=15000)
            assert len(writes) == 2 and all(item["has_password_field"] for item in writes)
            assert writes[0]["fields"] == ["nivel_acesso", "nome", "setor_id", "username"]
            assert writes[1]["fields"] == []
            print(json.dumps({"pcp_users_ui_create": "ok", "create_row": "equal",
                              "reset_button": "original_no_request",
                              "reset_function": "ok", "writes": len(writes),
                              "test_db_only": True}))
            context.close()
            browser.close()
    finally:
        result = subprocess.check_output(
            ["ssh", "vps-staging", "/opt/concrefer-unificado/mapa-api/.venv/bin/python",
             "/opt/concrefer-unificado/migration/cleanup_pcp_ui_synthetic.py", username],
            text=True, encoding="utf-8")
        print(result.strip())


if __name__ == "__main__":
    main()

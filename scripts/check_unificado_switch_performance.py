"""Release gate: published module switches on 4G must meet 4 s cold / 2 s warm.

Creates and removes one paired account in the new databases. Never prints passwords.
Run after deploying; a nonzero exit code requires rolling back the release.
"""
from __future__ import annotations

import json
import os
import secrets
import subprocess
import time

import bcrypt
from argon2 import PasswordHasher
from playwright.sync_api import sync_playwright


ORIGIN = "https://concrefer.concretrack.com.br"
CHROME = os.environ.get("CHROME_PATH", r"C:\Program Files\Google\Chrome\Application\chrome.exe")
NETWORK = {"offline": False, "latency": 90, "downloadThroughput": 1_250_000,
           "uploadThroughput": 250_000, "connectionType": "cellular4g"}


def sql(database: str, statement: str) -> str:
    return subprocess.run(
        ["ssh", "vps-staging", f"sudo -u postgres psql -d {database} -AtX -v ON_ERROR_STOP=1"],
        input=statement, text=True, capture_output=True, check=True,
    ).stdout.strip()


def switch(page, target: str, expected_path: str, dashboard: bool = False) -> int:
    start = time.monotonic()
    page.get_by_role("button", name=target, exact=True).click()
    page.wait_for_function(
        "path => document.querySelector('iframe.is-active')?.contentWindow?.location.pathname === path",
        arg=expected_path, timeout=30000,
    )
    if dashboard:
        frame = page.locator('iframe.is-active').element_handle().content_frame()
        frame.wait_for_function(
            "document.querySelector('#dfNewInspected')?.textContent?.trim() !== '—'",
            timeout=30000,
        )
    assert page.url.startswith(ORIGIN + "/unificado/?view="), page.url
    return round((time.monotonic() - start) * 1000)


def main() -> None:
    login = "e2e-perf-gate-" + secrets.token_hex(5)
    password = secrets.token_urlsafe(18)
    pcp_hash = bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()
    mapa_hash = PasswordHasher().hash(password)
    pcp_id = None
    results = []
    try:
        pcp_id = int(sql("pcp_unificado_teste", f"""
          insert into public.usuarios
            (nome,email,senha_hash,nivel_acesso,ativo,username,setor_id,trocar_senha_primeiro_acesso)
          values ('{login}','{login}@example.invalid','{pcp_hash}','ADMIN',true,'{login}',1,false)
          returning id;""").splitlines()[0])
        sql("mapa_unificado_teste", f"""
          insert into public.usuarios (id,nome,perfil,senha_hash,ativo,setor,primeiro_acesso)
          values ('{login}','{login}','GERENCIA','{mapa_hash}',true,'Todos',false);
          insert into unificado_auth.identity_links
            (pcp_user_id,mapa_login,unified_password_set,requires_reset,pcp_hash,mapa_hash)
          values ({pcp_id},'{login}',true,false,'{pcp_hash}','{mapa_hash}');""")
        with sync_playwright() as playwright:
            browser = playwright.chromium.launch(headless=True, executable_path=CHROME)
            for width, height in ((1366, 768), (768, 1024)):
                for start_module in ("pcp", "mapa"):
                    context = browser.new_context(viewport={"width":width, "height":height},
                                                  service_workers="allow")
                    page = context.new_page()
                    page.goto(ORIGIN + "/unificado/login.html", wait_until="domcontentloaded")
                    page.locator('input[name="username"]').fill(login)
                    page.locator('input[name="password"]').fill(password)
                    page.locator('#unificado-login-form button[type="submit"]').click()
                    page.wait_for_function(
                        "location.pathname !== '/unificado/login.html' && document.querySelector('button.module-button')",
                        timeout=30000)
                    first = ("/unificado/?view=pcp%2Fdashboard%2F" if start_module == "pcp"
                             else "/unificado/?view=mapa%2Foperacao%2F%3Ftela%3DLIBERACAO")
                    path = ("/unificado/pcp/dashboard/" if start_module == "pcp"
                            else "/unificado/mapa/operacao/")
                    page.goto(ORIGIN + first, wait_until="domcontentloaded")
                    page.wait_for_function(
                        "path => document.querySelector('iframe.is-active')?.contentWindow?.location.pathname === path",
                        arg=path, timeout=30000)
                    if start_module == "pcp":
                        page.evaluate("localStorage.setItem('unificado_last_producao', '/unificado/mapa/operacao/?tela=DASHBOARD_DEFEITOS')")
                    cdp = context.new_cdp_session(page)
                    cdp.send("Network.enable")
                    cdp.send("Network.emulateNetworkConditions", NETWORK)
                    other = "Produção" if start_module == "pcp" else "Planejamento"
                    other_path = ("/unificado/mapa/operacao/" if start_module == "pcp"
                                  else "/unificado/pcp/dashboard/")
                    back = "Planejamento" if start_module == "pcp" else "Produção"
                    cold_ms = switch(page, other, other_path, dashboard=start_module == "pcp")
                    warm_ms = switch(page, back, path)
                    results.append({"viewport":f"{width}x{height}",
                                    "direction":f"{start_module}->{other}",
                                    "cold_ms":cold_ms,"warm_ms":warm_ms,
                                    "pass":cold_ms <= 4000 and warm_ms <= 2000})
                    context.close()
            browser.close()
    finally:
        sql("mapa_unificado_teste", f"delete from unificado_auth.identity_links where mapa_login='{login}'; delete from public.usuarios where id='{login}';")
        if pcp_id is not None:
            sql("pcp_unificado_teste", f"delete from public.usuarios where id={pcp_id} and username='{login}';")
    print(json.dumps(results, ensure_ascii=True))
    if len(results) != 4 or not all(row["pass"] for row in results):
        raise SystemExit("Release rejected: module switch exceeded 4 s cold or 2 s warm")


if __name__ == "__main__":
    main()

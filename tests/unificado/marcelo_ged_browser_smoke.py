"""Read-only browser proof that Marcelo enters all GED screens through the shell."""

from __future__ import annotations

import json
import subprocess

from playwright.sync_api import sync_playwright


BASE = "https://concrefer.concretrack.com.br"
CHROME = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
ROUTES = ("dashboard", "documents", "approvals", "tasks", "calibrations")


def short_session(user_id: str) -> str:
    script = """from app import connect,signer
with connect() as conn,conn.cursor() as cur:
 cur.execute('SELECT id,updated_at,ativo,primeiro_acesso,deleted_at FROM public.usuarios WHERE id=%s',(USER_ID,))
 u=cur.fetchone()
assert u and u['ativo'] and not u['primeiro_acesso'] and u['deleted_at'] is None
print(signer().dumps({'scope':'session','id':u['id'],'updated_at':u['updated_at'].isoformat()}))
""".replace("USER_ID", repr(user_id))
    return subprocess.check_output(
        ["ssh", "vps-concrefer",
         "bash -lc 'set -a; . /etc/mapa-unificado/auth.env; cd /opt/concrefer-unificado/mapa-api; .venv/bin/python -'"],
        input=script, text=True, encoding="utf-8", timeout=15,
    ).strip()


def main() -> None:
    token = short_session("marcelo")
    completed = []
    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(headless=True, executable_path=CHROME)
        context = browser.new_context(viewport={"width": 1440, "height": 900}, service_workers="block")
        context.add_cookies([{
            "name": "mapa_unificado_session", "value": token,
            "domain": "concrefer.concretrack.com.br", "path": "/unificado/",
            "secure": True, "httpOnly": True, "sameSite": "Lax",
        }])
        page = context.new_page()
        page.goto(BASE + "/unificado/login.html", wait_until="domcontentloaded")
        page.evaluate("""() => localStorage.setItem('pwa_mapa_auth_session_v1',
            JSON.stringify({id:'marcelo',role:'GERENCIA',name:'Marcelo'}))""")
        for route in ROUTES:
            page.goto(BASE + "/unificado/?view=ged/" + route, wait_until="domcontentloaded")
            frame = page.frame_locator("#module-host iframe.is-active")
            frame.locator("main").wait_for(timeout=20000)
            assert not frame.get_by_text("Bem-vindo", exact=True).count(), route
            assert not frame.get_by_text("Você ainda não tem acesso ao GED.").count(), route
            page.reload(wait_until="domcontentloaded")
            frame = page.frame_locator("#module-host iframe.is-active")
            frame.locator("main").wait_for(timeout=20000)
            assert not frame.get_by_text("Bem-vindo", exact=True).count(), route + " reload"
            completed.append(route)
        context.close()
        browser.close()
    print(json.dumps({"user": "marcelo", "routes_and_reload": completed,
                      "ged_login_seen": False}, ensure_ascii=False))


if __name__ == "__main__":
    main()

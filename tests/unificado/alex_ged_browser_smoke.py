"""Read-only browser proof that Alex reaches all GED routes without a GED login."""
from __future__ import annotations

import argparse
import json
import subprocess

from playwright.sync_api import sync_playwright

CHROME = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
ROUTES = ("dashboard", "documents", "approvals", "tasks", "calibrations")
BASE = "https://concrefer.concretrack.com.br"


def production_cookie():
    script = """from app import connect,signer
with connect() as conn,conn.cursor() as cur:
 cur.execute('SELECT id,updated_at,ativo,primeiro_acesso,deleted_at FROM public.usuarios WHERE id=%s',('alex',))
 u=cur.fetchone()
assert u and u['ativo'] and not u['primeiro_acesso'] and u['deleted_at'] is None
print(signer().dumps({'scope':'session','id':u['id'],'updated_at':u['updated_at'].isoformat()}))
"""
    return subprocess.check_output([
        "ssh", "vps-concrefer",
        "bash -lc 'set -a; . /etc/mapa-unificado/auth.env; cd /opt/concrefer-unificado/mapa-api; .venv/bin/python -'",
    ], input=script, text=True, encoding="utf-8", timeout=15).strip()


def main():
    p = argparse.ArgumentParser()
    p.add_argument("--environment", choices=("homolog", "production"), required=True)
    args = p.parse_args()
    if args.environment == "homolog":
        from homolog_session import test_cookie_for
        token = test_cookie_for("alex")
        base = BASE + ":18446"
        cookie_name = "mapa_unificado_homolog_session"
    else:
        token = production_cookie()
        base = BASE
        cookie_name = "mapa_unificado_session"
    completed = []
    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(headless=True, executable_path=CHROME)
        context = browser.new_context(viewport={"width": 1440, "height": 900}, service_workers="block")
        context.add_cookies([{
            "name": cookie_name, "value": token,
            "domain": "concrefer.concretrack.com.br", "path": "/unificado/",
            "secure": True, "httpOnly": True, "sameSite": "Lax",
        }])
        page = context.new_page()
        page.goto(base + "/unificado/login.html", wait_until="domcontentloaded")
        page.evaluate("""() => localStorage.setItem('pwa_mapa_auth_session_v1',
            JSON.stringify({id:'alex',role:'GERENCIA',name:'Alex Zaranello'}))""")
        for route in ROUTES:
            page.goto(base + "/unificado/?view=ged/" + route, wait_until="domcontentloaded")
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
    print(json.dumps({"environment":args.environment,"user":"alex",
                      "routes_and_reload":completed,"ged_login_seen":False},ensure_ascii=False))


if __name__ == "__main__":
    main()

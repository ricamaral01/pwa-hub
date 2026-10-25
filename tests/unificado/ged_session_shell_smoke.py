"""Read-only GED session persistence check in the published shell.

Signs a short-lived test session inside the GED container. The token stays in
memory and is never printed or written to disk.
"""
from __future__ import annotations

import json
import subprocess
import sys
from pathlib import Path

from playwright.sync_api import sync_playwright


BASE = "https://concrefer.concretrack.com.br"
CHROME = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
ROUTES = ("dashboard", "documents", "calibrations", "approvals", "tasks")
ROOT = Path(__file__).resolve().parents[2]


def ged_session() -> dict:
    script = r"""
const { query } = require('./src/config/database');
const { sign } = require('./src/config/jwt');
const { getUserPermissions } = require('./src/services/rbacService');
(async () => {
  const result = await query(`SELECT u.id,u.name,u.email,u.username,u.role,u.managed_area,
    u.department_id,u.company_id,u.active,u.must_change_password,u.session_version,
    c.slug AS company_slug,c.primary_color FROM users u LEFT JOIN companies c
    ON c.id=u.company_id WHERE u.id=$1`, ['f4ad0ccf-888e-4d14-aa7a-8b595bf9f459']);
  const user = result.rows[0];
  if (!user || !user.active || user.must_change_password) throw new Error('GED test identity unavailable');
  const permissions = Array.from(await getUserPermissions(user.id));
  const token = sign({id:user.id,email:user.email,username:user.username,role:user.role,
    name:user.name,company_id:user.company_id,company_slug:user.company_slug,
    session_version:user.session_version,must_change_password:false});
  process.stdout.write(JSON.stringify({token,user:{...user,permissions}}));
})().catch(error => { process.stderr.write(error.message); process.exitCode=1; });
"""
    result = subprocess.run(
        ["ssh", "-o", "BatchMode=yes", "vps-staging", "docker exec -i ged_backend node -"],
        input=script, text=True, encoding="utf-8", capture_output=True, check=True,
    )
    return json.loads(result.stdout)


def main() -> None:
    auth = ged_session()
    raw = subprocess.check_output(
        ["ssh", "vps-staging", "cat", "/etc/mapa-unificado/quality-auth-probe.env"],
        text=True, encoding="utf-8",
    )
    credentials = dict(line.split("=", 1) for line in raw.splitlines() if "=" in line)
    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(headless=True, executable_path=CHROME)
        context = browser.new_context(service_workers="block", viewport={"width": 1440, "height": 900})
        page = context.new_page()
        page.goto(BASE + "/unificado/login.html", wait_until="domcontentloaded")
        page.locator('#unificado-login-form [name="username"]').fill(credentials["MAPA_TEST_USER"])
        page.locator('#unificado-login-form [name="password"]').fill(credentials["MAPA_TEST_PASSWORD"])
        page.locator('#unificado-login-form button[type="submit"]').click()
        page.wait_for_url("**/unificado/index.html", timeout=30000)
        page.evaluate("""auth => {
          localStorage.setItem('ged_token', auth.token);
          localStorage.setItem('ged_user', JSON.stringify(auth.user));
        }""", auth)
        if '--candidate' in sys.argv:
            def enable_candidate_ged(route, request):
                response = route.fetch()
                route.fulfill(response=response,
                              json={**response.json(), 'ged_access': True})
            page.route('**/unificado/mapa/api/unified/screen-access/me',
                       enable_candidate_ged)
            page.route('**/unificado/mapa/api/unified/ged-bootstrap',
                       lambda route, request: route.fulfill(
                           status=200, content_type='application/json', body='{"ok":true}'))
            for name, content_type in (("shell.js", "text/javascript"),
                                       ("router.js", "text/javascript"),
                                       ("shell.css", "text/css"),
                                       ("shared-menu.css", "text/css")):
                source = (ROOT / "unificado" / "shell" / name).read_text(encoding="utf-8")
                page.route("**/unificado/shell/" + name + "*",
                           lambda route, request, source=source, content_type=content_type:
                           route.fulfill(status=200, content_type=content_type, body=source))
        page.goto(BASE + "/unificado/", wait_until="domcontentloaded")
        for route in ROUTES:
            page.locator(f'#sidebar [data-ged-route="{route}"]').click()
            frame = page.frame_locator('#module-host iframe.is-active')
            frame.locator('main').wait_for(timeout=30000)
            page.wait_for_timeout(750)
            assert page.locator('#sidebar [data-ged-route].is-active').count() == 1, route
            assert page.locator('#sidebar [data-ged-route].is-active').get_attribute('data-ged-route') == route
            if '--candidate' in sys.argv:
                assert page.locator('#sidebar [data-ged-route][aria-current="page"]').count() == 1, route
                assert not page.locator('#sidebar .nav-footer').is_visible(), route
            assert page.evaluate("localStorage.getItem('ged_token') !== null"), route
            assert not (page.locator('#module-host iframe.is-active').get_attribute('src') or '').endswith('/login'), route
            assert not frame.get_by_text('Bem-vindo', exact=True).count(), route
        page.reload(wait_until="domcontentloaded")
        frame = page.frame_locator('#module-host iframe.is-active')
        frame.locator('main').wait_for(timeout=30000)
        assert page.evaluate("localStorage.getItem('ged_token') !== null")
        assert not frame.get_by_text('Bem-vindo', exact=True).count()
        if '--candidate' in sys.argv:
            dot = page.evaluate("""() => {
              const button = document.createElement('button');
              button.className = 'module-button';
              button.dataset.short = 'QL';
              button.innerHTML = '<span class="shared-module-dot"></span>';
              document.querySelector('#sidebar .shared-module-switch').append(button);
              const color = getComputedStyle(button.firstElementChild).backgroundColor;
              button.remove();
              return color;
            }""")
            assert dot == 'rgb(34, 197, 94)', dot
        print(json.dumps({"routes": list(ROUTES), "reload": "session retained",
                          "login_repeated": False, "token_storage": "localStorage, same origin",
                          "candidate": '--candidate' in sys.argv}))
        context.close()
        browser.close()


if __name__ == "__main__":
    main()

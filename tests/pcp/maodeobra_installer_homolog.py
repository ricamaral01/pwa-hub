"""Smoke read-only da entrada instalável no ambiente isolado :18446."""
from pathlib import Path
from playwright.sync_api import sync_playwright, expect
from maodeobra_stage2_homolog import BASE, credentials

CAPTURES = Path("docs/maodeobra-mobile/capturas-instalador-teste")
CAPTURES.mkdir(parents=True, exist_ok=True)


def run_device(playwright, name, engine, device):
    browser = engine.launch(headless=True)
    context = browser.new_context(**device, ignore_https_errors=True)
    page = context.new_page()
    errors = []
    page.on("pageerror", lambda error: errors.append(str(error)))
    page.goto(BASE + "/unificado/m/maodeobra/", wait_until="domcontentloaded")
    expect(page.locator("#mdo-install h1")).to_have_text("Mão de Obra")
    expect(page.locator("#mdo-install")).to_be_visible()
    if name == "iphone":
        expect(page.locator("#mdo-ios-help")).to_be_visible()
        expect(page.locator("#mdo-install-button")).to_be_hidden()
    else:
        page.evaluate("""() => {
          const event = new Event('beforeinstallprompt', {cancelable:true});
          event.prompt = async () => {};
          event.userChoice = Promise.resolve({outcome:'dismissed'});
          dispatchEvent(event);
        }""")
        expect(page.locator("#mdo-install-button")).to_be_visible()
    page.screenshot(path=str(CAPTURES / f"{name}-instalar.png"), full_page=True)
    page.locator("#mdo-continue").click()
    page.wait_for_url("**/unificado/m/maodeobra/login.html?next=**", timeout=20000)
    account = credentials()
    page.locator('#unificado-login-form [name="username"]').fill(account["PCP_TEST_USER"])
    page.locator('#unificado-login-form [name="password"]').fill(account["PCP_TEST_PASSWORD"])
    page.locator('#unificado-login-form button[type="submit"]').click()
    page.wait_for_url("**/unificado/m/maodeobra/?launch=1", timeout=20000)
    expect(page.locator("#mdo-mobile .heading-title")).to_contain_text("Mão de Obra", timeout=20000)
    expect(page.locator("#mdo-mobile .activity-card").first).to_be_visible(timeout=20000)
    page.screenshot(path=str(CAPTURES / f"{name}-aberto.png"), full_page=True)
    page.reload(wait_until="domcontentloaded")
    expect(page.locator("#mdo-mobile .activity-card").first).to_be_visible(timeout=20000)
    manifest = page.evaluate("""async () => {
      const link = document.querySelector('link[rel=manifest]');
      return await (await fetch(link.href)).json();
    }""")
    assert manifest["scope"] == "/unificado/m/maodeobra/"
    assert manifest["start_url"].startswith(manifest["scope"])
    assert not errors, errors
    if name == "android":
        page.wait_for_timeout(1500)
        cache_urls = page.evaluate("""async () => {
          const keys = await caches.keys();
          const own = keys.filter(key => key.startsWith('maodeobra-shell-'));
          return (await Promise.all(own.map(async key => (await (await caches.open(key)).keys()).map(request => request.url)))).flat();
        }""")
        assert cache_urls, "Service worker não preencheu o cache"
        assert all("/api/" not in url and "token" not in url for url in cache_urls), cache_urls
    context.close()
    browser.close()
    return {"device": name, "login": "ok", "launch": "ok", "reload": "ok", "manifest": "ok"}


def existing_mobile_route(playwright):
    browser = playwright.chromium.launch(headless=True)
    context = browser.new_context(viewport={"width": 390, "height": 844}, is_mobile=True,
                                  has_touch=True, ignore_https_errors=True)
    page = context.new_page()
    account = credentials()
    page.goto(BASE + "/unificado/login.html?next=pcp/maodeobra/", wait_until="domcontentloaded")
    page.locator('#unificado-login-form [name="username"]').fill(account["PCP_TEST_USER"])
    page.locator('#unificado-login-form [name="password"]').fill(account["PCP_TEST_PASSWORD"])
    page.locator('#unificado-login-form button[type="submit"]').click()
    page.wait_for_url("**/unificado/?view=pcp%2Fmaodeobra%2F", timeout=20000)
    frame = page.frame_locator("#module-host iframe.is-active")
    link = frame.locator("#mdo-mobile .mdo-install-link")
    expect(link).to_be_visible(timeout=20000)
    expect(link).to_have_attribute("href", "/unificado/m/maodeobra/")
    context.close()
    browser.close()


if __name__ == "__main__":
    with sync_playwright() as pw:
        android = {"viewport": {"width": 390, "height": 844}, "device_scale_factor": 2.75,
                   "is_mobile": True, "has_touch": True,
                   "user_agent": "Mozilla/5.0 (Linux; Android 14; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36"}
        print(run_device(pw, "android", pw.chromium, android))
        print(run_device(pw, "iphone", pw.webkit, pw.devices["iPhone 13"]))
        existing_mobile_route(pw)
        print({"existing_mobile_route": "install link visible"})

"""Stepper regression on the isolated test site; this test never sends a POST."""
from playwright.sync_api import expect, sync_playwright
from maodeobra_stage2_homolog import credentials, BASE


def check(browser_type, device, name):
    account = credentials()
    browser = browser_type.launch(headless=True)
    context = browser.new_context(**device, ignore_https_errors=True)
    page = context.new_page()
    navigations = []
    posts = []
    page.on('framenavigated', lambda frame: navigations.append(frame.url))
    page.on('request', lambda request: posts.append(request.url) if request.method == 'POST' and '/maodeobra/' in request.url else None)
    page.goto(BASE + '/unificado/login.html?next=pcp/maodeobra/', wait_until='domcontentloaded')
    page.locator('#unificado-login-form [name="username"]').fill(account['PCP_TEST_USER'])
    page.locator('#unificado-login-form [name="password"]').fill(account['PCP_TEST_PASSWORD'])
    page.locator('#unificado-login-form button[type="submit"]').click()
    page.wait_for_url('**/unificado/?view=pcp%2Fmaodeobra%2F', timeout=20000)
    frame = page.frame_locator('#module-host iframe.is-active')
    root = frame.locator('#mdo-mobile')
    expect(root.locator('.activity-card')).to_have_count(7, timeout=15000)
    frame.locator('#mdo-m-date').fill('2099-10-21')
    frame.locator('#mdo-m-date').press('Tab')
    expect(root.locator('.date-box')).to_contain_text('2099', timeout=15000)
    expect(root.locator('.activity-card')).to_have_count(7, timeout=15000)
    input_ = root.locator('.activity-card input').first
    plus = root.locator('.activity-card [data-step="0.5"]').first
    minus = root.locator('.activity-card [data-step="-0.5"]').first
    assert input_.input_value() == ''
    input_.evaluate("el => el.dataset.stepperProbe = 'same-node'")
    before_navigations = len(navigations)
    plus.tap()
    expect(input_).to_have_attribute('data-stepper-probe', 'same-node')
    expect(input_).to_have_value('0,5')
    plus.tap()
    expect(input_).to_have_attribute('data-stepper-probe', 'same-node')
    expect(input_).to_have_value('1')
    minus.tap()
    expect(input_).to_have_attribute('data-stepper-probe', 'same-node')
    expect(input_).to_have_value('0,5')
    expect(root.locator('[data-total="all"]')).to_have_text('0,5')
    assert len(navigations) == before_navigations, (name, navigations[before_navigations:])
    assert not posts, (name, posts)
    scroll = root.locator('.scroll')
    scroll.evaluate('el => el.scrollTop = 160')
    before_scroll = scroll.evaluate('el => el.scrollTop')
    plus.evaluate('el => el.click()')
    assert scroll.evaluate('el => el.scrollTop') == before_scroll, name
    expect(input_).to_have_attribute('data-stepper-probe', 'same-node')
    root.locator('[data-group="34"]').tap()
    expect(root.locator('[data-group="34"]')).to_have_class('segment active')
    expect(root.locator('.activity-card').first).to_be_visible(timeout=15000)
    for position in (0, root.locator('.activity-card').count() // 2, root.locator('.activity-card').count() - 1):
        card = root.locator('.activity-card').nth(position)
        field = card.locator('input')
        field.evaluate("el => el.dataset.stepperProbe = 'same-node'")
        field.focus()
        before_navigations = len(navigations)
        card.locator('[data-step="0.5"]').tap()
        expect(field).to_have_value('0,5')
        expect(field).to_have_attribute('data-stepper-probe', 'same-node')
        assert len(navigations) == before_navigations, (name, position)
    assert not posts, (name, posts)
    print(f'{name}: S1/S2 e S3/S4, toques +/-, DOM e rolagem preservados; nenhuma navegacao ou POST')
    context.close()
    browser.close()


if __name__ == '__main__':
    with sync_playwright() as pw:
        check(pw.chromium, dict(viewport={'width': 390, 'height': 844}, is_mobile=True,
            has_touch=True, device_scale_factor=3), 'Android emulado')
        check(pw.webkit, pw.devices['iPhone 13'], 'iPhone emulado')

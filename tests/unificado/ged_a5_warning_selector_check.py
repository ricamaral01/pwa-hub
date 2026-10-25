from playwright.sync_api import sync_playwright

with sync_playwright() as pw:
    browser = pw.chromium.launch(headless=True,
        executable_path=r'C:\Program Files\Google\Chrome\Application\chrome.exe')
    page = browser.new_page()
    page.set_content('<p role="alert">Carimbo não aplicado: teste. O arquivo original foi salvo sem carimbo.</p>')
    print({
        'nested': page.get_by_role('alert').get_by_text('Carimbo não aplicado', exact=False).count(),
        'filtered': page.get_by_role('alert').filter(has_text='Carimbo não aplicado').count(),
    })
    browser.close()

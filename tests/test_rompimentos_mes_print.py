"""Browser smoke check for the monthly rupture table and print layout."""
from pathlib import Path
from tempfile import TemporaryDirectory

import pymupdf
from playwright.sync_api import sync_playwright


HTML = Path(__file__).resolve().parents[1] / 'unificado/laboratorio/service/server/static/cec/rompimentos-mes/index.html'
CHROME = r'C:\Program Files\Google\Chrome\Application\chrome.exe'

with sync_playwright() as playwright, TemporaryDirectory() as directory:
    browser = playwright.chromium.launch(executable_path=CHROME, headless=True)
    page = browser.new_page()
    page.set_content(HTML.read_text(encoding='utf-8'))
    page.evaluate("""() => render([{
      data_moldagem:'2026-10-01', data_ruptura:'2026-10-29', traco_id:'TESTE',
      idade_dias:28, mpa_cp1:31, mpa_cp2:32, media_mpa:31.5, status_resultado:'OK'
    }], '2026-10')""")
    assert [cell.inner_text() for cell in page.locator('#head .id-head').all()] == [
        'DATA MOLD.', 'TRAÇO', 'ROMPIMENTO'
    ]
    assert page.locator('#head .id-main').get_attribute('colspan') == '3'
    first_row = page.locator('#rows tr').first
    assert first_row.locator('td').first.inner_text() == '01/10/26 Qui'
    assert first_row.locator('td').count() == 23
    assert first_row.inner_text().find('29/10/26') >= 0
    page.emulate_media(media='print')
    assert first_row.locator('.weekday').evaluate('(element) => getComputedStyle(element).display') == 'none'
    pdf_path = Path(directory) / 'ruptures.pdf'
    page.pdf(path=str(pdf_path), print_background=True)
    pdf_text = ''.join(item.get_text() for item in pymupdf.open(pdf_path))
    assert '01/10/26' in pdf_text and '29/10/26' in pdf_text
    assert 'Qui' not in pdf_text
    browser.close()

print('MONTHLY_RUPTURES_PRINT_OK')

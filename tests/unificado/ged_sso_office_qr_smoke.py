"""Read-only Office and public QR checks after GED SSO publication."""
from urllib.parse import quote
import requests
from playwright.sync_api import sync_playwright
from ged_sso_published_smoke import BASE, CHROME, context_for

DOCUMENTS = {
    'FL-SGQ-01': ('375b3d0c-c2a3-481e-bc71-9332029510bd', '5f61a0a6-0fe4-4a26-b7b5-e15224bf9fde'),
    'IT-CQC-03': ('ca873648-e767-4ed3-8783-de2f515562b9', 'b0d56ba8-23ac-4c5e-beca-e9f0a843d37c'),
}
CERTIFICATES = {
    '2354/26': 'b3e3ac18-01fa-40d2-9629-9390b60e5dfc',
    '2355/26': '30356330-1d5d-4aca-a98d-2faf2e56630d',
    '2356/26': '86953010-def1-4258-97fe-94ac6e62a661',
    'M-0397/26': 'd06562a5-5e89-4e24-9c27-8ec786de86ff',
}

def main():
    with sync_playwright() as p:
        browser=p.chromium.launch(headless=True,executable_path=CHROME)
        context,page=context_for(browser,'user-ricardo')
        page.goto(BASE+'/unificado/?view=ged/documents',wait_until='domcontentloaded',timeout=20000)
        frame=page.frame_locator('#module-host iframe.is-active')
        frame.locator('main').wait_for(timeout=12000)
        page.wait_for_function("localStorage.getItem('ged_token') !== null",timeout=12000)
        token=page.evaluate("localStorage.getItem('ged_token')")
        assert token
        for code,(document_id,version_id) in DOCUMENTS.items():
            endpoint=f'{BASE}/unificado/ged/api/documents/{document_id}/versions/{version_id}/preview-link'
            response=context.request.get(endpoint,headers={'Authorization':'Bearer '+token},timeout=12000)
            assert response.status==200,(code,'preview-link',response.status)
            signed=response.json()['url']
            assert '/unificado/ged/previews/' in signed
            raw=context.request.get(signed,timeout=20000)
            assert raw.status==200,(code,'signed-file',raw.status)
            assert len(raw.body())>100
            viewer='https://view.officeapps.live.com/op/embed.aspx?src='+quote(signed,safe='')
            office=page.context.new_page()
            rendered=office.goto(viewer,wait_until='domcontentloaded',timeout=30000)
            assert rendered and rendered.status==200,(code,'Office Viewer',rendered.status if rendered else None)
            office.wait_for_timeout(3000)
            body=office.locator('body').inner_text(timeout=5000).lower()
            assert not any(marker in body for marker in ("we can't open",'não conseguimos abrir','something went wrong')),(code,'Office error')
            office.close()
            print(code,'SSO preview-link 200; signed file 200; Office Viewer 200')
        context.close();browser.close()
    for code,certificate_id in CERTIFICATES.items():
        new=f'{BASE}/unificado/ged/calibrations/verify/{certificate_id}'
        result=requests.get(new,timeout=15)
        assert result.status_code==200,(code,'new QR',result.status_code)
        old=f'https://ged.concretrack.com.br/calibrations/verify/{certificate_id}'
        first=requests.get(old,allow_redirects=False,timeout=15)
        assert first.status_code==302,(code,'old QR',first.status_code)
        redirected=requests.get(old,timeout=15)
        assert redirected.status_code==200,(code,'old QR target',redirected.status_code)
        print(code,'QR new 200; old 302 to 200')

if __name__=='__main__': main()

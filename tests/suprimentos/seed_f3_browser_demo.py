"""Cria um rascunho F3 na homologação via API autenticada, sem emissão/entrada."""
import json
from pathlib import Path
from playwright.sync_api import sync_playwright
from check_layout_shell import ROOT,context_for

passwords=json.loads(Path('C:/Users/Admin/Downloads/suprimentos-homolog-logins-20261025.json').read_text(encoding='utf-8'))
with sync_playwright() as p:
    browser=p.chromium.launch(headless=True)
    ctx=context_for(browser,'e2e-suprimentos-almox',1366,768,100,passwords,'')
    existing=ctx.request.get(ROOT+'/api/suprimentos/recebimentos').json()['items']
    if existing:
        row=existing[0]
    else:
        order=ctx.request.get(ROOT+'/api/suprimentos/compras/pedidos?status=ENVIADO').json()['items'][0]
        response=ctx.request.post(ROOT+'/api/suprimentos/recebimentos',data={
            'pedido_id':order['id'],'numero_nf':'DEMO-F3-01'})
        assert response.status==201,response.text()
        row=response.json()
    Path('docs/porting/suprimentos/capturas/f3').mkdir(parents=True,exist_ok=True)
    Path('docs/porting/suprimentos/capturas/f3/demo-id.json').write_text(json.dumps({'id':row['id']}),encoding='utf-8')
    print('F3_DEMO_CREATED',row['id'])
    ctx.close();browser.close()

"""Published login: optional-file/storage failure and a real invalid-login response."""
import json
from pathlib import Path
from playwright.sync_api import sync_playwright
R=Path(__file__).resolve().parents[2];O=R/'docs/revisao-visual-unificado/homolog/login-uni-20261120';BASE='https://concrefer.concretrack.com.br:18446'
checks=[]
with sync_playwright() as pw:
 b=pw.chromium.launch(channel='msedge',headless=True)
 for mode in ['missing-notice','malformed-notice','invalid-expiry','storage-blocked','server-500','invalid-json']:
  ctx=b.new_context(viewport={'width':1440,'height':900},service_workers='block');errors=[]
  if mode=='storage-blocked':ctx.add_init_script("Storage.prototype.getItem=Storage.prototype.setItem=Storage.prototype.removeItem=function(){throw new DOMException('Blocked','SecurityError')}")
  def intercept(route):
   path=route.request.url.split('?')[0]
   if path.endswith('/shell/aviso.json'):
    if mode=='missing-notice':return route.fulfill(status=404,body='Not found')
    if mode=='malformed-notice':return route.fulfill(body='{broken',content_type='application/json')
    if mode=='invalid-expiry':return route.fulfill(json={'ativo':True,'titulo':'Não mostrar','ate':'not-a-date'})
    return route.fulfill(json={'ativo':False})
   if path.endswith('/mapa/api/unified/login'):
    if mode=='server-500':return route.fulfill(status=500,json={'error':'TECHNICAL DETAILS NEVER DISPLAY'})
    if mode=='invalid-json':return route.fulfill(status=502,body='<html>PROXY TECHNICAL ERROR</html>',content_type='text/html')
   return route.continue_()
  ctx.route('**/*',intercept);p=ctx.new_page();p.on('pageerror',lambda e:errors.append(str(e)));p.goto(BASE+'/unificado/login.html',wait_until='networkidle');assert p.locator('#login-notice').is_hidden()
  if mode=='storage-blocked':p.locator('[name=username]').fill('usuario-prova');p.locator('#login-remember-username').check();p.locator('#login-remember-username').uncheck()
  if mode in ['server-500','invalid-json']:
   p.locator('[name=username]').fill('usuario-prova');p.locator('[name=password]').fill('not-a-real-password');p.get_by_role('button',name='Entrar',exact=True).click();p.wait_for_function("document.querySelector('#login-feedback').dataset.kind==='error'");assert p.locator('#login-feedback').inner_text()=='Sem conexão com o servidor. Tente de novo em instantes.'
  assert not errors,errors;checks.append({'case':mode,'ok':True,'controlled_response':True});ctx.close()
 ctx=b.new_context(viewport={'width':1440,'height':900},service_workers='block');p=ctx.new_page();p.goto(BASE+'/unificado/login.html',wait_until='networkidle')
 p.locator('[name=username]').fill('teste-uni-inexistente');p.locator('[name=password]').fill('not-a-real-password')
 with p.expect_response(lambda r:r.url.split('?')[0].endswith('/mapa/api/unified/login')) as event:p.get_by_role('button',name='Entrar',exact=True).click()
 response=event.value;assert response.status in [400,401,403]
 p.wait_for_function("document.querySelector('#login-feedback').dataset.kind==='error'");assert p.locator('#login-feedback').inner_text()=='Usuário ou senha incorretos. Confira e tente de novo.';p.screenshot(path=str(O/'erro-real-1440.png'))
 checks.append({'case':'unknown-user-real-server','status':response.status,'ok':True,'controlled_response':False,'accounts_created':0});ctx.close();b.close()
(O/'edge-cases.json').write_text(json.dumps(checks,indent=2),encoding='utf-8');print(json.dumps({'cases':len(checks),'all_ok':True}))

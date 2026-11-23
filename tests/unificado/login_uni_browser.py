"""Login behavior/captures against the isolated origin with explicit test responses."""
import argparse,json,mimetypes,re,sys
from pathlib import Path
from urllib.parse import urlsplit,unquote
from PIL import Image,ImageChops,ImageDraw
from playwright.sync_api import sync_playwright
R=Path(__file__).resolve().parents[2];O=R/'docs/revisao-visual-unificado/homolog/login-uni-20261120';O.mkdir(parents=True,exist_ok=True)
B=R/'.codex-tmp/login-uni-public-before';BASE='https://concrefer.concretrack.com.br:18446'
parser=argparse.ArgumentParser();parser.add_argument('--published',action='store_true');args=parser.parse_args()
sizes=[(1440,900),(1280,900),(1024,768),(820,1180),(390,844)]
banner_style='<style>.test-environment-bar{position:relative;z-index:9999;padding:6px 12px;background:#fff3cd;color:#664d03;text-align:center;font:600 12px sans-serif}body{padding-top:31px}</style>'
banner='<div class="test-environment-bar">AMBIENTE DE TESTE · dados isolados de homologação</div>'
def geometry(page):
 return page.evaluate('''()=>Object.fromEntries(['.login-card','.login-brand','#login-title','.login-field input[name=username]','.login-field input[name=password]','.login-submit','.login-note','#unificado-version','.login-remember','#login-feedback'].map(s=>{const e=document.querySelector(s);if(!e)return[s,null];const r=e.getBoundingClientRect();if(s==='.login-note'){const range=document.createRange();range.selectNodeContents(e);const t=range.getBoundingClientRect();return[s,{x:Math.min(r.x,t.x),y:Math.min(r.y,t.y),width:Math.max(r.right,t.right)-Math.min(r.x,t.x),height:Math.max(r.bottom,t.bottom)-Math.min(r.y,t.y)}]}return[s,{x:r.x,y:r.y,width:r.width,height:r.height}]}))''')
def screenshot(page,name):
 page.evaluate('document.fonts.ready');page.screenshot(path=str(O/name),full_page=True)
checks=[];pixels=[]
with sync_playwright() as pw:
 browser=pw.chromium.launch(channel='msedge',headless=True)
 def context(width,height,baseline=False):
  ctx=browser.new_context(viewport={'width':width,'height':height},service_workers='block')
  state={'notice':{'ativo':False},'auth':'invalid','submits':0}
  def intercept(route):
   u=urlsplit(route.request.url)
   if u.netloc!=urlsplit(BASE).netloc:return route.abort()
   rel=unquote(u.path.removeprefix('/unificado/'))
   if rel=='shell/aviso.json':return route.fulfill(json=state['notice'])
   if rel=='mapa/api/unified/login':
    state['submits']+=1
    if state['auth']=='offline':return route.abort('connectionrefused')
    if state['auth']=='success':return route.fulfill(json={'ok':True,'modules':['mapa'],'mapa':{'id':'test-in-memory','role':'GERENCIA','name':'Prova controlada'}})
    if state['auth']=='reset':return route.fulfill(json={'ok':True,'reset_required':True,'reset_token':'TEST-NOT-A-REAL-TOKEN','modules':['mapa']})
    return route.fulfill(status=401,json={'error':'TECHNICAL SENTINEL NEVER DISPLAY: '+state['auth']})
   if '/api/' in u.path:return route.abort()
   if rel in ('index.html','') and state['auth']=='success':return route.fulfill(body='<meta charset="utf-8"><title>Início · Uni</title><h1>Autenticação concluída</h1>',content_type='text/html; charset=utf-8')
   if not baseline and args.published:return route.continue_()
   p=(B/rel) if baseline else (R/'unificado'/rel)
   if not p.is_file():p=B/rel
   if p.is_file():
    content_type=mimetypes.guess_type(p.name)[0] or 'application/octet-stream'
    if p.name=='VERSION':content_type='text/plain'
    if p.suffix=='.html' and rel=='login.html':
     text=p.read_text(encoding='utf-8')
     if not baseline:text=text.replace('</head>',banner_style+'</head>').replace('<body>','<body>'+banner)
     return route.fulfill(body=text,content_type='text/html; charset=utf-8')
    return route.fulfill(path=str(p),content_type=content_type)
   return route.continue_()
  ctx.route('**/*',intercept)
  return ctx,state
 for width,height in sizes:
  before,bs=context(width,height,True);bp=before.new_page();bp.goto(BASE+'/unificado/login.html',wait_until='networkidle');screenshot(bp,f'before-{width}.png');bg=geometry(bp);before.close()
  ctx,state=context(width,height);p=ctx.new_page();errors=[];p.on('pageerror',lambda e:errors.append(str(e)))
  p.goto(BASE+'/unificado/login.html',wait_until='networkidle');screenshot(p,f'normal-{width}.png');ag=geometry(p)
  assert not p.locator('#login-remember-username').is_checked()
  assert p.locator('#login-notice').is_hidden()
  assert not p.evaluate('document.documentElement.scrollWidth>innerWidth+1')
  if width>=1025:
   assert p.locator('.login-story-name').evaluate('e=>getComputedStyle(e).fontSize')=='64px'
   assert p.locator('#unificado-login-form .login-submit').evaluate('e=>getComputedStyle(e).backgroundColor')=='rgb(22, 65, 111)'
  else:
   mask=Image.new('1',Image.open(O/f'before-{width}.png').size);draw=ImageDraw.Draw(mask)
   masks=['#login-title','.login-note','#unificado-version','.login-remember','#login-feedback']
   for selector in ['.login-card','.login-brand','.login-field input[name=username]','.login-field input[name=password]','.login-submit']:assert bg[selector]==ag[selector],(width,selector,bg[selector],ag[selector])
   for geo in (bg,ag):
    for selector in masks:
     box=geo.get(selector)
     if box and box['width'] and box['height']:draw.rectangle((box['x']-2,box['y']-2,box['x']+box['width']+2,box['y']+box['height']+2),fill=1)
   a=Image.open(O/f'before-{width}.png').convert('RGB');b=Image.open(O/f'normal-{width}.png').convert('RGB');diff=ImageChops.difference(a,b)
   outside=diff.copy();outside.paste((0,0,0),mask=mask)
   outside.save(O/f'pixel-diff-outside-{width}.png')
   pixels.append({'width':width,'before':bg,'after':ag,'mask_selectors':masks,'changed_pixels_outside_allowed':sum(px!=(0,0,0) for px in outside.getdata())})
   assert pixels[-1]['changed_pixels_outside_allowed']==0,pixels[-1]
  state['notice']={'ativo':True,'titulo':'Atualização hoje às 20h.','texto':'O Uni fica fora do ar por cerca de 30 minutos.','ate':'2099-11-21T00:00:00-03:00'}
  p.reload(wait_until='networkidle');assert p.locator('#login-notice').is_visible();screenshot(p,f'aviso-{width}.png')
  state['notice']={'ativo':True,'titulo':'Expirado','texto':'Não deve aparecer','ate':'2000-01-01T00:00:00-03:00'}
  p.reload(wait_until='networkidle');assert p.locator('#login-notice').is_hidden()
  state['notice']={'ativo':False};p.reload(wait_until='networkidle')
  p.locator('[name=username]').fill('usuario-prova');p.locator('[name=password]').fill('TEST-PASSWORD-NOT-REAL')
  p.locator('#unificado-login-form .login-submit').click();p.wait_for_function("document.querySelector('#login-feedback').dataset.kind==='error'")
  expected='Usuário ou senha incorretos. Confira e tente de novo.'
  assert p.locator('#login-feedback').inner_text()==expected
  assert p.locator('#login-feedback').get_attribute('role')=='alert'
  assert p.locator('[name=password]').get_attribute('aria-invalid')=='true'
  screenshot(p,f'erro-{width}.png')
  state['auth']='unknown-user';p.locator('[name=password]').fill('TEST-PASSWORD-NOT-REAL');p.locator('#unificado-login-form .login-submit').click();p.wait_for_function("!document.querySelector('.login-submit').disabled")
  assert p.locator('#login-feedback').inner_text()==expected
  p.locator('[name=password]').focus();p.locator('[name=password]').evaluate("e=>e.dispatchEvent(new KeyboardEvent('keydown',{key:'A',modifierCapsLock:true,bubbles:true}))")
  assert p.locator('#login-caps-lock').is_visible();screenshot(p,f'caps-lock-{width}.png')
  p.locator('[name=password]').evaluate("e=>e.dispatchEvent(new KeyboardEvent('keyup',{key:'CapsLock',modifierCapsLock:false,bubbles:true}))")
  assert p.locator('#login-caps-lock').is_hidden()
  state['auth']='offline';p.locator('[name=password]').fill('TEST-PASSWORD-NOT-REAL');p.locator('#unificado-login-form .login-submit').click();p.wait_for_function("!document.querySelector('.login-submit').disabled")
  assert p.locator('#login-feedback').inner_text()=='Sem conexão com o servidor. Tente de novo em instantes.'
  p.locator('#login-remember-username').check();storage=p.evaluate('Object.fromEntries(Object.entries(localStorage))')
  assert storage=={'unificado_remember_username':'usuario-prova'},storage
  p.reload(wait_until='networkidle');assert p.locator('[name=username]').input_value()=='usuario-prova';assert p.locator('#login-remember-username').is_checked();assert not p.locator('[name=password]').input_value();screenshot(p,f'lembrar-reaberto-{width}.png')
  p.locator('#login-remember-username').uncheck();assert p.evaluate('localStorage.length')==0
  p.reload(wait_until='networkidle');assert not p.locator('[name=username]').input_value();assert not p.locator('#login-remember-username').is_checked()
  p.locator('[name=username]').focus();p.keyboard.press('Tab');assert p.locator('[name=password]').evaluate('e=>e===document.activeElement')
  p.keyboard.press('Tab');assert p.locator('.unificado-password-toggle').first.evaluate('e=>e===document.activeElement')
  assert p.locator('.unificado-password-toggle').first.evaluate('e=>getComputedStyle(e).outlineStyle')!='none'
  p.keyboard.press('Tab');assert p.locator('#login-remember-username').evaluate('e=>e===document.activeElement')
  p.keyboard.press('Tab');assert p.locator('#unificado-login-form .login-submit').evaluate('e=>e===document.activeElement')
  state['auth']='success';p.locator('[name=username]').fill('usuario-prova');p.locator('[name=password]').fill('TEST-PASSWORD-NOT-REAL');p.keyboard.press('Enter');p.wait_for_url('**/index.html');assert p.locator('h1').inner_text()=='Autenticação concluída'
  assert not errors,errors
  checks.append({'width':width,'ok':True,'controlled_server_responses':True,'remember_storage_before_success':storage,'page_errors':errors,'keyboard_tab_enter':True,'error_role_alert':True});ctx.close()
 browser.close()
(O/'browser-tests.json').write_text(json.dumps({'published_static':args.published,'checks':checks,'all_ok':all(c['ok'] for c in checks)},ensure_ascii=False,indent=2),encoding='utf-8')
(O/'pixel-comparison.json').write_text(json.dumps(pixels,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps({'widths_passed':len(checks),'pixel_outside':[{'width':r['width'],'changed':r['changed_pixels_outside_allowed']} for r in pixels]}))

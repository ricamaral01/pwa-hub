"""Standard, SC and sector-4 labels using existing production rows only."""
import json
from datetime import date,timedelta
from pathlib import Path
from playwright.sync_api import sync_playwright
from producao_resume_runtime import actors,start,count
R=Path(__file__).resolve().parents[2];O=R/'docs/revisao-visual-unificado/producao-20261120/retomada-2';BASE='https://concrefer.concretrack.com.br';actor=next(a for a in actors('production') if a['id']=='alex');rows=[]
with sync_playwright() as pw:
 b=pw.chromium.launch(channel='msedge',headless=True);ctx,page,errors,blocked=start(b,actor,'production',initial_module='planejamento')
 headers={'Authorization':'Bearer '+actor['token'],'X-Unificado-Screen':'etiquetas'}
 resp=ctx.request.get(BASE+'/unificado/pcp/api/programacao?data_inicio=2026-10-01&data_fim=2026-12-29',headers=headers);assert resp.status==200;scheduled=resp.json();standard_dates=list(dict.fromkeys(r['data'] for r in scheduled if r['setor_id'] in [1,2]))[:10];recent=[(date(2026,11,20)-timedelta(days=n)).isoformat() for n in range(15)]
 for route,screen,sector in [('etiquetas','etiquetas',None),('etiquetas-sc','etiquetasSc',3),('etiquetas-setor4','etiquetasSetor4',4)]:
  count();chosen=None;reads=[]
  for day in standard_dates if sector is None else recent:
   path='/unificado/pcp/api/etiquetas-padrao/programacao?data='+day if sector is None else '/unificado/mapa/api/operations/production-labels?data='+day+'&setor=Setor%20'+str(sector)
   response=ctx.request.get(BASE+path,headers=headers if sector is None else {});reads.append({'method':'GET','path':path,'status':response.status});assert response.status==200,reads[-1];data=response.json();data=data if isinstance(data,list) else data['rows']
   if any(r.get('codigo_tipo_forma') and r.get('quantidade_programada',0)>0 for r in data):chosen=day;break
  page.goto(BASE+'/unificado/?module=planejamento',wait_until='domcontentloaded');page.wait_for_function('window.UnificadoRouter');page.evaluate("e=>UnificadoRouter.open('/unificado/pcp/'+e.route+'/',e.screen)",{'route':route,'screen':screen});frame=page.frame_locator('iframe[src*="/pcp/'+route+'/"]');frame.locator('#f-data').wait_for(timeout=30000)
  if chosen:
   frame.locator('#f-data').fill(chosen);frame.locator('#f-data').dispatch_event('change');frame.locator('.poste-check:not([disabled])').first.wait_for(timeout=30000);frame.locator('.poste-check:not([disabled])').first.check();native=next(f for f in page.frames if '/pcp/'+route+'/' in f.url);assert native.evaluate('gerarEtiquetasSelecionadas()');assert frame.locator('.label-preview').count()>0;page.screenshot(path=str(O/f'production-labels-{route}.png'),full_page=True)
   html=native.evaluate("()=>{const d=document.documentElement.cloneNode(true);d.querySelectorAll('script').forEach(e=>e.remove());const base=document.createElement('base');base.href=location.href;d.querySelector('head').prepend(base);return '<!doctype html>'+d.outerHTML}");printed=ctx.new_page();printed.set_content(html,wait_until='networkidle');printed.pdf(path=str(O/f'production-labels-{route}.pdf'),prefer_css_page_size=True,print_background=True);printed.close();page.bring_to_front();native.evaluate('window.__printInvocations=0;window.print=()=>window.__printInvocations++');native.evaluate('imprimirEtiquetasMarcadas()');native.wait_for_function('window.__printInvocations===1',timeout=5000)
   row={'screen':screen,'route':route,'existing_date':chosen,'reads':reads,'labels':frame.locator('.label-preview').count(),'print_handler_called':True,'pdf_from_real_dom':True,'ok':True}
  else:
   row={'screen':screen,'route':route,'reads':reads,'ok':True,'print_data_limitation':'No printable existing pointing found in checked dates; read API and screen open, physical print pending'};page.screenshot(path=str(O/f'production-labels-{route}-empty.png'))
  rows.append(row);(O/'standard-labels-production.json').write_text(json.dumps({'rows':rows,'operational_writes':0,'physical_printer_tested':False,'ok':True},ensure_ascii=False,indent=2),encoding='utf-8');print(json.dumps(row),flush=True)
 ctx.close();b.close()

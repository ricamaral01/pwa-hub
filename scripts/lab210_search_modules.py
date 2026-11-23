"""Search references and module pages, real H, central session plus existing PCP link."""
import json,sys
from pathlib import Path
from playwright.sync_api import sync_playwright
from lab210_resume_common import BASE,O,save
from lab210_browser import session,context_for,screen
from lab210_live_proofs import guard,WIDTHS,PAGES,frame_for,audit
def run():
 result={'environment':'real H18446','queries':[],'module_captures':[],'production_requests':0}
 with sync_playwright() as pw:
  guard('search-module-start');b=pw.chromium.launch(channel='msedge',headless=True);c=context_for(b,session('alex'));p=c.new_page();p.goto(BASE+'/unificado/login.html',wait_until='domcontentloaded')
  # Alex already has an active PCP identity: issue its internal session, no new user.
  p.evaluate("async()=>{const r=await fetch('/unificado/mapa/api/unified/pcp-session');if(!r.ok)throw new Error('existing PCP session not available');const d=await r.json();localStorage.setItem('pcp_token',d.access_token);localStorage.setItem('pcp_user',JSON.stringify(d.usuario))}")
  for unit,name in [('pederneiras','Pederneiras'),('ribeirao','Ribeirão Preto')]:
   guard('module-'+unit)
   for width,height in WIDTHS:
    guard('module-'+unit+'-'+str(width));p.set_viewport_size({'width':width,'height':height});p.goto(BASE+'/unificado/?module=laboratorio&unit='+unit,wait_until='networkidle');p.locator('.module-page:visible').wait_for();p.wait_for_timeout(160);assert not p.evaluate('document.documentElement.scrollWidth>innerWidth+1');file=f'module-{unit}-{width}.png';p.screenshot(path=str(O/file));description=p.locator('.module-page:visible .module-page-description').inner_text();result['module_captures'].append({'unit':unit,'width':width,'file':file,'description':description,'fresh_navigation_at_each_viewport':True});assert description=='7 telas · '+name,(unit,width,description)
  p.evaluate('async()=>{await UnificadoBusca.ready();await UnificadoBusca.rebuild()}');p.wait_for_timeout(1800)
  references=json.loads((Path(__file__).resolve().parents[1]/'tests/unificado/busca-referencia.json').read_text(encoding='utf-8'))
  for query,expected in references:
   actual=p.evaluate('(query)=>UnificadoBusca.search(query).results[0]?.id??null',query);result['queries'].append({'query':query,'expected':expected,'actual':actual,'passed':actual==expected,'new_unit':bool(expected and expected.startswith(('labPedeCec','labRibCec')))})
  result['new_queries_passed']=sum(r['passed'] for r in result['queries'] if r['new_unit']);result['all_queries_passed']=sum(r['passed'] for r in result['queries']);save('search-live.json',result);assert result['new_queries_passed']==14,result
  # Phone startup runs a different module renderer. Load at390px rather than
  # only resizing a desktop page, and replace those14 screenshots with it.
  visual=json.loads((O/'proof-alex.json').read_text(encoding='utf-8'));p.set_viewport_size({'width':390,'height':844});phone_cases=[]
  for unit,name in ([] if '--modules-only' in sys.argv else [('pederneiras','Pederneiras'),('ribeirao','Ribeirão Preto')]):
   for route,label in PAGES:
    before=guard('phone-entry-'+unit+'-'+label);screen(p,'laboratorio/'+unit+'/cec/'+route);frame=frame_for(p,unit);check=audit(frame);assert name in check['unit_label'] and check['iconFontValid'] and not check['pageOverflow'] and not check['brokenHeaders'] and not check['brokenImages'],check
    file=f'{unit}-{label}-390.png';p.screenshot(path=str(O/file));row={'unit':unit,'page':label,'width':390,'file':file,'activity_before':before['total_activity'],'fresh_navigation_at_phone_width':True,**check};index=next(i for i,r in enumerate(visual['captures']) if r['unit']==unit and r['page']==label and r['width']==390);visual['captures'][index]=row;phone_cases.append(row);save('proof-alex.json',visual)
   print(json.dumps({'unit':unit,'fresh_phone_entry_cases':7}),flush=True)
  if phone_cases:save('phone-entry-cases.json',phone_cases)
  # Permissions remove new units from the denied user's search index, too.
  c.close();guard('search-denied-profile');c=context_for(b,session('jgabriel'));p=c.new_page();p.goto(BASE+'/unificado/?module=laboratorio',wait_until='networkidle');p.evaluate('async()=>{await UnificadoBusca.ready();await UnificadoBusca.rebuild()}');hidden=p.evaluate("()=>!UnificadoBusca.entries().some(r=>r.id.startsWith('labPedeCec')||r.id.startsWith('labRibCec'))");result['new_units_hidden_for_pcp_admin']=hidden;assert hidden;c.close();b.close()
 save('search-live.json',result);print(json.dumps({'module_captures':len(result['module_captures']),'new_queries_passed':result['new_queries_passed'],'all_queries_passed':result['all_queries_passed'],'queries':len(result['queries']),'hidden_for_denied_user':hidden}))
if __name__=='__main__':run()

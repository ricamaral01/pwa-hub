"""Five actual viewport baselines and a regression test for native lists/tables."""
import json,sys
from pathlib import Path
from playwright.sync_api import sync_playwright
from producao_resume_runtime import actors,start,count
R=Path(__file__).resolve().parents[2];O=R/'docs/revisao-visual-unificado/homolog/usinas-sobreposicao-20261120';BASE='https://concrefer.concretrack.com.br:18446';mode=sys.argv[1];assert mode in ['before','preview','after'];O.mkdir(parents=True,exist_ok=True);actor=next(a for a in actors('homolog') if a['id']=='alex');measure=(R/'tests/unificado/usinas32_dom.js').read_text(encoding='utf-8');rows=[]
with sync_playwright() as pw:
 b=pw.chromium.launch(channel='msedge',headless=True)
 def preview(ctx):
  if mode!='preview':return
  ctx.route('**/shell/native-content.css*',lambda r:r.fulfill(path=str(R/'unificado/shell/native-content.css'),content_type='text/css'))
  ctx.add_init_script("document.addEventListener('DOMContentLoaded',()=>{if([...document.querySelectorAll('link[rel=stylesheet]')].some(e=>/\\/(usinas|laboratorio)-visual\\.css/.test(e.href))){let l=document.createElement('link');l.rel='stylesheet';l.href='/unificado/shell/native-content.css?v=1.4.32';l.onload=()=>window.__usinas32PreviewReady=true;document.head.append(l)}})")
 ctx,page,errors,blocked=start(b,actor,'homolog',bootstrap=True,initial_module='usinas',before_navigation=preview)
 catalog=page.evaluate("()=>Object.values(MENU_ITEMS).filter(e=>['laboratorio','usinas'].includes(e.moduleId||e.module)).map(e=>({id:e.id,url:e.url,label:e.label}))");(O/'menu-native-catalog.json').write_text(json.dumps(catalog,ensure_ascii=False,indent=2),encoding='utf-8')
 page.evaluate("()=>UnificadoRouter.open('/unificado/usinas/','usinasInicio')");frame=page.frame_locator('iframe[src*="/usinas/"]').first;frame.locator('#linhas tr').first.wait_for(timeout=45000)
 for width,height in [(1440,1000),(1280,900),(1024,900),(820,1180),(390,844)]:
  connections=count();page.set_viewport_size({'width':width,'height':height});page.wait_for_timeout(300);native=next(f for f in page.frames if f.url.startswith(BASE+'/unificado/usinas/'));data=native.evaluate(measure);data.update(width=width,height=height,connections=connections);rows.append(data);page.screenshot(path=str(O/f'{mode}-usinas-{width}.png'),full_page=True)
  if mode!='before':assert not data['overlaps'] and not data['brokenHeaders'] and not data['pageOverflow'],data
 ctx.close();b.close()
result={'mode':mode,'screens':rows,'only_homolog':True,'production_changes':0,'preview_overlay_only':mode=='preview','regression_detected_before':mode=='before' and any(r['overlaps'] or r['brokenHeaders'] for r in rows),'ok':all(not r['overlaps'] and not r['brokenHeaders'] and not r['pageOverflow'] for r in rows)};(O/f'visual-{mode}.json').write_text(json.dumps(result,ensure_ascii=False,indent=2),encoding='utf-8');print(json.dumps({'mode':mode,'widths':len(rows),'overlap_cases':sum(bool(r['overlaps']) for r in rows),'broken_header_cases':sum(bool(r['brokenHeaders']) for r in rows),'page_overflow_cases':sum(r['pageOverflow'] for r in rows),'ok':result['ok']}))
if mode=='before':assert result['regression_detected_before'],'Regression test must detect the original defect'

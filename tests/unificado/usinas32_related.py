"""Inspect native component families through their real authenticated iframe URLs."""
import json,sys
from pathlib import Path
from urllib.parse import urlsplit
from playwright.sync_api import sync_playwright
from producao_resume_runtime import actors,start,count
R=Path(__file__).resolve().parents[2];O=R/'docs/revisao-visual-unificado/homolog/usinas-sobreposicao-20261120';BASE='https://concrefer.concretrack.com.br:18446';mode=sys.argv[1];assert mode in ['before','preview','after'];measure=(R/'tests/unificado/usinas32_dom.js').read_text(encoding='utf-8');actor=next(a for a in actors('homolog') if a['id']=='alex');catalog=json.loads((O/'menu-native-catalog.json').read_bytes());targets=[e for e in catalog if e['id']!='labCertificados' and not e['id'].startswith('labDosagem')];targets += [e for e in catalog if e['id'] in ['labDosagemMateriais','labDosagemTracos']];total_targets=len(targets);rows=[]
if '--noroeste' in sys.argv:
 assert mode=='after';previous=(O/'related-after.json').read_bytes();(O/'related-first-pass.json').write_bytes(previous);rows=[r for r in json.loads(previous)['rows'] if not r['screen'].startswith('usinasNoro')];targets=[e for e in targets if e['id'].startswith('usinasNoro')]
with sync_playwright() as pw:
 b=pw.chromium.launch(channel='msedge',headless=True)
 def preview(ctx):
  if mode!='preview':return
  ctx.route('**/shell/native-content.css*',lambda r:r.fulfill(path=str(R/'unificado/shell/native-content.css'),content_type='text/css'))
  ctx.add_init_script("document.addEventListener('DOMContentLoaded',()=>{if([...document.querySelectorAll('link[rel=stylesheet]')].some(e=>/\\/(usinas|laboratorio)-visual\\.css/.test(e.href))){let l=document.createElement('link');l.rel='stylesheet';l.href='/unificado/shell/native-content.css?v=1.4.32';document.head.append(l)}})")
 ctx,page,errors,blocked=start(b,actor,'homolog',bootstrap=True,initial_module='usinas',before_navigation=preview);responses=[]
 def response(r):
  if '/api/' in r.url and r.status>=400:responses.append({'path':urlsplit(r.url).path,'status':r.status})
 page.on('response',response)
 for entry in targets:
  connections=count();responses.clear();page.evaluate("u=>{document.querySelector('#component-review-frame')?.remove();const f=document.createElement('iframe');f.id='component-review-frame';f.style.cssText='position:fixed;top:95px;left:256px;width:calc(100% - 256px);height:calc(100% - 95px);border:0;background:white;z-index:100';f.src=u;document.body.append(f)}",entry['url']);handle=page.locator('#component-review-frame');frame=handle.element_handle().content_frame();frame.wait_for_load_state('domcontentloaded',timeout=45000);page.wait_for_timeout(700)
  # A bounded settle lets iframe startup finish without waiting on realtime streams.
  try:frame.wait_for_load_state('networkidle',timeout=1800)
  except Exception:pass
  for width,height in [(1440,1000),(1280,900),(1024,900),(820,1180),(390,844)]:
   page.set_viewport_size({'width':width,'height':height});page.evaluate("()=>{const f=document.querySelector('#component-review-frame');f.style.left=innerWidth>1024?'256px':'0';f.style.width=innerWidth>1024?'calc(100% - 256px)':'100%'}");page.wait_for_timeout(100);data=frame.evaluate(measure);data.update(screen=entry['id'],label=entry['label'],width=width,connections=connections,api_refusals=list(responses));rows.append(data)
  (O/f'related-{mode}.json').write_text(json.dumps({'mode':mode,'targets':total_targets,'rows':rows,'noroeste_family_retested':'--noroeste' in sys.argv,'ok':all(not r['overlaps'] and not r['brokenHeaders'] and not r['pageOverflow'] for r in rows)},ensure_ascii=False,indent=2),encoding='utf-8');print(json.dumps({'mode':mode,'screen':entry['id'],'overlaps':sum(len(r['overlaps']) for r in rows[-5:]),'broken_headers':sum(len(r['brokenHeaders']) for r in rows[-5:]),'page_overflow':sum(r['pageOverflow'] for r in rows[-5:])}),flush=True)
 ctx.close();b.close()
assert len(rows)==total_targets*5
if mode!='before':assert all(not r['overlaps'] and not r['brokenHeaders'] and not r['pageOverflow'] for r in rows),[(r['screen'],r['width']) for r in rows if r['overlaps'] or r['brokenHeaders'] or r['pageOverflow']]

"""Before/after captures, geometry, module permissions and read-only route review."""
import argparse,json
from urllib.parse import quote,urlsplit
from playwright.sync_api import sync_playwright
from modulos_runtime import R,O,BASE,MODULES,actors,start,count
parser=argparse.ArgumentParser();parser.add_argument('mode',choices=['before','inspect','candidate','published']);parser.add_argument('--quick',action='store_true');parser.add_argument('--retry-empty',action='store_true');args=parser.parse_args()
people=actors();admin=next(a for a in people if a['category']=='central' and a['role']=='GERENCIA')
geometry='''()=>{const page=document.querySelector('.module-page:not([hidden])'),root=page.querySelector('.module-page-columns')||page;const base=root.getBoundingClientRect();const groups=[...page.querySelectorAll('.module-page-group:not([hidden])')].map(g=>{const r=g.getBoundingClientRect();return {label:g.dataset.group,x:r.x,y:r.y,width:r.width,height:r.height,bottom:r.bottom,items:g.querySelectorAll('.module-page-link:not([hidden])').length}});const columns=[];for(const g of groups){let col=columns.find(c=>Math.abs(c.x-g.x)<2);if(!col){col={x:g.x,groups:[]};columns.push(col)}col.groups.push(g)}const gaps=[];for(const col of columns){col.groups.sort((a,b)=>a.y-b.y);for(let i=0;i<col.groups.length;i++){const g=col.groups[i],above=i?col.groups[i-1].bottom:base.y;gaps.push({group:g.label,gap:g.y-above})}}const items=[...page.querySelectorAll('.module-page-link:not([hidden])')].map(e=>({id:e.dataset.itemId,description:e.querySelector('.module-page-link-description')?.textContent,icon:!!e.querySelector('.module-page-icon svg'),height:e.getBoundingClientRect().height}));return {columns:columns.length,gaps,groups,items,overflow:document.documentElement.scrollWidth>innerWidth+1,columnEnds:columns.map(c=>Math.max(...c.groups.map(g=>g.bottom)))}}'''
results=[]
def capture(page,name):
 # Full-page alone clips the internally scrolling main panel. Fit its content
 # vertically while keeping the requested reference width and column widths.
 height=page.evaluate("Math.ceil(document.querySelector('.module-page:not([hidden])')?.getBoundingClientRect().height||900)+120")
 width=page.viewport_size['width'];page.set_viewport_size({'width':width,'height':max(1000,height)})
 page.screenshot(path=str(O/name),full_page=True);page.set_viewport_size({'width':width,'height':1000})
with sync_playwright() as pw:
 browser=pw.chromium.launch(channel='msedge',headless=True)
 if args.mode=='inspect':
  ctx,p,errors=start(browser,admin);catalog=json.loads((O/'catalogue-before.json').read_text(encoding='utf-8'));entries=list({e['id']:e for e in catalog['entries'] if not e['description']}.values());entries+=p.evaluate("UnificadoBusca.entries().filter(e=>e.moduleId==='ged')")
  destination=O/'screen-review.json';review=json.loads(destination.read_text(encoding='utf-8')) if destination.exists() else [];done={r['id'] for r in review if not args.retry_empty or any(v.get('text','').strip() for v in r['visible_content'])}
  for i,entry in enumerate(entries):
   if entry['id'] in done:continue
   if i%5==0:count()
   target=entry['url'];u=urlsplit(target);view=u.path.removeprefix('/unificado/')+('?' +u.query if u.query else '')+('#'+u.fragment if u.fragment else '')
   texts=[];status='opened'
   try:
    p.goto(BASE+'/unificado/?view='+quote(view,safe=''),wait_until='domcontentloaded',timeout=20000);p.wait_for_function('window.UnificadoBusca');p.evaluate('async()=>await UnificadoBusca.ready()')
    try:p.wait_for_function("()=>{const h=document.getElementById('module-host');return h&&(h.innerText.trim().length>40||[...h.querySelectorAll('*')].some(e=>e.shadowRoot?.querySelector('h1,h2,p,label,button')?.textContent.trim().length>2)||[...h.querySelectorAll('iframe')].some(f=>{try{return f.contentDocument?.body?.innerText.trim().length>40}catch{return false}}))}",timeout=8000)
    except Exception:status='opened; content unavailable, source review required'
    p.wait_for_timeout(200)
    for frame in p.frames:
     if frame==p.main_frame:continue
     try:texts.append({'url':frame.url,'text':frame.locator('body').inner_text(timeout=1000)[:3500]})
     except Exception:pass
    if not texts:
     text=p.locator('#module-host').inner_text(timeout=1000)
     shadow=p.evaluate("()=>[...document.querySelectorAll('#module-host *')].filter(e=>e.shadowRoot).flatMap(e=>[...e.shadowRoot.querySelectorAll('h1,h2,h3,p,label,button,th')].map(n=>n.textContent.trim())).join('\\n')")
     texts=[{'url':p.url,'text':(text+'\n'+shadow).strip()[:3500]}]
   except Exception as e:status=type(e).__name__
   review=[r for r in review if r['id']!=entry['id']];review.append({'id':entry['id'],'module':entry['module'],'name':entry['name'],'url':target,'status':status,'visible_content':texts});destination.write_text(json.dumps(review,ensure_ascii=False,indent=2),encoding='utf-8');print(entry['id']+': '+status,flush=True)
  ctx.close()
 else:
  phase='before' if args.mode=='before' else 'after';candidate=args.mode=='candidate'
  for width in ([1440] if args.quick else [1440,1280,1024,820]):
   ctx,p,errors=start(browser,admin,width,candidate=candidate)
   for module in MODULES+['laboratorio-noroeste']:
    module_query='laboratorio&unit=noroeste' if module=='laboratorio-noroeste' else module
    initial=count();p.goto(BASE+'/unificado/?module='+module_query,wait_until='networkidle');p.evaluate('async()=>await UnificadoBusca.ready()');p.wait_for_timeout(80)
    if phase=='before' and module=='logistica' and not p.locator('.module-page:not([hidden])').count():
     p.screenshot(path=str(O/f'{phase}-{module}-{width}.png'),full_page=True);results.append({'module':module,'width':width,'phase':phase,'native_home':True,'connections_before':initial,'connections_after':count()});continue
    p.locator('.module-page:not([hidden])').wait_for()
    g=p.evaluate(geometry);g.update(module=module,width=width,phase=phase,connections_before=initial,connections_after=count());results.append(g)
    capture(p,f'{phase}-{module}-{width}.png')
    if phase=='after':
     assert not g['overflow'],(module,width,'overflow');assert all(-1<=row['gap']<=16.1 for row in g['gaps']),(module,width,g['gaps']);assert all(row['description'] and row['icon'] and row['height']>=44 for row in g['items']),(module,width,'missing item content');assert width!=820 or g['columns']==1,(module,width,g['columns'])
     field=p.locator('.module-page-search:visible');field.fill(g['items'][0]['description']);p.wait_for_timeout(50);filtered=p.evaluate(geometry);assert all(-1<=row['gap']<=16.1 for row in filtered['gaps']),(module,width,'filtered gaps')
     assert len(g['groups'])<=1 or len(filtered['groups'])<len(g['groups']),(module,width,'filter did not hide groups')
     capture(p,f'filter-{module}-{width}.png');g['filter']=filtered
     field.fill('zzzzxyz');assert p.locator('.module-page-group:visible').count()==0;assert p.locator('.module-page-empty:visible').count()==1
    print(f'{args.mode}: {module} {width}px, {len(g["groups"])} groups, {g["columns"]} columns',flush=True)
   assert not errors,errors;ctx.close()
  (O/f'{args.mode}-geometry.json').write_text(json.dumps(results,ensure_ascii=False,indent=2),encoding='utf-8')
  if args.mode=='candidate':
   # TV is intentionally opened directly in another tab by the module link;
   # it is not an embedded ?view route supported by the shell router.
   ctx,p,errors=start(browser,admin,candidate=True);response=p.goto(BASE+'/unificado/tv/formas/',wait_until='domcontentloaded');p.wait_for_timeout(1200)
   content=p.locator('body').inner_text();assert response.status==200 and content.strip();record={'id':'tvFormas','direct_screen':True,'http_status':response.status,'title':p.title(),'text':content[:3000],'operational_actions':False}
   (O/'tv-browser-review.json').write_text(json.dumps(record,ensure_ascii=False,indent=2),encoding='utf-8');ctx.close()
  print(json.dumps({'mode':args.mode,'pages':len(results),'ok':True}),flush=True)
 browser.close()

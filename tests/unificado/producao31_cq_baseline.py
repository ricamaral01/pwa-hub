"""Exactly the same read-only CQ requests before and after production publishing."""
import hashlib,json,sys,time
from pathlib import Path
from playwright.sync_api import sync_playwright
from producao_resume_runtime import actors,count
R=Path(__file__).resolve().parents[2];O=R/'docs/revisao-visual-unificado/producao-20261120/retomada-2';BASE='https://concrefer.concretrack.com.br';ROOT=BASE+'/unificado/laboratorio/certificados-qualidade';mode=sys.argv[1];assert mode in ['before','after']
actor=next(a for a in actors('production') if a['id']=='alex');rows=[];count()
with sync_playwright() as pw:
 b=pw.chromium.launch(channel='msedge',headless=True);ctx=b.new_context(viewport={'width':1440,'height':1000},service_workers='block')
 ctx.route('**/*',lambda route:route.continue_() if route.request.method in ['GET','HEAD','OPTIONS'] else route.abort())
 ctx.add_cookies([{'name':'mapa_unificado_session','value':actor['cookie'],'domain':'concrefer.concretrack.com.br','path':'/unificado/','secure':True,'httpOnly':True}])
 def get(name,path):
  assert path.startswith('/unificado/laboratorio/certificados-qualidade/')
  started=time.monotonic();response=ctx.request.get(BASE+path,headers={'Content-Type':'application/json'},timeout=45000);data=response.body();row={'name':name,'method':'GET','path':path,'headers':{'Content-Type':'application/json'},'status':response.status,'seconds':round(time.monotonic()-started,3),'bytes':len(data),'content_type':response.headers.get('content-type',''),'sha256':hashlib.sha256(data).hexdigest()}
  if response.status!=200:row['error']=data.decode('utf-8',errors='replace')[:500]
  if data.startswith(b'%PDF'):(O/('production-cq-'+mode+'-'+name+'.pdf')).write_bytes(data)
  rows.append(row);print(json.dumps(row),flush=True);return response,data
 if mode=='before':
  response,data=get('history','/unificado/laboratorio/certificados-qualidade/api/certificados');assert response.status==200,rows[-1];history=json.loads(data);issued=next((r for r in history if r['status'] in ['emitido','substituido']),None);draft=next((r for r in history if r['status']=='rascunho'),None);assert issued,'No issued certificate to baseline'
  reads=[('issued-pdf','/unificado/laboratorio/certificados-qualidade/api/certificados/'+str(issued['id'])+'/pdf')]
  if draft:reads.append(('draft-preview','/unificado/laboratorio/certificados-qualidade/api/certificados/'+str(draft['id'])+'/pdf'))
 else:
  before=json.loads((O/'cq-production-before.json').read_bytes());issued=before['issued'];draft=before['draft'];reads=[(r['name'],r['path']) for r in before['requests']]
 for name,path in reads:get(name,path)
 page=ctx.new_page();page.goto(ROOT+'/?tab=historico',wait_until='domcontentloaded');page.wait_for_timeout(700);page.screenshot(path=str(O/('production-cq-'+mode+'-history.png')),full_page=True)
 version=(ctx.request.get(BASE+'/unificado/VERSION').text()).strip();ctx.close();b.close()
result={'mode':mode,'version':version,'account':'alex','issued':issued,'draft':draft,'requests':rows,'only_get':True,'created_records':0,'connections':count()}
if mode=='after':
 old={r['name']:r for r in before['requests']};regressions=[r for r in rows if old[r['name']]['status']==200 and r['status']!=200];result['regressions']=regressions;result['ok']=not regressions
else:result['ok']=True
(O/('cq-production-'+mode+'.json')).write_text(json.dumps(result,ensure_ascii=False,indent=2),encoding='utf-8');assert result['ok'],result;print(json.dumps({'mode':mode,'version':version,'requests':len(rows),'ok':result['ok']}))

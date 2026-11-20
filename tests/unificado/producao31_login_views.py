"""Compare login geometry at desktop/mobile/tablet; never submits credentials."""
import json,sys
from pathlib import Path
from playwright.sync_api import sync_playwright
R=Path(__file__).resolve().parents[2];O=R/'docs/revisao-visual-unificado/producao-20261120/retomada-2';mode=sys.argv[1];assert mode in ['before','after'];rows=[];BASE='https://concrefer.concretrack.com.br'
with sync_playwright() as pw:
 b=pw.chromium.launch(channel='msedge',headless=True)
 for width,height in [(1440,1000),(390,844),(820,1180)]:
  ctx=b.new_context(viewport={'width':width,'height':height},service_workers='block');ctx.route('**/*',lambda r:r.continue_() if r.request.method in ['GET','HEAD','OPTIONS'] else r.abort());p=ctx.new_page();p.goto(BASE+'/unificado/login.html',wait_until='networkidle')
  view=p.evaluate("""()=>({version:document.querySelector('#unificado-version')?.textContent,inputs:[...document.querySelectorAll('input')].filter(e=>e.getClientRects().length&&e.type!=='hidden').map(e=>({type:e.type,name:e.name,rect:{x:e.getBoundingClientRect().x,y:e.getBoundingClientRect().y,width:e.getBoundingClientRect().width,height:e.getBoundingClientRect().height}})),overflow:document.documentElement.scrollWidth>innerWidth+1})""")
  assert not view['overflow'] and any(x['type']=='password' for x in view['inputs']);p.screenshot(path=str(O/('production-login-'+mode+'-'+str(width)+'.png')));rows.append({'width':width,'height':height,**view});ctx.close()
 b.close()
result={'mode':mode,'views':rows,'password_submission_tested':False,'password_test':'Pending for the user, as explicitly requested','ok':True}
if mode=='after':
 before=json.loads((O/'login-before.json').read_bytes());comparison=[]
 for row in rows:
  if row['width']==1440:continue
  old=next(x for x in before['views'] if x['width']==row['width']);original_inputs=[x for x in row['inputs'] if x['type']!='checkbox'];same=[x['type'] for x in original_inputs]==[x['type'] for x in old['inputs']];assert same
  geometry=all(abs(a['rect'][key]-b['rect'][key])<0.1 for a,b in zip(old['inputs'],original_inputs) for key in ['x','y','width','height']);assert geometry,('Mobile/tablet login layout changed',row['width'],old['inputs'],original_inputs);comparison.append({'width':row['width'],'original_credential_fields_unchanged':same,'input_geometry_unchanged':geometry,'approved_new_control':'Remember username checkbox: explicitly authorized on all widths by PROMPT_CODEX_LOGIN_UNI.md items 2c and 3','before':old['inputs'],'after':row['inputs']})
 result['mobile_tablet_comparison']=comparison
(O/('login-'+mode+'.json')).write_text(json.dumps(result,ensure_ascii=False,indent=2),encoding='utf-8');print(json.dumps(result))

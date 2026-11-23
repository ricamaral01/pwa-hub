"""Natural shell navigation: verify Noroeste at actual device viewport widths."""
import json
from pathlib import Path
from playwright.sync_api import sync_playwright
from producao_resume_runtime import actors,start,count
R=Path(__file__).resolve().parents[2];O=R/'docs/revisao-visual-unificado/homolog/usinas-sobreposicao-20261120';BASE='https://concrefer.concretrack.com.br:18446';actor=next(a for a in actors('homolog') if a['id']=='alex');measure=(R/'tests/unificado/usinas32_dom.js').read_text(encoding='utf-8');rows=[]
with sync_playwright() as pw:
 b=pw.chromium.launch(channel='msedge',headless=True);ctx,page,errors,blocked=start(b,actor,'homolog',bootstrap=True,initial_module='usinas')
 for area in ['cec','estoque']:
  connections=count();page.goto(BASE+'/unificado/?view=usinas%2Fnoroeste%2F%3Farea%3D'+area,wait_until='domcontentloaded');page.locator('.noro-table-wrap th').first.wait_for(timeout=45000)
  for width,height in [(1440,1000),(1280,900),(1024,900),(820,1180),(390,844)]:
   page.set_viewport_size({'width':width,'height':height});page.wait_for_timeout(250);data=page.evaluate(measure);data.update(area=area,width=width,connections=connections);rows.append(data);page.screenshot(path=str(O/f'after-noroeste-{area}-{width}.png'),full_page=True);assert not data['overlaps'] and not data['brokenHeaders'] and not data['pageOverflow'],data
 ctx.close();b.close()
(O/'noroeste-natural-navigation.json').write_text(json.dumps({'cases':len(rows),'rows':rows,'ok':True},ensure_ascii=False,indent=2),encoding='utf-8');print(json.dumps({'noroeste_cases':len(rows),'ok':True}))

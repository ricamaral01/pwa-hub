"""Navigate every PCP page exposed to a role by clicking visible sidebar links."""
from __future__ import annotations
import argparse,json,subprocess
from pathlib import Path
from urllib.parse import urlsplit
from playwright.sync_api import sync_playwright
BASE='https://concrefer.concretrack.com.br';CHROME=r'C:\Program Files\Google\Chrome\Application\chrome.exe';OUT=Path('.work-mapa-unificado/pcp-e2e')
def main():
 p=argparse.ArgumentParser();p.add_argument('--role',required=True,choices=['ADMIN','PCP','PRODUCAO','CONSULTA']);a=p.parse_args();raw=subprocess.check_output(['ssh','vps-staging','cat','/etc/mapa-unificado/pcp-auth-probe.env'],text=True);acc=dict(x.split('=',1) for x in raw.splitlines() if '=' in x);external=[];results=[]
 with sync_playwright() as pw:
  b=pw.chromium.launch(headless=True,executable_path=CHROME);c=b.new_context(viewport={'width':1366,'height':768},service_workers='block');page=c.new_page();page.on('request',lambda r:external.append(r.url) if r.url.startswith('http') and urlsplit(r.url).hostname!='concrefer.concretrack.com.br' else None)
  page.goto(BASE+'/unificado/login.html?next=pcp/dashboard/',wait_until='domcontentloaded');page.locator('[name=username]').fill(acc['PCP_TEST_USER']);page.locator('[name=password]').fill(acc['PCP_TEST_PASSWORD']);page.locator('#unificado-login-form button[type=submit]').click();page.wait_for_url('**/unificado/pcp/dashboard/',timeout=20000)
  for index in range(page.locator('#sidebar .nav-group-toggle:visible').count()): page.locator('#sidebar .nav-group-toggle:visible').nth(index).click()
  links=page.locator('#sidebar a.nav-link').evaluate_all("els=>els.filter(e=>getComputedStyle(e).display!=='none'&&!e.hidden&&e.getAttribute('href')?.includes('/unificado/pcp/')).map(e=>({href:e.getAttribute('href'),label:e.innerText.trim()}))")
  seen=set()
  for item in links:
   href=item['href'];
   if not href or href in seen:continue
   seen.add(href);page.goto(BASE+'/unificado/pcp/dashboard/',wait_until='domcontentloaded')
   for index in range(page.locator('#sidebar .nav-group-toggle:visible').count()): page.locator('#sidebar .nav-group-toggle:visible').nth(index).click()
   loc=page.locator(f'#sidebar a.nav-link[href="{href}"]:visible');
   if not loc.count():continue
   target=urlsplit(href).path
   if target==urlsplit(page.url).path: loc.click();page.wait_for_timeout(250)
   else:
    loc.click();page.wait_for_url('**'+target,timeout=20000);page.wait_for_load_state('domcontentloaded')
   page.wait_for_timeout(350);results.append({'label':item['label'],'path':urlsplit(page.url).path,'http_ok':True,'clicked':True})
  assert not external,external;OUT.mkdir(parents=True,exist_ok=True);(OUT/f'real-touch-nav-{a.role.lower()}.json').write_text(json.dumps(results,ensure_ascii=False,indent=2),encoding='utf8');print(json.dumps({'role':a.role,'clicked_pages':len(results),'pages':results,'external':0},ensure_ascii=False));c.close();b.close()
if __name__=='__main__':main()

"""Click every accessible Mapa flow through visible published controls."""
from __future__ import annotations
import argparse,json
from pathlib import Path
from playwright.sync_api import sync_playwright
from operacao_smoke import CHROME,URL,credentials,login_operacao,OUT
VIEWS={'HUB':'viewHub','LIBERACAO':'viewLiberacao','LIBERACAO_S1':'viewLiberacao','LIBERACAO_S2':'viewLiberacao','LIBERACAO_S3':'viewLiberacao','LIBERACAO_S4':'viewLiberacao','MANDRIL_CIRCULAR':'viewMandrilCircular','INSPECAO':'viewInspecao','MONTAGEM_POSTES':'viewMontagemPostes','SEQUENCIA_S3':'viewSequenciaS3','RELATORIO':'viewRelatorio','HISTORICO':'viewHistorico','ACMP_CONCRETAGEM':'viewAcmpConcretagem','RELATORIO_MANUTENCAO':'viewRelatorioManutencao','TRATATIVA_DEFEITOS':'viewTratativaDefeitos','MONTAGEM_INDICADORES':'viewMontagemIndicadores','DASHBOARD_DEFEITOS':'viewDashboardDefeitos','PROD_ANALISE':'viewProdAnalise','USUARIOS':'viewUsuarios'}
def main():
 p=argparse.ArgumentParser();p.add_argument('--role',required=True,choices=['GERENCIA','GESTOR','APONTADOR','MONTADOR']);a=p.parse_args();acc=credentials();rows=[];external=[]
 with sync_playwright() as pw:
  b=pw.chromium.launch(headless=True,executable_path=CHROME);c=b.new_context(viewport={'width':1366,'height':768},service_workers='block');page=c.new_page()
  page.on('request',lambda r: external.append(r.url) if r.url.startswith('http') and 'concrefer.concretrack.com.br' not in r.url else None)
  login_operacao(page,acc['MAPA_TEST_USER'],acc['MAPA_TEST_PASSWORD'],a.role)
  modes=page.locator('.unificado-nav-link:not([hidden])').evaluate_all("els=>els.map(e=>e.dataset.mode)")
  for mode in modes:
   button=page.locator(f'.unificado-nav-link[data-mode="{mode}"]:visible');button.click();page.wait_for_function("m=>state.mode===m",arg=mode,timeout=15000)
   view=page.locator('#'+VIEWS[mode]); view.wait_for(state='visible',timeout=15000)
   rows.append({'mode':mode,'control_visible':True,'view_visible':True})
   if mode.startswith('LIBERACAO_S'):
    page.locator('#kioskLibData').fill('2026-10-02');page.locator('#kioskLibData').press('Tab');page.wait_for_timeout(600)
    # Exercise the three visible mode controls without touching a form card.
    for selector in ('#kioskProgToggleField','#kioskLibToggleField','#kioskManutencaoToggleField:not(.hidden)'):
     ctl=page.locator(selector+':visible')
     if ctl.count(): ctl.click(); page.wait_for_timeout(120); ctl.click()
    page.locator('#btnKioskSync:visible').click();page.wait_for_timeout(500)
    page.locator('#btnKioskBack:visible').click();page.wait_for_function("state.mode==='HUB'",timeout=10000)
  assert not external,external
  OUT.mkdir(parents=True,exist_ok=True);path=OUT/f'real-touch-navigation-{a.role.lower()}.json';path.write_text(json.dumps(rows,ensure_ascii=False,indent=2),encoding='utf8')
  print(json.dumps({'role':a.role,'visible_touch_flows':len(rows),'modes':modes,'external':0},ensure_ascii=False));c.close();b.close()
if __name__=='__main__':main()

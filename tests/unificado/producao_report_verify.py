"""Check the delivered local report and links without production requests."""
import json
from pathlib import Path
from playwright.sync_api import sync_playwright
R=Path(__file__).resolve().parents[2];O=R/'docs/revisao-visual-unificado/producao-20261120';text=(O/'RELATORIO.html').read_text(encoding='utf-8')
assert not any(value in text for value in ['Arma????','\ufffd','ArmaÃ','ProduÃ'])
with sync_playwright() as pw:
 b=pw.chromium.launch(channel='msedge',headless=True);page=b.new_page(viewport={'width':1440,'height':1000});page.goto((O/'RELATORIO.html').as_uri());assert page.title()=='Produção — publicação interrompida no checkpoint';assert page.locator('table').count()==9
 page.screenshot(path=str(O/'relatorio-preview.png'));links=page.locator('a[href]').evaluate_all('(xs)=>xs.map(a=>a.getAttribute("href"))');assert all((O/link).exists() for link in links);b.close()
print(json.dumps({'report_utf8':True,'tables':9,'links':len(links),'missing_links':0}))

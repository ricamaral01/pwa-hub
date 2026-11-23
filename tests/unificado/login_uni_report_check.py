"""Render delivery artifacts and validate each relative evidence link."""
import json,re
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import unquote,urlsplit
from playwright.sync_api import sync_playwright
R=Path(__file__).resolve().parents[2];O=R/'docs/revisao-visual-unificado/homolog/login-uni-20261120'
class Links(HTMLParser):
 def __init__(self):super().__init__();self.links=[]
 def handle_starttag(self,tag,attrs):
  if tag in ['a','img']:self.links.extend(v for k,v in attrs if k in ['href','src'])
total=0
for name in ['RELATORIO.html','INVENTARIO_NOME.html']:
 text=(O/name).read_text(encoding='utf-8');assert not re.search(r'\ufffd|Arma\?+o|\u00c2\u00b7',text)
 parser=Links();parser.feed(text)
 for href in parser.links:
  if urlsplit(href).scheme or href.startswith('#'):continue
  target=O/unquote(href.split('#')[0]);assert target.exists(),(name,href);total+=1
with sync_playwright() as pw:
 b=pw.chromium.launch(channel='msedge',headless=True)
 for name in ['RELATORIO.html','INVENTARIO_NOME.html']:
  p=b.new_page(viewport={'width':1440,'height':1000});p.goto((O/name).as_uri());assert not p.evaluate('document.documentElement.scrollWidth>innerWidth+1');p.screenshot(path=str(O/(name.removesuffix('.html').lower()+'-preview.png')));p.close()
 b.close()
(O/'delivery-check.json').write_text(json.dumps({'links_checked':total,'broken_links':0,'reports_rendered':2,'utf8_valid':True,'horizontal_overflow':False,'ok':True},indent=2),encoding='utf-8');print(json.dumps({'links_checked':total,'ok':True}))

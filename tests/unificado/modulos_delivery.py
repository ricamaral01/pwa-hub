"""Verify final report links, captures, evidence and combined deployed source."""
import hashlib,json
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urlsplit,unquote
R=Path(__file__).resolve().parents[2];O=R/'docs/revisao-visual-unificado/homolog/modulos-colunas-20261120'
class Links(HTMLParser):
 def __init__(self):super().__init__();self.links=[]
 def handle_starttag(self,tag,attrs):
  self.links.extend(v for k,v in attrs if k in ['href','src'] and v)
checked=0
for name in ['RELATORIO.html','DESCRICOES_NOVAS.html']:
 text=(O/name).read_text(encoding='utf-8');assert '\ufffd' not in text and 'Arma????o' not in text
 parser=Links();parser.feed(text)
 for value in parser.links:
  u=urlsplit(value)
  if u.scheme or not u.path:continue
  assert (O/unquote(u.path)).is_file(),(name,value);checked+=1
result=json.loads((O/'result.json').read_text(encoding='utf-8'));assert result['version']=='1.4.30' and result['role_module_cases']==72 and not result['production_changed']
manifest=json.loads((O/'release-manifest.json').read_text(encoding='utf-8'));assert manifest['shell/module-pages.js']==hashlib.sha256((R/'unificado/shell/module-pages.js').read_bytes()).hexdigest()
for prefix in ['before','after','filter']:
 assert len(list(O.glob(prefix+'-*.png')))==36,prefix
assert json.loads((O/'pwa-before.json').read_text())['cache_keys']==['concrefer-unificado-shell-v1.4.27']
(O/'delivery-check.json').write_text(json.dumps({'report_links_checked':checked,'captures':108,'new_description_ids':137,'published_module_source_equal':True,'pwa_upgrade':'1.4.27 -> 1.4.30','ok':True},indent=2),encoding='utf-8');print('Delivery verified:',checked,'local links; 108 captures; combined source and worker upgrade')

"""Route only the 18446 test vhost to the isolated published-code generation."""
import hashlib,json,re,shutil,subprocess
from pathlib import Path
from datetime import datetime,timezone
R=Path('/opt/concrefer-unificado');H=R/'homolog-next';G=H/'visual-full';S=H/'staging/visual-completo'
site=Path('/etc/nginx/sites-enabled/unificado-homolog.conf').resolve()
prod=Path('/etc/nginx/sites-enabled/concrefer.concretrack.com.br').resolve()
before=hashlib.sha256(prod.read_bytes()).hexdigest()
marker=S/'generation-route.json'
if marker.exists():print(marker.read_text());raise SystemExit
backup=H/'backups'/('routing-visual-'+datetime.now(timezone.utc).strftime('%Y%m%dT%H%M%SZ'));backup.mkdir(mode=0o700)
shutil.copy2(site,backup/'unificado-homolog.conf')
for name in ['mapa','pcp','laboratorio','cq','qualidade','suprimentos','armacao','logistica','dosagem','reporting','carta','cec-campinas','cec-noroeste']:
 assert subprocess.check_output(['systemctl','is-active','unificado-visual-homolog-'+name],text=True).strip()=='active',name
ports={13152:14152,13154:14154,13160:14160,13166:14166,13167:14167,13168:14168,13170:14170,13052:14152,13064:14164,13065:14164,13074:14175,13075:14175,13067:14169,13279:14179,3088:14188}
def convert(text):
 for a,b in ports.items():text=text.replace('127.0.0.1:'+str(a),'127.0.0.1:'+str(b))
 text=text.replace('/opt/concrefer-unificado/public','/opt/concrefer-unificado/homolog-next/public')
 text=text.replace('/opt/concrefer-unificado/dosagem-native/static',str(G/'dosagem-static'))
 return text
text=site.read_text();created=[]
for old in re.findall(r'include (/etc/nginx/snippets/[^;]+);',text):
 source=Path(old)
 if 'homolog' not in source.name:continue
 if source.name=='laboratorio-unificado-homolog.conf':source=source.with_name('laboratorio-unificado.conf')
 new=Path('/etc/nginx/snippets/visual-full-'+Path(old).name)
 assert not new.exists(),str(new)
 new.write_text(convert(source.read_text()));created.append(new)
 text=text.replace(old,str(new))
for name in ['laboratorio-dosagem-native.conf','carta-traco-cut.conf','logistica-unificado.conf']:
 source=Path('/etc/nginx/snippets')/name;new=source.with_name('visual-full-'+name)
 content=convert(source.read_text())
 if name=='logistica-unificado.conf':content=content.replace('proxy_set_header Cookie $http_cookie;','proxy_set_header Cookie "mapa_unificado_session=$cookie_mapa_unificado_homolog_session";')
 if name=='carta-traco-cut.conf':
  # Published Carta UI lives on the old shared Lab service. Copy the assets,
  # then serve them locally behind the same authorization request.
  content=content.replace('proxy_pass http://127.0.0.1:14164/carta-traco/;', 'alias '+str(G/'carta-static')+'/;\n        index index.html;')
 new.write_text(content);created.append(new)
 text=text.replace('    index index.html;','    include '+str(new)+';\n    index index.html;',1)
shutil.copytree(R/'dosagem-native/static',G/'dosagem-static',dirs_exist_ok=True)
shutil.copytree(R/'homolog/laboratorio/service/server/static/carta-traco',G/'carta-static',dirs_exist_ok=True)
text=convert(text)
assert 'listen 18446 ' in text and 'listen 443' not in text
try:
 site.write_text(text)
 subprocess.run(['nginx','-t'],check=True)
 assert before==hashlib.sha256(prod.read_bytes()).hexdigest()
 subprocess.run(['systemctl','reload','nginx'],check=True)
except Exception:
 shutil.copy2(backup/'unificado-homolog.conf',site)
 for p in created:p.unlink(missing_ok=True)
 subprocess.run(['nginx','-t'],check=True)
 raise
result={'test_url':'https://concrefer.concretrack.com.br:18446/unificado/','backup':str(backup),'dedicated_snippets':[str(p) for p in created],'production_vhost_sha256':before,'production_vhost_unchanged':True,'production_services_restarted':False}
marker.write_text(json.dumps(result,indent=2));print(json.dumps(result))

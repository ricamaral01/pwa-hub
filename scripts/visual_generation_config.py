"""Wire only the new generation; match published feature flags and local keys."""
import json,re,secrets,shlex,subprocess
from pathlib import Path
from urllib.parse import urlsplit
E=Path('/etc/concrefer-unificado/homolog');G=Path('/opt/concrefer-unificado/homolog-next/visual-full');S=G.parent/'staging/visual-completo'
def read(name):
 out={}
 for l in (E/('visual-'+name+'.env')).read_text().splitlines():
  a=shlex.split(l)
  if len(a)==1 and '=' in a[0]:k,v=a[0].split('=',1);out[k]=v
 return out
names=['mapa','pcp','qualidade','laboratorio','cq','suprimentos','logistica','dosagem','armacao','reporting','carta'];conf={n:read(n) for n in names}
ports={13151:14151,13152:14152,13153:14153,13154:14154,13158:14158,13159:14159,13160:14160,13166:14166,13167:14167,13168:14168,13075:14175}
for values in conf.values():
 for k,v in values.items():
  for a,b in ports.items():v=v.replace('127.0.0.1:'+str(a),'127.0.0.1:'+str(b))
  values[k]=v
pid=int(subprocess.check_output(['systemctl','show','mapa-unificado-auth.service','-p','MainPID','--value'],text=True))
effective=dict(s.decode().split('=',1) for s in Path(f'/proc/{pid}/environ').read_bytes().split(b'\0') if b'=' in s)
flags={}
for k in ['USINAS_NOROESTE_ENABLED','USINAS_NOROESTE_ESTOQUE_WRITE_ENABLED']:
 v=effective.get(k,'0');assert v in ('0','1');conf['mapa'][k]=v;flags[k]=v
pairs=[('QUALIDADE_PCP_CATALOG_KEY','pcp','qualidade'),('LAB_TASK_SYNC_KEY','laboratorio','qualidade'),('SUPRIMENTOS_TASK_SYNC_KEY','suprimentos','qualidade'),('MAPA_USINA_INTEGRATION_KEY','mapa','reporting')]
for key,a,b in pairs:
 value=conf[a].get(key) or conf[b].get(key)
 if not value or len(value)<32:value=secrets.token_urlsafe(48)
 conf[a][key]=conf[b][key]=value
conf['qualidade']['LAB_TASK_SYNC_URL']='http://127.0.0.1:14164'
conf['qualidade']['SUPRIMENTOS_TASK_SYNC_URL']='http://127.0.0.1:14167'
for name,values in conf.items():
 for k,v in values.items():
  if ('DATABASE_URL' in k or k.endswith('_DSN')) and v:
   u=urlsplit(v.replace('postgresql+psycopg://','postgresql://'));assert u.hostname in ('localhost','127.0.0.1') and '_homolog' in u.path,(name,k)
 ef=E/('visual-'+name+'.env');ef.write_text(''.join(k+'='+shlex.quote(v)+'\n' for k,v in values.items()));ef.chmod(0o600)
# Reporting reads the Mapa mirror, while the native Carta data has its own DB.
p=G/'carta/reporting_service/carta_traco/deps.py';s=p.read_text();s=s.replace('.set(database="carta_traco_visual_homolog_20261118")','.set(database="mapa_visual_homolog_20261118")');p.write_text(s)
# No Supabase endpoint is used: the compatibility variable points to local REST.
p=G/'reporting/reporting_service/legacy_reports.py';s=p.read_text();s=re.sub(r'https://[a-z]+\.supabase\.co','http://127.0.0.1:14153',s);p.write_text(s)
# Independent realtime process on its own port, same published event protocol.
p=G/'mapa/realtime_bridge.py';s=p.read_text().replace('"127.0.0.1", 13060','"127.0.0.1", 14160');p.write_text(s)
unit=Path('/etc/systemd/system/unificado-visual-homolog-realtime.service')
unit.write_text('[Unit]\nDescription=Unificado visual homolog isolated realtime\nAfter=postgresql.service\n[Service]\nWorkingDirectory='+str(G/'mapa')+'\nEnvironmentFile='+str(E/'visual-mapa.env')+'\nExecStart='+str(G/'mapa/.venv/bin/python')+' realtime_bridge.py\nRestart=on-failure\nPrivateTmp=true\nProtectSystem=strict\nReadWritePaths='+str(G)+'\nIPAddressDeny=any\nIPAddressAllow=localhost\n')
subprocess.run(['systemctl','daemon-reload'],check=True)
for name in names:subprocess.run(['systemctl','restart','unificado-visual-homolog-'+name+'.service'],check=True)
subprocess.run(['systemctl','start','unificado-visual-homolog-realtime.service'],check=True)
result={'flags_match_published':flags,'internal_keys_paired':[p[0] for p in pairs],'ports':'141xx only','realtime_port':14160,'production_services_changed':False,'secret_values_logged':False}
(S/'generation-config.json').write_text(json.dumps(result,indent=2));print(json.dumps(result))

"""Repair copied infrastructure for exact test databases; no production DB connection."""
import json,subprocess,shlex,shutil,re,hashlib
from pathlib import Path
from urllib.parse import urlsplit
S=Path('/opt/concrefer-unificado/homolog-next/staging/visual-completo');E=Path('/etc/concrefer-unificado/homolog')
B=Path(json.loads((S/'backup-ready.json').read_text())['backup'])
def sql(db,body):
 assert db in ['postgres','pcp_visual_homolog_20261118','mapa_visual_homolog_20261118','qualidade_visual_homolog_20261118']
 r=subprocess.run(['sudo','-u','postgres','psql','-XAt','-v','ON_ERROR_STOP=1','-d',db],input=body,text=True,capture_output=True)
 if r.returncode:raise RuntimeError(r.stderr[-1500:])
 return r.stdout.strip()
def env(name):
 out={}
 for line in (E/('visual-'+name+'.env')).read_text().splitlines():
  a=shlex.split(line)
  if len(a)==1 and '=' in a[0]:k,v=a[0].split('=',1);out[k]=v
 return out
for db in ['pcp_visual_homolog_20261118','mapa_visual_homolog_20261118','qualidade_visual_homolog_20261118']:
 dump=B/(db+'-before-phase6-environment.dump')
 if not dump.exists():
  with dump.open('wb') as f:subprocess.run(['sudo','-u','postgres','pg_dump','-Fc','-d',db],stdout=f,check=True)
 dump.chmod(0o600);subprocess.run(['pg_restore','-l',str(dump)],check=True,stdout=subprocess.DEVNULL)
role=urlsplit(env('logistica')['LOGISTICA_DATABASE_URL'].replace('postgresql+psycopg://','postgresql://')).username
assert re.fullmatch('[a-z_][a-z_0-9]*',role)
sql('pcp_visual_homolog_20261118','BEGIN; GRANT USAGE ON SCHEMA logistica TO "'+role+'"; GRANT SELECT,INSERT,UPDATE,DELETE ON ALL TABLES IN SCHEMA logistica TO "'+role+'"; GRANT USAGE,SELECT ON ALL SEQUENCES IN SCHEMA logistica TO "'+role+'"; COMMIT;')
# Retain the existing exclusive app-role boundary; add only this new test DB.
hba=Path(sql('postgres','SHOW hba_file;'));old=hba.read_text();entry='host qualidade_visual_homolog_20261118 qualidade_homolog_app 127.0.0.1/32 scram-sha-256\n'
if entry not in old:
 shutil.copy2(hba,B/'pg_hba-before-phase6.conf')
 try:
  hba.write_text(entry+old)
  assert sql('postgres','SELECT count(*) FROM pg_hba_file_rules WHERE error IS NOT NULL;')=='0'
  assert sql('postgres','SELECT pg_reload_conf();')=='t'
 except Exception:
  hba.write_text(old);sql('postgres','SELECT pg_reload_conf();');raise
# Restore only empty maintenance tables from the existing verified offline dump.
db='mapa_visual_homolog_20261118';refs=json.loads((S/'schema-references.json').read_text());source=next(r['offline_source'] for r in refs if r['reference_database']=='mapa_ref_homolog_20261118')
if sql(db,'SELECT count(*) FROM usina_manutencao.configuracao;')=='0':
 body=subprocess.check_output(['pg_restore','--data-only','--no-owner','--no-acl','-n','usina_manutencao','-t','configuracao','-t','atividade','-t','historico','-f','-',source],text=True)
 body='\n'.join(l for l in body.splitlines() if not l.startswith(('\\restrict','\\unrestrict')))
 sql(db,'BEGIN;\n'+body+'\nCOMMIT;')
# The published prefix delegates production API authorization to FastAPI.
prod=Path('/etc/nginx/snippets/unificado-screen-access.conf').read_text()
match=re.search(r'    location \^~ /unificado/pcp/api/producao/ \{.*?\n    \}',prod,re.S);assert match
target=Path('/etc/nginx/snippets/visual-full-unificado-screen-access-homolog.conf');old=target.read_text()
if 'location ^~ /unificado/pcp/api/producao/' not in old:
 shutil.copy2(target,B/'screen-access-before-phase6.conf')
 target.write_text(old+'\n'+match[0].replace('127.0.0.1:13054','127.0.0.1:14154')+'\n')
 try:subprocess.run(['nginx','-t'],check=True,capture_output=True);subprocess.run(['systemctl','reload','nginx'],check=True)
 except Exception:target.write_text(old);raise
result={'databases_backed_up':3,'production_database_connections':0,'production_api_or_database_restarts':0,'hba_added_database_only':'qualidade_visual_homolog_20261118','logistica_role':role,'business_permissions_changed':False,'maintenance_source':'verified offline snapshot','nginx_changed':'test-only snippet; exact published production-API prefix'}
(S/'phase6-environment.json').write_text(json.dumps(result,indent=2));print(json.dumps(result))

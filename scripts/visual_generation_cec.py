"""Published CEC services on private ports with independent test databases."""
import json,os,re,shlex,shutil,subprocess
from pathlib import Path
from urllib.parse import urlsplit,urlunsplit
R=Path('/opt/concrefer-unificado');H=R/'homolog-next';G=H/'visual-full';S=H/'staging/visual-completo';E=Path('/etc/concrefer-unificado/homolog')
source_dump=R/'backups/before-1.2.0-20261109T224452Z/controle_est_concre_campinas.dump';assert source_dump.is_file()
raw=subprocess.check_output(['pg_restore','--schema-only','--no-owner','--no-acl','-f','-',str(source_dump)]).decode()
assert 'CREATE SERVER ' not in raw and 'CREATE USER MAPPING ' not in raw
def env(path):
 out={}
 for l in Path(path).read_text().splitlines():
  a=shlex.split(l)
  if len(a)==1 and '=' in a[0]:k,v=a[0].split('=',1);out[k]=v
 return out
writer=env(E/'visual-mapa.env')['MAPA_WRITER_DATABASE_URL'];u=urlsplit(writer)
assert u.hostname in ('localhost','127.0.0.1') and '_visual_homolog_' in u.path
role=u.username;assert re.fullmatch(r'[a-z_][a-z_0-9]*',role)
def sql(db,body):
 assert db in ('postgres','cec_campinas_visual_homolog_20261118','cec_noroeste_visual_homolog_20261118')
 r=subprocess.run(['sudo','-u','postgres','psql','-XAt','-v','ON_ERROR_STOP=1','-d',db],input=body,text=True,capture_output=True)
 if r.returncode:raise RuntimeError(r.stderr[-3000:])
 return r.stdout
results=[]
for name,unit,port,pid in [('cec-campinas','campinas',14186,1516595),('cec-noroeste','noroeste',14185,1516577)]:
 marker=S/(name+'-provisioned.json')
 if marker.exists():results.append(json.loads(marker.read_text()));continue
 db='cec_'+unit+'_visual_homolog_20261118';ready=S/(db+'-restored.json')
 if not ready.exists():
  assert not sql('postgres',"SELECT 1 FROM pg_database WHERE datname='"+db+"';").strip()
  subprocess.run(['sudo','-u','postgres','createdb',db],check=True)
  cmd=['sudo','-u','postgres','pg_restore','--single-transaction','--exit-on-error','--no-owner','--no-acl','-d',db]
  if unit=='noroeste':cmd.append('--schema-only')
  with source_dump.open('rb') as f:r=subprocess.run(cmd,stdin=f,capture_output=True)
  if r.returncode:raise RuntimeError(r.stderr.decode()[-3500:])
  sql(db,'GRANT USAGE,CREATE ON SCHEMA public TO "'+role+'"; GRANT ALL ON ALL TABLES IN SCHEMA public TO "'+role+'"; GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO "'+role+'";')
  ready.write_text(json.dumps({'database':db,'schema_source_offline_dump':str(source_dump),'campinas_readings_copied':unit=='campinas','production_database_connections':0}))
 src=R/name;dst=G/name;dst.mkdir(exist_ok=True)
 for folder in ['src','migrations']:
  if (src/folder).exists():shutil.copytree(src/folder,dst/folder,dirs_exist_ok=True,ignore=shutil.ignore_patterns('__pycache__','*.before-*'))
 for file in ['package.json','package-lock.json']:
  if (src/file).exists():shutil.copy2(src/file,dst/file)
 # Resolve only a dependency path, without loading the published application.
 effective=dict(x.decode().split('=',1) for x in Path(f'/proc/{pid}/environ').read_bytes().split(b'\0') if b'=' in x)
 nodeenv={**os.environ}
 if effective.get('NODE_PATH'):nodeenv['NODE_PATH']=effective['NODE_PATH']
 resolved=Path(subprocess.check_output(['node','-p',"require.resolve('express')"],cwd=src,env=nodeenv,text=True).strip())
 deps=next(p for p in resolved.parents if p.name=='node_modules')
 targetdeps=G/'cec-node-modules'
 if not targetdeps.exists():shutil.copytree(deps,targetdeps)
 (dst/'data').mkdir(exist_ok=True)
 conf={'DATABASE_URL':urlunsplit((u.scheme,u.netloc,'/'+db,u.query,u.fragment)),'HOST':'127.0.0.1','PORT':str(port),'NODE_PATH':str(targetdeps),'NODE_ENV':'production','ENVIRONMENT':'homolog','CEC_UNIT':unit,'CORS_ALLOWED_ORIGINS':'https://concrefer.concretrack.com.br:18446','GOOGLE_SHEETS_FALLBACK_ENABLED':'false','SHEET_RECONCILIATION_ENABLED':'false'}
 ef=E/('visual-'+name+'.env');ef.write_text(''.join(k+'='+shlex.quote(v)+'\n' for k,v in conf.items()));ef.chmod(0o600)
 svc='unificado-visual-homolog-'+name+'.service';uf=Path('/etc/systemd/system')/svc
 uf.write_text('[Unit]\nDescription=Unificado visual homolog CEC '+unit+'\nAfter=postgresql.service\n[Service]\nWorkingDirectory='+str(dst)+'\nEnvironmentFile='+str(ef)+'\nExecStart=/usr/bin/node src/server.js\nRestart=on-failure\nPrivateTmp=true\nProtectSystem=strict\nReadWritePaths='+str(G)+'\nIPAddressDeny=any\nIPAddressAllow=localhost\n')
 subprocess.run(['systemctl','daemon-reload'],check=True);subprocess.run(['systemctl','start',svc],check=True)
 info={'module':name,'service':svc,'port':port,'database':db,'source_code':str(src),'production_processes_modified':False,'synchronization_workers_started':False}
 marker.write_text(json.dumps(info,indent=2));results.append(info);print(json.dumps(info),flush=True)
(S/'generation-cec.json').write_text(json.dumps(results,indent=2))

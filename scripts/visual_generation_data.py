"""Load only new operational mirror/catalogue tables; never auth/user grants."""
import json,re,subprocess
from pathlib import Path
S=Path('/opt/concrefer-unificado/homolog-next/staging/visual-completo')
plans=json.loads((S/'schema-plan.json').read_text());refs=json.loads((S/'schema-references.json').read_text());results=[]
for p in plans:
 db=p['database'];key=db.split('_')[0];marker=S/(key+'-generation-data.json')
 if marker.exists():results.append(json.loads(marker.read_text()));continue
 assert db.endswith('_visual_homolog_20261118')
 selected=[t for t in p['new_tables'] if t.split('.')[0] in ('logistica','usinas','estoque','lab') or t=='public.alembic_version_logistica']
 source=next(r['offline_source'] for r in refs if r['reference_database']==p['reference'])
 toc=subprocess.check_output(['pg_restore','-l',source],text=True);lines=[];tables=[]
 for line in toc.splitlines():
  m=re.match(r'^\d+; \d+ \d+ TABLE DATA (\S+) (\S+) ',line)
  if m and m[1]+'.'+m[2] in selected:lines.append(line);tables.append(m[1]+'.'+m[2])
  m=re.match(r'^\d+; \d+ \d+ SEQUENCE SET (\S+) (\S+) ',line)
  if m and m[1]+'.'+m[2] in p['new_sequences']:lines.append(line)
 private=S/(key+'-data-toc.list');private.write_text('\n'.join(lines)+'\n');private.chmod(0o600)
 if tables:
  def q(sql):
   return subprocess.check_output(['sudo','-u','postgres','psql','-XAt','-d',db,'-c',sql],text=True)
  constraints=json.loads(q("SELECT COALESCE(json_agg(json_build_object('table',n.nspname||'.'||c.relname,'name',x.conname,'deferrable',x.condeferrable,'deferred',x.condeferred)),'[]') FROM pg_constraint x JOIN pg_class c ON c.oid=x.conrelid JOIN pg_namespace n ON n.oid=c.relnamespace WHERE x.contype='f'"))
  constraints=[x for x in constraints if x['table'] in tables]
  def quoted(v):return '.'.join('"'+p.replace('"','""')+'"' for p in v.split('.'))
  defer=['ALTER TABLE '+quoted(c['table'])+' ALTER CONSTRAINT '+quoted(c['name'])+' DEFERRABLE INITIALLY DEFERRED;' for c in constraints]
  restore=['ALTER TABLE '+quoted(c['table'])+' ALTER CONSTRAINT '+quoted(c['name'])+(' DEFERRABLE INITIALLY DEFERRED;' if c['deferred'] else ' DEFERRABLE INITIALLY IMMEDIATE;' if c['deferrable'] else ' NOT DEFERRABLE INITIALLY IMMEDIATE;') for c in constraints]
  body=subprocess.check_output(['pg_restore','--data-only','--no-owner','--no-acl','-L',str(private),'-f','-',source]).decode()
  # psql meta-lines from pg_dump are not needed inside the guarded transaction.
  body='\n'.join(l for l in body.splitlines() if not l.startswith(('\\restrict','\\unrestrict')))
  r=subprocess.run(['sudo','-u','postgres','psql','-X','-v','ON_ERROR_STOP=1','-d',db],input='BEGIN;\n'+'\n'.join(defer)+'\n'+body+'\nSET CONSTRAINTS ALL IMMEDIATE;\n'+'\n'.join(restore)+'\nCOMMIT;',text=True,capture_output=True)
  if r.returncode:raise RuntimeError(r.stderr[-2500:])
 info={'database':db,'imported_new_operational_tables':tables,'business_auth_tables_imported':False,'source':'existing offline backup','original_databases_modified':False}
 marker.write_text(json.dumps(info,indent=2));results.append(info);print(json.dumps(info),flush=True)
(S/'generation-data.json').write_text(json.dumps(results,indent=2))

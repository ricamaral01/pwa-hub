"""Back up two homolog databases, align only Armação enabled and CQ FCK."""
import hashlib,json,os,subprocess,sys
from datetime import datetime,timezone
from pathlib import Path
H=Path('/opt/concrefer-unificado/homolog-next');S=H/'staging/producao-fase0-20261120';os.umask(0o077)
DBS={'pcp':'pcp_visual_homolog_20261118','cq':'laboratorio_visual_homolog_20261118'}
def execute(db,query,read_only=True):
 assert db in DBS.values() or read_only
 sql=('BEGIN READ ONLY;' if read_only else 'BEGIN;')+"SET LOCAL statement_timeout='30s';"+query+';'+('ROLLBACK;' if read_only else 'COMMIT;')
 p=subprocess.run(['sudo','-u','postgres','psql','-d',db,'-X','-qAt','-v','ON_ERROR_STOP=1'],input=sql,text=True,capture_output=True);assert p.returncode==0,p.stderr;return p.stdout.strip()
arm="SELECT json_agg(t) FROM (SELECT * FROM armacao.configuracao_unidade ORDER BY unidade_id)t"
cq="SELECT json_build_object('row',(SELECT row_to_json(t) FROM (SELECT * FROM public.cq_parametros WHERE id=1)t),'default',(SELECT column_default FROM information_schema.columns WHERE table_schema='public' AND table_name='cq_parametros' AND column_name='fck_mpa'))"
prod={'armacao':json.loads(execute('pcp_unificado_teste',arm)),'cq':json.loads(execute('concretrack_postes',cq))}
assert len(prod['armacao'])==4 and all(r['enabled'] for r in prod['armacao']);assert prod['cq']['row']['fck_mpa']==25 and prod['cq']['default']=='25'
before={'armacao':json.loads(execute(DBS['pcp'],arm)),'cq':json.loads(execute(DBS['cq'],cq))};assert len(before['armacao'])==4 and {r['unidade_id'] for r in before['armacao']}=={1,2,3,4};assert before['cq']['row']['id']==1
B=Path(sys.argv[1]) if len(sys.argv)>1 else H/'backups'/('producao-retomada-config-'+datetime.now(timezone.utc).strftime('%Y%m%dT%H%M%SZ'));assert B.parent==H/'backups' and B.name.startswith('producao-retomada-config-')
if B.exists():assert json.loads((B/'before.json').read_text())==before,'Homolog changed since partial backup'
else:B.mkdir(mode=0o700);(B/'before.json').write_text(json.dumps(before,indent=2))
meta={'directory':str(B),'databases':{},'before':before,'production_reference':prod,'production_changes':0,'no_services_restarted':True}
for db in DBS.values():
 out=B/(db+'.dump')
 if not out.exists():
  with out.open('wb') as f:subprocess.run(['sudo','-u','postgres','pg_dump','-Fc','-d',db],check=True,stdout=f,stderr=subprocess.PIPE)
 out.chmod(0o600)
 for option in [['--list'],['--file=/dev/null']]:
  with out.open('rb') as f:subprocess.run(['sudo','-u','postgres','pg_restore',*option],stdin=f,check=True,stdout=subprocess.DEVNULL,stderr=subprocess.PIPE)
 meta['databases'][db]={'bytes':out.stat().st_size,'sha256':hashlib.sha256(out.read_bytes()).hexdigest(),'list_verified':True,'full_decode_verified':True};print(json.dumps({'homolog_dump_verified':db,'bytes':out.stat().st_size}),flush=True)
def literal(v):return 'NULL' if v is None else "'"+str(v).replace("'","''")+"'"
arm_undo='BEGIN;\nDO $$ BEGIN IF current_database()<>\''+DBS['pcp']+'\' THEN RAISE EXCEPTION \'wrong database\'; END IF; END $$;\n'
for row in before['armacao']:arm_undo+='UPDATE armacao.configuracao_unidade SET enabled='+('true' if row['enabled'] else 'false')+',atualizado_em='+literal(row['atualizado_em'])+'::timestamptz WHERE unidade_id='+str(row['unidade_id'])+';\n'
arm_undo+='COMMIT;\n';(B/'rollback-armacao.sql').write_text(arm_undo)
old=before['cq'];cq_undo='BEGIN;\nDO $$ BEGIN IF current_database()<>\''+DBS['cq']+'\' THEN RAISE EXCEPTION \'wrong database\'; END IF; END $$;\nALTER TABLE public.cq_parametros ALTER COLUMN fck_mpa SET DEFAULT '+old['default']+';\nUPDATE public.cq_parametros SET fck_mpa='+str(old['row']['fck_mpa'])+',updated_at='+literal(old['row']['updated_at'])+'::timestamptz WHERE id=1;\nCOMMIT;\n';(B/'rollback-cq.sql').write_text(cq_undo)
# SQL row exports are data only; they are not applied by this script.
for filename,rows,table in [('rows-armacao-before.sql',before['armacao'],'armacao.configuracao_unidade'),('rows-cq-before.sql',[before['cq']['row']],'public.cq_parametros')]:
 lines=[]
 for row in rows:
  cols=','.join('"'+k+'"' for k in row);values=','.join('true' if v is True else 'false' if v is False else literal(v) for v in row.values());lines.append('INSERT INTO '+table+' ('+cols+') VALUES ('+values+');')
 (B/filename).write_text('\n'.join(lines)+'\n')
execute(DBS['pcp'],"DO $$ BEGIN IF current_database()<>'"+DBS['pcp']+"' THEN RAISE EXCEPTION 'wrong database'; END IF; END $$;UPDATE armacao.configuracao_unidade SET enabled=true,atualizado_em=now() WHERE unidade_id IN (1,2,3,4)",False)
execute(DBS['cq'],"DO $$ BEGIN IF current_database()<>'"+DBS['cq']+"' THEN RAISE EXCEPTION 'wrong database'; END IF; END $$;ALTER TABLE public.cq_parametros ALTER COLUMN fck_mpa SET DEFAULT 25;UPDATE public.cq_parametros SET fck_mpa=25,updated_at=now() WHERE id=1",False)
after={'armacao':json.loads(execute(DBS['pcp'],arm)),'cq':json.loads(execute(DBS['cq'],cq))};assert all(r['enabled'] for r in after['armacao']);assert after['cq']['row']['fck_mpa']==25 and after['cq']['default']=='25'
meta.update(after=after,homolog_changes={'armacao_rows':4,'cq_parameter_rows':1,'cq_default':25},leave_homolog_aligned=True,ok=True);(B/'receipt.json').write_text(json.dumps(meta,indent=2));(S/'resume-homolog-config.json').write_text(json.dumps(meta,indent=2));print(json.dumps({'homolog_configuration_aligned':True,'backup':str(B),'production_changes':0}),flush=True)

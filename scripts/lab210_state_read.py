"""VPS read-only reference for existing Campinas/Noroeste data and templates."""
import hashlib,json,re,subprocess,sys,time
from pathlib import Path
H=Path('/opt/concrefer-unificado/homolog-next')
def sql(db,query):
 p=subprocess.run(['sudo','-u','postgres','env','PGAPPNAME=lab210_existing_units_readonly','psql','-X','-qAt','-v','ON_ERROR_STOP=1','-d',db],input="BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY;SET LOCAL statement_timeout='15s';"+query+';ROLLBACK;',text=True,capture_output=True)
 if p.returncode:raise RuntimeError(db+': '+p.stderr[-1500:])
 return [json.loads(line) for line in p.stdout.splitlines() if line]
out={'captured_at_epoch':time.time(),'databases':{},'files':{}}
for db in ['cec_campinas_visual_homolog_20261118','cec_noroeste_visual_homolog_20261118']:
 tables=sql(db,"SELECT coalesce(json_agg(relname ORDER BY relname),'[]') FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='public' AND c.relkind IN ('r','m') AND relname IN ('rompimentos','rompimentos_atuais','rompimentos_grupos','tbl_massadas','cec_massadas_snapshot','faixas_resistencia')")[0]
 queries=[]
 for table in tables:
  assert re.fullmatch('[a-z_0-9]+',table)
  # Row versions detect inserts/updates/deletes without serializing large
  # historical JSON payloads. No application write is allowed in these tables.
  queries.append("SELECT json_build_object('table','"+table+"','count',count(*),'digest_kind','xmin+ctid','digest',md5(coalesce(string_agg(xmin::text||':'||ctid::text,',' ORDER BY ctid),''))) FROM public."+table)
 out['databases'][db]=sql(db,';'.join(queries))
 out['databases'][db+'_history_write_counters']=sql(db,"SELECT row_to_json(t) FROM(SELECT relname,n_tup_ins,n_tup_upd,n_tup_del FROM pg_stat_user_tables WHERE schemaname='public' AND relname IN ('rompimentos_eventos','fila_recalculo') ORDER BY relname)t")
 out['databases'][db+'_latest_batch']=sql(db,"SELECT row_to_json(t) FROM(SELECT id,produto,formula,data,hora,numero_serie FROM public.tbl_massadas ORDER BY id DESC LIMIT 1)t")
out['old_moldings']=sql('laboratorio_visual_homolog_20261118',"SELECT json_build_object('count',count(*),'digest',md5(coalesce(string_agg(row_to_json(t)::text,'' ORDER BY id),''))) FROM public.laboratorio_cp_moldagem t WHERE unidade_codigo NOT IN ('pederneiras','ribeirao')")[0]
for folder in ['cec','noroeste']:
 root=H/'visual-full/laboratorio/server/static'/folder
 for p in root.rglob('*'):
  if p.is_file():out['files'][str(p)]=hashlib.sha256(p.read_bytes()).hexdigest()
for name in ['cec_api.py','postes_api.py']:
 p=H/'visual-full/laboratorio/server'/name;out['files'][str(p)]=hashlib.sha256(p.read_bytes()).hexdigest()
print(json.dumps(out))

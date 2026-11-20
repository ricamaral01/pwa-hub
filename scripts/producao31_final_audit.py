"""Reconcile published bytes, schemas, permissions, services and critical settings."""
import json
from collections import Counter
from pathlib import PurePosixPath
from producao31_common import R,P,O,remote,save
src=(R/'scripts/producao_inventory_readonly.py').read_text(encoding='utf-8');now=remote(src);old=json.loads((P/'inventory.json').read_bytes());plan=json.loads((O/'deployment-plan.json').read_bytes());save('production-after-inventory.json',now);assert now['version']=='1.4.31'
different=[]
for root,files in old['files'].items():
 expected=dict(files)
 for row in plan['static_files']:
  if PurePosixPath(row['destination']).is_relative_to(PurePosixPath(root)):expected[row['destination']]=row['after']
 current=now['files'][root]
 for path in set(expected)|set(current):
  if expected.get(path)!=current.get(path):different.append(path)
assert not different,('Files outside frozen release',different)
configs=lambda x:{s['unit']:s['config_files'] for s in x['services']};assert old['nginx']==now['nginx'] and configs(old)==configs(now)
runtime=lambda x:{s['unit']:dict(line.split('=',1) for line in s['runtime'].splitlines() if '=' in line) for s in x['services']};before_runtime=runtime(old);after_runtime=runtime(now)
restarted=[unit for unit,props in before_runtime.items() if props.get('ActiveState')=='active' and after_runtime[unit].get('MainPID')!=props.get('MainPID')];assert not restarted,('Services restarted since inventory',restarted)
schema_checks=[];access_checks=[]
def stable(rows):
 return sorted([json.dumps({k:v for k,v in row.items() if k not in ['updated_at','last_login_at','last_login_ip']},sort_keys=True) for row in rows])
for db,data in old['databases'].items():
 for key in ['tables','columns','constraints','indexes']:
  assert data[key]==now['databases'][db][key],('Database schema changed',db,key)
 schema_checks.append(db)
 for table,rows in data.get('selected_rows',{}).items():
  assert stable(rows)==stable(now['databases'][db]['selected_rows'][table]),('Access or migration data changed',db,table)
  access_checks.append(db+':'+table)
prefix=src[:src.index("result={'version'")];critical=remote(prefix+'''\narm="SELECT json_agg(t) FROM (SELECT * FROM armacao.configuracao_unidade ORDER BY unidade_id)t"
cq="SELECT json_build_object('row',(SELECT row_to_json(t) FROM (SELECT * FROM public.cq_parametros WHERE id=1)t),'default',(SELECT column_default FROM information_schema.columns WHERE table_schema='public' AND table_name='cq_parametros' AND column_name='fck_mpa'))"
print(json.dumps({'armacao':sql('pcp_unificado_teste',arm),'cq':sql('concretrack_postes',cq),'homolog_armacao':sql('pcp_visual_homolog_20261118',arm),'homolog_cq':sql('laboratorio_visual_homolog_20261118',cq)}))''');ref=json.loads((O/'preflight-critical-rows.json').read_bytes());assert critical==ref;save('after-critical-rows.json',critical)
def groups(inventory):
 c=Counter((s['datname'],s['usename'],s['application_name'],s['state'],s.get('client_cgroup') or s['backend_type']) for s in inventory['cluster']['sessions']);return [dict(zip(['database','user','application_name','state','service_or_backend'],key),connections=n) for key,n in sorted(c.items(),key=lambda r:str(r[0]))]
pre=json.loads((O/'production-preflight-inventory.json').read_bytes());connections={'before':{'common_headroom':pre['cluster']['common_headroom'],'sessions':len(pre['cluster']['sessions']),'groups':groups(pre)},'after':{'common_headroom':now['cluster']['common_headroom'],'sessions':len(now['cluster']['sessions']),'groups':groups(now)}};save('connections-before-after.json',connections);assert now['cluster']['common_headroom']>=15
result={'version':'1.4.31','static_files':len(plan['static_files']),'all_manifest_hashes_match':True,'other_application_files_unchanged':True,'systemd_nginx_and_pool_configs_unchanged':True,'services_restarted':restarted,'schemas_unchanged':schema_checks,'access_and_migration_tables_unchanged':access_checks,'armacao_four_units_enabled_unchanged':True,'cq_value_and_default_25_unchanged':True,'homolog_preserved_31_enabled_fck25':True,'database_migrations':0,'grants':0,'network_changes':0,'connections':connections['after']['sessions'],'common_headroom':now['cluster']['common_headroom'],'ok':True};save('final-audit.json',result);print(json.dumps(result))

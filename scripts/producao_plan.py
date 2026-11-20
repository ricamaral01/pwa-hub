"""Derive the deployment delta without changing the frozen candidate."""
import hashlib,json,collections,re
from pathlib import Path
R=Path(__file__).resolve().parents[1];O=R/'docs/revisao-visual-unificado/producao-20261120';B=R/'.codex-tmp/producao-20261120'
x=json.loads((O/'inventory.json').read_bytes());m=json.loads((O/'candidate-manifest.json').read_bytes());all_files={p:v for root in x['files'].values() for p,v in root.items()}
def target(key):
 if key.startswith('public/'):return '/opt/concrefer-unificado/public/unificado/'+key[7:]
 if key.startswith('services/laboratorio/'):return '/opt/concrefer-unificado/laboratorio/service/'+key[len('services/laboratorio/'):]
 if key.startswith('services/dosagem-static/'):return '/opt/concrefer-unificado/dosagem-native/static/'+key[len('services/dosagem-static/'):]
 if key.startswith('services/carta-static/'):return '/opt/concrefer-unificado/homolog/laboratorio/service/server/static/carta-traco/'+key[len('services/carta-static/'):]
 raise ValueError(key)
delta=[]
for key,meta in m.items():
 if not key.startswith(('public/','services/')):continue
 dst=target(key);before=all_files.get(dst);delta.append({'file':key,'destination':dst,'before':before,'after':meta,'action':'add' if before is None else 'replace' if before['sha256']!=meta['sha256'] else 'unchanged'})
assert len(delta)==348
audit=json.loads((O/'migration-audit.json').read_bytes());assert all(r['status']=='presente' for r in audit)
assert all(not a['changed'] for a in x['master_policy'].values())
ged=x['databases']['ged_postgres']['selected_rows'];link=next(u for u in ged['public.ged_identity_links'] if u['mapa_user_id']=='alex');native=next(u for u in ged['public.users'] if u['id']==link['ged_user_id']);assert link['active'] and native['active'] and native['role']=='ADMIN_MASTER'
sup=[u for u in x['databases']['suprimentos_prod']['selected_rows']['suprimentos.sup_usuario_papel'] if u['iam_user_id']=='alex'];assert any(u['papel']=='ADMIN' and u['ativo'] for u in sup)
plan={'version_before':x['version'],'version_after':'1.4.30','candidate_tag':'candidata-producao-1.4.30','static_files':delta,'counts':dict(collections.Counter(r['action'] for r in delta)),'backend_patches':[],'migrations_to_apply':[],'permissions_to_change':[],'services_to_restart':[],'nginx_changes':[],'alex':{'central_and_logistica':x['master_policy'],'ged_link':link,'ged_user':native,'suprimentos_roles':sup,'decision':'Already has the maximum native roles; preserve existing real IDs and grants. No test identity changes.'},'preserve':{'stock_technical_bridge':'excluded; current production backend and cookie flow unchanged','armacao':'four units remain disabled','production_pools':'no changes','network':'no drop-ins or eBPF copied','aviso':'ativo:false'},'cluster':{'common_headroom':x['cluster']['common_headroom'],'client_backends':x['cluster']['client_backends'],'max_connections':x['cluster']['max_connections']},'checkpoint_schema':True,'backup_databases':['mapa_unificado_teste','pcp_unificado_teste','concretrack_postes','suprimentos_prod','qualidade','ged_postgres'],'database_backup_note':'No database changes are needed. Full backups retained for additional recovery coverage.'}
(O/'deployment-plan.json').write_text(json.dumps(plan,ensure_ascii=False,indent=2),encoding='utf-8')
status=json.loads((O/'STATUS.json').read_bytes());status.update(phase='2: complete backups and rollback rehearsal',completed_phases=[0,1],next='Verified full backups, staging rollback rehearsal, then checkpoint and deployment without additional approval if all checks pass.');(O/'STATUS.json').write_text(json.dumps(status,indent=2),encoding='utf-8')
print(json.dumps({'counts':plan['counts'],'backend_changes':0,'migrations_required':0,'grant_changes':0,'restart_services':0,'alex_ged_role':native['role'],'headroom':plan['cluster']['common_headroom']}))

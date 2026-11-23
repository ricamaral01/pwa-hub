"""Read-only final release audit; no credentials or client rows leave the VPS."""
import json
from lab210_production_common import remote,save,activity,S

def main():
    code=r'''
import runpy,json,subprocess
from pathlib import Path
n=runpy.run_path(%SCRIPT%)
r=n['receipt']();sql=n['sql'];digest=n['digest']
assert r['phase']=='published'
files=[{'path':x['path'],'matches':digest(x['path'])==x['sha256']} for x in r['manifest']]
assert len(files)==44 and all(x['matches'] for x in files)
grants=n['grant_snapshot'](n['IAM']);assert len(grants)==70 and all(x['allowed'] for x in grants)
data=sql(n['DB'],"SELECT json_build_object('pederneiras_massadas',(SELECT count(*) FROM lab_cec_pederneiras.massadas),'ribeirao_massadas',(SELECT count(*) FROM lab_cec_ribeirao.massadas),'excluded',(SELECT count(*) FROM lab_cec_pederneiras.massadas WHERE id IN(70195,70990,70991,70992,70993,70994,70995,70996)),'pederneiras_readings',(SELECT count(*) FROM lab_cec_pederneiras.rompimentos),'ribeirao_readings',(SELECT count(*) FROM lab_cec_ribeirao.rompimentos))",True)[0]
assert data['pederneiras_massadas']==1613 and data['ribeirao_massadas']==829 and data['excluded']==0
services={u:subprocess.run(['systemctl','is-active',u],capture_output=True,text=True).stdout.strip() for u in ['unificado-homolog-mapa-realtime.service','unificado-homolog-mapa.service','unificado-homolog-pcp.service','unificado-homolog-armacao.service','unificado-homolog-qualidade.service','suprimentos-homolog.service','laboratorio-unificado.service','mapa-unificado-auth.service']}
assert all(services[u]=='inactive' for u in list(services)[:5])
assert all(services[u]=='active' for u in list(services)[5:])
timers={f'unificado-homolog-tarefas-{s}.timer':subprocess.run(['systemctl','is-active',f'unificado-homolog-tarefas-{s}.timer'],capture_output=True,text=True).stdout.strip() for s in ['ged','notify','outbox','suprimentos']}
assert all(x=='inactive' for x in timers.values())
containers={c:json.loads(subprocess.check_output(['docker','inspect','--format','{{json .State.Running}}',c],text=True)) for c in ['mapa-homolog-postgrest-reader','mapa-homolog-postgrest-writer']}
assert not any(containers.values())
settings=sql(n['DB'],"SELECT json_build_object('max_connections',current_setting('max_connections')::int,'superuser_reserved_connections',current_setting('superuser_reserved_connections')::int)",True)[0]
assert settings=={'max_connections':100,'superuser_reserved_connections':3}
print(json.dumps({'passed':True,'version':(n['P']/'VERSION').read_text().strip(),'homolog_version':(n['H']/'public/unificado/VERSION').read_text().strip(),'source_commit':r.get('source_commit'),'approved_base_commit':'53f77c6cd4026418ca33a09cb81dc0d6f4312e13','files':files,'grants':grants,'data':data,'services':services,'timers':timers,'containers_running':containers,'settings':settings,'rollback':r['rollback_command'],'rollback_check':n['rollback_check'](),'imports':r['imports'],'mutations':0}))
'''.replace('%SCRIPT%',repr(S+'/lab210_production_release.py'))
    result=remote(code);result['capacity']=activity()
    assert result['capacity']['common_headroom_excluding_collector']>=25
    save('final-audit.json',result)
    print(json.dumps({k:result[k] for k in ['passed','version','source_commit','capacity','data','rollback']},ensure_ascii=False))

if __name__=='__main__':main()

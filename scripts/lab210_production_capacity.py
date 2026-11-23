"""VPS: back up and stop only the explicitly listed inactive old services.

Suprimentos has an active scheduled caller and is deliberately preserved.
No disable, container removal, database/global/role changes or SQL termination.
"""
from datetime import datetime,timezone
import hashlib,json,re,shutil,subprocess,sys
from pathlib import Path
S=Path('/opt/concrefer-unificado/staging/lab210-production-20261122')
OLD=['unificado-homolog-mapa-realtime.service','unificado-homolog-mapa.service',
     'unificado-homolog-pcp.service','unificado-homolog-armacao.service',
     'unificado-homolog-qualidade.service','suprimentos-homolog.service',
     'docker:mapa-homolog-postgrest-reader','docker:mapa-homolog-postgrest-writer']
PORTS={13152,13154,13151,13153,13166,13165,13167}
def run(args):return subprocess.check_output(args,text=True)
def snapshot():
    p=Path('/opt/concrefer-unificado/homolog-next/staging/conexoes-banco-20261120/collector.py');n={'__file__':str(p)};exec(p.read_text().split('started=time.time();')[0],n);s=n['snapshot'](n['docker_map']())
    return {k:s[k] for k in ['total_activity','client_connections','common_headroom_excluding_collector','by_service']}
def record(r):(S/'capacity.json').write_text(json.dumps(r,indent=2))
def audit():
    assert Path('/opt/concrefer-unificado/public/unificado/VERSION').read_text().strip()=='2.0.0'
    code="import runpy;runpy.run_path('/opt/concrefer-unificado/homolog-next/staging/conexoes-banco-20261120/finish-reads.py')"
    integrity=json.loads(run(['python3','-c',code]));assert integrity['production_unchanged']['passed']
    backup=Path('/opt/concrefer-unificado/backups')/('lab210-old-services-'+datetime.now(timezone.utc).strftime('%Y%m%dT%H%M%SZ'));backup.mkdir(mode=0o700)
    r={'backup':str(backup),'before':snapshot(),'production_integrity_before':integrity['production_unchanged'],'services':[],'stopped':[]}
    sockets=run(['ss','-ntp']);active_sockets=[line for line in sockets.splitlines() if any(re.search(r':'+str(p)+r'\s',line) for p in PORTS)]
    for unit in OLD:
        item={'service':unit,'before_connections':r['before']['by_service'].get(unit,0)}
        if unit.startswith('docker:'):
            name=unit.split(':',1)[1];raw=run(['docker','inspect',name]);(backup/(name+'.inspect.json')).write_text(raw)
            state=json.loads(raw)[0]['State'];item['before_state']={k:state.get(k) for k in ['Running','Status','Pid','StartedAt']}
            logs=subprocess.run(['docker','logs','--since','30m',name],text=True,capture_output=True);item['recent_log_lines']=len((logs.stdout+logs.stderr).splitlines());item['busy']=bool(item['recent_log_lines'] or active_sockets)
        else:
            keys=['ActiveState','SubState','MainPID','FragmentPath','DropInPaths','EnvironmentFiles','RequiredBy','RequisiteOf','BoundBy','ConsistsOf','PropagatesStopTo']
            state=dict(x.split('=',1) for x in run(['systemctl','show',unit,*sum([['-p',k] for k in keys],[])]).splitlines());item['before_state']=state
            assert not any(state.get(k) for k in ['RequiredBy','RequisiteOf','BoundBy','ConsistsOf','PropagatesStopTo']),unit
            paths=[state['FragmentPath'],*state.get('DropInPaths','').split()]
            paths += re.findall(r'(/[^ ]+) \(ignore_errors=',state.get('EnvironmentFiles',''))
            for path in paths:
                src=Path(path)
                if src.is_file():dst=backup/'files'/path.lstrip('/');dst.parent.mkdir(parents=True,exist_ok=True);shutil.copy2(src,dst)
            logs=run(['journalctl','-u',unit,'--since','30 minutes ago','--no-pager','-o','cat']);(backup/(unit+'.journal.txt')).write_text(logs)
            item['recent_log_lines']=len(logs.splitlines());item['busy']=bool(logs.strip() or active_sockets)
        item['busy']=item['busy'] or unit=='suprimentos-homolog.service'
        if item['busy']:item['skip_reason']='Recent activity, an established old-stack socket, or active scheduled Suprimentos caller; user required preservation.'
        r['services'].append(item)
    for p in backup.rglob('*'):
        if p.is_file():p.chmod(0o600)
    r['old_stack_established_sockets']=active_sockets;r['phase']='audited';record(r)
    return r
def stop():
    r=json.loads((S/'capacity.json').read_text());assert r['phase']=='audited'
    for item in r['services']:
        unit=item['service'];assert unit in OLD
        if item['busy']:continue
        before=snapshot()
        if unit.startswith('docker:'):
            name=unit.split(':',1)[1];run(['docker','stop',name]);assert not json.loads(run(['docker','inspect',name,'--format','{{json .State.Running}}']))
        else:
            run(['systemctl','stop',unit]);state=run(['systemctl','show',unit,'-p','ActiveState','--value']).strip();assert state=='inactive',(unit,state)
        after=snapshot();item.update(stopped=True,before_stop=before,after_stop=after);r['stopped'].append(unit);record(r)
    r['phase']='stopped_eligible';r['after']=snapshot();record(r);return r
if __name__=='__main__':
    action=sys.argv[1];assert action in ['audit','stop'];print(json.dumps(globals()[action]()))

"""Stop only the four old timers explicitly named in the approved HTML proposal.

Wait for oneshots to finish naturally. Production timers and H18446 services are
not candidates. No disable, kill, SQL termination, or database-wide settings.
"""
from datetime import datetime,timezone
import hashlib,json,shlex,shutil,subprocess,time
from pathlib import Path
from urllib.parse import urlsplit
S=Path('/opt/concrefer-unificado/staging/lab210-production-20261122')
NAMES=['ged','notify','outbox','suprimentos']
def run(args):return subprocess.check_output(args,text=True)
def environment(path):
    values={}
    for line in Path(path).read_text().splitlines():
        parts=shlex.split(line)
        if len(parts)==1 and '=' in parts[0]:k,v=parts[0].split('=',1);values[k]=v
    return values
def main():
    r=json.loads((S/'capacity.json').read_text());b=Path(r['backup']);rows=[]
    # This protected source is the old stack, not visual-full/qualidade.
    old_env=environment('/etc/concrefer-unificado/homolog/qualidade.env')
    database=urlsplit(old_env['QUALIDADE_DATABASE_URL']).path.lstrip('/')
    assert database=='qualidade_homolog_20261016',database
    visual_env=environment('/etc/concrefer-unificado/homolog/visual-qualidade.env')
    assert urlsplit(visual_env['QUALIDADE_DATABASE_URL']).path=='/qualidade_visual_homolog_20261118'
    for name in NAMES:
        timer='unificado-homolog-tarefas-'+name+'.timer';service=timer.replace('.timer','.service')
        raw=run(['systemctl','show',timer,'-p','ActiveState','-p','Unit','-p','FragmentPath','-p','LastTriggerUSec','-p','NextElapseUSecRealtime'])
        state=dict(x.split('=',1) for x in raw.splitlines());assert state['Unit']==service
        paths=[Path(state['FragmentPath']),Path('/etc/systemd/system')/service,Path('/etc/concrefer-unificado/homolog/qualidade.env')]
        for p in paths:
            assert p.is_file();dest=b/'timers'/str(p).lstrip('/');dest.parent.mkdir(parents=True,exist_ok=True)
            if dest.exists():assert p.read_bytes()==dest.read_bytes()
            else:shutil.copy2(p,dest)
            dest.chmod(0o600)
        rows.append({'timer':timer,'service':service,'before':state,'target_database':database,'backup':str(b/'timers'),'authorized_by':'SERVICOS_ANTIGOS_PROPOSTA.html: Parar primeiro os timers unificado-homolog-tarefas-* (ged, notify, outbox, suprimentos), aguardando as execuções em curso concluírem naturalmente.'})
    for item in rows:
        run(['systemctl','stop',item['timer']]);assert run(['systemctl','show',item['timer'],'-p','ActiveState','--value']).strip()=='inactive'
        item['timer_stopped_at_utc']=datetime.now(timezone.utc).isoformat()
    deadline=time.monotonic()+45
    while True:
        active=[x['service'] for x in rows if run(['systemctl','show',x['service'],'-p','ActiveState','--value']).strip() in ['active','activating','deactivating']]
        if not active:break
        if time.monotonic()>deadline:raise RuntimeError('Timers stopped, but active jobs are still running naturally: '+str(active))
        time.sleep(1)
    result={'timers':rows,'oneshots_finished_naturally':True,'production_timer_changes':0,'visual_homolog_timer_changes':0,'disabled':False,'sql_termination':False,'suprimentos_old_kept_running':True,'rollback_commands':['systemctl start '+x['timer'] for x in rows]}
    (S/'old-timers.json').write_text(json.dumps(result,indent=2));print(json.dumps(result))
if __name__=='__main__':main()

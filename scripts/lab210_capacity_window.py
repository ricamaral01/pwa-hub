"""Privileged read-only capacity sampling; a restricted pg_stat view is rejected."""
import json,subprocess,time
from pathlib import Path
S=Path('/opt/concrefer-unificado/staging/lab210-production-20261122')
def main():
    query="""SELECT json_build_object('utc',clock_timestamp(),'clients_including_observer',count(*) FILTER(WHERE backend_type='client backend'),'total_activity',count(*),'common_headroom_excluding_observer',current_setting('max_connections')::int-current_setting('superuser_reserved_connections')::int-coalesce(nullif(current_setting('reserved_connections',true),''),'0')::int-(count(*) FILTER(WHERE backend_type='client backend')-1)) FROM pg_stat_activity;"""
    source="SET default_transaction_read_only=on;SET statement_timeout='3s';"+(query+'SELECT pg_sleep(1);')*130
    start=time.monotonic()
    r=subprocess.run(['sudo','-u','postgres','env','PGAPPNAME=lab210_capacity_observer','psql','-X','-qAt','-v','ON_ERROR_STOP=1','-d','postgres'],input=source,text=True,capture_output=True,check=True)
    rows=[json.loads(line) for line in r.stdout.splitlines() if line.startswith('{')]
    assert len(rows)==130
    assert all(0<=x['total_activity']-x['clients_including_observer']<=15 for x in rows),'pg_stat fields are restricted or observer classification is wrong'
    result={'duration_seconds':round(time.monotonic()-start,1),'minimum_headroom':min(x['common_headroom_excluding_observer'] for x in rows),'maximum_activity':max(x['total_activity'] for x in rows),'passed':all(x['common_headroom_excluding_observer']>=25 for x in rows),'valid':True,'samples':rows,'observer':'postgres, one autocommit read-only client, excluded from headroom','configuration_changes':0}
    (S/'capacity-after-timers.json').write_text(json.dumps(result));print(json.dumps(result))
if __name__=='__main__':main()

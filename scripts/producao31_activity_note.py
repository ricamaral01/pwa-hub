"""Inspect idle transactions without exposing query text or changing sessions."""
import json
from producao31_common import remote,save
data=remote("""import json,subprocess
q="BEGIN READ ONLY;SELECT coalesce(json_agg(t),'[]') FROM (SELECT pid,datname,usename,application_name,state,backend_start,xact_start,state_change,clock_timestamp()-xact_start AS transaction_age,clock_timestamp()-state_change AS idle_age FROM pg_stat_activity WHERE state='idle in transaction' ORDER BY xact_start)t;ROLLBACK;"
p=subprocess.run(['sudo','-u','postgres','psql','-X','-qAt','-v','ON_ERROR_STOP=1','-c',q],capture_output=True,text=True,check=True);print(p.stdout)
""");save('idle-transaction-readonly.json',{'sessions':data,'read_only':True,'sessions_terminated':0});print(json.dumps(data))

"""Read-only trace of PCP Diário float accumulation on official and test copies."""

import json
import subprocess


REMOTE = r'''
import os,sys,json,hashlib,math
from datetime import date
from decimal import Decimal
os.chdir(sys.argv[1]);sys.path.insert(0,os.getcwd())
if len(sys.argv)>2:
    for line in open(sys.argv[2],encoding='utf-8'):
        if line.strip() and not line.lstrip().startswith('#') and '=' in line:
            k,v=line.strip().split('=',1);os.environ[k]=v
from app.core.database import SessionLocal
from app.api.routers.pcp import consultar_pcp_diario
for start,days,target in [('2026-08-01',31,'2026-08-14'),('2026-09-01',30,'2026-09-17')]:
    captured={}
    def trace(frame,event,arg):
        if event=='line' and frame.f_code.co_name=='consultar_pcp_diario' and frame.f_lineno==963 and frame.f_locals.get('data_key')==target:
            lines=frame.f_locals['linhas']
            values=[float(item['dias'][target]['volume_programado'] or 0) for item in lines.values()]
            pairs=[(key,repr(float(item['dias'][target]['volume_programado'] or 0))) for key,item in lines.items()]
            captured.update(n=len(values),sum=repr(sum(values)),rounded=round(sum(values),2),fsum=repr(math.fsum(values)),decimal=str(sum(Decimal(str(v)) for v in values)),ordered_hash=hashlib.sha256(json.dumps(pairs).encode()).hexdigest(),sorted_hash=hashlib.sha256(json.dumps(sorted(pairs)).encode()).hexdigest())
        return trace
    with SessionLocal() as db:
        sys.settrace(trace)
        try:
            result=consultar_pcp_diario(date.fromisoformat(start),days,db,None)
        finally:
            sys.settrace(None)
    captured['api_total']=result['totais'][target]['volume_programado']
    print(json.dumps({'target':target,**captured},sort_keys=True))
'''


def remote(alias, python, root, env=None):
    command = ['ssh', alias, python, '-', root]
    if env:
        command.append(env)
    result = subprocess.run(command, input=REMOTE, text=True, capture_output=True, check=True)
    return [json.loads(line) for line in result.stdout.splitlines() if line.startswith('{')]


def main():
    for name, args in {
        'oficial': ('vps-rh','/opt/pcp-concrefer/venv/bin/python','/opt/pcp-concrefer'),
        'copia': ('vps-staging','/opt/concrefer-unificado/pcp-api/.venv-py310/bin/python','/opt/concrefer-unificado/pcp-api','/etc/pcp-unificado/pcp.env'),
    }.items():
        print(name, json.dumps(remote(*args),ensure_ascii=False))


if __name__=='__main__':
    main()

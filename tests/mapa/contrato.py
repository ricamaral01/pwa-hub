"""Read-only RPC contract check: official GET versus authenticated test GET/POST.

This covers the dashboard productivity RPC only. Other draft browser fixtures
are not yet contractual and are deliberately excluded from the pass count.
"""

import json
from pathlib import Path
import subprocess


ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "tests" / "mapa" / "fixtures" / "rpc-produtividade.json"
REMOTE = r'''
import os,sys,json,hashlib,urllib.parse,urllib.request,urllib.error
from datetime import datetime
from pathlib import Path
for path in ('/etc/mapa-unificado/auth.env','/opt/concrefer-unificado/migration/supabase-source.env'):
    for line in Path(path).read_text().splitlines():
        if line.strip() and not line.lstrip().startswith('#') and '=' in line:
            key,value=line.strip().split('=',1);os.environ[key]=value.strip().strip('"').strip("'")
os.chdir('/opt/concrefer-unificado/mapa-api');sys.path.insert(0,os.getcwd())
from app import connect,signer,COOKIE_NAME
with connect() as conn,conn.cursor() as cur:
    cur.execute("SELECT id,updated_at FROM public.usuarios WHERE perfil='GERENCIA' AND ativo AND NOT primeiro_acesso ORDER BY id LIMIT 1")
    user=cur.fetchone()
assert user
cookie=COOKIE_NAME+'='+signer().dumps({'scope':'session','id':user['id'],'updated_at':user['updated_at'].isoformat()})
source=os.environ['SUPABASE_URL'].rstrip('/')+'/rest/v1/rpc/rpc_dashboard_produtividade_resumo_v1'
test='http://127.0.0.1:13052/rest/v1/rpc/rpc_dashboard_produtividade_resumo_v1'
key=os.environ['SUPABASE_SECRET_KEY']
cases=[]
for start,end in [('2026-10-01','2026-10-02'),('2026-09-01','2026-09-30'),('2099-01-01','2099-01-03')]:
    for scope in ('TOTAL','S1','S2','S3','S4','S1_S2','UNKNOWN'):
        params={'p_data_inicio':start,'p_data_fim':end,'p_scope':scope}
        query=urllib.parse.urlencode(params)
        def call(url,method,headers,data=None):
            req=urllib.request.Request(url,data=data,headers=headers,method=method)
            try:
                with urllib.request.urlopen(req,timeout=20) as resp:
                    return resp.status,json.loads(resp.read())
            except urllib.error.HTTPError as error:
                return error.code,json.loads(error.read())
        expected_status,expected=call(source+'?'+query,'GET',{'apikey':key,'Authorization':'Bearer '+key})
        def normalize(value):
            value=dict(value)
            datetime.fromisoformat(value.pop('generated_at'))
            return value
        expected_normal=normalize(expected) if expected_status==200 else expected
        methods={}
        for method in ('GET','POST'):
            if method=='GET':
                status,actual=call(test+'?'+query,'GET',{'Cookie':cookie})
            else:
                status,actual=call(test,'POST',{'Cookie':cookie,'Content-Type':'application/json'},json.dumps(params).encode())
            actual_normal=normalize(actual) if status==200 else actual
            methods[method]={'status':status,'matches':status==expected_status and actual_normal==expected_normal}
        cases.append({'params':params,'expected_status':expected_status,'expected':expected_normal,'test':methods})
print(json.dumps(cases,ensure_ascii=False))
'''


def main() -> None:
    result = subprocess.run(["ssh", "vps-staging", "/opt/concrefer-unificado/mapa-api/.venv/bin/python", "-"],
                            input=REMOTE, text=True, capture_output=True, check=True)
    cases = json.loads(result.stdout)
    OUT.write_text(json.dumps({"source": "official Supabase RPC via GET only",
                               "normalization": "generated_at removed after ISO timestamp validation",
                               "cases": cases}, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    passed = sum(method["matches"] for case in cases for method in case["test"].values())
    total = sum(len(case["test"]) for case in cases)
    print(f"rpc_contract={passed}/{total} source_cases={len(cases)} fixture={OUT.relative_to(ROOT)}")
    if passed != total:
        raise SystemExit(1)


if __name__ == "__main__":
    main()

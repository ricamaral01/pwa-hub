"""Bound browser memory: run real-profile cases in small isolated batches."""
import argparse,json,subprocess,sys
from pathlib import Path
R=Path(__file__).resolve().parents[1];O=R/'docs/revisao-visual-unificado/homolog/revisao-final'
p=argparse.ArgumentParser();p.add_argument('--roles',nargs='+',default=['GERENCIA','LABORATORIO','PCP','PRODUCAO','QUALIDADE','SUPRIMENTOS','CONSULTA']);p.add_argument('--candidate',action='store_true');p.add_argument('--only-failures',action='store_true');p.add_argument('--concurrency',type=int,default=3);a=p.parse_args()
inventory=json.loads((O/'inventario.json').read_text(encoding='utf-8'))
results=[]
for role in a.roles:
    ids=[row['id'] for row in inventory]
    matrix=O/('matrix-'+role.lower()+'.json')
    if a.only_failures and matrix.exists():
        rows=json.loads(matrix.read_text(encoding='utf-8'));done={row['screen'] for row in rows if row.get('ok')};ids=[screen for screen in ids if screen not in done]
    for offset in range(0,len(ids),20):
        command=[sys.executable,'tests/unificado/review_complete_matrix.py','--output-dir','revisao-final','--role',role,'--concurrency',str(a.concurrency),'--only',*ids[offset:offset+20]]
        if a.candidate:command.append('--candidate')
        logfile=O/f'batch-{role.lower()}-{offset//20+1:02}.log'
        with logfile.open('w',encoding='utf-8') as log:
            child=subprocess.run(command,cwd=R,stdout=log,stderr=subprocess.STDOUT)
        record={'profile':role,'batch':offset//20+1,'exit_code':child.returncode,'log':logfile.name};results.append(record)
        (O/'batch-progress.json').write_text(json.dumps(results,indent=2));print(json.dumps(record),flush=True)
print('Matrix batches finished; inspect actual case results before approval.')

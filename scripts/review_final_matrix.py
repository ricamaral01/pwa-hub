"""Bound browser memory: run real-profile cases in small isolated batches."""
import argparse,hashlib,json,subprocess,sys
from pathlib import Path
R=Path(__file__).resolve().parents[1];O=R/'docs/revisao-visual-unificado/homolog/revisao-final'
p=argparse.ArgumentParser();p.add_argument('--roles',nargs='+',default=['GERENCIA','LABORATORIO','PCP','PRODUCAO','QUALIDADE','SUPRIMENTOS','CONSULTA']);p.add_argument('--candidate',action='store_true');p.add_argument('--only-failures',action='store_true');p.add_argument('--concurrency',type=int,default=3);a=p.parse_args()
inventory=json.loads((O/'inventario.json').read_text(encoding='utf-8'))
results=[]
for role in a.roles:
    ids=[row['id'] for row in inventory]
    matrix=O/('matrix-'+role.lower()+'.json')
    if a.only_failures and matrix.exists():
        rows=json.loads(matrix.read_text(encoding='utf-8'))
        audit_hash=hashlib.sha256((R/'tests/unificado/review_dom_audit.js').read_text(encoding='utf-8').encode()).hexdigest()
        accepted={audit_hash};equivalent=O/'diagnosticos/accepted-audit-hashes.json'
        if equivalent.exists():accepted.update(json.loads(equivalent.read_text()))
        done={row['screen'] for row in rows if row.get('ok') and len(row.get('layout',[]))==4 and all(frame.get('audit_sha256') in accepted for layout in row['layout'] for frame in layout['frames'])}
        ids=[screen for screen in ids if screen not in done]
    for offset in range(0,len(ids),20):
        selected=ids[offset:offset+20]
        access_file=O/('profile-access-'+role.lower()+'.json')
        if access_file.exists():
            access=json.loads(access_file.read_text())
            if access.get('access_verified'):selected=[screen for screen in selected if screen in access['eligible_screens']]
        if not selected:continue
        command=[sys.executable,'tests/unificado/review_complete_matrix.py','--output-dir','revisao-final','--role',role,'--concurrency',str(a.concurrency),'--only',*selected]
        if a.candidate:command.append('--candidate')
        logfile=O/f'batch-{role.lower()}-{offset//20+1:02}.log'
        with logfile.open('w',encoding='utf-8') as log:
            child=subprocess.run(command,cwd=R,stdout=log,stderr=subprocess.STDOUT)
        record={'profile':role,'batch':offset//20+1,'exit_code':child.returncode,'log':logfile.name};results.append(record)
        (O/'batch-progress.json').write_text(json.dumps(results,indent=2));print(json.dumps(record),flush=True)
print('Matrix batches finished; inspect actual case results before approval.')

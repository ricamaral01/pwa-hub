"""Commit published evidence and the activation-aware PWA test, nothing else."""
import json,subprocess
from pathlib import Path
R=Path(__file__).resolve().parents[1];O=R/'docs/revisao-visual-unificado/homolog/modulos-colunas-20261120'
def git(*args):return subprocess.check_output(['git',*args],cwd=R,text=True,encoding='utf-8')
assert json.loads((O/'delivery-check.json').read_text(encoding='utf-8'))['ok']
assert json.loads((O/'final-check.json').read_text(encoding='utf-8'))['audit']['ok']
assert not git('diff','--cached','--name-only').strip(),'Do not mix existing staged work'
files=[p.relative_to(R).as_posix() for p in O.rglob('*') if p.is_file() and p.suffix in {'.html','.json','.png','.txt'} and p.name not in {'screen-review.json','tv-browser-review.json','evidence-commit.json'}]
files+=['tests/unificado/modulos_pwa.py','scripts/modulos_colunas_evidence_commit.py']
for start in range(0,len(files),60):subprocess.run(['git','add','--',*files[start:start+60]],cwd=R,check=True,stdout=subprocess.PIPE,stderr=subprocess.PIPE)
subprocess.run(['git','-c','core.whitespace=blank-at-eol,blank-at-eof,space-before-tab,cr-at-eol','diff','--cached','--check'],cwd=R,check=True)
subprocess.run(['git','commit','-m','test(modules): record published matrix and service worker upgrade'],cwd=R,check=True,stdout=subprocess.PIPE,stderr=subprocess.PIPE)
result={'evidence_commit':git('rev-parse','HEAD').strip(),'columns_commit':json.loads((O/'columns-commit.json').read_text())['commit'],'search_commit':'964e4281b811067f29ac9c7246f4fae52bb9fc61','push':False,'pr':False,'production_changed':False,'prior_work_preserved':True}
(O/'evidence-commit.json').write_text(json.dumps(result,indent=2),encoding='utf-8');print(json.dumps(result))

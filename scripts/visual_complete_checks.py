"""Required local regression checks, with concise machine-readable evidence."""
import json,os,subprocess,sys
from pathlib import Path
R=Path(__file__).resolve().parents[1];O=R/'docs/revisao-visual-unificado/homolog/revisao-completa'
env={**os.environ,'UNIFICADO_BASE_URL':'https://concrefer.concretrack.com.br:18446','PCP_ANON_EXPECTED':'401','PYTHONIOENCODING':'utf-8'}
commands=[('visual-guard',[sys.executable,'tests/unificado/visual_style_guard.py'],R),('visual-guard-tests',[sys.executable,'tests/unificado/test_visual_style_guard.py'],R),('frontend-regressions',['node','--test','tests/unificado/review_complete.test.cjs'],R),('sector-context',['node','tests/unificado/screen_context.test.cjs'],R),('syntax',[sys.executable,'tests/unificado/visual_syntax_check.py','--base','HEAD','--output',str(O/'syntax-checks.json')],R),('gate',[sys.executable,'tests/unificado/modelo_a_gate.py'],R),('laboratorio-tests',['npm.cmd','test'],R/'unificado/laboratorio/frontend'),('qualidade-ui-a11y',['npm.cmd','run','test:ui','--','--workers=1','--timeout=60000'],R/'unificado/qualidade/frontend')]
results=[]
for name,cmd,cwd in commands:
 p=subprocess.run(cmd,cwd=cwd,env=env,capture_output=True,text=True,encoding='utf-8',errors='replace');(O/(name+'.log')).write_text(p.stdout+p.stderr,encoding='utf-8');results.append({'check':name,'command':' '.join(cmd),'exit_code':p.returncode});(O/'checks.json').write_text(json.dumps({'version':(R/'unificado/VERSION').read_text().strip(),'checks':results},indent=2));print(name,p.returncode,flush=True)
 assert p.returncode==0,(name,p.stdout[-1000:],p.stderr[-1000:])

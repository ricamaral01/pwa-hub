"""Rebuild the four frontends from their sources; keep command evidence."""
import json,subprocess,shutil
from pathlib import Path
R=Path(__file__).resolve().parents[1];O=R/'docs/revisao-visual-unificado/homolog/revisao-completa';O.mkdir(exist_ok=True)
targets=[('modelo-a','unificado/sidebar-modelo-a','build'),('qualidade','unificado/qualidade/frontend','build'),('qualidade-tasks','unificado/qualidade/frontend','build:tasks'),('logistica','unificado/logistica/frontend','build'),('laboratorio','unificado/laboratorio/frontend','build'),('laboratorio-novo','unificado/laboratorio/frontend','build:novo')]
results=[]
for name,folder,target in targets:
 p=subprocess.run(['npm.cmd','run',target],cwd=R/folder,capture_output=True,text=True,encoding='utf-8',errors='replace')
 (O/(name+'-build.log')).write_text(p.stdout+p.stderr,encoding='utf-8');results.append({'target':name,'command':'npm run '+target,'exit_code':p.returncode});assert p.returncode==0,(name,p.stderr)
 print(name,'built',flush=True)
p=subprocess.run(['npx.cmd','vite','build','--config','vite.cronoanalise.config.ts'],cwd=R/'unificado/laboratorio/frontend',capture_output=True,text=True,encoding='utf-8',errors='replace');(O/'cronoanalise-build.log').write_text(p.stdout+p.stderr,encoding='utf-8');assert p.returncode==0;results.append({'target':'cronoanalise','exit_code':0})
# Logistics entry files are the Vite outputs; framework bundles stay generated.
for p in (R/'unificado/logistica/dist').iterdir():
 if p.is_file():shutil.copy2(p,R/'unificado/logistica'/p.name)
for folder in ['dist','dist-tasks']:
 for p in (R/'unificado/qualidade'/folder/'assets').iterdir():
  if p.is_file():shutil.copy2(p,R/'unificado/qualidade/assets'/p.name)
(O/'builds.json').write_text(json.dumps(results,indent=2));print('All source builds passed')

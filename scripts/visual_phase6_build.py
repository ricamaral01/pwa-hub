"""Rebuild React screens and install their generated assets without deleting old chunks."""
import re,shutil,subprocess
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1];U=ROOT/'unificado'
shared=(U/'shell/remaining-visual.css').read_text(encoding='utf-8').split('\n',1)[1]
for area in ['qualidade','logistica']:
 base=U/area/'frontend';p=base/'src/style.css';s=p.read_text(encoding='utf-8')
 if '/* Shared screen presentation */' not in s:p.write_text(s+'\n/* Shared screen presentation */\n'+shared,encoding='utf-8')
 for target in (['build','build:tasks'] if area=='qualidade' else ['build']):subprocess.run(['npm.cmd','run',target],cwd=base,check=True)
 if area=='logistica':
  for p in (base.parent/'dist').iterdir():
   if p.is_file():shutil.copy2(p,base.parent/p.name)
 else:
  names={}
  for folder,label in [('dist','main'),('dist-tasks','tasks')]:
   assets=base.parent/folder/'assets'
   for p in assets.iterdir():shutil.copy2(p,base.parent/'assets'/p.name)
   names[label]={ext:next(assets.glob('*.'+ext)).name for ext in ['css','js']}
  wrapper="""const tasks=/^\\/unificado\\/qualidade\\/tarefas(?:\\/|$)/.test(location.pathname);
const css=document.createElement('link');css.rel='stylesheet';
css.href=tasks?'/unificado/qualidade/assets/TASK_CSS':'/unificado/qualidade/assets/MAIN_CSS';document.head.append(css);
if(tasks)document.title='Tarefas · ConcreTrack';
import(tasks?'/unificado/qualidade/assets/TASK_JS':'/unificado/qualidade/assets/MAIN_JS').catch(()=>{const root=document.getElementById('root');const message=document.createElement('p');message.textContent='Não foi possível abrir a tela. Atualize a página para tentar novamente.';message.setAttribute('role','alert');root?.replaceChildren(message)});
"""
  for label,prefix in [('main','MAIN'),('tasks','TASK')]:
   for ext in ['css','js']:wrapper=wrapper.replace(prefix+'_'+ext.upper(),names[label][ext])
  (base/'router.js').write_text(wrapper,encoding='utf-8')
  shutil.copy2(base/'router.js',base.parent/'assets/tasks-router-274ea3190b48.js')
  p=base.parent/'index.html';s=p.read_text(encoding='utf-8');s=s.replace('</head>','<link rel="stylesheet" href="/unificado/shell/module-components.css?v=1.4.12"><script defer src="/unificado/shell/components.js?v=1.4.12"></script></head>');p.write_text(s,encoding='utf-8')

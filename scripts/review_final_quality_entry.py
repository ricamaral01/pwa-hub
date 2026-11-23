"""Wire both freshly built Qualidade entry points without changing route behavior."""
import hashlib,json,re,shutil
from pathlib import Path
R=Path(__file__).resolve().parents[1];Q=R/'unificado/qualidade'
def assets(folder,entry):
 text=(Q/folder/entry).read_text(encoding='utf-8')
 js=re.search(r'<script[^>]+src="([^"]+)"',text)[1]
 css=re.search(r'<link[^>]+href="([^"]+\.css)"',text)[1]
 for path in (Q/folder/'assets').iterdir():
  if path.is_file():shutil.copy2(path,Q/'assets'/path.name)
 return js,css
main,main_css=assets('dist','index.html');tasks,tasks_css=assets('dist-tasks','tasks.html')
content=f'''const tasks=/^\\/unificado\\/qualidade\\/tarefas(?:\\/|$)/.test(location.pathname);
const css=document.createElement('link');css.rel='stylesheet';
css.href=tasks?{json.dumps(tasks_css)}:{json.dumps(main_css)};document.head.append(css);
if(tasks)document.title='Tarefas · ConcreTrack';
import(tasks?{json.dumps(tasks)}:{json.dumps(main)}).catch(()=>{{const root=document.getElementById('root');const message=document.createElement('p');message.textContent='Não foi possível abrir a tela. Atualize a página para tentar novamente.';message.setAttribute('role','alert');root?.replaceChildren(message)}});
'''
name='tasks-router-'+hashlib.sha256(content.encode()).hexdigest()[:12]+'.js';(Q/'assets'/name).write_text(content,encoding='utf-8')
page=Q/'index.html';source=page.read_text(encoding='utf-8')
source,count=re.subn(r'(<script[^>]+src=")[^"]*assets/tasks-router-[^"]+("[^>]*>)',lambda m:m[1]+'/unificado/qualidade/assets/'+name+m[2],source)
assert count==1
page.write_text(source,encoding='utf-8')
for url in [main,main_css,tasks,tasks_css]:assert (Q/'assets'/Path(url).name).is_file()
receipt={'router':name,'main_js':main,'main_css':main_css,'tasks_js':tasks,'tasks_css':tasks_css,'all_emitted_assets_exist':True}
(R/'docs/revisao-visual-unificado/homolog/revisao-final/quality-entry.json').write_text(json.dumps(receipt,indent=2))
print(json.dumps(receipt))

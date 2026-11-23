const tasks=/^\/unificado\/qualidade\/tarefas(?:\/|$)/.test(location.pathname);
const css=document.createElement('link');css.rel='stylesheet';
css.href=tasks?'/unificado/qualidade/assets/tasks-P0t7-g3M.css':'/unificado/qualidade/assets/index-P0t7-g3M.css';document.head.append(css);
if(tasks)document.title='Tarefas · ConcreTrack';
import(tasks?'/unificado/qualidade/assets/tasks-KvB9CIVI.js':'/unificado/qualidade/assets/index-Bn4z2eAt.js').catch(()=>{const root=document.getElementById('root');const message=document.createElement('p');message.textContent='Não foi possível abrir a tela. Atualize a página para tentar novamente.';message.setAttribute('role','alert');root?.replaceChildren(message)});

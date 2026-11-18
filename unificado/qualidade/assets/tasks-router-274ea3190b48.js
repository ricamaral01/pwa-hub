const tasks=/^\/unificado\/qualidade\/tarefas(?:\/|$)/.test(location.pathname);
const css=document.createElement('link');css.rel='stylesheet';css.crossOrigin='';
css.href=tasks?"/unificado/qualidade/assets/tasks-5Ycax9rJ.css":"/unificado/qualidade/assets/index-DG3K2uWx.css";document.head.append(css);
if(tasks)document.title='Tarefas · ConcreTrack';
import(tasks?"/unificado/qualidade/assets/tasks-DIImpmDG.js":"/unificado/qualidade/assets/index-CI1pdTnl.js").catch(()=>{const root=document.getElementById('root');const message=document.createElement('p');message.textContent='Não foi possível abrir a tela. Atualize a página para tentar novamente.';message.setAttribute('role','alert');root?.replaceChildren(message)});

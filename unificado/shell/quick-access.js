/* Personalized start page: configuration and destinations are server-authorized. */
(() => {
  const content=document.querySelector('.main-panel > .content');
  if(!content)return;
  let profile=null,requestId=0;
  const root='/unificado/';
  const node=(tag,className,text)=>{const el=document.createElement(tag);if(className)el.className=className;if(text!==undefined)el.textContent=text;return el;};
  function syncHeading(){if(!content.classList.contains('uqa-personal'))return;const title=document.querySelector('.nav-mobile-title');if(title)title.textContent='Meu acesso rápido';const crumb=document.querySelector('.breadcrumb > :last-child');if(crumb)crumb.textContent='Meu acesso rápido';}
  function showPersonal(){if(!profile?.enabled)return;content.classList.add('uqa-personal');document.getElementById('uqa-home').hidden=false;window.UnificadoRouter.home();}
  function ensureReturn(){
    if(!profile?.enabled)return;
    for(const [selector,className] of [['.nav-panel','uqa-return-desktop']]){
      const target=document.querySelector(selector);if(!target||document.querySelector('.'+className))continue;
      const button=node('button','nav-item uqa-return '+className);button.type='button';button.onclick=showPersonal;
      button.append(window.UnificadoIcons.node('estrela','nav-item-code'),node('span','nav-item-label','Meu acesso rápido'));
      if(className==='uqa-return-mobile')target.after(button);else {const heading=target.querySelector('.nav-panel-head');if(heading)heading.after(button);else target.prepend(button);}
    }
    const homeLabel=document.querySelector('.nav-mobile-bottom [data-mode=inicio] .nav-bottom-label');
    if(homeLabel&&homeLabel.textContent!=='Início')homeLabel.textContent='Início';
  }
  function clear(){profile=null;content.classList.remove('uqa-personal');document.getElementById('uqa-home')?.remove();document.querySelectorAll('.uqa-return').forEach(el=>el.remove());const label=document.querySelector('.nav-mobile-bottom [data-mode=inicio] .nav-bottom-label');if(label)label.textContent='Início';}
  function render(data){
    const wasHome=content.classList.contains('uqa-personal');profile=data;
    const panel=node('section');panel.id='uqa-home';
    const welcome=node('header','uqa-welcome'),copy=node('div');
    copy.append(node('h1','','Meu acesso rápido'),node('p','',data.user.name));
    welcome.append(copy);panel.append(welcome);
    for(const [module,title,code] of [['planejamento','Planejamento','PL'],['producao','Produção · Controle','PR']]){
      const items=data.items.filter(row=>row.module===module);if(!items.length)continue;
      const section=node('section');section.dataset.module=module;const heading=node('h2');heading.append(document.createTextNode(title));const grid=node('div','uqa-grid');
      for(const item of items){
        const card=node('article','uqa-card');card.dataset.shortcut=item.id;card.append(window.UnificadoIcons.node(window.UnificadoIcons.forScreen({id:item.destinations[0]?.screen,label:item.label}),'uqa-icon'));
        const text=node('div');text.append(node('strong','',item.label),node('small','',item.detail));if(item.destinations.length>1)card.append(text);
        const links=node('div','uqa-links');
        for(const dest of item.destinations){
          const url=new URL(dest.path,location.origin+root);if(url.origin!==location.origin||!url.pathname.startsWith(root))continue;
          const link=node('a','uqa-link',item.destinations.length===1?item.label:dest.label);link.href=url.href;link.dataset.screen=dest.screen;link.setAttribute('aria-label',dest.label);
          link.addEventListener('click',event=>{if(event.ctrlKey||event.metaKey||event.shiftKey||event.altKey)return;event.preventDefault();window.UnificadoRouter.open(url.href,dest.screen);});links.append(link);
        }
        card.append(links);grid.append(card);
      }
      section.append(heading,grid);panel.append(section);
    }
    if(!data.items.length){const empty=node('div','uqa-empty');empty.append(node('strong','','Nenhum atalho disponível'),node('p','','Solicite ao administrador a revisão das funções da sua conta.'));panel.append(empty);}
    document.getElementById('uqa-home')?.remove();content.prepend(panel);
    if(data.home||wasHome){content.classList.add('uqa-personal');panel.hidden=false;}else panel.hidden=true;
    ensureReturn();syncHeading();
  }
  async function refresh(){
    const id=++requestId;
    try{
      await window.UnificadoScreenAccess?.ready;
      if (typeof hasMapa !== 'undefined' && !hasMapa) {clear();return;}
      const response=await fetch(root+'mapa/api/unified/quick-access/me',{credentials:'same-origin',cache:'no-store'});
      if(id!==requestId)return;
      if(response.status===401){clear();return;}
      if(!response.ok)throw new Error('quick access');
      const data=await response.json();if(id!==requestId)return;
      if(data.enabled)render(data);else clear();
    }catch{if(id===requestId&&profile){const current=document.getElementById('uqa-home');if(current){current.replaceChildren(node('h1','','Meu acesso rápido'),node('p','','Não foi possível conferir os atalhos. Atualize a página para tentar novamente.'));}}}
  }
  document.addEventListener('click',event=>{if(profile?.enabled&&profile.home&&event.target.closest('.nav-brand,.nav-home,[data-mode=inicio]')){content.classList.add('uqa-personal');const panel=document.getElementById('uqa-home');if(panel)panel.hidden=false;}});
  const observer=new MutationObserver(()=>ensureReturn());observer.observe(document.querySelector('.desktop-only')||document.body,{childList:true,subtree:true});
  addEventListener('focus',refresh);addEventListener('pageshow',event=>{if(event.persisted)refresh();});
  refresh();
})();

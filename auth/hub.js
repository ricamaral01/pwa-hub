if(window.CONCRETRACK_AUTH_CONFIG?.authEnabled===false){
  document.querySelector('[data-app-key="admin-usuarios"]')?.setAttribute('hidden','');
}
document.addEventListener('concretrack:authenticated',function(event){
  const ctx=event.detail,allowed=new Set(ctx.permissions.filter(p=>p.enabled).map(p=>p.app_key));
  document.querySelectorAll('[data-app-key]').forEach(card=>card.hidden=ctx.user.access_level!=='master'&&!allowed.has(card.dataset.appKey));
  const bar=document.createElement('div'),label=document.createElement('span'),button=document.createElement('button');bar.className='auth-user-bar';label.textContent=`${ctx.user.full_name} · ${ctx.user.access_level}`;button.type='button';button.textContent='Sair';button.onclick=()=>ConcretrackAuth.logout();bar.append(label,button);document.body.prepend(bar);
});

(function(){
  'use strict';
  const style=document.createElement('style');style.textContent='html.auth-checking body{visibility:hidden}';document.head.appendChild(style);document.documentElement.classList.add('auth-checking');
  if(window.CONCRETRACK_AUTH_CONFIG?.authEnabled===false){
    if(document.body.dataset.appKey==='admin-usuarios') return location.replace('/');
    document.documentElement.classList.remove('auth-checking');
    document.dispatchEvent(new CustomEvent('concretrack:auth-suspended'));
    return;
  }
  const target=encodeURIComponent(location.pathname+location.search);
  async function run(){
    try{
      const session=await window.ConcretrackAuth.session(); if(!session) return location.replace(`/login.html?next=${target}`);
      let issued=0;try{issued=JSON.parse(atob(session.access_token.split('.')[1].replace(/-/g,'+').replace(/_/g,'/'))).iat||0}catch(_){} const max=window.CONCRETRACK_AUTH_CONFIG.sessionMaxAgeSeconds;
      if(issued&&Date.now()/1000-issued>max){await window.ConcretrackAuth.logout();return}
      const ctx=await window.ConcretrackAuth.context();
      if(!ctx.user.is_active){await window.ConcretrackAuth.logout();return}
      if(ctx.user.first_login&&location.pathname!='/change-password.html') return location.replace('/change-password.html');
      const key=document.body.dataset.appKey;
      if(key&&ctx.user.access_level!=='master'&&!ctx.permissions.some(p=>p.app_key===key&&p.enabled)) return location.replace(`/access-denied.html?app=${encodeURIComponent(key)}`);
      window.CONCRETRACK_USER=ctx.user;window.CONCRETRACK_PERMISSIONS=ctx.permissions;document.dispatchEvent(new CustomEvent('concretrack:authenticated',{detail:ctx}));
      document.documentElement.classList.remove('auth-checking');
    }catch(_){location.replace(`/login.html?next=${target}`)}
  }
  run();
})();

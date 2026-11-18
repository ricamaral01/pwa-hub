(() => {
  const base = '/unificado/m/inspecao/';
  const message = document.getElementById('pwa-menu-message');
  const frame = document.getElementById('pwa-menu-frame');
  try { localStorage.setItem('ct.sidebar.collapsed', '0'); } catch (_) {}
  fetch('/unificado/mapa/api/me', {credentials:'same-origin', cache:'no-store'})
    .then(response => {
      if (response.status === 401) { location.replace(base + 'login.html?next=m%2Finspecao%2Fmenu.html'); return; }
      if (!response.ok) throw new Error('Não foi possível abrir o menu.');
      frame.src = '/unificado/';
    })
    .catch(error => { message.textContent = error.message; message.hidden = false; });
})();

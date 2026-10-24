(() => {
  if (new URLSearchParams(location.search).has('view')) return;
  const read = key => { try { return JSON.parse(localStorage.getItem(key) || 'null'); } catch { return null; } };
  const mapaSession = read('pwa_mapa_auth_session_v1') || {};
  const pcpSession = read('pcp_user') || {};
  const firstFilled = values => values.find(value => typeof value === 'string' && value.trim())?.trim() || '';
  const displayName = firstFilled([mapaSession.name, mapaSession.nome, pcpSession.nome, pcpSession.name]);
  const loginName = firstFilled([mapaSession.username, mapaSession.usuario, mapaSession.login,
    pcpSession.username, pcpSession.usuario, pcpSession.login, mapaSession.id, pcpSession.id]);
  const firstName = (displayName || loginName).split(/\s+/)[0];
  const title = document.querySelector('.opening-compact-title');
  if (title) {
    title.textContent = firstName ? `Bem-vindo, ${firstName}` : 'Bem-vindo';
    const period = document.createElement('span');
    period.className = 'accent-mark';
    period.textContent = '.';
    title.append(period);
  }

  const date = document.getElementById('opening-compact-date');
  if (date) date.textContent = new Intl.DateTimeFormat('pt-BR', {
    timeZone:'America/Sao_Paulo', weekday:'long', day:'numeric', month:'long', year:'numeric'
  }).format(new Date());

  const status = document.getElementById('platform-update-status');
  const label = document.querySelector('.opening-update-compact-label');
  if (status && label) {
    const sync = () => {
      const value = status.textContent || '';
      const version = value.match(/v([\d.]+)\s+disponível/i)?.[1];
      label.textContent = version ? `Atualizar v${version}` :
        (value.startsWith('Atualizando') ? 'Atualizando…' : '');
    };
    new MutationObserver(sync).observe(status, {childList:true, subtree:true, characterData:true});
    sync();
  }
})();

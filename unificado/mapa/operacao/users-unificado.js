/* Unified user administration. The official Mapa application is untouched. */
(() => {
  const base = '/unificado/mapa/api/unified/users';
  const modules = [
    ['planejamento', 'Planejamento'], ['producao', 'Produção'], ['laboratorio', 'Laboratório'],
    ['qualidade', 'Qualidade'], ['suprimentos', 'Suprimentos']
  ];
  const QUALITY_EDITOR_RELEASED = true; // A tela de usuários já exige administração.
  const qualityActionCopy = {
    'qualidade.nc.abrir': ['Abrir NC', 'Registrar uma nova não conformidade'],
    'qualidade.nc.ver_todas': ['Ver todas', 'Ver NCs de todas as áreas'],
    'qualidade.nc.ver_area': ['Ver da área', 'Ver só NCs das áreas marcadas abaixo'],
    'qualidade.nc.triar': ['Triar', 'Classificar e definir responsável e prazo'],
    'qualidade.nc.tratar': ['Tratar', 'Preencher contenção, causa e plano de ação'],
    'qualidade.nc.aprovar_concessao': ['Aprovar concessão', 'Liberar produto não conforme sob concessão'],
    'qualidade.nc.verificar_eficacia': ['Verificar eficácia', 'Avaliar se a ação resolveu'],
    'qualidade.nc.encerrar': ['Encerrar', 'Aprovar o encerramento da NC'],
    'qualidade.nc.cadastros': ['Cadastros', 'Manter origens, tipos, áreas e prazos']
  };
  const cronoActionCopy = [
    ['laboratorio.cronoanalise.coletar', 'Cronoanálise: coletar', 'Cronometrar e enviar medições'],
    ['laboratorio.cronoanalise.analisar', 'Cronoanálise: analisar', 'Invalidar, exportar e salvar simulações'],
    ['laboratorio.cronoanalise.configurar', 'Cronoanálise: configurar', 'Editar catálogo e parâmetros']
  ];
  const request = async (path = '', options = {}) => {
    const response = await fetch(base + path, {
      credentials: 'same-origin', cache: 'no-store',
      headers: {'Content-Type': 'application/json'}, ...options
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || 'Não foi possível concluir a ação.');
    return data;
  };
  const planningRequest = async (path, options = {}) => {
    let token = localStorage.getItem('pcp_token');
    if (!token) {
      const session = await fetch('/unificado/mapa/api/unified/pcp-session',
        {credentials:'same-origin', cache:'no-store'});
      if (!session.ok) throw new Error('Esta conta não administra usuários do Planejamento.');
      const restored = await session.json();
      token = restored.access_token;
      localStorage.setItem('pcp_token', token);
      localStorage.setItem('pcp_user', JSON.stringify(restored.usuario));
    }
    const response = await fetch('/unificado/mapa/api/unified/planning-users' + path, {
      credentials:'same-origin', cache:'no-store',
      headers:{'Content-Type':'application/json',Authorization:'Bearer ' + token}, ...options
    });
    if (response.status === 401) {
      localStorage.removeItem('pcp_token');
      throw new Error('Sessão do Planejamento expirada. Abra novamente esta ação.');
    }
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || 'Não foi possível concluir a ação.');
    return data;
  };
  const currentId = () => state.authUser?.id || '';
  const isMaster = () => ['user-ricardo', 'marcelo', 'alex'].includes(currentId());
  const isQualityAdmin = () => isMaster() || state.authUser?.role === 'GERENCIA';
  const guestActions = [['create', 'Criar'], ['edit', 'Editar'],
    ['delete', 'Excluir'], ['export', 'Exportar'], ['approve', 'Aprovar/liberar']];
  const listWrap = el.viewUsuarios?.querySelector('.ug-list-wrap');
  const search = document.createElement('input');
  search.type = 'search';
  search.className = 'unified-users-search';
  search.placeholder = 'Buscar por nome, login, perfil, setor ou situação';
  search.setAttribute('aria-label', 'Buscar usuários');
  if (listWrap) {
    listWrap.querySelector('h3').textContent = 'Usuários de todos os módulos';
    listWrap.querySelector('thead tr').innerHTML = '<th>Usuário</th><th>Perfis por módulo</th><th>Setor</th><th>Situação</th><th>Ações</th>';
    listWrap.querySelector('.sheet-box').before(search);
  }
  const createGuestButton = document.createElement('button');
  createGuestButton.type = 'button';
  createGuestButton.className = 'btn primary unified-create-guest';
  createGuestButton.textContent = 'Criar convidado';
  createGuestButton.hidden = !isMaster();
  if (listWrap) search.before(createGuestButton);
  search.addEventListener('input', () => {
    const term = search.value.trim().toLocaleLowerCase('pt-BR');
    el.ugListaBody?.querySelectorAll('tr').forEach(row => {
      row.hidden = Boolean(term && !row.dataset.search?.includes(term));
    });
  });
  const modal = document.createElement('div');
  modal.id = 'unified-user-editor';
  modal.hidden = true;
  modal.innerHTML = `<div class="unified-user-editor-card" role="dialog" aria-modal="true" aria-labelledby="unified-user-editor-title">
    <div class="unified-user-editor-head"><h3 id="unified-user-editor-title">Editar usuário</h3><button type="button" data-close aria-label="Fechar">×</button></div>
    <div class="unified-user-editor-fields"><label>Nome<input name="name" autocomplete="off"></label>
    <label>Perfil<select name="role"><option>GERENCIA</option><option>GESTOR</option><option>MONTADOR</option><option>APONTADOR</option><option>CONVIDADO</option></select></label>
    <label>Setor<select name="sector"><option>Todos</option><option>Setor 1</option><option>Setor 2</option><option>Setor 3</option><option>Setor 4</option></select></label></div>
    <p class="unified-user-editor-note">O perfil define o que a pessoa pode fazer. As caixas definem quais telas ela pode abrir.</p>
    <div data-screens class="unified-user-screen-groups"></div>
    <section data-quality-actions hidden class="unified-user-screen-group unified-quality-section">
      <div data-quality-heading class="unified-user-screen-heading"><h4 data-quality-title>Qualidade</h4>
        <div class="unified-quality-presets"><button type="button" data-quality-preset="view">Ver</button><button type="button" data-quality-preset="edit">Editar</button><button type="button" data-quality-preset="all">Todas</button><button type="button" data-quality-preset="clear">Limpar</button></div>
      </div>
      <h5>Telas</h5><div data-quality-screen-list class="unified-quality-screen-list"></div>
      <h5>Ações</h5><div data-quality-action-list class="unified-quality-action-list"></div>
      <div data-quality-areas hidden><h5>Áreas que pode ver</h5>
        <div class="unified-quality-area-tools"><input type="search" data-quality-area-search placeholder="Buscar área" aria-label="Buscar área"><button type="button" data-quality-area-all>Todas</button><button type="button" data-quality-area-none>Limpar</button></div>
        <div data-quality-area-list class="unified-quality-area-list"></div>
      </div>
    </section>
    <div class="unified-user-editor-actions"><button type="button" data-close>Cancelar</button><button type="button" data-save class="btn primary">Salvar</button></div>
    <p data-error role="alert"></p>
  </div>`;
  document.body.append(modal);
  const createModal = document.createElement('div');
  createModal.id = 'unified-guest-create';
  createModal.hidden = true;
  createModal.innerHTML = `<form class="unified-user-editor-card" aria-labelledby="unified-guest-create-title">
    <div class="unified-user-editor-head"><h3 id="unified-guest-create-title">Criar convidado</h3><button type="button" data-close aria-label="Fechar">×</button></div>
    <p class="unified-user-editor-note">O convidado começa sem acesso. Depois de criar, libere cada tela e ação no editor.</p>
    <div class="unified-guest-fields">
      <label>Nome<input name="name" required maxlength="120" autocomplete="name"></label>
      <label>Login<input name="login" required minlength="3" maxlength="40" pattern="[a-z][a-z0-9_-]{2,39}" autocomplete="username"></label>
      <label>Senha temporária<input name="password" required minlength="6" maxlength="128" type="password" autocomplete="new-password"></label>
      <label>Setor<select name="sector"><option>Todos</option><option>Setor 1</option><option>Setor 2</option><option>Setor 3</option><option>Setor 4</option></select></label>
    </div><div class="unified-user-editor-actions"><button type="button" data-close>Cancelar</button><button type="submit" class="btn primary">Criar</button></div>
    <p data-error role="alert"></p></form>`;
  document.body.append(createModal);
  createGuestButton.addEventListener('click', () => {
    createModal.hidden = false;
    createModal.querySelector('[name="name"]').focus();
  });
  createModal.querySelectorAll('[data-close]').forEach(button => button.addEventListener('click', () => { createModal.hidden = true; }));
  createModal.addEventListener('click', event => { if (event.target === createModal) createModal.hidden = true; });
  createModal.querySelector('form').addEventListener('submit', async event => {
    event.preventDefault();
    const form = event.currentTarget;
    const submit = form.querySelector('[type="submit"]');
    submit.disabled = true;
    form.querySelector('[data-error]').textContent = '';
    try {
      const data = Object.fromEntries(new FormData(form));
      data.name = data.name.trim(); data.login = data.login.trim();
      const result = await fetch('/unificado/mapa/api/unified/guests', {
        method:'POST', credentials:'same-origin', cache:'no-store',
        headers:{'Content-Type':'application/json'}, body:JSON.stringify(data)
      });
      const payload = await result.json().catch(() => ({}));
      if (!result.ok) throw new Error(payload.error || 'Não foi possível criar o convidado.');
      createModal.hidden = true;
      form.reset();
      await renderUsuarios();
      await open(payload.user);
    } catch (error) { form.querySelector('[data-error]').textContent = error.message; }
    finally { submit.disabled = false; }
  });
  const resetModal = document.createElement('div');
  resetModal.id = 'unified-password-reset';
  resetModal.hidden = true;
  resetModal.innerHTML = `<form class="unified-user-editor-card unified-password-reset-card" aria-labelledby="unified-password-reset-title">
    <div class="unified-user-editor-head"><h3 id="unified-password-reset-title">Redefinir senha</h3><button type="button" data-close aria-label="Fechar">×</button></div>
    <p data-target class="unified-user-editor-note"></p>
    <div class="unified-password-reset-fields">
      <label>Senha temporária<input name="password" required minlength="6" maxlength="128" type="password" autocomplete="new-password"></label>
      <label>Confirmar senha<input name="confirmation" required minlength="6" maxlength="128" type="password" autocomplete="new-password"></label>
    </div>
    <p class="unified-user-editor-note">A pessoa terá que criar uma nova senha no próximo acesso.</p>
    <div class="unified-user-editor-actions"><button type="button" data-close>Cancelar</button><button type="submit" class="btn primary">Redefinir senha</button></div>
    <p data-error role="alert"></p>
  </form>`;
  document.body.append(resetModal);
  let resetUser = null;
  const closeReset = () => {
    if (resetModal.querySelector('[type="submit"]').disabled) return;
    resetModal.hidden = true;
    resetModal.querySelector('form').reset();
    resetUser = null;
  };
  resetModal.querySelectorAll('[data-close]').forEach(button => button.addEventListener('click', closeReset));
  resetModal.addEventListener('click', event => { if (event.target === resetModal) closeReset(); });
  resetModal.querySelector('form').addEventListener('submit', async event => {
    event.preventDefault();
    if (!resetUser) return;
    const form = event.currentTarget;
    const error = form.querySelector('[data-error]');
    const password = form.elements.password.value;
    error.textContent = '';
    if (password !== form.elements.confirmation.value) {
      error.textContent = 'As senhas não coincidem.';
      return;
    }
    const submit = form.querySelector('[type="submit"]');
    submit.disabled = true;
    try {
      const login = resetUser.login;
      await request('/' + encodeURIComponent(resetUser.id) + '/reset-password',
        {method:'POST', body:JSON.stringify({password})});
      submit.disabled = false;
      closeReset();
      setUgFeedback(`Senha de ${login} redefinida. Troca obrigatória no próximo acesso.`, true);
    } catch (failure) { error.textContent = failure.message; }
    finally { submit.disabled = false; }
  });
  const openReset = user => {
    resetUser = user;
    resetModal.querySelector('[data-target]').textContent = `Conta: ${user.name} (@${user.login})`;
    resetModal.querySelector('[data-error]').textContent = '';
    resetModal.hidden = false;
    resetModal.querySelector('[name="password"]').focus();
  };
  let editing = null;
  let catalog = [];
  let qualityActionCatalog = [];
  let cronoGranted = new Set();
  const qualitySection = modal.querySelector('[data-quality-actions]');
  const updateQualitySummary = () => {
    const screens = qualitySection.querySelectorAll('.unified-screen-view:checked').length;
    const actions = qualitySection.querySelectorAll('.unified-quality-action:checked').length;
    const areas = qualitySection.querySelectorAll('.unified-quality-area:checked').length;
    qualitySection.querySelector('[data-quality-title]').textContent =
      `Qualidade — ${screens} tela${screens === 1 ? '' : 's'}, ${actions} ${actions === 1 ? 'ação' : 'ações'}, ${areas} área${areas === 1 ? '' : 's'}`;
    const seeArea = qualitySection.querySelector('.unified-quality-action[value="qualidade.nc.ver_area"]');
    qualitySection.querySelector('[data-quality-areas]').hidden = !seeArea?.checked;
  };
  const applyQualityPreset = preset => {
    const screenIds = preset === 'view' || preset === 'edit'
      ? new Set(['qualidadePainel', 'qualidadeTratativa',
          ...(preset === 'edit' ? ['qualidadeAbertura'] : [])])
      : new Set(preset === 'all' ? [...qualitySection.querySelectorAll('.unified-screen-view')].map(input => input.value) : []);
    const actionIds = preset === 'view' || preset === 'edit'
      ? new Set(['qualidade.nc.ver_todas',
          ...(preset === 'edit' ? ['qualidade.nc.abrir', 'qualidade.nc.triar', 'qualidade.nc.tratar'] : [])])
      : new Set(preset === 'all' ? qualityActionCatalog.map(action => action.id) : []);
    qualitySection.querySelectorAll('.unified-screen-view').forEach(input => {
      input.checked = !input.disabled && screenIds.has(input.value);
      input.dispatchEvent(new Event('change'));
    });
    qualitySection.querySelectorAll('.unified-quality-action').forEach(input => {
      input.checked = actionIds.has(input.value);
    });
    qualitySection.querySelectorAll('.unified-quality-area').forEach(input => {
      input.checked = preset === 'all';
    });
    updateQualitySummary();
  };
  const close = () => { modal.hidden = true; editing = null; };
  modal.querySelectorAll('[data-close]').forEach(button => button.addEventListener('click', close));
  modal.addEventListener('click', event => { if (event.target === modal) close(); });
  modal.querySelector('[name="role"]').addEventListener('change', () => {
    const role = modal.querySelector('[name="role"]').value;
    modal.querySelectorAll('input[data-require]').forEach(input => {
      if (role === 'CONVIDADO') return;
      if (input.dataset.module !== 'producao') return;
      const allowed = role === 'GERENCIA' || input.dataset.roles.split(',').includes(role);
      input.disabled = !allowed;
      if (!allowed) input.checked = false;
    });
  });
  const open = async user => {
    const planningOnly = user.source === 'pcp';
    const guest = Boolean(user.guest || user.role === 'CONVIDADO');
    const data = planningOnly
      ? await request('/pcp/' + user.pcp_id + '/screens')
      : await request('/' + encodeURIComponent(user.id) + '/screens');
    editing = user;
    catalog = data.screens || [];
    cronoGranted = new Set(planningOnly ? [] : (await request(
      '/' + encodeURIComponent(user.id) + '/crono-actions')).granted || []);
    qualitySection.hidden = !QUALITY_EDITOR_RELEASED || !isQualityAdmin();
    if (QUALITY_EDITOR_RELEASED && isQualityAdmin()) {
      const identity = planningOnly ? null : user.id;
      const actionData = await request(identity ? '/' + encodeURIComponent(identity) + '/quality-actions' :
        '/../quality-actions');
      qualityActionCatalog = actionData.actions || [];
      const granted = new Set(actionData.granted || []);
      const actionList = qualitySection.querySelector('[data-quality-action-list]');
      actionList.replaceChildren();
      for (const action of qualityActionCatalog) {
        const label = document.createElement('label');
        label.className = 'unified-quality-action-row';
        const input = document.createElement('input');
        input.type = 'checkbox'; input.value = action.id;
        input.className = 'unified-quality-action';
        input.checked = granted.has(action.id);
        const copy = qualityActionCopy[action.id] || [action.label, action.description || ''];
        const text = document.createElement('span');
        const title = document.createElement('strong'); title.textContent = copy[0];
        const description = document.createElement('small'); description.textContent = copy[1];
        text.append(title, description);
        label.append(input, text);
        actionList.append(label);
      }
      const grantedAreas = new Set(actionData.granted_areas || []);
      const areaList = qualitySection.querySelector('[data-quality-area-list]');
      areaList.replaceChildren();
      for (const area of actionData.areas || []) {
        const label = document.createElement('label');
        label.className = 'unified-quality-area-row';
        const input = document.createElement('input');
        input.type = 'checkbox'; input.value = area.code;
        input.className = 'unified-quality-area';
        input.checked = grantedAreas.has(area.code);
        label.append(input, document.createTextNode(' ' + area.label));
        areaList.append(label);
      }
      const areaSearch = qualitySection.querySelector('[data-quality-area-search]');
      areaSearch.value = '';
      areaSearch.oninput = () => {
        const term = areaSearch.value.trim().toLocaleLowerCase('pt-BR');
        areaList.querySelectorAll('label').forEach(label => {
          label.hidden = Boolean(term && !label.textContent.toLocaleLowerCase('pt-BR').includes(term));
        });
      };
      qualitySection.querySelector('[data-quality-area-all]').onclick = () => {
        areaList.querySelectorAll('input').forEach(input => { input.checked = true; });
        updateQualitySummary();
      };
      qualitySection.querySelector('[data-quality-area-none]').onclick = () => {
        areaList.querySelectorAll('input').forEach(input => { input.checked = false; });
        updateQualitySummary();
      };
    }
    modal.querySelector('#unified-user-editor-title').textContent =
      planningOnly ? 'Editar telas de ' + user.login : 'Editar usuário ' + user.login;
    modal.querySelector('.unified-user-editor-fields').hidden = false;
    modal.querySelector('[name="name"]').value = user.name;
    modal.querySelector('[name="role"]').value = planningOnly ? 'GESTOR' : user.role;
    modal.querySelector('[name="role"]').disabled = guest;
    modal.querySelector('.unified-user-editor-note').textContent = guest
      ? 'Marque as telas e libere as ações permitidas em cada uma. Visualizar é necessário para usar a tela.'
      : 'O perfil define o que a pessoa pode fazer. As caixas definem quais telas ela pode abrir.';
    modal.querySelector('[name="sector"]').value = planningOnly ? 'Todos' : (user.setor || 'Todos');
    modal.querySelector('[data-error]').textContent = '';
    const wrap = modal.querySelector('[data-screens]');
    wrap.replaceChildren();
    for (const [module, title] of modules) {
      if (module === 'qualidade' && (!QUALITY_EDITOR_RELEASED || !isQualityAdmin())) continue;
      const quality = module === 'qualidade';
      const section = quality ? qualitySection : document.createElement('section');
      if (!quality) section.className = 'unified-user-screen-group';
      if (planningOnly && module === 'laboratorio') {
        const note = document.createElement('p');
        note.textContent = 'Ao marcar Produção ou Laboratório, o acesso unificado será criado automaticamente. A pessoa entra com seu login e senha atuais do PCP novo.';
        section.append(note);
      }
      if (module === 'planejamento' && user.source === 'mapa' && !user.pcp_id) {
        const note = document.createElement('p');
        note.textContent = 'Ao marcar uma tela, o acesso ao PCP novo será criado automaticamente. A pessoa entra com seu login e senha atuais do unificado.';
        section.append(note);
      }
      const heading = quality ? section.querySelector('[data-quality-heading]') : document.createElement('div');
      if (!quality) {
        heading.className = 'unified-user-screen-heading';
        heading.innerHTML = `<h4>${title}</h4><div><button type="button" data-all>Marcar todas</button><button type="button" data-none>Limpar</button></div>`;
        section.append(heading);
      }
      const screenTarget = quality ? section.querySelector('[data-quality-screen-list]') : section;
      if (quality) screenTarget.replaceChildren();
      for (const screen of catalog.filter(item => item.module === module)) {
        if (guest && !screen.profile_allowed) continue;
        const row = document.createElement('div');
        row.className = 'unified-user-screen-row';
        const label = document.createElement('label');
        const input = document.createElement('input');
        input.type = 'checkbox';
        input.value = screen.id;
        input.checked = Boolean(screen.checked);
        input.disabled = !screen.profile_allowed;
        input.dataset.module = module;
        input.dataset.roles = (screen.mapa_roles || []).join(',');
        input.dataset.screen = screen.id;
        input.className = 'unified-screen-view';
        label.append(input, document.createTextNode(' ' + screen.label));
        if (!screen.profile_allowed) label.title = 'O perfil não permite esta tela';
        row.append(label);
        if (guest && !quality) {
          const permissions = document.createElement('div');
          permissions.className = 'unified-guest-action-list';
          for (const [action, title] of guestActions) {
            const actionLabel = document.createElement('label');
            const actionInput = document.createElement('input');
            actionInput.type = 'checkbox';
            actionInput.value = action;
            actionInput.dataset.action = action;
            actionInput.checked = Boolean(screen.actions?.includes(action));
            actionInput.disabled = !input.checked;
            actionLabel.append(actionInput, document.createTextNode(' ' + title));
            permissions.append(actionLabel);
          }
          input.addEventListener('change', () => {
            permissions.querySelectorAll('input').forEach(actionInput => {
              actionInput.disabled = !input.checked;
              if (!input.checked) actionInput.checked = false;
            });
          });
          row.append(permissions);
        }
        screenTarget.append(row);
      }
      if (module === 'laboratorio') {
        const title = document.createElement('h5');
        title.textContent = 'Ações da Cronoanálise';
        section.append(title);
        const actions = document.createElement('div');
        actions.className = 'unified-quality-action-list';
        for (const [id, name, description] of cronoActionCopy) {
          const label = document.createElement('label');
          label.className = 'unified-quality-action-row';
          const input = document.createElement('input');
          input.type = 'checkbox'; input.value = id;
          input.className = 'unified-crono-action';
          input.checked = cronoGranted.has(id);
          input.addEventListener('change', () => {
            if (!input.checked) return;
            section.querySelectorAll('.unified-screen-view[data-screen^="cronoanalise."]')
              .forEach(screen => { if (!screen.disabled) screen.checked = true; });
          });
          const copy = document.createElement('span');
          const strong = document.createElement('strong'); strong.textContent = name;
          const small = document.createElement('small'); small.textContent = description;
          copy.append(strong, small); label.append(input, copy); actions.append(label);
        }
        section.append(actions);
      }
      if (quality) {
        section.querySelectorAll('.unified-screen-view,.unified-quality-action,.unified-quality-area')
          .forEach(input => input.addEventListener('change', () => {
            if (input.value === 'qualidade.nc.ver_area' && !input.checked)
              section.querySelectorAll('.unified-quality-area').forEach(area => { area.checked = false; });
            updateQualitySummary();
          }));
        section.querySelectorAll('[data-quality-preset]').forEach(button => {
          button.onclick = () => applyQualityPreset(button.dataset.qualityPreset);
        });
        updateQualitySummary();
      } else {
        heading.querySelector('[data-all]').addEventListener('click', () => {
          section.querySelectorAll('.unified-screen-view:not(:disabled)').forEach(input => {
            input.checked = true; input.dispatchEvent(new Event('change'));
          });
        });
        heading.querySelector('[data-none]').addEventListener('click', () => {
          section.querySelectorAll('.unified-screen-view').forEach(input => {
            input.checked = false; input.dispatchEvent(new Event('change'));
          });
        });
        wrap.append(section);
      }
    }
    modal.querySelector('[name="role"]').dispatchEvent(new Event('change'));
    modal.hidden = false;
    modal.querySelector('[name="name"]').focus();
  };
  modal.querySelector('[data-save]').addEventListener('click', async () => {
    if (!editing) return;
    const button = modal.querySelector('[data-save]');
    button.disabled = true;
    let stage = 'telas e dados do usuário';
    modal.querySelector('[data-error]').textContent = '';
    try {
      const screens = [...modal.querySelectorAll('.unified-screen-view:checked:not(:disabled)')]
        .map(input => input.value);
      if (editing.source === 'pcp') {
        await request('/pcp/' + editing.pcp_id + '/screens',
          {method:'PUT', body:JSON.stringify({screens,
            name: modal.querySelector('[name="name"]').value.trim(),
            map_role: modal.querySelector('[name="role"]').value,
            map_sector: modal.querySelector('[name="sector"]').value})});
      } else {
        const guest = Boolean(editing.guest || editing.role === 'CONVIDADO');
        const actions = guest ? Object.fromEntries(screens.map(id => {
          const view = [...modal.querySelectorAll('.unified-screen-view')].find(input => input.value === id);
          const grants = [...view.closest('.unified-user-screen-row').querySelectorAll('[data-action]:checked')]
            .map(input => input.value);
          return [id, ['view', ...grants]];
        })) : undefined;
        await request('/' + encodeURIComponent(editing.id), {method:'PATCH', body:JSON.stringify({
          name: modal.querySelector('[name="name"]').value.trim(),
          role: modal.querySelector('[name="role"]').value,
          sector: modal.querySelector('[name="sector"]').value, screens,
          ...(guest ? {actions} : {})
        })});
      }
      if (QUALITY_EDITOR_RELEASED && isQualityAdmin()) {
        stage = 'ações e áreas da Qualidade';
        const targetId = editing.source === 'pcp' ? 'unif-pcp-' + editing.pcp_id : editing.id;
        const actions = [...modal.querySelectorAll('.unified-quality-action:checked')]
          .map(input => input.value);
        const areas = [...modal.querySelectorAll('.unified-quality-area:checked')]
          .map(input => input.value);
        await request('/' + encodeURIComponent(targetId) + '/quality-actions',
          {method:'PUT', body:JSON.stringify({actions, areas})});
      }
      stage = 'ações da Cronoanálise';
      const cronoTargetId = editing.source === 'pcp' ? 'unif-pcp-' + editing.pcp_id : editing.id;
      const cronoActions = [...modal.querySelectorAll('.unified-crono-action:checked')]
        .map(input => input.value);
      await request('/' + encodeURIComponent(cronoTargetId) + '/crono-actions',
        {method:'PUT', body:JSON.stringify({actions: cronoActions})});
      stage = 'lista de usuários';
      await renderUsuarios();
      close();
      setUgFeedback('Usuário atualizado.', true);
    } catch (error) {
      modal.querySelector('[data-error]').textContent =
        `Falha ao salvar ${stage}: ${error.message}. As marcações continuam aqui para tentar novamente.`;
    }
    finally { button.disabled = false; }
  });

  renderUsuarios = async function () {
    if (!el.ugListaBody) return;
    el.ugListaBody.innerHTML = '<tr><td colspan="5">Carregando usuários…</td></tr>';
    let users;
    try { users = (await request()).users; }
    catch (error) {
      el.ugListaBody.innerHTML = '<tr><td colspan="5">Não foi possível carregar os usuários.</td></tr>';
      setUgFeedback(error.message, false);
      return;
    }
    state.usersCache = users;
    createGuestButton.hidden = !isMaster();
    el.ugListaBody.replaceChildren();
    for (const user of users) {
      const row = document.createElement('tr');
      const sector = user.source === 'mapa' && user.planning_role && user.planning_sector &&
        user.planning_sector !== (user.setor || 'Todos')
        ? `Produção: ${user.setor || 'Todos'} · Planejamento: ${user.planning_sector}`
        : (user.setor || user.planning_sector || 'Todos');
      const status = !user.active ? 'Inativa' : user.planning_active === false
        ? 'Ativa no Mapa · inativa no Planejamento' : 'Ativa';
      const identity = document.createElement('td');
      identity.className = 'unified-user-identity';
      const name = document.createElement('strong'); name.textContent = user.name;
      const login = document.createElement('small'); login.textContent = '@' + user.login;
      identity.append(name, login);
      if (user.guest) {
        const badge = document.createElement('small');
        badge.textContent = 'Convidado';
        identity.append(badge);
      }
      const roles = document.createElement('td');
      roles.className = 'unified-user-roles';
      for (const [label, value] of [
        ['PL', user.planning_role],
        ['PR', user.production_role ? getRoleConfig(user.production_role).label : null],
        ['LB', user.laboratory_role]
      ]) {
        if (!value) continue;
        const chip = document.createElement('span');
        chip.className = 'unified-user-role';
        chip.textContent = label + ' · ' + value;
        roles.append(chip);
      }
      if (!roles.childElementCount) roles.textContent = '—';
      const sectorCell = document.createElement('td'); sectorCell.textContent = sector;
      const statusCell = document.createElement('td');
      const statusBadge = document.createElement('span');
      statusBadge.className = 'unified-user-status' + (user.active ? '' : ' is-inactive');
      statusBadge.textContent = status;
      statusCell.append(statusBadge);
      row.append(identity, roles, sectorCell, statusCell);
      const actions = document.createElement('td');
      actions.className = 'unified-user-row-actions';
      const addButton = (text, onClick, disabled = false) => {
        const button = document.createElement('button');
        button.type = 'button'; button.textContent = text; button.disabled = disabled;
        button.addEventListener('click', async () => {
          button.disabled = true;
          try { await onClick(); }
          catch (error) { setUgFeedback(error.message, false); }
          finally { button.disabled = disabled; }
        });
        actions.append(button);
      };
      if (['user-ricardo', 'marcelo', 'alex'].includes(user.id)) {
        actions.textContent = 'Administrador master';
        row.append(actions);
        row.dataset.search = row.textContent.toLocaleLowerCase('pt-BR');
        el.ugListaBody.append(row);
        continue;
      }
      if (user.can_manage !== false) addButton('Editar', () => open(user));
      if (user.can_manage === false) {
        actions.textContent = 'Somente Master';
        row.append(actions);
        row.dataset.search = row.textContent.toLocaleLowerCase('pt-BR');
        el.ugListaBody.append(row);
        continue;
      }
      addButton('Redefinir senha', () => openReset(user), user.id === currentId());
      addButton(user.active ? 'Desativar' : 'Reativar', async () => {
        const action = user.active ? 'deactivate' : 'reactivate';
        if (user.source === 'pcp')
          await planningRequest('/' + user.pcp_id + '/action',
            {method:'POST', body:JSON.stringify({action})});
        else
          await request('/' + encodeURIComponent(user.id) + '/action',
            {method:'POST', body:JSON.stringify({action})});
        await renderUsuarios();
        setUgFeedback(user.active ? 'Conta desativada e sessões encerradas.' : 'Conta reativada.', true);
      }, user.id === currentId());
      addButton('Excluir', async () => {
        const typed = prompt(`Para excluir ${user.login}, digite o login exatamente:`);
        if (typed !== user.login) { setUgFeedback('Exclusão cancelada.', false); return; }
        if (user.source === 'pcp')
          await planningRequest('/' + user.pcp_id + '/action',
            {method:'POST', body:JSON.stringify({action:'delete',confirm_login:typed})});
        else
          await request('/' + encodeURIComponent(user.id) + '/action',
            {method:'POST', body:JSON.stringify({action:'delete',confirm_login:typed})});
        await renderUsuarios();
        setUgFeedback(`Conta ${user.login} excluída. O histórico foi preservado.`, true);
      }, user.id === currentId());
      row.append(actions);
      row.dataset.search = row.textContent.toLocaleLowerCase('pt-BR');
      row.hidden = Boolean(search.value.trim() &&
        !row.dataset.search.includes(search.value.trim().toLocaleLowerCase('pt-BR')));
      el.ugListaBody.append(row);
    }
  };
})();

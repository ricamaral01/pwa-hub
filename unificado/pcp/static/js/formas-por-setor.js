(() => {
  const STORAGE_KEY = 'unificado_pcp_formas_filtros_v1';
  const sectors = ['Todos', 'Setor 1', 'Setor 2', 'Setor 3', 'Setor 4'];
  const statuses = ['Ativas', 'Inativas', 'Todas'];
  const collator = new Intl.Collator('pt-BR', {numeric: true, sensitivity: 'base'});
  const state = {setor: 'Todos', situacao: 'Ativas', tipo: '', busca: ''};
  let allForms = [];
  let visibleForms = [];

  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    if (sectors.includes(saved.setor)) state.setor = saved.setor;
    if (statuses.includes(saved.situacao)) state.situacao = saved.situacao;
    if (typeof saved.tipo === 'string') state.tipo = saved.tipo;
    if (typeof saved.busca === 'string') state.busca = saved.busca;
  } catch {}

  const $ = selector => document.querySelector(selector);
  const node = (tag, className, value) => {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (value !== undefined) element.textContent = value;
    return element;
  };
  const normalize = value => String(value || '').normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('pt-BR');
  const save = () => localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  const count = forms => ({total: forms.length,
    active: forms.filter(form => form.situacao === 'Ativa').length,
    inactive: forms.filter(form => form.situacao === 'Inativa').length});

  function buildMenu() {
    const nav = $('#formas-menu');
    const user = (() => { try { return JSON.parse(localStorage.getItem('pcp_user') || 'null'); } catch { return null; } })();
    $('#formas-user').textContent = user ? `${user.nome || user.username} · ${user.nivel_acesso}` : '';
    const home = node('a', 'nav-link', 'Início');
    home.href = '/unificado/'; home.dataset.page = 'IN';
    nav.append(home);
    if (typeof MENU_CONFIG === 'undefined' || typeof MENU_ITEMS === 'undefined') return;
    const role = user?.nivel_acesso || 'CONSULTA';
    for (const group of MENU_CONFIG.planejamento.groups) {
      const box = node('div', 'nav-group open');
      if (group.label) box.append(node('div', 'nav-group-toggle', group.label));
      for (const item of group.items) {
        const config = MENU_ITEMS[item.id];
        const allowed = role === 'ADMIN' || !config.require ||
          (role === 'PCP' && config.require !== 'ADMIN') ||
          (role === 'PRODUCAO' && config.require === 'PRODUCAO');
        if (!allowed) continue;
        const link = node('a', 'nav-link' + (item.id === 'formasPorSetor' ? ' active' : ''), item.label);
        link.href = config.url;
        link.dataset.page = item.id;
        if (item.id === 'formasPorSetor') link.setAttribute('aria-current', 'page');
        box.append(link);
      }
      if (box.querySelector('a')) nav.append(box);
    }
    const toggle = $('#sidebar-toggle');
    const overlay = $('#sidebar-overlay');
    const close = () => { $('#sidebar').classList.remove('open'); overlay.classList.remove('show'); toggle.setAttribute('aria-expanded', 'false'); };
    toggle.addEventListener('click', () => {
      const open = $('#sidebar').classList.toggle('open');
      overlay.classList.toggle('show', open);
      toggle.setAttribute('aria-expanded', String(open));
    });
    overlay.addEventListener('click', close);
    nav.addEventListener('click', event => { if (event.target.closest('a')) close(); });
  }

  function segmented(target, values, selected, onSelect) {
    target.replaceChildren();
    for (const value of values) {
      const button = node('button', '', value);
      button.type = 'button';
      button.setAttribute('aria-pressed', String(value === selected));
      button.addEventListener('click', () => onSelect(value));
      target.append(button);
    }
  }

  function refreshControls() {
    segmented($('#filter-sector'), sectors, state.setor, value => {
      state.setor = value; save(); render();
    });
    segmented($('#filter-status'), statuses, state.situacao, value => {
      state.situacao = value; save(); render();
    });
    const types = [...new Set(allForms.map(form => form.tipo_forma).filter(Boolean))].sort(collator.compare);
    if (state.tipo && !types.includes(state.tipo) && state.tipo !== '__sem_tipo__') state.tipo = '';
    const typeSelect = $('#filter-type');
    typeSelect.replaceChildren(new Option('Todos os tipos', ''));
    for (const type of types) typeSelect.add(new Option(type, type));
    if (allForms.some(form => !form.tipo_forma)) typeSelect.add(new Option('Sem tipo cadastrado', '__sem_tipo__'));
    typeSelect.value = state.tipo;
    $('#filter-search').value = state.busca;
  }

  function matches(form) {
    if (state.setor !== 'Todos' && form.setor !== state.setor) return false;
    if (state.situacao === 'Ativas' && form.situacao !== 'Ativa') return false;
    if (state.situacao === 'Inativas' && form.situacao !== 'Inativa') return false;
    if (state.tipo && (state.tipo === '__sem_tipo__' ? Boolean(form.tipo_forma) : form.tipo_forma !== state.tipo)) return false;
    const query = normalize(state.busca.trim());
    return !query || normalize([form.codigo_forma, ...(form.produtos || [])].join(' ')).includes(query);
  }

  function summary() {
    const holder = $('#formas-summary');
    holder.replaceChildren();
    const current = count(visibleForms);
    const cards = [
      ['Total de formas', current.total, `${current.active} ativas · ${current.inactive} inativas`, true],
      ['Ativas', current.active, 'nos filtros atuais'],
      ['Inativas', current.inactive, 'nos filtros atuais'],
      ...sectors.slice(1).map(sector => {
        const value = count(visibleForms.filter(form => form.setor === sector));
        return [sector, value.total, `${value.active} ativas · ${value.inactive} inativas`];
      }),
    ];
    for (const [label, value, sub, primary] of cards) {
      const card = node('div', 'summary-card' + (primary ? ' is-total' : ''));
      card.append(node('small', '', label), node('strong', '', String(value)), node('span', '', sub));
      holder.append(card);
    }
  }

  function cell(row, value, className = '') {
    const td = node('td', className);
    if (value instanceof Node) td.append(value);
    else td.textContent = value == null || value === '' ? '—' : String(value);
    row.append(td);
    return td;
  }

  function formRow(form) {
    const row = node('tr');
    cell(row, form.codigo_forma, 'form-code');
    cell(row, form.tipo_forma || 'Não cadastrado');
    const products = node('div', 'product-list');
    if (form.produtos?.length) {
      for (const product of form.produtos) products.append(node('span', 'product-chip', product));
    } else products.textContent = 'Não cadastrado';
    const productCell = cell(row, products);
    if (form.compat_total != null) productCell.append(node('small', 'form-meta',
      `${form.compat_ativas} compatíveis ativas de ${form.compat_total}`));
    cell(row, form.codigos_produto?.join(', ') || '—');
    cell(row, form.volumes_m3?.map(value => Number(value).toLocaleString('pt-BR', {maximumFractionDigits: 3})).join(', ') || '—');
    const situation = node('div');
    situation.append(node('span', 'status-badge ' + (form.situacao === 'Ativa' ? 'is-active' : 'is-inactive'), form.situacao));
    situation.append(node('small', 'form-meta', form.fonte_situacao));
    cell(row, situation);
    cell(row, form.fonte_cadastro);
    return row;
  }

  function list() {
    const holder = $('#forms-list');
    holder.replaceChildren();
    $('#result-count').textContent = `${visibleForms.length} ${visibleForms.length === 1 ? 'forma' : 'formas'} nos filtros atuais`;
    if (!visibleForms.length) {
      holder.append(node('div', 'forms-empty', 'Nenhuma forma corresponde aos filtros.'));
      return;
    }
    for (const sector of sectors.slice(1)) {
      const sectorForms = visibleForms.filter(form => form.setor === sector);
      if (!sectorForms.length) continue;
      const section = node('section', 'form-sector');
      const head = node('div', 'form-sector-head');
      head.append(node('h3', '', sector), node('span', '', `${sectorForms.length} formas`));
      section.append(head);
      const groups = new Map();
      for (const form of sectorForms) {
        const type = form.tipo_forma || 'Tipo não cadastrado';
        if (!groups.has(type)) groups.set(type, []);
        groups.get(type).push(form);
      }
      for (const [type, forms] of [...groups].sort((a, b) => collator.compare(a[0], b[0]))) {
        forms.sort((a, b) => collator.compare(a.codigo_forma, b.codigo_forma));
        const title = node('div', 'form-type-head');
        title.append(node('h4', '', type), node('span', '', `${forms.length} formas`));
        section.append(title);
        const scroll = node('div', 'form-table-wrap');
        const table = node('table', 'form-table');
        const thead = node('thead'); const header = node('tr');
        for (const text of ['Código', 'Tipo de forma', 'O que produz', 'Cód. produto', 'Volume m³', 'Situação e origem', 'Cadastro']) header.append(node('th', '', text));
        thead.append(header);
        const tbody = node('tbody');
        for (const form of forms) tbody.append(formRow(form));
        table.append(thead, tbody); scroll.append(table); section.append(scroll);
      }
      holder.append(section);
    }
  }

  function render() {
    refreshControls();
    visibleForms = allForms.filter(matches);
    summary(); list();
    const missingType = allForms.filter(form => !form.tipo_forma).length;
    const missingProduct = allForms.filter(form => !form.produtos?.length).length;
    $('#field-note').textContent = `Tipo de forma: ${missingType} formas sem campo no cadastro de postes circulares/DT ou acessórios do PCP; poderia vir de uma classificação dessas formas no PCP. O que produz: ${missingProduct} formas sem produto ou poste no cadastro do PCP${missingProduct ? '; precisa ser preenchido no mapeamento correspondente.' : '.'}`;
  }

  function csvExport() {
    const columns = ['Setor', 'Código da forma', 'Tipo de forma', 'O que produz', 'Códigos de produto', 'Volumes m³', 'Situação', 'Origem da situação', 'Cadastro', 'Compatíveis ativas', 'Compatíveis total'];
    const quote = value => `"${String(value ?? '').replaceAll('"', '""')}"`;
    const rows = visibleForms.map(form => [form.setor, form.codigo_forma, form.tipo_forma || '',
      (form.produtos || []).join(' | '), (form.codigos_produto || []).join(' | '),
      (form.volumes_m3 || []).join(' | '), form.situacao, form.fonte_situacao,
      form.fonte_cadastro, form.compat_ativas ?? '', form.compat_total ?? '']);
    const blob = new Blob(['\ufeff', columns.map(quote).join(';'), '\r\n',
      ...rows.map(row => row.map(quote).join(';') + '\r\n')], {type: 'text/csv;charset=utf-8'});
    const url = URL.createObjectURL(blob);
    const link = node('a'); link.href = url; link.download = 'formas-por-setor-filtradas.csv';
    document.body.append(link); link.click(); link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  async function load() {
    const token = localStorage.getItem('pcp_token');
    const error = $('#forms-error');
    if (!token) {
      error.hidden = false;
      error.textContent = 'Entre no Planejamento para consultar Formas por Setor.';
      return;
    }
    try {
      const response = await fetch('/unificado/mapa/api/pcp/formas-por-setor', {
        headers: {Authorization: `Bearer ${token}`}, credentials: 'same-origin', cache: 'no-store',
      });
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.detail || `Não foi possível carregar as formas (${response.status}).`);
      }
      const data = await response.json();
      allForms = data.formas || [];
      error.hidden = true;
      $('#catalog-updated').textContent = 'Cadastro atual · consulta somente leitura';
      render();
    } catch (cause) {
      error.hidden = false;
      error.textContent = cause.message || 'Não foi possível carregar as formas.';
      $('#result-count').textContent = 'Dados indisponíveis';
    }
  }

  buildMenu();
  $('#filter-type').addEventListener('change', event => { state.tipo = event.target.value; save(); render(); });
  $('#filter-search').addEventListener('input', event => { state.busca = event.target.value; save(); render(); });
  $('#export-csv').addEventListener('click', csvExport);
  $('#print-list').addEventListener('click', () => window.print());
  refreshControls();
  load();
})();

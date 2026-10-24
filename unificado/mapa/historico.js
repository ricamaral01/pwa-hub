const API = new URL('api/', document.currentScript.src);
const ROOT = new URL('../', document.currentScript.src);
const TABLES = [
  { id:'producao', label:'Produção', order:'data_hora.desc', date:'data_fabricacao', columns:[['data_fabricacao','Data'],['setor','Setor'],['forma','Forma'],['modelo','Modelo'],['tipo_concreto','Concreto'],['status','Status'],['colaborador','Colaborador']] },
  { id:'montagem_poste', label:'Montagem', order:'updated_at.desc', date:'data_fabricacao', columns:[['data_fabricacao','Data'],['setor','Setor'],['forma_numero','Forma'],['modelo','Modelo'],['status_montagem','Status'],['montador_nome','Montador']] },
  { id:'programacao_pcp', label:'Programação PCP', order:'data_fabricacao.desc', date:'data_fabricacao', columns:[['data_fabricacao','Data'],['setor','Setor'],['forma','Forma'],['modelo','Modelo'],['codigo_poste','Código'],['quantidade','Quantidade']] },
  { id:'liberacao_formas', label:'Liberação de formas', order:'data_fabricacao.desc', date:'data_fabricacao', columns:[['data_fabricacao','Data'],['setor','Setor'],['forma','Forma'],['colaborador','Colaborador'],['data_hora','Registrado em']] },
  { id:'formas_manutencao', label:'Manutenção de formas', order:'updated_at.desc', columns:[['setor','Setor'],['forma_numero','Forma'],['status','Status'],['motivo_parada','Motivo'],['acao_necessaria','Ação necessária']] },
  { id:'prog_s3_s4', label:'Sequência S3 / S4', order:'data.desc', date:'data', columns:[['data','Data'],['setor','Setor'],['forma','Forma'],['modelo','Modelo'],['observacao','Observação']] }
];
const $ = (id) => document.getElementById(id);
let selected = TABLES[0];
let page = 0;
const PAGE_SIZE = 50;
const totals = new Map();

async function api(path, options={}) {
  const response = await fetch(new URL(path, API), { credentials:'same-origin', cache:'no-store', ...options });
  if (response.status === 401) { location.replace(new URL('login.html', ROOT)); throw new Error('Sessão encerrada.'); }
  if (!response.ok) throw new Error(`Falha ao consultar PostgreSQL (${response.status}).`);
  return response;
}

function paramsFor(table, withPage=true) {
  const params = new URLSearchParams();
  params.set('select', table.columns.map(([key]) => key).join(','));
  params.set('order', table.order);
  if (withPage) { params.set('limit', PAGE_SIZE); params.set('offset', page * PAGE_SIZE); }
  const start = $('date-start').value, end = $('date-end').value, sector = $('sector').value;
  if (table.date && start) params.set(table.date, `gte.${start}`);
  if (table.date && end) {
    if (start) params.append(table.date, `lte.${end}`);
    else params.set(table.date, `lte.${end}`);
  }
  if (sector) params.set('setor', `eq.${sector}`);
  return params;
}

async function loadTotals() {
  await Promise.all(TABLES.map(async (table) => {
    try {
      const response = await api(`rest/v1/${table.id}?select=id&limit=0`, { method:'HEAD', headers:{ Prefer:'count=exact' } });
      const range = response.headers.get('Content-Range') || '';
      totals.set(table.id, Number(range.split('/')[1]) || 0);
    } catch { totals.set(table.id, null); }
  }));
  const cards = $('history-cards');
  cards.replaceChildren();
  TABLES.forEach((table) => {
    const card = document.createElement('div'); card.className = 'history-card';
    const name = document.createElement('span'); name.textContent = table.label;
    const count = document.createElement('strong'); count.textContent = totals.get(table.id)?.toLocaleString('pt-BR') ?? '—';
    card.append(name,count); cards.append(card);
  });
}

async function loadTable() {
  $('table-title').textContent = selected.label;
  $('status').textContent = 'Carregando registros…';
  $('date-start').disabled = $('date-end').disabled = !selected.date;
  try {
    const response = await api(`rest/v1/${selected.id}?${paramsFor(selected).toString()}`);
    const rows = await response.json();
    const head = $('table-head'), body = $('table-body');
    head.replaceChildren(); body.replaceChildren();
    const trHead = document.createElement('tr');
    selected.columns.forEach(([,label]) => { const th = document.createElement('th'); th.textContent = label; trHead.append(th); });
    head.append(trHead);
    rows.forEach((row) => {
      const tr = document.createElement('tr');
      selected.columns.forEach(([key]) => { const td = document.createElement('td'); td.textContent = row[key] == null ? '—' : String(row[key]); tr.append(td); });
      body.append(tr);
    });
    $('status').textContent = rows.length ? `${rows.length} registros nesta página.` : 'Nenhum registro encontrado.';
    $('page-label').textContent = `Página ${page + 1}`;
    $('prev').disabled = page === 0; $('next').disabled = rows.length < PAGE_SIZE;
  } catch (error) { $('status').textContent = error.message; }
}

async function init() {
  try {
    const me = await (await api('me')).json();
    $('user-badge').textContent = `${me.user.name} · ${me.user.role}`;
  } catch { return; }
  const nav = $('tables-nav');
  TABLES.forEach((table) => {
    const button = document.createElement('button'); button.className = 'history-tab'; button.type = 'button'; button.textContent = table.label;
    button.addEventListener('click', () => { selected = table; page = 0; nav.querySelectorAll('button').forEach(x => x.classList.remove('active')); button.classList.add('active'); loadTable(); });
    nav.append(button);
  });
  nav.firstChild.classList.add('active');
  $('apply').addEventListener('click', () => { page = 0; loadTable(); });
  $('prev').addEventListener('click', () => { if (page > 0) { page--; loadTable(); } });
  $('next').addEventListener('click', () => { page++; loadTable(); });
  $('logout').addEventListener('click', async () => { await api('logout', { method:'POST' }); location.assign(new URL('login.html', ROOT)); });
  await Promise.all([loadTotals(), loadTable()]);
}
init();

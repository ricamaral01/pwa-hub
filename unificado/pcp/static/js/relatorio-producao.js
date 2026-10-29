const reportUser = requireAuth();
const fixedSector = document.body.dataset.reportSector || '';
if (reportUser) {
  initSidebar(fixedSector ? `relatorio-programacao-s${fixedSector}` : 'relatorio-producao');
  const topName = document.getElementById('user-nome-top');
  if (topName) topName.textContent = reportUser.nome;
}

const startInput = document.getElementById('report-start');
const daysInput = document.getElementById('report-days');
const sectorInput = document.getElementById('report-sector');
const hideEmptyInput = document.getElementById('report-hide-empty');
const ownerInput = document.getElementById('report-owner');
const statusEl = document.getElementById('report-status');
const days = ['dom.', 'seg.', 'ter.', 'qua.', 'qui.', 'sex.', 'sáb.'];
const productOrder = ['943','930','938','935','931','932','933','936','939','941','945','946','947','948','944','942','949','957','937','940','4031','4032','4764','13570','934','952','953','954','4765','4848','4929','5017'];
const number = value => Number(value || 0);
const fmtVolume = value => number(value).toLocaleString('pt-BR', {minimumFractionDigits: 1, maximumFractionDigits: 2});
const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'}[char]));

function parseDate(iso) {
  const [year, month, day] = iso.split('-').map(Number);
  return new Date(year, month - 1, day);
}

function isoDate(date) {
  const y = date.getFullYear();
  return `${y}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function monday(date) {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  return d;
}

function isoWeek(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  const first = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d - first) / 86400000) + 1) / 7);
}

function selectedRows(payload, calendar) {
  const sector = sectorInput.value;
  const programmed = (payload.linhas || []).filter(row =>
    sector === '12' ? ['1', '2'].includes(String(row.setor)) : String(row.setor) === sector
  );
  const keys = new Set(programmed.map(row => `${row.setor}:${String(row.codigo_producao || row.codigo_montagem || '').trim()}`));
  const catalog = (payload.catalog || []).filter(product =>
    sector === '12' ? ['1', '2'].includes(String(product.setor_id)) : String(product.setor_id) === sector
  );
  const emptyRows = catalog.filter(product => !keys.has(`${product.setor_id}:${String(product.codigo || '').trim()}`)).map(product => ({
    setor: product.setor_id,
    codigo_producao: product.codigo,
    descricao: product.nome,
    peso: product.peso,
    dias: {},
  }));
  const rows = [...programmed, ...emptyRows].filter(row =>
    !hideEmptyInput.checked || calendar.some(day => number(row.dias?.[day.data]?.programado) > 0)
  );
  return rows.sort((a, b) => {
    const aOrder = productOrder.indexOf(String(a.codigo_producao || a.codigo_montagem || ''));
    const bOrder = productOrder.indexOf(String(b.codigo_producao || b.codigo_montagem || ''));
    if (aOrder !== bOrder) return (aOrder < 0 ? 999 : aOrder) - (bOrder < 0 ? 999 : bOrder);
    const byDescription = String(a.descricao || '').localeCompare(String(b.descricao || ''), 'pt-BR');
    return byDescription || String(a.codigo_producao || '').localeCompare(String(b.codigo_producao || ''), 'pt-BR');
  });
}

function render(payload) {
  const allDays = payload.dias || [];
  const owner = ownerInput.value.trim() || 'Responsável';
  const pages = [];
  for (let index = 0; index < allDays.length; index += 6) {
    const calendar = allDays.slice(index, index + 6);
    const rows = selectedRows(payload, calendar);
    const start = parseDate(calendar[0].data);
    const month = start.toLocaleDateString('pt-BR', {month:'short', year:'2-digit'}).replace('.', '');
    const today = new Date().toLocaleDateString('pt-BR', {day:'2-digit', month:'2-digit'});
    const head = `<tr><th class="owner" colspan="3"></th><th class="owner" colspan="${calendar.length}">${escapeHtml(owner)}</th></tr>` +
      '<tr><th rowspan="2">Descrição P. Circular</th><th rowspan="2">Cod. Prod.</th><th rowspan="2">Peso</th>' +
      calendar.map(day => `<th>${days[parseDate(day.data).getDay()]}</th>`).join('') + '</tr>' +
      '<tr>' + calendar.map(day => `<th>${escapeHtml(day.rotulo)}</th>`).join('') + '</tr>' +
      '<tr><th colspan="3" class="volume-label">m³</th>' +
      calendar.map(day => {
        const volume = rows.reduce((sum, row) => sum + number(row.dias?.[day.data]?.volume_programado), 0);
        const incomplete = number(payload.volume_pendente_por_dia?.[day.data]);
        return `<th class="volume-cell" title="${incomplete ? `${incomplete} peça(s) sem volume cadastrado` : ''}">${incomplete ? '—' : (volume ? fmtVolume(volume) : '0,0')}</th>`;
      }).join('') + '</tr>';
    const body = rows.length ? rows.map(row => {
      const cells = calendar.map(day => {
        const qty = number(row.dias?.[day.data]?.programado);
        return `<td class="qty">${qty ? qty.toLocaleString('pt-BR') : ''}</td>`;
      }).join('');
      return `<tr><td class="desc">${escapeHtml(row.descricao || '')}</td><td class="code-cell">${escapeHtml(row.codigo_producao || row.codigo_montagem || '')}</td><td class="weight-cell">${number(row.peso) ? number(row.peso).toLocaleString('pt-BR', {maximumFractionDigits: 1}) : ''}</td>${cells}</tr>`;
    }).join('') : `<tr><td colspan="${3 + calendar.length}" class="empty">Nenhuma programação encontrada para este setor e período.</td></tr>`;
    const foot = '<tr class="total-row"><td colspan="3">Total</td>' +
      calendar.map(day => `<td>${rows.reduce((sum, row) => sum + number(row.dias?.[day.data]?.programado), 0).toLocaleString('pt-BR')}</td>`).join('') + '</tr>';
    pages.push(`<div class="report-paper">
      <table class="report-meta" aria-label="Identificação do relatório"><tbody>
        <tr><td class="logo" rowspan="4"><img src="/unificado/pcp/static/img/logo-concrefer-relatorio.png" alt="Concrefer" /></td><td class="meta-label">Código:</td><td class="meta-period">${escapeHtml(month)}</td><td class="meta-label">Rev.</td><td class="meta-yellow">Digitar Data</td><td class="meta-yellow">${today}</td></tr>
        <tr><td class="meta-label">FL - PRO - 15</td><td class="meta-title" rowspan="3">Programação de Produção - Poste Padrão</td><td class="meta-label">2</td><td class="meta-green" colspan="2">Semana ${isoWeek(start)}</td></tr>
        <tr><td class="meta-label">Data da emissão</td><td class="meta-label">Data da Rev.:</td><td colspan="2"></td></tr>
        <tr><td><strong>01/03/07</strong></td><td><strong>22/05/23</strong></td><td colspan="2"></td></tr>
      </tbody></table>
      <table class="report-grid" aria-label="Programação de produção"><colgroup><col style="width:28%"/><col style="width:13%"/><col style="width:7%"/>${calendar.map(() => `<col style="width:${52 / calendar.length}%"/>`).join('')}</colgroup><thead>${head}</thead><tbody>${body}</tbody><tfoot>${foot}</tfoot></table>
    </div>`);
  }
  document.getElementById('report-pages').innerHTML = pages.join('');
  const missing = Object.values(payload.volume_pendente_por_dia || {}).reduce((sum, value) => sum + number(value), 0);
  statusEl.textContent = `${pages.length} página(s) • ${allDays[0]?.rotulo || ''} a ${allDays.at(-1)?.rotulo || ''} • ${sectorInput.options[sectorInput.selectedIndex].text}` +
    (missing ? ` • ${missing} peça(s) sem volume cadastrado; m³ desses dias indicado por —` : '');
}

let currentPayload = null;
async function loadReport() {
  if (!startInput.value) return;
  const count = Number(daysInput.value);
  const max = ['3', '4'].includes(sectorInput.value) ? 90 : 31;
  if (!Number.isInteger(count) || count < 1 || count > max) {
    showToast(`Informe de 1 a ${max} dias para este setor.`, 'warning');
    return;
  }
  const start = ['3', '4'].includes(sectorInput.value) ? parseDate(startInput.value) : monday(parseDate(startInput.value));
  startInput.value = isoDate(start);
  statusEl.textContent = 'Carregando relatório...';
  try {
    if (['3', '4'].includes(sectorInput.value)) {
      currentPayload = await API.get(`/api/programacao-circular-s${sectorInput.value}/relatorio?data_inicio=${encodeURIComponent(startInput.value)}&dias=${count}`);
    } else {
      const [daily, products1, products2] = await Promise.all([
        API.get(`/api/pcp-diario?data_inicio=${encodeURIComponent(startInput.value)}&dias=${count}&apenas_oficial=true`),
        API.get('/api/produtos?setor_id=1'),
        API.get('/api/produtos?setor_id=2'),
      ]);
      currentPayload = {...daily, catalog: [...products1, ...products2]};
    }
    render(currentPayload);
  } catch (error) {
    statusEl.textContent = 'Não foi possível carregar o relatório.';
    showToast(error.message || 'Erro ao carregar o relatório', 'error');
  }
}

const query = new URLSearchParams(window.location.search);
if (!fixedSector && ['3', '4'].includes(query.get('setor'))) {
  const target = new URL(`/unificado/pcp/relatorio-programacao-s${query.get('setor')}/`, window.location.origin);
  for (const key of ['inicio', 'dias']) if (query.has(key)) target.searchParams.set(key, query.get(key));
  window.location.replace(target);
}
startInput.value = query.get('inicio') || isoDate(monday(new Date()));
if (fixedSector) sectorInput.value = fixedSector;
else if (['1', '2', '12'].includes(query.get('setor'))) sectorInput.value = query.get('setor');
if (query.get('dias')) daysInput.value = query.get('dias');
ownerInput.value = localStorage.getItem('pcp_report_owner') || reportUser?.nome || '';
ownerInput.addEventListener('input', () => {
  localStorage.setItem('pcp_report_owner', ownerInput.value);
  if (currentPayload) render(currentPayload);
});
sectorInput.addEventListener('change', loadReport);
hideEmptyInput.addEventListener('change', () => { if (currentPayload) render(currentPayload); });
document.getElementById('report-load').addEventListener('click', loadReport);
document.getElementById('report-print').addEventListener('click', () => window.print());
startInput.addEventListener('change', loadReport);
daysInput.addEventListener('change', loadReport);
if (reportUser) loadReport();

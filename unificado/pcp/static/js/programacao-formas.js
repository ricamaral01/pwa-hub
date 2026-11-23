const circularSector = document.body.dataset.circularSector || '3';
const circularApi = `/api/programacao-circular-s${circularSector}`;
const circularUser = requireAuth();
if (circularUser) {
  initSidebar(`programacao-circular-s${circularSector}`);
  const topName = document.getElementById('user-nome-top');
  if (topName) topName.textContent = circularUser.nome;
}

const startInput = document.getElementById('start-date');
const daysInput = document.getElementById('days-count');
const dayInput = document.getElementById('selected-day');
const statusEl = document.getElementById('circular-status');
const state = { forms: [], dates: [], rows: new Map(), base: new Map(), cleared: new Set(), mode: 'periodo', loading: false };
const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'}[char]));

function parseDate(iso) {
  const [year, month, day] = iso.split('-').map(Number);
  return new Date(year, month - 1, day);
}

function isoDate(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function fmtDate(iso) {
  return parseDate(iso).toLocaleDateString('pt-BR', {weekday:'short', day:'2-digit', month:'2-digit'});
}

function periodDates() {
  const days = Number(daysInput.value);
  if (!startInput.value || !Number.isInteger(days) || days < 1 || days > 90) {
    throw new Error('Informe uma data de início e de 1 a 90 dias seguidos.');
  }
  const start = parseDate(startInput.value);
  return Array.from({length:days}, (_, offset) => {
    const date = new Date(start);
    date.setDate(start.getDate() + offset);
    return isoDate(date);
  });
}

function rowKey(day, form) { return `${day}:${form}`; }

function deriveBase() {
  state.base.clear();
  for (const form of state.forms) {
    const regular = state.dates.map(day => state.rows.get(rowKey(day, form.codigo_forma)))
      .filter(row => row && row.origem !== 'excecao');
    const frequency = new Map();
    regular.forEach(row => frequency.set(row.modelo, (frequency.get(row.modelo) || 0) + 1));
    const model = [...frequency.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];
    if (model) state.base.set(form.codigo_forma, model);
  }
  state.cleared.clear();
}

function renderStatus(message) {
  if (message) { statusEl.textContent = message; return; }
  if (state.mode === 'dia') {
    const count = state.forms.filter(form => state.rows.has(rowKey(dayInput.value, form.codigo_forma))).length;
    statusEl.textContent = `${fmtDate(dayInput.value)} • ${count} formas programadas. Clique em outro modelo para criar uma exceção; clique no modelo selecionado para deixar a forma sem produção nesse dia.`;
  } else {
    statusEl.textContent = `${state.base.size} de ${state.forms.length} formas selecionadas • ${state.dates.length} dias consecutivos. Salve o período para gravar ${state.base.size * state.dates.length} alocações no banco.`;
  }
}

function renderGrid() {
  document.getElementById('forms-head').innerHTML = '<tr>' + state.forms.map(form =>
    `<th class="${form.aviso ? 'warn' : ''}" title="${esc(form.aviso || '')}"><span class="form-code">${esc(form.codigo_forma)}</span>${form.aviso ? `<span class="form-status">${esc(form.aviso)}</span>` : ''}</th>`
  ).join('') + '</tr>';
  const maxRows = Math.max(0, ...state.forms.map(form => form.modelos.length));
  document.getElementById('forms-body').innerHTML = Array.from({length:maxRows}, (_, rowIndex) => '<tr>' + state.forms.map(form => {
    const option = form.modelos[rowIndex];
    if (!option) return '<td class="empty"></td>';
    const selected = state.mode === 'dia'
      ? state.rows.get(rowKey(dayInput.value, form.codigo_forma))
      : {modelo:state.base.get(form.codigo_forma)};
    const active = selected?.modelo === option.nome;
    const css = active ? (state.mode === 'dia' && selected?.origem === 'excecao' ? 'exception' : 'selected') : '';
    const volumeHint = option.volume ? ` • ${option.volume.toLocaleString('pt-BR')} m³` : ' • volume não cadastrado';
    return `<td><button type="button" class="model-button ${css}" data-form="${esc(form.codigo_forma)}" data-model="${esc(option.nome)}" title="${esc(form.codigo_forma + ' — ' + option.nome + volumeHint)}" aria-pressed="${active}">${esc(option.nome)}</button></td>`;
  }).join('') + '</tr>').join('');
  renderStatus();
}

function fillDaySelector() {
  const old = dayInput.value;
  dayInput.innerHTML = state.dates.map(day => `<option value="${day}">${esc(fmtDate(day))}</option>`).join('');
  dayInput.value = state.dates.includes(old) ? old : state.dates[0];
}

async function loadPeriod() {
  let dates;
  try { dates = periodDates(); }
  catch (error) { showToast(error.message, 'warning'); return; }
  statusEl.textContent = 'Carregando formas e programação...';
  state.loading = true;
  try {
    const [forms, assignments] = await Promise.all([
      API.get(`${circularApi}/catalogo`),
      API.get(`${circularApi}?data_inicio=${dates[0]}&dias=${dates.length}`),
    ]);
    state.forms = forms;
    state.dates = dates;
    state.rows = new Map(assignments.map(row => [rowKey(row.data, row.codigo_forma), row]));
    deriveBase();
    fillDaySelector();
    renderGrid();
  } catch (error) {
    renderStatus('Não foi possível carregar o quadro.');
    showToast(error.message || 'Erro ao carregar a programação', 'error');
  } finally { state.loading = false; }
}

async function selectModel(form, model) {
  if (state.loading) return;
  if (state.mode === 'periodo') {
    if (state.base.get(form) === model) {
      state.base.delete(form);
      state.cleared.add(form);
    } else {
      state.base.set(form, model);
      state.cleared.delete(form);
    }
    renderGrid();
    return;
  }
  const day = dayInput.value;
  if (!day) return;
  state.loading = true;
  try {
    const current = state.rows.get(rowKey(day, form));
    if (current?.modelo === model) {
      await API.delete(`${circularApi}/dia?data=${day}&codigo_forma=${encodeURIComponent(form)}`);
      state.rows.delete(rowKey(day, form));
      showToast(`${form} sem produção em ${fmtDate(day)}`, 'success');
    } else {
      const saved = await API.patch(`${circularApi}/dia`, {data:day, codigo_forma:form, modelo:model});
      state.rows.set(rowKey(day, form), saved);
      showToast(`${form}: ${model} salvo em ${fmtDate(day)}`, 'success');
    }
    renderGrid();
  } catch (error) {
    showToast(error.message || 'Não foi possível salvar a exceção', 'error');
  } finally { state.loading = false; }
}

async function savePeriod() {
  if (state.loading || !state.forms.length) return;
  let dates;
  try { dates = periodDates(); }
  catch (error) { showToast(error.message, 'warning'); return; }
  if (dates[0] !== state.dates[0] || dates.length !== state.dates.length) {
    showToast('Carregue o período após alterar a data ou os dias.', 'warning');
    return;
  }
  const selecoes = [...state.base].map(([codigo_forma, modelo]) => ({codigo_forma, modelo}));
  if (!selecoes.length && !state.cleared.size) {
    showToast('Selecione ao menos uma forma.', 'warning');
    return;
  }
  state.loading = true;
  let saved = false;
  try {
    const result = await API.post(`${circularApi}/periodo`, {
      data_inicio:dates[0], dias:dates.length, selecoes, limpar_formas:[...state.cleared],
    });
    showToast(`${result.criados} criadas, ${result.atualizados} atualizadas, ${result.removidos} removidas. Exceções preservadas: ${result.excecoes_preservadas}.`, 'success', 5500);
    saved = true;
  } catch (error) {
    showToast(error.message || 'Não foi possível salvar o período', 'error');
  } finally {
    state.loading = false;
    if (saved) await loadPeriod();
  }
}

document.getElementById('forms-body').addEventListener('click', event => {
  const button = event.target.closest('button[data-form][data-model]');
  if (button) selectModel(button.dataset.form, button.dataset.model);
});
document.querySelectorAll('input[name="edit-mode"]').forEach(radio => radio.addEventListener('change', () => {
  state.mode = radio.value;
  dayInput.disabled = state.mode !== 'dia';
  renderGrid();
}));
dayInput.addEventListener('change', renderGrid);
document.getElementById('load-period').addEventListener('click', loadPeriod);
document.getElementById('save-period').addEventListener('click', savePeriod);
document.getElementById('print-period').addEventListener('click', () => {
  const day = startInput.value;
  if (day) window.open(`/unificado/pcp/relatorio-programacao-s${circularSector}/?inicio=${encodeURIComponent(day)}&dias=${encodeURIComponent(daysInput.value)}`, '_blank', 'noopener');
});
startInput.value = isoDate(new Date());
if (circularUser) loadPeriod();

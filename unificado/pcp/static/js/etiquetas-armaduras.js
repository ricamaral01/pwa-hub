const armUser = requireAuth();
if (armUser) {
  initSidebar('etiquetas-armaduras');
  document.getElementById('user-nome-top').textContent = armUser.nome || '';
  document.getElementById('user-nivel').textContent = armUser.nivel_acesso || '';
}

const startInput = document.getElementById('arm-start');
const daysInput = document.getElementById('arm-days');
const listEl = document.getElementById('arm-list');
const sheetEl = document.getElementById('arm-sheet');
const statusEl = document.getElementById('arm-status');
const countEl = document.getElementById('arm-count');
let assigned = [];
let templatesByModel = new Map();
let grouped = new Map();

function normalizeModel(value) {
  return String(value || '').replace(/×/g, 'X').toUpperCase().replace(/\s*X\s*/g, 'X').replace(/\s+/g, ' ').trim();
}

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
}

function optionLabel(template) {
  const details = [template.variante || 'Sem variante',template.peso_texto ? `Peso ${template.peso_texto}` : 'Peso não informado',`ficha ${template.source_index}`];
  return details.join(' • ');
}

function renderList() {
  const groups = [...grouped.entries()].sort((a,b) => a[0].localeCompare(b[0],'pt-BR',{numeric:true}));
  countEl.textContent = `${groups.length} modelo(s) • ${assigned.length} peça(s)`;
  if (!groups.length) {
    listEl.innerHTML = '<div class="arm-empty">Nenhuma forma programada para o período.</div>';
    return;
  }
  listEl.innerHTML = groups.map(([model,rows]) => {
    const templates = templatesByModel.get(model) || [];
    const forms = [...new Set(rows.map(row => row.codigo_forma))].join(', ');
    const options = templates.length > 1 ? '<option value="">Escolha a ficha do Word</option>' : '';
    const selector = templates.length
      ? `<select class="form-select form-select-sm arm-template" data-model="${escapeHtml(model)}">${options}${templates.map(template => `<option value="${template.id}">${escapeHtml(optionLabel(template))}</option>`).join('')}</select>`
      : '<span class="text-danger">Sem ficha correspondente no Word</span>';
    return `<div class="arm-row${templates.length ? '' : ' missing'}">
      <input type="checkbox" class="form-check-input arm-check" data-model="${escapeHtml(model)}" ${templates.length ? 'checked' : 'disabled'} aria-label="Incluir ${escapeHtml(model)}" />
      <div><strong>SC ${escapeHtml(model)}</strong><small>Formas: ${escapeHtml(forms)}</small></div>
      ${selector}
      <span class="qty">${rows.length}x</span>
    </div>`;
  }).join('');
}

async function loadArmaduras() {
  const start = startInput.value;
  const days = Number(daysInput.value);
  if (!start || !Number.isInteger(days) || days < 1 || days > 30) {
    showToast('Informe uma data e de 1 a 30 dias.', 'warning');
    return;
  }
  statusEl.textContent = 'Carregando programação e fichas...';
  listEl.innerHTML = '<div class="arm-empty">Carregando...</div>';
  sheetEl.innerHTML = '<div class="arm-empty no-print">Selecione as fichas e gere as etiquetas.</div>';
  try {
    const [schedule,templates] = await Promise.all([
      API.get(`/api/programacao-circular-s3?data_inicio=${encodeURIComponent(start)}&dias=${days}`),
      API.get('/api/etiquetas-armaduras/modelos'),
    ]);
    assigned = schedule;
    templatesByModel = new Map();
    for (const template of templates) {
      const key = normalizeModel(template.modelo);
      if (!templatesByModel.has(key)) templatesByModel.set(key,[]);
      templatesByModel.get(key).push(template);
    }
    grouped = new Map();
    for (const row of assigned) {
      const key = normalizeModel(row.modelo);
      if (!grouped.has(key)) grouped.set(key,[]);
      grouped.get(key).push(row);
    }
    renderList();
    const missing = [...grouped.keys()].filter(model => !templatesByModel.has(model));
    statusEl.textContent = `${assigned.length} forma(s) programadas em ${days} dia(s)` + (missing.length ? ` • ${missing.length} modelo(s) sem ficha no Word` : '');
  } catch (error) {
    statusEl.textContent = 'Não foi possível carregar os dados.';
    listEl.innerHTML = '<div class="arm-empty text-danger">Erro ao carregar programação ou fichas.</div>';
    showToast(error.message || 'Erro ao carregar etiquetas', 'error');
  }
}

function renderLabel(template, row) {
  const lines = [
    template.engastamento && `ENGASTAMENTO: ${template.engastamento}`,
    template.cg && `CG: ${template.cg}`,
    template.entrada_pino && `ENTRADA PINO: ${template.entrada_pino}`,
    template.saida_pino && `SAÍDA PINO: ${template.saida_pino}`,
  ].filter(Boolean);
  return `<div class="arm-preview-card"><div class="arm-preview-meta">${escapeHtml(row.data)} • ${escapeHtml(row.codigo_forma)} • Ficha ${template.source_index}</div>
    <article class="arm-label"><div class="arm-title">${escapeHtml(template.titulo)}</div>
      ${lines.map(line => `<div class="arm-field">${escapeHtml(line)}</div>`).join('')}
      ${template.peso_texto ? `<div class="arm-weight">PESO: ${escapeHtml(template.peso_texto)}</div>` : ''}
      <div class="arm-form">FORMA DE PRODUÇÃO: ${escapeHtml(row.codigo_forma)}</div>
    </article></div>`;
}

async function loadWordSource() {
  try {
    const source = await API.get('/api/etiquetas-armaduras/fonte');
    document.getElementById('arm-source').textContent = source.consistente
      ? `Word guardado no banco: ${source.nome_arquivo} · ${source.modelos} fichas · revisão ${source.sha256.slice(0, 12)}`
      : 'O arquivo Word precisa ser guardado no banco para conferir a revisão das fichas.';
  } catch (error) {
    document.getElementById('arm-source').textContent = 'Não foi possível conferir a revisão do Word.';
  }
}

async function uploadWord() {
  const file = document.getElementById('arm-word').files[0];
  if (!file) return showToast('Selecione o Word completo das armaduras.', 'warning');
  const button = document.getElementById('arm-upload');button.disabled = true;
  try {
    const response = await fetch(`/unificado/pcp/api/etiquetas-armaduras/word?filename=${encodeURIComponent(file.name)}`, {
      method: 'PUT', headers: {'Authorization': `Bearer ${API.getToken()}`,
        'X-Unificado-Screen': 'etiquetasArmaduras',
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'},
      body: file,
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.detail || `Falha ${response.status}`);
    showToast(result.atualizado ? `${result.modelos} fichas atualizadas pelo Word.` : 'Esta versão do Word já está em uso.', 'success');
    await loadWordSource();
    await loadArmaduras();
  } catch (error) {
    showToast(error.message || 'Não foi possível atualizar o Word.', 'error');
  } finally {button.disabled = false;}
}

function generateArmaduras() {
  const chosen = [...document.querySelectorAll('.arm-check:checked')];
  if (!chosen.length) {
    showToast('Selecione ao menos um modelo com ficha disponível.', 'warning');
    return false;
  }
  const labels = [];
  for (const input of chosen) {
    const model = input.dataset.model;
    const selector = [...document.querySelectorAll('.arm-template')].find(select => select.dataset.model === model);
    const template = (templatesByModel.get(model) || []).find(item => String(item.id) === selector?.value);
    if (!template) {
      showToast(`Escolha a ficha para SC ${model}.`, 'warning');
      selector?.focus();
      return false;
    }
    for (const row of grouped.get(model) || []) labels.push(renderLabel(template,row));
  }
  sheetEl.innerHTML = labels.join('');
  statusEl.textContent = `${labels.length} etiqueta(s) prontas para impressão.`;
  return true;
}

const today = new Date();
startInput.value = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`;
document.getElementById('arm-load').addEventListener('click',loadArmaduras);
document.getElementById('arm-generate').addEventListener('click',generateArmaduras);
document.getElementById('arm-print').addEventListener('click',() => {
  if (!generateArmaduras()) return;
  window.print();
});
document.getElementById('arm-upload').addEventListener('click',uploadWord);
if (armUser) {
  document.getElementById('arm-word-controls').hidden = armUser.nivel_acesso !== 'ADMIN';
  loadWordSource();
  loadArmaduras();
}

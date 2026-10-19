let user;
let programacaoDisponivel = [];
const etiquetasSC = document.body.dataset.labelMode === 'sc';

document.addEventListener('DOMContentLoaded', () => {
  user = requireAuth();
  if (!user) return;
  initSidebar(etiquetasSC ? 'etiquetas-sc' : 'etiquetas');
  document.getElementById('user-nome-top').textContent = user.nome || '';
  document.getElementById('user-nivel').textContent = user.nivel_acesso || '';
  document.getElementById('f-data').value = new Date().toISOString().slice(0, 10);
  loadPostesProgramados();
});

function fmtDateBR(iso) {
  const [y, m, d] = String(iso || '').split('-');
  return y && m && d ? `${d}/${m}/${String(y).slice(-2)}` : '';
}

function escapeHtml(value) {
  const div = document.createElement('div');
  div.textContent = value ?? '';
  return div.innerHTML;
}

function inferCodigoForma(row) {
  if (etiquetasSC) return String(row.modelo_sc || '').trim().replace(/^SC(?=[\s-]|\d)[\s-]*/i, '').trim();
  const produto = row.produto || {};
  const codigo = String(produto.codigo || '').trim().toUpperCase();
  const nome = String(produto.nome || produto.nome_poste || '').trim().toUpperCase();
  const forma = String(row.codigo_forma || '').trim().toUpperCase();
  const codigoProdutoParaForma = {
    '4031': 'AE',
    '4032': 'CE',
    '957': 'BD',
    '948': 'L',
    '946': 'H',
    '944': 'C',
    '943': 'C',
    '938': 'A',
    '931': 'EC',
    '932': 'EC',
    '933': 'EC'
  };

  if (forma && /[A-Z]/.test(forma) && !/^S\d+-\d+/i.test(forma)) {
    const compact = forma.replace(/\s+/g, '');
    const prefix = compact.match(/^[A-Z]+/);
    return prefix ? prefix[0].slice(0, 8) : compact.slice(0, 10);
  }
  if (codigoProdutoParaForma[codigo]) {
    return codigoProdutoParaForma[codigo];
  }
  if (/ECON|EC\./.test(nome)) return 'EC';
  if (/ELEKTRO.*1\s*CX\s*VR|1\s*CX\s*VR.*ELEKTRO/.test(nome)) return 'AE';
  if (/ELEKTRO.*2\s*CX\s*VR|2\s*CX\s*VR.*ELEKTRO/.test(nome)) return 'CE';
  if (/EDP.*1\s*CX\s*VL|1\s*CX\s*VL.*EDP/.test(nome)) return 'BD';
  if (/4\s*CXS?\s*VR|4\s*CX\s*VR/.test(nome)) return 'L';
  if (/1\s*CX\s*VR/.test(nome)) return 'A';
  if (/2\s*CXS?\s*VR|2\s*CX\s*VR/.test(nome)) return 'C';
  if (/3\s*CXS?\s*VR|3\s*CX\s*VR/.test(nome)) return 'H';
  if (forma) {
    const compact = forma.replace(/[^A-Z0-9-]/g, '');
    return compact.slice(0, 10) || forma;
  }
  const fonte = codigo || nome;
  if (!fonte) return '—';
  return fonte
    .replace(/^POSTE\s+/, '')
    .replace(/^PADRAO\s+/, '')
    .split(/\s+/)[0]
    .replace(/[^A-Z0-9-]/g, '')
    .slice(0, 8) || '—';
}

function calcularFonteForma(codigo, fontePadrao) {
  const texto = String(codigo || '');
  let size = texto.length <= 3 ? fontePadrao : texto.length <= 5 ? Math.min(fontePadrao, 24.2) : texto.length <= 8 ? Math.min(fontePadrao, 17.6) : Math.min(fontePadrao, 13.2);
  const context = document.createElement('canvas').getContext('2d');
  const pxPerMm = 96 / 25.4;
  context.font = `900 ${size * pxPerMm}px Arial`;
  const textWidth = context.measureText(texto).width;
  const maxWidth = (etiquetasSC ? 89 : 36) * pxPerMm;
  if (textWidth > maxWidth) size *= maxWidth / textWidth;
  return Number(size.toFixed(2));
}

function escalaHorizontal(texto, fonteMm, larguraMm) {
  const context = document.createElement('canvas').getContext('2d');
  const pxPerMm = 96 / 25.4;
  context.font = `900 ${fonteMm * pxPerMm}px Arial`;
  return Math.min(1, larguraMm * pxPerMm / context.measureText(texto).width).toFixed(3);
}

async function buscarProgramacao(data, setor) {
  if (etiquetasSC) {
    const [saques, production, schedule] = await Promise.all([
      API.get(`/api/saques-mandril?data=${encodeURIComponent(data)}`),
      API.get(`/api/producao/circular-formas?data_inicio=${encodeURIComponent(data)}&data_fim=${encodeURIComponent(data)}`).catch(() => []),
      API.get(`/api/programacao-circular-s3?data_inicio=${encodeURIComponent(data)}&dias=1`).catch(() => []),
    ]);
    const formKey = value => `SC${String(Number(String(value || '').toUpperCase().replace(/^SC0*/, ''))).padStart(2, '0')}`;
    const byForm = new Map(schedule.map(row => [formKey(row.codigo_forma), row.modelo]));
    const produced = new Map(production.filter(row => Number(row.realizado || 0) > 0).map(row => [formKey(row.forma), row]));
    const rows = saques.map(saque => {
      const form = formKey(saque.codigo_forma);
      const productionRow = produced.get(form);
      const fromProduction = String(productionRow?.tipo_realizado || '').trim();
      const model = fromProduction && !/^SC$/i.test(fromProduction) ? fromProduction : (byForm.get(form) || productionRow?.tipo_programado || '');
      const cleanModel = model.replace(/^SC(?=[\s-]|\d)[\s-]*/i, '').trim().replace(/×/g, 'X').toUpperCase();
      return {
        quantidade_programada: 1,
        codigo_forma: form,
        modelo_sc: cleanModel,
        produto: {nome: cleanModel},
        setor_id: 3,
        setor: {nome: 'Setor 3'},
      };
    }).filter(row => row.modelo_sc);
    if (rows.length < saques.length) showToast(`${saques.length - rows.length} forma(s) com saque sem modelo identificado.`, 'warning');
    return rows;
  }
  const buildQuery = (setorId) => {
    const qs = new URLSearchParams();
    qs.set('data_inicio', data);
    qs.set('data_fim', data);
    if (setorId) qs.set('setor_id', setorId);
    return qs.toString();
  };
  if (setor) return API.get(`/api/programacao?${buildQuery(setor)}`);
  return (await Promise.all(['1', '2', '3', '4'].map(s => API.get(`/api/programacao?${buildQuery(s)}`)))).flat();
}

function resetResumo() {
  document.getElementById('sum-itens').textContent = '0';
  document.getElementById('sum-postes').textContent = '0';
  document.getElementById('sum-etiquetas').textContent = '0';
  document.getElementById('labels-actions').style.setProperty('display', 'none', 'important');
}

function renderPostesProgramados(rows) {
  const container = document.getElementById('postes-output');
  const ativos = rows.filter(r => Number(r.quantidade_programada || 0) > 0);
  programacaoDisponivel = ativos;
  resetResumo();
  document.getElementById('labels-output').innerHTML = '<div class="empty-label-state"><i class="bi bi-printer" style="font-size:2.4rem"></i><div class="mt-2">Selecione os postes, gere as etiquetas e depois marque quais deseja imprimir.</div></div>';

  if (!ativos.length) {
    container.innerHTML = '<div class="empty-label-state">Nenhuma programação com quantidade para esta data.</div>';
    return;
  }

  container.innerHTML = ativos.map((row, idx) => {
    const tipo = inferCodigoForma(row);
    const nome = row.produto?.nome || row.produto?.nome_poste || '';
    const setor = row.setor?.nome || `Setor ${row.setor_id}`;
    const qtd = Number(row.quantidade_programada || 0);
    return `
      <label class="poste-select-item">
        <input type="checkbox" class="form-check-input poste-check" value="${idx}">
        <span>
          <strong>${escapeHtml(tipo)} <small>• ${escapeHtml(nome)}</small></strong>
          <small>${escapeHtml(setor)}</small>
        </span>
        <span class="poste-select-qtd">${qtd.toLocaleString('pt-BR')}x</span>
      </label>
    `;
  }).join('');
}

async function loadPostesProgramados() {
  const data = document.getElementById('f-data').value;
  const setor = document.getElementById('f-setor').value;
  const output = document.getElementById('postes-output');
  if (!data) {
    showToast('Informe a data de produção.', 'warning');
    return;
  }

  output.innerHTML = '<div class="empty-label-state">Carregando programação...</div>';
  try {
    const rows = await buscarProgramacao(data, setor);
    renderPostesProgramados(rows);
  } catch (err) {
    output.innerHTML = '<div class="empty-label-state text-danger">Erro ao carregar programação.</div>';
    showToast(err.message || 'Erro ao carregar programação.', 'error');
  }
}

function toggleTodosPostes(checked) {
  document.querySelectorAll('.poste-check').forEach(input => {
    input.checked = checked;
  });
}

function toggleTodasEtiquetasGeradas(checked) {
  document.querySelectorAll('.label-print-check').forEach(input => {
    input.checked = checked;
    input.closest('.label-pair')?.classList.toggle('print-selected', checked);
  });
  atualizarResumoEtiquetasMarcadas();
}

function bindSelecaoEtiquetasGeradas() {
  document.querySelectorAll('.label-print-check').forEach(input => {
    input.addEventListener('change', () => {
      input.closest('.label-pair')?.classList.toggle('print-selected', input.checked);
      atualizarResumoEtiquetasMarcadas();
    });
  });
}

function atualizarResumoEtiquetasMarcadas() {
  const marcadas = document.querySelectorAll('.label-print-check:checked').length;
  document.getElementById('sum-etiquetas').textContent = marcadas.toLocaleString('pt-BR');
}

function gerarEtiquetasSelecionadas() {
  const data = document.getElementById('f-data').value;
  const output = document.getElementById('labels-output');
  const selected = [...document.querySelectorAll('.poste-check:checked')]
    .map(input => programacaoDisponivel[Number(input.value)])
    .filter(Boolean);

  if (!selected.length) {
    showToast('Selecione pelo menos um poste.', 'warning');
    output.innerHTML = '<div class="empty-label-state">Nenhum poste selecionado.</div>';
    resetResumo();
    return false;
  }

  const totalPostes = selected.reduce((acc, r) => acc + Number(r.quantidade_programada || 0), 0);
  document.getElementById('sum-itens').textContent = selected.length.toLocaleString('pt-BR');
  document.getElementById('sum-postes').textContent = totalPostes.toLocaleString('pt-BR');
  document.getElementById('sum-etiquetas').textContent = (totalPostes * 2).toLocaleString('pt-BR');

  const dateLabel = fmtDateBR(data);
  const fonteData = Number(document.getElementById('f-fonte-data').value || 20.16);
  const fonteTipo = Number(document.getElementById('f-fonte-tipo').value || 29.7);
  const escalaData = escalaHorizontal(dateLabel, fonteData, 89);
  const labels = [];

  let labelIndex = 0;
  selected.forEach(row => {
      const tipo = inferCodigoForma(row);
      const fonteForma = calcularFonteForma(tipo, fonteTipo);
      const qtd = Number(row.quantidade_programada || 0);
      const nome = row.produto?.nome || row.produto?.nome_poste || '';
      for (let i = 1; i <= qtd; i++) {
        const dataId = `lbl-${++labelIndex}`;
        const formaId = `lbl-${++labelIndex}`;
        labels.push(`
          <div class="label-pair print-selected">
            <div class="label-print-control">
              <label><input type="checkbox" class="form-check-input label-print-check" checked> Imprimir data</label>
              <span>${escapeHtml(row.setor?.nome || `Setor ${row.setor_id}`)} • ${i}/${qtd}</span>
            </div>
            <div class="label-preview label-date" style="font-size:${fonteData}mm"><span style="display:block;white-space:nowrap;transform:scaleX(${escalaData});transform-origin:center">${escapeHtml(dateLabel)}</span></div>
          </div>
          <div class="label-pair print-selected">
            <div class="label-print-control">
              <label><input type="checkbox" class="form-check-input label-print-check" checked> Imprimir forma</label>
              <span>${escapeHtml(tipo)} • ${i}/${qtd}</span>
            </div>
            <div class="label-preview label-type"><span style="font-size:${fonteForma}mm">${escapeHtml(tipo)}</span></div>
            <div class="label-meta">
              <span>${escapeHtml(row.setor?.nome || `Setor ${row.setor_id}`)}</span>
              <span>${escapeHtml(nome)}</span>
              <span>${i}/${qtd}</span>
            </div>
          </div>
        `);
      }
  });

  output.innerHTML = labels.join('');
  document.getElementById('labels-actions').style.removeProperty('display');
  bindSelecaoEtiquetasGeradas();
  atualizarResumoEtiquetasMarcadas();
  return true;
}

function imprimirEtiquetasMarcadas() {
  const geradas = document.querySelectorAll('.label-print-check').length;
  if (!geradas) {
    const ok = gerarEtiquetasSelecionadas();
    if (!ok) return;
  }
  const marcadas = document.querySelectorAll('.label-print-check:checked').length;
  if (!marcadas) {
    showToast('Marque pelo menos uma etiqueta gerada para imprimir.', 'warning');
    return;
  }
  setTimeout(() => {
    window.print();
  }, 150);
}

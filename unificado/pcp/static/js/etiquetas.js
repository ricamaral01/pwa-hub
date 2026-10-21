let user;
let programacaoDisponivel = [];
const etiquetasSC = document.body.dataset.labelMode === 'sc';

document.addEventListener('DOMContentLoaded', () => {
  user = requireAuth();
  if (!user) return;
  initSidebar(etiquetasSC ? 'etiquetas-sc' : 'etiquetas');
  document.getElementById('user-nome-top').textContent = user.nome || '';
  document.getElementById('user-nivel').textContent = user.nivel_acesso || '';
  const hoje = new Date();
  document.getElementById('f-data').value = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}-${String(hoje.getDate()).padStart(2, '0')}`;
  ['f-largura', 'f-altura'].forEach(id => document.getElementById(id).addEventListener('change', aplicarDimensoesEtiqueta));
  aplicarDimensoesEtiqueta();
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
  const setor = Number(row.setor_id) || Number(String(row.setor?.nome || '').match(/Setor\s+(\d+)/i)?.[1]);
  if (setor === 4) {
    const modelo = String(row.produto?.nome || row.produto?.nome_poste || '').trim().match(/^(\d+(?:[,.]\d+)?\s*[x×]\s*\d+)\s+DT$/i);
    if (modelo) return modelo[1].replace(/\s*[x×]\s*/i, 'X').toUpperCase();
  }
  const codigo = String(row.codigo_tipo_forma || '').trim();
  return setor === 2 || setor === 4 ? codigo.replace(/^(?:DT|SC)(?=[\s-]|\d)[\s-]*/i, '').trim() : codigo;
}

function dimensoesEtiqueta() {
  const valor = (id, padrao, minimo, maximo) => {
    const numero = Number(document.getElementById(id)?.value);
    return Number.isFinite(numero) && numero >= minimo && numero <= maximo ? numero : padrao;
  };
  return {largura: valor('f-largura', 95, 40, 200), altura: valor('f-altura', 40, 20, 150)};
}

function aplicarDimensoesEtiqueta() {
  const {largura, altura} = dimensoesEtiqueta();
  document.getElementById('f-largura').value = largura;
  document.getElementById('f-altura').value = altura;
  document.documentElement.style.setProperty('--label-width', `${largura}mm`);
  document.documentElement.style.setProperty('--label-height', `${altura}mm`);
  document.getElementById('label-paper-size').textContent = `${largura} x ${altura} mm`;
  let pageStyle = document.getElementById('label-print-page-size');
  if (!pageStyle) {
    pageStyle = document.createElement('style');
    pageStyle.id = 'label-print-page-size';
    document.head.append(pageStyle);
  }
  pageStyle.textContent = `@page { size: ${largura}mm ${altura}mm; margin: 0; }`;
  const fonteData = Math.min(Number(document.getElementById('f-fonte-data').value || 20.16), altura - 4);
  const fonteTipo = Number(document.getElementById('f-fonte-tipo').value || 29.7);
  document.querySelectorAll('.label-date').forEach(label => {
    label.style.fontSize = `${fonteData}mm`;
    const span = label.querySelector('span');
    if (span) span.style.transform = `scaleX(${escalaHorizontal(span.textContent, fonteData, largura - 6)})`;
  });
  document.querySelectorAll('.label-type > span').forEach(span => {
    span.style.fontSize = `${calcularFonteForma(span.textContent, fonteTipo)}mm`;
  });
}

function calcularFonteForma(codigo, fontePadrao) {
  const texto = String(codigo || '');
  let size = texto.length <= 3 ? fontePadrao : texto.length <= 5 ? Math.min(fontePadrao, 24.2) : texto.length <= 8 ? Math.min(fontePadrao, 17.6) : Math.min(fontePadrao, 13.2);
  const context = document.createElement('canvas').getContext('2d');
  const pxPerMm = 96 / 25.4;
  context.font = `900 ${size * pxPerMm}px Arial`;
  const textWidth = context.measureText(texto).width;
  const {largura, altura} = dimensoesEtiqueta();
  const maxWidth = (etiquetasSC ? largura - 6 : altura - 4) * pxPerMm;
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
  const qs = new URLSearchParams({data});
  if (setor) qs.set('setor_id', setor);
  return API.get(`/api/etiquetas-padrao/programacao?${qs}`);
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
        <input type="checkbox" class="form-check-input poste-check" value="${idx}" ${tipo ? '' : 'disabled'}>
        <span>
          <strong>${escapeHtml(tipo || 'Sem Cód. tipo cadastrado')} <small>• ${escapeHtml(nome)}</small></strong>
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
    input.checked = checked && !input.disabled;
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
    .filter(row => row && inferCodigoForma(row));

  if (!selected.length) {
    showToast('Selecione pelo menos um poste com Cód. tipo cadastrado.', 'warning');
    output.innerHTML = '<div class="empty-label-state">Nenhum poste selecionado.</div>';
    resetResumo();
    return false;
  }

  const totalPostes = selected.reduce((acc, r) => acc + Number(r.quantidade_programada || 0), 0);
  document.getElementById('sum-itens').textContent = selected.length.toLocaleString('pt-BR');
  document.getElementById('sum-postes').textContent = totalPostes.toLocaleString('pt-BR');
  document.getElementById('sum-etiquetas').textContent = (totalPostes * 2).toLocaleString('pt-BR');

  const dateLabel = fmtDateBR(data);
  const {largura, altura} = dimensoesEtiqueta();
  const fonteData = Math.min(Number(document.getElementById('f-fonte-data').value || 20.16), altura - 4);
  const fonteTipo = Number(document.getElementById('f-fonte-tipo').value || 29.7);
  const escalaData = escalaHorizontal(dateLabel, fonteData, largura - 6);
  const labels = [];

  selected.forEach(row => {
      const tipo = inferCodigoForma(row);
      const fonteForma = calcularFonteForma(tipo, fonteTipo);
      const qtd = Number(row.quantidade_programada || 0);
      const nome = row.produto?.nome || row.produto?.nome_poste || '';
      for (let i = 1; i <= qtd; i++) {
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
              <label><input type="checkbox" class="form-check-input label-print-check" checked> Imprimir Cód. tipo</label>
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
  aplicarDimensoesEtiqueta();
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

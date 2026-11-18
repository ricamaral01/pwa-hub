const user = requireAuth();
if (user) {
  document.getElementById('user-nome-top').textContent = user.nome;
  initSidebar('maodeobra');
}

const hoje = todayISO();
document.getElementById('mdo-data').value = hoje;
document.getElementById('f-inicio').value = hoje;
document.getElementById('f-fim').value = hoje;

let atividadesGrid = [];
let diaGrid = null;
let setoresOrdenados = [];
let cargaAtual = 0;
let atividadesCadastro = [];
let cadastroEditando = null;
const podeCadastrar = ['ADMIN', 'PCP'].includes(user?.nivel_acesso);
document.getElementById('mdo-cadastro').hidden = !podeCadastrar;

function grupoAtual() {
  return document.querySelector('input[name="mdo-grupo"]:checked').value;
}

function textoSeguro(value) {
  return String(value ?? '').replace(/[&<>"']/g, char => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[char]);
}

const quantidadeTexto = window.MaoDeObraCore.formatQuantity;
const lerQuantidade = window.MaoDeObraCore.parseQuantity;

function getSetoresGrupo(grupo) {
  return grupo === '12' ? setoresOrdenados.slice(0, 2) : setoresOrdenados.slice(2, 4);
}

async function loadSetores() {
  try {
    setoresOrdenados = (await API.get('/api/setores')).sort((a, b) => a.id - b.id);
    const filtro = document.getElementById('f-setor');
    setoresOrdenados.forEach((setor, index) => {
      const option = document.createElement('option');
      option.value = setor.id;
      option.textContent = `Setor ${index + 1} - ${setor.nome}`;
      filtro.append(option);
    });
    atualizarSetoresCadastro();
  } catch (error) {
    showToast(error.message, 'error');
  }
}

function atualizarSetoresCadastro() {
  const seletor = document.getElementById('cad-setor');
  seletor.innerHTML = '<option value="">Grupo</option>';
  if (grupoAtual() === '34') {
    getSetoresGrupo('34').forEach(setor => {
      const option = document.createElement('option');
      option.value = setor.id;
      option.textContent = setor.nome;
      seletor.append(option);
    });
  }
  seletor.disabled = grupoAtual() === '12' || document.getElementById('cad-tipo').value === 'MOI' || cadastroEditando !== null;
}

function limparCadastro() {
  cadastroEditando = null;
  for (const id of ['cad-nome', 'cad-responsavel', 'cad-fator']) document.getElementById(id).value = '';
  document.getElementById('cad-tipo').value = 'MOI';
  document.getElementById('cad-tipo').disabled = false;
  document.getElementById('cad-ordem').value = '100';
  document.getElementById('cad-salvar').textContent = 'Adicionar atividade';
  document.getElementById('cad-cancelar').hidden = true;
  atualizarSetoresCadastro();
}

async function loadCadastro() {
  if (!podeCadastrar) return;
  const grupo = grupoAtual();
  try {
    atividadesCadastro = await API.get(`/api/atividades-maodeobra?grupo_setor=${grupo}`);
    if (grupo !== grupoAtual()) return;
    document.getElementById('cad-lista').innerHTML = atividadesCadastro.map(atividade => `
      <div class="mdo-cadastro-item">
        <span>${textoSeguro(atividade.descricao)} <small class="text-muted">${atividade.tipo} · ordem ${atividade.ordem}${atividade.ativo ? '' : ' · inativa'}</small></span>
        <span class="d-flex gap-1">
          <button type="button" class="btn btn-outline-primary btn-sm" data-cad-editar="${atividade.id}">Editar</button>
          <button type="button" class="btn btn-outline-${atividade.ativo ? 'danger' : 'success'} btn-sm" data-cad-ativo="${atividade.id}">${atividade.ativo ? 'Desativar' : 'Reativar'}</button>
        </span>
      </div>`).join('') || '<p class="text-muted">Nenhuma atividade cadastrada.</p>';
  } catch (error) {
    showToast(error.message, 'error');
  }
}

async function salvarCadastro() {
  const nome = document.getElementById('cad-nome').value.trim();
  const tipo = document.getElementById('cad-tipo').value;
  const setor = document.getElementById('cad-setor').value;
  const ordem = Number(document.getElementById('cad-ordem').value);
  const responsavel = document.getElementById('cad-responsavel').value.trim();
  const fatorTexto = document.getElementById('cad-fator').value.trim().replace(',', '.');
  const fator = fatorTexto ? Number(fatorTexto) : null;
  if (!nome || !Number.isInteger(ordem) || ordem < 1 ||
      (fatorTexto && (!/^\d(?:\.\d{1,2})?$/.test(fatorTexto) || fator > 1)) ||
      (!cadastroEditando && tipo === 'MOD' && grupoAtual() === '34' && !setor)) {
    showToast('Confira atividade, ordem, setor e fator (0 a 1).', 'warning');
    return;
  }
  const botao = document.getElementById('cad-salvar');
  botao.disabled = true;
  try {
    if (cadastroEditando !== null) {
      await API.patch(`/api/atividades-maodeobra/${cadastroEditando}`, {
        descricao: nome, ordem, responsavel: responsavel || null, fator,
      });
    } else {
      const qs = new URLSearchParams({ tipo, descricao: nome, grupo_setor: grupoAtual(), ordem: String(ordem) });
      if (tipo === 'MOD' && setor) qs.set('setor_id', setor);
      if (responsavel) qs.set('responsavel', responsavel);
      if (fator !== null) qs.set('fator', String(fator));
      await API.post(`/api/atividades-maodeobra?${qs}`, {});
    }
    showToast('Cadastro de atividade salvo.', 'success');
    limparCadastro();
    await Promise.all([loadCadastro(), loadGridAtividades()]);
  } catch (error) {
    showToast(error.message, 'error');
  } finally {
    botao.disabled = false;
  }
}

async function agirCadastro(event) {
  const editar = event.target.closest('[data-cad-editar]');
  const ativo = event.target.closest('[data-cad-ativo]');
  if (editar) {
    const atividade = atividadesCadastro.find(item => item.id === Number(editar.dataset.cadEditar));
    if (!atividade) return;
    cadastroEditando = atividade.id;
    document.getElementById('cad-nome').value = atividade.descricao;
    document.getElementById('cad-tipo').value = atividade.tipo;
    document.getElementById('cad-tipo').disabled = true;
    document.getElementById('cad-ordem').value = atividade.ordem;
    document.getElementById('cad-responsavel').value = atividade.responsavel || '';
    document.getElementById('cad-fator').value = atividade.fator == null ? '' : quantidadeTexto(atividade.fator);
    atualizarSetoresCadastro();
    document.getElementById('cad-setor').value = atividade.setor_id || '';
    document.getElementById('cad-salvar').textContent = 'Salvar atividade';
    document.getElementById('cad-cancelar').hidden = false;
    document.getElementById('cad-nome').focus();
  } else if (ativo) {
    const atividade = atividadesCadastro.find(item => item.id === Number(ativo.dataset.cadAtivo));
    if (!atividade || (atividade.ativo && !confirm(`Desativar ${atividade.descricao}? O histórico será mantido.`))) return;
    try {
      if (atividade.ativo) await API.delete(`/api/atividades-maodeobra/${atividade.id}`);
      else await API.patch(`/api/atividades-maodeobra/${atividade.id}`, { ativo: true });
      showToast('Cadastro atualizado.', 'success');
      limparCadastro();
      await Promise.all([loadCadastro(), loadGridAtividades()]);
    } catch (error) {
      showToast(error.message, 'error');
    }
  }
}

function linhaAtividade(atividade, valor) {
  const meta = atividade.responsavel
    ? `<span class="mdo-meta">${textoSeguro(atividade.responsavel)}${atividade.fator != null ? ` · fator ${quantidadeTexto(atividade.fator)}` : ''}</span>`
    : '';
  return `<tr>
    <td>${textoSeguro(atividade.descricao)}${meta}</td>
    <td>${atividade.tipo}</td>
    <td class="text-end"><input type="text" inputmode="decimal" autocomplete="off" class="form-control ms-auto mdo-qtd" aria-label="Pessoas: ${textoSeguro(atividade.descricao)}" placeholder="0" value="${valor == null ? '' : quantidadeTexto(valor)}" data-atividade-id="${atividade.id}" data-tipo="${atividade.tipo}" /></td>
  </tr>`;
}

function atualizarTotais() {
  const inputs = [...document.querySelectorAll('#tbody-mdo-grid .mdo-qtd')];
  const totais = window.MaoDeObraCore.calculate(inputs.map(input => ({
    atividade_id: Number(input.dataset.atividadeId), tipo: input.dataset.tipo, value: input.value,
  })));
  inputs.forEach(input => input.classList.toggle('is-invalid',
    totais.invalid.includes(Number(input.dataset.atividadeId))));
  for (const tipo of ['MOD', 'MOI']) {
    document.getElementById(`mdo-subtotal-${tipo.toLowerCase()}`).textContent = totais.valid ? quantidadeTexto(totais[tipo]) : '—';
  }
  document.getElementById('mdo-total').textContent = totais.valid ? quantidadeTexto(totais.total) : '—';
  const confirmar = document.getElementById('btn-confirmar-lote');
  if (confirmar) {
    const values = Object.fromEntries(inputs.map(input => [input.dataset.atividadeId, input.value]));
    const edited = window.MaoDeObraCore.hasEdits(atividadesGrid, values, diaGrid);
    confirmar.disabled = !totais.valid || !diaGrid?.lancado || !diaGrid.salvo_em ||
      diaGrid.sem_producao || diaGrid.confirmado || edited;
    confirmar.title = edited ? 'Salve as alterações antes de confirmar' : '';
  }
  return totais.valid;
}

async function loadGridAtividades() {
  const requisicao = ++cargaAtual;
  const grupo = grupoAtual();
  const data = document.getElementById('mdo-data').value;
  const titulo = document.getElementById('mdo-modo-titulo');
  const estado = document.getElementById('mdo-dia-estado');
  const tbody = document.getElementById('tbody-mdo-grid');
  diaGrid = null;
  document.getElementById('btn-confirmar-lote').disabled = true;
  titulo.textContent = `Mão de obra S${grupo[0]} / S${grupo[1]}`;
  estado.textContent = 'Carregando dia…';
  tbody.innerHTML = '<tr><td colspan="3" class="mdo-empty">Carregando atividades…</td></tr>';
  if (!data) {
    estado.textContent = 'Informe a data.';
    return;
  }
  try {
    const {activities: atividades, day: dia} = await window.MaoDeObraCore.loadDay(API, data, grupo);
    if (requisicao !== cargaAtual) return;
    atividadesGrid = atividades;
    diaGrid = dia;
    if (!atividadesGrid.length) {
      tbody.innerHTML = '<tr><td colspan="3" class="mdo-empty">Nenhuma atividade ativa cadastrada para este grupo.</td></tr>';
      estado.textContent = 'Sem atividades cadastradas.';
      return;
    }
    const valores = new Map((dia.itens || []).map(item => [item.atividade_id, item.quantidade_pessoas]));
    tbody.innerHTML = ['MOD', 'MOI'].map(tipo => {
      const itens = atividadesGrid.filter(atividade => atividade.tipo === tipo);
      if (!itens.length) return '';
      return `<tr class="mdo-secao"><td colspan="3">Mão de obra ${tipo === 'MOD' ? 'direta' : 'indireta'}</td></tr>
        ${itens.map(atividade => linhaAtividade(atividade, valores.get(atividade.id))).join('')}
        <tr class="mdo-subtotal"><td colspan="2" class="text-end">Subtotal ${tipo}</td><td class="text-end" id="mdo-subtotal-${tipo.toLowerCase()}">0</td></tr>`;
    }).join('') + '<tr class="mdo-total"><td colspan="2" class="text-end">TOTAL</td><td class="text-end" id="mdo-total">0</td></tr>';
    tbody.querySelectorAll('.mdo-qtd').forEach(input => input.addEventListener('input', atualizarTotais));
    atualizarTotais();
    estado.textContent = dia.sem_producao ? 'Sem produção registrada neste dia.'
      : dia.confirmado ? `Confirmado às ${horaMdo(dia.confirmado_em)} por ${dia.confirmado_por?.nome || 'usuário indisponível'}.`
      : dia.lancado ? `Lançamento salvo às ${horaMdo(dia.salvo_em)} · aguardando confirmação.`
      : 'Ainda não lançado neste dia.';
    document.getElementById('mdo-grid-resumo').textContent = `${atividadesGrid.length} atividades no grupo S${grupo[0]}/S${grupo[1]}. Valores em pessoas, de 0,5 em 0,5.`;
  } catch (error) {
    if (requisicao !== cargaAtual) return;
    estado.textContent = 'Não foi possível carregar o dia.';
    tbody.innerHTML = '<tr><td colspan="3" class="mdo-empty">Falha ao carregar as atividades.</td></tr>';
    showToast(error.message, 'error');
  }
}

function horaMdo(value) {
  return value ? new Intl.DateTimeFormat('pt-BR', {timeZone:'America/Sao_Paulo',
    hour:'2-digit',minute:'2-digit'}).format(new Date(value)) : 'horário indisponível';
}

async function confirmarGrupo() {
  if (!diaGrid?.salvo_em || diaGrid.sem_producao || diaGrid.confirmado) return;
  const button = document.getElementById('btn-confirmar-lote');
  if (button.disabled) return;
  button.disabled = true;
  try {
    await window.MaoDeObraCore.confirmGroup(API, {
      data: document.getElementById('mdo-data').value,
      grupo_setor: grupoAtual(), salvo_em: diaGrid.salvo_em,
    });
    showToast('Mão de obra confirmada.', 'success');
    await loadGridAtividades();
  } catch (error) {
    if (error.status === 409) {
      await loadGridAtividades();
      showToast('O lançamento mudou. Confira os valores atualizados antes de confirmar.', 'warning');
    } else {
      showToast(error.message, 'error');
      atualizarTotais();
    }
  }
}

async function salvarGrupo(semProducao = false) {
  const data = document.getElementById('mdo-data').value;
  if (!data || !atividadesGrid.length) {
    showToast('Informe a data e aguarde as atividades', 'warning');
    return;
  }
  const inputs = [...document.querySelectorAll('#tbody-mdo-grid .mdo-qtd')];
  if (!semProducao && !atualizarTotais()) {
    showToast('Use quantidades de 0,5 em 0,5, com ponto ou vírgula', 'warning');
    return;
  }
  if (semProducao && inputs.some(input => lerQuantidade(input.value) > 0)
      && !confirm('Registrar sem produção vai zerar as quantidades deste grupo no dia. Continuar?')) return;
  const valores = Object.fromEntries(inputs.map(input => [input.dataset.atividadeId, input.value]));
  const botoes = [document.getElementById('btn-salvar-lote'), document.getElementById('btn-sem-producao')];
  botoes.forEach(botao => { botao.disabled = true; });
  try {
    await window.MaoDeObraCore.saveGroup(API, {
      data, grupo_setor: grupoAtual(), activities: atividadesGrid,
      values: valores, sem_producao: semProducao,
    });
    showToast(semProducao ? 'Dia sem produção registrado.' : 'Lançamentos salvos.', 'success');
    await Promise.all([loadGridAtividades(), loadHoje(), loadMdo()]);
  } catch (error) {
    showToast(error.message, 'error');
  } finally {
    botoes.forEach(botao => { botao.disabled = false; });
  }
}

async function loadHoje() {
  try {
    const rows = await API.get(`/api/maodeobra?data_inicio=${hoje}&data_fim=${hoje}`);
    const resumo = ['12', '34'].map(grupo => {
      const setores = new Set(getSetoresGrupo(grupo).map(setor => setor.id));
      const mod = rows.filter(row => row.atividade?.tipo === 'MOD' &&
        (row.atividade?.grupo_setor === grupo || (!row.atividade?.grupo_setor && setores.has(row.setor_id))))
        .reduce((total, row) => total + Number(row.quantidade_pessoas), 0);
      const moi = rows.filter(row => row.atividade?.tipo === 'MOI' && row.atividade?.grupo_setor === grupo)
        .reduce((total, row) => total + Number(row.quantidade_pessoas), 0);
      return `<div class="col-12 col-md-6"><div class="kpi-card kpi-good">
        <div class="kpi-label">Mão de obra S${grupo[0]}/S${grupo[1]} hoje</div>
        <div class="kpi-value">${quantidadeTexto(mod + moi)}</div>
        <div class="kpi-sub">MOD ${quantidadeTexto(mod)} + MOI ${quantidadeTexto(moi)}</div>
      </div></div>`;
    });
    document.getElementById('resumo-hoje').innerHTML = resumo.join('');
  } catch (error) {
    showToast(error.message, 'error');
  }
}

async function loadMdo() {
  const qs = new URLSearchParams();
  const inicio = document.getElementById('f-inicio').value;
  const fim = document.getElementById('f-fim').value;
  const setor = document.getElementById('f-setor').value;
  const tipo = document.getElementById('f-tipo').value;
  if (inicio) qs.set('data_inicio', inicio);
  if (fim) qs.set('data_fim', fim);
  if (setor) qs.set('setor_id', setor);
  const tbody = document.getElementById('tbody-mdo');
  tbody.innerHTML = '<tr><td colspan="6" class="text-center"><div class="spinner-border spinner-border-sm"></div></td></tr>';
  try {
    let rows = await API.get(`/api/maodeobra?${qs}`);
    if (tipo) rows = rows.filter(row => row.atividade?.tipo === tipo);
    if (!rows.length) {
      tbody.innerHTML = '<tr><td colspan="6" class="text-center text-muted py-3">Nenhum registro</td></tr>';
      return;
    }
    const canDel = ['ADMIN', 'PCP', 'PRODUCAO'].includes(user?.nivel_acesso);
    tbody.innerHTML = rows.map(row => `<tr>
      <td>${fmtDate(row.data)}</td>
      <td><span class="badge bg-${row.atividade?.tipo === 'MOI' ? 'success' : 'info'}">${row.atividade?.tipo || '—'}</span></td>
      <td>${textoSeguro(row.atividade?.descricao || '—')}</td>
      <td>${textoSeguro(row.setor?.nome || '—')}</td>
      <td class="text-end fw-bold">${quantidadeTexto(row.quantidade_pessoas)}</td>
      <td class="text-center desktop-only">${canDel ? `<button class="btn btn-outline-danger btn-sm py-0" onclick="deleteMdo(${row.id})" aria-label="Excluir lançamento"><i class="bi bi-trash"></i></button>` : '—'}</td>
    </tr>`).join('');
  } catch (error) {
    showToast(error.message, 'error');
  }
}

async function deleteMdo(id) {
  if (!confirm('Excluir este lançamento?')) return;
  try {
    await API.delete(`/api/maodeobra/${id}`);
    showToast('Lançamento excluído.', 'success');
    await Promise.all([loadGridAtividades(), loadHoje(), loadMdo()]);
  } catch (error) {
    showToast(error.message, 'error');
  }
}

document.querySelectorAll('input[name="mdo-grupo"]').forEach(input => input.addEventListener('change', () => {
  limparCadastro();
  loadGridAtividades();
  loadCadastro();
}));
document.getElementById('mdo-data').addEventListener('change', loadGridAtividades);
document.getElementById('btn-salvar-lote').addEventListener('click', () => salvarGrupo(false));
document.getElementById('btn-confirmar-lote').addEventListener('click', confirmarGrupo);
document.getElementById('btn-sem-producao').addEventListener('click', () => salvarGrupo(true));
document.getElementById('btn-buscar').addEventListener('click', loadMdo);
document.getElementById('f-tipo').addEventListener('change', loadMdo);
document.getElementById('cad-tipo').addEventListener('change', atualizarSetoresCadastro);
document.getElementById('cad-salvar').addEventListener('click', salvarCadastro);
document.getElementById('cad-cancelar').addEventListener('click', limparCadastro);
document.getElementById('cad-lista').addEventListener('click', agirCadastro);
loadSetores().then(() => Promise.all([loadGridAtividades(), loadHoje(), loadMdo(), loadCadastro()]));

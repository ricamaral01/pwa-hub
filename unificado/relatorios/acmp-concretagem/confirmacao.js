(() => {
  'use strict';
  const api = '/unificado/mapa/api/fechamento-producao';
  const sectors = ['Setor 1', 'Setor 2', 'Setor 3', 'Setor 4'];
  let selected = 'Todos';
  let showAllForms = true;
  let snapshot = null;
  const esc = value => String(value ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[ch]));
  const number = value => Number(value || 0).toLocaleString('pt-BR');
  const label = (yes, positive, negative) => `<span class="confirm-flag ${yes ? 'yes' : 'no'}">${yes ? positive : negative}</span>`;

  function formCard(form, index) {
    const action = form.confirmada
      ? `<span class="confirm-done" title="${esc(form.confirmado_em || '')}">✓ Confirmada por ${esc(form.confirmado_por || 'usuário autorizado')}</span>`
      : form.concretada && snapshot.pode_confirmar
        ? `<button class="confirm-action" type="button" data-confirm-index="${index}">Confirmar produção</button>`
        : `<button class="confirm-action" type="button" disabled title="${form.concretada ? 'Entre como José Carlos da Silva ou administrador' : 'Regularize a concretagem apontada antes de confirmar'}">Confirmar produção</button>`;
    return `<article class="confirm-form ${form.fora_mapa ? 'outside' : ''}">
      <div class="confirm-form-top"><strong>${esc(form.forma)}</strong><span>${esc(form.modelo || '')}</span><small>${esc(form.lado)}${form.posicao ? ` · posição ${form.posicao}` : ''}</small></div>
      <div class="confirm-form-status">
        ${label(form.programada, 'Programada', 'Sem programação')}
        ${label(form.liberada, 'Liberada', 'Sem liberação')}
        ${label(form.concretada, 'Concretada', 'Não concretada')}
      </div>
      ${form.tipo_concreto ? `<small class="confirm-concrete">Concreto: ${esc(form.tipo_concreto)}</small>` : ''}
      <div class="confirm-form-action">${action}</div>
    </article>`;
  }

  function column(forms, heading) {
    return `<div class="confirm-column"><div class="confirm-column-head"><strong>${esc(heading)}</strong><span>Monovia → fundo</span></div>${forms.map(form => formCard(form, snapshot.formas.indexOf(form))).join('')}</div>`;
  }

  function byDepth(...lanes) {
    const ordered = [];
    for (let position = 0; position < Math.max(0, ...lanes.map(lane => lane.length)); position++) {
      for (const lane of lanes) if (lane[position]) ordered.push(lane[position]);
    }
    return ordered;
  }

  function renderSector(sector) {
    const allForms = snapshot.formas.filter(form => form.setor === sector);
    const forms = showAllForms ? allForms : allForms.filter(form => form.concretada && !form.confirmada);
    const byLane = new Map();
    for (const form of forms) {
      if (!byLane.has(form.lado)) byLane.set(form.lado, []);
      byLane.get(form.lado).push(form);
    }
    let left, right, leftTitle, rightTitle;
    if (sector === 'Setor 4') {
      left = byLane.get('Coluna 1') || [];
      right = [...byDepth(byLane.get('Coluna 2') || [], byLane.get('Coluna 3') || []), ...(byLane.get('Fora do mapa') || [])];
      leftTitle = 'Coluna física 1'; rightTitle = 'Colunas físicas 2 e 3';
    } else {
      left = byLane.get('Esquerda') || [];
      right = [...(byLane.get('Direita') || []), ...(byLane.get('Fora do mapa') || [])];
      leftTitle = 'Lado esquerdo'; rightTitle = 'Lado direito';
    }
    const total = allForms.filter(form => form.confirmada).length;
    const concreted = allForms.filter(form => form.concretada).length;
    return `<div class="confirm-sector-block"><h4>${esc(sector)}</h4>
      <div class="confirm-summary"><span><b>${number(allForms.length)}</b> formas no mapa</span><span><b>${number(concreted)}</b> concretadas</span><span class="is-final"><b>${number(total)}</b> confirmadas</span></div>
      ${forms.length ? `<div class="confirm-grid">${column(left, leftTitle)}${column(right, rightTitle)}</div>`
        : '<p class="confirm-empty">Nenhuma concretagem pendente neste setor. Desmarque o filtro para conferir o mapa completo.</p>'}
      ${allForms.some(form => form.fora_mapa) ? '<p class="confirm-alert">Há produção apontada em forma fora do mapa físico. Confira o código da forma antes de encerrar o dia.</p>' : ''}</div>`;
  }

  function render() {
    const root = document.getElementById('confirmacao-formas');
    if (!root || !snapshot) return;
    const visible = selected === 'Todos' ? snapshot.formas : snapshot.formas.filter(form => form.setor === selected);
    const pending = visible.filter(form => form.concretada && !form.confirmada).length;
    root.innerHTML = `<div class="section-head"><h3>Conferência física por forma</h3><span>Responsável: José Carlos da Silva</span></div>
      <p class="confirm-explanation">As formas seguem o mapa físico da monovia para o fundo. O efetivo confirmado conta somente as concretagens conferidas por José Carlos ou um administrador, uma forma por vez.</p>
      <div class="confirm-guidance ${snapshot.pode_confirmar ? 'ready' : 'restricted'}">${snapshot.pode_confirmar
        ? `<strong>${number(pending)} concretagem(ns) aguardando sua confirmação.</strong> ${snapshot.confirmador_admin
          ? 'Você está como administrador; cada confirmação será registrada em seu usuário. Use o filtro abaixo para localizar as formas pendentes.'
          : 'Confira fisicamente cada forma antes de confirmar. Use o filtro abaixo para localizar as formas pendentes.'}`
        : '<strong>Confirmação reservada a José Carlos da Silva ou administrador.</strong> Entre com uma dessas contas para confirmar as formas concretadas.'}</div>
      <label class="confirm-show-all"><input id="confirm-only-pending" type="checkbox" ${showAllForms ? '' : 'checked'}> Mostrar apenas concretadas pendentes de confirmação</label>
      ${(selected === 'Todos' ? sectors : [selected]).map(renderSector).join('')}`;
    root.querySelector('#confirm-only-pending')?.addEventListener('change', event => {
      showAllForms = !event.target.checked;
      render();
    });
    root.querySelectorAll('[data-confirm-index]').forEach(button => button.addEventListener('click', confirmForm));
    window.onAcmpView?.(snapshot, selected, visible);
  }

  window.setAcmpSector = sector => {
    if (sector !== 'Todos' && !sectors.includes(sector)) return;
    selected = sector;
    render();
  };

  async function confirmForm(event) {
    const button = event.currentTarget;
    const form = snapshot?.formas[Number(button.dataset.confirmIndex)];
    if (!form?.concretada || !snapshot?.pode_confirmar) return;
    if (!window.confirm(`Confirmar a produção física da forma ${form.forma} em ${form.setor}? Esta confirmação entra na contagem final.`)) return;
    button.disabled = true;
    button.textContent = 'Confirmando...';
    try {
      const response = await fetch(api + '/confirmar', {
        method: 'POST', credentials: 'same-origin', cache: 'no-store',
        headers: {'Content-Type':'application/json', 'Accept':'application/json'},
        body: JSON.stringify({data:snapshot.data, setor:form.setor, forma:form.forma, producao_id:form.producao_id}),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || `Erro ${response.status}`);
      await window.loadConfirmacaoFormas(snapshot.data);
    } catch (error) {
      button.disabled = false; button.textContent = 'Confirmar produção';
      window.alert(error.message);
    }
  }

  window.loadConfirmacaoFormas = async day => {
    const root = document.getElementById('confirmacao-formas');
    if (root) root.innerHTML = '<div class="confirm-loading">Carregando formas para conferência...</div>';
    try {
      const response = await fetch(`${api}?data=${encodeURIComponent(day)}&setor=Todos`, {credentials:'same-origin', cache:'no-store'});
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || `Erro ${response.status}`);
      snapshot = data;
      render();
    } catch (error) {
      snapshot = null;
      if (root) root.innerHTML = `<p class="confirm-alert">Conferência indisponível: ${esc(error.message)}. O efetivo final não foi calculado.</p>`;
      window.onAcmpView?.(null, selected, [], error.message);
    }
  };
})();

(() => {
  'use strict';
  const api = '/unificado/mapa/api/fechamento-producao';
  const sectors = ['Setor 1', 'Setor 2', 'Setor 3', 'Setor 4'];
  let selected = 'Todos';
  let showAllForms = true;
  let snapshot = null;
  let requestId = 0;
  const formKey = form => JSON.stringify([form.setor, form.forma]);
  const esc = value => String(value ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  const number = value => Number(value || 0).toLocaleString('pt-BR');
  const label = (yes, positive, negative) => `<span class="confirm-flag ${yes ? 'yes' : 'no'}">${yes ? positive : negative}</span>`;

  function formCard(form, index) {
    const action = form.confirmada
      ? `<span class="confirm-done" title="${esc(form.confirmado_em || '')}">✓ Confirmada por ${esc(form.confirmado_por || 'usuário autorizado')}</span>`
      : snapshot.pode_confirmar
        ? `<button class="confirm-action" type="button" data-confirm-index="${index}">Confirmar produção</button>`
        : '<button class="confirm-action" type="button" disabled title="Confirmação restrita a Osmar, José Carlos ou administrador autorizado">Confirmar produção</button>';
    const reverse = form.concretada && snapshot.pode_reverter ? `<button class="confirm-action confirm-reverse" type="button" data-reverse-index="${index}">Reverter produção</button>` : '';
    return `<article class="confirm-form ${form.fora_mapa ? 'outside' : ''}" data-form-key="${esc(formKey(form))}" tabindex="-1">
      <div class="confirm-form-top"><strong>${esc(form.forma)}</strong><span>${esc(form.modelo || '')}</span><small>${esc(form.lado)}${form.posicao ? ` · posição ${form.posicao}` : ''}</small></div>
      <div class="confirm-form-status">
        ${label(form.programada, 'Programada', 'Sem programação')}
        ${label(form.liberada, 'Liberada', 'Sem liberação')}
        ${label(form.concretada, 'Concretada', 'Não concretada')}
      </div>
      ${form.tipo_concreto ? `<small class="confirm-concrete">Concreto: ${esc(form.tipo_concreto)}</small>` : ''}
      <div class="confirm-form-action">${action}${reverse}<button type="button" class="confirm-history" data-history-index="${index}">Histórico</button></div>
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
    return `<div class="confirm-sector-block" data-sector="${esc(sector)}"><h4>${esc(sector)}</h4>
      <div class="confirm-summary"><span><b>${number(allForms.length)}</b> formas no mapa</span><span><b>${number(concreted)}</b> concretadas</span><span class="is-final"><b>${number(total)}</b> confirmadas</span></div>
      ${forms.length ? `<div class="confirm-grid">${column(left, leftTitle)}${column(right, rightTitle)}</div>`
        : '<p class="confirm-empty">Nenhuma concretagem pendente neste setor. Desmarque o filtro para conferir o mapa completo.</p>'}
      ${allForms.some(form => form.fora_mapa) ? '<p class="confirm-alert">Há produção apontada em forma fora do mapa físico. Confira o código da forma antes de encerrar o dia.</p>' : ''}</div>`;
  }

  // Keep existing cards in place: never collapse the map while saving or refreshing.
  function reconcile(current, next) {
    if (current.isEqualNode(next)) return current;
    if (current.nodeType !== next.nodeType || current.nodeName !== next.nodeName) {
      const replacement=next.cloneNode(true);current.replaceWith(replacement);return replacement;
    }
    if (current.nodeType !== Node.ELEMENT_NODE) { current.textContent = next.textContent; return current; }
    for (const attr of [...current.attributes]) if (!next.hasAttribute(attr.name)) current.removeAttribute(attr.name);
    for (const attr of next.attributes) if (current.getAttribute(attr.name) !== attr.value) current.setAttribute(attr.name, attr.value);
    const key = node => node.nodeType === Node.ELEMENT_NODE ? node.dataset.formKey || node.dataset.sector : null;
    const keyed = new Map([...current.childNodes].filter(key).map(node => [key(node), node]));
    let cursor = current.firstChild;
    for (const child of next.childNodes) {
      const existing = key(child) ? keyed.get(key(child)) : cursor && !key(cursor) ? cursor : null;
      if (existing) {
        if (existing !== cursor) current.insertBefore(existing, cursor);
        cursor = reconcile(existing, child).nextSibling;
      } else current.insertBefore(child.cloneNode(true), cursor);
    }
    while (cursor) { const following = cursor.nextSibling; cursor.remove(); cursor = following; }
    return current;
  }

  function render(incremental = false) {
    const root = document.getElementById('confirmacao-formas');
    if (!root || !snapshot) return;
    const anchors=incremental?[...root.querySelectorAll('.confirm-form')].map(element=>({element,top:element.getBoundingClientRect().top,bottom:element.getBoundingClientRect().bottom})).filter(item=>item.bottom>0&&item.top<innerHeight):[];
    const visible = selected === 'Todos' ? snapshot.formas : snapshot.formas.filter(form => form.setor === selected);
    const pending = visible.filter(form => form.concretada && !form.confirmada).length;
    const content = `<div class="section-head"><h3>Conferência física por forma</h3><span>Conferência: Osmar e José Carlos</span></div>
      <p class="confirm-explanation">As formas seguem o mapa físico da monovia para o fundo. O efetivo confirmado conta somente as concretagens conferidas por Osmar, José Carlos ou um administrador autorizado, uma forma por vez.</p>
      <div class="confirm-guidance ${snapshot.pode_confirmar ? 'ready' : 'restricted'}">${snapshot.pode_confirmar
        ? `<strong>${number(pending)} concretagem(ns) aguardando sua confirmação.</strong> ${snapshot.confirmador_admin
          ? 'Você está como administrador; cada confirmação será registrada em seu usuário. Use o filtro abaixo para localizar as formas pendentes.'
          : 'Confira fisicamente cada forma. As formas sem apontamento também podem ser registradas e confirmadas aqui; programação e liberação são preservadas.'}`
        : '<strong>Confirmação e reversão reservadas a Osmar, José Carlos ou administrador autorizado.</strong> Entre com uma dessas contas para conferir a produção.'}</div>
      <label class="confirm-show-all"><input id="confirm-only-pending" type="checkbox" ${showAllForms ? '' : 'checked'}> Mostrar apenas concretadas pendentes de confirmação</label>
      ${(selected === 'Todos' ? sectors : [selected]).map(renderSector).join('')}`;
    if (incremental) {
      const next = root.cloneNode(false); next.innerHTML = content;
      reconcile(root, next);
    } else root.innerHTML = content;
    if (!root.dataset.actionsBound) {
      root.dataset.actionsBound = 'true';
      root.addEventListener('change', event => {
        if (event.target.id !== 'confirm-only-pending') return;
        showAllForms = !event.target.checked; render(true);
      });
      root.addEventListener('click', event => {
        const button = event.target.closest('button'); if (!button) return;
        const action = {currentTarget:button};
        if (button.hasAttribute('data-confirm-index')) confirmForm(action);
        else if (button.hasAttribute('data-reverse-index')) reverseForm(action);
        else if (button.hasAttribute('data-history-index')) showHistory(action);
      });
    }
    window.onAcmpView?.(snapshot, selected, visible);
    const anchor=anchors.find(item=>item.element.isConnected);
    if(anchor)window.scrollBy({top:anchor.element.getBoundingClientRect().top-anchor.top,behavior:'instant'});
  }

  window.setAcmpSector = sector => {
    if (sector !== 'Todos' && !sectors.includes(sector)) return;
    selected = sector;
    render();
  };

  let mutating=false;
  function dialog(title,body){
    document.querySelector('.confirm-dialog')?.remove();
    const node=document.createElement('dialog');node.className='confirm-dialog';
    node.setAttribute('aria-labelledby','confirm-dialog-title');
    node.innerHTML=`<form><header><div><span class="confirm-dialog-eyebrow">ACOMPANHAMENTO DA CONCRETAGEM</span><h3 id="confirm-dialog-title">${esc(title)}</h3></div><button type="button" data-close aria-label="Fechar">×</button></header><div class="confirm-dialog-body">${body}<p data-error role="alert"></p></div></form>`;
    const opener=document.activeElement,card=opener?.closest('.confirm-form');
    document.body.append(node);const close=()=>{if(!mutating){node.close();node.remove();(opener?.isConnected?opener:card?.isConnected?card:null)?.focus({preventScroll:true});}};
    node.dismiss=close;
    node.querySelector('[data-close]').onclick=close;node.addEventListener('cancel',e=>{e.preventDefault();close();});node.querySelector('[data-cancel]')?.addEventListener('click',close);node.showModal();return node;
  }
  const reference=form=>({data:snapshot.data,setor:form.setor,forma:form.forma,producao_id:form.producao_id,versao_apontamento:form.versao_apontamento});
  async function sendAction(path,payload,node,button){
    if(mutating)return;mutating=true;
    const controls=[...node.querySelectorAll('button,input,select,textarea')].map(el=>[el,el.disabled]);
    controls.forEach(([el])=>{el.disabled=true;});
    const original=button.textContent; button.textContent=node.dataset.saved?'Atualizando…':'Salvando…';
    node.setAttribute('aria-busy','true');node.querySelector('[data-error]').textContent='';
    try{
      if(!node.dataset.saved){
        const response=await fetch(api+path,{method:'POST',credentials:'same-origin',cache:'no-store',headers:{'Content-Type':'application/json','Accept':'application/json'},body:JSON.stringify(payload)});
        const result=await response.json();if(!response.ok)throw Error(result.error||`Erro ${response.status}`);
        node.dataset.saved='true';
      }
      await window.loadConfirmacaoFormas(payload.data,{background:true});
      mutating=false;node.dismiss();
      document.querySelector('.confirm-notice')?.remove();
      const notice=document.createElement('div');notice.className='confirm-notice';notice.setAttribute('role','status');
      notice.textContent=path==='/reverter'?'Produção revertida. Contagem atualizada.':'Produção confirmada. Contagem atualizada.';
      document.body.append(notice);setTimeout(()=>notice.remove(),5000);
    }catch(error){node.querySelector('[data-error]').textContent=node.dataset.saved?`A alteração foi salva, mas a contagem não pôde ser atualizada. Clique em Atualizar contagem para tentar novamente. ${error.message}`:error.message;}
    finally{mutating=false;controls.forEach(([el,disabled])=>{el.disabled=disabled;});button.textContent=node.dataset.saved?'Atualizar contagem':original;node.removeAttribute('aria-busy');}
  }
  async function confirmForm(event){
    const button=event.currentTarget,form=snapshot?.formas[Number(button.dataset.confirmIndex)];
    if(!form||!snapshot.pode_confirmar||mutating)return;
    if(form.concretada){
      const date=new Date(snapshot.data+'T12:00:00').toLocaleDateString('pt-BR');
      const node=dialog('Confirmar produção',`<p class="confirm-dialog-lead">Confira a forma abaixo antes de confirmar a produção física.</p><dl class="confirm-dialog-details"><div><dt>Forma</dt><dd>${esc(form.forma)}</dd></div><div><dt>Setor</dt><dd>${esc(form.setor)}</dd></div><div><dt>Data de produção</dt><dd>${esc(date)}</dd></div><div><dt>Modelo</dt><dd>${esc(form.modelo||'Não informado')}</dd></div></dl><p class="confirm-dialog-info">A confirmação será registrada no seu usuário e atualizará a contagem automaticamente.</p><div class="confirm-dialog-actions"><button type="button" data-cancel autofocus>Cancelar</button><button type="submit" class="confirm-action">Confirmar produção</button></div>`);
      node.querySelector('form').onsubmit=e=>{e.preventDefault();sendAction('/confirmar',reference(form),node,node.querySelector('[type=submit]'));};return;
    }
    const options=(snapshot.produtos||[]).filter(p=>Number(p.setor_id)===Number(form.setor.slice(-1)));
    const fixed=form.codigo_produto;
    const product=fixed?`<p>Modelo: <strong>${esc(form.modelo||'')}</strong> · código ${esc(fixed)}</p><input type="hidden" name="codigo_produto" value="${esc(fixed)}">`:
      `<label>Modelo produzido<select name="codigo_produto" required><option value="">Selecione o modelo</option>${options.map(p=>`<option value="${esc(p.codigo)}">${esc(p.nome)} · ${esc(p.codigo)}</option>`).join('')}</select></label>`;
    const node=dialog(`Registrar e confirmar · ${form.forma}`,`<p>${esc(form.setor)} · ${esc(snapshot.data)}. A concretagem ainda não foi apontada. Esta ação registra a produção e confirma a conferência física.</p><p>Programação e liberação não serão alteradas.</p>${product}<label>Tipo de concreto<select name="tipo_concreto" required>${(snapshot.tipos_concreto||[]).map(t=>`<option>${esc(t)}</option>`).join('')}</select></label><label>Observação (opcional)<textarea name="motivo" maxlength="1000"></textarea></label><div class="confirm-dialog-actions"><button type="button" data-cancel>Cancelar</button><button type="submit" class="confirm-action">Registrar e confirmar produção</button></div>`);
    node.querySelector('form').onsubmit=e=>{e.preventDefault();const values=Object.fromEntries(new FormData(e.currentTarget));sendAction('/confirmar',{...reference(form),...values},node,node.querySelector('[type=submit]'));};
  }
  async function reverseForm(event){
    const form=snapshot?.formas[Number(event.currentTarget.dataset.reverseIndex)];
    if(!form?.concretada||!snapshot.pode_reverter||mutating)return;
    const node=dialog(`Reverter produção · ${form.forma}`,`<p>A concretagem e sua confirmação sairão da contagem de ${esc(snapshot.data)} para ${esc(form.setor)}. Programação e liberação serão mantidas.</p><p>O apontamento anterior, o responsável e o motivo ficarão registrados no histórico.</p><label>Motivo da reversão<textarea name="motivo" minlength="3" maxlength="1000" required></textarea></label><div class="confirm-dialog-actions"><button type="button" data-cancel>Cancelar</button><button type="submit" class="confirm-action confirm-reverse">Reverter produção</button></div>`);
    node.querySelector('form').onsubmit=e=>{e.preventDefault();const f=new FormData(e.currentTarget);sendAction('/reverter',{...reference(form),motivo:f.get('motivo')},node,node.querySelector('[type=submit]'));};
  }
  async function showHistory(event){
    const form=snapshot?.formas[Number(event.currentTarget.dataset.historyIndex)];if(!form)return;
    const node=dialog(`Histórico · ${form.forma}`,'<p data-history>Carregando histórico…</p>');
    try{
      const response=await fetch(api+'/historico?'+new URLSearchParams({data:snapshot.data,setor:form.setor,forma:form.forma}),{credentials:'same-origin',cache:'no-store'});
      const data=await response.json();if(!response.ok)throw Error(data.error||'Não foi possível consultar o histórico.');
      const labels={registro_concretagem:'Produção registrada',confirmacao:'Produção confirmada',reversao:'Produção revertida'};
      if(node.isConnected)node.querySelector('[data-history]').innerHTML=data.eventos.length?data.eventos.map(r=>`<span class="confirm-history-event"><strong>${esc(labels[r.acao]||r.acao)}</strong><small>${esc(r.ator_nome)} · ${esc(new Date(r.criado_em).toLocaleString('pt-BR'))}</small>${r.motivo?`<span>${esc(r.motivo)}</span>`:''}</span>`).join(''):'Nenhuma alteração registrada por esta ferramenta.';
    }catch(error){if(node.isConnected)node.querySelector('[data-error]').textContent=error.message;}
  }

  window.loadConfirmacaoFormas = async (day,{background=false}={}) => {
    const id=++requestId;
    const root = document.getElementById('confirmacao-formas');
    const incremental=Boolean(snapshot && snapshot.data===day);
    if (root && !incremental) root.innerHTML = '<div class="confirm-loading">Carregando formas para conferência...</div>';
    root?.setAttribute('aria-busy','true');
    try {
      const response = await fetch(`${api}?data=${encodeURIComponent(day)}&setor=Todos`, {credentials:'same-origin', cache:'no-store'});
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || `Erro ${response.status}`);
      if(id!==requestId)return;
      snapshot = data;
      root?.querySelector('[data-refresh-error]')?.remove();
      render(incremental);
    } catch (error) {
      if(id!==requestId)return;
      if(background)throw error;
      if(incremental){
        root?.querySelector('[data-refresh-error]')?.remove();
        const notice=document.createElement('p');notice.className='confirm-alert';notice.dataset.refreshError='true';notice.setAttribute('role','alert');notice.textContent=`Não foi possível atualizar: ${error.message}. Os dados exibidos são da última consulta. Tente Atualizar novamente.`;root?.append(notice);return;
      }
      snapshot = null;
      if (root) root.innerHTML = `<p class="confirm-alert">Conferência indisponível: ${esc(error.message)}. O efetivo final não foi calculado.</p>`;
      window.onAcmpView?.(null, selected, [], error.message);
    } finally {if(id===requestId)root?.removeAttribute('aria-busy');}
  };
})();

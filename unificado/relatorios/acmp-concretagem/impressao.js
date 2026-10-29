(() => {
  'use strict';
  const esc = value => String(value ?? '').replace(/[&<>"']/g, ch =>
    ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[ch]));
  const qty = value => Number(value || 0).toLocaleString('pt-BR', {maximumFractionDigits: 2});
  const ratio = value => value == null ? '—' : Number(value).toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2});
  const date = value => String(value || '').split('-').reverse().join('/');
  const time = value => {
    if (!value) return '—';
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? '—' : parsed.toLocaleTimeString('pt-BR', {
      timeZone:'America/Sao_Paulo', hour:'2-digit', minute:'2-digit'
    });
  };
  const programTime = form => form.programada_em ? time(form.programada_em)
    : form.programada ? 'Sem horário' : '—';

  function formRows(forms) {
    const laneOrder = {'Esquerda':0,'Direita':1,'Coluna 1':0,'Coluna 2':1,'Coluna 3':2,'Fora do mapa':9};
    const physicalOrder = [...forms].sort((a,b) => a.setor.localeCompare(b.setor,'pt-BR')
      || (a.posicao ?? 999) - (b.posicao ?? 999)
      || (laneOrder[a.lado] ?? 9) - (laneOrder[b.lado] ?? 9));
    return physicalOrder.map(form => `<tr>
      <td>${esc(form.setor)}</td><td><strong>${esc(form.forma)}</strong></td>
      <td>${esc(form.modelo || '—')}</td>
      <td>${esc(programTime(form))}</td>
      <td>${esc(time(form.liberada_em))}</td>
      <td>${esc(form.liberada_por || '—')}</td>
      <td>${esc(time(form.concretada_em))}</td>
      <td>${esc(form.tipo_concreto || '—')}</td>
      <td>${form.confirmada ? 'Sim' : 'Não'}</td>
      <td>${esc(form.confirmado_por || '—')}</td>
    </tr>`).join('');
  }

  function typeSummary(forms) {
    const byType = new Map();
    for (const form of forms) {
      const name = form.modelo || 'Não informado';
      if (!byType.has(name)) byType.set(name, {name, total:0, programadas:0, liberadas:0, concretadas:0, confirmadas:0});
      const row = byType.get(name);
      row.total++;
      for (const key of ['programadas','liberadas','concretadas','confirmadas']) {
        row[key] += Number(Boolean(form[{'programadas':'programada','liberadas':'liberada','concretadas':'concretada','confirmadas':'confirmada'}[key]]));
      }
    }
    const list = [...byType.values()].sort((a,b) => a.name.localeCompare(b.name,'pt-BR'));
    return `<section class="print-summary"><h2>Resumo por tipo de forma</h2>
      <table><thead><tr><th>Tipo de forma</th><th>Formas</th><th>Programadas</th><th>Liberadas</th><th>Concretadas</th><th>Confirmadas</th></tr></thead>
      <tbody>${list.map(row => `<tr><td>${esc(row.name)}</td><td>${qty(row.total)}</td><td>${qty(row.programadas)}</td><td>${qty(row.liberadas)}</td><td>${qty(row.concretadas)}</td><td>${qty(row.confirmadas)}</td></tr>`).join('')}</tbody></table></section>`;
  }

  function laborSummary(snapshot, sector) {
    const ids = sector === 'Todos' ? ['12','3','4'] : sector === 'Setor 1' || sector === 'Setor 2' ? ['12'] : [sector.slice(-1)];
    const labels = {'12':'Setores 1 e 2 (grupo conjunto)','3':'Setor 3','4':'Setor 4'};
    let mod = 0, moi = 0;
    const rows = ids.map(id => {
      const values = snapshot.mao_obra?.[id] || {mod:0,moi:0};
      mod += Number(values.mod || 0); moi += Number(values.moi || 0);
      return `<tr><td>${labels[id]}</td><td>${qty(values.mod)}</td><td>${qty(values.moi)}</td><td>${qty(Number(values.mod || 0)+Number(values.moi || 0))}</td></tr>`;
    }).join('');
    return `<section class="print-summary"><h2>Mão de obra do dia</h2>
      <table><thead><tr><th>Grupo de produção</th><th>MOD</th><th>MOI</th><th>Total de pessoas</th></tr></thead>
      <tbody>${rows}</tbody><tfoot><tr><th>Total</th><th>${qty(mod)}</th><th>${qty(moi)}</th><th>${qty(mod+moi)}</th></tr></tfoot></table>
      <p>MOD e MOI dos setores 1 e 2 são lançados como grupo conjunto no PCP. O MOI do grupo 3 e 4 é dividido igualmente entre os dois setores.</p></section>`;
  }

  function indicatorSummary(snapshot, sector) {
    if (!['Todos','Setor 1','Setor 2'].includes(sector)) return '';
    const indicator = snapshot.indicadores_12;
    if (!indicator) return '';
    const row = (label, value) => `<tr><td>${label}</td><td>${qty(value.postes)}</td>
      <td>${value.sem_peso ? 'Incompleto' : qty(value.peso_kg)}</td>
      <td>${qty(indicator.mod)}</td><td>${qty(indicator.moi)}</td>
      <td>${ratio(value.kg_por_homem)}</td><td>${ratio(value.postes_por_homem)}</td></tr>`;
    const missing = Math.max(indicator.apontado.sem_peso, indicator.confirmado.sem_peso);
    return `<section class="print-summary"><h2>Indicadores · Setores 1 e 2</h2>
      <table><thead><tr><th>Base</th><th>Postes</th><th>Peso (kg)</th><th>MOD</th><th>MOI</th><th>kg / homem</th><th>Postes / homem</th></tr></thead>
      <tbody>${row('Concretagem apontada',indicator.apontado)}${row('Efetivo confirmado',indicator.confirmado)}</tbody></table>
      <p>Denominador: MOD + MOI do grupo 1 e 2 = ${qty(indicator.pessoas)} pessoas. O peso usa o cadastro de produtos do PCP.${missing ? ` Há ${qty(missing)} forma(s) sem peso cadastrado; o indicador kg/homem fica indisponível.` : ''}</p></section>`;
  }

  function renderPrint(snapshot, sector, forms) {
    const print = document.getElementById('print-report');
    if (!print) return;
    print.innerHTML = `<header class="print-header"><h1>Acompanhamento da concretagem · Campinas</h1>
      <p>Data: ${date(snapshot.data)} · Filtro: ${esc(sector)} · Responsável operacional: José Carlos da Silva</p></header>
      <table class="print-forms"><thead><tr><th>Setor</th><th>Forma</th><th>Tipo de forma</th>
      <th>Hora da programação</th><th>Hora da liberação</th><th>Encarregado que liberou</th>
      <th>Hora da concretagem</th><th>Tipo de concreto</th><th>Confirmada</th><th>Usuário que confirmou</th></tr></thead>
      <tbody>${formRows(forms)}</tbody></table>
      ${typeSummary(forms)}${laborSummary(snapshot, sector)}${indicatorSummary(snapshot, sector)}
      <p class="print-footnote">— = sem apontamento. “Sem horário” = programação do PCP registrada somente por data. A confirmação é a contagem final conferida por José Carlos da Silva ou administrador autorizado; o usuário responsável consta na tabela.</p>`;
  }

  window.onAcmpView = (snapshot, sector, forms) => {
    const metrics = {
      formas: forms.length,
      programadas: forms.filter(form => form.programada).length,
      liberadas: forms.filter(form => form.liberada).length,
      concretadas: forms.filter(form => form.concretada).length,
      confirmadas: forms.filter(form => form.confirmada).length,
    };
    for (const [key, value] of Object.entries(metrics)) {
      const element = document.getElementById(key === 'confirmadas' ? 'confirm-kpi' : 'kpi-' + key);
      if (element) element.textContent = snapshot ? qty(value) : '—';
    }
    const button = document.getElementById('btnPrint');
    if (button) button.disabled = !snapshot;
    if (snapshot) renderPrint(snapshot, sector, forms);
    else document.getElementById('print-report').innerHTML = '';
  };
})();

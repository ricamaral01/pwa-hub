(() => {
  const dateFormatter = new Intl.DateTimeFormat('pt-BR', {timeZone: 'America/Sao_Paulo'});
  const rateFormatter = new Intl.NumberFormat('pt-BR', {maximumFractionDigits: 2});

  window.renderTaxaMontagem = records => {
    const body = document.getElementById('miTaxaMontagemBody');
    if (!body) return;
    const table = body.closest('table');
    const head = table.tHead || table.createTHead();
    const days = new Map();
    for (const record of records || []) {
      const day = String(record.finalizado_em || record.finalizadoEm || record.inicio_inspecao_montagem || record.data_fabricacao || '').slice(0, 10);
      if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) continue;
      if (!days.has(day)) days.set(day, {posts: 0, assemblers: new Set()});
      const entry = days.get(day);
      entry.posts++;
      const assembler = String(record.montador_nome || '').trim().toLocaleLowerCase('pt-BR');
      if (assembler && assembler !== 'desconhecido') entry.assemblers.add(assembler);
    }
    const dates = [...days.keys()].sort();
    head.replaceChildren();
    body.replaceChildren();
    const header = document.createElement('tr');
    for (const label of ['Indicador', ...dates.map(day => dateFormatter.format(new Date(day + 'T12:00:00Z')))]) {
      const cell = document.createElement('th');
      cell.scope = 'col';
      cell.textContent = label;
      header.append(cell);
    }
    head.append(header);

    if (!dates.length) {
      const row = document.createElement('tr');
      const cell = document.createElement('td');
      cell.colSpan = 2;
      cell.textContent = 'Nenhuma inspeção concluída no período.';
      row.append(cell);
      body.append(row);
      return;
    }

    for (const [label, getValue, className] of [
      ['Postes inspecionados', entry => entry.posts, ''],
      ['Montadores', entry => entry.assemblers.size || '—', ''],
      ['Postes/montador/dia', entry => entry.assemblers.size ? rateFormatter.format(entry.posts / entry.assemblers.size) : '—', 'mi-taxa-result']
    ]) {
      const row = document.createElement('tr');
      if (className) row.className = className;
      const heading = document.createElement('th');
      heading.scope = 'row';
      heading.textContent = label;
      row.append(heading);
      for (const day of dates) {
        const cell = document.createElement('td');
        cell.textContent = String(getValue(days.get(day)));
        row.append(cell);
      }
      body.append(row);
    }
  };
})();

(() => {
  const dateFormatter = new Intl.DateTimeFormat('pt-BR', {timeZone: 'America/Sao_Paulo'});
  const rateFormatter = new Intl.NumberFormat('pt-BR', {maximumFractionDigits: 2});

  window.renderTaxaMontagem = records => {
    const body = document.getElementById('miTaxaMontagemBody');
    if (!body) return;
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
    body.replaceChildren();
    for (const [day, entry] of [...days].sort(([a], [b]) => b.localeCompare(a))) {
      const count = entry.assemblers.size;
      const dayRow = document.createElement('tr');
      dayRow.className = 'mi-taxa-day';
      const dayCell = document.createElement('th');
      dayCell.colSpan = 2;
      dayCell.scope = 'rowgroup';
      dayCell.textContent = dateFormatter.format(new Date(day + 'T12:00:00Z'));
      dayRow.append(dayCell);
      body.append(dayRow);
      for (const [label, value, className] of [
        ['Postes inspecionados', entry.posts, ''],
        ['Montadores', count || '—', ''],
        ['%', count ? rateFormatter.format(entry.posts / count * 100) + '%' : '—', 'mi-taxa-result']
      ]) {
        const row = document.createElement('tr');
        if (className) row.className = className;
        const heading = document.createElement('th');
        heading.scope = 'row';
        heading.textContent = label;
        const cell = document.createElement('td');
        cell.textContent = String(value);
        row.append(heading, cell);
        body.append(row);
      }
    }
    if (!body.childElementCount) {
      const row = document.createElement('tr');
      const cell = document.createElement('td');
      cell.colSpan = 2;
      cell.textContent = 'Nenhuma inspeção concluída no período.';
      row.append(cell);
      body.append(row);
    }
  };
})();

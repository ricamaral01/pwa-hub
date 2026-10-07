(() => {
  const dateFormatter = new Intl.DateTimeFormat('pt-BR', {timeZone: 'America/Sao_Paulo'});
  const rateFormatter = new Intl.NumberFormat('pt-BR', {maximumFractionDigits: 2});

  window.renderTaxaMontagem = records => {
    const body = document.getElementById('miTaxaMontagemBody');
    if (!body) return;
    const days = new Map();
    for (const record of records || []) {
      const day = String(record.finalizado_em || record.finalizadoEm || '').slice(0, 10);
      if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) continue;
      if (!days.has(day)) days.set(day, {posts: 0, assemblers: new Set()});
      const entry = days.get(day);
      entry.posts++;
      const assembler = String(record.montador_nome || '').trim().toLocaleLowerCase('pt-BR');
      if (assembler && assembler !== 'desconhecido') entry.assemblers.add(assembler);
    }
    body.replaceChildren();
    for (const [day, entry] of [...days].sort(([a], [b]) => b.localeCompare(a))) {
      const row = document.createElement('tr');
      const count = entry.assemblers.size;
      for (const value of [dateFormatter.format(new Date(day + 'T12:00:00Z')),
                           entry.posts, count || '—', count ? rateFormatter.format(entry.posts / count) : '—']) {
        const cell = document.createElement('td');
        cell.textContent = String(value);
        row.append(cell);
      }
      body.append(row);
    }
    if (!body.childElementCount) {
      const row = document.createElement('tr');
      const cell = document.createElement('td');
      cell.colSpan = 4;
      cell.textContent = 'Nenhuma inspeção concluída no período.';
      row.append(cell);
      body.append(row);
    }
  };
})();

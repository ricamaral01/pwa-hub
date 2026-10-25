(() => {
  const rateFormatter = new Intl.NumberFormat('pt-BR', {maximumFractionDigits: 2});
  const dayFormatter = new Intl.DateTimeFormat('pt-BR', {timeZone: 'UTC', day: '2-digit', month: '2-digit'});
  let requestNumber = 0;

  function appendCell(row, tag, value, scope) {
    const cell = document.createElement(tag);
    if (scope) cell.scope = scope;
    cell.textContent = String(value);
    row.append(cell);
  }

  window.renderTaxaMontagem = async records => {
    const body = document.getElementById('miTaxaMontagemBody');
    if (!body) return;
    const currentRequest = ++requestNumber;
    const posts = new Map();
    for (const record of records || []) {
      const day = String(record.finalizado_em || record.finalizadoEm || record.inicio_inspecao_montagem || record.data_fabricacao || '').slice(0, 10);
      if (/^\d{4}-\d{2}-\d{2}$/.test(day)) posts.set(day, (posts.get(day) || 0) + 1);
    }
    const selectedStart = document.getElementById('miDataInicio')?.value;
    const selectedEnd = document.getElementById('miDataFim')?.value;
    const recordDays = [...posts.keys()].sort();
    const start = selectedStart || recordDays[0] || new Date().toISOString().slice(0, 10);
    const end = selectedEnd || recordDays.at(-1) || start;
    const first = new Date(`${start}T12:00:00Z`);
    const last = new Date(`${end}T12:00:00Z`);
    const span = Math.round((last - first) / 86400000);
    if (!Number.isFinite(span) || span < 0 || span > 3650) {
      body.replaceChildren();
      const row = body.insertRow();
      appendCell(row, 'td', 'Selecione um período de até dez anos.');
      return;
    }
    const dates = Array.from({length: span + 1}, (_, index) => new Date(first.getTime() + index * 86400000).toISOString().slice(0, 10));
    const unified = location.pathname.startsWith('/unificado/');
    let data = null;
    let error = '';
    if (unified) {
      try {
        const params = new URLSearchParams({start, end, sector: document.getElementById('miFiltroSetor')?.value || ''});
        const response = await fetch(`/unificado/mapa/api/dashboard/montagem-logins?${params}`, {credentials: 'same-origin'});
        data = await response.json();
        if (!response.ok || !data.ok) throw new Error(data.error || 'Não foi possível consultar os logins dos montadores.');
      } catch (cause) {
        error = cause.message || 'Não foi possível consultar os logins dos montadores.';
      }
    }
    if (currentRequest !== requestNumber) return;
    const table = body.closest('table');
    const head = table.tHead || table.createTHead();
    head.replaceChildren();
    body.replaceChildren();
    const header = head.insertRow();
    appendCell(header, 'th', 'Período', 'col');
    for (const day of dates) appendCell(header, 'th', dayFormatter.format(new Date(`${day}T12:00:00Z`)), 'col');
    const rows = [
      ['Dia', day => dayFormatter.format(new Date(`${day}T12:00:00Z`))],
      ['Postes inspecionados', day => posts.get(day) || 0],
      ['Montadores', day => !data?.started_on || day < data.started_on ? '—' : data.days[day] || 0],
      ['Postes por montador', day => {
        const count = !data?.started_on || day < data.started_on ? null : data.days[day] || 0;
        return count ? rateFormatter.format((posts.get(day) || 0) / count) : '—';
      }],
    ];
    for (const [label, value] of rows) {
      const row = body.insertRow();
      if (label === 'Postes por montador') row.className = 'mi-taxa-result';
      appendCell(row, 'th', label, 'row');
      for (const day of dates) appendCell(row, 'td', value(day));
    }
    const note = body.closest('.mi-taxa-card')?.querySelector('p');
    if (note) note.textContent = error || (unified
      ? 'Montadores: contas com perfil MONTADOR que entraram no sistema no dia. Antes do início do registro: —.'
      : 'O Mapa antigo não registra logins por usuário e dia. Montadores e divisão aparecem como —.');
  };
})();

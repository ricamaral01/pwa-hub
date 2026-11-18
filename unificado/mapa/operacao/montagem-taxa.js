(() => {
  const rateFormatter = new Intl.NumberFormat('pt-BR', {maximumFractionDigits: 2});
  const dayFormatter = new Intl.DateTimeFormat('pt-BR', {timeZone: 'UTC', day: '2-digit', month: '2-digit'});
  let requestNumber = 0;
  let timelineChart = null;

  function renderTimeline(dates, posts, data, error) {
    const canvas = document.getElementById('miMontagemTimeline');
    const note = document.getElementById('miMontagemTimelineNote');
    const rate = document.getElementById('miPostesPorMontadorLogado');
    const rateMeta = document.getElementById('miPostesPorMontadorMeta');
    const loginsValue = document.getElementById('miMontadoresLogados');
    const inspectedValue = document.getElementById('miPostesInspecionadosLogins');
    if (!canvas) return;
    if (timelineChart) { timelineChart.destroy(); timelineChart = null; }
    const month = dates.at(-1)?.slice(0, 7);
    const monthDays = dates.filter(day => day.startsWith(month));
    const trackedDays = monthDays.filter(day => data?.started_on && day >= data.started_on);
    const inspected = trackedDays.reduce((sum, day) => sum + (posts.get(day) || 0), 0);
    const loginDays = trackedDays.reduce((sum, day) => sum + Number(data.days?.[day] || 0), 0);
    if (rate) rate.textContent = loginDays ? rateFormatter.format(inspected / loginDays) : '—';
    if (loginsValue) loginsValue.textContent = data ? String(loginDays) : '—';
    if (inspectedValue) inspectedValue.textContent = data ? String(inspected) : '—';
    if (rateMeta) rateMeta.textContent = loginDays
      ? `${inspected} inspecionados ÷ ${loginDays} presenças-dia de montadores`
      : 'Sem logins registrados no mês selecionado.';
    if (note) note.textContent = error || (monthDays.length
      ? `Dia a dia de ${monthDays[0].slice(5).replace('-', '/')} a ${monthDays.at(-1).slice(5).replace('-', '/')} · logins por perfil MONTADOR · inspeções conforme os filtros ativos. A relação usa a soma das presenças diárias, não pessoas únicas no mês.`
      : 'Selecione um período para ver a evolução diária.');
    if (!monthDays.length || !data?.started_on || typeof Chart === 'undefined') return;
    const available = day => day >= data.started_on;
    timelineChart = new Chart(canvas.getContext('2d'), {
      type: 'line',
      data: {
        labels: monthDays.map(day => dayFormatter.format(new Date(`${day}T12:00:00Z`))),
        datasets: [
          {label: 'Postes inspecionados', data: monthDays.map(day => available(day) ? posts.get(day) || 0 : null), borderColor: '#e8762a', backgroundColor: '#e8762a', tension: .28, pointRadius: 2, yAxisID: 'volume'},
          {label: 'Montadores logados', data: monthDays.map(day => available(day) ? Number(data.days?.[day] || 0) : null), borderColor: '#285f94', backgroundColor: '#285f94', tension: .28, pointRadius: 2, yAxisID: 'volume'},
          {label: 'Postes / montador', data: monthDays.map(day => {const people = Number(data.days?.[day] || 0); return available(day) && people ? (posts.get(day) || 0) / people : null;}), borderColor: '#16855e', backgroundColor: '#16855e', tension: .28, pointRadius: 2, borderDash: [6, 4], yAxisID: 'rate'}
        ]
      },
      options: {
        responsive: true, maintainAspectRatio: false, interaction: {mode: 'index', intersect: false},
        plugins: {legend: {position: 'bottom'}, tooltip: {callbacks: {label: context => `${context.dataset.label}: ${rateFormatter.format(context.parsed.y)}`}}},
        scales: {
          volume: {type: 'linear', position: 'left', beginAtZero: true, title: {display: true, text: 'Postes / montadores'}, ticks: {precision: 0}},
          rate: {type: 'linear', position: 'right', beginAtZero: true, title: {display: true, text: 'Postes por montador'}, grid: {drawOnChartArea: false}},
          x: {ticks: {autoSkip: true, maxTicksLimit: 12, maxRotation: 0}}
        }
      }
    });
  }

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
    renderTimeline(dates, posts, data, error);
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

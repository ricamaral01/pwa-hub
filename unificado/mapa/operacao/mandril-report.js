/* Relatório de saques confirmados no Unificado, usando a data da tela Mandril Circular. */
(() => {
  const formatDateTime = new Intl.DateTimeFormat('pt-BR', {
    timeZone: 'America/Sao_Paulo', day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: false
  });
  const normalizeForma = value => {
    const text = String(value || '').trim().toUpperCase().replace(/[\s-]/g, '');
    const match = /^SC0*(\d+)$/.exec(text);
    return match ? `SC${String(Number(match[1])).padStart(2, '0')}` : text;
  };
  const parsedTime = value => {
    const time = Date.parse(value || '');
    return Number.isFinite(time) ? time : null;
  };
  const displayTime = value => {
    const time = parsedTime(value);
    return time === null ? '—' : formatDateTime.format(time);
  };
  const elapsed = (start, end) => {
    const first = parsedTime(start);
    const last = parsedTime(end);
    if (first === null || last === null || last < first) return '—';
    const minutes = Math.round((last - first) / 60000);
    return `${Math.floor(minutes / 60)}h ${String(minutes % 60).padStart(2, '0')}min`;
  };
  const csvCell = value => `"${String(value ?? '').replaceAll('"', '""')}"`;

  function init() {
    const view = document.getElementById('viewMandrilCircular');
    const dateInput = document.getElementById('mcFiltroData');
    const status = document.getElementById('mcSaqueStatus');
    if (!view || !dateInput || !status) return;
    const toolbar = status.parentElement;
    const openButton = document.createElement('button');
    openButton.type = 'button';
    openButton.className = 'btn';
    openButton.textContent = 'Relatório de saques';
    toolbar.insertBefore(openButton, status);

    const report = document.createElement('section');
    report.id = 'unificadoMandrilReport';
    report.className = 'unificado-mandril-report';
    report.hidden = true;
    report.innerHTML = `
      <div class="unificado-mandril-report-head">
        <div><h3>Relatório de saques de mandril</h3><p id="umrDate"></p></div>
        <div class="unificado-mandril-report-actions">
          <button type="button" id="umrRefresh">Atualizar</button>
          <button type="button" id="umrCsv">Exportar CSV</button>
          <button type="button" id="umrPrint">Imprimir</button>
        </div>
      </div>
      <p id="umrSummary" role="status" aria-live="polite"></p>
      <div class="unificado-mandril-report-table"><table>
        <thead><tr><th>Fôrma</th><th>Modelo produzido</th><th>Concretagem</th><th>Retirada do mandril</th><th>Tempo após concretagem</th></tr></thead>
        <tbody id="umrRows"></tbody>
      </table></div>`;
    view.append(report);
    const dateLabel = report.querySelector('#umrDate');
    const summary = report.querySelector('#umrSummary');
    const tbody = report.querySelector('#umrRows');
    const refreshButton = report.querySelector('#umrRefresh');
    const csvButton = report.querySelector('#umrCsv');
    const printButton = report.querySelector('#umrPrint');
    let current = null;

    async function load() {
      const date = dateInput.value;
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        report.hidden = false;
        summary.textContent = 'Selecione uma data para consultar os saques.';
        tbody.replaceChildren();
        return;
      }
      report.hidden = false;
      dateLabel.textContent = `Setor 3 · Data de fabricação: ${date.slice(8, 10)}/${date.slice(5, 7)}/${date.slice(0, 4)}`;
      summary.textContent = 'Consultando saques confirmados...';
      refreshButton.disabled = true;
      current = null;
      tbody.replaceChildren();
      try {
        const productionQuery = new URLSearchParams({
          select: 'forma,modelo,data_hora,tipo_concreto', data_fabricacao: `eq.${date}`,
          setor: 'eq.Setor 3', order: 'data_hora.desc'
        });
        const [saqueResponse, productionResponse] = await Promise.all([
          fetch(`/unificado/mapa/api/pcp/saques-mandril?data=${encodeURIComponent(date)}`, { cache: 'no-store' }),
          fetch(`/unificado/mapa/api/rest/v1/producao?${productionQuery}`, { cache: 'no-store' })
        ]);
        if (!saqueResponse.ok || !productionResponse.ok) throw new Error('Consulta indisponível');
        const saques = await saqueResponse.json();
        const producao = await productionResponse.json();
        if (!Array.isArray(saques) || !Array.isArray(producao)) throw new Error('Resposta inválida');
        const byForma = new Map();
        producao.forEach(row => {
          const forma = normalizeForma(row.forma);
          if (forma && !byForma.has(forma)) byForma.set(forma, row);
        });
        const rows = saques.filter(row => row.data_hora_saque)
          .map(row => {
            const forma = normalizeForma(row.codigo_forma);
            const concrete = byForma.get(forma);
            return {
              forma, modelo: concrete?.modelo && concrete.modelo !== 'SC' ? concrete.modelo : 'Pendente',
              concretagem: displayTime(concrete?.data_hora),
              retirada: displayTime(row.data_hora_saque),
              intervalo: elapsed(concrete?.data_hora, row.data_hora_saque),
              timestamp: parsedTime(row.data_hora_saque)
            };
          }).sort((a, b) => (a.timestamp ?? 0) - (b.timestamp ?? 0) || a.forma.localeCompare(b.forma));
        rows.forEach(row => {
          const tr = document.createElement('tr');
          [row.forma, row.modelo, row.concretagem, row.retirada, row.intervalo].forEach(value => {
            const td = document.createElement('td');
            td.textContent = value;
            tr.append(td);
          });
          tbody.append(tr);
        });
        if (!rows.length) {
          const tr = document.createElement('tr');
          const td = document.createElement('td');
          td.colSpan = 5;
          td.textContent = 'Nenhum saque confirmado nesta data.';
          tr.append(td);
          tbody.append(tr);
        }
        summary.textContent = `${rows.length} saque${rows.length === 1 ? '' : 's'} confirmado${rows.length === 1 ? '' : 's'} · Horários de Brasília`;
        current = { date, rows };
      } catch (error) {
        summary.textContent = 'Não foi possível consultar os saques. Tente atualizar.';
        console.warn('Relatório de saques indisponível:', error);
      } finally {
        refreshButton.disabled = false;
      }
    }

    openButton.addEventListener('click', load);
    refreshButton.addEventListener('click', load);
    dateInput.addEventListener('change', () => { report.hidden = true; current = null; });
    csvButton.addEventListener('click', () => {
      if (!current) return;
      const lines = [
        ['Fôrma', 'Modelo produzido', 'Concretagem (Brasília)', 'Retirada do mandril (Brasília)', 'Tempo após concretagem'],
        ...current.rows.map(row => [row.forma, row.modelo, row.concretagem, row.retirada, row.intervalo])
      ];
      const csv = '\ufeff' + lines.map(row => row.map(csvCell).join(';')).join('\r\n');
      const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
      const link = document.createElement('a');
      link.href = url;
      link.download = `saques-mandril-${current.date}.csv`;
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    });
    printButton.addEventListener('click', () => { if (current) window.print(); });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();

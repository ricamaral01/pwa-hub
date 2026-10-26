(() => {
  const api = '/unificado/laboratorio/api/slump/flow';
  const $ = id => document.getElementById(id);
  const date = new Intl.DateTimeFormat('pt-BR', {timeZone:'America/Sao_Paulo', dateStyle:'short'});
  const time = new Intl.DateTimeFormat('pt-BR', {timeZone:'America/Sao_Paulo', hour:'2-digit', minute:'2-digit'});
  const today = () => {
    const parts = Object.fromEntries(new Intl.DateTimeFormat('en-CA', {timeZone:'America/Sao_Paulo', year:'numeric', month:'2-digit', day:'2-digit'}).formatToParts(new Date()).map(part => [part.type, part.value]));
    return `${parts.year}-${parts.month}-${parts.day}`;
  };
  const asDate = value => new Date(`${value}T12:00:00Z`);
  const iso = value => value.toISOString().slice(0, 10);
  const formatDay = value => date.format(asDate(value));
  function preset(days, month = false) {
    const end = asDate(today());
    const start = new Date(end);
    if (month) {
      start.setUTCDate(1);
      start.setUTCMonth(start.getUTCMonth() - 1);
      const last = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + 1, 0)).getUTCDate();
      start.setUTCDate(Math.min(end.getUTCDate(), last));
    } else start.setUTCDate(start.getUTCDate() - days + 1);
    $('inicio').value = iso(start);
    $('fim').value = iso(end);
    load();
  }
  document.querySelectorAll('[data-days]').forEach(button => button.addEventListener('click', () => preset(Number(button.dataset.days))));
  document.querySelector('[data-month]').addEventListener('click', () => preset(1, true));
  $('filter-form').addEventListener('submit', event => {event.preventDefault(); load();});
  $('print').addEventListener('click', () => window.print());
  async function load() {
    const inicio = $('inicio').value, fim = $('fim').value;
    if (!inicio || !fim || fim < inicio || (asDate(fim) - asDate(inicio)) / 86400000 > 31) {
      $('status').textContent = 'Selecione um período de até 1 mês.';
      $('report').hidden = true;
      $('print').disabled = true;
      return;
    }
    $('status').textContent = 'Carregando…';
    $('report').hidden = true;
    $('print').disabled = true;
    try {
      const response = await fetch(`${api}?inicio=${inicio}&fim=${fim}`, {credentials:'same-origin', cache:'no-store'});
      const data = await response.json();
      if (!response.ok) throw new Error(typeof data.detail === 'string' ? data.detail : 'Falha ao consultar Flow.');
      $('periodo').textContent = `${formatDay(inicio)} a ${formatDay(fim)}`;
      $('total').textContent = data.total;
      $('medidos').textContent = data.medidos;
      $('simulados').textContent = data.simulados;
      $('generated').textContent = `Emitido em ${new Intl.DateTimeFormat('pt-BR', {timeZone:'America/Sao_Paulo', dateStyle:'short', timeStyle:'short'}).format(new Date())}`;
      $('rows').replaceChildren();
      for (const row of data.records) {
        const tr = document.createElement('tr');
        const when = new Date(row.medido_em);
        const cells = [date.format(when), time.format(when), row.massada,
          Number(row.valor).toLocaleString('pt-BR', {minimumFractionDigits:0, maximumFractionDigits:2}),
          row.colaborador || '—',
          row.serie_data_origem ? `Massada real de ${formatDay(row.serie_data_origem)}` : '—'];
        for (const item of cells) {const td = document.createElement('td'); td.textContent = item; tr.append(td);}
        $('rows').append(tr);
      }
      $('status').textContent = data.total ? `${data.total} registro(s) encontrado(s).` : 'Nenhum Flow no período.';
      $('report').hidden = false;
      $('print').disabled = false;
    } catch (error) { $('status').textContent = error.message; }
  }
  $('inicio').value = today(); $('fim').value = today(); load();
})();

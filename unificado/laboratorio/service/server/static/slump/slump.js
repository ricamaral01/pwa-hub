(() => {
  const api = '/unificado/laboratorio/api/slump';
  const form = document.getElementById('slump-form');
  const massada = document.getElementById('massada');
  const value = document.getElementById('valor');
  const manualTime = document.getElementById('manual-time');
  const manualField = document.getElementById('manual-time-field');
  const clock = document.getElementById('automatic-time');
  const message = document.getElementById('form-message');
  const save = document.getElementById('save-button');
  const records = document.getElementById('records');
  const dateFormat = new Intl.DateTimeFormat('pt-BR', {timeZone:'America/Sao_Paulo', dateStyle:'short', timeStyle:'short'});

  function localNow() {
    const parts = Object.fromEntries(new Intl.DateTimeFormat('en-CA', {
      timeZone:'America/Sao_Paulo', year:'numeric', month:'2-digit', day:'2-digit',
      hour:'2-digit', minute:'2-digit', hourCycle:'h23'
    }).formatToParts(new Date()).map(part => [part.type, part.value]));
    return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}`;
  }

  function selected(name) { return form.querySelector(`input[name="${name}"]:checked`).value; }
  function syncFields() {
    document.getElementById('value-label').textContent = selected('tipo') === 'slump' ? 'Slump (cm)' : 'Flow (mm)';
    const manual = selected('origem_horario') === 'manual';
    manualField.hidden = !manual;
    manualTime.required = manual;
    clock.hidden = manual;
    if (manual && !manualTime.value) manualTime.value = localNow();
  }
  form.addEventListener('change', syncFields);
  massada.addEventListener('input', () => { massada.value = massada.value.replace(/\D/g, '').slice(0, 6); });

  function showMessage(text, tone = '') {
    message.textContent = text;
    message.className = 'message ' + tone;
  }

  function draw(rows) {
    records.replaceChildren();
    if (!rows.length) {
      const empty = document.createElement('p');
      empty.className = 'empty';
      empty.textContent = 'Ainda não há registros.';
      records.append(empty);
      return;
    }
    for (const row of rows) {
      const item = document.createElement('article');
      item.className = 'record';
      const name = document.createElement('strong');
      name.textContent = `Massada ${row.massada}`;
      const result = document.createElement('span');
      result.className = 'record-value';
      result.textContent = `${row.tipo === 'slump' ? 'Slump' : 'Flow'} ${Number(row.valor).toLocaleString('pt-BR', {maximumFractionDigits:2})} ${row.unidade}`;
      const when = document.createElement('span');
      when.className = 'record-meta';
      when.textContent = dateFormat.format(new Date(row.medido_em)) + (row.origem_horario === 'manual' ? ' · manual' : '');
      const author = document.createElement('span');
      author.className = 'record-meta';
      author.textContent = row.criado_por;
      item.append(name, result, when, author);
      records.append(item);
    }
  }

  async function load() {
    try {
      const response = await fetch(api, {credentials:'same-origin', cache:'no-store'});
      if (!response.ok) throw new Error('Não foi possível carregar os registros.');
      draw((await response.json()).records);
    } catch (error) {
      records.textContent = error.message;
    }
  }

  form.addEventListener('submit', async event => {
    event.preventDefault();
    showMessage('');
    const amount = value.value.trim().replace(',', '.');
    if (!/^\d+(?:\.\d{1,2})?$/.test(amount) || Number(amount) <= 0 || Number(amount) > 9999.99) {
      showMessage('Informe uma medida positiva com até duas casas decimais.', 'error');
      value.focus();
      return;
    }
    if (!form.reportValidity()) return;
    const manual = selected('origem_horario') === 'manual';
    const payload = {
      massada:massada.value, tipo:selected('tipo'), valor:amount,
      origem_horario:manual ? 'manual' : 'automatico',
      medido_em_local:manual ? manualTime.value : null,
    };
    save.disabled = true;
    try {
      const response = await fetch(api, {
        method:'POST', credentials:'same-origin',
        headers:{'Content-Type':'application/json'}, body:JSON.stringify(payload)
      });
      if (!response.ok) {
        const result = await response.json().catch(() => ({}));
        throw new Error(typeof result.detail === 'string' ? result.detail : 'Não foi possível salvar o registro.');
      }
      const row = await response.json();
      form.reset();
      syncFields();
      showMessage(`Massada ${row.massada} registrada com sucesso.`, 'success');
      await load();
      massada.focus();
    } catch (error) {
      showMessage(error.message, 'error');
    } finally {
      save.disabled = false;
    }
  });

  syncFields();
  load();
})();

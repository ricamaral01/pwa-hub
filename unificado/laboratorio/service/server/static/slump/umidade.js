(() => {
  const api = '/unificado/laboratorio/api/slump/umidade';
  const $ = id => document.getElementById(id);
  const form = $('umidade-form');
  const wet = $('peso-umido');
  const dry = $('peso-seco');
  const number = value => Number(value.trim().replace(',', '.'));
  const validNumber = value => /^\d+(?:[,.]\d{1,2})?$/.test(value.trim()) && number(value) > 0 && number(value) <= 999999.99;
  const format = value => Number(value).toLocaleString('pt-BR', {minimumFractionDigits:2, maximumFractionDigits:2});
  const date = new Intl.DateTimeFormat('pt-BR', {timeZone:'America/Sao_Paulo', dateStyle:'short'});
  const time = new Intl.DateTimeFormat('pt-BR', {timeZone:'America/Sao_Paulo', hour:'2-digit', minute:'2-digit'});

  function localNow() {
    const parts = Object.fromEntries(new Intl.DateTimeFormat('en-CA', {
      timeZone:'America/Sao_Paulo', year:'numeric', month:'2-digit', day:'2-digit',
      hour:'2-digit', minute:'2-digit', hourCycle:'h23'
    }).formatToParts(new Date()).map(part => [part.type, part.value]));
    return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}`;
  }

  function calculate() {
    const ok = validNumber(wet.value) && validNumber(dry.value) && number(wet.value) >= number(dry.value);
    const removed = ok ? number(wet.value) - number(dry.value) : 0;
    $('result-r').textContent = ok ? `${format(removed)} g` : '—';
    $('result-u').textContent = ok ? `${format(removed / number(dry.value) * 100)}%` : '—';
    $('result-status').textContent = ok ? 'Resultado calculado automaticamente' : 'Informe PU e PS positivos, com PU ≥ PS.';
    return ok;
  }

  function message(value, tone = '') {
    $('form-message').textContent = value;
    $('form-message').className = `message ${tone}`;
  }

  function showPrint(row) {
    const when = new Date(row.medido_em);
    const fields = {
      'pdf-emissao': date.format(new Date()), 'pdf-unidade': row.unidade,
      'pdf-data': date.format(when), 'pdf-responsavel': row.responsavel,
      'pdf-hora': time.format(when),
      'pdf-material': row.tipo_areia === 'natural' ? 'Areia natural' : 'Areia industrial',
      'pdf-caixa': row.caixa, 'pdf-pu': format(row.peso_umido),
      'pdf-ps': format(row.peso_seco), 'pdf-r': format(row.agua_removida),
      'pdf-u': format(row.umidade_percentual), 'pdf-id': row.id
    };
    for (const [id, value] of Object.entries(fields)) $(id).textContent = value;
    $('impressao').hidden = false;
    $('impressao').scrollIntoView({behavior:'smooth', block:'start'});
  }

  function draw(rows) {
    $('records').replaceChildren();
    if (!rows.length) {
      $('records').textContent = 'Ainda não há ensaios registrados.';
      return;
    }
    for (const row of rows) {
      const item = document.createElement('article');
      item.className = 'record';
      const title = document.createElement('strong');
      title.textContent = `${row.tipo_areia === 'natural' ? 'Areia natural' : 'Areia industrial'} · ${row.caixa}`;
      const humidity = document.createElement('b');
      humidity.textContent = `${format(row.umidade_percentual)}%`;
      const detail = document.createElement('small');
      detail.textContent = `${date.format(new Date(row.medido_em))} ${time.format(new Date(row.medido_em))} · ${row.unidade} · ${row.responsavel}`;
      const print = document.createElement('button');
      print.type = 'button';
      print.textContent = 'Ver PDF';
      print.addEventListener('click', () => showPrint(row));
      item.append(title, humidity, detail, print);
      $('records').append(item);
    }
  }

  async function load() {
    try {
      const response = await fetch(api, {credentials:'same-origin', cache:'no-store'});
      if (!response.ok) throw new Error('Não foi possível carregar os registros.');
      draw((await response.json()).records);
    } catch (error) {
      $('records').textContent = error.message;
    }
  }

  form.addEventListener('submit', async event => {
    event.preventDefault();
    message('');
    if (!form.reportValidity()) return;
    if (!calculate()) {
      message('Confira os pesos: PU e PS devem ser positivos, com PU maior ou igual a PS.', 'error');
      wet.focus();
      return;
    }
    const payload = {
      medido_em_local: $('medido-em').value,
      responsavel: $('responsavel').value.trim(),
      tipo_areia: $('tipo-areia').value,
      caixa: $('caixa').value.trim(),
      unidade: $('unidade').value.trim(),
      peso_umido: number(wet.value).toFixed(2),
      peso_seco: number(dry.value).toFixed(2)
    };
    if (!payload.responsavel || !payload.caixa || !payload.unidade) {
      message('Preencha responsável, caixa e unidade.', 'error');
      return;
    }
    $('save').disabled = true;
    try {
      const response = await fetch(api, {
        method:'POST', credentials:'same-origin', headers:{'Content-Type':'application/json'},
        body:JSON.stringify(payload)
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(typeof result.detail === 'string' ? result.detail : 'Não foi possível salvar o ensaio.');
      message('Ensaio salvo. O relatório está pronto para imprimir ou salvar em PDF.', 'success');
      wet.value = '';
      dry.value = '';
      calculate();
      showPrint(result);
      await load();
    } catch (error) {
      message(error.message, 'error');
    } finally {
      $('save').disabled = false;
    }
  });

  wet.addEventListener('input', calculate);
  dry.addEventListener('input', calculate);
  $('print').addEventListener('click', () => window.print());
  $('medido-em').value = localNow();
  load();
})();

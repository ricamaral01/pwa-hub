const documents = [
  {
    id: 'it-cqc-03', code: 'IT-CQC-03', name: 'Moldagem e rompimento de corpos de prova',
    area: 'CQC', type: 'Instrução de trabalho', revision: 2, status: 'Aprovado', updated: '08/09/2026',
    versions: [
      { revision: 2, file: 'IT CQC-03 rev02 - Moldagem e rompimento de corpos de prova.doc', format: 'Word · 400 KB', date: '08/09/2026', current: true },
      { revision: 1, file: 'IT CQC-03 rev01 - Moldagem e rompimento de corpos de prova.doc', format: 'Word · 399 KB', date: '20/07/2026' },
    ],
    science: { done: false, text: 'Pendente para a versão vigente. A confirmação ficará disponível após o contrato de identidade e escrita do GED nativo.' },
    reads: [],
  },
  {
    id: 'fl-sgq-01', code: 'FL-SGQ-01', name: 'Planejamento de auditorias',
    area: 'SGQ', type: 'Formulário', revision: 1, status: 'Aprovado', updated: '08/09/2026',
    versions: [
      { revision: 1, file: 'FL SGQ-01 rev 01 - Planejamento das auditorias internas - 2023.xls', format: 'Excel · 364 KB', date: '08/09/2026', current: true },
    ],
    science: { done: true, text: 'Exemplo de ciência confirmada para a revisão 1.' },
    reads: [{ name: 'Pessoa de demonstração', date: '15/10/2026 · 14h20' }],
  },
  {
    id: 'exemplo', code: 'DOC-EXEMPLO', name: 'Exemplo de revisão em andamento',
    area: 'SGQ', type: 'Documento de demonstração', revision: 0, status: 'Em revisão', updated: '15/10/2026',
    versions: [{ revision: 0, file: 'exemplo-revisao.pdf', format: 'PDF · exemplo', date: '15/10/2026', current: true }],
    science: { done: false, text: 'A ciência só será solicitada após a publicação.' },
    reads: [],
  },
];

const byId = id => document.getElementById(id);
const safe = value => String(value).replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));

function renderList() {
  const search = byId('search').value.trim().toLocaleLowerCase('pt-BR');
  const status = byId('status-filter').value;
  const filtered = documents.filter(doc => (!status || doc.status === status) &&
    (!search || `${doc.code} ${doc.name}`.toLocaleLowerCase('pt-BR').includes(search)));
  byId('document-count').textContent = `${filtered.length} documento${filtered.length === 1 ? '' : 's'}`;
  byId('empty-list').hidden = filtered.length !== 0;
  byId('document-rows').innerHTML = filtered.map(doc => `<tr>
    <td><span class="doc-code">${safe(doc.code)}</span><span class="doc-name">${safe(doc.name)}</span></td>
    <td>${safe(doc.area)}</td><td>Rev. ${doc.revision}</td>
    <td><span class="status-pill ${doc.status === 'Em revisão' ? 'review' : ''}">${safe(doc.status)}</span></td>
    <td>${safe(doc.updated)}</td>
    <td><button type="button" class="open-button" data-open="${safe(doc.id)}" aria-label="Abrir ${safe(doc.code)}">Ver detalhe →</button></td>
  </tr>`).join('');
}

function renderDetail(doc) {
  byId('detail-code').textContent = `${doc.code} · ${doc.area}`;
  byId('detail-title').textContent = doc.name;
  byId('detail-description').textContent = `${doc.type} · Histórico e registro de leitura`;
  const pill = byId('detail-status');
  pill.textContent = doc.status;
  pill.className = `status-pill${doc.status === 'Em revisão' ? ' review' : ''}`;
  byId('detail-summary').innerHTML = [
    ['Código', doc.code], ['Área', doc.area], ['Revisão vigente', `Rev. ${doc.revision}`], ['Atualizado em', doc.updated],
  ].map(([label, value]) => `<div class="summary-item"><small>${safe(label)}</small><strong>${safe(value)}</strong></div>`).join('');
  byId('version-count').textContent = `${doc.versions.length} versão${doc.versions.length === 1 ? '' : 'ões'}`;
  byId('versions').innerHTML = doc.versions.map(version => `<div class="version">
    <span class="version-badge">R${version.revision}</span><div><strong>${safe(version.file)}</strong><small>${safe(version.format)} · ${safe(version.date)}</small></div>
    ${version.current ? '<span class="current">Vigente</span>' : ''}
  </div>`).join('');
  byId('science').innerHTML = `<span class="science-state${doc.science.done ? ' done' : ''}">${doc.science.done ? 'Confirmada' : 'Pendente'}</span><p>${safe(doc.science.text)}</p><button type="button" class="readonly-button" disabled>Confirmar ciência</button>`;
  byId('reads').innerHTML = doc.reads.length
    ? doc.reads.map(read => `<div class="read-row"><strong>${safe(read.name)}</strong><span>${safe(read.date)}</span></div>`).join('')
    : '<p>Nenhuma leitura registrada nesta demonstração.</p>';
  byId('list-view').hidden = true;
  byId('detail-view').hidden = false;
  byId('crumb-current').textContent = doc.code;
  window.scrollTo(0, 0);
}

function navigate() {
  const id = new URLSearchParams(location.search).get('documento');
  const doc = documents.find(item => item.id === id);
  if (doc) renderDetail(doc);
  else {
    byId('list-view').hidden = false;
    byId('detail-view').hidden = true;
    byId('crumb-current').textContent = 'Documentos';
    renderList();
  }
}

byId('search').addEventListener('input', renderList);
byId('status-filter').addEventListener('change', renderList);
byId('document-rows').addEventListener('click', event => {
  const button = event.target.closest('[data-open]');
  if (!button) return;
  history.pushState({}, '', `?documento=${encodeURIComponent(button.dataset.open)}`);
  navigate();
});
byId('back').addEventListener('click', () => { history.pushState({}, '', location.pathname); navigate(); });
addEventListener('popstate', navigate);
navigate();

'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const app = fs.readFileSync(path.join(__dirname, '../mapa-concretagem/app.js'), 'utf8');

function trecho(inicio, fim) {
  const from = app.indexOf(inicio);
  const to = app.indexOf(fim, from + inicio.length);
  assert.ok(from >= 0 && to > from, `Trecho nao encontrado: ${inicio}`);
  return app.slice(from, to);
}

const codigo = [
  trecho('const ETAPA_HISTORICO_REPROVACAO', 'function upsertMontagemPoste'),
  trecho('function isLinhaMontagemDashboard', 'function atualizarResumoFiltrosMontagem'),
  trecho('function obterChecklistSectionsLinha', 'function contarDefeitosPossiveisLinha'),
  trecho('function contarDefeitosPossiveisLinha', 'function formatPct'),
  trecho('function obterOcorrenciasDefeitosLinha', 'function renderizarTabelaMontagemPaginada')
].join('\n');

const secoes = [
  { id: 'inspecao_visual', titulo: 'Inspecao visual', itens: [{ id: 'fissura', texto: 'Fissura', codigoFalha: 'F' }] },
  { id: 'acabamento', titulo: 'Acabamento', itens: [{ id: 'preenchimento', texto: 'Falha de preenchimento', codigoFalha: 'B' }] }
];

const contexto = {
  getInspecaoChecklistSections: () => secoes,
  getMontagemChecklistSections: () => secoes,
  getDefeitoInfo: codigo => ({ descricao: codigo === 'B' ? 'Falha de preenchimento' : 'Não especificado' })
};
vm.createContext(contexto);
vm.runInContext(codigo, contexto);

test('reprovacao concluida gera historico estavel sem fotos nem respostas aprovadas', () => {
  const poste = {
    key: 'id||2026-09-01||Setor 3||F-1||INSPECAO',
    recordId: 'poste-1',
    finalizadoEm: '2026-09-02T12:00:00Z',
    statusMontagem: 'RR',
    checklists: {
      inspecao_visual: { fissura: 'sim', fissura_photo: 'foto' },
      acabamento: { preenchimento: 'nao', preenchimento_photo: 'foto' }
    }
  };
  const historico = contexto.criarHistoricoReprovacao(poste);
  assert.equal(historico.key, `${poste.key}||HISTORICO_REPROVACAO||${poste.finalizadoEm}`);
  assert.equal(historico.etapa, 'HISTORICO_REPROVACAO');
  assert.deepEqual(JSON.parse(JSON.stringify(historico.checklists)), { acabamento: { preenchimento: 'nao' } });
  assert.equal(contexto.criarHistoricoReprovacao({ ...poste, statusMontagem: 'A', checklists: {} }), null);
});

test('reprovacao em qualquer secao entra como defeito, mesmo sem status final R', () => {
  const row = {
    setor: 'Setor 3', modelo: 'Circular', status_montagem: 'A',
    checklists: { acabamento: { preenchimento: 'nao' } }
  };
  assert.deepEqual(JSON.parse(JSON.stringify(contexto.obterOcorrenciasDefeitosRegistradosLinha(row))), [
    { codigo: 'B', descricao: 'Falha de preenchimento' }
  ]);
  assert.equal(contexto.isLinhaDefeitoDashboard(row), true);
  assert.equal(contexto.obterDefeitosPossiveisLinha(row).length, 2);
  assert.deepEqual(JSON.parse(JSON.stringify(contexto.obterDefeitosRegistradosLinha({ ...row, status_montagem: 'R', checklists: {} }))), ['Reprovação sem defeito detalhado']);
});

test('reprovacao historica e aprovacao posterior contam um poste e preservam o defeito', () => {
  const base = {
    record_id: 'poste-1', data_fabricacao: '2026-09-01', setor: 'Setor 3',
    forma_numero: 'F-1', modelo: 'Circular'
  };
  const historico = {
    ...base, id: 'principal||HISTORICO_REPROVACAO||2026-09-02T12:00:00Z',
    etapa: 'HISTORICO_REPROVACAO', status_montagem: 'RR',
    finalizado_em: '2026-09-02T12:00:00Z',
    checklists: { acabamento: { preenchimento: 'nao' } }
  };
  const aprovado = {
    ...base, id: 'principal', etapa: 'INSPECAO', status_montagem: 'A',
    finalizado_em: '2026-09-03T12:00:00Z', checklists: {}
  };
  const resumo = contexto.calcularIndicadoresDefeitosMontagem([historico, aprovado], []);
  assert.equal(resumo.postes, 1);
  assert.equal(resumo.postesComDefeito, 1);
  assert.equal(resumo.postesReprovados, 1);
  assert.equal(resumo.retrabalho, 1);
  assert.equal(resumo.totalErros, 1);
  assert.equal(resumo.porTipo['Falha de preenchimento'], 1);
  assert.equal(resumo.ocorrenciasPorTipo['Falha de preenchimento'][0].id, historico.id);
  assert.equal(resumo.totalPossivel, 4);
});

test('duas inspecoes reprovadas mantem duas ocorrencias e um unico poste', () => {
  const base = {
    record_id: 'poste-2', data_fabricacao: '2026-09-01', setor: 'Setor 3',
    forma_numero: 'F-2', modelo: 'Circular', status_montagem: 'RR',
    etapa: 'HISTORICO_REPROVACAO', checklists: { acabamento: { preenchimento: 'nao' } }
  };
  const resumo = contexto.calcularIndicadoresDefeitosMontagem([
    { ...base, id: 'tentativa-1', finalizado_em: '2026-09-02T12:00:00Z' },
    { ...base, id: 'tentativa-2', finalizado_em: '2026-09-03T12:00:00Z' }
  ], []);
  assert.equal(resumo.postes, 1);
  assert.equal(resumo.postesComDefeito, 1);
  assert.equal(resumo.totalErros, 2);
});

test('registro atual reprovado nao duplica a mesma tentativa arquivada', () => {
  const data = '2026-09-02T12:00:00Z';
  const atual = { id: 'principal', etapa: 'INSPECAO', finalizado_em: data, status_montagem: 'RR' };
  const historico = { ...atual, id: `principal||HISTORICO_REPROVACAO||${data}`, etapa: 'HISTORICO_REPROVACAO' };
  const rows = contexto.removerReprovacoesDuplicadasDashboard([atual, historico]);
  assert.equal(rows.length, 1);
  assert.equal(rows[0].etapa, 'HISTORICO_REPROVACAO');
});

test('finalizacao grava o historico e reenvia quando a sincronizacao estiver disponivel', async () => {
  const salvos = [];
  const enviados = [];
  contexto.upsertMontagemPoste = row => salvos.push(row);
  contexto.syncMontagemPosteToApi = async (row, etapa) => {
    enviados.push([row, etapa]);
    return { synced: true };
  };
  const poste = {
    key: 'poste-1||INSPECAO', finalizadoEm: '2026-09-02T12:00:00Z',
    statusMontagem: 'R', checklists: { acabamento: { preenchimento: 'nao' } }
  };
  const result = await contexto.registrarHistoricoReprovacao(poste);
  assert.equal(result.synced, true);
  assert.equal(salvos.length, 1);
  assert.equal(enviados[0][1], 'HISTORICO_REPROVACAO');
  assert.equal(enviados[0][0].key, salvos[0].key);
  assert.equal((app.match(/await registrarHistoricoReprovacao\(finalEntry\)/g) || []).length, 2);
  assert.equal((app.match(/if \(isRework\) await registrarHistoricoReprovacao\(atual\)/g) || []).length, 2);
});

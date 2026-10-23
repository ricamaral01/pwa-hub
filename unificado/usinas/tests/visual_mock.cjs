// Exercício visual isolado: dados fictícios, sem login ou acesso à VPS.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require(path.resolve(__dirname, '../../../dosagem-concreto-v2/node_modules/playwright'));

(async () => {
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    const html = fs.readFileSync(path.resolve(__dirname, '../index.html'), 'utf8');
    const base = { nome_traco: 'C30 teste', revisao_grupo: 'grupo-ficticio',
      cimento1: 25, cimento2: 350, agregado1: 600, agua: 175,
      alterado_por: 'teste', observacao_revisao: 'Dado fictício' };
    const rows = [
      { ...base, id: 2, revisao_numero: 2, ativa: true },
      { ...base, id: 1, revisao_numero: 1, ativa: false },
    ];
    let sync = { last_success_at: new Date().toISOString(), age_seconds: 4 };
    await page.route('**/unificado/mapa/api/usina/receitas', route => route.fulfill({
      contentType: 'application/json', body: JSON.stringify({ ok: true, rows,
        edicao_habilitada: false, sync }),
    }));
    await page.route('**/unificado/usinas/', route => route.fulfill({
      contentType: 'text/html; charset=utf-8', body: html,
    }));
    await page.route('**/unificado/?view=usinas/', route => route.fulfill({
      contentType: 'text/html', body: '<iframe src="/unificado/usinas/" style="width:100%;height:100vh;border:0"></iframe>',
    }));
    await page.goto('http://usinas.test/unificado/?view=usinas/');
    const frame = page.frameLocator('iframe');
    await frame.locator('#total').getByText('2').waitFor();
    assert.equal(await frame.locator('tbody tr').count(), 2);
    await frame.locator('tbody tr').first().getByRole('button', { name: /Consultar/ }).click();
    assert.equal(await frame.locator('#detalhe').isVisible(), true);
    assert.equal(await frame.locator('#revisoes .revision-link').count(), 2);
    assert.match(await frame.locator('#campos').textContent(), /Filler25 kg/);
    assert.match(await frame.locator('#campos').textContent(), /Cimento350 kg/);
    assert.match(await frame.locator('#indicadores').textContent(), /Relação água\/cimento0,50/);
    assert.equal(await frame.locator('#campos .detail-item:not(.print-extra)').count(), 10);
    await frame.locator('#revisoes .revision-link').last().click();
    assert.match(await frame.locator('#detalhe-meta').textContent(), /ID #1 · Revisão 1 · Inativa/);
    await frame.locator('#revisoes .revision-link').first().click();
    assert.equal(await frame.getByRole('button', { name: 'Salvar' }).count(), 0);
    const capture = path.resolve(__dirname, '../../../docs/porting/usinas/execucao/fases/captura-U06-sintetica.png');
    await frame.locator('#detalhe').screenshot({ path: capture });
    await page.emulateMedia({ media: 'print' });
    assert.equal(await frame.locator('#campos .detail-item:not(.print-extra):visible').count(), 10);
    assert.equal(await frame.locator('#observacao').isVisible(), false);
    const printCapture = path.resolve(__dirname, '../../../docs/porting/usinas/execucao/fases/captura-U06-impressao-sintetica.png');
    await frame.locator('#detalhe').screenshot({ path: printCapture });
    await page.emulateMedia({ media: 'screen' });
    await frame.locator('#fechar').click();
    await frame.locator('#buscar').fill('inexistente');
    assert.equal(await frame.locator('tbody tr').count(), 0);
    sync = null;
    await frame.locator('#buscar').evaluate(() => load());
    assert.match(await frame.locator('#aviso').textContent(), /atualização está atrasada/);
    assert.equal(await frame.locator('#aviso').evaluate(node => node.classList.contains('error')), true);
    sync = { last_success_at: new Date().toISOString(), age_seconds: 4,
      source_count: 2, mirror_count: 1 };
    await frame.locator('#buscar').evaluate(() => load());
    assert.equal(await frame.locator('#aviso').evaluate(node => node.classList.contains('error')), true);
    console.log('U06 visual sintético: lista, detalhe, revisões, busca, estado do espelho e ausência de edição OK');
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });

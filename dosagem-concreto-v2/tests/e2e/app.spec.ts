import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.beforeEach(async ({ page }) => {
  await page.route('**/api/v1/auth/sessao', r => r.fulfill({ contentType: 'application/json', body: JSON.stringify({ email: 'teste@example.com', nome: 'Teste', papel: 'admin', unidades: ['*'] }) }));
  await page.route('**/api/v1/rpc', async r => {
    const body = r.request().postDataJSON() as { acao: string; requestId: string; dados: Record<string, unknown> };
    expect(r.request().headers()['x-requested-with']).toBe('dosagem');
    expect(r.request().headers()['idempotency-key']).toBe(body.requestId);
    expect(r.request().headers()['content-type']).toContain('application/json');
    const dados = body.acao === 'tracos.listar' ? [] : body.acao === 'tracos.salvarVersao' ? { id: body.dados.id, versao: 1, revisao: 1, documento: { ...body.dados, codigo: 'TR-0001', versao: 1, revisao: 1 } } : [];
    await r.fulfill({ contentType: 'application/json', body: JSON.stringify({ ok: true, dados, servidorEm: new Date().toISOString() }) });
  });
});

test('casca responsiva e acesso ao editor', async ({ page }, testInfo) => {
  await page.goto('./');
  await expect(page.locator('h1')).toContainText('O que precisa');
  await page.screenshot({ path: `tests/e2e/__screenshots__/inicio-${testInfo.project.name}.png`, fullPage: true });
  await page.locator('.ct-page-heading button').click();
  await expect(page.locator('h1')).toContainText('Novo traço');
  await page.screenshot({ path: `tests/e2e/__screenshots__/editor-${testInfo.project.name}.png`, fullPage: true });
  await expect(page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).resolves.toBe(true);
});

test('salvar com confirmação e reabrir rascunho', async ({ page }) => {
  await page.goto('./');
  await page.locator('.ct-page-heading button').click();
  await page.locator('.ct-stepper button').nth(1).click();
  const materiais = [
    { categoria: 'cimento', nome: 'Cimento', rho: '3,12', massa: '350' },
    { categoria: 'areia', nome: 'Areia 1', rho: '2,60', massa: '400' },
    { categoria: 'areia', nome: 'Areia 2', rho: '2,50', massa: '100' },
    { categoria: 'agua', nome: 'Água', rho: '1', massa: '175' },
    { categoria: 'aditivo', nome: 'Aditivo 1', rho: '1,10', massa: '3' },
    { categoria: 'aditivo', nome: 'Aditivo 2', rho: '1,20', massa: '4' }
  ];
  for (const [index, m] of materiais.entries()) {
    await page.getByRole('button', { name: /Material/ }).first().click();
    const card = page.locator('.ct-material').nth(index);
    await card.locator('select').selectOption(m.categoria);
    await card.locator('input[id^="nome-"]').fill(m.nome);
    await card.locator('input[id^="rho-"]').fill(m.rho);
  }
  await page.locator('.ct-stepper button').nth(2).click();
  for (const [index, m] of materiais.entries()) await page.locator('.ct-table tbody tr').nth(index).locator('input').fill(m.massa);
  await expect(page.locator('.ct-result-panel')).toContainText('0,500');
  if (page.viewportSize()!.width < 600) {
    await page.locator('.ct-editor-actions').getByRole('button', { name: 'Avançar' }).click();
    await page.locator('.ct-editor-actions').getByRole('button', { name: 'Avançar' }).click();
  }
  await page.getByRole('button', { name: 'Salvar traço' }).last().click();
  await expect(page.getByRole('status').first()).toContainText('Salvo no servidor');
  await page.waitForTimeout(1000);
  await page.reload();
  await expect(page.locator('.ct-material')).toHaveCount(0);
  await page.locator('.ct-stepper button').nth(1).click();
  await expect(page.locator('.ct-material')).toHaveCount(6);
});

test('axe na tela inicial', async ({ page }) => {
  await page.goto('./');
  const a = await new AxeBuilder({ page }).analyze();
  expect(a.violations.filter(v => v.impact === 'serious' || v.impact === 'critical')).toEqual([]);
});

test('módulos separados de empacotamento e volume', async ({ page }) => {
  await page.goto('./');
  await expect(page.getByRole('link', { name: 'Abrir módulo por volume' })).toBeVisible();
  await page.getByRole('link', { name: 'Abrir módulo de empacotamento' }).click();
  await expect(page.getByRole('heading', { name: 'Dosagem por empacotamento' })).toBeVisible();
  await expect(page.locator('#r41-method')).toHaveCount(0);
  await page.locator('#packing-sand-1').fill('100;95;80;65;50;35;20;12;8;5;2;1');
  await page.locator('#packing-sand-2').fill('100;100;98;90;75;60;42;25;12;6;3;1');
  await expect(page.getByText('Sugestão:', { exact: false })).toBeVisible();
  await page.getByRole('button', { name: 'Aplicar proporção sugerida ao traço' }).click();
  const first = Number((await page.locator('#r41-sf0').inputValue()).replace(',', '.'));
  const second = Number((await page.locator('#r41-sf1').inputValue()).replace(',', '.'));
  expect(first + second).toBeCloseTo(100, 3);
  const saveRequest = page.waitForRequest(request => request.url().endsWith('/api/v1/rpc') && request.postDataJSON()?.acao === 'tracos.salvarVersao');
  await page.getByRole('button', { name: 'Salvar no servidor' }).click();
  const saved = (await saveRequest).postDataJSON().dados;
  expect(saved.empacotamento.peneirasMm).toHaveLength(12);
  expect(saved.empacotamento.curvasPassantesPct).toEqual([
    [100, 95, 80, 65, 50, 35, 20, 12, 8, 5, 2, 1],
    [100, 100, 98, 90, 75, 60, 42, 25, 12, 6, 3, 1]
  ]);
  expect(saved.metodoDados.sands[0].fraction + saved.metodoDados.sands[1].fraction).toBeCloseTo(1, 6);
  await page.goto('/#/dosagem/volume');
  await expect(page.getByRole('heading', { name: 'Dosagem por volume' })).toBeVisible();
  await expect(page.locator('#r41-alt-ratio')).toBeVisible();
  await expect(page.locator('#packing-sand-1')).toHaveCount(0);
  await expect(page.locator('#r41-method')).toHaveCount(0);
});

test('link antigo abre o módulo de empacotamento', async ({ page }) => {
  await page.goto('/#/dosagem41');
  await expect(page.getByRole('heading', { name: 'Dosagem por empacotamento' })).toBeVisible();
  await expect(page).toHaveURL(/#\/dosagem\/empacotamento$/);
});

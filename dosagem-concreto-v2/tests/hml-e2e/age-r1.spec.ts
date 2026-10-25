import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { resolve } from 'node:path';

async function rpc(page: Page, acao: string, dados: unknown) {
  const requestId = crypto.randomUUID();
  const response = await page.request.post('/api/v1/rpc', { headers: {
    'X-Requested-With': 'dosagem', 'Idempotency-Key': requestId, Origin: new URL(page.url()).origin,
  }, data: { acao, requestId, dados } });
  return response.json();
}

test.beforeEach(async ({ page }) => {
  await page.goto('/auth/login/', { waitUntil: 'domcontentloaded' });
  await page.locator('#email').fill('hml@example.test');
  await page.locator('#password').fill(process.env.HML_TEST_PASSWORD || 'Hml-Test-2026!');
  await page.getByRole('button', { name: 'Entrar com conta local' }).click();
  await expect(page.getByRole('heading', { name: 'O que precisa de você hoje' })).toBeVisible();
});

test('R1-10: curva I1 marca extrapolação e piloto bloqueia desforma real', async ({ page }, testInfo) => {
  await page.goto('/#/comparacao-metodos');
  const savedResponse = page.waitForResponse(response => response.url().endsWith('/api/v1/rpc') &&
    response.request().postDataJSON()?.acao === 'tracos.salvarVersao');
  await page.getByRole('button', { name: 'Salvar no servidor' }).click();
  const saved = await (await savedResponse).json();
  expect(saved.ok).toBe(true);
  const traceId: string = saved.dados.documento.id;
  await page.getByRole('button', { name: 'Liberar para ensaio' }).click();
  await page.locator('#r41-exp-1-cp1MPa').fill('34');
  await page.locator('#r41-exp-2-cp2MPa').fill('37');
  const plan = page.getByRole('heading', { name: 'Plano experimental' }).locator('../..');
  const experimentsResponse = page.waitForResponse(response => response.url().endsWith('/api/v1/rpc') &&
    response.request().postDataJSON()?.acao === 'tracos.salvarVersao');
  await plan.getByRole('button', { name: 'Salvar ensaios do plano' }).click();
  expect((await (await experimentsResponse).json()).ok).toBe(true);
  const approvedResponse = page.waitForResponse(response => response.url().endsWith('/api/v1/rpc') &&
    response.request().postDataJSON()?.acao === 'tracos.aprovar');
  await plan.getByRole('button', { name: 'Aprovar traço' }).click();
  expect((await (await approvedResponse).json()).dados.documento.status).toBe('aprovado');

  await page.goto('/#/producao-r1');
  await page.locator('#r1-trace').selectOption(`${traceId}:v1`);
  await page.locator('#r1-product-name').fill(`Poste I1 ${testInfo.project.name}`);
  const productResponse = page.waitForResponse(response => response.url().endsWith('/api/v1/rpc') &&
    response.request().postDataJSON()?.acao === 'produtos.salvar');
  await page.getByRole('button', { name: 'Salvar produto' }).click();
  const product = await (await productResponse).json();
  expect(product.ok).toBe(true);
  await page.locator('#r1-operator').fill('Laboratório I1');
  await page.locator('#r1-scale').fill('BAL-I1');
  for (const item of saved.dados.documento.itens as { id: string }[]) {
    await page.locator(`#r1-lot-${item.id}`).fill(`I1-${item.id}`);
  }
  const batchResponse = page.waitForResponse(response => response.url().endsWith('/api/v1/rpc') &&
    response.request().postDataJSON()?.acao === 'producoes.salvar');
  await page.getByRole('button', { name: 'Calcular e salvar betonada' }).click();
  const batch = await (await batchResponse).json();
  expect(batch.ok).toBe(true);
  const batchId: string = batch.dados.documento.id;

  for (const [index, strength] of [15, 28, 36.1, 42.8].entries()) {
    await page.locator(`#r1-age-cp1-${index}`).fill(String(strength));
    await page.locator(`#r1-age-cp2-${index}`).fill(String(strength));
  }
  const curve = page.locator('#r1-age-curve');
  await expect(curve).toContainText('44,30');
  await expect(curve).toContainText('Extrapolação');
  await expect(curve).toContainText('0,5 dias');
  await page.locator('#r1-age-responsible').fill('Engenharia de ensaios');
  const saveCurveButton = page.getByRole('button', { name: 'Salvar curva do lote no servidor' });
  await saveCurveButton.scrollIntoViewIfNeeded();
  if (testInfo.project.name === 'celular') await page.evaluate(() => window.scrollBy(0, 240));
  const assayResponse = page.waitForResponse(response => response.url().endsWith('/api/v1/rpc') &&
    response.request().postDataJSON()?.acao === 'ensaios.salvar');
  if (testInfo.project.name === 'celular') {
    const rect = await saveCurveButton.boundingBox();
    expect(rect).toBeTruthy();
    await page.mouse.click(rect!.x + rect!.width / 2, rect!.y + rect!.height / 2);
  } else await saveCurveButton.click();
  const assay = await (await assayResponse).json();
  expect(assay.ok).toBe(true);
  expect(assay.dados.documento.dados.loteProducaoId).toBe(batchId);
  await curve.screenshot({ path: resolve(import.meta.dirname, `../e2e/__screenshots__/curva-i1-${testInfo.project.name}.png`) });

  await expect(page.getByRole('button', { name: 'Desforma real indisponível no piloto' })).toBeDisabled();
  const withoutCp = await rpc(page, 'producoes.liberarDesforma', { id: batchId, idadeHoras: 24,
    ensaiadoEm: new Date().toISOString() });
  expect(withoutCp.ok).toBe(false);
  expect(withoutCp.erro.mensagem).toContain('Piloto: desforma real');
  const withCp = await rpc(page, 'producoes.liberarDesforma', { id: batchId, idadeHoras: 24,
    cpResultadosMPa: [19, 21], ensaiadoEm: new Date().toISOString() });
  expect(withCp.ok).toBe(false);
  expect(withCp.erro.mensagem).toContain('Piloto: desforma real');
  const axe = await new AxeBuilder({ page }).analyze();
  expect(axe.violations.filter(v => v.impact === 'serious' || v.impact === 'critical')).toEqual([]);
});

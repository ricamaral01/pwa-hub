import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { resolve } from 'node:path';

test.beforeEach(async ({ page }) => {
  await page.goto('/auth/login/', { waitUntil: 'domcontentloaded' });
  await page.locator('#email').fill('hml@example.test');
  await page.locator('#password').fill(process.env.HML_TEST_PASSWORD || 'Hml-Test-2026!');
  await page.getByRole('button', { name: 'Entrar com conta local' }).click();
  await expect(page.getByRole('heading', { name: 'O que precisa de você hoje' })).toBeVisible();
});

test('R1-12: betonada aprovada, rastreabilidade e alerta de tolerância', async ({ page }, testInfo) => {
  await page.goto('/#/comparacao-metodos');
  const savedResponse = page.waitForResponse(response => response.url().endsWith('/api/v1/rpc') &&
    response.request().postDataJSON()?.acao === 'tracos.salvarVersao');
  await page.getByRole('button', { name: 'Salvar no servidor' }).click();
  const saved = await (await savedResponse).json();
  expect(saved.ok).toBe(true);
  const traceId: string = saved.dados.documento.id;
  await page.getByRole('button', { name: 'Liberar para ensaio' }).click();
  const plan = page.getByRole('heading', { name: 'Plano experimental' }).locator('../..');
  await page.locator('#r41-exp-1-cp1MPa').fill('34');
  await page.locator('#r41-exp-2-cp2MPa').fill('37');
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
  await page.locator('#r1-volume').fill('1');
  await page.locator('#r1-operator').fill('Laboratório HML');
  await page.locator('#r1-scale').fill('BAL-01');
  const items = saved.dados.documento.itens as { id: string; categoria: string }[];
  expect(items.length).toBeGreaterThan(0);
  for (const item of items) {
    await page.locator(`#r1-lot-${item.id}`).fill(`LOTE-${item.id}`);
    if (item.categoria === 'areia') {
      await page.locator(`#r1-humidity-${item.id}`).fill('11');
      await page.locator(`#r1-absorption-${item.id}`).fill('1');
    } else if (item.categoria === 'brita') {
      await page.locator(`#r1-humidity-${item.id}`).fill('0.5');
      await page.locator(`#r1-absorption-${item.id}`).fill('0.5');
    }
  }
  const batchResponse = page.waitForResponse(response => response.url().endsWith('/api/v1/rpc') &&
    response.request().postDataJSON()?.acao === 'producoes.salvar');
  await page.getByRole('button', { name: 'Calcular e salvar betonada' }).click();
  const batch = await (await batchResponse).json();
  expect(batch.ok).toBe(true);
  expect(batch.dados.documento.rastreabilidade.balancaId).toBe('BAL-01');
  expect(batch.dados.documento.rastreabilidade.responsavel).toBe('Laboratório HML');
  expect(batch.dados.documento.aguaDosadaKg).toBeGreaterThan(0);
  const card = page.getByRole('heading', { name: 'Carta de produção' }).locator('../..');
  await expect(card).toContainText(batch.dados.documento.id);
  await expect(card).toContainText('Água dosada');
  await expect(page.getByRole('heading', { name: 'Rastreabilidade da betonada' }).locator('../..')).toContainText('BAL-01');
  const cement = Object.entries(batch.dados.documento.planejado as Record<string, { categoria: string; massaAPesarKg: number }>)
    .find(([, item]) => item.categoria === 'cimento');
  expect(cement).toBeTruthy();
  await page.locator(`#r1-actual-${cement![0]}`).fill(String(cement![1].massaAPesarKg * 1.02));
  const dosedResponse = page.waitForResponse(response => response.url().endsWith('/api/v1/rpc') &&
    response.request().postDataJSON()?.acao === 'producoes.salvar');
  await card.getByRole('button', { name: 'Registrar dosado' }).click();
  const dosed = await (await dosedResponse).json();
  expect(dosed.ok).toBe(true);
  expect(dosed.dados.documento.alertas.some((alert: { materialId: string }) => alert.materialId === cement![0])).toBe(true);
  await expect(card).toContainText('Alerta:');
  await card.screenshot({ path: resolve(import.meta.dirname, `../e2e/__screenshots__/producao-r1-${testInfo.project.name}.png`) });
  const axe = await new AxeBuilder({ page }).analyze();
  expect(axe.violations.filter(v => v.impact === 'serious' || v.impact === 'critical')).toEqual([]);
});

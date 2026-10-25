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

test('R1-14: rascunho offline, confirmação na reconexão e conflito de revisão', async ({ page, context }, testInfo) => {
  await page.goto('/auth/login/', { waitUntil: 'domcontentloaded' });
  await page.locator('#email').fill('hml@example.test');
  await page.locator('#password').fill(process.env.HML_TEST_PASSWORD || 'Hml-Test-2026!');
  await page.getByRole('button', { name: 'Entrar com conta local' }).click();
  await expect(page.getByRole('heading', { name: 'O que precisa de você hoje' })).toBeVisible();
  const id = crypto.randomUUID();
  const initial = {
    id, nome: `Offline ${testInfo.project.name}`, unidade: 'campinas', metodo: 'manual',
    status: 'rascunho', versao: 0, revisao: 0, arIncorporadoPct: 1.5, normalizarPara1m3: false,
    objetivo: { fckMPa: 40, sdMPa: 4, classe: 'III', estrutura: 'armado', abatimentoMm: 100, toleranciaMm: 20 },
    itens: [
      { id: 'cimento', nome: 'Cimento', categoria: 'cimento', massaKgM3: 400, massaEspecificaKgDm3: 3.15 },
      { id: 'areia', nome: 'Areia', categoria: 'areia', massaKgM3: 700, massaEspecificaKgDm3: 2.65 },
      { id: 'brita', nome: 'Brita', categoria: 'brita', massaKgM3: 1000, massaEspecificaKgDm3: 2.7 },
      { id: 'agua', nome: 'Água', categoria: 'agua', massaKgM3: 190, massaEspecificaKgDm3: 1 },
    ], experimentais: [], auditoria: { criadoPor: 'HML', criadoEm: new Date().toISOString(),
      alteradoPor: 'HML', alteradoEm: new Date().toISOString() },
  };
  const seeded = await rpc(page, 'tracos.salvarVersao', initial);
  expect(seeded.ok, JSON.stringify(seeded)).toBe(true);
  await page.reload();
  await page.goto(`/#/traco/${id}`);
  await expect(page.locator('#traco-nome')).toHaveValue(initial.nome);

  await context.setOffline(true);
  const edited = `${initial.nome} · rascunho`;
  await page.locator('#traco-nome').fill(edited);
  await page.waitForTimeout(950);
  if (testInfo.project.name === 'celular') await page.locator('.ct-stepper button').last().click();
  await page.getByRole('button', { name: 'Salvar traço' }).first().click();
  await expect(page.getByText('Sem rede · na fila').first()).toBeVisible();
  await expect(page.getByText('Salvo no servidor')).toHaveCount(0);
  const local = await page.evaluate(async key => new Promise<unknown>((resolve, reject) => {
    const request = indexedDB.open('concretrack-dosagem-v2');
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const transaction = request.result.transaction('rascunhos', 'readonly');
      const item = transaction.objectStore('rascunhos').get(key);
      item.onerror = () => reject(item.error);
      item.onsuccess = () => resolve(item.result);
    };
  }), id) as { nome: string };
  expect(local.nome).toBe(edited);
  await page.goto('/#/tracos');
  await page.goto(`/#/traco/${id}`);
  await expect(page.locator('#traco-nome')).toHaveValue(edited);
  await page.screenshot({ path: resolve(import.meta.dirname, `../e2e/__screenshots__/offline-r1-${testInfo.project.name}.png`) });

  const syncedResponse = page.waitForResponse(response => response.url().endsWith('/api/v1/rpc') &&
    response.request().postDataJSON()?.acao === 'tracos.salvarVersao');
  await context.setOffline(false);
  const synced = await (await syncedResponse).json();
  expect(synced.ok).toBe(true);
  await expect(page.getByText('Salvo no servidor').first()).toBeVisible();
  await expect(page.locator('#traco-nome')).toHaveValue(edited);
  await expect(page.locator('.ct-editor')).toContainText('revisão 2');

  const current = await rpc(page, 'tracos.obter', { id });
  expect(current.ok).toBe(true);
  const remote = await rpc(page, 'tracos.salvarVersao', {
    ...current.dados, nome: `${initial.nome} · edição remota`,
  });
  expect(remote.ok).toBe(true);
  await page.locator('#traco-nome').fill(`${edited} · edição local`);
  if (testInfo.project.name === 'celular') await page.locator('.ct-stepper button').last().click();
  await page.getByRole('button', { name: 'Salvar traço' }).first().click();
  await expect(page.getByRole('dialog', { name: 'Conflito de revisão' })).toBeVisible();
  await expect(page.getByRole('dialog', { name: 'Conflito de revisão' })).toContainText('edição remota');
  const axe = await new AxeBuilder({ page }).analyze();
  expect(axe.violations.filter(v => v.impact === 'serious' || v.impact === 'critical')).toEqual([]);
});

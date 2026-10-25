import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { resolve } from 'node:path';

async function rpc(page: Page, acao: string, dados: unknown) {
  const requestId = crypto.randomUUID();
  const response = await page.request.post('/api/v1/rpc', { headers: {
    'X-Requested-With': 'dosagem', 'Idempotency-Key': requestId,
    Origin: new URL(page.url()).origin,
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

test('R1-11: S1 preserva snapshot, bloqueia produção e exige decisão', async ({ page }, testInfo) => {
  const materialId = crypto.randomUUID();
  const material = await rpc(page, 'materiais.salvar', {
    id: materialId, unidade: 'campinas', nome: `Areia S1 ${testInfo.project.name}`,
    categoria: 'areia', massaEspecificaKgDm3: 2.68, status: 'ativo',
  });
  expect(material.ok, JSON.stringify(material)).toBe(true);
  await page.goto('/#/comparacao-metodos');
  await page.locator('#r41-material-m3').selectOption(materialId);
  const savedResponse = page.waitForResponse(response => response.url().endsWith('/api/v1/rpc') &&
    response.request().postDataJSON()?.acao === 'tracos.salvarVersao');
  await page.getByRole('button', { name: 'Salvar no servidor' }).click();
  const saved = await (await savedResponse).json();
  expect(saved.ok).toBe(true);
  const traceId: string = saved.dados.documento.id;
  expect(saved.dados.documento.itens.find((item: { id: string }) => item.id === 'm3').materialId,
    JSON.stringify(saved.dados.documento.materialIds)).toBe(materialId);
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

  const changed = await rpc(page, 'materiais.salvar', {
    ...material.dados.documento, massaEspecificaKgDm3: 2.6,
  });
  expect(changed.ok).toBe(true);
  const impacts = await rpc(page, 'avaliacoes.listar', { tracoVersaoChave: `tracos:${traceId}:v1` });
  expect(impacts.ok).toBe(true);
  expect(impacts.dados[0].classificacao).toBe('revisão necessária');
  expect(impacts.dados[0].diferencas.volumeL).toBeCloseTo(6.54, 1);
  const snapshot = await rpc(page, 'tracos.obter', { id: traceId, versao: 1 });
  expect(snapshot.ok).toBe(true);
  expect(snapshot.dados.itens.find((item: { id: string }) => item.id === 'm3').massaEspecificaKgDm3).toBe(2.68);

  await page.goto('/#/producao-r1');
  await page.locator('#r1-trace').selectOption(`${traceId}:v1`);
  const impactCard = page.getByRole('heading', { name: 'Avaliações de impacto do traço aprovado' }).locator('../..');
  await expect(impactCard).toContainText('revisão necessária');
  await page.locator('#r1-operator').fill('Laboratório S1');
  await page.locator('#r1-scale').fill('BAL-S1');
  for (const item of saved.dados.documento.itens as { id: string }[]) {
    await page.locator(`#r1-lot-${item.id}`).fill(`S1-${item.id}`);
  }
  const blockedResponse = page.waitForResponse(response => response.url().endsWith('/api/v1/rpc') &&
    response.request().postDataJSON()?.acao === 'producoes.salvar');
  await page.getByRole('button', { name: 'Calcular e salvar betonada' }).click();
  const blocked = await (await blockedResponse).json();
  expect(blocked.ok).toBe(false);
  expect(blocked.erro.mensagem).toContain('Avaliacao de impacto nao liberada');
  await impactCard.locator('input').fill('Desvio revisado e aceito pelo engenheiro responsável.');
  const decisionResponse = page.waitForResponse(response => response.url().endsWith('/api/v1/rpc') &&
    response.request().postDataJSON()?.acao === 'avaliacoes.decidir');
  await impactCard.getByRole('button', { name: 'Liberar avaliação' }).click();
  expect((await (await decisionResponse).json()).dados.estado).toBe('liberada');
  const productionResponse = page.waitForResponse(response => response.url().endsWith('/api/v1/rpc') &&
    response.request().postDataJSON()?.acao === 'producoes.salvar');
  await page.getByRole('button', { name: 'Calcular e salvar betonada' }).click();
  expect((await (await productionResponse).json()).ok).toBe(true);
  await impactCard.screenshot({ path: resolve(import.meta.dirname, `../e2e/__screenshots__/impacto-s1-${testInfo.project.name}.png`) });
  const axe = await new AxeBuilder({ page }).analyze();
  expect(axe.violations.filter(v => v.impact === 'serious' || v.impact === 'critical')).toEqual([]);
});

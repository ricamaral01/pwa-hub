import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('computador: lista abre sem painel automático; selecionar e fechar preserva a lista', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('task-fixture.html');
  await expect(page.locator('.task-row')).toHaveCount(6);
  await expect(page.locator('.task-detail')).toHaveCount(0);
  await page.locator('.task-row-main').nth(2).click();
  await expect(page.locator('.task-detail h2')).toContainText('Aprovar IT-CQC-03');
  await expect(page.locator('.task-origin-link')).toHaveAttribute('href', '/unificado/?view=ged%2Fdocuments%2Fa3');
  await expect(page.locator('.task-origin-link')).toHaveAttribute('target', '_top');
  await expect(page.locator('.tasks-mobile-home')).toBeHidden();
  expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false);
  await page.getByRole('button', { name: 'Fechar detalhe' }).click();
  const layout=await page.locator('.tasks-center').boundingBox();
  expect(layout!.y).toBeLessThan(20);
});

test('tablet: filtros acessíveis e detalhe aberto por escolha do usuário', async ({ page }) => {
  await page.setViewportSize({ width: 1194, height: 834 });
  await page.goto('task-fixture.html');
  await expect(page.locator('.task-row')).toHaveCount(6);
  await page.locator('.task-row-main').nth(2).click();
  await expect(page.locator('.task-detail')).toBeVisible();
  await page.setViewportSize({ width: 834, height: 1194 });
  await page.reload();
  await expect(page.locator('.task-row')).toHaveCount(6);
  await expect(page.locator('.task-detail')).toHaveCount(0);
  await expect(page.getByRole('combobox', {name:'Visão de tarefas'})).toBeVisible();
});

test('celular: lista direta, detalhe, volta e visões', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('task-fixture.html');
  await expect(page.locator('.task-row')).toHaveCount(6);
  await expect(page.getByRole('searchbox', {name:'Buscar tarefas'})).toBeVisible();
  await page.locator('.task-row-main').nth(2).click();
  await expect(page.locator('.task-detail h2')).toContainText('Aprovar IT-CQC-03');
  await page.getByRole('button', { name: 'Fechar detalhe' }).click();
  await page.getByRole('button', { name: 'Visões e listas',exact:true }).click();
  await expect(page.locator('.tasks-mobile-home')).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false);
});

test('acessibilidade: nenhuma violação grave na lista móvel, computador e formulário', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('task-fixture.html');
  await expect(page.locator('.task-row')).toHaveCount(6);
  const report = await new AxeBuilder({ page }).analyze();
  expect(report.violations.filter(item => item.impact === 'serious' || item.impact === 'critical')).toEqual([]);
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.reload();
  await expect(page.locator('.task-row')).toHaveCount(6);
  await page.locator('.task-row-main').nth(2).click();
  await expect(page.locator('.task-detail')).toBeVisible();
  const desktop = await new AxeBuilder({ page }).analyze();
  expect(desktop.violations.filter(item => item.impact === 'serious' || item.impact === 'critical')).toEqual([]);
  await page.locator('.tasks-new').click();
  const form = await new AxeBuilder({ page }).analyze();
  expect(form.violations.filter(item => item.impact === 'serious' || item.impact === 'critical')).toEqual([]);
});

test('celular: concluir sem conexão entra na fila e sincroniza ao reconectar', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('task-fixture.html');
  await expect(page.locator('.task-row')).toHaveCount(6);
  await page.evaluate(() => {
    const original = window.fetch;
    (window as typeof window & {fixtureOffline?:boolean}).fixtureOffline = true;
    window.fetch = (...args) => (window as typeof window & {fixtureOffline?:boolean}).fixtureOffline
      ? Promise.reject(new TypeError('Failed to fetch')) : original(...args);
  });
  await page.locator('.task-row').first().getByRole('button', {name:'Concluir tarefa'}).click();
  await expect(page.getByText(/pendente\(s\) para sincronizar/)).toBeVisible();
  const queued = await page.evaluate(async () => new Promise<number>((resolve,reject) => {
    const open=indexedDB.open('concrefer-quality-tasks');
    open.onsuccess=()=>{const get=open.result.transaction('pending-actions').objectStore('pending-actions').count();get.onsuccess=()=>resolve(get.result);get.onerror=()=>reject(get.error)};
    open.onerror=()=>reject(open.error);
  }));
  expect(queued).toBe(1);
  await page.evaluate(() => {
    (window as typeof window & {fixtureOffline?:boolean}).fixtureOffline = false;
    window.dispatchEvent(new Event('online'));
  });
  await expect(page.getByText(/Sincronizado às/)).toBeVisible();
});

test('computador: lista consultada volta do IndexedDB sem rede', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('task-fixture.html');
  await expect(page.locator('.task-row')).toHaveCount(6);
  await page.waitForFunction(() => new Promise<boolean>(resolve => {
    const open=indexedDB.open('concrefer-quality-tasks');
    open.onsuccess=()=>{
      const get=open.result.transaction('task-snapshots').objectStore('task-snapshots').get('user-ricardo:visao=hoje');
      get.onsuccess=()=>resolve(!!get.result);get.onerror=()=>resolve(false);
    };
    open.onerror=()=>resolve(false);
  }));
  await page.evaluate(() => { window.fetch=()=>Promise.reject(new TypeError('Failed to fetch')); });
  await page.locator('.tasks-smart button').nth(1).click();
  await expect(page.getByText('Sem conexão e sem dados salvos para esta visão.')).toBeVisible();
  await page.locator('.tasks-smart button').first().click();
  await expect(page.locator('.task-row')).toHaveCount(6);
  await expect(page.locator('.tasks-sync')).toContainText('Sem conexão');
});

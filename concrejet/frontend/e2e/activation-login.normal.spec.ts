import { expect, test, type Browser, type Page } from '@playwright/test';
import os from 'node:os';

function lanBaseUrl(): string {
  for (const interfaces of Object.values(os.networkInterfaces())) {
    for (const item of interfaces ?? []) {
      if (item.family === 'IPv4' && !item.internal && item.address.startsWith('192.168.')) {
        return `http://${item.address}:5173`;
      }
    }
  }
  return 'http://localhost:5173';
}

async function newTabletPage(browser: Browser): Promise<Page> {
  const context = await browser.newContext({
    baseURL: lanBaseUrl(),
    viewport: { width: 1280, height: 800 },
    hasTouch: true,
  });
  return context.newPage();
}

async function activateDevice(page: Page) {
  await page.goto('/activate');
  await page.getByLabel(/codigo da maquina|código da máquina/i).fill('INJ-01');
  await page.getByLabel(/nome da maquina|nome da máquina/i).fill('Injetora 1');
  await page.getByLabel(/id da maquina|id da máquina/i).fill('maq-001');
  await page.getByRole('button', { name: /ativar este dispositivo/i }).click();
}

test.describe('Fase 0 - modo normal', () => {
  test('desktop localhost direciona / para entrada administrativa', async ({ page }) => {
    await page.goto('/');

    await expect(page).toHaveURL(/\/login|\/admin\/dashboard/);
  });

  test('dispositivo ativado sem operador mostra login operacional real em /', async ({
    browser,
  }) => {
    const page = await newTabletPage(browser);
    await activateDevice(page);

    await expect(page).toHaveURL('/');
    await expect(page.getByText(/identificacao do operador/i)).toBeVisible();
    await page.goto('/');
    await expect(page).toHaveURL('/');
    await expect(page.getByText(/identificacao do operador/i)).toBeVisible();
    await page.context().close();
  });

  test('modo normal usa login operacional do backend', async ({ browser }) => {
    const page = await newTabletPage(browser);
    await activateDevice(page);

    const matriculaInput = page.getByLabel(/matrícula|matricula/i);
    if (await matriculaInput.isVisible().catch(() => false)) {
      await matriculaInput.fill('OP001');
    }
    for (const digit of ['2', '4', '6', '8']) {
      await page.getByRole('button', { name: digit }).click();
    }
    await page.getByRole('button', { name: /entrar/i }).click();
    await expect(page.getByText(/operador desenvolvimento/i)).toBeVisible();
    await expect(page.getByText(/operacao/i)).toBeVisible();
    await page.context().close();
  });
});

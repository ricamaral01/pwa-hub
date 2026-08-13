import { test, expect } from '@playwright/test';

async function activateDevice(page: import('@playwright/test').Page) {
  await page.goto('/activate');
  await page.getByLabel(/codigo da maquina|código da máquina/i).fill('INJ-01');
  await page.getByLabel(/nome da maquina|nome da máquina/i).fill('Injetora 1');
  await page.getByLabel(/id da maquina|id da máquina/i).fill('maq-001');
  await page.getByRole('button', { name: /ativar este dispositivo/i }).click();
}

test.describe('Fase 0 - modo normal', () => {
  test('dispositivo nao ativado redireciona / para /activate', async ({ page }) => {
    await page.goto('/');

    await expect(page).toHaveURL('/activate');
    await expect(page.getByRole('heading', { name: /ativacao|ativação/i })).toBeVisible();
  });

  test('dispositivo ativado sem operador mostra login operacional real em /', async ({ page }) => {
    await activateDevice(page);

    await expect(page).toHaveURL('/');
    await expect(page.getByText(/identificacao do operador/i)).toBeVisible();
    await page.goto('/');
    await expect(page).toHaveURL('/');
    await expect(page.getByText(/identificacao do operador/i)).toBeVisible();
  });

  test('modo normal usa login operacional do backend', async ({ page }) => {
    await activateDevice(page);

    for (const digit of ['2', '4', '6', '8']) {
      await page.getByRole('button', { name: digit }).click();
    }
    await page.getByRole('button', { name: /entrar/i }).click();
    await expect(page.getByText(/operador desenvolvimento/i)).toBeVisible();
    await expect(page.getByText(/operacao/i)).toBeVisible();
  });
});

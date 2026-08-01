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

  test('dispositivo ativado sem autenticacao redireciona / para /login', async ({ page }) => {
    await activateDevice(page);

    await expect(page).toHaveURL('/login');
    await page.goto('/');
    await expect(page).toHaveURL('/login');
  });

  test('modo normal nao permite login operacional ficticio', async ({ page }) => {
    await activateDevice(page);

    await expect(page.getByLabel(/matricula do operador|matrícula do operador/i)).toBeDisabled();
    await expect(page.getByText(/login operacional ainda nao foi implementado/i)).toBeVisible();
    await expect(page.getByRole('button', { name: '1' })).toBeDisabled();
    await page.getByRole('button', { name: /entrar/i }).click({ force: true });
    await expect(page).toHaveURL('/login');
  });
});

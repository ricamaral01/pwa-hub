import { test, expect } from '@playwright/test';

async function activateDevice(page: import('@playwright/test').Page) {
  await page.goto('/activate');
  await page.getByLabel(/codigo da maquina|código da máquina/i).fill('INJ-01');
  await page.getByLabel(/nome da maquina|nome da máquina/i).fill('Injetora 1');
  await page.getByLabel(/id da maquina|id da máquina/i).fill('maq-001');
  await page.getByRole('button', { name: /ativar este dispositivo/i }).click();
}

test.describe('Fase 0 - modo demonstracao', () => {
  test('mostra aviso permanente de demonstracao', async ({ page }) => {
    await page.goto('/');

    await expect(page.getByText('MODO DEMONSTRACAO')).toBeVisible();
    await expect(
      page.getByText('Dados simulados - nenhuma informacao sera enviada ao servidor'),
    ).toBeVisible();
  });

  test('permite somente sessao operacional simulada e nao afirma persistencia real', async ({
    page,
  }) => {
    await activateDevice(page);
    await page.getByLabel(/matricula do operador|matrícula do operador/i).fill('OP001');
    await page.getByRole('button', { name: '1' }).click();
    await page.getByRole('button', { name: '2' }).click();
    await page.getByRole('button', { name: '3' }).click();
    await page.getByRole('button', { name: '4' }).click();

    await expect(page).toHaveURL('/');
    await expect(page.getByText('MODO DEMONSTRACAO')).toBeVisible();
    await expect(page.getByText(/nenhuma sessao real sera criada/i)).not.toBeVisible();
    await expect(page.getByText(/Dados salvos localmente e na fila/i)).not.toBeVisible();
  });
});

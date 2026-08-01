import { expect, test } from '@playwright/test';
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const initialPassword = 'SenhaInicial123!';
const changedPassword = 'SenhaAlterada123!';
const adminEmail = `e2e-lote-${Date.now()}@concretrack.local`;
const currentDir = path.dirname(fileURLToPath(import.meta.url));

function readRootEnv(): NodeJS.ProcessEnv {
  const envPath = path.resolve(currentDir, '../../.env');
  if (!fs.existsSync(envPath)) return {};
  return Object.fromEntries(
    fs
      .readFileSync(envPath, 'utf8')
      .split(/\r?\n/)
      .map((line) => line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)=(.*)\s*$/))
      .filter((match): match is RegExpMatchArray => Boolean(match))
      .map((match) => [match[1], match[2]]),
  );
}

test.describe.serial('Fase 1 - lotes de resina', () => {
  test.beforeAll(() => {
    execSync('npm run seed:admin', {
      cwd: path.resolve(currentDir, '../../backend'),
      env: {
        ...readRootEnv(),
        ...process.env,
        SEED_ADMIN_EMAIL: adminEmail,
        SEED_ADMIN_PASSWORD: initialPassword,
      },
      stdio: 'pipe',
    });
  });

  test('cria fornecedor, resina e lote com seletores reais', async ({ page }) => {
    await page.goto('/login');
    await page.getByRole('button', { name: /admin/i }).click();
    await page.getByLabel(/e-mail/i).fill(adminEmail);
    await page.getByLabel(/^senha/i).fill(initialPassword);
    await page.getByRole('button', { name: /^entrar$/i }).click();

    await expect(page).toHaveURL('/change-password');
    await page.getByLabel(/senha atual/i).fill(initialPassword);
    await page.getByLabel(/^nova senha/i).fill(changedPassword);
    await page.getByLabel(/confirmar nova senha/i).fill(changedPassword);
    await page.getByRole('button', { name: /alterar senha/i }).click();
    await expect(page).toHaveURL('/admin');

    const suffix = Date.now();
    const supplierName = `Fornecedor Lote ${suffix}`;
    const resinCode = `RES-${suffix}`;
    const lotCode = `LOTE-${suffix}`;

    await page.goto('/admin/cadastros/suppliers');
    await page.getByLabel('Nome').fill(supplierName);
    await page.getByLabel('Documento').fill(String(suffix).padStart(14, '0').slice(0, 14));
    await page.getByRole('button', { name: 'Criar' }).click();
    await expect(page.getByText(supplierName)).toBeVisible();

    await page.goto('/admin/cadastros/resins');
    await page.getByLabel('Codigo').fill(resinCode);
    await page.getByLabel('Descricao').fill('Resina para lote E2E');
    await page.getByLabel('Fabricante').fill('Fabricante E2E');
    await page.getByRole('button', { name: 'Criar' }).click();
    await expect(page.getByText(resinCode)).toBeVisible();

    await page.goto('/admin/cadastros/resin-lots');
    const form = page.locator('form');
    await form.getByLabel('Codigo do lote').fill(lotCode);
    await form.getByLabel('Resina').selectOption({ label: `${resinCode} - Resina para lote E2E` });
    await form.getByLabel('Fornecedor').selectOption({
      label: `${String(suffix).padStart(14, '0').slice(0, 14)} - ${supplierName}`,
    });
    await form.getByLabel('Origem').selectOption('COMPRA');
    await form.getByLabel('Quantidade inicial kg').fill('123.45');
    await form.getByLabel('Data de recebimento').fill('2026-08-01');
    await form.getByLabel('Validade').fill('2027-08-01');
    await form.getByLabel('Custo por kg').fill('8.75');
    await form.getByLabel('Status').selectOption('DISPONIVEL');
    await form.getByRole('button', { name: 'Criar' }).click();

    const lotRow = page.getByRole('row').filter({ hasText: lotCode });
    await expect(lotRow).toBeVisible();
    await expect(lotRow.getByRole('cell', { name: '123.450' })).toHaveCount(2);
  });
});

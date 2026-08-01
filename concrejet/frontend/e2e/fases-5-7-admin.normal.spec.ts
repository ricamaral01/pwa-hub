import { expect, test } from '@playwright/test';
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const initialPassword = 'SenhaInicial123!';
const changedPassword = 'SenhaAlterada123!';
const adminEmail = `e2e-fase-567-${Date.now()}@concretrack.local`;
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

test.describe('Fases 5 a 7 - rotas administrativas reais', () => {
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

  test('abre estoque, blendas, analytics e importacao sem erro de console', async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on('console', (message) => {
      if (message.type() === 'error' && !/status of 401|Unauthorized/.test(message.text())) {
        consoleErrors.push(message.text());
      }
    });

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

    for (const route of [
      '/admin/stock',
      '/admin/blends',
      '/admin/dashboard',
      '/admin/analytics/oee',
      '/admin/traceability',
    ]) {
      await page.goto(route);
      await expect(page.getByRole('button', { name: 'Atualizar' })).toBeVisible();
    }

    await page.goto('/admin/imports');
    await expect(page.getByRole('button', { name: 'Analisar fixture' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Atualizar' })).toBeVisible();

    expect(consoleErrors).toEqual([]);
  });
});

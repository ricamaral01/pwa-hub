import { expect, test } from '@playwright/test';
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const initialPassword = 'SenhaInicial123!';
const changedPassword = 'SenhaAlterada123!';
const adminEmail = `e2e-admin-${Date.now()}@concretrack.local`;
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

test.describe.serial('Fase 0 - autenticacao administrativa real', () => {
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

  test('login admin restaura /auth/me, preserva sessao no reload e limpa no logout', async ({
    page,
    context,
  }) => {
    const requests: string[] = [];
    const consoleErrors: string[] = [];

    page.on('request', (request) => {
      const url = request.url();
      if (url.includes('/auth/me')) requests.push(url);
    });
    page.on('console', (message) => {
      const text = message.text();
      if (message.type() === 'error' && !/status of 401|Unauthorized/.test(text)) {
        consoleErrors.push(text);
      }
    });

    await page.goto('/admin');
    await expect(page).toHaveURL('/login');

    await page.getByRole('button', { name: /admin/i }).click();
    await page.getByLabel(/e-mail/i).fill(adminEmail);
    await page.getByLabel(/^senha/i).fill(initialPassword);
    await page.getByRole('button', { name: /^entrar$/i }).click();

    await expect(page).toHaveURL('/change-password');
    expect(requests.some((url) => url.includes('/auth/me'))).toBe(true);

    const cookiesAfterLogin = await context.cookies();
    expect(cookiesAfterLogin).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: 'concretrack_session', httpOnly: true }),
      ]),
    );

    await page.getByLabel(/senha atual/i).fill(initialPassword);
    await page.getByLabel(/^nova senha/i).fill(changedPassword);
    await page.getByLabel(/confirmar nova senha/i).fill(changedPassword);
    await page.getByRole('button', { name: /alterar senha/i }).click();

    await expect(page).toHaveURL('/admin');
    await expect(page.getByRole('heading', { name: /painel administrativo/i })).toBeVisible();

    await page.reload();
    await expect(page).toHaveURL('/admin');
    await expect(page.getByText(adminEmail)).toBeVisible();

    await page.goto('/admin');
    await expect(page).toHaveURL('/admin');

    const storageSnapshot = await page.evaluate(async () => {
      const local = Object.fromEntries(
        Array.from({ length: localStorage.length }, (_, index) => {
          const key = localStorage.key(index) ?? '';
          return [key, localStorage.getItem(key)];
        }),
      );

      const dbs =
        'databases' in indexedDB
          ? await indexedDB.databases().then((items) => items.map((i) => i.name))
          : [];

      return { local, dbs };
    });

    expect(JSON.stringify(storageSnapshot.local)).not.toMatch(/token|jwt|refresh|senha|pin/i);
    expect(JSON.stringify(storageSnapshot.dbs)).not.toMatch(/token|jwt|refresh|senha|pin/i);

    await page.goto('/admin/cadastros/items');
    await expect(page.getByRole('heading', { name: 'Itens' })).toBeVisible();
    const itemCode = `E2E-${Date.now()}`;
    await page.getByLabel('Codigo').fill(itemCode);
    await page.getByLabel('Descricao').fill('Item criado pelo E2E');
    await page.getByRole('button', { name: 'Criar' }).click();
    await expect(page.getByText(itemCode)).toBeVisible();
    await page.goto('/admin');
    await page.getByRole('button', { name: /^sair$/i }).click();
    await expect(page).toHaveURL('/login');

    expect(consoleErrors).toEqual([]);
  });
});

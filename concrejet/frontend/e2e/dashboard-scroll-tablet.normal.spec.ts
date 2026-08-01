import { expect, test } from '@playwright/test';

const lanBaseUrl = 'http://192.168.0.14:5173';

async function expectNoHorizontalOverflow(page: import('@playwright/test').Page) {
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth > window.innerWidth + 1,
  );
  expect(overflow).toBe(false);
}

test.describe('entrada desktop e tablet em rede local', () => {
  test('desktop localhost entra pelo dashboard administrativo', async ({ page }) => {
    await page.setViewportSize({ width: 1366, height: 768 });
    await page.goto('/');
    await expect(page).toHaveURL(/\/login|\/admin\/dashboard/);
    await expectNoHorizontalOverflow(page);
  });

  for (const viewport of [
    { width: 1366, height: 768 },
    { width: 1440, height: 900 },
    { width: 1920, height: 1080 },
  ]) {
    test(`desktop sem rolagem horizontal ${viewport.width}x${viewport.height}`, async ({
      page,
    }) => {
      await page.setViewportSize(viewport);
      await page.goto('/admin/dashboard');
      await expect(page).toHaveURL(/\/login|\/admin\/dashboard/);
      await expectNoHorizontalOverflow(page);
    });
  }

  for (const viewport of [
    { width: 1280, height: 800 },
    { width: 1280, height: 720 },
    { width: 1024, height: 600 },
  ]) {
    test(`tablet via IP sem 500 e sem rolagem horizontal ${viewport.width}x${viewport.height}`, async ({
      browser,
    }) => {
      const context = await browser.newContext({ baseURL: lanBaseUrl, viewport });
      const page = await context.newPage();
      const serverErrors: string[] = [];
      page.on('response', (response) => {
        if (response.url().includes('/api/') && response.status() >= 500) {
          serverErrors.push(`${response.status()} ${response.url()}`);
        }
      });

      await page.goto('/');
      if (page.url().includes('/activate')) {
        await expect(
          page.getByRole('textbox', { name: /Identificador do dispositivo/i }),
        ).not.toContainText(/Gerando/i);
        await page.getByRole('button', { name: /ativar/i }).click();
        await expect(page).toHaveURL(`${lanBaseUrl}/`);
        await page.waitForTimeout(1000);
        await expect(
          page.getByRole('main', { name: /Ativação do dispositivo|Ativacao do dispositivo/i }),
        ).toHaveCount(0);
      }
      await expect(page).toHaveURL(`${lanBaseUrl}/`);
      await expect(
        page.getByText(
          /Ativação do Dispositivo|Ativacao do Dispositivo|Identificacao do operador|Identificação do operador|OPERACAO|OPERAÇÃO/i,
        ),
      ).toBeVisible();
      await expectNoHorizontalOverflow(page);

      await context.close();
      expect(serverErrors).toEqual([]);
    });
  }
});

import { defineConfig, devices } from '@playwright/test';
const realApi = process.env.E2E_HML === '1';
export default defineConfig({
  testDir: realApi ? 'tests/hml-e2e' : 'tests/e2e',
  workers: realApi ? 2 : undefined,
  timeout: realApi ? 120_000 : 60_000,
  expect: { timeout: realApi ? 15_000 : 5_000 },
  use: { baseURL: realApi ? 'https://127.0.0.1:18444/' : 'http://127.0.0.1:4173/',
    ignoreHTTPSErrors: realApi, serviceWorkers: 'block', channel: 'chrome' },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } } },
    { name: 'tablet-retrato', use: { ...devices['Desktop Chrome'], viewport: { width: 820, height: 1180 } } },
    { name: 'tablet-paisagem', use: { ...devices['Desktop Chrome'], viewport: { width: 1180, height: 820 } } },
    { name: 'celular', use: { ...devices['Desktop Chrome'], viewport: { width: 390, height: 844 }, isMobile: true } }
  ],
  webServer: realApi ? undefined : { command: 'npm run dev -- --host 127.0.0.1 --port 4173', url: 'http://127.0.0.1:4173/', reuseExistingServer: true, env: { VITE_API_URL: '/api/v1/rpc', VITE_APP_VERSION: '2.0.0-test' } }
});

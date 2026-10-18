import { defineConfig, devices } from '@playwright/test';
export default defineConfig({
  testDir: 'tests/e2e',
  use: { baseURL: 'http://127.0.0.1:4173/dosagem-concreto/v2/', serviceWorkers: 'block', channel: 'chrome' },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } } },
    { name: 'tablet-retrato', use: { ...devices['Desktop Chrome'], viewport: { width: 820, height: 1180 } } },
    { name: 'tablet-paisagem', use: { ...devices['Desktop Chrome'], viewport: { width: 1180, height: 820 } } },
    { name: 'celular', use: { ...devices['Desktop Chrome'], viewport: { width: 390, height: 844 }, isMobile: true } }
  ],
  webServer: { command: 'npm run dev -- --host 127.0.0.1 --port 4173', url: 'http://127.0.0.1:4173/dosagem-concreto/v2/', reuseExistingServer: true, env: { VITE_API_URL: 'http://127.0.0.1:4173/api/v1/rpc', VITE_APP_VERSION: '2.0.0-test' } }
});

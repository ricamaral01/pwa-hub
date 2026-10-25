import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: 'tests/hml-e2e',
  workers: 2,
  timeout: 120_000,
  expect: { timeout: 15_000 },
  use: { baseURL: 'https://127.0.0.1:18444/', ignoreHTTPSErrors: true, serviceWorkers: 'block', channel: 'chrome' },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } } },
    { name: 'tablet-retrato', use: { ...devices['Desktop Chrome'], viewport: { width: 820, height: 1180 } } },
    { name: 'tablet-paisagem', use: { ...devices['Desktop Chrome'], viewport: { width: 1180, height: 820 } } },
    { name: 'celular', use: { ...devices['Desktop Chrome'], viewport: { width: 390, height: 844 }, isMobile: true } }
  ]
});

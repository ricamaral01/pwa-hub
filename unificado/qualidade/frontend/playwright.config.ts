import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  timeout: 20_000,
  reporter: 'list',
  use: {
    baseURL: 'http://127.0.0.1:5175/unificado/qualidade/',
    browserName: 'chromium',
    launchOptions: process.platform === 'win32'
      ? { executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe' }
      : {},
  },
  webServer: {
    command: 'npm run dev -- --port 5175 --strictPort',
    url: 'http://127.0.0.1:5175/unificado/qualidade/task-fixture.html',
    reuseExistingServer: false,
    timeout: 30_000,
  },
});

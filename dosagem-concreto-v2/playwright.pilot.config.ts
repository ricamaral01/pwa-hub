import { defineConfig } from '@playwright/test';
import hml from './playwright.hml.config';

export default defineConfig({
  ...hml,
  testDir: 'tests',
  testMatch: ['**/hml-e2e/recipe41.spec.ts', '**/pilot-e2e/local-login-smoke.spec.ts', '**/pilot-e2e/session-reload.spec.ts'],
});

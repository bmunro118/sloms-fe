import { defineConfig, devices } from '@playwright/test';

const E2E_DIR = '../../sonic_dev_tools/test_suite/e2e';
const E2E_PORT = 8082;
const E2E_BASE_URL = `http://localhost:${E2E_PORT}`;

export default defineConfig({
  testDir: `${E2E_DIR}/tests`,
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  timeout: 60_000,
  expect: { timeout: 10_000 },

  reporter: [
    ['json',  { outputFile: `${E2E_DIR}/reports/results.json` }],
    ['html',  { outputFolder: `${E2E_DIR}/reports/html`, open: 'never' }],
    ['list'],
  ],

  use: {
    baseURL: process.env.E2E_BASE_URL || E2E_BASE_URL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 15_000,
    navigationTimeout: 15_000,
  },

  projects: [
    {
      name: 'setup',
      testMatch: /auth\.setup\.ts/,
      testDir: `${E2E_DIR}/fixtures`,
    },
    {
      name: 'admin',
      use: { ...devices['Desktop Chrome'], storageState: `${E2E_DIR}/.auth/admin.json` },
      dependencies: ['setup'],
    },
    {
      name: 'customer',
      use: { ...devices['Desktop Chrome'], storageState: `${E2E_DIR}/.auth/customer.json` },
      dependencies: ['setup'],
    },
  ],

  webServer: {
    command: `cd .. && npx expo start --web --port ${E2E_PORT} --clear`,
    url: E2E_BASE_URL,
    reuseExistingServer: false,
    timeout: 180_000,
  },
});

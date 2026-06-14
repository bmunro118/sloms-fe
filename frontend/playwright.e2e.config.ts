import { defineConfig, devices } from '@playwright/test';

const E2E_DIR = '../../sonic_dev_tools/test_suite/e2e';

export default defineConfig({
  testDir: `${E2E_DIR}/tests`,
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  timeout: 30_000,
  expect: { timeout: 10_000 },

  reporter: [
    ['json',  { outputFile: `${E2E_DIR}/reports/results.json` }],
    ['html',  { outputFolder: `${E2E_DIR}/reports/html`, open: 'never' }],
    ['list'],
  ],

  use: {
    baseURL: process.env.E2E_BASE_URL || 'http://localhost:8081',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  projects: [
    {
      name: 'admin',
      use: { ...devices['Desktop Chrome'], storageState: `${E2E_DIR}/.auth/admin.json` },
      dependencies: ['setup'],
    },
    {
      name: 'manager',
      use: { ...devices['Desktop Chrome'], storageState: `${E2E_DIR}/.auth/manager.json` },
      dependencies: ['setup'],
    },
    {
      name: 'operative',
      use: { ...devices['Desktop Chrome'], storageState: `${E2E_DIR}/.auth/operative.json` },
      dependencies: ['setup'],
    },
    {
      name: 'readonly',
      use: { ...devices['Desktop Chrome'], storageState: `${E2E_DIR}/.auth/readonly.json` },
      dependencies: ['setup'],
    },
    {
      name: 'customer',
      use: { ...devices['Desktop Chrome'], storageState: `${E2E_DIR}/.auth/customer.json` },
      dependencies: ['setup'],
    },
    {
      name: 'setup',
      testMatch: /auth\.setup\.ts/,
      testDir: `${E2E_DIR}/fixtures`,
    },
  ],

  webServer: {
    command: 'npx expo start --web --port 8081',
    url: 'http://localhost:8081',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});

const { defineConfig, devices } = require('@playwright/test');
const path = require('path');

const E2E_DIR = path.resolve(__dirname, '..', '..', 'sonic_dev_tools', 'test_suite', 'e2e');
const AUTH_DIR = path.join(E2E_DIR, '.auth');

module.exports = defineConfig({
  testDir: E2E_DIR,
  testMatch: 'tests/**/*.spec.ts',
  testIgnore: '**/fixtures/**',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  timeout: 30_000,
  expect: { timeout: 10_000 },

  reporter: [
    ['json',  { outputFile: path.join(E2E_DIR, 'reports', 'results.json') }],
    ['html',  { outputFolder: path.join(E2E_DIR, 'reports', 'html'), open: 'never' }],
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
      use: { ...devices['Desktop Chrome'], storageState: path.join(AUTH_DIR, 'admin.json') },
      dependencies: ['setup'],
    },
    {
      name: 'manager',
      use: { ...devices['Desktop Chrome'], storageState: path.join(AUTH_DIR, 'manager.json') },
      dependencies: ['setup'],
    },
    {
      name: 'operative',
      use: { ...devices['Desktop Chrome'], storageState: path.join(AUTH_DIR, 'operative.json') },
      dependencies: ['setup'],
    },
    {
      name: 'readonly',
      use: { ...devices['Desktop Chrome'], storageState: path.join(AUTH_DIR, 'readonly.json') },
      dependencies: ['setup'],
    },
    {
      name: 'customer',
      use: { ...devices['Desktop Chrome'], storageState: path.join(AUTH_DIR, 'customer.json') },
      dependencies: ['setup'],
    },
    {
      name: 'setup',
      testMatch: 'fixtures/auth.setup.ts',
      testIgnore: [],
    },
  ],

  webServer: {
    command: 'npx expo start --web --port 8081',
    url: 'http://localhost:8081',
    reuseExistingServer: !process.env.CI,
    cwd: path.resolve(__dirname),
    timeout: 120_000,
  },
});

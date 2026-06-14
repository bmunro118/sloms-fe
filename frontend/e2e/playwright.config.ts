import { defineConfig, devices } from '@playwright/test';
import path from 'path';

const AUTH_DIR = path.join(__dirname, '.auth');

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  timeout: 30_000,
  expect: { timeout: 10_000 },

  reporter: [
    ['json',  { outputFile: 'reports/results.json' }],
    ['html',  { outputFolder: 'reports/html', open: 'never' }],
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
      use: { ...devices['Desktop Chrome'], storageState: `${AUTH_DIR}/admin.json` },
      dependencies: ['setup'],
    },
    {
      name: 'manager',
      use: { ...devices['Desktop Chrome'], storageState: `${AUTH_DIR}/manager.json` },
      dependencies: ['setup'],
    },
    {
      name: 'operative',
      use: { ...devices['Desktop Chrome'], storageState: `${AUTH_DIR}/operative.json` },
      dependencies: ['setup'],
    },
    {
      name: 'readonly',
      use: { ...devices['Desktop Chrome'], storageState: `${AUTH_DIR}/readonly.json` },
      dependencies: ['setup'],
    },
    {
      name: 'customer',
      use: { ...devices['Desktop Chrome'], storageState: `${AUTH_DIR}/customer.json` },
      dependencies: ['setup'],
    },
    {
      name: 'setup',
      testMatch: /auth\.setup\.ts/,
    },
  ],

  webServer: {
    command: 'npx expo start --web --port 8081',
    url: 'http://localhost:8081',
    reuseExistingServer: !process.env.CI,
    cwd: path.join(__dirname, '..'),
    timeout: 120_000,
  },
});

import path from 'path';
import { fileURLToPath } from 'url';
import { defineConfig, devices } from '@playwright/test';

const dirname = path.dirname(fileURLToPath(import.meta.url));

// SLOMS web e2e suite: runs every spec under tests/ against the real UI in a
// browser, backed by a live backend (rather than authenticating via pre-saved
// storageState, which would skip the login flow).
//
// Prerequisites (see e2e/README.md):
//   1. Backend running at E2E_API_URL (default http://localhost:3000) with
//      TWOFA_ENFORCE=true, TOTP_ENC_KEY set, and the standard seed applied.
//   2. otplib installed (devDependency) — used to compute valid TOTP codes.

// Default to 8081 — the backend's CORS allow-list covers the standard Expo web
// origin (http://localhost:8081). Override with E2E_WEB_PORT only if the BE's
// CORS_ALLOWED_ORIGINS is widened to match.
const PORT = Number(process.env.E2E_WEB_PORT ?? 8081);
const BASE_URL = process.env.E2E_BASE_URL ?? `http://localhost:${PORT}`;

export default defineConfig({
  testDir: path.join(dirname, 'tests'),
  globalSetup: path.join(dirname, 'global-setup.ts'),
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  timeout: 90_000,
  expect: { timeout: 15_000 },

  reporter: [
    ['list'],
    ['html', { outputFolder: path.join(dirname, 'reports', 'html'), open: 'never' }],
  ],

  use: {
    baseURL: BASE_URL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 15_000,
    navigationTimeout: 20_000,
  },

  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],

  webServer: {
    // EXPO_PUBLIC_API_MODE=local → app talks to the local backend in bearer-token
    // mode (no cross-origin cookie complications on localhost).
    command: `cross-env EXPO_PUBLIC_API_MODE=local npx expo start --web --port ${PORT}`,
    cwd: path.resolve(dirname, '..'),
    url: BASE_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
});

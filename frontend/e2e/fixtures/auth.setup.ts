import { test as setup, expect } from '@playwright/test';
import path from 'path';
import fs from 'fs';

const AUTH_DIR = path.join(__dirname, '..', '.auth');

const CREDENTIALS: Record<string, { username: string; password: string }> = {
  admin:     { username: process.env.SONIC_ADMIN_USER     || 'admin',       password: process.env.SONIC_ADMIN_PASS     || 'Admin@1234' },
  manager:   { username: process.env.SONIC_MANAGER_USER   || '',            password: process.env.SONIC_MANAGER_PASS   || '' },
  operative: { username: process.env.SONIC_OPERATIVE_USER || '',            password: process.env.SONIC_OPERATIVE_PASS || '' },
  readonly:  { username: process.env.SONIC_READONLY_USER  || '',            password: process.env.SONIC_READONLY_PASS  || '' },
  customer:  { username: process.env.SONIC_CUSTOMER_USER  || '',            password: process.env.SONIC_CUSTOMER_PASS  || '' },
};

fs.mkdirSync(AUTH_DIR, { recursive: true });

for (const [role, creds] of Object.entries(CREDENTIALS)) {
  if (!creds.username || !creds.password) {
    console.log(`[setup] Skipping ${role} — no credentials configured`);
    continue;
  }

  setup(`authenticate as ${role}`, async ({ page }) => {
    console.log(`[setup] Logging in as ${role} (${creds.username})`);

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Fill login form
    await page.getByLabel(/username/i).fill(creds.username);
    await page.getByLabel(/password/i).fill(creds.password);
    await page.getByRole('button', { name: /login|sign in/i }).click();

    // Handle forced password change if needed
    const changePasswordPath = '/change-password';
    if (page.url().includes(changePasswordPath)) {
      console.log(`[setup] ${role} triggered forced password change`);
      await page.getByLabel(/new password/i).fill(creds.password);
      await page.getByRole('button', { name: /change password|update password/i }).click();
    }

    // Wait for dashboard to load — confirms successful auth
    await page.waitForURL('**/dashboard', { timeout: 15_000 });
    await expect(page.getByText(/dashboard/i).first()).toBeVisible({ timeout: 5_000 });

    // Save auth state for reuse by all dependent projects
    await page.context().storageState({ path: path.join(AUTH_DIR, `${role}.json`) });
    console.log(`[setup] ${role} authenticated — state saved`);
  });
}

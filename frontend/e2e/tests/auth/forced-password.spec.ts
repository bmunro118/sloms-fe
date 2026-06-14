import { test, expect } from '@playwright/test';

test.describe('Forced Password Change', () => {
  test('change-password screen redirects to login when unauthenticated', async ({ page }) => {
    await page.context().clearCookies();
    await page.goto('/change-password');

    // Should redirect to login
    await page.waitForURL('**/', { timeout: 10_000 });
    await expect(page.getByLabel(/username/i)).toBeVisible();
  });

  test('authenticated user on dashboard is NOT on change-password', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(/dashboard/);
  });
});

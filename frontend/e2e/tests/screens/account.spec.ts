import { test, expect } from '@playwright/test';
import { waitForAppShell } from '../fixtures/pages';
import { captureConsoleErrors } from '../fixtures/assertions';

test.describe('Account Screen', () => {
  test('loads successfully', async ({ page }) => {
    const assertClean = captureConsoleErrors(page);

    await page.goto('/account');
    await waitForAppShell(page);
    await expect(page.getByText(/account/i).first()).toBeVisible({ timeout: 5_000 });

    assertClean();
  });

  test('shows user profile information', async ({ page }) => {
    await page.goto('/account');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // Should show some user info — username, role, or email
    const hasUserInfo = await page.getByText(/username|role|email|profile/i).first().isVisible().catch(() => false);
    expect(hasUserInfo).toBeTruthy();
  });
});

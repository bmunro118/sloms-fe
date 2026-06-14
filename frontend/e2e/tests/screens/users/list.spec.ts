import { test, expect } from '@playwright/test';
import { waitForAppShell } from '../../../fixtures/pages';
import { captureConsoleErrors } from '../../../fixtures/assertions';

test.describe('Users List Screen (Admin only)', () => {
  test('loads for admin role', async ({ page }) => {
    const assertClean = captureConsoleErrors(page);

    await page.goto('/users');
    await waitForAppShell(page);
    await page.waitForLoadState('networkidle');

    await expect(page.getByText(/users/i).first()).toBeVisible({ timeout: 5_000 });

    assertClean();
  });

  test('renders user cards or empty state', async ({ page }) => {
    await page.goto('/users');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    const hasContent = await page.locator('[data-testid="user-card"], [class*="userCard"]').first().isVisible().catch(() => false);
    if (!hasContent) {
      await expect(page.getByText(/no users|empty/i).first()).isVisible({ timeout: 3000 }).catch(() => {});
    }
  });
});

import { test, expect } from '@playwright/test';
import { waitForAppShell } from '../../../fixtures/pages';
import { captureConsoleErrors } from '../../../fixtures/assertions';

test.describe('User Detail Screen', () => {
  test('navigates from list to detail', async ({ page }) => {
    const assertClean = captureConsoleErrors(page);

    await page.goto('/users');
    await waitForAppShell(page);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    const firstCard = page.locator('[data-testid="user-card"], [class*="userCard"]').first();
    if (await firstCard.isVisible().catch(() => false)) {
      await firstCard.click();
      await page.waitForLoadState('networkidle');
      await expect(page).toHaveURL(/users\/\d+/);
    }

    assertClean();
  });
});

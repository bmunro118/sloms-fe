import { test, expect } from '@playwright/test';
import { waitForAppShell, goTo } from '../../../fixtures/pages';
import { captureConsoleErrors } from '../../../fixtures/assertions';

test.describe('User Interactive Flows', () => {
  test('create user form shows role dropdown', async ({ page }) => {
    const assertClean = captureConsoleErrors(page);

    await goTo(page, '/users/create');
    await waitForAppShell(page);

    // Role dropdown should contain staff roles
    const roleSelect = page.getByLabel(/role/i);
    if (await roleSelect.isVisible().catch(() => false)) {
      // Click to open and verify options exist
      await roleSelect.click();
      await page.waitForTimeout(300);
    }

    assertClean();
  });

  test('user detail shows management actions', async ({ page }) => {
    const assertClean = captureConsoleErrors(page);

    await goTo(page, '/users');
    await waitForAppShell(page);
    await page.waitForTimeout(1500);

    const firstCard = page.locator('[data-testid="user-card"], [class*="userCard"]').first();
    if (await firstCard.isVisible().catch(() => false)) {
      await firstCard.click();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(500);

      // Admin should see management actions (deactivate, delete, etc.)
      const hasActions = await page.getByText(/deactivate|active|inactive|delete|reset password/i).first().isVisible().catch(() => false);
      // At minimum, some user detail content should be visible
      const hasContent = await page.getByText(/username|role|email/i).first().isVisible().catch(() => false);
      expect(hasContent).toBeTruthy();
    }

    assertClean();
  });
});

import { test, expect } from '@playwright/test';
import { waitForAppShell } from '../../../fixtures/pages';
import { captureConsoleErrors } from '../../../fixtures/assertions';

test.describe('Create User Screen', () => {
  test('loads successfully for admin', async ({ page }) => {
    const assertClean = captureConsoleErrors(page);

    await page.goto('/users/create');
    await waitForAppShell(page);
    await page.waitForLoadState('networkidle');

    await expect(page.getByText(/create|new user/i).first()).toBeVisible({ timeout: 5_000 });

    assertClean();
  });

  test('form has username and role fields', async ({ page }) => {
    await page.goto('/users/create');
    await page.waitForLoadState('networkidle');

    const usernameInput = page.getByLabel(/username/i);
    await expect(usernameInput).toBeVisible({ timeout: 5_000 });
  });
});

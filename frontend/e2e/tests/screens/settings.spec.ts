import { test, expect } from '@playwright/test';
import { waitForAppShell } from '../../fixtures/pages';
import { captureConsoleErrors } from '../../fixtures/assertions';

test.describe('Settings Screen', () => {
  test('loads successfully for admin', async ({ page }) => {
    const assertClean = captureConsoleErrors(page);

    await page.goto('/settings');
    await waitForAppShell(page);
    await expect(page.getByText(/settings/i).first()).toBeVisible({ timeout: 5_000 });

    assertClean();
  });
});

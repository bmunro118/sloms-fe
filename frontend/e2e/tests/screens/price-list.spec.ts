import { test, expect } from '@playwright/test';
import { waitForAppShell } from '../../fixtures/pages';
import { captureConsoleErrors } from '../../fixtures/assertions';

test.describe('Price List Screen', () => {
  test('loads successfully', async ({ page }) => {
    const assertClean = captureConsoleErrors(page);

    await page.goto('/price-list');
    await waitForAppShell(page);
    await expect(page.getByText(/price list/i).first()).toBeVisible({ timeout: 5_000 });

    assertClean();
  });
});

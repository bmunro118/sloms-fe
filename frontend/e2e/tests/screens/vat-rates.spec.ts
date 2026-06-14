import { test, expect } from '@playwright/test';
import { waitForAppShell } from '../fixtures/pages';
import { captureConsoleErrors } from '../fixtures/assertions';

test.describe('VAT Rates Screen', () => {
  test('loads successfully for admin', async ({ page }) => {
    const assertClean = captureConsoleErrors(page);

    await page.goto('/vat-rates');
    await waitForAppShell(page);
    await expect(page.getByText(/vat/i).first()).toBeVisible({ timeout: 5_000 });

    assertClean();
  });
});

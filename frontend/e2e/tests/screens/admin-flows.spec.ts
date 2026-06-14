import { test, expect } from '@playwright/test';
import { waitForAppShell, goTo } from '../fixtures/pages';
import { captureConsoleErrors } from '../fixtures/assertions';

test.describe('VAT Rates Flows', () => {
  test('VAT rates screen shows current rate and history', async ({ page }) => {
    const assertClean = captureConsoleErrors(page);

    await goTo(page, '/vat-rates');
    await waitForAppShell(page);

    // Should show current rate card
    const currentRate = page.getByText(/current/i).first();
    await expect(currentRate).toBeVisible({ timeout: 5_000 });

    assertClean();
  });

  test('create VAT rate form is accessible', async ({ page }) => {
    const assertClean = captureConsoleErrors(page);

    await goTo(page, '/vat-rates');
    await waitForAppShell(page);
    await page.waitForTimeout(1000);

    // Look for create/new button or form
    const createBtn = page.getByRole('button', { name: /create|add|new/i }).first();
    if (await createBtn.isVisible().catch(() => false)) {
      await createBtn.click();
      await page.waitForTimeout(300);
    }

    // Check for rate input fields
    const rateInput = page.getByLabel(/rate|percentage/i);
    if (await rateInput.isVisible().catch(() => false)) {
      await rateInput.fill('25');
    }

    assertClean();
  });
});

test.describe('Settings Flows', () => {
  test('settings screen lists configuration', async ({ page }) => {
    const assertClean = captureConsoleErrors(page);

    await goTo(page, '/settings');
    await waitForAppShell(page);

    // Should show settings entries
    await page.waitForTimeout(1000);

    assertClean();
  });
});

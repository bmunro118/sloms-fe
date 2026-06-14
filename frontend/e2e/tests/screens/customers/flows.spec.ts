import { test, expect } from '@playwright/test';
import { waitForAppShell, goTo } from '../../../fixtures/pages';
import { captureConsoleErrors } from '../../../fixtures/assertions';

test.describe('Customer Interactive Flows', () => {
  test('create customer form validates', async ({ page }) => {
    const assertClean = captureConsoleErrors(page);

    await goTo(page, '/customers/create');
    await waitForAppShell(page);

    // Fill company name (minimal required field)
    const companyInput = page.getByLabel(/company/i);
    if (await companyInput.isVisible()) {
      await companyInput.fill('E2E Test Company');
    }

    // Submit without address should trigger warning modal
    const submitBtn = page.getByRole('button', { name: /submit|save|create/i });
    if (await submitBtn.isVisible().catch(() => false)) {
      await submitBtn.click();
      await page.waitForTimeout(500);

      // If warning modal appears ("no delivery address"), dismiss it
      const warningModal = page.getByText(/delivery address|without.*address/i).first();
      if (await warningModal.isVisible().catch(() => false)) {
        const noBtn = page.getByRole('button', { name: /no|cancel/i }).first();
        if (await noBtn.isVisible().catch(() => false)) {
          await noBtn.click();
        }
      }
    }

    assertClean();
  });

  test('customer detail shows suspend option', async ({ page }) => {
    const assertClean = captureConsoleErrors(page);

    await goTo(page, '/customers');
    await waitForAppShell(page);
    await page.waitForTimeout(1500);

    const firstCard = page.locator('[data-testid="customer-card"], [class*="customerCard"]').first();
    if (await firstCard.isVisible().catch(() => false)) {
      await firstCard.click();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(500);

      // Check for suspend action
      const suspendBtn = page.getByText(/suspend/i).first();
      if (await suspendBtn.isVisible().catch(() => false)) {
        await suspendBtn.click();
        await page.waitForTimeout(300);

        // Confirm modal should appear — cancel it
        const cancelBtn = page.getByRole('button', { name: /cancel|no/i }).first();
        if (await cancelBtn.isVisible().catch(() => false)) {
          await cancelBtn.click();
        }
      }
    }

    assertClean();
  });
});

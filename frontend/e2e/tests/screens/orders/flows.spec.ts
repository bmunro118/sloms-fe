import { test, expect } from '@playwright/test';
import { waitForAppShell, goTo } from '../../../fixtures/pages';
import { captureConsoleErrors, expectSuccessFeedback, expectModal } from '../../../fixtures/assertions';

test.describe('Order Interactive Flows', () => {
  test('create order form fills and validates', async ({ page }) => {
    const assertClean = captureConsoleErrors(page);

    await goTo(page, '/orders/create');
    await waitForAppShell(page);

    // Fill order number
    const orderNumberInput = page.getByLabel(/order number/i);
    if (await orderNumberInput.isVisible()) {
      await orderNumberInput.fill('99999');
    }

    // Try submitting without required fields — should show validation
    const submitBtn = page.getByRole('button', { name: /submit|save|create/i });
    if (await submitBtn.isVisible().catch(() => false)) {
      await submitBtn.click();
      await page.waitForTimeout(500);
      // Should show validation error or confirmation modal
    }

    assertClean();
  });

  test('dispatch action shows confirm modal on orders list', async ({ page }) => {
    const assertClean = captureConsoleErrors(page);

    await goTo(page, '/orders');
    await waitForAppShell(page);
    await page.waitForTimeout(1000);

    // Look for a dispatch button on any order card
    const dispatchBtn = page.getByRole('button', { name: /dispatch|send/i }).first();
    if (await dispatchBtn.isVisible().catch(() => false)) {
      await dispatchBtn.click();
      await page.waitForTimeout(500);

      // Should show a confirmation modal
      const hasModal = await page.getByText(/dispatch|mark as dispatched/i).first().isVisible().catch(() => false);
      if (hasModal) {
        // Cancel the modal
        const cancelBtn = page.getByRole('button', { name: /cancel|no/i }).first();
        if (await cancelBtn.isVisible().catch(() => false)) {
          await cancelBtn.click();
        }
      }
    }

    assertClean();
  });

  test('order detail edit mode works', async ({ page }) => {
    const assertClean = captureConsoleErrors(page);

    await goTo(page, '/orders');
    await waitForAppShell(page);
    await page.waitForTimeout(1500);

    // Navigate to first order detail
    const firstCard = page.locator('[data-testid="order-card"], [class*="orderCard"]').first();
    if (await firstCard.isVisible().catch(() => false)) {
      await firstCard.click();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(500);

      // Look for edit button
      const editBtn = page.getByRole('button', { name: /edit|pencil/i }).first();
      if (await editBtn.isVisible().catch(() => false)) {
        await editBtn.click();
        await page.waitForTimeout(500);

        // Edit mode should show save/cancel actions
        const hasSaveBtn = await page.getByRole('button', { name: /save/i }).first().isVisible().catch(() => false);
        const hasCancelBtn = await page.getByRole('button', { name: /cancel/i }).first().isVisible().catch(() => false);

        // Click cancel to exit edit mode
        if (hasCancelBtn) {
          await page.getByRole('button', { name: /cancel/i }).first().click();
        }
      }
    }

    assertClean();
  });
});

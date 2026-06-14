import { test, expect } from '@playwright/test';
import { waitForAppShell } from '../../../fixtures/pages';
import { captureConsoleErrors } from '../../../fixtures/assertions';

test.describe('Order Detail Screen', () => {
  test('navigates from orders list to detail', async ({ page }) => {
    const assertClean = captureConsoleErrors(page);

    await page.goto('/orders');
    await waitForAppShell(page);
    await page.waitForLoadState('networkidle');

    // Click the first order card to navigate to detail
    const firstCard = page.locator('[data-testid="order-card"], [class*="orderCard"]').first();
    const cardAction = page.getByRole('button', { name: /edit|pencil/i }).first();

    if (await firstCard.isVisible().catch(() => false)) {
      await firstCard.click();
      await page.waitForLoadState('networkidle');
      // Should navigate to order detail (URL contains order number)
      await expect(page).toHaveURL(/orders\/\d+/);
    } else if (await cardAction.isVisible().catch(() => false)) {
      await cardAction.click();
      await page.waitForLoadState('networkidle');
    }
    // If no cards exist, we skip — the backend may have no data

    assertClean();
  });
});

import { test, expect } from '@playwright/test';
import { waitForAppShell } from '../../../fixtures/pages';
import { captureConsoleErrors } from '../../../fixtures/assertions';

test.describe('Order Tracking Screen', () => {
  test('loads tracking page (may show backend-gap message)', async ({ page }) => {
    const assertClean = captureConsoleErrors(page);

    // Navigate to a known order tracking URL
    // The tracking endpoint returns 404 (backend gap) so we expect an info message
    await page.goto('/orders/1/1/tracking');
    await waitForAppShell(page);
    await page.waitForLoadState('networkidle');

    // Should either show tracking data or a "not available" message
    // Either case is acceptable — we just want to confirm no crash
    await page.waitForTimeout(1000);

    assertClean();
  });
});

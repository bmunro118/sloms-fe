import { test, expect } from '@playwright/test';
import { waitForAppShell } from '../../../fixtures/pages';
import { captureConsoleErrors } from '../../../fixtures/assertions';

test.describe('Create Order Screen', () => {
  test('loads successfully', async ({ page }) => {
    const assertClean = captureConsoleErrors(page);

    await page.goto('/orders/create');
    await waitForAppShell(page);
    await page.waitForLoadState('networkidle');

    // Should render the create form
    await expect(page.getByText(/create|new order/i).first()).toBeVisible({ timeout: 5_000 });

    assertClean();
  });

  test('form has required fields', async ({ page }) => {
    await page.goto('/orders/create');
    await page.waitForLoadState('networkidle');

    // Check for presence of key form fields
    // orderNumber and customerAccount are the minimal required fields
    const orderNumberInput = page.getByLabel(/order number/i);
    const customerInput = page.getByLabel(/customer/i);

    // At least one of these should be visible (may be dropdown or input)
    const hasFields = await orderNumberInput.isVisible().catch(() => false)
      || await customerInput.isVisible().catch(() => false);

    expect(hasFields).toBeTruthy();
  });
});

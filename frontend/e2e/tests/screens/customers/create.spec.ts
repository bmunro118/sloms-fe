import { test, expect } from '@playwright/test';
import { waitForAppShell } from '../../../fixtures/pages';
import { captureConsoleErrors } from '../../../fixtures/assertions';

test.describe('Create Customer Screen', () => {
  test('loads successfully', async ({ page }) => {
    const assertClean = captureConsoleErrors(page);

    await page.goto('/customers/create');
    await waitForAppShell(page);
    await page.waitForLoadState('networkidle');

    await expect(page.getByText(/create|new customer/i).first()).toBeVisible({ timeout: 5_000 });

    assertClean();
  });

  test('form has company name field', async ({ page }) => {
    await page.goto('/customers/create');
    await page.waitForLoadState('networkidle');

    // Company name is the minimal required field per API contract
    const companyNameInput = page.getByLabel(/company/i);
    await expect(companyNameInput).toBeVisible({ timeout: 5_000 });
  });
});

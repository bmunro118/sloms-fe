import { test, expect } from '@playwright/test';
import { waitForAppShell } from '../../fixtures/pages';
import { captureConsoleErrors } from '../../fixtures/assertions';

test.describe('Dashboard Screen', () => {
  test('loads successfully', async ({ page }) => {
    const assertClean = captureConsoleErrors(page);

    await page.goto('/dashboard');
    await waitForAppShell(page);
    await expect(page.getByText(/dashboard/i).first()).toBeVisible();

    assertClean();
  });

  test('does not crash on reload', async ({ page }) => {
    await page.goto('/dashboard');
    await waitForAppShell(page);

    await page.reload();
    await page.waitForLoadState('networkidle');
    await waitForAppShell(page);
  });
});

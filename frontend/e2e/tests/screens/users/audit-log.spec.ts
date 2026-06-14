import { test, expect } from '@playwright/test';
import { waitForAppShell } from '../../../fixtures/pages';
import { captureConsoleErrors } from '../../../fixtures/assertions';

test.describe('User Audit Log Screen', () => {
  test('loads successfully for admin', async ({ page }) => {
    const assertClean = captureConsoleErrors(page);

    await page.goto('/users/audit-log');
    await waitForAppShell(page);
    await page.waitForLoadState('networkidle');

    await expect(page.getByText(/audit/i).first()).toBeVisible({ timeout: 5_000 });

    assertClean();
  });
});

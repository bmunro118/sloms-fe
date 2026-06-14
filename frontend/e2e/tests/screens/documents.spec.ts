import { test, expect } from '@playwright/test';
import { waitForAppShell } from '../../fixtures/pages';
import { captureConsoleErrors } from '../../fixtures/assertions';

test.describe('Documents Screen', () => {
  test('loads successfully (may show backend-gap state)', async ({ page }) => {
    const assertClean = captureConsoleErrors(page);

    await page.goto('/documents');
    await waitForAppShell(page);
    // The documents endpoint returns 404 (known backend gap).
    // The screen should still render — either showing an empty state
    // or an info message. We just verify the shell loads and no crash.
    await page.waitForTimeout(1000);

    assertClean();
  });
});

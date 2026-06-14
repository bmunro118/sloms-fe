import { test, expect } from '@playwright/test';
import { waitForAppShell } from '../../fixtures/pages';

test.describe('Session Management', () => {
  test('authenticated user can access dashboard', async ({ page }) => {
    await page.goto('/dashboard');
    await waitForAppShell(page);
    await expect(page.getByText(/dashboard/i).first()).toBeVisible();
  });

  test('sign out redirects to login page', async ({ page }) => {
    await page.goto('/dashboard');
    await waitForAppShell(page);

    // Find and click sign-out — could be in sidebar or drawer
    const signOutButton = page.getByText(/sign out|logout/i).first();
    if (await signOutButton.isVisible().catch(() => false)) {
      await signOutButton.click();
    } else {
      // Might be in a collapsed sidebar — look for sign-out icon
      await page.getByTestId('sign-out-button').click();
    }

    // Should end up on the login page
    await page.waitForURL('**/', { timeout: 10_000 });
    await expect(page.getByLabel(/username/i)).toBeVisible({ timeout: 5_000 });
  });

  test('session persists across page reload', async ({ page }) => {
    await page.goto('/dashboard');
    await waitForAppShell(page);

    // Reload the page
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Should still be on dashboard
    await expect(page).toHaveURL(/dashboard/);
    await waitForAppShell(page);
  });

  test('unauthenticated access redirects to login', async ({ page }) => {
    // Clear auth state to simulate unauthenticated user
    await page.context().clearCookies();
    await page.goto('/dashboard');

    // Should be redirected to login
    await page.waitForURL('**/', { timeout: 10_000 });
    await expect(page.getByLabel(/username/i)).toBeVisible({ timeout: 5_000 });
  });
});

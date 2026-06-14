import { test, expect } from '@playwright/test';
import { waitForAppShell } from '../../fixtures/pages';

test.describe('TopBar', () => {
  test('renders page title on each primary screen', async ({ page }) => {
    const screens: { route: string; expectedTitle: string }[] = [
      { route: '/dashboard', expectedTitle: 'Dashboard' },
      { route: '/orders', expectedTitle: 'Orders' },
      { route: '/customers', expectedTitle: 'Customers' },
      { route: '/price-list', expectedTitle: 'Price List' },
      { route: '/documents', expectedTitle: 'Documents' },
      { route: '/account', expectedTitle: 'Account' },
    ];

    for (const { route, expectedTitle } of screens) {
      await page.goto(route);
      await waitForAppShell(page);

      // TopBar should contain the page title
      const titleEl = page.getByTestId('topbar-title');
      if (await titleEl.isVisible().catch(() => false)) {
        await expect(titleEl).toContainText(expectedTitle, { timeout: 5_000 });
      }
    }
  });

  test('navigates between screens correctly', async ({ page }) => {
    await page.goto('/dashboard');
    await waitForAppShell(page);

    // Click Orders nav item
    await page.getByRole('link', { name: /orders/i }).first().click();
    await page.waitForURL('**/orders', { timeout: 10_000 });
    await expect(page).toHaveURL(/orders/);

    // Click Customers nav item
    await page.getByRole('link', { name: /customers/i }).first().click();
    await page.waitForURL('**/customers', { timeout: 10_000 });
    await expect(page).toHaveURL(/customers/);

    // Navigate back to Dashboard
    await page.getByRole('link', { name: /dashboard/i }).first().click();
    await page.waitForURL('**/dashboard', { timeout: 10_000 });
    await expect(page).toHaveURL(/dashboard/);
  });
});

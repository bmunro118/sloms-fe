import { test } from '@playwright/test';
import { captureConsoleErrors } from '../../fixtures/assertions';

const ALL_SCREENS: { route: string; label: string }[] = [
  { route: '/dashboard', label: 'Dashboard' },
  { route: '/orders', label: 'Orders List' },
  { route: '/customers', label: 'Customers List' },
  { route: '/price-list', label: 'Price List' },
  { route: '/documents', label: 'Documents' },
  { route: '/account', label: 'Account' },
];

test.describe('Console Error Sweep', () => {
  test('admin — no console errors across all screens', async ({ page }) => {
    const assertClean = captureConsoleErrors(page);

    for (const { route, label } of ALL_SCREENS) {
      await page.goto(route);
      await page.waitForLoadState('networkidle');
      // Brief pause to let React finish rendering
      await page.waitForTimeout(500);
    }

    assertClean();
  });
});

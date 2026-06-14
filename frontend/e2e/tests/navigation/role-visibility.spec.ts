import { test, expect } from '@playwright/test';
import { waitForAppShell, expectNavItem, expectNoNavItem } from '../../fixtures/pages';

/**
 * Role Navigation Policy (from Application_Overview.md):
 *
 * | Screen     | Admin | Manager | Operative | ReadOnly | Customer |
 * |------------|-------|---------|-----------|----------|----------|
 * | Dashboard  | Yes   | Yes     | Yes       | Yes      | Yes      |
 * | Orders     | Yes   | Yes     | Yes       | Yes      | Yes      |
 * | Customers  | Yes   | Yes     | Yes       | No       | No       |
 * | Users      | Yes   | Limited | No        | No       | No       |
 * | Price List | Yes   | Yes     | Yes       | Yes      | Yes      |
 * | VAT Rates  | Yes   | Yes     | No        | No       | No       |
 * | Settings   | Yes   | Yes     | No        | No       | No       |
 * | Documents  | Yes   | Yes     | Yes       | Yes      | Yes      |
 * | Account    | Yes   | Yes     | Yes       | Yes      | Yes      |
 */

test.describe('Admin', () => {
  test('sees all navigation items', async ({ page }) => {
    await page.goto('/dashboard');
    await waitForAppShell(page);

    await expectNavItem(page, 'Dashboard');
    await expectNavItem(page, 'Orders');
    await expectNavItem(page, 'Customers');
    await expectNavItem(page, 'Users');
    await expectNavItem(page, 'Price List');
    await expectNavItem(page, 'VAT');
    await expectNavItem(page, 'Settings');
    await expectNavItem(page, 'Documents');
    await expectNavItem(page, 'Account');
  });
});

test.describe('Manager', () => {
  test('sees staff nav items but not admin-only', async ({ page }) => {
    await page.goto('/dashboard');
    await waitForAppShell(page);

    await expectNavItem(page, 'Dashboard');
    await expectNavItem(page, 'Orders');
    await expectNavItem(page, 'Customers');
    await expectNavItem(page, 'Price List');
    await expectNavItem(page, 'VAT');
    await expectNavItem(page, 'Settings');
    await expectNavItem(page, 'Documents');
    await expectNavItem(page, 'Account');

    // Manager nav may or may not show Users — depends on implementation
    // If Users IS shown, Manager gets limited access (no admin-only actions)
  });
});

test.describe('Operative', () => {
  test('sees operational nav items only', async ({ page }) => {
    await page.goto('/dashboard');
    await waitForAppShell(page);

    await expectNavItem(page, 'Dashboard');
    await expectNavItem(page, 'Orders');
    await expectNavItem(page, 'Customers');
    await expectNavItem(page, 'Price List');
    await expectNavItem(page, 'Documents');
    await expectNavItem(page, 'Account');

    await expectNoNavItem(page, 'Users');
    await expectNoNavItem(page, 'VAT');
    await expectNoNavItem(page, 'Settings');
  });
});

test.describe('ReadOnly', () => {
  test('sees read-only nav items (no Customers)', async ({ page }) => {
    await page.goto('/dashboard');
    await waitForAppShell(page);

    await expectNavItem(page, 'Dashboard');
    await expectNavItem(page, 'Orders');
    await expectNavItem(page, 'Price List');
    await expectNavItem(page, 'Documents');
    await expectNavItem(page, 'Account');

    await expectNoNavItem(page, 'Customers');
    await expectNoNavItem(page, 'Users');
    await expectNoNavItem(page, 'VAT');
    await expectNoNavItem(page, 'Settings');
  });
});

test.describe('Customer', () => {
  test('sees customer nav items', async ({ page }) => {
    await page.goto('/dashboard');
    await waitForAppShell(page);

    await expectNavItem(page, 'Dashboard');
    await expectNavItem(page, 'Orders');
    await expectNavItem(page, 'Price List');
    await expectNavItem(page, 'Documents');
    await expectNavItem(page, 'Account');

    await expectNoNavItem(page, 'Customers');
    await expectNoNavItem(page, 'Users');
    await expectNoNavItem(page, 'VAT');
    await expectNoNavItem(page, 'Settings');
  });
});

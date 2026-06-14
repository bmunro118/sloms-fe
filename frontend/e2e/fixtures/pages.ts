import { Page, expect } from '@playwright/test';

/**
 * Navigate to an authenticated route and wait for the network to settle.
 */
export async function goTo(page: Page, route: string) {
  await page.goto(route);
  await page.waitForLoadState('networkidle');
}

/**
 * Assert the TopBar or page contains the expected title text.
 * Tries data-testid first, then falls back to heading role.
 */
export async function expectPageTitle(page: Page, expectedTitle: string) {
  const titleEl = page.getByTestId('topbar-title');
  if (await titleEl.isVisible().catch(() => false)) {
    await expect(titleEl).toContainText(expectedTitle);
  } else {
    await expect(page.getByRole('heading', { name: expectedTitle }).first()).toBeVisible();
  }
}

/**
 * Assert a navigation item is visible in the sidebar or drawer.
 */
export async function expectNavItem(page: Page, label: string) {
  await expect(
    page.getByRole('link', { name: new RegExp(label, 'i') }).first()
  ).toBeVisible({ timeout: 5_000 });
}

/**
 * Assert a navigation item is NOT visible in the sidebar or drawer.
 */
export async function expectNoNavItem(page: Page, label: string) {
  await expect(
    page.getByRole('link', { name: new RegExp(label, 'i') })
  ).not.toBeVisible({ timeout: 3_000 });
}

/**
 * Wait for the authenticated shell to render (TopBar or sidebar present).
 */
export async function waitForAppShell(page: Page) {
  // TopBar title area or sidebar nav — either confirms the shell loaded
  await expect(
    page.getByTestId('topbar-title').or(page.getByRole('navigation'))
  ).toBeVisible({ timeout: 10_000 });
}

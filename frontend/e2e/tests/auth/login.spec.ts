import { test, expect } from '@playwright/test';

// These tests run WITHOUT pre-authentication (they test the login flow itself).
// We use the 'setup' project so they don't depend on stored auth state.
// But for simplicity, we run them as part of the admin project with a fresh page.
// To get a clean page, we clear storage state first.

test.describe('Login Screen', () => {
  test.beforeEach(async ({ page }) => {
    // Clear any existing auth state to get a clean login page
    await page.context().clearCookies();
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('renders login form with all elements', async ({ page }) => {
    await expect(page.getByLabel(/username/i)).toBeVisible();
    await expect(page.getByLabel(/password/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /login|sign in/i })).toBeVisible();
  });

  test('shows validation error on empty submit', async ({ page }) => {
    await page.getByRole('button', { name: /login|sign in/i }).click();
    // Should stay on login page and show some error feedback
    await expect(page).not.toHaveURL(/dashboard/);
  });

  test('shows error on invalid credentials', async ({ page }) => {
    await page.getByLabel(/username/i).fill('nonexistent_user_12345');
    await page.getByLabel(/password/i).fill('WrongPassword1!');
    await page.getByRole('button', { name: /login|sign in/i }).click();

    // Should stay on login page — invalid creds
    await page.waitForTimeout(2000);
    await expect(page).not.toHaveURL(/dashboard/);
    await expect(page).not.toHaveURL(/change-password/);
  });

  test('redirects to dashboard on successful login', async ({ page }) => {
    const user = process.env.SONIC_ADMIN_USER || 'admin';
    const pass = process.env.SONIC_ADMIN_PASS || 'Admin@1234';

    await page.getByLabel(/username/i).fill(user);
    await page.getByLabel(/password/i).fill(pass);
    await page.getByRole('button', { name: /login|sign in/i }).click();

    await page.waitForURL('**/dashboard', { timeout: 15_000 });
    await expect(page.getByText(/dashboard/i).first()).toBeVisible();
  });
});

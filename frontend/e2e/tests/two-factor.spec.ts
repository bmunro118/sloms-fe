import { generateSync } from 'otplib';
import { expect, test } from '@playwright/test';
import { readProvisionedUser } from '../fixtures/provisioned-user';

// Drives the full TOTP step-up against a live backend:
//   login → mandatory enrollment (QR secret → code → recovery codes) → app,
//   then a fresh login → second-factor challenge → app.
test.describe.configure({ mode: 'serial' });

/** Compute a current TOTP code from the otpauth secret (otplib defaults match the BE). */
function totp(secret: string): string {
  return generateSync({ secret });
}

test('TOTP enrollment, then second-factor login challenge', async ({ page }) => {
  const user = readProvisionedUser();

  // ── 1. Sign in — backend forces 2FA enrollment ───────────────────────────────
  await page.goto('/');
  await page.getByTestId('login-username').fill(user.username);
  await page.getByTestId('login-password').fill(user.password);
  await page.getByTestId('login-button').click();

  // ── 2. Enrollment: read the otpauth secret and submit a valid code ───────────
  const otpauthUri = await page.getByTestId('twofa-otpauth-uri').innerText();
  const secret = new URL(otpauthUri.trim()).searchParams.get('secret');
  expect(secret, 'otpauth URI should carry a base32 secret').toBeTruthy();

  await page.getByTestId('twofa-enroll-code').fill(totp(secret!));
  await page.getByTestId('twofa-enroll-submit').click();

  // ── 3. Recovery codes are shown once — acknowledge them ──────────────────────
  await expect(page.getByTestId('twofa-recovery-codes')).toBeVisible();
  await page.getByTestId('twofa-recovery-continue').click();

  // ── 4. Enrollment complete → landed in the app ───────────────────────────────
  await page.waitForURL('**/dashboard');

  // ── 5. Sign out (clear the web session) and return to login ──────────────────
  await page.evaluate(() => window.sessionStorage.clear());
  await page.goto('/');
  await expect(page.getByTestId('login-username')).toBeVisible();

  // ── 6. Sign in again — device is untrusted, so a 2FA challenge is required ────
  await page.getByTestId('login-username').fill(user.username);
  await page.getByTestId('login-password').fill(user.password);
  await page.getByTestId('login-button').click();

  // ── 7. Pass the second-factor challenge with a freshly computed code ─────────
  await expect(page.getByTestId('twofa-verify-code')).toBeVisible();
  await page.getByTestId('twofa-verify-code').fill(totp(secret!));
  await page.getByTestId('twofa-verify-submit').click();

  // ── 8. Back in the app ───────────────────────────────────────────────────────
  await page.waitForURL('**/dashboard');
});

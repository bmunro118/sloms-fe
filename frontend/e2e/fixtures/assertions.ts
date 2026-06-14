import { Page, expect } from '@playwright/test';

/**
 * Starts capturing all console errors on the page.
 * Returns a cleanup function that asserts 0 errors were captured.
 *
 * Usage:
 *   const assertClean = captureConsoleErrors(page);
 *   // ... perform test actions ...
 *   assertClean();
 */
export function captureConsoleErrors(page: Page): () => void {
  const errors: string[] = [];
  const handler = (msg: { type: () => string; text: () => string }) => {
    if (msg.type() === 'error') {
      errors.push(msg.text());
    }
  };
  page.on('console', handler);

  return () => {
    page.off('console', handler);
    if (errors.length > 0) {
      console.error(`[console-errors] ${errors.length} errors captured:\n${errors.join('\n')}`);
    }
    expect(errors, `Console errors detected (${errors.length}):\n${errors.join('\n')}`).toHaveLength(0);
  };
}

/**
 * Assert a confirm/alert modal is visible with the expected title.
 */
export async function expectModal(page: Page, expectedTitle: string) {
  await expect(page.getByText(expectedTitle).first()).toBeVisible({ timeout: 5_000 });
}

/**
 * Assert a success toast/modal appeared.
 */
export async function expectSuccessFeedback(page: Page) {
  // Look for success modal or green-styled feedback
  const success = page.getByText(/success|saved|created|updated|dispatched/i).first();
  await expect(success).toBeVisible({ timeout: 5_000 });
}

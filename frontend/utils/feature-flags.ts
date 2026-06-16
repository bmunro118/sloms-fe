import { useMemo } from 'react';

/**
 * Feature flags — hardcoded switches for features that are:
 * - Built but depend on backend endpoints not yet implemented, OR
 * - In active development and not ready for production.
 *
 * Set a flag to `true` to enable the feature, `false` to hide it.
 *
 * In `__DEV__` mode, ALL flags are implicitly `true` so developers
 * always see in-progress features. In production builds, only flags
 * explicitly set to `true` here are enabled.
 */

export const FEATURE_FLAGS = {
  // ── Backend-dependent gates ────────────────────────────────────────────────

  /**
   * Price List — Revisions tab
   * Requires: GET /api/price-list/revisions, GET /api/price-list/revisions/{id},
   *           POST /api/price-list/revisions/{id}/activate
   * Backend status: NOT IMPLEMENTED
   */
  priceListRevisions: false,

  /**
   * Price List — List Types tab
   * Requires: GET /api/price-list/lists, DELETE /api/price-list/lists/{id},
   *           GET /api/price-list/{itemId}/lists, GET /api/price-list/{itemId}/lists/{listName}
   * Backend status: NOT IMPLEMENTED
   */
  priceListTypes: false,

  /**
   * All Customer-role users are treated as read-only.
   * When true, Customer users cannot create, edit, or delete any records — edit
   * controls are hidden and mutating actions are blocked in the UI.
   * When false, Customer users have the same write access as an Operative.
   *
   * This flag is the global default. In future, a per-account setting
   * (customerReadOnly on the account record) will be able to override it,
   * enforcing read-only on a per-customer basis regardless of this flag.
   */
  allCustomersReadOnly: true,

  // ── In-development feature gates ───────────────────────────────────────────

  /**
   * Mass User Creation — create multiple users in a single workflow.
   * Admin-only. Uses POST /api/users for each entry.
   * Status: IN DEVELOPMENT — UI complete, not yet production-hardened.
   */
  bulkUserCreation: false,

  /**
   * User Communication — contact page for composing messages to users.
   * Generates formatted email-ready content for administrators to distribute.
   * Status: IN DEVELOPMENT — UI complete, backend email integration pending.
   */
  userCommunication: false,
} as const;

export type FeatureFlagKey = keyof typeof FEATURE_FLAGS;

// ── Runtime resolution ─────────────────────────────────────────────────────────

/**
 * Returns true if a feature flag is enabled.
 * In __DEV__ mode all flags are considered enabled so developers
 * can see and test in-progress features without modifying flags.
 */
export function isFeatureEnabled(flag: FeatureFlagKey): boolean {
  if (__DEV__) return true;
  return FEATURE_FLAGS[flag] === true;
}

/**
 * React hook for feature flag checks. Memoised per flag.
 * Usage:
 *   const showBulkCreate = useFeatureFlag('bulkUserCreation');
 */
export function useFeatureFlag(flag: FeatureFlagKey): boolean {
  return useMemo(() => isFeatureEnabled(flag), [flag]);
}

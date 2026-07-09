/**
 * Feature flag system.
 *
 * Every flag is a member of the `FeatureName` literal union. Resolution
 * priority (highest to lowest):
 *  1. Explicit env var `EXPO_PUBLIC_FEATURE_<NAME>` — set to 'true' or 'false'
 *  2. `__DEV__` mode (all features enabled in dev unless explicitly disabled)
 *  3. Hardcoded default in the `featureFlags` record
 *
 * Usage:
 *   import { featureFlags, isFeatureEnabled } from '@utils/features';
 *   if (featureFlags.priceListRevisions) { ... }
 *   if (isFeatureEnabled('newOrderFlow')) { ... }
 */

export type FeatureName =
  | 'priceListRevisions'
  | 'priceListTypes'
  | 'allCustomersReadOnly'
  | 'newOrderFlow'
  | 'betaDashboardWidgets'
  | 'advancedCustomerSearch'
  | 'documentsPage'
  | 'priceListPage'
  | 'vatRatesPage'
  | 'statsPage'
  | 'scanLabels';

// ── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Read a boolean env var value. Expo replaces process.env.EXPO_PUBLIC_*
 * at build time via static literal property access, so we must use
 * literal dot-notation — bracket/dynamic access is not replaced.
 */
function parseEnvBool(raw: string | undefined): boolean | null {
  if (raw === 'true') return true;
  if (raw === 'false') return false;
  return null;
}

/**
 * Resolve an env var override for a given feature name.
 *
 * Uses a switch statement with literal `process.env.EXPO_PUBLIC_*`
 * accesses so Expo's static replacement can inline the values.
 * `advancedCustomerSearch` has no env var — it is strictly dev-only.
 */
function getEnvFlag(name: FeatureName): boolean | null {
  switch (name) {
    case 'priceListRevisions':
      return parseEnvBool(process.env.EXPO_PUBLIC_FEATURE_PRICE_LIST_REVISIONS);
    case 'priceListTypes':
      return parseEnvBool(process.env.EXPO_PUBLIC_FEATURE_PRICE_LIST_TYPES);
    case 'allCustomersReadOnly':
      return parseEnvBool(process.env.EXPO_PUBLIC_FEATURE_ALL_CUSTOMERS_READ_ONLY);
    case 'newOrderFlow':
      return parseEnvBool(process.env.EXPO_PUBLIC_FEATURE_NEW_ORDER_FLOW);
    case 'betaDashboardWidgets':
      return parseEnvBool(process.env.EXPO_PUBLIC_FEATURE_BETA_DASHBOARD_WIDGETS);
    case 'advancedCustomerSearch':
      // Dev-only — no env var override
      return null;
    case 'documentsPage':
      return parseEnvBool(process.env.EXPO_PUBLIC_FEATURE_DOCUMENTS_PAGE);
    case 'priceListPage':
      return parseEnvBool(process.env.EXPO_PUBLIC_FEATURE_PRICE_LIST_PAGE);
    case 'vatRatesPage':
      return parseEnvBool(process.env.EXPO_PUBLIC_FEATURE_VAT_RATES_PAGE);
    case 'statsPage':
      return parseEnvBool(process.env.EXPO_PUBLIC_FEATURE_STATS_PAGE);
    case 'scanLabels':
      return parseEnvBool(process.env.EXPO_PUBLIC_FEATURE_SCAN_LABELS);
    default:
      return null;
  }
}

// ── Flag definitions ─────────────────────────────────────────────────────────

export const featureFlags: Record<FeatureName, boolean> = {
  // Dev-on by default — env can override
  priceListRevisions: getEnvFlag('priceListRevisions') ?? __DEV__,
  priceListTypes: getEnvFlag('priceListTypes') ?? __DEV__,
  newOrderFlow: getEnvFlag('newOrderFlow') ?? __DEV__,

  // Strict env-only (default false unless explicitly enabled)
  betaDashboardWidgets: getEnvFlag('betaDashboardWidgets') === true,

  // Hardcoded with optional env override for testing
  allCustomersReadOnly: getEnvFlag('allCustomersReadOnly') ?? true,

  // Dev-only — hardcoded, no env override
  advancedCustomerSearch: __DEV__,

  // Page-level access gates — disabled by default (including dev), enable via env var
  documentsPage: getEnvFlag('documentsPage') ?? false,
  priceListPage: getEnvFlag('priceListPage') ?? false,
  vatRatesPage: getEnvFlag('vatRatesPage') ?? false,
  statsPage: getEnvFlag('statsPage') ?? false,

  // Experimental features — dev-enabled by default
  scanLabels: getEnvFlag('scanLabels') ?? __DEV__,
};

export function isFeatureEnabled(feature: FeatureName): boolean {
  return featureFlags[feature] ?? false;
}

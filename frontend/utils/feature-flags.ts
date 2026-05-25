/**
 * Feature flags — hardcoded switches for features that are built but depend on
 * backend endpoints that are not yet implemented.
 *
 * Set a flag to `true` to enable the feature, `false` to hide it.
 */
export const FEATURE_FLAGS = {
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
} as const;

# Sonic App v2 — Implementation Checklist

_Last updated: 2026-05-26_

This document tracks the remaining work needed to bring the frontend to full coverage of the SLOMS API surface. It is derived from a full audit of the codebase against `2) SLOMS_API_Surface.md` and `1) Application_Overview.md`.

---

## Overall Status

| Domain | Endpoints Used | Endpoints Total | Coverage |
|---|---|---|---|
| Auth | 3 | 3 | ✅ 100% |
| Orders | 15 | 15 | ✅ 100% |
| Documents | 1 | 1 | ✅ 100% |
| Customers | 12 | 12 | ✅ 100% |
| Users | 12 | 12 | ✅ 100% |
| Price-List | 12 | 12 | ✅ 100% |
| Settings | 8 | 8 | ✅ 100% |
| VAT Rates | 4 | 4 | ✅ 100% |
| **TOTAL** | **67** | **67** | **✅ 100%** |

---

## Priority 1 — Critical Admin Functions

These features are necessary for the app to be usable by Admin/Manager roles.

### 1.1 User Management Screen (Full CRUD)

All management actions implemented. ✅

- [x] **Create user** — POST `/api/users`
  - Form: username, email, first name, last name, role (dropdown), password
  - Roles: Admin, Manager, Operative, ReadOnly (Customer role not assignable here per docs)
  - Show in TopBar action (Admin only)

- [x] **View user detail** — GET `/api/users/{id}`
  - Navigates from UserCard tap
  - Display all user fields: username, email, name, role, status, lockout status

- [x] **Edit user** — PUT `/api/users/{id}`
  - In-place edit of user detail screen
  - Editable fields: email, first name, last name, role
  - Restricted to Admin role

- [x] **Deactivate user** — PATCH `/api/users/{id}/deactivate`
  - Confirm modal before action
  - Updates user status badge on card
  - Admin only

- [x] **Reactivate user** — PATCH `/api/users/{id}/reactivate`
  - Shown only when user is inactive
  - Admin only

- [x] **Unlock user** — PATCH `/api/users/{id}/unlock`
  - Shown only when user is locked out
  - Admin only

- [x] **Admin password reset** — PATCH `/api/users/{id}/reset-password`
  - Triggers a forced password change on next login for the target user
  - Admin only; confirm modal required

- [x] **Delete user** — DELETE `/api/users/{id}`
  - Danger confirm modal
  - Admin only

- [x] **User audit log** — GET `/api/users/audit-log`
  - New screen or modal showing audit trail
  - Filterable by user; Admin only

---

### 1.2 Settings Screen (Edit Mode)

All settings endpoints implemented. ✅

- [x] **Edit global setting** — PUT `/api/settings/{key}`
  - Enable edit mode on settings screen (Admin only)
  - Inline edit per setting key/value

- [x] **Update setting value** — PATCH `/api/settings/{key}/value`
  - Alternative to full PUT; use for single-value updates

- [x] **Get individual setting** — GET `/api/settings/{key}`
  - Used to pre-populate edit form for a single setting

- [x] **User settings section** — GET `/api/settings/user`
  - Separate section in Settings screen (or Account screen) for per-user preferences

- [x] **Get user setting** — GET `/api/settings/user/{key}`
  - Pre-populate user setting edit form

- [x] **Upsert user setting** — PUT `/api/settings/user/{key}`
  - Save user preference

- [x] **Delete user setting** — DELETE `/api/settings/user/{key}`
  - Reset to system default

---

### 1.3 VAT Rates Management (New Screen)

All VAT functionality implemented. ✅

- [x] **Add VAT Rates screen to navigation** — Admin/Manager only
  - Add route `/vat-rates/index.tsx`
  - Add to sidebar/drawer nav

- [x] **List VAT rates** — GET `/api/vat-rates`
  - Show all historical and current rates
  - Display: rate %, effective from date, closed date (if applicable)

- [x] **View current VAT rate** — GET `/api/vat-rates/current`
  - Highlighted/pinned card at top of list

- [x] **Create VAT rate** — POST `/api/vat-rates`
  - Form: percentage, effective from date
  - Admin only

- [x] **Close VAT rate** — PATCH `/api/vat-rates/{id}/close`
  - Sets an end date on a rate
  - Confirm modal; Admin only

---

## Priority 2 — Business Operations

These are needed for day-to-day operations by Manager and Operative roles.

### 2.1 Customer Creation

- [x] **Create customer** — POST `/api/customers`
  - New screen `/customers/create.tsx`
  - Fields: account code, company name, contact name, email, phone, price band (see note: credit limit, payment terms, VAT number not in API contract)
  - TopBar action button on Customers list (Admin/Manager only)

### 2.2 Customer Lifecycle Actions

- [x] **Suspend customer** — PATCH `/api/customers/{id}/suspend`
  - Action in customer detail screen (danger zone)
  - Confirm modal required
  - Admin/Manager only

- [x] **Reinstate customer** — PATCH `/api/customers/{id}/reinstate`
  - Shown only when customer is suspended
  - Admin/Manager only

### 2.3 Customer Address Management

Addresses are currently displayed (GET list used) but cannot be created or modified.

- [x] **Add address** — POST `/api/customers/{customerId}/addresses`
  - Form: address lines, city, county, postcode, country, address type (Delivery / Billing)
  - TopBar or inline "Add" button in Addresses sub-section of customer detail

- [x] **View address detail** — GET `/api/customers/{customerId}/addresses/{addressId}`
  - Tap to expand/view individual address

- [x] **Edit address** — PUT `/api/customers/{customerId}/addresses/{addressId}`
  - In-place editing of address fields

- [x] **Delete address** — DELETE `/api/customers/{customerId}/addresses/{addressId}`
  - Confirm modal; cannot delete default address

- [x] **Set address as default** — PATCH `/api/customers/{customerId}/addresses/{addressId}/set-default`
  - Toggle/button per address card

### 2.4 Price List Management

The Price List screen lists items but offers no administrative functions.

- [x] **View price list revisions** — GET `/api/price-list/revisions`
  - New tab or section in Price List screen
  - Show all revisions: ID, created date, status (active / draft / superseded)

- [x] **View revision detail** — GET `/api/price-list/revisions/{id}`
  - Drill-down from revision list
  - Show items included in that revision

- [x] **Activate revision** — POST `/api/price-list/revisions/{id}/activate`
  - Confirm modal; Admin only
  - Replaces current active revision

- [x] **Export price list** — GET `/api/price-list/export`
  - Download/share CSV
  - Platform-aware: use `expo-file-system` + `expo-sharing` on native, direct link on web

- [x] **Import price list** — POST `/api/price-list/import`
  - File picker (`expo-document-picker`)
  - Accepts CSV; Admin only
  - Show success/error feedback via modal

- [x] **View individual price list item** — GET `/api/price-list/{itemId}`
  - Tap item in list to view full details

- [x] **View item by list name** — GET `/api/price-list/{itemId}/lists/{listName}`
  - View price for specific list type (e.g., Retail, Trade)

- [x] **List all price list types** — GET `/api/price-list/lists`
  - Used as dropdown/filter source in price list screen

- [x] **Void/delete item** — DELETE `/api/price-list/items/{itemId}`
  - Soft-delete an item from the price list
  - Admin only; confirm modal

- [x] **Delete price list type** — DELETE `/api/price-list/lists/{id}`
  - Admin only; confirm modal

---

## Priority 3 — Enhancements & Consistency

### 3.1 Order Serial Number Lookup

- [x] **Serial number lookup** — GET `/api/orders/items/{serialNumber}`
  - Endpoint exists in config but is never called
  - Add lookup feature to Order Detail or a new dedicated scan/search screen
  - Could be used for QR/barcode scanning on mobile (operative workflow)

### 3.2 API Client Consistency

Currently some domains have a dedicated `api.ts` feature module (Orders) while others use ad-hoc `apiRequest` calls inline in screens. This should be standardised.

- [x] Create `frontend/src/features/customers/api.ts`
  - Move all customer `apiRequest` calls from screen files into this module
- [x] Create `frontend/src/features/users/api.ts`
  - All user CRUD actions
- [x] Create `frontend/src/features/settings/api.ts`
  - Global and user settings calls (at `src/features/settings.ts`)
- [x] Create `frontend/src/features/price-list/api.ts`
  - All price list management calls
- [x] Create `frontend/src/features/vat-rates/api.ts`
  - All VAT rate calls
- [x] Create `frontend/src/features/documents/api.ts`
  - Move documents endpoint out of screen, add to ENDPOINTS config

### 3.3 Documents — API Documentation Gap

- [x] Clarify and document the Documents endpoint in `2) SLOMS_API_Surface.md`
  - Currently called as `/api/documents` in the frontend but absent from the API surface doc
  - Determine full documents API surface (list, download, upload?) and document it

### 3.4 `/api/users/me` Endpoint

- [x] Determine if `/api/users/me` (distinct from `/api/auth/me`) is needed
  - Currently `/api/auth/me` is used for session hydration
  - Audit whether `/api/users/me` returns different/richer data
  - If so, use it to enrich the Account screen

---

## Screens Summary

| Screen | Route | Status | Outstanding Work |
|---|---|---|---|
| Login | `/index.tsx` | ✅ Complete | — |
| Forced Password Change | `/change-password.tsx` | ✅ Complete | — |
| Dashboard | `/dashboard.tsx` | ✅ Complete | — |
| Orders List | `/orders/index.tsx` | ✅ Complete | — |
| Order Detail | `/orders/[n]/[b].tsx` | ✅ Complete | — |
| Order Tracking | `/orders/[n]/[b]/tracking.tsx` | ✅ Complete | — |
| Create Order | `/orders/create.tsx` | ✅ Complete | — |
| Create Customer | `/customers/create.tsx` | ✅ Complete | — |
| Customers List | `/customers/index.tsx` | ✅ Complete | — |
| Customer Detail | `/customers/[id].tsx` | ✅ Complete | — |
| Users List | `/users/index.tsx` | ✅ Complete | — |
| User Detail | `/users/[id].tsx` | ✅ Complete | — |
| Create User | `/users/create.tsx` | ✅ Complete | — |
| User Audit Log | `/users/audit-log.tsx` | ✅ Complete | — |
| Price List | `/price-list/index.tsx` | ✅ Complete | — |
| Settings | `/settings/index.tsx` | ❌ Incomplete | Edit mode (1.2), user settings (1.2) |
| VAT Rates | `/vat-rates/index.tsx` | ✅ Complete | — |
| Documents | `/documents/index.tsx` | ⚠️ Partial | API doc gap (3.3) |
| Account | `/account.tsx` | ✅ Complete | `/api/users/me` review (3.4) |

---

## Notes

- All Admin-only actions must be guarded with role checks (`useAuth()` → `hasRole()`)
- Confirm modals for destructive actions should use the existing `AppModal` danger variant
- New screens should follow the established file/folder pattern: `frontend/app/(app)/[domain]/[screen].tsx`
- New API feature modules should export typed response interfaces and use the shared `apiRequest` helper
- Price list import/export requires `expo-document-picker` and `expo-file-system` — check if these are already in `package.json` before implementing
